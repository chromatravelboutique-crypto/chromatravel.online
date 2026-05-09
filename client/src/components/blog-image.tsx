import { useState } from "react";
import { getBlogImage } from "@/lib/blog-images";
import { Plane } from "lucide-react";

interface BlogImageProps {
  src?: string | null;
  fallbackSlug?: string;
  alt: string;
  className?: string;
  loading?: "lazy" | "eager";
}

export function BlogImage({ src, fallbackSlug, alt, className = "", loading }: BlogImageProps) {
  const [hasError, setHasError] = useState(false);
  
  const imageSrc = src || (fallbackSlug ? getBlogImage(fallbackSlug) : undefined);
  
  if (!imageSrc || hasError) {
    return (
      <div className={`bg-gradient-to-br from-emerald-500/20 via-purple-500/20 to-pink-500/20 flex items-center justify-center ${className}`}>
        <Plane className="h-12 w-12 text-muted-foreground/40" />
      </div>
    );
  }
  
  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      loading={loading}
      onError={() => setHasError(true)}
    />
  );
}
