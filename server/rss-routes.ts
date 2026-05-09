import type { Express, Request, Response } from "express";
import { db } from "./db";
import { blogPosts, users } from "@shared/schema";
import { eq, and, desc, or, isNull } from "drizzle-orm";

// Generate RSS 2.0 feed with media extensions
function generateRssFeed(
  brand: any,
  posts: Array<{
    title: string;
    slug: string;
    excerpt: string | null;
    socialExcerpt: string | null;
    content: string;
    image: string | null;
    featuredImageWebp: string | null;
    featuredImageAlt: string | null;
    hashtags: string[] | null;
    publishedAt: Date | null;
    authorName: string;
    category: string | null;
  }>
) {
  const baseUrl = `https://${brand.domain}`;
  const feedUrl = `${baseUrl}/blog/feed.xml`;
  const now = new Date().toUTCString();

  const items = posts.map(post => {
    const postUrl = `${baseUrl}/blog/${post.slug}`;
    const imageUrl = post.featuredImageWebp || post.image;
    const description = post.socialExcerpt || post.excerpt || post.content.substring(0, 300);
    const pubDate = post.publishedAt ? new Date(post.publishedAt).toUTCString() : now;
    
    // Build hashtags meta
    const hashtagsMeta = post.hashtags?.length 
      ? `<category>${post.hashtags.join('</category><category>')}</category>`
      : '';

    return `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${postUrl}</link>
      <guid isPermaLink="true">${postUrl}</guid>
      <pubDate>${pubDate}</pubDate>
      <description><![CDATA[${description}]]></description>
      <dc:creator><![CDATA[${post.authorName}]]></dc:creator>
      ${post.category ? `<category><![CDATA[${post.category}]]></category>` : ''}
      ${hashtagsMeta}
      ${imageUrl ? `
      <media:content url="${imageUrl.startsWith('http') ? imageUrl : baseUrl + imageUrl}" medium="image" type="image/webp">
        <media:title type="plain">${post.featuredImageAlt || post.title}</media:title>
      </media:content>
      <enclosure url="${imageUrl.startsWith('http') ? imageUrl : baseUrl + imageUrl}" type="image/webp" />
      ` : ''}
    </item>`;
  }).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" 
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:media="http://search.yahoo.com/mrss/"
  xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title><![CDATA[${brand.name} - Blog de Viajes]]></title>
    <link>${baseUrl}/blog</link>
    <description><![CDATA[${brand.seoDescription || brand.description || 'Blog de viajes'}]]></description>
    <language>es-MX</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${feedUrl}" rel="self" type="application/rss+xml"/>
    <image>
      <url>${brand.logoUrl ? baseUrl + brand.logoUrl : baseUrl + '/favicon.ico'}</url>
      <title><![CDATA[${brand.name}]]></title>
      <link>${baseUrl}</link>
    </image>
    <copyright>Copyright ${new Date().getFullYear()} ${brand.name}</copyright>
    <managingEditor>${brand.email} (${brand.name})</managingEditor>
    <webMaster>${brand.email} (${brand.name})</webMaster>
    <ttl>60</ttl>
    ${items}
  </channel>
</rss>`;
}

// Generate Atom feed as alternative
function generateAtomFeed(
  brand: any,
  posts: Array<{
    title: string;
    slug: string;
    excerpt: string | null;
    socialExcerpt: string | null;
    content: string;
    image: string | null;
    featuredImageWebp: string | null;
    publishedAt: Date | null;
    authorName: string;
  }>
) {
  const baseUrl = `https://${brand.domain}`;
  const feedUrl = `${baseUrl}/blog/atom.xml`;
  const now = new Date().toISOString();

  const entries = posts.map(post => {
    const postUrl = `${baseUrl}/blog/${post.slug}`;
    const imageUrl = post.featuredImageWebp || post.image;
    const summary = post.socialExcerpt || post.excerpt || post.content.substring(0, 300);
    const updated = post.publishedAt ? new Date(post.publishedAt).toISOString() : now;

    return `
    <entry>
      <title><![CDATA[${post.title}]]></title>
      <link href="${postUrl}" rel="alternate" type="text/html"/>
      <id>${postUrl}</id>
      <updated>${updated}</updated>
      <published>${updated}</published>
      <summary type="html"><![CDATA[${summary}]]></summary>
      <author>
        <name>${post.authorName}</name>
      </author>
      ${imageUrl ? `<link rel="enclosure" href="${imageUrl.startsWith('http') ? imageUrl : baseUrl + imageUrl}" type="image/webp"/>` : ''}
    </entry>`;
  }).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title><![CDATA[${brand.name} - Blog de Viajes]]></title>
  <link href="${baseUrl}/blog" rel="alternate"/>
  <link href="${feedUrl}" rel="self" type="application/atom+xml"/>
  <id>${baseUrl}/blog</id>
  <updated>${now}</updated>
  <subtitle><![CDATA[${brand.seoDescription || brand.description || 'Blog de viajes'}]]></subtitle>
  <rights>Copyright ${new Date().getFullYear()} ${brand.name}</rights>
  ${entries}
</feed>`;
}

export function registerRssRoutes(app: Express) {
  // RSS 2.0 Feed - with Markdown fallback
  app.get("/blog/feed.xml", async (req: Request, res: Response) => {
    try {
      const brand = req.brand;
      if (!brand) {
        return res.status(404).send("Brand not found");
      }

      const baseUrl = `https://${brand.domain}`;
      let formattedPosts: any[] = [];

      // First try markdown posts
      try {
        const { getMarkdownPosts } = await import("./markdown-blog");
        const mdPosts = getMarkdownPosts(brand.code);
        
        if (mdPosts && mdPosts.length > 0) {
          formattedPosts = mdPosts.map(p => ({
            title: p.title,
            slug: p.slug,
            excerpt: p.excerpt,
            socialExcerpt: p.excerpt,
            content: p.content,
            image: p.image,
            featuredImageWebp: p.image,
            featuredImageAlt: p.title,
            hashtags: p.seoKeywords,
            publishedAt: new Date(p.publishedAt),
            category: p.category,
            authorName: p.author
          }));
        }
      } catch (mdError) {
        console.log("Markdown posts not available, trying database");
      }

      // If no markdown posts, try database
      if (formattedPosts.length === 0 && db) {
        try {
          const brandFilter = and(
            eq(blogPosts.published, true),
            or(
              eq(blogPosts.brandId, brand.id),
              isNull(blogPosts.brandId)
            )
          );

          const posts = await db
            .select({
              title: blogPosts.title,
              slug: blogPosts.slug,
              excerpt: blogPosts.excerpt,
              socialExcerpt: blogPosts.socialExcerpt,
              content: blogPosts.content,
              image: blogPosts.image,
              featuredImageWebp: blogPosts.featuredImageWebp,
              featuredImageAlt: blogPosts.featuredImageAlt,
              hashtags: blogPosts.hashtags,
              publishedAt: blogPosts.publishedAt,
              category: blogPosts.category,
              authorFirstName: users.firstName,
              authorLastName: users.lastName,
            })
            .from(blogPosts)
            .leftJoin(users, eq(blogPosts.authorId, users.id))
            .where(brandFilter)
            .orderBy(desc(blogPosts.publishedAt))
            .limit(50);

          formattedPosts = posts.map(p => ({
            ...p,
            authorName: p.authorFirstName && p.authorLastName 
              ? `${p.authorFirstName} ${p.authorLastName}`
              : brand.name
          }));
        } catch (dbError) {
          console.log("Database unavailable for RSS, trying static fallback");
        }
      }
      
      // Final fallback: static JSON posts
      if (formattedPosts.length === 0) {
        try {
          const { getStaticBlogPosts } = await import("./static-blog");
          const staticPosts = getStaticBlogPosts(brand.code);
          formattedPosts = staticPosts.map(p => ({
            title: p.title,
            slug: p.slug,
            excerpt: p.excerpt,
            socialExcerpt: p.excerpt,
            content: p.content,
            image: p.image,
            featuredImageWebp: p.image,
            featuredImageAlt: p.title,
            hashtags: p.seoKeywords,
            publishedAt: new Date(p.publishedAt),
            category: p.category,
            authorName: p.author
          }));
        } catch (staticError) {
          console.log("Static posts also unavailable");
        }
      }

      const feed = generateRssFeed(brand, formattedPosts);
      
      res.set("Content-Type", "application/rss+xml; charset=utf-8");
      res.set("Cache-Control", "public, max-age=300");
      res.send(feed);
    } catch (error) {
      console.error("Error generating RSS feed:", error);
      res.status(500).send("Error generating RSS feed");
    }
  });
  
  // Simple /feed.xml at root
  app.get("/feed.xml", async (req: Request, res: Response) => {
    const brand = req.brand;
    if (!brand) {
      return res.status(404).send("Brand not found");
    }
    
    const baseUrl = `https://${brand.domain}`;
    
    try {
      const { getMarkdownPosts, generateRssFeed: genMdRss } = await import("./markdown-blog");
      const mdPosts = getMarkdownPosts(brand.code);
      
      if (mdPosts && mdPosts.length > 0) {
        const feed = genMdRss(brand.code, baseUrl);
        res.set("Content-Type", "application/rss+xml; charset=utf-8");
        res.set("Cache-Control", "public, max-age=300");
        return res.send(feed);
      }
    } catch (e) {
      console.log("Markdown RSS failed, redirecting to blog feed");
    }
    
    res.redirect("/blog/feed.xml");
  });

  // Alternative: Atom Feed - with markdown/db/static fallback
  app.get("/blog/atom.xml", async (req: Request, res: Response) => {
    try {
      const brand = req.brand;
      if (!brand) {
        return res.status(404).send("Brand not found");
      }

      let formattedPosts: any[] = [];

      // First try markdown
      try {
        const { getMarkdownPosts } = await import("./markdown-blog");
        const mdPosts = getMarkdownPosts(brand.code);
        if (mdPosts && mdPosts.length > 0) {
          formattedPosts = mdPosts.map(p => ({
            title: p.title,
            slug: p.slug,
            excerpt: p.excerpt,
            socialExcerpt: p.excerpt,
            content: p.content,
            image: p.image,
            featuredImageWebp: p.image,
            publishedAt: new Date(p.publishedAt),
            authorName: p.author
          }));
        }
      } catch (mdError) {
        console.log("Markdown posts not available for Atom");
      }

      // Then try database
      if (formattedPosts.length === 0 && db) {
        try {
          const brandFilter = and(
            eq(blogPosts.published, true),
            or(
              eq(blogPosts.brandId, brand.id),
              isNull(blogPosts.brandId)
            )
          );

          const posts = await db
            .select({
              title: blogPosts.title,
              slug: blogPosts.slug,
              excerpt: blogPosts.excerpt,
              socialExcerpt: blogPosts.socialExcerpt,
              content: blogPosts.content,
              image: blogPosts.image,
              featuredImageWebp: blogPosts.featuredImageWebp,
              publishedAt: blogPosts.publishedAt,
              authorFirstName: users.firstName,
              authorLastName: users.lastName,
            })
            .from(blogPosts)
            .leftJoin(users, eq(blogPosts.authorId, users.id))
            .where(brandFilter)
            .orderBy(desc(blogPosts.publishedAt))
            .limit(50);

          formattedPosts = posts.map(p => ({
            ...p,
            authorName: p.authorFirstName && p.authorLastName 
              ? `${p.authorFirstName} ${p.authorLastName}`
              : brand.name
          }));
        } catch (dbError) {
          console.log("Database unavailable for Atom");
        }
      }

      // Finally try static
      if (formattedPosts.length === 0) {
        try {
          const { getStaticBlogPosts } = await import("./static-blog");
          const staticPosts = getStaticBlogPosts(brand.code);
          formattedPosts = staticPosts.map(p => ({
            title: p.title,
            slug: p.slug,
            excerpt: p.excerpt,
            socialExcerpt: p.excerpt,
            content: p.content,
            image: p.image,
            featuredImageWebp: p.image,
            publishedAt: new Date(p.publishedAt),
            authorName: p.author
          }));
        } catch (staticError) {
          console.log("Static posts also unavailable for Atom");
        }
      }

      const feed = generateAtomFeed(brand, formattedPosts);
      
      res.set("Content-Type", "application/atom+xml; charset=utf-8");
      res.set("Cache-Control", "public, max-age=300");
      res.send(feed);
    } catch (error) {
      console.error("Error generating Atom feed:", error);
      res.status(500).send("Error generating Atom feed");
    }
  });

  // JSON Feed (for modern aggregators) - with markdown/db/static fallback
  app.get("/blog/feed.json", async (req: Request, res: Response) => {
    try {
      const brand = req.brand;
      if (!brand) {
        return res.status(404).json({ error: "Brand not found" });
      }

      const baseUrl = `https://${brand.domain}`;
      let posts: any[] = [];

      // First try markdown
      try {
        const { getMarkdownPosts } = await import("./markdown-blog");
        const mdPosts = getMarkdownPosts(brand.code);
        if (mdPosts && mdPosts.length > 0) {
          posts = mdPosts.map(p => ({
            title: p.title,
            slug: p.slug,
            excerpt: p.excerpt,
            socialExcerpt: p.excerpt,
            content: p.content,
            image: p.image,
            featuredImageWebp: p.image,
            hashtags: p.seoKeywords,
            publishedAt: new Date(p.publishedAt),
            authorName: p.author
          }));
        }
      } catch (mdError) {
        console.log("Markdown posts not available for JSON feed");
      }

      // Then try database
      if (posts.length === 0 && db) {
        try {
          const brandFilter = and(
            eq(blogPosts.published, true),
            or(
              eq(blogPosts.brandId, brand.id),
              isNull(blogPosts.brandId)
            )
          );

          const dbPosts = await db
            .select({
              title: blogPosts.title,
              slug: blogPosts.slug,
              excerpt: blogPosts.excerpt,
              socialExcerpt: blogPosts.socialExcerpt,
              content: blogPosts.content,
              image: blogPosts.image,
              featuredImageWebp: blogPosts.featuredImageWebp,
              hashtags: blogPosts.hashtags,
              publishedAt: blogPosts.publishedAt,
              authorFirstName: users.firstName,
              authorLastName: users.lastName,
            })
            .from(blogPosts)
            .leftJoin(users, eq(blogPosts.authorId, users.id))
            .where(brandFilter)
            .orderBy(desc(blogPosts.publishedAt))
            .limit(50);

          posts = dbPosts.map(p => ({
            ...p,
            authorName: p.authorFirstName && p.authorLastName 
              ? `${p.authorFirstName} ${p.authorLastName}`
              : brand.name
          }));
        } catch (dbError) {
          console.log("Database unavailable for JSON feed");
        }
      }

      // Finally try static
      if (posts.length === 0) {
        try {
          const { getStaticBlogPosts } = await import("./static-blog");
          const staticPosts = getStaticBlogPosts(brand.code);
          posts = staticPosts.map(p => ({
            title: p.title,
            slug: p.slug,
            excerpt: p.excerpt,
            socialExcerpt: p.excerpt,
            content: p.content,
            image: p.image,
            featuredImageWebp: p.image,
            hashtags: p.seoKeywords,
            publishedAt: new Date(p.publishedAt),
            authorName: p.author
          }));
        } catch (staticError) {
          console.log("Static posts also unavailable for JSON feed");
        }
      }

      const jsonFeed = {
        version: "https://jsonfeed.org/version/1.1",
        title: `${brand.name} - Blog de Viajes`,
        home_page_url: `${baseUrl}/blog`,
        feed_url: `${baseUrl}/blog/feed.json`,
        description: brand.seoDescription || brand.description,
        icon: brand.logoUrl ? `${baseUrl}${brand.logoUrl}` : undefined,
        favicon: `${baseUrl}/favicon.ico`,
        language: "es-MX",
        items: posts.map(post => ({
          id: `${baseUrl}/blog/${post.slug}`,
          url: `${baseUrl}/blog/${post.slug}`,
          title: post.title,
          content_text: post.socialExcerpt || post.excerpt || post.content?.substring(0, 300),
          date_published: post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined,
          image: post.featuredImageWebp || post.image 
            ? `${(post.featuredImageWebp || post.image)?.startsWith('http') ? '' : baseUrl}${post.featuredImageWebp || post.image}`
            : undefined,
          tags: post.hashtags?.map((h: string) => h.replace('#', '')) || [],
          authors: [{
            name: post.authorName || brand.name
          }]
        }))
      };

      res.set("Cache-Control", "public, max-age=300");
      res.json(jsonFeed);
    } catch (error) {
      console.error("Error generating JSON feed:", error);
      res.status(500).json({ error: "Error generating JSON feed" });
    }
  });
}
