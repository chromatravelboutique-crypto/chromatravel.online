import { Users, Maximize, Wifi, Coffee, Bath, Tv } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Room, Rate } from "@shared/schema";
import roomFallback from "@assets/generated_images/luxury_hotel_room_interior.png";

interface RoomCardProps {
  room: Room;
  rates: Rate[];
  onSelectRate: (rateId: string) => void;
  selectedRateId?: string;
}

const amenityIcons: Record<string, typeof Wifi> = {
  wifi: Wifi,
  breakfast: Coffee,
  bathroom: Bath,
  tv: Tv,
};

export function RoomCard({ room, rates, onSelectRate, selectedRateId }: RoomCardProps) {
  const lowestRate = rates.reduce((min, rate) => 
    Number(rate.price) < Number(min.price) ? rate : min
  , rates[0]);

  return (
    <Card className="overflow-hidden" data-testid={`card-room-${room.id}`}>
      <div className="flex flex-col md:flex-row">
        <div className="relative aspect-[4/3] w-full overflow-hidden md:w-64 lg:w-72">
          <img
            src={room.images?.[0] || roomFallback}
            alt={room.name}
            className="h-full w-full object-cover"
          />
        </div>
        
        <div className="flex flex-1 flex-col p-4 md:p-6">
          <div className="mb-4">
            <h3 className="font-display text-lg font-semibold">{room.name}</h3>
            
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>Hasta {room.maxOccupancy} huéspedes</span>
              </div>
              {room.size && (
                <div className="flex items-center gap-1">
                  <Maximize className="h-4 w-4" />
                  <span>{room.size} m²</span>
                </div>
              )}
              {room.bedType && (
                <Badge variant="outline">{room.bedType}</Badge>
              )}
            </div>

            {room.description && (
              <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
                {room.description}
              </p>
            )}

            {room.amenities && room.amenities.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {room.amenities.slice(0, 5).map((amenity) => {
                  const Icon = amenityIcons[amenity.toLowerCase()] || Wifi;
                  return (
                    <Badge key={amenity} variant="secondary" className="text-xs">
                      <Icon className="mr-1 h-3 w-3" />
                      {amenity}
                    </Badge>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-auto space-y-3">
            {rates.map((rate) => (
              <div
                key={rate.id}
                className={`flex flex-wrap items-center justify-between gap-4 rounded-lg border p-3 transition-colors ${
                  selectedRateId === rate.id
                    ? "border-primary bg-primary/5"
                    : "border-border"
                }`}
              >
                <div className="flex-1">
                  <p className="font-medium">{rate.name}</p>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    {rate.mealPlan && (
                      <Badge variant="outline" className="text-xs">
                        {rate.mealPlan}
                      </Badge>
                    )}
                    {rate.refundable && (
                      <Badge variant="outline" className="text-xs text-green-600">
                        Reembolsable
                      </Badge>
                    )}
                    {!rate.refundable && (
                      <Badge variant="outline" className="text-xs text-orange-600">
                        No reembolsable
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    {rate.originalPrice && Number(rate.originalPrice) > Number(rate.price) && (
                      <p className="text-sm text-muted-foreground line-through">
                        ${Number(rate.originalPrice).toLocaleString()}
                      </p>
                    )}
                    <p className="font-display text-lg font-bold">
                      ${Number(rate.price).toLocaleString()}
                      <span className="text-sm font-normal text-muted-foreground">
                        {" "}{rate.currency || "USD"}
                      </span>
                    </p>
                  </div>
                  <Button
                    variant={selectedRateId === rate.id ? "default" : "outline"}
                    onClick={() => onSelectRate(rate.id)}
                    data-testid={`button-select-rate-${rate.id}`}
                  >
                    {selectedRateId === rate.id ? "Seleccionada" : "Seleccionar"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
