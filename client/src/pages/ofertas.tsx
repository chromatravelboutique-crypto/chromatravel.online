import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Calendar,
  Tag,
  Clock,
  ArrowRight,
  Send,
  CheckCircle,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  Flame,
  BedDouble,
  Search,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { SEOHead } from "@/components/seo-head";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Tarifa {
  hotel: string;
  roomType: string;
  checkIn: string;
  checkOut: string;
  priceDouble: string;
  priceSingle: string;
  priceTriple: string;
  priceQuad: string;
  availability: number | null;
  notes: string | null;
}

interface TarifasResponse {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hotels: string[];
  tarifas: Tarifa[];
}

const leadSchema = z.object({
  name: z.string().min(2, "El nombre es requerido"),
  email: z.string().email("Email inválido"),
  phone: z.string().optional(),
  marketingConsent: z.boolean().default(false),
});

type LeadFormValues = z.infer<typeof leadSchema>;

function formatPrice(price: string | number | null): string {
  if (!price) return "-";
  const num = typeof price === "string" ? parseFloat(price) : price;
  return `$${num.toLocaleString("es-MX", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} MXN`;
}

function formatDate(dateStr: string): string {
  try {
    const clean = dateStr.split("T")[0];
    const date = new Date(clean + "T12:00:00");
    return format(date, "dd MMM yyyy", { locale: es });
  } catch {
    return dateStr;
  }
}

function formatDateShort(dateStr: string): string {
  try {
    const clean = dateStr.split("T")[0];
    const date = new Date(clean + "T12:00:00");
    return format(date, "dd MMM", { locale: es });
  } catch {
    return dateStr;
  }
}

function getNights(checkIn: string, checkOut: string): number {
  const d1 = new Date(checkIn);
  const d2 = new Date(checkOut);
  return Math.max(1, Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)));
}

function TarifaCardFull({ tarifa, onConsultar }: { tarifa: Tarifa; onConsultar: (t: Tarifa) => void }) {
  const nights = getNights(tarifa.checkIn, tarifa.checkOut);
  const price = parseFloat(tarifa.priceDouble);
  const pricePerNight = Math.round(price / nights);

  return (
    <Card className="overflow-visible transition-shadow duration-200 hover:shadow-lg" data-testid={`card-oferta-${tarifa.hotel.replace(/\s+/g, "-").toLowerCase()}`}>
      <CardContent className="p-0">
        <div className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-4 pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-semibold leading-tight" data-testid="text-oferta-hotel">
                {tarifa.hotel}
              </h3>
              <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <BedDouble className="h-3 w-3 shrink-0" />
                <span>{tarifa.roomType}</span>
              </div>
            </div>
            <Badge variant="secondary" className="shrink-0 text-xs">
              <Clock className="mr-1 h-3 w-3" />
              {nights} {nights === 1 ? "noche" : "noches"}
            </Badge>
          </div>
        </div>

        <div className="space-y-3 p-4 pt-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 shrink-0" />
            <span>
              {formatDate(tarifa.checkIn)} — {formatDate(tarifa.checkOut)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
            <div className="rounded-md border p-2 text-center">
              <p className="text-muted-foreground">Sencilla</p>
              <p className="font-semibold">{tarifa.priceSingle ? formatPrice(tarifa.priceSingle) : "-"}</p>
            </div>
            <div className="rounded-md border border-primary/30 bg-primary/5 p-2 text-center">
              <p className="text-muted-foreground">Doble</p>
              <p className="font-semibold">{formatPrice(tarifa.priceDouble)}</p>
            </div>
            <div className="rounded-md border p-2 text-center">
              <p className="text-muted-foreground">Triple</p>
              <p className="font-semibold">{tarifa.priceTriple ? formatPrice(tarifa.priceTriple) : "-"}</p>
            </div>
            <div className="rounded-md border p-2 text-center">
              <p className="text-muted-foreground">Cuádruple</p>
              <p className="font-semibold">{tarifa.priceQuad ? formatPrice(tarifa.priceQuad) : "-"}</p>
            </div>
          </div>

          {tarifa.notes && (
            <p className="text-xs text-muted-foreground/80">
              {tarifa.notes}
            </p>
          )}

          <div className="flex items-end justify-between gap-2 pt-1">
            <div>
              <p className="text-xs text-muted-foreground">Desde</p>
              <p className="text-xl font-bold tracking-tight" data-testid="text-oferta-price">
                {formatPrice(tarifa.priceDouble)}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatPrice(pricePerNight)} / noche · Occ. doble
              </p>
            </div>
            <Button
              onClick={() => onConsultar(tarifa)}
              className="gap-2"
              data-testid="button-consultar-oferta"
            >
              Consultar Disponibilidad
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function LeadCaptureDialog({
  open,
  onOpenChange,
  tarifa,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tarifa: Tarifa | null;
}) {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
    defaultValues: { name: "", email: "", phone: "", marketingConsent: false },
  });

  const onSubmit = async (data: LeadFormValues) => {
    if (!tarifa) return;
    try {
      const nights = getNights(tarifa.checkIn, tarifa.checkOut);
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          destination: tarifa.hotel,
          travelDates: `${formatDateShort(tarifa.checkIn)} - ${formatDateShort(tarifa.checkOut)} (${nights} noches)`,
          message: `Interesado en tarifa especial: ${tarifa.hotel} - ${tarifa.roomType} - ${formatPrice(tarifa.priceDouble)} - ${tarifa.notes || ""}`,
          source: "tarifas-especiales",
        }),
      });
      if (response.ok) {
        setIsSubmitted(true);
        toast({
          title: "Solicitud enviada",
          description: "Un asesor te contactará pronto con la disponibilidad.",
        });
      } else {
        throw new Error("Error");
      }
    } catch {
      toast({
        title: "Error",
        description: "No pudimos enviar tu solicitud. Intenta de nuevo.",
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setIsSubmitted(false);
      form.reset();
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {isSubmitted ? (
          <div className="py-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle className="h-7 w-7 text-green-600" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">Solicitud enviada</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Un asesor revisará la disponibilidad y te contactará pronto.
            </p>
            <div className="flex justify-center gap-3">
              <a href="https://wa.me/524434044104" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="gap-2">
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </Button>
              </a>
              <Button onClick={handleClose} data-testid="button-close-oferta-dialog">Cerrar</Button>
            </div>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Consultar Disponibilidad</DialogTitle>
              <DialogDescription>
                {tarifa && (
                  <span className="block mt-1">
                    <strong>{tarifa.hotel}</strong> — {tarifa.roomType}
                    <br />
                    {formatDateShort(tarifa.checkIn)} al {formatDateShort(tarifa.checkOut)} · {formatPrice(tarifa.priceDouble)}
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre</FormLabel>
                      <FormControl>
                        <Input placeholder="Tu nombre completo" {...field} data-testid="input-oferta-lead-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="tu@email.com" {...field} data-testid="input-oferta-lead-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teléfono</FormLabel>
                        <FormControl>
                          <Input placeholder="+52 55 1234 5678" {...field} data-testid="input-oferta-lead-phone" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="marketingConsent"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} data-testid="checkbox-oferta-consent" />
                      </FormControl>
                      <div className="leading-none">
                        <FormLabel className="text-xs font-normal text-muted-foreground">
                          Acepto recibir ofertas y novedades por email
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full gap-2" disabled={form.formState.isSubmitting} data-testid="button-submit-oferta-lead">
                  {form.formState.isSubmitting ? "Enviando..." : (
                    <>
                      <Send className="h-4 w-4" />
                      Consultar Disponibilidad
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function Ofertas() {
  const [page, setPage] = useState(1);
  const [hotelFilter, setHotelFilter] = useState("");
  const [selectedTarifa, setSelectedTarifa] = useState<Tarifa | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data, isLoading } = useQuery<TarifasResponse>({
    queryKey: ["/api/tarifas-especiales", page, hotelFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: "12" });
      if (hotelFilter) params.set("hotel", hotelFilter);
      const res = await fetch(`/api/tarifas-especiales?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const handleConsultar = (tarifa: Tarifa) => {
    setSelectedTarifa(tarifa);
    setDialogOpen(true);
  };

  const handleHotelFilter = (value: string) => {
    setHotelFilter(value === "all" ? "" : value);
    setPage(1);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <SEOHead
        title="Tarifas Especiales — Ofertas Exclusivas en Hoteles"
        description="Tarifas negociadas exclusivas en hoteles seleccionados. Disponibilidad limitada. Precios que no encontrarás en buscadores convencionales."
        keywords={["tarifas especiales", "ofertas hoteles", "descuentos hoteles", "viajes baratos México", "ofertas exclusivas"]}
      />
      <Navigation />
      <main className="flex-1">
        <section className="border-b bg-gradient-to-b from-primary/5 to-transparent py-12 md:py-16">
          <div className="mx-auto max-w-7xl px-4 md:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border bg-primary/5 px-4 py-1.5">
                <Flame className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">Ofertas Exclusivas</span>
              </div>
              <h1 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl" data-testid="text-ofertas-title">
                Tarifas Especiales
              </h1>
              <p className="text-muted-foreground">
                Hoteles seleccionados con tarifas negociadas exclusivas. Disponibilidad limitada, precios que no encontrarás en buscadores convencionales.
              </p>
            </div>
          </div>
        </section>

        <section className="py-8 md:py-12">
          <div className="mx-auto max-w-7xl px-4 md:px-8">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground" data-testid="text-ofertas-count">
                {data ? `${data.total} ofertas disponibles` : "Cargando..."}
              </p>
              <div className="flex items-center gap-3">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select onValueChange={handleHotelFilter} defaultValue="all">
                  <SelectTrigger className="w-48" data-testid="select-hotel-filter">
                    <SelectValue placeholder="Filtrar por hotel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los hoteles</SelectItem>
                    {data?.hotels.map((hotel) => (
                      <SelectItem key={hotel} value={hotel}>
                        {hotel}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {isLoading ? (
              <div className="grid gap-4 md:grid-cols-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-0">
                      <Skeleton className="h-16 rounded-b-none rounded-t-md" />
                      <div className="space-y-3 p-4">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-10 w-full" />
                        <div className="flex justify-between">
                          <Skeleton className="h-8 w-24" />
                          <Skeleton className="h-8 w-32" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : data && data.tarifas.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {data.tarifas.map((tarifa, index) => (
                  <TarifaCardFull
                    key={`${tarifa.hotel}-${tarifa.checkIn}-${index}`}
                    tarifa={tarifa}
                    onConsultar={handleConsultar}
                  />
                ))}
              </div>
            ) : (
              <div className="py-16 text-center">
                <Tag className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" />
                <h3 className="mb-2 text-lg font-semibold">No se encontraron ofertas</h3>
                <p className="text-sm text-muted-foreground">
                  {hotelFilter
                    ? "Prueba con otro hotel o quita el filtro."
                    : "No hay tarifas especiales disponibles en este momento."}
                </p>
                {hotelFilter && (
                  <Button variant="outline" className="mt-4" onClick={() => { setHotelFilter(""); setPage(1); }}>
                    Limpiar filtros
                  </Button>
                )}
              </div>
            )}

            {data && data.totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  data-testid="button-ofertas-prev"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  Página {data.page} de {data.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                  disabled={page >= data.totalPages}
                  data-testid="button-ofertas-next"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />

      <LeadCaptureDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        tarifa={selectedTarifa}
      />
    </div>
  );
}
