import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "wouter";
import {
  Calendar,
  Tag,
  Clock,
  ArrowRight,
  Send,
  CheckCircle,
  MessageCircle,
  ChevronLeft,
  Flame,
  BedDouble,
  Plus,
  Minus,
  Users,
  Baby,
  User,
  CreditCard,
  ArrowLeft,
  Calculator,
  DoorOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { calcularPrecioBloqueo, type PricingOutput } from '@shared/pricing-engine';
interface Tarifa {
  hotel: string;
  roomType: string;
  checkIn: string;
  checkOut: string;
  priceDouble: string;
  priceSingle: string;
  priceTriple: string;
  priceQuad: string;
  priceChildFirst: string | null;
  priceChildSecond: string | null;
  priceJunior: string | null;
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

function getDaysUntilCheckIn(checkIn: string): number {
  const now = new Date();
  const ci = new Date(checkIn);
  return Math.max(0, Math.round((ci.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
}

function getDepositInfo(checkIn: string): { percent: number; label: string } {
  const days = getDaysUntilCheckIn(checkIn);
  if (days <= 10) return { percent: 100, label: "Pago total (menos de 10 días)" };
  if (days <= 24) return { percent: 70, label: "70% anticipo (11-24 días)" };
  if (days <= 89) return { percent: 50, label: "50% anticipo (25-89 días)" };
  return { percent: 30, label: "30% anticipo (90+ días)" };
}

interface RoomDistribution {
  adults: number;
  children: number;
  juniors: number;
  infants: number;
  occupancy: number;
  rateType: "SGL" | "DBL" | "TPL" | "QUAD";
}

/**
 * Reglas hoteleras:
 * - Mín 1 adulto (18+) por habitación
 * - Máx 4 personas por habitación
 * - Máx 2 menores (6-12) por habitación
 * - Máx 2 infantes (0-5) por habitación
 * - Si no hay tarifa QUAD → no se usa cuádruple
 * - Si combinación no tiene distribución válida → array vacío (mostrar agente)
 */
function distributeRooms(
  adults: number,
  children: number,
  juniors: number,
  infants: number,
  hasQuadRate = true
): RoomDistribution[] {
  if (adults === 0) return [];

  const results: RoomDistribution[] = [];
  const seen = new Set<string>();

  function tryBuild(
    remA: number, remC: number, remJ: number, remI: number,
    rooms: RoomDistribution[]
  ): void {
    if (remA === 0 && remC === 0 && remJ === 0 && remI === 0) {
      const key = rooms.map(r => `${r.adults}a${r.juniors}j${r.children}c${r.infants}i`).sort().join('|');
      if (seen.has(key)) return;
      seen.add(key);
      results.push(...rooms.map(r => ({ ...r })));
      // Push as a group — store entire distribution
      return;
    }
    if (rooms.length >= 8) return;

    for (let a = 1; a <= Math.min(remA, 4); a++) {
      for (let j = 0; j <= Math.min(remJ, 4 - a); j++) {
        for (let c = 0; c <= Math.min(remC, 2); c++) {
          for (let i = 0; i <= Math.min(remI, 2); i++) {
            const occ = a + j + c + i;
            if (occ < 1 || occ > 4) continue;
            if (occ === 4 && !hasQuadRate) continue;
            let rateType: "SGL" | "DBL" | "TPL" | "QUAD" = "DBL";
            if (occ === 1) rateType = "SGL";
            else if (occ === 2) rateType = "DBL";
            else if (occ === 3) rateType = "TPL";
            else rateType = "QUAD";
            const room: RoomDistribution = { adults: a, children: c, juniors: j, infants: i, occupancy: occ, rateType };
            tryBuild(remA - a, remC - c, remJ - j, remI - i, [...rooms, room]);
          }
        }
      }
    }
  }

  // Collect full distributions (we need groups, not individual rooms)
  const groupResults: RoomDistribution[][] = [];
  const groupSeen = new Set<string>();

  function tryBuildGroup(
    remA: number, remC: number, remJ: number, remI: number,
    rooms: RoomDistribution[]
  ): void {
    if (remA === 0 && remC === 0 && remJ === 0 && remI === 0) {
      const key = rooms.map(r => `${r.adults}a${r.juniors}j${r.children}c${r.infants}i`).sort().join('|');
      if (groupSeen.has(key)) return;
      groupSeen.add(key);
      groupResults.push([...rooms]);
      return;
    }
    if (rooms.length >= 8) return;
    for (let a = 1; a <= Math.min(remA, 4); a++) {
      for (let j = 0; j <= Math.min(remJ, 4 - a); j++) {
        for (let c = 0; c <= Math.min(remC, 2); c++) {
          for (let i = 0; i <= Math.min(remI, 2); i++) {
            const occ = a + j + c + i;
            if (occ < 1 || occ > 4) continue;
            if (occ === 4 && !hasQuadRate) continue;
            let rateType: "SGL" | "DBL" | "TPL" | "QUAD" = "DBL";
            if (occ === 1) rateType = "SGL";
            else if (occ === 2) rateType = "DBL";
            else if (occ === 3) rateType = "TPL";
            else rateType = "QUAD";
            tryBuildGroup(remA - a, remC - c, remJ - j, remI - i, [...rooms, { adults: a, children: c, juniors: j, infants: i, occupancy: occ, rateType }]);
          }
        }
      }
    }
  }

  tryBuildGroup(adults, children, juniors, infants, []);
  groupResults.sort((a, b) => a.length - b.length);

  // Return first group (fewest rooms) — caller can index groupResults if needed
  return groupResults[0] || [];
}

// Returns all valid distribution groups for UI selection
function getAllDistributions(
  adults: number,
  children: number,
  juniors: number,
  infants: number,
  hasQuadRate = true
): RoomDistribution[][] {
  if (adults === 0) return [];
  const groupResults: RoomDistribution[][] = [];
  const groupSeen = new Set<string>();

  function tryBuildGroup(remA: number, remC: number, remJ: number, remI: number, rooms: RoomDistribution[]): void {
    if (remA === 0 && remC === 0 && remJ === 0 && remI === 0) {
      const key = rooms.map(r => `${r.adults}a${r.juniors}j${r.children}c${r.infants}i`).sort().join('|');
      if (groupSeen.has(key)) return;
      groupSeen.add(key);
      groupResults.push([...rooms]);
      return;
    }
    if (rooms.length >= 8) return;
    for (let a = 1; a <= Math.min(remA, 4); a++) {
      for (let j = 0; j <= Math.min(remJ, 4 - a); j++) {
        for (let c = 0; c <= Math.min(remC, 2); c++) {
          for (let i = 0; i <= Math.min(remI, 2); i++) {
            const occ = a + j + c + i;
            if (occ < 1 || occ > 4) continue;
            if (occ === 4 && !hasQuadRate) continue;
            let rateType: "SGL" | "DBL" | "TPL" | "QUAD" = "DBL";
            if (occ === 1) rateType = "SGL";
            else if (occ === 2) rateType = "DBL";
            else if (occ === 3) rateType = "TPL";
            else rateType = "QUAD";
            tryBuildGroup(remA - a, remC - c, remJ - j, remI - i, [...rooms, { adults: a, children: c, juniors: j, infants: i, occupancy: occ, rateType }]);
          }
        }
      }
    }
  }

  tryBuildGroup(adults, children, juniors, infants, []);
  groupResults.sort((a, b) => a.length - b.length);
  return groupResults.slice(0, 6);
}

function calculateTotal(tarifa: Tarifa, rooms: RoomDistribution[], nights: number): number {
  let total = 0;
  const pSgl = parseFloat(tarifa.priceSingle) || 0;
  const pDbl = parseFloat(tarifa.priceDouble) || 0;
  const pTpl = parseFloat(tarifa.priceTriple) || pDbl;
  const pQuad = parseFloat(tarifa.priceQuad || "0") || pTpl;
  const pChild = parseFloat(tarifa.priceChildFirst || "0") || 0;
  const pJunior = parseFloat(tarifa.priceJunior || "0") || 0;

  for (const room of rooms) {
    let baseRate = pDbl;
    if (room.rateType === "SGL") baseRate = pSgl;
    else if (room.rateType === "TPL") baseRate = pTpl;
    else if (room.rateType === "QUAD") baseRate = pQuad;

    total += room.adults * baseRate;
    if (room.children > 0) total += room.children * (pChild > 0 ? pChild : baseRate * 0.5);
    if (room.juniors > 0) total += room.juniors * (pJunior > 0 ? pJunior : baseRate * 0.7);
  }

  return total;
}

function TravelerCounter({
  label,
  sublabel,
  value,
  min,
  max,
  onChange,
  icon,
  testId,
}: {
  label: string;
  sublabel: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  icon: React.ReactNode;
  testId: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border bg-card p-3">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">{sublabel}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          data-testid={`button-minus-${testId}`}
        >
          <Minus className="h-3.5 w-3.5" />
        </Button>
        <span className="w-6 text-center text-sm font-semibold" data-testid={`text-count-${testId}`}>
          {value}
        </span>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          data-testid={`button-plus-${testId}`}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

const contactSchema = z.object({
  name: z.string().min(2, "El nombre es requerido"),
  email: z.string().email("Email inválido"),
  phone: z.string().optional(),
  comments: z.string().optional(),
});

type ContactFormValues = z.infer<typeof contactSchema>;

function CotizadorModal({
  open,
  onOpenChange,
  tarifa,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tarifa: Tarifa | null;
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [juniors, setJuniors] = useState(0);
  const [infants, setInfants] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedRef, setSubmittedRef] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: "", email: "", phone: "", comments: "" },
  });

  const nights = tarifa ? getNights(tarifa.checkIn, tarifa.checkOut) : 0;
  const hasQuadRate = tarifa ? parseFloat(tarifa.priceQuad || "0") > 0 : true;
  const allDistributions = useMemo(() => getAllDistributions(adults, children, juniors, infants, hasQuadRate), [adults, children, juniors, infants, hasQuadRate]);
  const rooms = allDistributions[0] || distributeRooms(adults, children, juniors, infants, hasQuadRate);
  const needsAgent = allDistributions.length === 0 && (adults + children + juniors + infants) > 0;
  const totalPrice = useMemo(() => tarifa ? calculateTotal(tarifa, rooms, nights) : 0, [tarifa, rooms, nights]);
  const deposit = tarifa ? getDepositInfo(tarifa.checkIn) : { percent: 30, label: "" };
  const depositAmount = Math.ceil(totalPrice * deposit.percent / 100);

  // Motor de precios
  const pricing: PricingOutput = calcularPrecioBloqueo({
    precioHabitacion: totalPrice,
    adultos: adults,
    menores: children,
    juniors: juniors,
    infantes: infants,
    noches: nights,
    kuaniTier: (tarifa?.roomType?.includes('PREMIUM') ? 'PREMIUM' : 'ESTANDAR') as any,
  });
  const depositEfectivo = Math.ceil(pricing.precioVenta * deposit.percent / 100);
  const depositTarjeta = Math.ceil(pricing.precioTarjeta * deposit.percent / 100);

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setStep(1);
      setAdults(2);
      setChildren(0);
      setJuniors(0);
      setInfants(0);
      setIsSubmitted(false);
      setSubmittedRef("");
      setIsSubmitting(false);
      form.reset();
    }, 300);
  };

  const whatsappUrl = tarifa
    ? `https://wa.me/524434044104?text=${encodeURIComponent(
        `Hola, solicito cotización:\n🏨 ${tarifa.hotel}\n🛏️ ${tarifa.roomType}\n📅 ${formatDate(tarifa.checkIn)} al ${formatDate(tarifa.checkOut)} (${nights} noches)\n👥 ${adults} adultos${children > 0 ? `, ${children} menores` : ""}${juniors > 0 ? `, ${juniors} juniors` : ""}${infants > 0 ? `, ${infants} infantes` : ""}\n🏠 ${rooms.length} hab.\n💰 Total: ${formatPrice(totalPrice)}\n💳 Anticipo: ${formatPrice(depositAmount)} (${deposit.percent}%)`
      )}`
    : "";

  const onSubmit = async (data: ContactFormValues) => {
    if (!tarifa) return;
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/reservar-precompra", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          hotel: tarifa.hotel,
          roomType: tarifa.roomType,
          checkIn: tarifa.checkIn,
          checkOut: tarifa.checkOut,
          adults,
          children,
          juniors,
          infants,
          roomsNeeded: rooms.length,
          totalPrice: totalPrice.toFixed(2),
          depositAmount: depositAmount.toFixed(2),
          depositPercent: deposit.percent,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setSubmittedRef(result.reference || "");
        setIsSubmitted(true);
        toast({
          title: "Cotización enviada",
          description: "Revisa tu correo electrónico para la confirmación.",
        });
      } else {
        const err = await response.json().catch(() => ({ message: "Error desconocido" }));
        throw new Error(err.message);
      }
    } catch (e: any) {
      toast({
        title: "Error",
        description: e.message || "No pudimos enviar tu cotización. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!tarifa) return null;

  const rateTypeLabels = { SGL: "Sencilla", DBL: "Doble", TPL: "Triple", QUAD: "Cuádruple" };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        {isSubmitted ? (
          <div className="py-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle className="h-7 w-7 text-green-600" />
            </div>
            <h3 className="mb-1 text-lg font-semibold">Cotización Enviada</h3>
            {submittedRef && (
              <p className="mb-3 text-sm font-medium text-primary">
                Referencia: {submittedRef}
              </p>
            )}
            <p className="mb-4 text-sm text-muted-foreground">
              Revisa tu correo electrónico. Un asesor te contactará para confirmar disponibilidad.
            </p>
            <div className="flex flex-col items-center gap-3">
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                <Button className="gap-2" data-testid="button-whatsapp-post-submit">
                  <MessageCircle className="h-4 w-4" />
                  Acelerar por WhatsApp
                </Button>
              </a>
              <Button variant="outline" onClick={handleClose} data-testid="button-close-cotizador">
                Cerrar
              </Button>
            </div>
          </div>
        ) : step === 1 ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-primary" />
                Cotizador
              </DialogTitle>
              <DialogDescription asChild>
                <div className="mt-2 rounded-lg border bg-muted/50 p-3">
                  <p className="font-semibold text-foreground">{tarifa.hotel}</p>
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <BedDouble className="h-3 w-3" /> {tarifa.roomType}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> {formatDateShort(tarifa.checkIn)} — {formatDateShort(tarifa.checkOut)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {nights} {nights === 1 ? "noche" : "noches"}
                    </span>
                  </div>
                  {tarifa.notes && (
                    <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">{tarifa.notes}</p>
                  )}
                </div>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 pt-2">
              <h4 className="flex items-center gap-2 text-sm font-semibold">
                <Users className="h-4 w-4 text-primary" />
                Viajeros
              </h4>
              <div className="space-y-2">
                <TravelerCounter
                  label="Adultos"
                  sublabel="18+ años"
                  value={adults}
                  min={1}
                  max={8}
                  onChange={setAdults}
                  icon={<User className="h-4 w-4" />}
                  testId="adults"
                />
                <TravelerCounter
                  label="Menores"
                  sublabel="6-12 años"
                  value={children}
                  min={0}
                  max={6}
                  onChange={setChildren}
                  icon={<Users className="h-4 w-4" />}
                  testId="children"
                />
                <TravelerCounter
                  label="Juniors"
                  sublabel="13-17 años"
                  value={juniors}
                  min={0}
                  max={4}
                  onChange={setJuniors}
                  icon={<User className="h-4 w-4" />}
                  testId="juniors"
                />
                <TravelerCounter
                  label="Infantes"
                  sublabel="0-5 años"
                  value={infants}
                  min={0}
                  max={4}
                  onChange={setInfants}
                  icon={<Baby className="h-4 w-4" />}
                  testId="infants"
                />
              </div>
            </div>

            {needsAgent ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-center space-y-3">
                  <p className="text-sm font-medium text-amber-800">
                    Esta combinación requiere distribución personalizada. Un asesor te ayudará.
                  </p>
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-full transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Contactar Asesor por WhatsApp
                  </a>
                </div>
              ) : rooms.length > 0 ? (
              <div className="space-y-3 pt-2">
                <h4 className="flex items-center gap-2 text-sm font-semibold">
                  <DoorOpen className="h-4 w-4 text-primary" />
                  Distribución ({rooms.length} {rooms.length === 1 ? "habitación" : "habitaciones"})
                </h4>
                <div className="space-y-1.5">
                  {rooms.map((room, i) => (
                    <div key={i} className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2 text-xs">
                      <span className="font-medium">Hab. {i + 1}</span>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span>{room.adults} ad.</span>
                        {room.juniors > 0 && <span>{room.juniors} jr.</span>}
                        {room.children > 0 && <span>{room.children} men.</span>}
                        {room.infants > 0 && <span>{room.infants} inf.</span>}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {rateTypeLabels[room.rateType]}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
              ) : null}

            <div className="space-y-2 rounded-lg border bg-gradient-to-br from-primary/5 to-transparent p-4">
              <h4 className="flex items-center gap-2 text-sm font-semibold">
                <CreditCard className="h-4 w-4 text-primary" />
                Resumen de Cotización
              </h4>
              <div className="space-y-1 text-sm">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Tarifa SGL (por persona)</span>
                  <span>{formatPrice(tarifa.priceSingle)}</span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Tarifa DBL (por persona)</span>
                  <span>{formatPrice(tarifa.priceDouble)}</span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Tarifa TPL (por persona)</span>
                  <span>{formatPrice(tarifa.priceTriple)}</span>
                </div>
                {tarifa.priceChildFirst && parseFloat(tarifa.priceChildFirst) > 0 && (
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Menor (6-12)</span>
                    <span>{formatPrice(tarifa.priceChildFirst)}</span>
                  </div>
                )}
                {tarifa.priceJunior && parseFloat(tarifa.priceJunior) > 0 && (
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Junior (13-17)</span>
                    <span>{formatPrice(tarifa.priceJunior)}</span>
                  </div>
                )}
                <div className="my-2 border-t" />
                {pricing.precioVenta > 0 ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between rounded-lg bg-green-50 border border-green-200 px-3 py-2">
                      <div>
                        <p className="text-xs font-medium text-green-700">💵 Efectivo / SPEI</p>
                        <p className="text-xs text-green-600">Kuani: +{pricing.kuaniGenerados} pts</p>
                      </div>
                      <span className="font-bold text-lg text-green-800 font-mono" data-testid="text-total-price">
                        {formatPrice(pricing.precioVenta)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-blue-50 border border-blue-200 px-3 py-2">
                      <div>
                        <p className="text-xs font-medium text-blue-700">💳 Tarjeta (Clip)</p>
                        <p className="text-xs text-blue-600">Comisión: {formatPrice(pricing.comisionClipMonto)}</p>
                      </div>
                      <span className="font-bold text-lg text-blue-800 font-mono">
                        {formatPrice(pricing.precioTarjeta)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
                      <span className="text-xs font-medium text-amber-700">{deposit.label}</span>
                      <div className="text-right">
                        <p className="text-xs font-semibold text-amber-800" data-testid="text-deposit-amount">
                          Ef: {formatPrice(depositEfectivo)} | 💳 {formatPrice(depositTarjeta)}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between font-bold text-base">
                    <span>Total Estimado</span>
                    <span className="text-muted-foreground">Selecciona viajeros</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                className="flex-1 gap-2"
                onClick={() => setStep(2)}
                data-testid="button-solicitar-reserva"
              >
                <Send className="h-4 w-4" />
                Solicitar Reserva
              </Button>
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="icon" className="h-10 w-10" data-testid="button-whatsapp-cotizador">
                  <MessageCircle className="h-4 w-4" />
                </Button>
              </a>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Send className="h-5 w-5 text-primary" />
                Datos de Contacto
              </DialogTitle>
              <DialogDescription asChild>
                <div className="mt-2 rounded-lg border bg-muted/50 p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{tarifa.hotel}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateShort(tarifa.checkIn)} — {formatDateShort(tarifa.checkOut)} · {nights} noches · {rooms.length} hab.
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-primary">{formatPrice(totalPrice)}</p>
                      <p className="text-xs text-amber-600 dark:text-amber-400">
                        Anticipo: {formatPrice(depositAmount)}
                      </p>
                    </div>
                  </div>
                </div>
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre completo *</FormLabel>
                      <FormControl>
                        <Input placeholder="Tu nombre completo" {...field} data-testid="input-cotizador-name" />
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
                        <FormLabel>Email *</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="tu@email.com" {...field} data-testid="input-cotizador-email" />
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
                          <Input placeholder="+52 55 1234 5678" {...field} data-testid="input-cotizador-phone" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="comments"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Comentarios</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Peticiones especiales, alergias, celebraciones..."
                          className="resize-none"
                          rows={2}
                          {...field}
                          data-testid="input-cotizador-comments"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="gap-2"
                    data-testid="button-back-to-calculator"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Regresar
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 gap-2"
                    disabled={isSubmitting}
                    data-testid="button-enviar-cotizacion"
                  >
                    {isSubmitting ? (
                      "Enviando..."
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Enviar Cotización
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function TarifaCard({ tarifa, onConsultar }: { tarifa: Tarifa; onConsultar: (t: Tarifa) => void }) {
  const nights = getNights(tarifa.checkIn, tarifa.checkOut);
  const price = parseFloat(tarifa.priceDouble);
  const pricePerNight = Math.round(price / nights);

  return (
    <Card className="group relative overflow-visible transition-shadow duration-200 hover:shadow-lg" data-testid={`card-tarifa-${tarifa.hotel.replace(/\s+/g, "-").toLowerCase()}`}>
      <CardContent className="p-0">
        <div className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-sm font-semibold leading-tight" data-testid="text-tarifa-hotel">
                {tarifa.hotel}
              </h3>
              <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <BedDouble className="h-3 w-3 shrink-0" />
                <span className="truncate">{tarifa.roomType}</span>
              </div>
            </div>
            <Badge variant="secondary" className="shrink-0 text-xs">
              <Clock className="mr-1 h-3 w-3" />
              {nights} {nights === 1 ? "noche" : "noches"}
            </Badge>
          </div>
        </div>

        <div className="space-y-3 p-4 pt-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            <span>
              {formatDateShort(tarifa.checkIn)} — {formatDateShort(tarifa.checkOut)}
            </span>
          </div>

          {tarifa.notes && (
            <p className="text-xs text-muted-foreground/80 line-clamp-2">
              {tarifa.notes}
            </p>
          )}

          {tarifa.availability != null && tarifa.availability > 0 && (
            <div className="flex items-center gap-1.5 text-xs">
              <span className={`inline-block h-2 w-2 rounded-full ${tarifa.availability <= 3 ? "bg-orange-500" : "bg-green-500"}`} />
              <span className="text-muted-foreground">
                {tarifa.availability} {tarifa.availability === 1 ? "habitación" : "habitaciones"}
              </span>
            </div>
          )}

          <div className="flex items-end justify-between gap-2 border-t pt-3">
            <div>
              <p className="text-xs text-muted-foreground">Desde</p>
              <p className="text-lg font-bold tracking-tight" data-testid="text-tarifa-price">
                {formatPrice(tarifa.priceDouble)}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatPrice(pricePerNight)} / noche
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => onConsultar(tarifa)}
              className="gap-1.5"
              data-testid="button-cotizar"
            >
              <Calculator className="h-3.5 w-3.5" />
              Cotizar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function TarifasEspecialesSection() {
  const [selectedTarifa, setSelectedTarifa] = useState<Tarifa | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data, isLoading } = useQuery<TarifasResponse>({
    queryKey: ["/api/tarifas-especiales", "diversified"],
    queryFn: async () => {
      const res = await fetch(`/api/tarifas-especiales?diversify=true&limit=6`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const handleConsultar = (tarifa: Tarifa) => {
    setSelectedTarifa(tarifa);
    setDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="rounded-xl border bg-card p-5 shadow-lg" data-testid="section-tarifas-especiales">
        <div className="mb-6 text-center">
          <Skeleton className="mx-auto mb-3 h-7 w-72" />
          <Skeleton className="mx-auto h-4 w-80" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-0">
                <Skeleton className="h-20 rounded-b-none rounded-t-md" />
                <div className="space-y-3 p-4">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <div className="flex justify-between gap-2">
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-8 w-20" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.tarifas.length === 0) return null;

  return (
    <div className="rounded-xl border bg-card p-5 shadow-lg" data-testid="section-tarifas-especiales">
      <div className="mb-6 text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border bg-primary/5 px-4 py-1.5">
          <Flame className="h-4 w-4 text-primary" />
          <span className="text-xs font-medium text-primary">Ofertas Exclusivas</span>
        </div>
        <h2 className="mb-2 text-xl font-bold tracking-tight md:text-2xl" data-testid="text-tarifas-title">
          Tarifas Especiales por Tiempo Limitado
        </h2>
        <p className="mx-auto max-w-2xl text-xs text-muted-foreground md:text-sm">
          Hoteles seleccionados con tarifas negociadas exclusivas. Disponibilidad limitada.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.tarifas.map((tarifa, index) => (
          <TarifaCard
            key={`${tarifa.hotel}-${tarifa.checkIn}-${index}`}
            tarifa={tarifa}
            onConsultar={handleConsultar}
          />
        ))}
      </div>

      <div className="mt-6 flex flex-col items-center gap-3">
        <Link href="/ofertas">
          <Button variant="outline" className="gap-2" data-testid="button-ver-todas-ofertas">
            <Tag className="h-4 w-4" />
            Ver Todas las Ofertas ({data.total})
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>

        <p className="max-w-md text-center text-xs text-muted-foreground/70">
          Precios negociados directamente con los hoteles. No disponibles al público general.
        </p>
      </div>

      <CotizadorModal
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        tarifa={selectedTarifa}
      />
    </div>
  );
}
