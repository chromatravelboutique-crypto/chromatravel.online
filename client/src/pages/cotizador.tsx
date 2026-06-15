import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Sparkles, Search, Star, CalendarDays, Users, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SEOHead } from "@/components/seo-head";
import { useBrand } from "@/lib/brand-context";
import { apiRequest } from "@/lib/queryClient";

const schema = z.object({
  destino: z.string().optional(),
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
  personas: z.coerce.number().min(1).max(20).optional(),
  presupuesto: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Recommendation {
  blockId: number;
  hotelName: string;
  tipoHabitacion: string;
  reason: string;
  matchScore: number;
  highlights: string[];
  tarifaDoble: number;
  fechaInicio: string;
  habitacionesDisponibles: number;
}

export default function Cotizador() {
  const { brand } = useBrand();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (data: FormValues) =>
      apiRequest("POST", "/api/ai/smart-quote", { ...data, brandCode: brand?.code }),
    onSuccess: (data: any) => {
      setRecommendations(data.recommendations || []);
    },
  });

  const onSubmit = (data: FormValues) => mutate(data);

  const waBase = brand?.whatsappNumber
    ? `https://wa.me/${brand.whatsappNumber.replace(/\D/g, "")}`
    : "https://wa.me/524434044104";

  return (
    <>
      <SEOHead
        title={`Cotizador inteligente — ${brand?.name || "Chroma Travel"}`}
        description="Describe tu viaje ideal y nuestra IA te recomienda los mejores paquetes disponibles."
      />

      <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 py-12">
        <div className="mx-auto max-w-4xl px-4">
          <div className="mb-10 text-center">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
              <Sparkles className="h-4 w-4" />
              Cotizador con IA
            </div>
            <h1 className="font-display text-3xl font-bold sm:text-4xl">
              Encuentra tu viaje ideal
            </h1>
            <p className="mt-3 text-muted-foreground">
              Cuéntanos qué buscas y nuestra inteligencia artificial selecciona los mejores paquetes para ti.
            </p>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                ¿A dónde quieres ir?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor="destino">Destino</Label>
                    <Input id="destino" placeholder="Ej. Cancún, Los Cabos..." {...register("destino")} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="presupuesto">Presupuesto aproximado</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input id="presupuesto" className="pl-9" placeholder="Ej. $15,000 MXN por persona" {...register("presupuesto")} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="checkIn">Fecha de entrada</Label>
                    <div className="relative">
                      <CalendarDays className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input id="checkIn" type="date" className="pl-9" {...register("checkIn")} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="checkOut">Fecha de salida</Label>
                    <div className="relative">
                      <CalendarDays className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input id="checkOut" type="date" className="pl-9" {...register("checkOut")} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="personas">Número de personas</Label>
                    <div className="relative">
                      <Users className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input id="personas" type="number" min={1} max={20} className="pl-9" placeholder="2" {...register("personas")} />
                    </div>
                    {errors.personas && <p className="text-xs text-destructive">{errors.personas.message}</p>}
                  </div>
                </div>

                <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
                  {isPending ? (
                    <>
                      <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                      Analizando opciones...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Buscar con IA
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {isPending && (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="mb-3 h-5 w-48" />
                    <Skeleton className="mb-2 h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {!isPending && recommendations.length > 0 && (
            <div className="space-y-4">
              <h2 className="font-display text-xl font-semibold flex items-center gap-2">
                <Star className="h-5 w-5 text-amber-500" />
                Recomendado para ti
              </h2>
              {recommendations.map((rec, idx) => (
                <Card key={rec.blockId} className={idx === 0 ? "border-primary shadow-md" : ""}>
                  {idx === 0 && (
                    <div className="rounded-t-lg bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground">
                      Mejor opción
                    </div>
                  )}
                  <CardContent className="p-6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex-1">
                        <h3 className="font-display text-lg font-bold">{rec.hotelName}</h3>
                        <p className="text-sm text-muted-foreground">{rec.tipoHabitacion}</p>
                        <p className="mt-2 text-sm">{rec.reason}</p>
                        {rec.highlights.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {rec.highlights.map((h) => (
                              <Badge key={h} variant="secondary" className="text-xs">{h}</Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">
                          ${(rec.tarifaDoble * 2).toLocaleString("es-MX")}
                        </p>
                        <p className="text-xs text-muted-foreground">por noche (doble)</p>
                        <Badge variant="outline" className="mt-1 text-xs">
                          Match {rec.matchScore}%
                        </Badge>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {rec.habitacionesDisponibles} hab. disponibles
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex gap-3">
                      <a
                        href={`${waBase}?text=${encodeURIComponent(`Hola! Me interesa el paquete en ${rec.hotelName} (check-in ${rec.fechaInicio}). ¿Pueden darme más información?`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button size="sm">Cotizar por WhatsApp</Button>
                      </a>
                      <a href="/bloqueos">
                        <Button variant="outline" size="sm">Ver todos los paquetes</Button>
                      </a>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {!isPending && recommendations.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">
              <Sparkles className="mx-auto mb-3 h-10 w-10 opacity-30" />
              <p>Completa el formulario y nuestra IA te recomendará los mejores paquetes disponibles.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
