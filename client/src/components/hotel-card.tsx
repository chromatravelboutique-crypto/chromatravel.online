import { Link } from "wouter";
import { MapPin, Star, Heart, Shield, Wifi, Coffee, Car } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Hotel } from "@shared/schema";
import hotelFallback from "@assets/generated_images/luxury_boutique_hotel_dusk.png";

interface HotelCardProps {
  hotel: Hotel;
  variant?: "grid" | "list";
}

const amenityIcons: Record<string, typeof Wifi> = {
  wifi: Wifi,
  breakfast: Coffee,
  parking: Car,
};

export function HotelCard({ hotel, variant = "list" }: HotelCardProps) {
  const isGrid = variant === "grid";

  return (
    <Link href={`/hotels/${hotel.id}`}>
      <Card
        className={`group overflow-hidden hover-elevate active-elevate-2 ${
          isGrid ? "" : "flex flex-col md:flex-row"
        }`}
        data-testid={`card-hotel-${hotel.id}`}
      >
        <div
          className={`relative overflow-hidden ${
            isGrid ? "aspect-[4/3]" : "aspect-[4/3] md:aspect-auto md:w-72 lg:w-80"
          }`}
        >
          <img
            src={hotel.thumbnail || hotel.images?.[0] || hotelFallback}
            alt={hotel.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {hotel.lgbtCertified && (
            <div className="absolute left-3 top-3">
              <Badge className="gap-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                <Shield className="h-3 w-3" />
                LGBT+ Verificado
              </Badge>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-3 top-3 bg-white/80 backdrop-blur-sm"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            data-testid={`button-favorite-${hotel.id}`}
          >
            <Heart className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex flex-1 flex-col p-4 md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="flex-1">
              <div className="mb-1 flex items-center gap-2">
                <div className="flex">
                  {Array.from({ length: hotel.starRating || 4 }).map((_, i) => (
                    <Star
                      key={i}
                      className="h-4 w-4 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>
                {hotel.lgbtFriendlyLevel && hotel.lgbtFriendlyLevel >= 3 && (
                  <Badge variant="outline" className="text-xs">
                    Nivel {hotel.lgbtFriendlyLevel} LGBT+
                  </Badge>
                )}
              </div>
              <h3 className="font-display text-lg font-semibold md:text-xl">
                {hotel.name}
              </h3>
              <div className="mt-1 flex items-center gap-1 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span className="text-sm">
                  {hotel.city}, {hotel.country}
                </span>
              </div>
            </div>
          </div>

          {hotel.shortDescription && (
            <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
              {hotel.shortDescription}
            </p>
          )}

          {hotel.amenities && hotel.amenities.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {hotel.amenities.slice(0, 4).map((amenity) => {
                const Icon = amenityIcons[amenity.toLowerCase()] || Wifi;
                return (
                  <Badge key={amenity} variant="secondary" className="text-xs">
                    <Icon className="mr-1 h-3 w-3" />
                    {amenity}
                  </Badge>
                );
              })}
              {hotel.amenities.length > 4 && (
                <Badge variant="secondary" className="text-xs">
                  +{hotel.amenities.length - 4} más
                </Badge>
              )}
            </div>
          )}

          <div className="mt-auto flex flex-wrap items-end justify-between gap-4 pt-4">
            <div>
              {hotel.minPrice && (
                <div className="flex items-baseline gap-1">
                  <span className="font-display text-2xl font-bold">
                    ${Number(hotel.minPrice).toLocaleString()}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {hotel.currency || "USD"} / noche
                  </span>
                </div>
              )}
            </div>
            <Button data-testid={`button-view-hotel-${hotel.id}`}>
              Ver detalles
            </Button>
          </div>
        </div>
      </Card>
    </Link>
  );
}
