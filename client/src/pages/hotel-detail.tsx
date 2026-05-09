import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { format, addDays } from "date-fns";
import { es } from "date-fns/locale";
import {
  MapPin,
  Star,
  Shield,
  Share2,
  Heart,
  Wifi,
  Coffee,
  Car,
  Dumbbell,
  Waves,
  Utensils,
  ChevronLeft,
  ChevronRight,
  X,
  Calendar,
  Users,
  Check,
} from "lucide-react";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { RoomCard } from "@/components/room-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import type { Hotel, Room, Rate } from "@shared/schema";

import hotelImage from "@assets/generated_images/luxury_boutique_hotel_dusk.png";
import roomImage from "@assets/generated_images/luxury_hotel_room_interior.png";

const amenityIcons: Record<string, typeof Wifi> = {
  wifi: Wifi,
  breakfast: Coffee,
  parking: Car,
  gym: Dumbbell,
  pool: Waves,
  restaurant: Utensils,
};

type RoomWithRates = Room & { rates: Rate[] };
type HotelWithRooms = Hotel & { rooms: RoomWithRates[] };

function ImageGallery({ images, hotelName }: { images: string[]; hotelName: string }) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const displayImages = images.length > 0 ? images : [hotelImage];

  const nextImage = () => setCurrentIndex((i) => (i + 1) % displayImages.length);
  const prevImage = () => setCurrentIndex((i) => (i - 1 + displayImages.length) % displayImages.length);

  return (
    <>
      <div className="grid gap-2 md:grid-cols-4 md:grid-rows-2">
        <div
          className="relative cursor-pointer overflow-hidden rounded-lg md:col-span-2 md:row-span-2"
          onClick={() => { setCurrentIndex(0); setLightboxOpen(true); }}
        >
          <img
            src={displayImages[0]}
            alt={hotelName}
            className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
          />
          <Badge className="absolute left-3 top-3 gap-1 bg-gradient-to-r from-purple-500 to-pink-500">
            <Shield className="h-3 w-3" />
            LGBT+ Verificado
          </Badge>
        </div>
        {displayImages.slice(1, 5).map((image, index) => (
          <div
            key={index}
            className="relative hidden cursor-pointer overflow-hidden rounded-lg md:block"
            onClick={() => { setCurrentIndex(index + 1); setLightboxOpen(true); }}
          >
            <img
              src={image}
              alt={`${hotelName} - ${index + 2}`}
              className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
            />
            {index === 3 && displayImages.length > 5 && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <span className="font-display text-lg font-semibold text-white">
                  +{displayImages.length - 5} fotos
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-5xl border-0 bg-transparent p-0 shadow-none">
          <DialogTitle className="sr-only">Galería de imágenes de {hotelName}</DialogTitle>
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 z-10 bg-black/50 text-white"
              onClick={() => setLightboxOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 z-10 -translate-y-1/2 bg-black/50 text-white"
              onClick={prevImage}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 z-10 -translate-y-1/2 bg-black/50 text-white"
              onClick={nextImage}
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
            <img
              src={displayImages[currentIndex]}
              alt={`${hotelName} - ${currentIndex + 1}`}
              className="max-h-[80vh] w-full rounded-lg object-contain"
            />
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-sm text-white">
              {currentIndex + 1} / {displayImages.length}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function HotelDetail() {
  const { id } = useParams<{ id: string }>();
  const [checkIn, setCheckIn] = useState<Date>(addDays(new Date(), 7));
  const [checkOut, setCheckOut] = useState<Date>(addDays(new Date(), 10));
  const [guests, setGuests] = useState(2);
  const [selectedRateId, setSelectedRateId] = useState<string | null>(null);

  const { data: hotelData, isLoading, error } = useQuery<HotelWithRooms>({
    queryKey: ["/api/hotels", id],
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navigation />
        <main className="flex-1 py-8">
          <div className="mx-auto max-w-7xl px-4 md:px-8">
            <Skeleton className="mb-6 h-10 w-64" />
            <Skeleton className="aspect-[3/1] w-full rounded-lg" />
            <div className="mt-8 grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-48 w-full" />
              </div>
              <Skeleton className="h-96 w-full" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !hotelData) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navigation />
        <main className="flex flex-1 items-center justify-center py-12">
          <div className="text-center">
            <h1 className="mb-4 font-display text-2xl font-bold">Hotel no encontrado</h1>
            <p className="mb-6 text-muted-foreground">
              No pudimos encontrar el hotel que buscas.
            </p>
            <Link href="/hotels">
              <Button>Ver todos los hoteles</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const hotel = hotelData;
  const rooms = hotel.rooms || [];
  const allRates = rooms.flatMap(room => room.rates || []);

  const selectedRate = allRates.find((r) => r.id === selectedRateId);
  const selectedRoom = selectedRate ? rooms.find((r) => r.id === selectedRate.roomId) : null;

  const policies = hotel.policies as Record<string, string> | null;

  return (
    <div className="flex min-h-screen flex-col">
      <Navigation />
      <main className="flex-1">
        <section className="py-6">
          <div className="mx-auto max-w-7xl px-4 md:px-8">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <div className="flex">
                    {Array.from({ length: hotel.starRating || 4 }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  {hotel.lgbtCertified && (
                    <Badge variant="outline" className="gap-1">
                      <Shield className="h-3 w-3" />
                      LGBT+ Verificado
                    </Badge>
                  )}
                </div>
                <h1 className="font-display text-2xl font-bold md:text-3xl lg:text-4xl">
                  {hotel.name}
                </h1>
                <div className="mt-2 flex items-center gap-1 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{hotel.address}, {hotel.city}, {hotel.country}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" data-testid="button-share">
                  <Share2 className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" data-testid="button-favorite">
                  <Heart className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <ImageGallery 
              images={hotel.images || [hotelImage]} 
              hotelName={hotel.name} 
            />
          </div>
        </section>

        <section className="py-8">
          <div className="mx-auto max-w-7xl px-4 md:px-8">
            <div className="flex flex-col gap-8 lg:flex-row">
              <div className="flex-1">
                <Tabs defaultValue="overview">
                  <TabsList className="mb-6 flex-wrap">
                    <TabsTrigger value="overview" data-testid="tab-overview">
                      Descripción
                    </TabsTrigger>
                    <TabsTrigger value="rooms" data-testid="tab-rooms">
                      Habitaciones
                    </TabsTrigger>
                    <TabsTrigger value="amenities" data-testid="tab-amenities">
                      Amenidades
                    </TabsTrigger>
                    <TabsTrigger value="policies" data-testid="tab-policies">
                      Políticas
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-6">
                    <div className="prose prose-neutral dark:prose-invert max-w-none">
                      {hotel.description?.split("\n\n").map((paragraph, i) => (
                        <p key={i}>{paragraph}</p>
                      ))}
                    </div>
                    
                    {hotel.lgbtCertified && (
                      <Card className="border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-900/20">
                        <CardContent className="flex items-start gap-4 p-6">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-pink-500">
                            <Shield className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <h3 className="font-display font-semibold">
                              Hotel verificado LGBT+
                            </h3>
                            <p className="mt-1 text-sm text-muted-foreground">
                              Este hotel ha sido verificado por chromaTravel y cumple con nuestros 
                              estándares de inclusión, respeto y seguridad para la comunidad LGBT+.
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>

                  <TabsContent value="rooms" className="space-y-6">
                    {rooms.length > 0 ? (
                      rooms.map((room) => (
                        <RoomCard
                          key={room.id}
                          room={room}
                          rates={room.rates || []}
                          onSelectRate={setSelectedRateId}
                          selectedRateId={selectedRateId || undefined}
                        />
                      ))
                    ) : (
                      <Card>
                        <CardContent className="py-12 text-center">
                          <p className="text-muted-foreground">
                            No hay habitaciones disponibles en este momento.
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>

                  <TabsContent value="amenities">
                    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                      {hotel.amenities?.map((amenity) => {
                        const Icon = amenityIcons[amenity.toLowerCase()] || Wifi;
                        return (
                          <div key={amenity} className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                              <Icon className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <span className="capitalize">{amenity}</span>
                          </div>
                        );
                      })}
                    </div>
                  </TabsContent>

                  <TabsContent value="policies" className="space-y-4">
                    {policies && Object.entries(policies).map(([key, value]) => (
                      <div key={key} className="flex items-start gap-3">
                        <Check className="mt-0.5 h-5 w-5 text-green-500" />
                        <div>
                          <p className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                          <p className="text-sm text-muted-foreground">{value}</p>
                        </div>
                      </div>
                    ))}
                  </TabsContent>
                </Tabs>
              </div>

              <aside className="w-full lg:w-96">
                <Card className="sticky top-24">
                  <CardHeader>
                    <CardTitle className="font-display">Reservar ahora</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground">
                          Llegada
                        </label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start gap-2 font-normal"
                              data-testid="button-detail-checkin"
                            >
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              {format(checkIn, "dd MMM", { locale: es })}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <CalendarComponent
                              mode="single"
                              selected={checkIn}
                              onSelect={(date) => date && setCheckIn(date)}
                              disabled={(date) => date < new Date()}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground">
                          Salida
                        </label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start gap-2 font-normal"
                              data-testid="button-detail-checkout"
                            >
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              {format(checkOut, "dd MMM", { locale: es })}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <CalendarComponent
                              mode="single"
                              selected={checkOut}
                              onSelect={(date) => date && setCheckOut(date)}
                              disabled={(date) => date <= checkIn}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">
                        Huéspedes
                      </label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start gap-2 font-normal"
                            data-testid="button-detail-guests"
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
                              >
                                -
                              </Button>
                              <span className="w-8 text-center text-sm">{guests}</span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setGuests(Math.min(10, guests + 1))}
                                disabled={guests >= 10}
                              >
                                +
                              </Button>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>

                    <Separator />

                    {selectedRate && selectedRoom ? (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Habitación</span>
                          <span>{selectedRoom.name}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Tarifa</span>
                          <span>{selectedRate.name}</span>
                        </div>
                        <div className="flex justify-between font-semibold">
                          <span>Desde</span>
                          <span>
                            ${Number(selectedRate.price).toLocaleString()} {selectedRate.currency}/noche
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-sm text-muted-foreground">
                        Selecciona una habitación y tarifa para continuar
                      </div>
                    )}

                    <Link
                      href={selectedRateId 
                        ? `/booking/${id}?rateId=${selectedRateId}&checkIn=${format(checkIn, 'yyyy-MM-dd')}&checkOut=${format(checkOut, 'yyyy-MM-dd')}&guests=${guests}` 
                        : "#"}
                    >
                      <Button 
                        className="w-full" 
                        size="lg"
                        disabled={!selectedRateId}
                        data-testid="button-reserve"
                      >
                        {selectedRateId ? "Reservar ahora" : "Selecciona una tarifa"}
                      </Button>
                    </Link>

                    <p className="text-center text-xs text-muted-foreground">
                      No se realizará ningún cargo hasta confirmar la reserva
                    </p>
                  </CardContent>
                </Card>
              </aside>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
