import { Link } from "wouter";
import { MapPin, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface DestinationCardProps {
  id: string;
  name: string;
  country: string;
  image: string;
  lgbtScore: number;
  shortDescription?: string;
}

export function DestinationCard({
  id,
  name,
  country,
  image,
  lgbtScore,
  shortDescription,
}: DestinationCardProps) {
  return (
    <Link href={`/destinations/${id}`}>
      <article
        className="group relative overflow-hidden rounded-xl hover-elevate active-elevate-2"
        data-testid={`card-destination-${id}`}
      >
        <div className="aspect-[4/3] overflow-hidden">
          <img
            src={image}
            alt={`${name}, ${country}`}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
          <div className="mb-2 flex items-center gap-2">
            <Badge variant="secondary" className="bg-white/20 text-white backdrop-blur-sm">
              <Star className="mr-1 h-3 w-3 fill-current text-yellow-400" />
              {lgbtScore}/10 LGBT-Friendly
            </Badge>
          </div>
          <h3 className="font-display text-xl font-semibold text-white md:text-2xl">
            {name}
          </h3>
          <div className="flex items-center gap-1 text-white/80">
            <MapPin className="h-4 w-4" />
            <span className="text-sm">{country}</span>
          </div>
          {shortDescription && (
            <p className="mt-2 line-clamp-2 text-sm text-white/70">
              {shortDescription}
            </p>
          )}
        </div>
      </article>
    </Link>
  );
}
