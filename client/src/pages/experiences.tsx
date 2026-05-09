import { useEffect, useRef } from "react";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { Compass, Sparkles, Shield, Heart } from "lucide-react";

export default function Experiences() {
  const widgetContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadCivitatis = () => {
      const existingScript = document.querySelector('script[src*="iframeResizer"]');
      if (existingScript) return;

      const script = document.createElement("script");
      script.src = "https://www.civitatis.com/f/js/vendor/iframeResizer.min.js";
      script.async = true;
      script.onload = () => {
        if ((window as any).iFrameResize) {
          (window as any).iFrameResize(
            {
              checkOrigin: false,
              initCallback: function (iframe: HTMLIFrameElement) {
                setTimeout(function () {
                  const resizeEvent = window.document.createEvent("UIEvents");
                  resizeEvent.initUIEvent("resize", true, false, window, 0);
                  iframe.dispatchEvent(resizeEvent);
                });
              },
            },
            ".civitatis-iframe"
          );
        }
      };
      document.head.appendChild(script);
    };

    loadCivitatis();
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <Navigation />
      <main className="flex-1">
        <section className="relative bg-gradient-to-br from-chroma-magenta/20 via-background to-chroma-indigo/20 py-16 md:py-24">
          <div className="mx-auto max-w-7xl px-4 md:px-8">
            <div className="text-center">
              <h1 className="font-display text-4xl font-bold md:text-5xl lg:text-6xl">
                Experiencias <span className="text-chroma-magenta">Inolvidables</span>
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground md:text-xl">
                Descubre tours, actividades y experiencias únicas en los destinos más 
                LGBT-friendly del mundo. Cada aventura está diseñada pensando en ti.
              </p>
            </div>
          </div>
        </section>

        <section className="py-12 md:py-16">
          <div className="mx-auto max-w-7xl px-4 md:px-8">
            <div className="mb-12 grid gap-6 md:grid-cols-4">
              <div className="flex items-start gap-3 rounded-lg border bg-card p-4">
                <div className="rounded-full bg-chroma-magenta/10 p-2">
                  <Shield className="h-5 w-5 text-chroma-magenta" />
                </div>
                <div>
                  <h3 className="font-semibold">Espacios Seguros</h3>
                  <p className="text-sm text-muted-foreground">Experiencias verificadas LGBT-friendly</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg border bg-card p-4">
                <div className="rounded-full bg-chroma-emerald/10 p-2">
                  <Compass className="h-5 w-5 text-chroma-emerald" />
                </div>
                <div>
                  <h3 className="font-semibold">Guías Locales</h3>
                  <p className="text-sm text-muted-foreground">Conoce cada destino a fondo</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg border bg-card p-4">
                <div className="rounded-full bg-chroma-gold/10 p-2">
                  <Sparkles className="h-5 w-5 text-chroma-gold" />
                </div>
                <div>
                  <h3 className="font-semibold">Experiencias Únicas</h3>
                  <p className="text-sm text-muted-foreground">Momentos que recordarás siempre</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg border bg-card p-4">
                <div className="rounded-full bg-chroma-coral/10 p-2">
                  <Heart className="h-5 w-5 text-chroma-coral" />
                </div>
                <div>
                  <h3 className="font-semibold">Comunidad</h3>
                  <p className="text-sm text-muted-foreground">Viaja con personas como tú</p>
                </div>
              </div>
            </div>

            <div className="mb-8 text-center">
              <h2 className="font-display text-2xl font-bold md:text-3xl">
                Tours y Actividades Disponibles
              </h2>
              <p className="mt-2 text-muted-foreground">
                Reserva directamente y asegura tu lugar en las mejores experiencias
              </p>
            </div>

            <div 
              ref={widgetContainerRef}
              className="rounded-lg border bg-card p-4 md:p-6"
              data-testid="civitatis-widget-container"
            >
              <iframe
                className="civitatis-iframe"
                src="https://www.civitatis.com/widget-activities/?agencyId=55630&agencyUserId=62843&display=cosy&cant=6&lang=mx&currency=MXN&transfer=1&cmp=Widget_MX&width=100%&hideButton=0&centerContent=1&typeSelection=all&color=ed07f7&typography=Josefin+Sans&removeBackground=1&showShadow=1&roundedButtons=1"
                width="100%"
                frameBorder="0"
                data-maxwidth="100%"
                style={{ maxWidth: "100%", minHeight: "600px" }}
                title="Experiencias Civitatis"
                data-testid="iframe-civitatis"
              />
            </div>
          </div>
        </section>

        <section className="bg-muted/50 py-12 md:py-16">
          <div className="mx-auto max-w-7xl px-4 text-center md:px-8">
            <h2 className="font-display text-2xl font-bold md:text-3xl">
              ¿Necesitas ayuda para planificar?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Nuestro equipo de expertos en viajes LGBT+ está listo para ayudarte 
              a crear la experiencia perfecta.
            </p>
            <a 
              href="/contact" 
              className="mt-6 inline-flex items-center gap-2 rounded-md bg-chroma-magenta px-6 py-3 font-medium text-white transition-colors hover:bg-chroma-magenta/90"
              data-testid="link-contact-experiences"
            >
              Contáctanos
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
