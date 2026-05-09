import type { Express, Request, Response, NextFunction } from "express";
import { db } from "./db";
import { blogPosts, blogPostMetrics } from "@shared/schema";
import { eq, and, desc, isNull } from "drizzle-orm";
import { buildUtmUrl, generateSocialUrls, socialNetworks, generateSocialPost } from "./utm-utils";

function getDatabase() {
  if (!db) {
    throw new Error("Database not available");
  }
  return db;
}

// Webhook authentication middleware
// For production, use WEBHOOK_SECRET environment variable
function webhookAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['x-webhook-secret'] || req.headers['authorization'];
  const webhookSecret = process.env.WEBHOOK_SECRET;
  
  // If no secret configured, allow in development only
  if (!webhookSecret) {
    if (process.env.NODE_ENV === 'development') {
      return next();
    }
    return res.status(401).json({ error: "Webhook secret not configured" });
  }
  
  if (!authHeader || authHeader !== `Bearer ${webhookSecret}`) {
    return res.status(401).json({ error: "Invalid webhook authentication" });
  }
  
  next();
}

// Webhook endpoint for Metricool/Zapier integration
export function registerAutomationRoutes(app: Express) {
  
  // Get posts ready for social automation (pending status, not yet published to social)
  app.get("/api/automation/pending-posts", async (req: Request, res: Response) => {
    try {
      const brand = req.brand;
      if (!brand) {
        return res.status(404).json({ error: "Brand not found" });
      }

      // Brand-scoped query - only get posts for this brand
      const brandFilter = brand.id 
        ? eq(blogPosts.brandId, brand.id)
        : isNull(blogPosts.brandId);
        
      const posts = await getDatabase()
        .select()
        .from(blogPosts)
        .where(
          and(
            brandFilter,
            eq(blogPosts.published, true),
            eq(blogPosts.automationStatus, 'pending')
          )
        )
        .orderBy(desc(blogPosts.publishedAt))
        .limit(10);

      const baseUrl = `https://${brand.domain}`;
      
      const enrichedPosts = posts.map(post => {
        const postUrl = `${baseUrl}/blog/${post.slug}`;
        const socialUrls = generateSocialUrls(postUrl, brand.code, post.slug);
        
        return {
          id: post.id,
          title: post.title,
          excerpt: post.socialExcerpt || post.excerpt,
          url: postUrl,
          image: post.featuredImageWebp || post.image,
          imageAlt: post.featuredImageAlt,
          hashtags: post.hashtags || [],
          category: post.category,
          publishedAt: post.publishedAt,
          socialUrls,
          // Pre-formatted posts for each network
          socialPosts: {
            facebook: generateSocialPost(
              post.title,
              post.socialExcerpt || post.excerpt || '',
              socialUrls.facebook,
              post.hashtags || [],
              'facebook'
            ),
            twitter: generateSocialPost(
              post.title,
              post.socialExcerpt || post.excerpt || '',
              socialUrls.twitter,
              post.hashtags || [],
              'twitter'
            ),
            instagram: generateSocialPost(
              post.title,
              post.socialExcerpt || post.excerpt || '',
              socialUrls.instagram,
              post.hashtags || [],
              'instagram'
            ),
            linkedin: generateSocialPost(
              post.title,
              post.socialExcerpt || post.excerpt || '',
              socialUrls.linkedin,
              post.hashtags || [],
              'linkedin'
            )
          }
        };
      });

      res.json({
        brand: brand.code,
        domain: brand.domain,
        count: enrichedPosts.length,
        posts: enrichedPosts
      });
    } catch (error) {
      console.error("Error fetching pending posts:", error);
      res.status(500).json({ error: "Error fetching pending posts" });
    }
  });

  // Webhook: Mark post as scheduled/published to social
  app.post("/api/automation/webhook/scheduled", webhookAuth, async (req: Request, res: Response) => {
    try {
      const brand = req.brand;
      if (!brand) {
        return res.status(404).json({ error: "Brand not found" });
      }
      
      const { postId, network, scheduledAt } = req.body;

      if (!postId || !network) {
        return res.status(400).json({ error: "postId and network are required" });
      }

      // Verify post belongs to this brand
      const post = await getDatabase()
        .select()
        .from(blogPosts)
        .where(eq(blogPosts.id, postId))
        .limit(1);
        
      if (post.length === 0 || post[0].brandId !== brand.id) {
        return res.status(403).json({ error: "Post not found or does not belong to this brand" });
      }

      // Update post automation status (brand-scoped)
      await getDatabase()
        .update(blogPosts)
        .set({ 
          automationStatus: 'scheduled',
          utmCampaign: `${brand.code}-blog-${new Date().getFullYear()}`
        })
        .where(and(eq(blogPosts.id, postId), eq(blogPosts.brandId, brand.id)));

      // Create metric entry for tracking
      await getDatabase().insert(blogPostMetrics).values({
        blogPostId: postId,
        brandId: req.brand?.id || null,
        network,
        clicks: 0,
        leads: 0,
        conversions: 0,
        revenue: "0"
      });

      res.json({ 
        success: true, 
        message: `Post ${postId} scheduled for ${network}`,
        scheduledAt 
      });
    } catch (error) {
      console.error("Error in scheduled webhook:", error);
      res.status(500).json({ error: "Error processing webhook" });
    }
  });

  // Webhook: Post was published to social media
  app.post("/api/automation/webhook/published", webhookAuth, async (req: Request, res: Response) => {
    try {
      const brand = req.brand;
      if (!brand) {
        return res.status(404).json({ error: "Brand not found" });
      }
      
      const { postId, network, publishedAt, externalPostId, externalUrl } = req.body;

      if (!postId || !network) {
        return res.status(400).json({ error: "postId and network are required" });
      }

      // Verify post belongs to this brand
      const post = await getDatabase()
        .select()
        .from(blogPosts)
        .where(eq(blogPosts.id, postId))
        .limit(1);
        
      if (post.length === 0 || post[0].brandId !== brand.id) {
        return res.status(403).json({ error: "Post not found or does not belong to this brand" });
      }

      // Update post status (brand-scoped)
      await getDatabase()
        .update(blogPosts)
        .set({ 
          automationStatus: 'published',
          lastPublishedToSocial: new Date(publishedAt || Date.now())
        })
        .where(and(eq(blogPosts.id, postId), eq(blogPosts.brandId, brand.id)));

      res.json({ 
        success: true, 
        message: `Post ${postId} published to ${network}`,
        externalPostId,
        externalUrl
      });
    } catch (error) {
      console.error("Error in published webhook:", error);
      res.status(500).json({ error: "Error processing webhook" });
    }
  });

  // Track social media click (called when user lands with UTM params)
  app.post("/api/automation/track-click", async (req: Request, res: Response) => {
    try {
      const { postSlug, utmSource, utmCampaign, utmContent } = req.body;

      if (!utmSource || !utmCampaign) {
        return res.status(400).json({ error: "UTM parameters required" });
      }

      // Find the post
      const posts = await getDatabase()
        .select()
        .from(blogPosts)
        .where(eq(blogPosts.slug, postSlug || utmContent))
        .limit(1);

      if (posts.length === 0) {
        // Still track the click even if post not found
        console.log(`Click tracked for unknown post: ${utmSource}/${utmCampaign}`);
        return res.json({ success: true, tracked: 'generic' });
      }

      const post = posts[0];

      // Find existing metric or create new
      const existingMetrics = await getDatabase()
        .select()
        .from(blogPostMetrics)
        .where(
          and(
            eq(blogPostMetrics.blogPostId, post.id),
            eq(blogPostMetrics.network, utmSource)
          )
        )
        .limit(1);

      if (existingMetrics.length > 0) {
        // Increment clicks
        await getDatabase()
          .update(blogPostMetrics)
          .set({ 
            clicks: (existingMetrics[0].clicks || 0) + 1
          })
          .where(eq(blogPostMetrics.id, existingMetrics[0].id));
      } else {
        // Create new metric entry
        await getDatabase().insert(blogPostMetrics).values({
          blogPostId: post.id,
          brandId: req.brand?.id || null,
          network: utmSource,
          clicks: 1,
          leads: 0,
          conversions: 0,
          revenue: "0"
        });
      }

      res.json({ success: true, postId: post.id });
    } catch (error) {
      console.error("Error tracking click:", error);
      res.status(500).json({ error: "Error tracking click" });
    }
  });

  // Track conversion (lead or booking from social)
  app.post("/api/automation/track-conversion", async (req: Request, res: Response) => {
    try {
      const { postId, network, conversionType, value } = req.body;

      if (!postId || !network) {
        return res.status(400).json({ error: "postId and network required" });
      }

      // Find existing metric
      const existingMetrics = await getDatabase()
        .select()
        .from(blogPostMetrics)
        .where(
          and(
            eq(blogPostMetrics.blogPostId, postId),
            eq(blogPostMetrics.network, network)
          )
        )
        .limit(1);

      if (existingMetrics.length > 0) {
        const current = existingMetrics[0];
        const updateData: any = {};
        
        if (conversionType === 'lead') {
          updateData.leads = (current.leads || 0) + 1;
        } else {
          updateData.conversions = (current.conversions || 0) + 1;
          updateData.revenue = String(parseFloat(current.revenue || "0") + parseFloat(value || "0"));
        }
        
        await getDatabase()
          .update(blogPostMetrics)
          .set(updateData)
          .where(eq(blogPostMetrics.id, current.id));
      }

      res.json({ success: true, conversionType });
    } catch (error) {
      console.error("Error tracking conversion:", error);
      res.status(500).json({ error: "Error tracking conversion" });
    }
  });

  // Get social metrics for a post
  app.get("/api/automation/metrics/:postId", async (req: Request, res: Response) => {
    try {
      const { postId } = req.params;

      const metrics = await getDatabase()
        .select()
        .from(blogPostMetrics)
        .where(eq(blogPostMetrics.blogPostId, postId));

      // Calculate totals
      const totals = metrics.reduce((acc, m) => ({
        clicks: acc.clicks + (m.clicks || 0),
        leads: acc.leads + (m.leads || 0),
        conversions: acc.conversions + (m.conversions || 0),
        revenue: acc.revenue + parseFloat(m.revenue || "0")
      }), { clicks: 0, leads: 0, conversions: 0, revenue: 0 });

      res.json({
        postId,
        byNetwork: metrics,
        totals,
        conversionRate: totals.clicks > 0 ? (totals.conversions / totals.clicks * 100).toFixed(2) + '%' : '0%',
        leadRate: totals.clicks > 0 ? (totals.leads / totals.clicks * 100).toFixed(2) + '%' : '0%'
      });
    } catch (error) {
      console.error("Error fetching metrics:", error);
      res.status(500).json({ error: "Error fetching metrics" });
    }
  });

  // Posts ready for recycling (recycle automation for evergreen content)
  app.get("/api/automation/recyclable-posts", async (req: Request, res: Response) => {
    try {
      const brand = req.brand;
      if (!brand) {
        return res.status(404).json({ error: "Brand not found" });
      }

      const now = new Date();
      
      // Brand-scoped query
      const brandFilter = brand.id 
        ? eq(blogPosts.brandId, brand.id)
        : isNull(blogPosts.brandId);
      
      // Get posts where recycleAt is in the past
      const posts = await getDatabase()
        .select()
        .from(blogPosts)
        .where(
          and(
            brandFilter,
            eq(blogPosts.published, true),
            eq(blogPosts.automationStatus, 'published')
          )
        )
        .orderBy(blogPosts.recycleAt)
        .limit(20);

      // Filter posts ready for recycling
      const recyclablePosts = posts.filter(post => {
        if (!post.recycleAt) return false;
        return new Date(post.recycleAt) <= now;
      });

      const baseUrl = `https://${brand.domain}`;
      
      const enrichedPosts = recyclablePosts.map(post => ({
        id: post.id,
        title: post.title,
        excerpt: post.socialExcerpt || post.excerpt,
        url: `${baseUrl}/blog/${post.slug}`,
        image: post.featuredImageWebp || post.image,
        hashtags: post.hashtags || [],
        lastPublishedAt: post.lastPublishedToSocial,
        recycleAt: post.recycleAt
      }));

      res.json({
        brand: brand.code,
        count: enrichedPosts.length,
        posts: enrichedPosts
      });
    } catch (error) {
      console.error("Error fetching recyclable posts:", error);
      res.status(500).json({ error: "Error fetching recyclable posts" });
    }
  });

  // Mark post as recycled (reset for next cycle)
  app.post("/api/automation/recycle/:postId", webhookAuth, async (req: Request, res: Response) => {
    try {
      const brand = req.brand;
      if (!brand) {
        return res.status(404).json({ error: "Brand not found" });
      }
      
      const { postId } = req.params;
      const { nextRecycleInDays = 30 } = req.body;

      // Verify post belongs to this brand
      const post = await getDatabase()
        .select()
        .from(blogPosts)
        .where(eq(blogPosts.id, postId))
        .limit(1);
        
      if (post.length === 0 || post[0].brandId !== brand.id) {
        return res.status(403).json({ error: "Post not found or does not belong to this brand" });
      }

      const nextRecycle = new Date();
      nextRecycle.setDate(nextRecycle.getDate() + nextRecycleInDays);

      await getDatabase()
        .update(blogPosts)
        .set({ 
          automationStatus: 'pending',
          recycleAt: nextRecycle,
          lastPublishedToSocial: null
        })
        .where(and(eq(blogPosts.id, postId), eq(blogPosts.brandId, brand.id)));

      res.json({ 
        success: true, 
        postId,
        nextRecycleAt: nextRecycle.toISOString()
      });
    } catch (error) {
      console.error("Error recycling post:", error);
      res.status(500).json({ error: "Error recycling post" });
    }
  });
  
  // Generate UTM URLs for a post (useful for manual sharing)
  app.get("/api/automation/utm-urls/:postSlug", async (req: Request, res: Response) => {
    try {
      const brand = req.brand;
      if (!brand) {
        return res.status(404).json({ error: "Brand not found" });
      }
      
      const { postSlug } = req.params;
      const baseUrl = `https://${brand.domain}/blog/${postSlug}`;
      
      const urls = generateSocialUrls(baseUrl, brand.code, postSlug);
      
      res.json({
        postSlug,
        baseUrl,
        utmUrls: urls,
        networks: Object.keys(socialNetworks).map(key => ({
          code: key,
          name: socialNetworks[key].name,
          charLimit: socialNetworks[key].charLimit,
          hashtagLimit: socialNetworks[key].hashtagLimit
        }))
      });
    } catch (error) {
      console.error("Error generating UTM URLs:", error);
      res.status(500).json({ error: "Error generating UTM URLs" });
    }
  });
}
