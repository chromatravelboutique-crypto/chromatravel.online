import { MapPin, Phone, Mail, Clock, MessageCircle } from "lucide-react";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { LeadForm } from "@/components/lead-form";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const contactInfo = [
  {
    icon: MapPin,
    title: "Ubicación",
    details: ["Morelia, Michoacán", "México"],
  },
  {
    icon: Phone,
    title: "Teléfono / WhatsApp",
    details: ["+52 443 404 4104"],
  },
  {
    icon: Mail,
    title: "Email",
    details: ["contacto@chromatravel.online"],
  },
  {
    icon: Clock,
    title: "Horario",
    details: ["Lunes a Viernes: 9:00 - 19:00", "Sábados: 10:00 - 14:00"],
  },
];

export default function Contact() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navigation />
      <main className="flex-1">
        <section className="bg-muted/30 py-16 md:py-24">
          <div className="mx-auto max-w-7xl px-4 text-center md:px-8">
            <h1 className="font-display text-3xl font-bold md:text-4xl lg:text-5xl">
              Hablemos de tu próximo viaje
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              Estamos aquí para ayudarte a planear la experiencia de viaje perfecta.
              Contáctanos por el medio que prefieras.
            </p>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="mx-auto max-w-7xl px-4 md:px-8">
            <div className="grid gap-12 lg:grid-cols-2">
              <div className="space-y-8">
                <div>
                  <h2 className="font-display text-2xl font-bold md:text-3xl">
                    Información de contacto
                  </h2>
                  <p className="mt-2 text-muted-foreground">
                    Elige el canal que más te convenga para comunicarte con nosotros.
                  </p>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  {contactInfo.map((item) => (
                    <Card key={item.title}>
                      <CardContent className="flex gap-4 p-6">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                          <item.icon className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium">{item.title}</h3>
                          {item.details.map((detail, i) => (
                            <p key={i} className="text-sm text-muted-foreground">
                              {detail}
                            </p>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
                  <CardContent className="flex flex-col items-center gap-4 p-6 text-center sm:flex-row sm:text-left">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-green-500">
                      <MessageCircle className="h-8 w-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-display font-semibold">
                        ¿Prefieres WhatsApp?
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Escríbenos directamente y un asesor te responderá en minutos.
                      </p>
                    </div>
                    <a
                      href="https://wa.me/524434044104"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button className="gap-2 bg-green-500" data-testid="button-whatsapp">
                        <MessageCircle className="h-4 w-4" />
                        Abrir WhatsApp
                      </Button>
                    </a>
                  </CardContent>
                </Card>

                <div className="overflow-hidden rounded-xl border">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d60209.07499355392!2d-101.22425795!3d19.70077845!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x842d0ba2b29da7c1%3A0x4c8e2fd7b8e0fd2b!2sMorelia%2C%20Michoac%C3%A1n!5e0!3m2!1ses!2smx!4v1701900000000!5m2!1ses!2smx"
                    width="100%"
                    height="300"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Ubicación de chromaTravel"
                  />
                </div>
              </div>

              <div>
                <LeadForm
                  title="Solicita información"
                  description="Cuéntanos sobre tu viaje ideal y un asesor te contactará pronto."
                />
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
