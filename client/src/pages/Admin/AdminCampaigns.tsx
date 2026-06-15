import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Mail,
  MessageCircle,
  Plus,
  Send,
  Sparkles,
  Loader2,
  CheckCircle2,
  Clock,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DashboardLayout } from "@/pages/dashboard/dashboard-layout";
import { apiRequest } from "@/lib/queryClient";
import { useBrand } from "@/lib/brand-context";

const LEAD_STATUSES = [
  { value: "new",       label: "Nuevo" },
  { value: "contacted", label: "Contactado" },
  { value: "cotizado",  label: "Cotizado" },
  { value: "hold",      label: "Hold activo" },
  { value: "won",       label: "Ganado" },
  { value: "lost",      label: "Perdido" },
];

const schema = z.object({
  name:         z.string().min(3),
  channel:      z.enum(["email", "whatsapp"]),
  subject:      z.string().optional(),
  body:         z.string().min(10),
  leadStatuses: z.array(z.string()),
  topic:        z.string().optional(),
  audienceSegment: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Campaign {
  id: string;
  name: string;
  channels?: string[];
  status?: string;
  targetCount?: number;
  sentCount?: number;
  createdAt?: string;
}

function StatusBadge({ status }: { status?: string }) {
  const map: Record<string, { label: string; className: string }> = {
    draft:     { label: "Borrador",   className: "bg-gray-100 text-gray-600" },
    running:   { label: "Enviando",   className: "bg-blue-100 text-blue-700" },
    completed: { label: "Completada", className: "bg-green-100 text-green-700" },
    scheduled: { label: "Programada", className: "bg-amber-100 text-amber-700" },
  };
  const v = map[status || "draft"];
  return <Badge className={`text-xs ${v.className}`}>{v.label}</Badge>;
}

export default function AdminCampaigns() {
  const { brand } = useBrand();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);

  const { data: campaigns = [], isLoading } = useQuery<Campaign[]>({
    queryKey: ["/api/admin/lead-campaigns"],
  });

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { channel: "email", leadStatuses: ["new", "contacted"] },
  });

  const channel   = watch("channel");
  const statuses  = watch("leadStatuses") || [];
  const topic     = watch("topic");

  const createMutation = useMutation({
    mutationFn: (data: FormValues) => apiRequest("POST", "/api/admin/lead-campaigns", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/lead-campaigns"] });
      reset();
      setOpen(false);
    },
  });

  const sendMutation = useMutation({
    mutationFn: (id: string) => {
      setSendingId(id);
      return apiRequest("POST", `/api/admin/lead-campaigns/${id}/send`, {});
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/lead-campaigns"] });
      setSendingId(null);
    },
    onError: () => setSendingId(null),
  });

  const copyMutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", "/api/admin/lead-campaigns/generate-copy", {
        channel,
        topic,
        audienceSegment: statuses.map((s) => LEAD_STATUSES.find((l) => l.value === s)?.label).join(", "),
      }),
    onSuccess: (data: any) => {
      if (data.subject) setValue("subject", data.subject);
      setValue("body", data.body);
    },
  });

  const onSubmit = (data: FormValues) => createMutation.mutate(data);

  const toggleStatus = (val: string) => {
    const current = statuses;
    setValue(
      "leadStatuses",
      current.includes(val) ? current.filter((s) => s !== val) : [...current, val]
    );
  };

  return (
    <DashboardLayout
      title="Campañas de leads"
      description="Envía emails y mensajes WhatsApp a segmentos de tu pipeline"
    >
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{campaigns.length} campaña(s)</p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nueva campaña
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Crear campaña</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
              <div className="space-y-1">
                <Label>Nombre de la campaña *</Label>
                <Input placeholder="Ej. Reactivación verano 2026" {...register("name")} />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Canal *</Label>
                  <Select value={channel} onValueChange={(v) => setValue("channel", v as "email" | "whatsapp")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />Email
                        </div>
                      </SelectItem>
                      <SelectItem value="whatsapp">
                        <div className="flex items-center gap-2">
                          <MessageCircle className="h-4 w-4" />WhatsApp
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {channel === "email" && (
                  <div className="space-y-1">
                    <Label>Asunto del email</Label>
                    <Input placeholder="¡Oferta especial para ti!" {...register("subject")} />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Segmento objetivo (etapas del pipeline)</Label>
                <div className="flex flex-wrap gap-2">
                  {LEAD_STATUSES.map((s) => (
                    <label key={s.value} className="flex items-center gap-1.5 cursor-pointer">
                      <Checkbox
                        checked={statuses.includes(s.value)}
                        onCheckedChange={() => toggleStatus(s.value)}
                      />
                      <span className="text-sm">{s.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* AI copy generation */}
              <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
                <Label className="flex items-center gap-1.5 text-sm font-medium">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  Generar copy con IA
                </Label>
                <Input
                  placeholder="Tema: Ej. Ofertas de temporada baja en Cancún"
                  {...register("topic")}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={copyMutation.isPending || !topic}
                  onClick={() => copyMutation.mutate()}
                >
                  {copyMutation.isPending ? (
                    <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />Generando...</>
                  ) : (
                    <><Sparkles className="mr-2 h-3.5 w-3.5" />Generar copy</>
                  )}
                </Button>
              </div>

              <div className="space-y-1">
                <Label>Mensaje / Cuerpo del email *</Label>
                <Textarea rows={6} placeholder="Escribe el mensaje o usa la IA..." {...register("body")} />
                {errors.body && <p className="text-xs text-destructive">{errors.body.message}</p>}
              </div>

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                  Crear campaña
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Cargando campañas...</p>
      ) : campaigns.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Mail className="mx-auto mb-3 h-10 w-10 opacity-30" />
            <p>No hay campañas todavía. Crea tu primera campaña para segmentar y contactar leads.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {campaigns.map((c) => (
            <Card key={c.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                    {(c.channels?.[0] || "email") === "email"
                      ? <Mail className="h-4 w-4 text-blue-500" />
                      : <MessageCircle className="h-4 w-4 text-green-500" />
                    }
                  </div>
                  <div>
                    <p className="font-medium">{c.name}</p>
                    <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {c.targetCount ?? 0} leads objetivo
                      </span>
                      {c.sentCount != null && c.sentCount > 0 && (
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircle2 className="h-3 w-3" />
                          {c.sentCount} enviados
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <StatusBadge status={c.status} />
                  {c.status === "draft" && (
                    <Button
                      size="sm"
                      disabled={sendingId === c.id}
                      onClick={() => sendMutation.mutate(c.id)}
                    >
                      {sendingId === c.id ? (
                        <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />Enviando...</>
                      ) : (
                        <><Send className="mr-2 h-3.5 w-3.5" />Enviar</>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
