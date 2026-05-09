import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Calendar, MapPin, Users, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format, addDays } from "date-fns";
import { es } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

interface City {
  Code: string;
  Name: string;
}

interface TBOSearchWidgetProps {
  variant?: "hero" | "inline" | "sidebar";
  className?: string;
}

export function TBOSearchWidget({ variant = "inline", className = "" }: TBOSearchWidgetProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [destination, setDestination] = useState("");
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [cities, setCities] = useState<City[]>([]);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [showCities, setShowCities] = useState(false);
  const [checkIn, setCheckIn] = useState<Date>(addDays(new Date(), 7));
  const [checkOut, setCheckOut] = useState<Date>(addDays(new Date(), 10));
  const [adults, setAdults] = useState(2);
  const [rooms, setRooms] = useState(1);

  useEffect(() => {
    if (rooms > adults) {
      setRooms(adults);
    }
  }, [adults]);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (destination.length >= 2 && !selectedCity) {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      searchTimeoutRef.current = setTimeout(async () => {
        setIsLoadingCities(true);
        try {
          const response = await fetch("/api/tbo/cities", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ CountryCode: "MX" })
          });
          if (response.ok) {
            const data = await response.json();
            const filtered = (data.CityList || []).filter((city: City) =>
              city.Name.toLowerCase().includes(destination.toLowerCase())
            );
            setCities(filtered.slice(0, 10));
            setShowCities(true);
          }
        } catch (error) {
          console.error("Error fetching cities:", error);
        } finally {
          setIsLoadingCities(false);
        }
      }, 300);
    } else if (destination.length < 2) {
      setCities([]);
      setShowCities(false);
    }
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [destination, selectedCity]);

  const handleCitySelect = (city: City) => {
    setSelectedCity(city);
    setDestination(city.Name);
    setShowCities(false);
    setCities([]);
  };

  const handleSearch = () => {
    if (!selectedCity) {
      toast({
        title: "Selecciona un destino",
        description: "Por favor selecciona una ciudad de la lista",
        variant: "destructive"
      });
      return;
    }
    if (!checkIn || !checkOut) {
      toast({
        title: "Selecciona fechas",
        description: "Por favor selecciona fechas de llegada y salida",
        variant: "destructive"
      });
      return;
    }
    const params = new URLSearchParams();
    params.set("cityCode", selectedCity.Code);
    params.set("cityName", selectedCity.Name);
    params.set("checkIn", format(checkIn, "yyyy-MM-dd"));
    params.set("checkOut", format(checkOut, "yyyy-MM-dd"));
    params.set("adults", adults.toString());
    params.set("rooms", rooms.toString());
    
    setLocation(`/hotel-search?${params.toString()}`);
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
            : "grid-cols-1 md:grid-cols-2 lg:grid-cols-6"
        }`}
      >
        <div className={`relative space-y-2 ${isSidebar ? "" : "lg:col-span-2"}`}>
          <Label htmlFor="destination" className="text-xs font-medium text-muted-foreground">
            Destino
          </Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={inputRef}
              id="destination"
              placeholder="Ciudad en México"
              value={destination}
              onChange={(e) => {
                setDestination(e.target.value);
                setSelectedCity(null);
              }}
              onFocus={() => cities.length > 0 && setShowCities(true)}
              className="pl-10"
              data-testid="input-tbo-destination"
            />
            {isLoadingCities && (
              <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
            )}
          </div>
          {showCities && cities.length > 0 && (
            <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg">
              {cities.map((city) => (
                <button
                  key={city.Code}
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover-elevate"
                  onClick={() => handleCitySelect(city)}
                  data-testid={`city-option-${city.Code}`}
                >
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  {city.Name}
                </button>
              ))}
            </div>
          )}
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
                data-testid="button-tbo-checkin"
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
                onSelect={(date) => {
                  if (date) {
                    setCheckIn(date);
                    if (checkOut && date >= checkOut) {
                      setCheckOut(addDays(date, 1));
                    }
                  }
                }}
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
                data-testid="button-tbo-checkout"
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
                onSelect={(date) => date && setCheckOut(date)}
                disabled={(date) => date <= (checkIn || new Date())}
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
                data-testid="button-tbo-guests"
              >
                <Users className="h-4 w-4 text-muted-foreground" />
                {adults} adultos, {rooms} hab.
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-4" align="start">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Adultos</span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setAdults(Math.max(1, adults - 1))}
                      disabled={adults <= 1}
                      data-testid="button-adults-minus"
                    >
                      -
                    </Button>
                    <span className="w-8 text-center text-sm">{adults}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setAdults(Math.min(6, adults + 1))}
                      disabled={adults >= 6}
                      data-testid="button-adults-plus"
                    >
                      +
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Habitaciones</span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setRooms(Math.max(1, rooms - 1))}
                      disabled={rooms <= 1}
                      data-testid="button-rooms-minus"
                    >
                      -
                    </Button>
                    <span className="w-8 text-center text-sm">{rooms}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setRooms(Math.min(Math.min(4, adults), rooms + 1))}
                      disabled={rooms >= 4 || rooms >= adults}
                      data-testid="button-rooms-plus"
                    >
                      +
                    </Button>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex items-end">
          <Button
            onClick={handleSearch}
            className="w-full gap-2"
            size={isHero ? "lg" : "default"}
            data-testid="button-tbo-search"
          >
            <Search className="h-4 w-4" />
            Buscar
          </Button>
        </div>
      </div>
    </div>
  );
}
