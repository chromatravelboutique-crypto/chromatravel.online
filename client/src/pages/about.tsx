import { Shield, Heart, Users, Globe, Award, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { CTASection } from "@/components/cta-section";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const values = [
  {
    icon: Shield,
    title: "Seguridad ante todo",
    description: "Verificamos personalmente cada hotel para garantizar un ambiente seguro y respetuoso.",
  },
  {
    icon: Heart,
    title: "Inclusión auténtica",
    description: "No es marketing, es nuestra esencia. Celebramos la diversidad en cada experiencia.",
  },
  {
    icon: Users,
    title: "Comunidad primero",
    description: "Construimos conexiones genuinas entre viajeros LGBT+ de todo el mundo.",
  },
  {
    icon: Globe,
    title: "Alcance global",
    description: "Destinos cuidadosamente seleccionados en los cinco continentes.",
  },
];

const stats = [
  { value: "500+", label: "Hoteles verificados" },
  { value: "50+", label: "Destinos LGBT+" },
  { value: "10,000+", label: "Viajeros felices" },
  { value: "4.9", label: "Calificación promedio" },
];

const team = [
  {
    name: "Alejandro García",
    role: "Fundador & CEO",
    initials: "AG",
    description: "Viajero apasionado que creó chromaTravel para que todos puedan viajar con libertad.",
  },
  {
    name: "María López",
    role: "Directora de Experiencias",
    initials: "ML",
    description: "Curadora de las mejores experiencias LGBT+ en destinos alrededor del mundo.",
  },
  {
    name: "Carlos Mendoza",
    role: "Head de Partnerships",
    initials: "CM",
    description: "Construye relaciones con hoteles y proveedores comprometidos con la inclusión.",
  },
  {
    name: "Laura Sánchez",
    role: "Líder de Asesoría",
    initials: "LS",
    description: "Coordina a nuestro equipo de asesores expertos en viajes LGBT+.",
  },
];

export default function About() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navigation />
      <main className="flex-1">
        <section className="relative overflow-hidden py-20 md:py-32">
          <div className="absolute inset-0 gradient-primary opacity-10" />
          <div className="relative mx-auto max-w-7xl px-4 text-center md:px-8">
            <h1 className="font-display text-3xl font-bold md:text-4xl lg:text-5xl xl:text-6xl">
              Viaja con{" "}
              <span className="bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 bg-clip-text text-transparent">
                libertad
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
              Somos chromaTravelBoutique, la primera agencia de viajes en México
              especializada en experiencias LGBT+ premium. Creemos que todos
              merecen viajar siendo auténticamente ellos mismos.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link href="/hotels">
                <Button size="lg" className="gap-2" data-testid="button-explore-hotels">
                  Explorar hoteles
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline" data-testid="button-contact-us">
                  Contactar asesor
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="border-y bg-muted/30 py-12">
          <div className="mx-auto max-w-7xl px-4 md:px-8">
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="font-display text-3xl font-bold text-primary md:text-4xl">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="mx-auto max-w-7xl px-4 md:px-8">
            <div className="grid gap-12 md:grid-cols-2 md:items-center">
              <div>
                <h2 className="font-display text-2xl font-bold md:text-3xl lg:text-4xl">
                  Nuestra historia
                </h2>
                <div className="mt-6 space-y-4 text-muted-foreground">
                  <p>
                    chromaTravelBoutique nació de una experiencia personal. Después
                    de años viajando y enfrentando situaciones incómodas por ser
                    parte de la comunidad LGBT+, decidimos crear la solución que
                    siempre quisimos encontrar.
                  </p>
                  <p>
                    Empezamos en 2020 con una pequeña lista de hoteles verificados
                    en México. Hoy, colaboramos con más de 500 propiedades en 50
                    destinos alrededor del mundo, todas cuidadosamente evaluadas
                    para garantizar una experiencia segura y acogedora.
                  </p>
                  <p>
                    No somos solo otra agencia de viajes. Somos viajeros LGBT+ que
                    entienden tus necesidades porque las vivimos. Cada recomendación,
                    cada hotel, cada experiencia está pensada para que puedas
                    disfrutar siendo auténticamente tú.
                  </p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {values.map((value) => (
                  <Card key={value.title} className="p-6">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <value.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-display font-semibold">{value.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {value.description}
                    </p>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-muted/30 py-16 md:py-24">
          <div className="mx-auto max-w-7xl px-4 md:px-8">
            <div className="mb-12 text-center">
              <h2 className="font-display text-2xl font-bold md:text-3xl lg:text-4xl">
                Conoce al equipo
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
                Un equipo diverso y apasionado comprometido con crear las mejores
                experiencias de viaje para la comunidad LGBT+.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {team.map((member) => (
                <Card key={member.name} className="text-center">
                  <CardContent className="p-6">
                    <Avatar className="mx-auto h-20 w-20">
                      <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-2xl font-bold text-white">
                        {member.initials}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="mt-4 font-display font-semibold">{member.name}</h3>
                    <p className="text-sm text-primary">{member.role}</p>
                    <p className="mt-3 text-sm text-muted-foreground">
                      {member.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="mx-auto max-w-7xl px-4 md:px-8">
            <div className="mb-12 text-center">
              <h2 className="font-display text-2xl font-bold md:text-3xl lg:text-4xl">
                Nuestro compromiso
              </h2>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              <Card className="border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-900/20">
                <CardContent className="p-6">
                  <Award className="mb-4 h-10 w-10 text-purple-500" />
                  <h3 className="font-display font-semibold">Verificación rigurosa</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Cada hotel pasa por un proceso de verificación de 20+ puntos
                    para asegurar que cumple con nuestros estándares de inclusión.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-pink-200 bg-pink-50 dark:border-pink-800 dark:bg-pink-900/20">
                <CardContent className="p-6">
                  <Heart className="mb-4 h-10 w-10 text-pink-500" />
                  <h3 className="font-display font-semibold">Impacto social</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Donamos el 1% de nuestras ganancias a organizaciones que apoyan
                    los derechos LGBT+ en Latinoamérica.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-cyan-200 bg-cyan-50 dark:border-cyan-800 dark:bg-cyan-900/20">
                <CardContent className="p-6">
                  <Sparkles className="mb-4 h-10 w-10 text-cyan-500" />
                  <h3 className="font-display font-semibold">Mejora continua</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Escuchamos activamente el feedback de nuestra comunidad para
                    mejorar constantemente nuestros servicios.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
