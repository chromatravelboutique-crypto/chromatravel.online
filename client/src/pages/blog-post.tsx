import { Link, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Calendar, Clock, Share2, Tag, Loader2 } from "lucide-react";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { SEOHead } from "@/components/seo-head";
import { ArticleSchema } from "@/components/schema-json-ld";
import { trackBlogRead, trackSocialShare } from "@/lib/analytics";
import { InArticleAd, AfterContentAd } from "@/components/adsense-ad";
import { BlogImage } from "@/components/blog-image";

import blogIdeasData from "../../../src/data/blog-ideas.json";

interface BlogPost {
  id: number;
  category: string;
  title: string;
  seoTitle: string;
  metaDescription: string;
  keyword: string;
  intent: string;
  slug: string;
  wordcount: number;
  ogImage: string;
  internalLinks: string[];
  cta: string;
  publishPriority: string;
  target: string[];
  seasonality: string;
  estimatedPriceRange: string;
  imagePrompt: string;
}

const blogPosts = blogIdeasData as BlogPost[];

function estimateReadTime(wordcount: number): number {
  return Math.ceil(wordcount / 200);
}

function getCategoryColor(category: string): string {
  switch (category) {
    case "Landing-driven":
      return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
    case "Authority/Guides":
      return "bg-purple-500/10 text-purple-600 dark:text-purple-400";
    case "Niche/Long-form":
      return "bg-amber-500/10 text-amber-600 dark:text-amber-400";
    default:
      return "bg-primary/10 text-primary";
  }
}

function getCategoryLabel(category: string): string {
  switch (category) {
    case "Landing-driven":
      return "Experiencias VIP";
    case "Authority/Guides":
      return "Guías";
    case "Niche/Long-form":
      return "Lifestyle";
    default:
      return category;
  }
}

interface ApiPost {
  id: string;
  slug: string;
  title: string;
  excerpt?: string;
  content?: string;
  htmlContent?: string;
  image?: string;
  category: string;
  author?: string;
  publishedAt?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
}

export default function BlogPost() {
  const params = useParams<{ slug: string }>();
  
  const { data: apiPost, isLoading } = useQuery<ApiPost>({
    queryKey: ['/api/blog', params.slug],
    enabled: !!params.slug,
  });

  const staticPost = blogPosts.find((p) => p.slug === params.slug);
  const post = apiPost || staticPost;

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navigation />
        <main className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navigation />
        <main className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <h1 className="font-display text-3xl font-bold">
              Artículo no encontrado
            </h1>
            <p className="mt-4 text-muted-foreground">
              El artículo que buscas no existe o ha sido movido.
            </p>
            <Link href="/blog">
              <Button className="mt-6" data-testid="button-back-to-blog">
                Volver al blog
              </Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const postTitle = (post as ApiPost).seoTitle || post.title;
  const postDescription = (post as ApiPost).seoDescription || (post as ApiPost).excerpt || (post as BlogPost).metaDescription || '';
  const postImage = (post as ApiPost).image || (post as BlogPost).ogImage;
  const postAuthor = (post as ApiPost).author || 'Chroma Travel';
  const postDate = (post as ApiPost).publishedAt || new Date().toISOString();
  const postKeywords = (post as ApiPost).seoKeywords || [(post as BlogPost).keyword].filter(Boolean);

  const relatedPosts = blogPosts
    .filter((p) => p.category === post.category && p.id !== post.id)
    .slice(0, 3);

  const currentIndex = blogPosts.findIndex((p) => p.id === post.id);
  const prevPost = currentIndex > 0 ? blogPosts[currentIndex - 1] : null;
  const nextPost =
    currentIndex < blogPosts.length - 1 ? blogPosts[currentIndex + 1] : null;

  const handleShare = (platform: string) => {
    trackSocialShare(platform, 'blog_post');
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(post.title);
    
    const shareUrls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?url=${url}&text=${text}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      whatsapp: `https://wa.me/?text=${text}%20${url}`,
    };
    
    if (shareUrls[platform]) {
      window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    }
  };

  trackBlogRead(post.slug, post.category);

  return (
    <div className="flex min-h-screen flex-col">
      <SEOHead 
        title={postTitle}
        description={postDescription}
        type="article"
        image={postImage}
      />
      <ArticleSchema
        title={postTitle}
        description={postDescription}
        image={postImage}
        author={postAuthor}
        publishedAt={postDate}
        slug={post.slug}
        keywords={postKeywords as string[]}
      />
      <Navigation />
      <main className="flex-1">
        <article>
          <header className="bg-muted/30 py-12 md:py-20">
            <div className="mx-auto max-w-4xl px-4 md:px-8">
              <Link href="/blog">
                <Button
                  variant="ghost"
                  size="sm"
                  className="mb-6 gap-2"
                  data-testid="button-back"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Volver al blog
                </Button>
              </Link>

              <Badge className={getCategoryColor(post.category)}>
                {getCategoryLabel(post.category)}
              </Badge>

              <h1 className="mt-4 font-display text-3xl font-bold md:text-4xl lg:text-5xl">
                {post.title}
              </h1>

              <p className="mt-4 text-lg text-muted-foreground">
                {postDescription}
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  {estimateReadTime((staticPost?.wordcount) || 1000)} min de lectura
                </span>
                {postDate && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    {new Date(postDate).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                )}
                {staticPost?.keyword && (
                  <span className="flex items-center gap-1.5">
                    <Tag className="h-4 w-4" />
                    {staticPost.keyword}
                  </span>
                )}
              </div>

              {staticPost?.target && staticPost.target.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-2">
                  {staticPost.target.map((t: string) => (
                    <Badge key={t} variant="secondary">
                      {t}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </header>

          <div className="mx-auto max-w-4xl px-4 py-12 md:px-8 md:py-16">
            <div className="relative aspect-[16/9] overflow-hidden rounded-lg">
              <BlogImage
                src={postImage}
                fallbackSlug={post.slug}
                alt={post.title}
                className="h-full w-full object-cover"
              />
            </div>

            <InArticleAd />

            {apiPost?.htmlContent ? (
              <div 
                className="prose prose-lg dark:prose-invert mt-12 max-w-none"
                dangerouslySetInnerHTML={{ __html: apiPost.htmlContent }}
              />
            ) : (
              <div className="prose prose-lg dark:prose-invert mt-12 max-w-none">
                <p className="lead">
                  {postDescription}
                </p>

                <h2>Sobre este viaje</h2>
                <p>
                  Este artículo te guiará a través de una experiencia única diseñada 
                  específicamente para viajeros LGBT+ que buscan {staticPost?.target?.join(", ") || 'aventuras únicas'}.
                  Con un enfoque en {staticPost?.keyword || 'viajes inclusivos'}, te ayudaremos a planificar tu viaje 
                  perfecto.
                </p>

                {staticPost?.estimatedPriceRange && staticPost.estimatedPriceRange !== "N/A" && staticPost.estimatedPriceRange !== "Variable" && (
                  <>
                    <h2>Inversión estimada</h2>
                    <p>
                      Para esta experiencia, el rango de inversión típico es de{" "}
                      <strong>{staticPost.estimatedPriceRange}</strong>. Este precio puede variar 
                      según la temporada, el tipo de alojamiento y las experiencias adicionales 
                      que elijas.
                    </p>
                  </>
                )}

                {staticPost?.seasonality && (
                  <>
                    <h2>Mejor época para viajar</h2>
                    <p>
                      La temporada ideal para este destino es: <strong>{staticPost.seasonality}</strong>. 
                      Te recomendamos planificar con anticipación para asegurar disponibilidad 
                      en los mejores hoteles y experiencias.
                    </p>
                  </>
                )}

                <h2>Por qué elegir chromaTravel</h2>
                <ul>
                  <li>Asesoría personalizada con expertos en viajes LGBT+</li>
                  <li>Hoteles verificados como gay-friendly</li>
                  <li>Experiencias exclusivas y seguras</li>
                  <li>Soporte 24/7 durante tu viaje</li>
                  <li>Comunidad de viajeros que comparten tus valores</li>
                </ul>

                <blockquote>
                  "Viajar con libertad significa poder ser tú mismo en cada destino. 
                  En chromaTravel nos aseguramos de que cada experiencia sea segura, 
                  inclusiva y memorable."
                </blockquote>
              </div>
            )}

            <AfterContentAd />

            <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t pt-8">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleShare('whatsapp')}
                  data-testid="button-share"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">Compartir</span>
              </div>

              <Link href="/contact">
                <Button size="lg" className="gap-2" data-testid="button-cta-post">
                  {staticPost?.cta || 'Planifica tu viaje'}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </article>

        <section className="border-t bg-muted/30 py-12 md:py-16">
          <div className="mx-auto max-w-7xl px-4 md:px-8">
            <div className="flex items-center justify-between mb-8">
              {prevPost ? (
                <Link href={`/blog/${prevPost.slug}`}>
                  <Button variant="outline" className="gap-2" data-testid="button-prev-post">
                    <ArrowLeft className="h-4 w-4" />
                    <span className="hidden sm:inline">Anterior</span>
                  </Button>
                </Link>
              ) : (
                <div />
              )}
              {nextPost ? (
                <Link href={`/blog/${nextPost.slug}`}>
                  <Button variant="outline" className="gap-2" data-testid="button-next-post">
                    <span className="hidden sm:inline">Siguiente</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              ) : (
                <div />
              )}
            </div>

            {relatedPosts.length > 0 && (
              <>
                <h2 className="font-display text-2xl font-bold mb-6">
                  Artículos relacionados
                </h2>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {relatedPosts.map((relatedPost) => (
                    <Link key={relatedPost.id} href={`/blog/${relatedPost.slug}`}>
                      <Card className="h-full hover-elevate" data-testid={`card-related-${relatedPost.id}`}>
                        <CardContent className="p-5">
                          <Badge className={getCategoryColor(relatedPost.category)}>
                            {getCategoryLabel(relatedPost.category)}
                          </Badge>
                          <h3 className="mt-3 font-display text-lg font-semibold">
                            {relatedPost.title}
                          </h3>
                          <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                            {relatedPost.metaDescription}
                          </p>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
