import { useState, useEffect } from "react";
import { ExternalLink, Heart, ShoppingCart, Star, Info, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface AffiliateProduct {
  id: string;
  title: string;
  description: string;
  price: string;
  category: string;
  asin: string;
  imageUrl: string;
  affiliateLink: string;
  searchLink: string;
  featured: boolean;
}

interface AffiliateGalleryProps {
  limit?: number;
  showTitle?: boolean;
  category?: string;
}

const AFFILIATE_TAG = import.meta.env.VITE_AMAZON_AFFILIATE_TAG || "";

function ensureAffiliateTag(url: string): string {
  if (!AFFILIATE_TAG) return url;
  try {
    const urlObj = new URL(url);
    urlObj.searchParams.set("tag", AFFILIATE_TAG);
    return urlObj.toString();
  } catch {
    return url;
  }
}

export function AffiliateGallery({ limit, showTitle = true, category }: AffiliateGalleryProps) {
  const [products, setProducts] = useState<AffiliateProduct[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [hasConsent, setHasConsent] = useState<boolean>(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    setHasConsent(consent === "true");

    if (consent !== "true") {
      return;
    }

    const loadProducts = async () => {
      try {
        const response = await fetch("/api/affiliate-products");
        if (response.ok) {
          const data = await response.json();
          setProducts(data);
        }
      } catch (error) {
        console.log("Unable to load products");
      }
    };
    loadProducts();

    const savedFavorites = localStorage.getItem("affiliate-favorites");
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
  }, []);

  const toggleFavorite = (productId: string) => {
    const newFavorites = favorites.includes(productId)
      ? favorites.filter(id => id !== productId)
      : [...favorites, productId];
    setFavorites(newFavorites);
    localStorage.setItem("affiliate-favorites", JSON.stringify(newFavorites));
  };

  const handleAffiliateClick = (product: AffiliateProduct) => {
    console.log(`[Affiliate Click] Product: ${product.title}, ASIN: ${product.asin}, Tag: ${AFFILIATE_TAG}`);
  };

  let displayProducts = products;
  
  if (category) {
    displayProducts = displayProducts.filter(p => p.category === category);
  }
  
  if (limit) {
    displayProducts = displayProducts.slice(0, limit);
  }

  if (!hasConsent) {
    return (
      <section className="py-8">
        <Card className="p-6 text-center">
          <Lock className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
          <h3 className="font-display text-lg font-semibold mb-2">
            Productos Recomendados
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Acepta cookies para ver productos recomendados de Amazon
          </p>
          <Button 
            size="sm" 
            onClick={() => {
              localStorage.setItem("cookie-consent", "true");
              setHasConsent(true);
              window.location.reload();
            }}
            data-testid="button-accept-cookies-inline"
          >
            Aceptar Cookies
          </Button>
        </Card>
      </section>
    );
  }

  if (displayProducts.length === 0) {
    return null;
  }

  return (
    <section className="py-8">
      {showTitle && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            <h2 className="font-display text-xl font-bold">
              Recomendados para Viajeros
            </h2>
            <Badge variant="outline" className="text-xs">
              Afiliado
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <Info className="h-3 w-3" />
            Compras con afiliado ayudan a mantener Chroma Travel
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {displayProducts.map((product) => (
          <Card 
            key={product.id} 
            className="group overflow-hidden hover-elevate"
            data-testid={`card-affiliate-${product.id}`}
          >
            <div className="relative aspect-square bg-muted">
              <img
                src={product.imageUrl}
                alt={product.title}
                className="h-full w-full object-contain p-4"
                loading="lazy"
              />
              <button
                onClick={() => toggleFavorite(product.id)}
                className="absolute right-2 top-2 rounded-full bg-background/80 p-2 backdrop-blur transition-colors hover:bg-background"
                data-testid={`button-favorite-${product.id}`}
              >
                <Heart 
                  className={`h-4 w-4 ${favorites.includes(product.id) ? "fill-red-500 text-red-500" : "text-muted-foreground"}`} 
                />
              </button>
              {product.featured && (
                <Badge className="absolute left-2 top-2 bg-primary text-primary-foreground">
                  <Star className="mr-1 h-3 w-3" />
                  Destacado
                </Badge>
              )}
            </div>
            <CardContent className="p-4">
              <Badge variant="secondary" className="mb-2 text-xs">
                {product.category}
              </Badge>
              <h3 className="font-medium leading-snug line-clamp-2 mb-1">
                {product.title}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                {product.description}
              </p>
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-primary">
                  {product.price}
                </span>
                <a
                  href={ensureAffiliateTag(product.affiliateLink)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => handleAffiliateClick(product)}
                >
                  <Button size="sm" className="gap-1" data-testid={`button-buy-${product.id}`}>
                    Comprar
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="mt-4 text-xs text-muted-foreground text-center">
        Como Afiliado de Amazon (fenixtra-20), ganamos comisiones por compras elegibles.{" "}
        <a 
          href="https://www.amazon.com/gp/help/customer/display.html?nodeId=508088" 
          target="_blank" 
          rel="noopener noreferrer"
          className="underline hover:text-foreground"
        >
          Política de afiliados
        </a>
      </p>
    </section>
  );
}

export function AffiliateProductsSidebar({ limit = 4 }: { limit?: number }) {
  return (
    <aside className="space-y-4">
      <h3 className="font-display text-lg font-semibold flex items-center gap-2">
        <ShoppingCart className="h-4 w-4" />
        Productos Recomendados
      </h3>
      <AffiliateGallery limit={limit} showTitle={false} />
    </aside>
  );
}
