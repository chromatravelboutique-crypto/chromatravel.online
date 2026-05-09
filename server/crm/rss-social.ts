import Parser from 'rss-parser';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

interface FeedConfig {
  url: string;
  facebookPageId: string;
  facebookToken: string;
  empresa: string;
  hashtags: string[];
  emoji: string;
}

interface ArticleData {
  id: string;
  titulo: string;
  url: string;
  resumen: string;
  fechaPublicacion: string;
  autor: string;
  imagenUrl: string | null;
  tags: string[];
}

interface TrackingData {
  fenix: string[];
  chroma: string[];
}

const FEEDS: Record<string, FeedConfig> = {
  fenix: {
    url: process.env.RSS_FENIX_URL || 'https://fenixtraveler.com/blog/feed',
    facebookPageId: process.env.FACEBOOK_FENIX_PAGE_ID || '',
    facebookToken: process.env.FACEBOOK_FENIX_ACCESS_TOKEN || '',
    empresa: 'Fenix Traveler',
    hashtags: ['#FenixTraveler', '#ViajesPremium', '#Aventura', '#TravelMexico'],
    emoji: ''
  },
  chroma: {
    url: process.env.RSS_CHROMA_URL || 'https://chromatravel.online/destinos/feed',
    facebookPageId: process.env.FACEBOOK_CHROMA_PAGE_ID || '',
    facebookToken: process.env.FACEBOOK_CHROMA_ACCESS_TOKEN || '',
    empresa: 'Chroma Travel',
    hashtags: ['#ChromaTravel', '#LGBTTravel', '#TravelPride', '#LGBTQ'],
    emoji: ''
  }
};

const TRACKING_FILE = './rss_tracking.json';

function loadTracking(): TrackingData {
  try {
    if (fs.existsSync(TRACKING_FILE)) {
      return JSON.parse(fs.readFileSync(TRACKING_FILE, 'utf-8'));
    }
  } catch (error) {
    console.error('Error loading tracking:', error);
  }
  return { fenix: [], chroma: [] };
}

function saveTracking(data: TrackingData): void {
  fs.writeFileSync(TRACKING_FILE, JSON.stringify(data, null, 2));
}

function generateArticleId(url: string): string {
  return crypto.createHash('md5').update(url).digest('hex');
}

export async function readFeed(empresa: 'fenix' | 'chroma'): Promise<ArticleData[]> {
  const parser = new Parser();
  const config = FEEDS[empresa];
  
  try {
    const feed = await parser.parseURL(config.url);
    
    return feed.items.map(item => ({
      id: generateArticleId(item.link || ''),
      titulo: item.title || '',
      url: item.link || '',
      resumen: item.contentSnippet || item.content || '',
      fechaPublicacion: item.pubDate || '',
      autor: item.creator || config.empresa,
      imagenUrl: item.enclosure?.url || null,
      tags: []
    }));
  } catch (error) {
    console.error(`Error reading feed for ${empresa}:`, error);
    return [];
  }
}

export async function detectNewArticles(empresa: 'fenix' | 'chroma'): Promise<ArticleData[]> {
  const tracking = loadTracking();
  const articles = await readFeed(empresa);
  
  const newArticles = articles.filter(article => 
    !tracking[empresa].includes(article.id)
  );
  
  return newArticles;
}

export async function publishToFacebook(article: ArticleData, empresa: 'fenix' | 'chroma'): Promise<boolean> {
  const config = FEEDS[empresa];
  
  if (!config.facebookPageId || !config.facebookToken) {
    console.log(`Facebook not configured for ${empresa}`);
    return false;
  }
  
  const prefix = config.empresa === 'Fenix Traveler' ? '[NEW]' : '[NUEVO]';
  const message = `${prefix} ${article.titulo}\n\n${article.resumen.substring(0, 200)}...\n\n${config.hashtags.join(' ')}\n\n${article.url}`;
  
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${config.facebookPageId}/feed`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          link: article.url,
          access_token: config.facebookToken
        })
      }
    );
    
    if (response.ok) {
      const tracking = loadTracking();
      tracking[empresa].push(article.id);
      saveTracking(tracking);
      console.log(`✓ Published to Facebook: ${article.titulo}`);
      return true;
    }
    
    console.error('Facebook publish failed:', await response.text());
    return false;
  } catch (error) {
    console.error('Error publishing to Facebook:', error);
    return false;
  }
}

export async function checkAndPublishNewContent(): Promise<{ fenix: number; chroma: number }> {
  const results = { fenix: 0, chroma: 0 };
  
  for (const empresa of ['fenix', 'chroma'] as const) {
    const newArticles = await detectNewArticles(empresa);
    
    for (const article of newArticles) {
      const success = await publishToFacebook(article, empresa);
      if (success) results[empresa]++;
    }
  }
  
  return results;
}

export function generateSocialButtons(url: string, titulo: string): string {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(titulo);
  
  return `
    <div class="social-buttons" style="display: flex; gap: 10px; margin: 20px 0;">
      <a href="https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}" target="_blank" rel="noopener" style="background: #1877f2; color: white; padding: 10px 15px; border-radius: 5px; text-decoration: none;">
        Compartir en Facebook
      </a>
      <a href="https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}" target="_blank" rel="noopener" style="background: #1da1f2; color: white; padding: 10px 15px; border-radius: 5px; text-decoration: none;">
        Compartir en Twitter
      </a>
      <a href="https://wa.me/?text=${encodedTitle}%20${encodedUrl}" target="_blank" rel="noopener" style="background: #25d366; color: white; padding: 10px 15px; border-radius: 5px; text-decoration: none;">
        Compartir en WhatsApp
      </a>
    </div>
  `;
}

export function getMetricoolConfig() {
  return {
    apiKey: process.env.METRICOOL_API_KEY || '',
    apiUrl: 'https://api.metricool.com/v1',
    enabled: process.env.METRICOOL_ENABLED === 'true'
  };
}
