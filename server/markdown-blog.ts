import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { marked } from 'marked';

export interface MarkdownPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  htmlContent: string;
  image: string | null;
  category: string;
  author: string;
  publishedAt: string;
  featured: boolean;
  brandCode: string;
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string[] | null;
  amazonLinks: boolean;
  adsEnabled: boolean;
}

let cachedPosts: MarkdownPost[] | null = null;
let lastModified: number = 0;

function getPostsDir(): string {
  return path.join(process.cwd(), 'posts');
}

function checkForChanges(): boolean {
  const postsDir = getPostsDir();
  if (!fs.existsSync(postsDir)) return false;
  
  const stats = fs.statSync(postsDir);
  if (stats.mtimeMs > lastModified) {
    lastModified = stats.mtimeMs;
    return true;
  }
  
  const files = fs.readdirSync(postsDir).filter(f => f.endsWith('.md'));
  for (const file of files) {
    const filePath = path.join(postsDir, file);
    const fileStats = fs.statSync(filePath);
    if (fileStats.mtimeMs > lastModified) {
      lastModified = Date.now();
      return true;
    }
  }
  
  return false;
}

function loadPostsFromMarkdown(): MarkdownPost[] {
  if (cachedPosts && !checkForChanges()) {
    return cachedPosts;
  }
  
  const postsDir = getPostsDir();
  
  if (!fs.existsSync(postsDir)) {
    fs.mkdirSync(postsDir, { recursive: true });
    return [];
  }
  
  const files = fs.readdirSync(postsDir).filter(f => f.endsWith('.md'));
  const posts: MarkdownPost[] = [];
  
  for (const file of files) {
    try {
      const filePath = path.join(postsDir, file);
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const { data, content } = matter(fileContent);
      
      const slug = data.slug || file.replace('.md', '');
      const htmlContent = marked(content) as string;
      
      const excerpt = data.excerpt || 
        content.replace(/[#*`\[\]]/g, '').substring(0, 160).trim() + '...';
      
      posts.push({
        id: slug,
        slug,
        title: data.title || 'Sin título',
        excerpt,
        content,
        htmlContent,
        image: data.image || null,
        category: data.category || 'General',
        author: data.author || 'Chroma Travel',
        publishedAt: data.date || new Date().toISOString(),
        featured: data.featured || false,
        brandCode: data.brand || 'chroma',
        seoTitle: data.seoTitle || data.title || null,
        seoDescription: data.seoDescription || data.description || excerpt,
        seoKeywords: data.keywords || null,
        amazonLinks: data.amazonLinks !== false,
        adsEnabled: data.adsEnabled !== false,
      });
    } catch (error) {
      console.error(`Error parsing markdown file ${file}:`, error);
    }
  }
  
  posts.sort((a, b) => 
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
  
  cachedPosts = posts;
  return posts;
}

export function getMarkdownPosts(brandCode?: string): MarkdownPost[] {
  const posts = loadPostsFromMarkdown();
  if (brandCode) {
    return posts.filter(post => post.brandCode === brandCode);
  }
  return posts;
}

export function getMarkdownPostBySlug(slug: string): MarkdownPost | null {
  const posts = loadPostsFromMarkdown();
  return posts.find(post => post.slug === slug) || null;
}

export function getFeaturedMarkdownPosts(brandCode?: string): MarkdownPost[] {
  const posts = loadPostsFromMarkdown();
  let filtered = posts.filter(post => post.featured);
  if (brandCode) {
    filtered = filtered.filter(post => post.brandCode === brandCode);
  }
  return filtered;
}

export function getMarkdownCategories(brandCode?: string): string[] {
  const posts = getMarkdownPosts(brandCode);
  const categories = new Set(posts.map(post => post.category));
  return Array.from(categories);
}

export function clearMarkdownCache(): void {
  cachedPosts = null;
  lastModified = 0;
}

export function generateRssFeed(brandCode: string, baseUrl: string): string {
  const posts = getMarkdownPosts(brandCode);
  const brandName = brandCode === 'chroma' ? 'Chroma Travel' : 'Fenix Traveler';
  
  const items = posts.slice(0, 20).map(post => `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${baseUrl}/blog/${post.slug}</link>
      <guid isPermaLink="true">${baseUrl}/blog/${post.slug}</guid>
      <description><![CDATA[${post.excerpt}]]></description>
      <pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate>
      <category>${post.category}</category>
      ${post.image ? `<enclosure url="${post.image}" type="image/jpeg"/>` : ''}
      <author>${post.author}</author>
    </item>
  `).join('');
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${brandName} - Blog de Viajes</title>
    <link>${baseUrl}/blog</link>
    <description>Descubre los mejores destinos, consejos de viaje y ofertas exclusivas</description>
    <language>es</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`;
}
