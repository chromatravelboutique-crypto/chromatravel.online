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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBrand } from "@/lib/brand-context";
import { Heart, MapPin, Calendar, DollarSign, Users, CheckCircle } from "lucide-react";

const bodaSchema = z.object({
  novios:         z.string().min(2, "Nombre requerido"),
  telefono:       z.string().min(8, "Teléfono requerido"),
  email:          z.string().email("Email inválido"),
  destino:        z.string().min(2, "Destino requerido"),
  fechaTentativa: z.string().min(3, "Fecha requerida"),
  invitados:      z.coerce.number().int().min(1, "Ingresa el número de invitados"),
  presupuesto:    z.string().min(1, "Presupuesto requerido"),
  hotelEnMente:   z.string().optional(),
  comentarios:    z.string().optional(),
});

type BodaForm = z.infer<typeof bodaSchema>;

const DESTINOS = ["Cancún / Riviera Maya", "Los Cabos", "Puerto Vallarta", "Huatulco", "Otro"];

export default function Bodas() {
  const { brand } = useBrand();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const primaryColor = brand?.primaryColor || "#b45309";

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<BodaForm>({
    resolver: zodResolver(bodaSchema),
  });

  async function onSubmit(values: BodaForm) {
    setError("");
    try {
      const res = await fetch("/api/leads/boda", {
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
              Un wedding planner especializado se pondrá en contacto contigo en las próximas horas
              para platicar los detalles de tu boda soñada.
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
              <Heart className="h-4 w-4" /> Bodas en Destino
            </div>
            <h1 className="text-3xl md:text-5xl font-bold mb-4">
              Tu Boda Perfecta en el Destino de tus Sueños
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Coordinamos cada detalle: ceremonia, banquete, hospedaje de invitados, traslados
              y luna de miel. Un wedding planner dedicado desde la primera llamada.
            </p>
          </div>
        </section>

        <section className="py-16">
          <div className="mx-auto max-w-2xl px-4">
            <div className="rounded-2xl border bg-card p-8 shadow-sm">
              <h2 className="text-xl font-bold mb-6">Cuéntanos sobre tu boda soñada</h2>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="novios">Nombres de los novios *</Label>
                    <Input id="novios" placeholder="Ana y Carlos" {...register("novios")} />
                    {errors.novios && <p className="text-xs text-destructive">{errors.novios.message}</p>}
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

                <div className="space-y-1.5">
                  <Label><MapPin className="inline h-3.5 w-3.5 mr-1" />Destino deseado *</Label>
                  <Select onValueChange={(v) => setValue("destino", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un destino" />
                    </SelectTrigger>
                    <SelectContent>
                      {DESTINOS.map((d) => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.destino && <p className="text-xs text-destructive">{errors.destino.message}</p>}
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="fechaTentativa"><Calendar className="inline h-3.5 w-3.5 mr-1" />Fecha tentativa *</Label>
                    <Input id="fechaTentativa" placeholder="Diciembre 2025, Febrero 2026..." {...register("fechaTentativa")} />
                    {errors.fechaTentativa && <p className="text-xs text-destructive">{errors.fechaTentativa.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="invitados"><Users className="inline h-3.5 w-3.5 mr-1" />Número de invitados *</Label>
                    <Input id="invitados" type="number" min={1} placeholder="50" {...register("invitados")} />
                    {errors.invitados && <p className="text-xs text-destructive">{errors.invitados.message}</p>}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="presupuesto"><DollarSign className="inline h-3.5 w-3.5 mr-1" />Presupuesto total estimado *</Label>
                  <Input id="presupuesto" placeholder="$150,000 - $300,000 MXN" {...register("presupuesto")} />
                  {errors.presupuesto && <p className="text-xs text-destructive">{errors.presupuesto.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="hotelEnMente">¿Ya tienen hotel en mente?</Label>
                  <Input id="hotelEnMente" placeholder="Hotel Xcaret, Dreams Riviera Maya, sin preferencia..." {...register("hotelEnMente")} />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="comentarios">Comentarios adicionales</Label>
                  <Textarea id="comentarios" rows={3} placeholder="Ceremonia civil o simbólica, tradiciones especiales, requerimientos..." {...register("comentarios")} />
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}

                <Button type="submit" size="lg" className="w-full text-white" style={{ background: primaryColor }} disabled={isSubmitting}>
                  {isSubmitting ? "Enviando..." : "Solicitar información para mi boda"}
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
