import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useBrand } from "@/lib/brand-context";
import { Shield, CheckCircle, Phone, MapPin, Calendar, Users, Plane, Hospital, Luggage, Clock } from "lucide-react";

const seguroSchema = z.object({
  nombre:     z.string().min(2, "Nombre requerido"),
  email:      z.string().email("Email inválido"),
  telefono:   z.string().min(8, "Teléfono requerido"),
  destino:    z.string().min(2, "Destino requerido"),
  fechaViaje: z.string().min(3, "Fecha requerida"),
  viajeros:   z.coerce.number().int().min(1, "Mínimo 1 viajero"),
});

type SeguroForm = z.infer<typeof seguroSchema>;

const PLANES = [
  {
    nombre: "Básico",
    precio: "desde $299 MXN",
    color: "#6b7280",
    coberturas: [
      "Gastos médicos por accidente (hasta $50,000 USD)",
      "Cancelación por enfermedad grave",
      "Pérdida de equipaje (hasta $500 USD)",
      "Asistencia telefónica 24/7",
    ],
  },
  {
    nombre: "Plus",
    precio: "desde $599 MXN",
    color: "#3b82f6",
    popular: true,
    coberturas: [
      "Gastos médicos completos (hasta $150,000 USD)",
      "Cancelación por cualquier causa",
      "Pérdida y retraso de equipaje (hasta $2,000 USD)",
      "Retraso de vuelo (>3 horas)",
      "Responsabilidad civil (hasta $100,000 USD)",
      "Asistencia 24/7 en español",
    ],
  },
  {
    nombre: "Premium",
    precio: "desde $999 MXN",
    color: "#f59e0b",
    coberturas: [
      "Gastos médicos ilimitados",
      "Cancelación y modificación sin límite",
      "Equipaje ilimitado",
      "Repatriación sanitaria",
      "Accidentes personales (hasta $25,000 USD)",
      "Covid-19 cubierto",
      "Deportes de aventura incluidos",
      "Concierge de viaje personal",
    ],
  },
];

const COBERTURAS_DESTACADAS = [
  { icon: Hospital, texto: "Gastos médicos en el extranjero" },
  { icon: Plane, texto: "Cancelación y retraso de vuelo" },
  { icon: Luggage, texto: "Pérdida o robo de equipaje" },
  { icon: Clock, texto: "Asistencia 24 horas en español" },
];

export default function SegurosViaje() {
  const { brand } = useBrand();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const primaryColor = brand?.primaryColor || "#10b981";

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SeguroForm>({
    resolver: zodResolver(seguroSchema),
  });

  async function onSubmit(values: SeguroForm) {
    setError("");
    try {
      const res = await fetch("/api/leads/seguro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error("Error al enviar");
      setSent(true);
    } catch {
      setError("Ocurrió un error. Por favor contáctanos por WhatsApp.");
    }
  }

  if (sent) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navigation />
        <main className="flex-1 flex items-center justify-center py-24 px-4">
          <div className="text-center max-w-md">
            <CheckCircle className="mx-auto mb-4 h-16 w-16 text-green-500" />
            <h2 className="text-2xl font-bold mb-2">¡Solicitud recibida!</h2>
            <p className="text-muted-foreground">
              Un asesor de seguros te enviará las opciones y cotización en menos de 2 horas.
            </p>
            {brand?.whatsappNumber && (
              <a
                href={`https://wa.me/${brand.whatsappNumber.replace(/\D/g, "")}?text=${encodeURIComponent("Hola, quiero cotizar un seguro de viaje")}`}
                className="mt-6 inline-block rounded-lg px-6 py-3 text-white font-semibold"
                style={{ background: primaryColor }}
              >
                Hablar por WhatsApp ahora
              </a>
            )}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navigation />
      <main className="flex-1">
        {/* Hero */}
        <section className="py-16 md:py-20" style={{ background: `linear-gradient(135deg, ${primaryColor}22, transparent)` }}>
          <div className="mx-auto max-w-3xl px-4 text-center">
            <div
              className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium mb-4"
              style={{ background: `${primaryColor}22`, color: primaryColor }}
            >
              <Shield className="h-4 w-4" /> Seguros de Viaje
            </div>
            <h1 className="text-3xl md:text-5xl font-bold mb-4">
              Viaja Protegido desde $299 MXN
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Protege tu viaje contra imprevistos: cancelaciones, emergencias médicas, pérdida de equipaje y más.
              Cobertura para México e internacional.
            </p>
            {brand?.whatsappNumber && (
              <a
                href={`https://wa.me/${brand.whatsappNumber.replace(/\D/g, "")}?text=${encodeURIComponent("Hola, quiero cotizar un seguro de viaje")}`}
                className="mt-6 inline-flex items-center gap-2 rounded-lg px-6 py-3 text-white font-semibold"
                style={{ background: primaryColor }}
              >
                <Phone className="h-4 w-4" />
                Cotizar por WhatsApp
              </a>
            )}
          </div>
        </section>

        {/* ¿Qué cubre? */}
        <section className="py-12">
          <div className="mx-auto max-w-4xl px-4">
            <h2 className="text-2xl font-bold text-center mb-8">¿Qué cubre tu seguro de viaje?</h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
              {COBERTURAS_DESTACADAS.map(({ icon: Icon, texto }) => (
                <div key={texto} className="rounded-xl border bg-card p-4 text-center">
                  <Icon className="mx-auto mb-2 h-8 w-8" style={{ color: primaryColor }} />
                  <p className="text-sm font-medium">{texto}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Planes */}
        <section className="py-12 bg-muted/30">
          <div className="mx-auto max-w-5xl px-4">
            <h2 className="text-2xl font-bold text-center mb-8">Planes disponibles</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {PLANES.map((plan) => (
                <div
                  key={plan.nombre}
                  className={`rounded-2xl border bg-card p-6 relative ${plan.popular ? "ring-2 ring-blue-400" : ""}`}
                >
                  {plan.popular && (
                    <div
                      className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 text-xs font-bold text-white"
                      style={{ background: plan.color }}
                    >
                      Más popular
                    </div>
                  )}
                  <h3 className="text-lg font-bold mb-1" style={{ color: plan.color }}>
                    {plan.nombre}
                  </h3>
                  <p className="text-2xl font-bold mb-4">{plan.precio}</p>
                  <ul className="space-y-2">
                    {plan.coberturas.map((c) => (
                      <li key={c} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 shrink-0 mt-0.5 text-green-500" />
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <p className="text-center text-xs text-muted-foreground mt-4">
              * Precios orientativos por persona. La cotización exacta depende del destino, duración y número de viajeros.
            </p>
          </div>
        </section>

        {/* Formulario */}
        <section className="py-16">
          <div className="mx-auto max-w-xl px-4">
            <div className="rounded-2xl border bg-card p-8 shadow-sm">
              <h2 className="text-xl font-bold mb-2">Cotiza tu seguro gratis</h2>
              <p className="text-sm text-muted-foreground mb-6">Recibe opciones personalizadas en menos de 2 horas.</p>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="s-nombre">Nombre completo *</Label>
                    <Input id="s-nombre" placeholder="Tu nombre" {...register("nombre")} />
                    {errors.nombre && <p className="text-xs text-destructive">{errors.nombre.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="s-telefono">WhatsApp *</Label>
                    <Input id="s-telefono" placeholder="+52 443 000 0000" {...register("telefono")} />
                    {errors.telefono && <p className="text-xs text-destructive">{errors.telefono.message}</p>}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="s-email">Email *</Label>
                  <Input id="s-email" type="email" placeholder="tu@email.com" {...register("email")} />
                  {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="s-destino"><MapPin className="inline h-3.5 w-3.5 mr-1" />Destino *</Label>
                    <Input id="s-destino" placeholder="Cancún, Europa, EUA..." {...register("destino")} />
                    {errors.destino && <p className="text-xs text-destructive">{errors.destino.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="s-viajeros"><Users className="inline h-3.5 w-3.5 mr-1" />Viajeros *</Label>
                    <Input id="s-viajeros" type="number" min={1} placeholder="2" {...register("viajeros")} />
                    {errors.viajeros && <p className="text-xs text-destructive">{errors.viajeros.message}</p>}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="s-fecha"><Calendar className="inline h-3.5 w-3.5 mr-1" />Fecha del viaje *</Label>
                  <Input id="s-fecha" placeholder="Julio 2025, 15 al 22 agosto..." {...register("fechaViaje")} />
                  {errors.fechaViaje && <p className="text-xs text-destructive">{errors.fechaViaje.message}</p>}
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button
                  type="submit"
                  size="lg"
                  className="w-full text-white"
                  style={{ background: primaryColor }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Enviando..." : "Solicitar cotización gratuita"}
                </Button>
              </form>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
