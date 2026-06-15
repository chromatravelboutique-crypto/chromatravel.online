import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useBrand } from "@/lib/brand-context";
import { Users, MapPin, Calendar, DollarSign, CheckCircle } from "lucide-react";

const grupoSchema = z.object({
  nombre:         z.string().min(2, "Nombre requerido"),
  telefono:       z.string().min(8, "Teléfono requerido"),
  email:          z.string().email("Email inválido"),
  destino:        z.string().min(2, "Destino requerido"),
  personas:       z.coerce.number().int().min(15, "Mínimo 15 personas"),
  fechaAprox:     z.string().min(3, "Fecha requerida"),
  presupuestoPax: z.string().min(1, "Presupuesto requerido"),
  comentarios:    z.string().optional(),
});

type GrupoForm = z.infer<typeof grupoSchema>;

export default function Grupos() {
  const { brand } = useBrand();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const primaryColor = brand?.primaryColor || "#10b981";

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<GrupoForm>({
    resolver: zodResolver(grupoSchema),
  });

  async function onSubmit(values: GrupoForm) {
    setError("");
    try {
      const res = await fetch("/api/leads/grupo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error("Error al enviar");
      setSent(true);
    } catch {
      setError("Ocurrió un error. Por favor intenta de nuevo o contáctanos por WhatsApp.");
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
              Un asesor especializado en grupos se pondrá en contacto contigo en las próximas horas.
            </p>
            {brand?.whatsappNumber && (
              <a
                href={`https://wa.me/${brand.whatsappNumber.replace(/\D/g, "")}`}
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
        <section className="py-16 md:py-20" style={{ background: `linear-gradient(135deg, ${primaryColor}22, transparent)` }}>
          <div className="mx-auto max-w-3xl px-4 text-center">
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium mb-4"
              style={{ background: `${primaryColor}22`, color: primaryColor }}>
              <Users className="h-4 w-4" /> Grupos 15+ personas
            </div>
            <h1 className="text-3xl md:text-5xl font-bold mb-4">
              Viajes en Grupo sin Complicaciones
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Coordinamos todo: vuelos, hotel, traslados y actividades para grupos de 15 a 500 personas.
              Tarifas exclusivas y un coordinador dedicado.
            </p>
          </div>
        </section>

        <section className="py-16">
          <div className="mx-auto max-w-2xl px-4">
            <div className="rounded-2xl border bg-card p-8 shadow-sm">
              <h2 className="text-xl font-bold mb-6">Cuéntanos sobre tu grupo</h2>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="nombre">Nombre completo *</Label>
                    <Input id="nombre" placeholder="Tu nombre" {...register("nombre")} />
                    {errors.nombre && <p className="text-xs text-destructive">{errors.nombre.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="telefono">WhatsApp *</Label>
                    <Input id="telefono" placeholder="+52 443 000 0000" {...register("telefono")} />
                    {errors.telefono && <p className="text-xs text-destructive">{errors.telefono.message}</p>}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email">Email *</Label>
                  <Input id="email" type="email" placeholder="tu@email.com" {...register("email")} />
                  {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="destino"><MapPin className="inline h-3.5 w-3.5 mr-1" />Destino de interés *</Label>
                    <Input id="destino" placeholder="Cancún, Los Cabos, Riviera Maya..." {...register("destino")} />
                    {errors.destino && <p className="text-xs text-destructive">{errors.destino.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="personas"><Users className="inline h-3.5 w-3.5 mr-1" />Número de personas * (mín. 15)</Label>
                    <Input id="personas" type="number" min={15} placeholder="25" {...register("personas")} />
                    {errors.personas && <p className="text-xs text-destructive">{errors.personas.message}</p>}
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="fechaAprox"><Calendar className="inline h-3.5 w-3.5 mr-1" />Fecha aproximada *</Label>
                    <Input id="fechaAprox" placeholder="Octubre 2025, Semana Santa..." {...register("fechaAprox")} />
                    {errors.fechaAprox && <p className="text-xs text-destructive">{errors.fechaAprox.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="presupuestoPax"><DollarSign className="inline h-3.5 w-3.5 mr-1" />Presupuesto por persona *</Label>
                    <Input id="presupuestoPax" placeholder="$5,000 - $10,000 MXN" {...register("presupuestoPax")} />
                    {errors.presupuestoPax && <p className="text-xs text-destructive">{errors.presupuestoPax.message}</p>}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="comentarios">Comentarios adicionales</Label>
                  <Textarea id="comentarios" rows={3} placeholder="Tipo de evento, requerimientos especiales, preferencias..." {...register("comentarios")} />
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}

                <Button type="submit" size="lg" className="w-full text-white" style={{ background: primaryColor }} disabled={isSubmitting}>
                  {isSubmitting ? "Enviando..." : "Solicitar cotización para mi grupo"}
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  Te contactamos en menos de 2 horas en horario de oficina.
                </p>
              </form>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
