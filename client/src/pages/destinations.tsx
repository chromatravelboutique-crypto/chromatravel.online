import { Link } from "wouter";
import { MapPin, Star, ArrowRight } from "lucide-react";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { DestinationCard } from "@/components/destination-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

import barcelonaImage from "@assets/generated_images/barcelona_destination_aerial.png";
import puertovallartaImage from "@assets/generated_images/puerto_vallarta_destination.png";
import amsterdamImage from "@assets/generated_images/amsterdam_canal_sunset.png";
import mykonosImage from "@assets/generated_images/mykonos_greece_destination.png";

const featuredDestination = {
  id: "barcelona",
  name: "Barcelona",
  country: "España",
  image: barcelonaImage,
  lgbtScore: 9,
  description: "Barcelona es la capital gay de Europa y uno de los destinos más acogedores para la comunidad LGBT+ en el mundo. Con su vibrante barrio del Eixample (conocido como 'Gayxample'), playas nudistas como Mar Bella, y una vida nocturna incomparable, Barcelona ofrece experiencias únicas para viajeros LGBT+.",
  highlights: [
    "Barrio Gayxample con más de 50 locales LGBT+",
    "Playa de la Mar Bella (LGBT-friendly)",
    "Pride Barcelona en junio",
    "Cultura, arquitectura de Gaudí y gastronomía",
  ],
};

const destinations = [
  {
    id: "puerto-vallarta",
    name: "Puerto Vallarta",
    country: "México",
    image: puertovallartaImage,
    lgbtScore: 9,
    shortDescription: "El paraíso gay de México con la famosa Zona Romántica.",
  },
  {
    id: "amsterdam",
    name: "Ámsterdam",
    country: "Países Bajos",
    image: amsterdamImage,
    lgbtScore: 10,
    shortDescription: "Pionera en derechos LGBT+ con canales románticos.",
  },
  {
    id: "mykonos",
    name: "Mykonos",
    country: "Grecia",
    image: mykonosImage,
    lgbtScore: 9,
    shortDescription: "Isla griega con las mejores fiestas de verano.",
  },
  {
    id: "berlin",
    name: "Berlín",
    country: "Alemania",
    image: barcelonaImage,
    lgbtScore: 9,
    shortDescription: "Capital alternativa con escena underground vibrante.",
  },
  {
    id: "san-francisco",
    name: "San Francisco",
    country: "Estados Unidos",
    image: puertovallartaImage,
    lgbtScore: 10,
    shortDescription: "Cuna del movimiento LGBT+ moderno con el Castro.",
  },
  {
    id: "buenos-aires",
    name: "Buenos Aires",
    country: "Argentina",
    image: amsterdamImage,
    lgbtScore: 8,
    shortDescription: "La capital más LGBT-friendly de Sudamérica.",
  },
  {
    id: "tel-aviv",
    name: "Tel Aviv",
    country: "Israel",
    image: mykonosImage,
    lgbtScore: 9,
    shortDescription: "Playa, fiesta y diversidad en el Mediterráneo.",
  },
  {
    id: "sitges",
    name: "Sitges",
    country: "España",
    image: barcelonaImage,
    lgbtScore: 10,
    shortDescription: "Pueblo costero gay por excelencia cerca de Barcelona.",
  },
];

export default function Destinations() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navigation />
      <main className="flex-1">
        <section className="bg-muted/30 py-16 md:py-24">
          <div className="mx-auto max-w-7xl px-4 text-center md:px-8">
            <Badge className="mb-4" variant="secondary">
              Destinos LGBT-Friendly
            </Badge>
            <h1 className="font-display text-3xl font-bold md:text-4xl lg:text-5xl">
              Descubre los mejores destinos para ti
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              Explora nuestra selección de destinos verificados como seguros y
              acogedores para la comunidad LGBT+.
            </p>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="mx-auto max-w-7xl px-4 md:px-8">
            <div className="mb-12">
              <h2 className="mb-6 font-display text-2xl font-bold md:text-3xl">
                Destino destacado
              </h2>
              <Card className="overflow-hidden">
                <div className="grid md:grid-cols-2">
                  <div className="relative aspect-[4/3] md:aspect-auto">
                    <img
                      src={featuredDestination.image}
                      alt={featuredDestination.name}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute left-4 top-4">
                      <Badge className="gap-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                        <Star className="h-3 w-3 fill-current" />
                        {featuredDestination.lgbtScore}/10 LGBT-Friendly
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="flex flex-col justify-center p-6 md:p-8 lg:p-12">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span className="text-sm">{featuredDestination.country}</span>
                    </div>
                    <h3 className="mt-2 font-display text-2xl font-bold md:text-3xl">
                      {featuredDestination.name}
                    </h3>
                    <p className="mt-4 text-muted-foreground">
                      {featuredDestination.description}
                    </p>
                    <ul className="mt-6 space-y-2">
                      {featuredDestination.highlights.map((highlight) => (
                        <li key={highlight} className="flex items-center gap-2 text-sm">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                          {highlight}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-8">
                      <Link href={`/hotels?destination=${featuredDestination.name}`}>
                        <Button className="gap-2" data-testid="button-explore-barcelona">
                          Explorar hoteles
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </div>
              </Card>
            </div>

            <div>
              <h2 className="mb-6 font-display text-2xl font-bold md:text-3xl">
                Todos los destinos
              </h2>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {destinations.map((destination) => (
                  <DestinationCard key={destination.id} {...destination} />
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
