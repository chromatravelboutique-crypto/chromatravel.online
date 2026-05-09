import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, MapPin, Ship, Heart, Star, Users } from "lucide-react";
import type { Destination } from "@shared/schema";
import destinationFallback from "@assets/generated_images/puerto_vallarta_destination.png";
import eventFallback from "@assets/generated_images/pride_parade_celebration.png";
import cruiseFallback from "@assets/generated_images/luxury_cruise_ship_sunset.png";

interface LgbtEvent {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  eventType: string;
  startDate: string;
  endDate: string;
  location: string;
  city: string;
  country: string;
  image: string;
  priceFrom: number;
  currency: string;
  featured: boolean;
}

interface LgbtCruise {
  id: string;
  name: string;
  slug: string;
  cruiseLine: string;
  shipName: string;
  description: string;
  shortDescription: string;
  departurePort: string;
  departureDate: string;
  returnDate: string;
  duration: number;
  destinations: string[];
  image: string;
  priceFrom: number;
  currency: string;
  featured: boolean;
}

export default function LGBTPage() {
  const [activeTab, setActiveTab] = useState("destinations");

  const { data: destinations = [], isLoading: loadingDestinations } = useQuery<Destination[]>({
    queryKey: ["/api/lgbt/destinations"],
  });

  const { data: events = [], isLoading: loadingEvents } = useQuery<LgbtEvent[]>({
    queryKey: ["/api/lgbt/events"],
  });

  const { data: cruises = [], isLoading: loadingCruises } = useQuery<LgbtCruise[]>({
    queryKey: ["/api/lgbt/cruises"],
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />

      <section className="relative py-20 bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500">
        <div className="absolute inset-0 bg-black/40" />
        <div className="container mx-auto px-4 relative z-10 text-center">
          <Badge className="mb-4 bg-white/20 text-white border-white/30" data-testid="badge-lgbt-pride">
            <Heart className="w-3 h-3 mr-1" /> Pride Travel
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4" data-testid="text-lgbt-title">
            Viajes LGBT+ Sin Límites
          </h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto" data-testid="text-lgbt-subtitle">
            Descubre destinos inclusivos, eventos Pride y cruceros exclusivos para la comunidad
          </p>
        </div>
      </section>

      <main className="flex-1 container mx-auto px-4 py-12">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8" data-testid="tabs-lgbt-categories">
            <TabsTrigger value="destinations" data-testid="tab-destinations">
              <MapPin className="w-4 h-4 mr-2" />
              Destinos Gay-Friendly
            </TabsTrigger>
            <TabsTrigger value="events" data-testid="tab-events">
              <Calendar className="w-4 h-4 mr-2" />
              Eventos Pride
            </TabsTrigger>
            <TabsTrigger value="cruises" data-testid="tab-cruises">
              <Ship className="w-4 h-4 mr-2" />
              Cruceros LGBT+
            </TabsTrigger>
          </TabsList>

          <TabsContent value="destinations">
            {loadingDestinations ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <div className="h-48 bg-muted" />
                    <CardContent className="p-4">
                      <div className="h-6 bg-muted rounded mb-2" />
                      <div className="h-4 bg-muted rounded w-2/3" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : destinations.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No hay destinos gay-friendly disponibles</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {destinations.map((destination) => (
                  <Link key={destination.id} href={`/destinations/${destination.slug}`}>
                    <Card className="overflow-hidden hover-elevate cursor-pointer" data-testid={`card-destination-${destination.id}`}>
                      <div className="relative h-48">
                        <img
                          src={destination.image || destinationFallback}
                          alt={destination.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/90 dark:bg-black/70 px-2 py-1 rounded-full">
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          <span className="text-sm font-medium">{destination.lgbtFriendlyScore}/10</span>
                        </div>
                        {destination.featured && (
                          <Badge className="absolute top-3 left-3 bg-pink-500">Destacado</Badge>
                        )}
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-lg mb-1" data-testid={`text-destination-name-${destination.id}`}>
                          {destination.name}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-2">{destination.country}</p>
                        <p className="text-sm line-clamp-2">{destination.shortDescription}</p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="events">
            {loadingEvents ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <div className="h-48 bg-muted" />
                    <CardContent className="p-4">
                      <div className="h-6 bg-muted rounded mb-2" />
                      <div className="h-4 bg-muted rounded w-2/3" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : events.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No hay eventos Pride próximos</p>
                <p className="text-sm mt-2">Pronto agregaremos eventos emocionantes</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((event) => (
                  <Card key={event.id} className="overflow-hidden hover-elevate" data-testid={`card-event-${event.id}`}>
                    <div className="relative h-48">
                      <img
                        src={event.image || eventFallback}
                        alt={event.name}
                        className="w-full h-full object-cover"
                      />
                      <Badge className="absolute top-3 left-3 bg-gradient-to-r from-pink-500 to-purple-500">
                        {event.eventType}
                      </Badge>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-lg mb-1">{event.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <MapPin className="w-3 h-3" />
                        <span>{event.city}, {event.country}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(event.startDate).toLocaleDateString("es-MX", { month: "short", day: "numeric" })}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold">
                          Desde ${event.priceFrom} {event.currency}
                        </span>
                        <Button size="sm">Ver más</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="cruises">
            {loadingCruises ? (
              <div className="grid md:grid-cols-2 gap-6">
                {[1, 2].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <div className="h-56 bg-muted" />
                    <CardContent className="p-4">
                      <div className="h-6 bg-muted rounded mb-2" />
                      <div className="h-4 bg-muted rounded w-2/3" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : cruises.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Ship className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No hay cruceros LGBT+ programados</p>
                <p className="text-sm mt-2">Próximamente agregaremos experiencias inolvidables en alta mar</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {cruises.map((cruise) => (
                  <Card key={cruise.id} className="overflow-hidden hover-elevate" data-testid={`card-cruise-${cruise.id}`}>
                    <div className="relative h-56">
                      <img
                        src={cruise.image || cruiseFallback}
                        alt={cruise.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                      <div className="absolute bottom-4 left-4 right-4 text-white">
                        <Badge className="mb-2 bg-white/20 border-white/30">{cruise.cruiseLine}</Badge>
                        <h3 className="font-bold text-xl">{cruise.name}</h3>
                        <p className="text-white/80 text-sm">{cruise.shipName}</p>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{cruise.duration} noches</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          <span>Desde {cruise.departurePort}</span>
                        </div>
                      </div>
                      <p className="text-sm mb-3 line-clamp-2">{cruise.shortDescription}</p>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs text-muted-foreground">Desde</span>
                          <span className="text-xl font-bold ml-1">${cruise.priceFrom}</span>
                          <span className="text-sm text-muted-foreground"> {cruise.currency}</span>
                        </div>
                        <Button>Reservar</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
}
