import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Calendar, Clock, Search, Tag, Loader2 } from "lucide-react";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AffiliateGallery } from "@/components/affiliate-gallery";
import { SEOHead } from "@/components/seo-head";
import { TravelAgencySchema } from "@/components/schema-json-ld";
import { BlogImage } from "@/components/blog-image";

import blogIdeasData from "../../../src/data/blog-ideas.json";

interface BlogPost {
  id: number | string;
  category: string;
  title: string;
  seoTitle?: string;
  seoDescription?: string;
  metaDescription?: string;
  excerpt?: string;
  keyword?: string;
  intent?: string;
  slug: string;
  wordcount?: number;
  ogImage?: string;
  image?: string;
  internalLinks?: string[];
  cta?: string;
  publishPriority?: string;
  target?: string[];
  seasonality?: string;
  estimatedPriceRange?: string;
  imagePrompt?: string;
  featured?: boolean;
  author?: string;
  publishedAt?: string;
  content?: string;
}

const staticBlogPosts = blogIdeasData as BlogPost[];

const categories = [
  { id: "all", label: "Todos" },
  { id: "Landing-driven", label: "Experiencias VIP" },
  { id: "Authority/Guides", label: "Guías y Consejos" },
  { id: "Niche/Long-form", label: "Lifestyle" },
];

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

export default function Blog() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: apiBlogPosts, isLoading } = useQuery<BlogPost[]>({
    queryKey: ['/api/blog'],
  });

  const blogPosts = apiBlogPosts && apiBlogPosts.length > 0 
    ? apiBlogPosts 
    : staticBlogPosts;

  const filteredPosts = blogPosts.filter((post) => {
    const matchesCategory =
      selectedCategory === "all" || post.category === selectedCategory;
    const searchText = (
      post.title + ' ' + 
      (post.metaDescription || post.excerpt || '') + ' ' + 
      (post.keyword || '')
    ).toLowerCase();
    const matchesSearch = searchText.includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const featuredPost = blogPosts.find((p) => p.publishPriority === "alta" || p.featured);

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

  return (
    <div className="flex min-h-screen flex-col">
      <SEOHead 
        title="Blog de Viajes LGBT+ - Destinos Destacados, Guías y Consejos" 
        description="Explora nuestro blog de viajes LGBT+ con artículos sobre destinos gay-friendly, guías de viaje seguro, hoteles inclusivos y experiencias Pride. Contenido actualizado para viajeros LGBT+."
        canonical="/blog"
        type="website"
        keywords={["viajes LGBT", "destinos gay friendly", "turismo inclusivo", "blog viajes", "guías viaje LGBT"]}
      />
      <TravelAgencySchema />
      <Navigation />
      <main className="flex-1">
        <section className="bg-muted/30 py-16 md:py-24">
          <div className="mx-auto max-w-7xl px-4 text-center md:px-8">
            <Badge className="mb-4" variant="secondary">
              Destinos Destacados
            </Badge>
            <h1 className="font-display text-3xl font-bold md:text-4xl lg:text-5xl">
              Destinos Destacados para Viajeros LGBT+
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              Descubre los mejores destinos del mundo, guías de viaje y experiencias exclusivas.
              Planifica tu próxima aventura con recomendaciones de expertos.
            </p>
          </div>
        </section>

        <section className="py-8 md:py-12">
          <div className="mx-auto max-w-7xl px-4 md:px-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                {categories.map((cat) => (
                  <Button
                    key={cat.id}
                    variant={selectedCategory === cat.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(cat.id)}
                    data-testid={`button-category-${cat.id}`}
                  >
                    {cat.label}
                  </Button>
                ))}
              </div>
              <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar artículos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  data-testid="input-blog-search"
                />
              </div>
            </div>
          </div>
        </section>

        {featuredPost && selectedCategory === "all" && !searchQuery && (
          <section className="pb-8 md:pb-12">
            <div className="mx-auto max-w-7xl px-4 md:px-8">
              <h2 className="mb-6 font-display text-2xl font-bold">
                Artículo destacado
              </h2>
              <Card className="overflow-hidden">
                <div className="grid md:grid-cols-2">
                  <div className="relative aspect-[16/10] md:aspect-auto overflow-hidden">
                    <BlogImage
                      src={featuredPost.image || featuredPost.ogImage}
                      fallbackSlug={featuredPost.slug}
                      alt={featuredPost.title}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-4 left-4">
                      <Badge className={getCategoryColor(featuredPost.category)}>
                        {getCategoryLabel(featuredPost.category)}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="flex flex-col justify-center p-6 md:p-8 lg:p-12">
                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {estimateReadTime(featuredPost.wordcount || 1000)} min lectura
                      </span>
                      <span className="flex items-center gap-1">
                        <Tag className="h-4 w-4" />
                        {featuredPost.keyword}
                      </span>
                    </div>
                    <h3 className="mt-3 font-display text-2xl font-bold md:text-3xl">
                      {featuredPost.title}
                    </h3>
                    <p className="mt-4 text-muted-foreground">
                      {featuredPost.metaDescription}
                    </p>
                    {featuredPost.target && featuredPost.target.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {featuredPost.target.map((t) => (
                          <Badge key={t} variant="secondary" className="text-xs">
                            {t}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <div className="mt-6">
                      <Link href={`/blog/${featuredPost.slug}`}>
                        <Button className="gap-2" data-testid="button-read-featured">
                          Leer artículo
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </div>
              </Card>
            </div>
          </section>
        )}

        <section className="pb-16 md:pb-24">
          <div className="mx-auto max-w-7xl px-4 md:px-8">
            <h2 className="mb-6 font-display text-2xl font-bold">
              {selectedCategory === "all"
                ? "Todos los artículos"
                : categories.find((c) => c.id === selectedCategory)?.label}
              <span className="ml-2 text-base font-normal text-muted-foreground">
                ({filteredPosts.length})
              </span>
            </h2>

            {filteredPosts.length === 0 ? (
              <Card className="p-12 text-center">
                <p className="text-muted-foreground">
                  No se encontraron artículos con ese criterio de búsqueda.
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("all");
                  }}
                  data-testid="button-clear-filters"
                >
                  Limpiar filtros
                </Button>
              </Card>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredPosts.map((post) => (
                  <Link key={post.id} href={`/blog/${post.slug}`}>
                    <Card
                      className="group h-full overflow-hidden transition-all hover-elevate"
                      data-testid={`card-blog-${post.id}`}
                    >
                      <div className="relative aspect-[16/10] overflow-hidden">
                        <BlogImage
                          src={post.image || post.ogImage}
                          fallbackSlug={post.slug}
                          alt={post.title}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                        <div className="absolute left-3 top-3">
                          <Badge className={getCategoryColor(post.category)}>
                            {getCategoryLabel(post.category)}
                          </Badge>
                        </div>
                        <div className="absolute bottom-3 right-3">
                          <Badge variant="secondary" className="text-xs">
                            {post.seasonality}
                          </Badge>
                        </div>
                      </div>
                      <CardContent className="p-5">
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {estimateReadTime(post.wordcount || 1000)} min
                          </span>
                          {post.estimatedPriceRange !== "N/A" &&
                            post.estimatedPriceRange !== "Variable" && (
                              <span>{post.estimatedPriceRange}</span>
                            )}
                        </div>
                        <h3 className="mt-2 font-display text-lg font-semibold leading-snug group-hover:text-primary transition-colors">
                          {post.title}
                        </h3>
                        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                          {post.metaDescription}
                        </p>
                        {post.target && post.target.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1">
                            {post.target.slice(0, 2).map((t) => (
                              <Badge
                                key={t}
                                variant="outline"
                                className="text-xs"
                              >
                                {t}
                              </Badge>
                            ))}
                          </div>
                        )}
                        <div className="mt-4 flex items-center text-sm font-medium text-primary">
                          <span>Leer más</span>
                          <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="py-8 md:py-12">
          <div className="mx-auto max-w-7xl px-4 md:px-8">
            <AffiliateGallery limit={4} />
          </div>
        </section>

        <section className="border-t bg-muted/30 py-16">
          <div className="mx-auto max-w-3xl px-4 text-center md:px-8">
            <h2 className="font-display text-2xl font-bold md:text-3xl">
              ¿Listo para tu próxima aventura?
            </h2>
            <p className="mt-4 text-muted-foreground">
              Nuestros asesores especializados te ayudarán a planificar el viaje
              perfecto, seguro e inolvidable.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href="/contact">
                <Button size="lg" data-testid="button-contact-blog">
                  Hablar con un asesor
                </Button>
              </Link>
              <Link href="/destinations">
                <Button variant="outline" size="lg" data-testid="button-destinations-blog">
                  Explorar destinos
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
