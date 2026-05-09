import fs from 'fs';
import path from 'path';

export interface StaticBlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  image: string | null;
  category: string;
  author: string;
  publishedAt: string;
  featured: boolean;
  brandCode: string;
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string[] | null;
}

let cachedPosts: StaticBlogPost[] | null = null;

function loadPostsFromFile(): StaticBlogPost[] {
  if (cachedPosts) return cachedPosts;
  
  try {
    const filePath = path.join(process.cwd(), 'server', 'content', 'blog', 'posts.json');
    const data = fs.readFileSync(filePath, 'utf-8');
    cachedPosts = JSON.parse(data);
    return cachedPosts!;
  } catch (error) {
    console.error('Error loading static blog posts:', error);
    return [];
  }
}

export function getStaticBlogPosts(brandCode?: string): StaticBlogPost[] {
  const posts = loadPostsFromFile();
  if (brandCode) {
    return posts.filter(post => post.brandCode === brandCode);
  }
  return posts;
}

export function getStaticBlogPostBySlug(slug: string): StaticBlogPost | null {
  const posts = loadPostsFromFile();
  return posts.find(post => post.slug === slug) || null;
}

export function getFeaturedStaticPosts(brandCode?: string): StaticBlogPost[] {
  const posts = loadPostsFromFile();
  let filtered = posts.filter(post => post.featured);
  if (brandCode) {
    filtered = filtered.filter(post => post.brandCode === brandCode);
  }
  return filtered;
}

export function getStaticCategories(brandCode?: string): string[] {
  const posts = getStaticBlogPosts(brandCode);
  const categories = new Set(posts.map(post => post.category));
  return Array.from(categories);
}

export function clearBlogCache(): void {
  cachedPosts = null;
}
