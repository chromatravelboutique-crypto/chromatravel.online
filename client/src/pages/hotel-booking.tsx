import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  Star, 
  MapPin, 
  Calendar,
  Users,
  Building,
  AlertCircle,
  Phone,
  Check,
  ArrowLeft,
  Loader2,
  CreditCard
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

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
  Currency: string;
  Rooms: TBORoom[];
}

export default function HotelBooking() {
  const [location] = useLocation();
  const [, setLocationNav] = useLocation();
  const { toast } = useToast();
  const searchParams = new URLSearchParams(location.split("?")[1] || "");
  
  const hotelCode = searchParams.get("hotelCode");
  const hotelName = searchParams.get("hotelName");
  const cityCode = searchParams.get("cityCode");
  const checkIn = searchParams.get("checkIn");
  const checkOut = searchParams.get("checkOut");
  const adultsParam = parseInt(searchParams.get("adults") || "2");
  const roomsParam = parseInt(searchParams.get("rooms") || "1");
  const adults = Math.max(1, adultsParam);
  const rooms = Math.min(roomsParam, adults);

  const [hotel, setHotel] = useState<TBOHotel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState<TBORoom | null>(null);
  const [isBooking, setIsBooking] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [guestInfo, setGuestInfo] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: ""
  });

  useEffect(() => {
    if (hotelCode && checkIn && checkOut) {
      fetchHotelDetails();
    }
  }, [hotelCode, checkIn, checkOut]);

  const fetchHotelDetails = async () => {
    setIsLoading(true);
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
        HotelCodes: hotelCode,
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

      const data = await response.json();

      if (data.HotelResult && data.HotelResult.length > 0) {
        setHotel(data.HotelResult[0]);
      }
    } catch (err) {
      console.error("Error fetching hotel:", err);
      toast({
        title: "Error",
        description: "No se pudo cargar la información del hotel",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectRoom = (room: TBORoom) => {
    setSelectedRoom(room);
    setShowBookingForm(true);
  };

  const handlePreBook = async () => {
    if (!selectedRoom || !hotel) return;

    setIsBooking(true);
    try {
      const preBookRequest = {
        BookingCode: selectedRoom.BookingCode
      };

      const response = await fetch("/api/tbo/prebook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preBookRequest)
      });

      const data = await response.json();

      if (response.ok && data.Status?.Code === 200) {
        toast({
          title: "Pre-reserva exitosa",
          description: "Por favor complete los datos del huésped para confirmar"
        });
      } else {
        throw new Error(data.Status?.Description || "Error en pre-reserva");
      }
    } catch (err) {
      console.error("PreBook error:", err);
      toast({
        title: "Error en pre-reserva",
        description: err instanceof Error ? err.message : "No se pudo procesar",
        variant: "destructive"
      });
    } finally {
      setIsBooking(false);
    }
  };

  const handleCreateLead = async () => {
    if (!guestInfo.firstName || !guestInfo.email || !guestInfo.phone) {
      toast({
        title: "Datos incompletos",
        description: "Por favor complete todos los campos requeridos",
        variant: "destructive"
      });
      return;
    }

    setIsBooking(true);
    try {
      const leadData = {
        name: `${guestInfo.firstName} ${guestInfo.lastName}`,
        email: guestInfo.email,
        phone: guestInfo.phone,
        source: "tbo_search",
        status: "new",
        notes: `Hotel: ${hotel?.HotelName}\nHabitación: ${selectedRoom?.Name?.[0]}\nCheck-in: ${checkIn}\nCheck-out: ${checkOut}\nPrecio: $${selectedRoom?.TotalFare} ${hotel?.Currency}`
      };

      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(leadData)
      });

      if (response.ok) {
        toast({
          title: "Solicitud recibida",
          description: "Un agente de viajes te contactará pronto para confirmar tu reservación"
        });
        setLocationNav("/");
      } else {
        throw new Error("Error al enviar solicitud");
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "No se pudo procesar tu solicitud. Intenta de nuevo.",
        variant: "destructive"
      });
    } finally {
      setIsBooking(false);
    }
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
      <main className="flex-1 py-8">
        <div className="mx-auto max-w-6xl px-4 md:px-8">
          <Button 
            variant="ghost" 
            className="mb-4 gap-2"
            onClick={() => window.history.back()}
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a resultados
          </Button>

          {isLoading && (
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <Skeleton className="h-64 w-full rounded-lg" />
                <Skeleton className="mt-4 h-8 w-3/4" />
                <Skeleton className="mt-2 h-4 w-1/2" />
              </div>
              <div>
                <Skeleton className="h-48 w-full rounded-lg" />
              </div>
            </div>
          )}

          {!isLoading && hotel && (
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <Card>
                  <div className="relative h-64 bg-muted">
                    {hotel.HotelPicture ? (
                      <img
                        src={hotel.HotelPicture}
                        alt={hotel.HotelName}
                        className="h-full w-full object-cover rounded-t-lg"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Building className="h-16 w-16 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h1 className="text-2xl font-bold" data-testid="text-hotel-name">
                          {hotel.HotelName}
                        </h1>
                        <div className="mt-1 flex items-center gap-2">
                          {renderStars(hotel.HotelRating)}
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-1 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{hotel.Address}</span>
                    </div>

                    <Separator className="my-6" />

                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {checkIn && format(parseISO(checkIn), "dd MMM yyyy", { locale: es })} - {checkOut && format(parseISO(checkOut), "dd MMM yyyy", { locale: es })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{adults} adultos, {rooms} habitación(es)</span>
                      </div>
                    </div>

                    <Separator className="my-6" />

                    <h2 className="mb-4 text-lg font-semibold">Selecciona tu habitación</h2>
                    
                    {hotel.Rooms && hotel.Rooms.length > 0 ? (
                      <div className="space-y-4">
                        {hotel.Rooms.map((room, index) => (
                          <Card 
                            key={index} 
                            className={`cursor-pointer transition-all ${
                              selectedRoom?.BookingCode === room.BookingCode 
                                ? "ring-2 ring-primary" 
                                : "hover:shadow-md"
                            }`}
                            onClick={() => handleSelectRoom(room)}
                            data-testid={`card-room-${index}`}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <h3 className="font-medium">
                                    {room.Name?.[0] || "Habitación"}
                                  </h3>
                                  {room.Inclusion && room.Inclusion.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-1">
                                      {room.Inclusion.slice(0, 4).map((inc, i) => (
                                        <Badge key={i} variant="secondary" className="text-xs">
                                          <Check className="mr-1 h-3 w-3" />
                                          {inc}
                                        </Badge>
                                      ))}
                                    </div>
                                  )}
                                  {room.RoomPromotion && (
                                    <Badge className="mt-2 bg-emerald-600">
                                      {room.RoomPromotion}
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-right">
                                  <p className="text-2xl font-bold text-primary">
                                    ${room.TotalFare.toLocaleString()}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {hotel.Currency} total
                                  </p>
                                  {room.TotalTax > 0 && (
                                    <p className="text-xs text-muted-foreground">
                                      Impuestos incluidos: ${room.TotalTax}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <Card className="bg-muted/50">
                        <CardContent className="py-8 text-center">
                          <AlertCircle className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                          <p>No hay habitaciones disponibles para estas fechas</p>
                        </CardContent>
                      </Card>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div>
                {showBookingForm && selectedRoom ? (
                  <Card className="sticky top-4">
                    <CardHeader>
                      <CardTitle>Datos del huésped</CardTitle>
                      <CardDescription>
                        Completa tus datos para solicitar la reservación
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="rounded-lg bg-muted p-3">
                        <p className="text-sm font-medium">{selectedRoom.Name?.[0]}</p>
                        <p className="text-xl font-bold text-primary">
                          ${selectedRoom.TotalFare.toLocaleString()} {hotel.Currency}
                        </p>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="firstName">Nombre *</Label>
                          <Input
                            id="firstName"
                            value={guestInfo.firstName}
                            onChange={(e) => setGuestInfo({...guestInfo, firstName: e.target.value})}
                            placeholder="Tu nombre"
                            data-testid="input-first-name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="lastName">Apellido</Label>
                          <Input
                            id="lastName"
                            value={guestInfo.lastName}
                            onChange={(e) => setGuestInfo({...guestInfo, lastName: e.target.value})}
                            placeholder="Tu apellido"
                            data-testid="input-last-name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="email">Email *</Label>
                          <Input
                            id="email"
                            type="email"
                            value={guestInfo.email}
                            onChange={(e) => setGuestInfo({...guestInfo, email: e.target.value})}
                            placeholder="tu@email.com"
                            data-testid="input-email"
                          />
                        </div>
                        <div>
                          <Label htmlFor="phone">Teléfono *</Label>
                          <Input
                            id="phone"
                            value={guestInfo.phone}
                            onChange={(e) => setGuestInfo({...guestInfo, phone: e.target.value})}
                            placeholder="+52 33 1234 5678"
                            data-testid="input-phone"
                          />
                        </div>
                      </div>

                      <Button 
                        className="w-full gap-2" 
                        size="lg"
                        onClick={handleCreateLead}
                        disabled={isBooking}
                        data-testid="button-submit-booking"
                      >
                        {isBooking ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CreditCard className="h-4 w-4" />
                        )}
                        Solicitar reservación
                      </Button>

                      <p className="text-center text-xs text-muted-foreground">
                        Un agente te contactará para confirmar disponibilidad y procesar el pago
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="sticky top-4">
                    <CardContent className="py-8 text-center">
                      <Building className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                      <h3 className="font-medium">Selecciona una habitación</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Elige la opción que prefieras para continuar
                      </p>
                    </CardContent>
                  </Card>
                )}

                <Card className="mt-4 bg-primary/5">
                  <CardContent className="flex items-center gap-3 py-4">
                    <Phone className="h-6 w-6 text-primary" />
                    <div>
                      <p className="text-sm font-medium">¿Necesitas ayuda?</p>
                      <p className="text-xs text-muted-foreground">
                        <a href="tel:+523323456789" className="text-primary underline">
                          +52 33 2345 6789
                        </a>
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {!isLoading && !hotel && (
            <Card>
              <CardContent className="flex flex-col items-center py-12">
                <AlertCircle className="mb-4 h-12 w-12 text-muted-foreground" />
                <h2 className="text-lg font-semibold">Hotel no encontrado</h2>
                <p className="text-muted-foreground">No se encontró información para este hotel</p>
                <Button 
                  className="mt-4" 
                  onClick={() => setLocationNav("/hotel-search")}
                  data-testid="button-new-search"
                >
                  Nueva búsqueda
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
