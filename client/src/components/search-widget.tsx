import { useState } from "react";
import { useLocation } from "wouter";
import { Calendar, MapPin, Users, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface SearchWidgetProps {
  variant?: "hero" | "inline" | "sidebar";
  className?: string;
}

export function SearchWidget({ variant = "inline", className = "" }: SearchWidgetProps) {
  const [, setLocation] = useLocation();
  const [destination, setDestination] = useState("");
  const [checkIn, setCheckIn] = useState<Date>();
  const [checkOut, setCheckOut] = useState<Date>();
  const [guests, setGuests] = useState(2);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (destination) params.set("destination", destination);
    if (checkIn) params.set("checkIn", format(checkIn, "yyyy-MM-dd"));
    if (checkOut) params.set("checkOut", format(checkOut, "yyyy-MM-dd"));
    if (guests) params.set("guests", guests.toString());
    
    setLocation(`/hotels?${params.toString()}`);
  };

  const isHero = variant === "hero";
  const isSidebar = variant === "sidebar";

  return (
    <div
      className={`rounded-xl border bg-card p-4 shadow-lg ${
        isHero ? "mx-auto max-w-5xl" : ""
      } ${className}`}
    >
      <div
        className={`grid gap-4 ${
          isSidebar
            ? "grid-cols-1"
            : "grid-cols-1 md:grid-cols-2 lg:grid-cols-5"
        }`}
      >
        <div className={`space-y-2 ${isSidebar ? "" : "lg:col-span-1"}`}>
          <Label htmlFor="destination" className="text-xs font-medium text-muted-foreground">
            Destino
          </Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="destination"
              placeholder="¿A dónde vas?"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="pl-10"
              data-testid="input-search-destination"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground">
            Llegada
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start gap-2 font-normal"
                data-testid="button-search-checkin"
              >
                <Calendar className="h-4 w-4 text-muted-foreground" />
                {checkIn ? (
                  format(checkIn, "dd MMM", { locale: es })
                ) : (
                  <span className="text-muted-foreground">Seleccionar</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={checkIn}
                onSelect={setCheckIn}
                disabled={(date) => date < new Date()}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground">
            Salida
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start gap-2 font-normal"
                data-testid="button-search-checkout"
              >
                <Calendar className="h-4 w-4 text-muted-foreground" />
                {checkOut ? (
                  format(checkOut, "dd MMM", { locale: es })
                ) : (
                  <span className="text-muted-foreground">Seleccionar</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={checkOut}
                onSelect={setCheckOut}
                disabled={(date) => date < (checkIn || new Date())}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground">
            Huéspedes
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start gap-2 font-normal"
                data-testid="button-search-guests"
              >
                <Users className="h-4 w-4 text-muted-foreground" />
                {guests} {guests === 1 ? "huésped" : "huéspedes"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-4" align="start">
              <div className="flex items-center justify-between">
                <span className="text-sm">Huéspedes</span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setGuests(Math.max(1, guests - 1))}
                    disabled={guests <= 1}
                    data-testid="button-guests-minus"
                  >
                    -
                  </Button>
                  <span className="w-8 text-center text-sm" data-testid="text-guests-count">{guests}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setGuests(Math.min(10, guests + 1))}
                    disabled={guests >= 10}
                    data-testid="button-guests-plus"
                  >
                    +
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div className={`flex items-end ${isSidebar ? "" : ""}`}>
          <Button
            onClick={handleSearch}
            className="w-full gap-2"
            size={isHero ? "lg" : "default"}
            data-testid="button-search-submit"
          >
            <Search className="h-4 w-4" />
            Buscar
          </Button>
        </div>
      </div>
    </div>
  );
}
