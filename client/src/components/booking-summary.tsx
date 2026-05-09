import { Calendar, Users, MapPin, Shield, CreditCard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";
import hotelFallback from "@assets/generated_images/luxury_boutique_hotel_dusk.png";

interface BookingSummaryProps {
  hotel: {
    name: string;
    city: string;
    country: string;
    thumbnail?: string;
    lgbtCertified?: boolean;
  };
  room: {
    name: string;
  };
  rate: {
    name: string;
    price: string | number;
    currency?: string;
    mealPlan?: string;
  };
  checkIn: Date;
  checkOut: Date;
  guests: number;
  className?: string;
}

export function BookingSummary({
  hotel,
  room,
  rate,
  checkIn,
  checkOut,
  guests,
  className = "",
}: BookingSummaryProps) {
  const nights = differenceInDays(checkOut, checkIn);
  const subtotal = Number(rate.price) * nights;
  const taxes = subtotal * 0.16;
  const total = subtotal + taxes;

  return (
    <Card className={`sticky top-24 ${className}`}>
      <CardHeader className="pb-4">
        <CardTitle className="font-display text-lg">Resumen de reserva</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4">
          <div className="h-20 w-20 overflow-hidden rounded-lg">
            <img
              src={hotel.thumbnail || hotelFallback}
              alt={hotel.name}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="flex-1">
            <h4 className="font-medium">{hotel.name}</h4>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span>{hotel.city}, {hotel.country}</span>
            </div>
            {hotel.lgbtCertified && (
              <Badge className="mt-2 gap-1 text-xs">
                <Shield className="h-3 w-3" />
                LGBT+ Verificado
              </Badge>
            )}
          </div>
        </div>

        <Separator />

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-medium">
                {format(checkIn, "EEE, d MMM", { locale: es })} -{" "}
                {format(checkOut, "EEE, d MMM", { locale: es })}
              </p>
              <p className="text-muted-foreground">
                {nights} {nights === 1 ? "noche" : "noches"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <p>{guests} {guests === 1 ? "huésped" : "huéspedes"}</p>
          </div>
        </div>

        <Separator />

        <div className="space-y-1 text-sm">
          <p className="font-medium">{room.name}</p>
          <p className="text-muted-foreground">{rate.name}</p>
          {rate.mealPlan && (
            <Badge variant="outline" className="text-xs">
              {rate.mealPlan}
            </Badge>
          )}
        </div>

        <Separator />

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              ${Number(rate.price).toLocaleString()} x {nights} noches
            </span>
            <span>${subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Impuestos y cargos</span>
            <span>${taxes.toLocaleString()}</span>
          </div>
        </div>

        <Separator />

        <div className="flex justify-between text-lg font-semibold">
          <span>Total</span>
          <span>
            ${total.toLocaleString()}{" "}
            <span className="text-sm font-normal text-muted-foreground">
              {rate.currency || "USD"}
            </span>
          </span>
        </div>

        <div className="flex items-center gap-2 rounded-lg bg-muted p-3 text-xs text-muted-foreground">
          <CreditCard className="h-4 w-4 shrink-0" />
          <span>Pago seguro con encriptación SSL</span>
        </div>
      </CardContent>
    </Card>
  );
}
