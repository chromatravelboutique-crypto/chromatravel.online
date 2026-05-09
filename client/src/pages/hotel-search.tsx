import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { TBOSearchWidget } from "@/components/tbo-search-widget";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Star, 
  MapPin, 
  Wifi, 
  Car, 
  Utensils, 
  Waves,
  Building,
  AlertCircle,
  Phone,
  ChevronRight
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TBORoom {
  Name: string[];
  BookingCode: string;
  Inclusion: string[];
  TotalFare: number;
  TotalTax: number;
  RoomPromotion: string;
  CancelPolicies: Array<{
    FromDate: string;
    ChargeType: string;
    CancellationCharge: number;
  }>;
}

interface TBOHotel {
  HotelCode: string;
  HotelName: string;
  HotelRating: string;
  Address: string;
  HotelPicture: string;
  Latitude: string;
  Longitude: string;
  Currency: string;
  Rooms: TBORoom[];
}

interface SearchResponse {
  HotelResult?: TBOHotel[];
  Status?: {
    Code: number;
    Description: string;
  };
}

export default function HotelSearch() {
  const [location] = useLocation();
  const [, setLocationNav] = useLocation();
  const { toast } = useToast();
  const searchParams = new URLSearchParams(location.split("?")[1] || "");
  
  const cityCode = searchParams.get("cityCode");
  const cityName = searchParams.get("cityName");
  const checkIn = searchParams.get("checkIn");
  const checkOut = searchParams.get("checkOut");
  const adultsParam = parseInt(searchParams.get("adults") || "2");
  const roomsParam = parseInt(searchParams.get("rooms") || "1");
  const adults = Math.max(1, adultsParam);
  const rooms = Math.min(roomsParam, adults);

  const [hotels, setHotels] = useState<TBOHotel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchPerformed, setSearchPerformed] = useState(false);

  useEffect(() => {
    if (cityCode && checkIn && checkOut) {
      searchHotels();
    }
  }, [cityCode, checkIn, checkOut, adults, rooms]);

  const searchHotels = async () => {
    setIsLoading(true);
    setError(null);
    setSearchPerformed(true);

    try {
      const validRooms = Math.min(rooms, adults);
      const roomConfig = [];
      const baseAdultsPerRoom = Math.floor(adults / validRooms);
      const extraAdults = adults % validRooms;
      for (let i = 0; i < validRooms; i++) {
        roomConfig.push({
          Adults: baseAdultsPerRoom + (i < extraAdults ? 1 : 0),
          Children: 0,
          ChildrenAges: []
        });
      }

      const searchRequest = {
        CheckIn: checkIn,
        CheckOut: checkOut,
        CityCode: cityCode,
        GuestNationality: "MX",
        PaxRooms: roomConfig,
        ResponseTime: 23,
        IsDetailResponse: true,
        Filters: {
          Refundable: false,
          NoOfRooms: rooms,
          MealType: "All"
        }
      };

      const response = await fetch("/api/tbo/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(searchRequest)
      });

      const data: SearchResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.Status?.Description || "Error al buscar hoteles");
      }

      if (data.HotelResult && data.HotelResult.length > 0) {
        setHotels(data.HotelResult);
      } else {
        setHotels([]);
      }
    } catch (err) {
      console.error("Search error:", err);
      setError(err instanceof Error ? err.message : "Error al buscar hoteles");
      toast({
        title: "Error en la búsqueda",
        description: err instanceof Error ? err.message : "No se pudieron cargar los hoteles",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getLowestPrice = (hotel: TBOHotel) => {
    if (!hotel.Rooms || hotel.Rooms.length === 0) return null;
    const prices = hotel.Rooms.map(r => r.TotalFare);
    return Math.min(...prices);
  };

  const handleSelectHotel = (hotel: TBOHotel) => {
    const params = new URLSearchParams();
    params.set("hotelCode", hotel.HotelCode);
    params.set("hotelName", hotel.HotelName);
    params.set("cityCode", cityCode || "");
    params.set("checkIn", checkIn || "");
    params.set("checkOut", checkOut || "");
    params.set("adults", adults.toString());
    params.set("rooms", rooms.toString());
    setLocationNav(`/hotel-booking?${params.toString()}`);
  };

  const renderStars = (rating: string) => {
    const stars = parseInt(rating) || 0;
    return (
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i < stars ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navigation />
      <main className="flex-1">
        <section className="border-b bg-muted/30 py-6">
          <div className="mx-auto max-w-7xl px-4 md:px-8">
            <TBOSearchWidget variant="inline" />
          </div>
        </section>

        <section className="py-8">
          <div className="mx-auto max-w-7xl px-4 md:px-8">
            <div className="mb-6">
              <h1 className="font-display text-2xl font-bold md:text-3xl" data-testid="text-search-title">
                {cityName 
                  ? `Hoteles en ${cityName}`
                  : "Busca tu hotel ideal"}
              </h1>
              <p className="mt-1 text-muted-foreground" data-testid="text-search-results">
                {isLoading 
                  ? "Buscando hoteles en tiempo real..." 
                  : searchPerformed 
                    ? `${hotels.length} hoteles encontrados`
                    : "Ingresa tu destino y fechas para buscar"}
              </p>
            </div>

            {isLoading && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i}>
                    <Skeleton className="h-48 w-full rounded-t-lg" />
                    <CardContent className="p-4">
                      <Skeleton className="mb-2 h-6 w-3/4" />
                      <Skeleton className="mb-4 h-4 w-1/2" />
                      <Skeleton className="h-8 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {error && (
              <Card className="border-destructive bg-destructive/10">
                <CardContent className="flex items-center gap-4 py-6">
                  <AlertCircle className="h-8 w-8 text-destructive" />
                  <div>
                    <h3 className="font-semibold">Error en la búsqueda</h3>
                    <p className="text-sm text-muted-foreground">{error}</p>
                    <Button 
                      variant="outline" 
                      className="mt-3"
                      onClick={searchHotels}
                      data-testid="button-retry-search"
                    >
                      Intentar de nuevo
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {!isLoading && !error && hotels.length === 0 && searchPerformed && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Building className="mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="text-lg font-semibold">No se encontraron hoteles</h3>
                  <p className="mt-1 text-muted-foreground">
                    Intenta buscar en otra ciudad o cambiar las fechas
                  </p>
                </CardContent>
              </Card>
            )}

            {!isLoading && hotels.length > 0 && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {hotels.map((hotel) => {
                  const lowestPrice = getLowestPrice(hotel);
                  return (
                    <Card 
                      key={hotel.HotelCode} 
                      className="overflow-hidden transition-shadow hover:shadow-lg"
                      data-testid={`card-hotel-${hotel.HotelCode}`}
                    >
                      <div className="relative h-48 bg-muted">
                        {hotel.HotelPicture ? (
                          <img
                            src={hotel.HotelPicture}
                            alt={hotel.HotelName}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "/placeholder-hotel.jpg";
                            }}
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <Building className="h-16 w-16 text-muted-foreground" />
                          </div>
                        )}
                        {hotel.Rooms?.[0]?.RoomPromotion && (
                          <Badge className="absolute left-2 top-2 bg-emerald-600">
                            {hotel.Rooms[0].RoomPromotion}
                          </Badge>
                        )}
                      </div>
                      <CardContent className="p-4">
                        <div className="mb-2 flex items-start justify-between gap-2">
                          <h3 className="font-semibold leading-tight" data-testid={`text-hotel-name-${hotel.HotelCode}`}>
                            {hotel.HotelName}
                          </h3>
                          {renderStars(hotel.HotelRating)}
                        </div>
                        <div className="mb-3 flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span className="line-clamp-1">{hotel.Address}</span>
                        </div>
                        {hotel.Rooms?.[0]?.Inclusion && (
                          <div className="mb-3 flex flex-wrap gap-1">
                            {hotel.Rooms[0].Inclusion.slice(0, 3).map((inc, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {inc}
                              </Badge>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <div>
                            {lowestPrice && (
                              <>
                                <p className="text-xs text-muted-foreground">Desde</p>
                                <p className="text-xl font-bold text-primary" data-testid={`text-hotel-price-${hotel.HotelCode}`}>
                                  ${lowestPrice.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">{hotel.Currency}</span>
                                </p>
                              </>
                            )}
                          </div>
                          <Button 
                            size="sm"
                            onClick={() => handleSelectHotel(hotel)}
                            data-testid={`button-select-hotel-${hotel.HotelCode}`}
                          >
                            Ver opciones
                            <ChevronRight className="ml-1 h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {!searchPerformed && !isLoading && (
              <div className="mt-8">
                <h2 className="mb-4 text-lg font-semibold">Destinos populares en México</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {["Cancún", "Puerto Vallarta", "Los Cabos", "Ciudad de México"].map((dest) => (
                    <Card key={dest} className="hover-elevate cursor-pointer p-4 text-center">
                      <MapPin className="mx-auto mb-2 h-8 w-8 text-primary" />
                      <p className="font-medium">{dest}</p>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            <Card className="mt-8 bg-primary/5">
              <CardContent className="flex items-center gap-4 py-4">
                <Phone className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-medium">¿Necesitas ayuda con tu reservación?</p>
                  <p className="text-sm text-muted-foreground">
                    Llámanos al <a href="tel:+523323456789" className="text-primary underline">+52 33 2345 6789</a> o escríbenos por WhatsApp
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
