import { useState } from "react";
import AdminLayout from "./AdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Upload,
  Download,
  Users,
  Send,
  Trophy,
  Zap,
  FileSpreadsheet,
  Crown,
  Star,
  Gem,
  Play,
  Calendar,
  Gift,
  Clock,
  MessageSquare,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

type LoyaltyTier = "bronce" | "plata" | "oro" | "platino";

const tierConfig: Record<LoyaltyTier, { name: string; icon: any; color: string; minPoints: number }> = {
  bronce: { name: "Bronce", icon: Star, color: "text-amber-600", minPoints: 0 },
  plata: { name: "Plata", icon: Star, color: "text-gray-400", minPoints: 1000 },
  oro: { name: "Oro", icon: Crown, color: "text-yellow-500", minPoints: 5000 },
  platino: { name: "Platino", icon: Gem, color: "text-purple-500", minPoints: 15000 },
};

function ImportCustomersTab() {
  const { toast } = useToast();
  const [csvContent, setCsvContent] = useState("");
  const [preview, setPreview] = useState<any>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});

  const downloadTemplate = () => {
    window.open("/api/crm/import/template", "_blank");
  };

  const previewMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiRequest("POST", "/api/crm/import/preview", { content });
      return res.json();
    },
    onSuccess: (data) => {
      setPreview(data);
      const autoMapping: Record<string, string> = {};
      data.headers.forEach((header: string) => {
        const lower = header.toLowerCase();
        if (lower.includes("nombre") || lower.includes("name")) autoMapping[header] = "firstName";
        if (lower.includes("apellido") || lower.includes("last")) autoMapping[header] = "lastName";
        if (lower.includes("email") || lower.includes("correo")) autoMapping[header] = "email";
        if (lower.includes("telefono") || lower.includes("phone") || lower.includes("tel")) autoMapping[header] = "phone";
        if (lower.includes("nacimiento") || lower.includes("birth")) autoMapping[header] = "birthDate";
      });
      setMapping(autoMapping);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const importMutation = useMutation({
    mutationFn: async () => {
      const brandId = localStorage.getItem("selectedBrandId") || "";
      const res = await apiRequest("POST", "/api/crm/import/customers", {
        brandId,
        content: csvContent,
        mapping,
        source: "csv_import",
      });
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Importacion completada",
        description: `${data.imported} clientes importados, ${data.skipped} omitidos, ${data.errors.length} errores`,
      });
      setCsvContent("");
      setPreview(null);
      queryClient.invalidateQueries({ queryKey: ["/api/crm/customers"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setCsvContent(content);
        previewMutation.mutate(content);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Importar Clientes
          </CardTitle>
          <CardDescription>
            Importa clientes desde archivos CSV o Excel para comenzar a gestionar tu base de datos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button variant="outline" onClick={downloadTemplate} data-testid="button-download-template">
              <Download className="mr-2 h-4 w-4" />
              Descargar Plantilla
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="csvFile">Archivo CSV</Label>
            <Input
              id="csvFile"
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileUpload}
              data-testid="input-csv-file"
            />
          </div>

          {preview && (
            <div className="space-y-4">
              <div className="rounded-md border p-4">
                <h4 className="mb-2 font-medium">Vista Previa ({preview.totalRows} filas)</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        {preview.headers.map((header: string) => (
                          <th key={header} className="p-2 text-left">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.sample.slice(0, 3).map((row: any, idx: number) => (
                        <tr key={idx} className="border-b">
                          {preview.headers.map((header: string) => (
                            <td key={header} className="p-2">
                              {row[header]}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Mapeo de Columnas</Label>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                  {preview.headers.map((header: string) => (
                    <div key={header} className="space-y-1">
                      <Label className="text-xs text-muted-foreground">{header}</Label>
                      <Select
                        value={mapping[header] || ""}
                        onValueChange={(value) => setMapping({ ...mapping, [header]: value })}
                      >
                        <SelectTrigger data-testid={`select-mapping-${header}`}>
                          <SelectValue placeholder="Seleccionar campo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="skip">-- Omitir --</SelectItem>
                          <SelectItem value="firstName">Nombre</SelectItem>
                          <SelectItem value="lastName">Apellido</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="phone">Telefono</SelectItem>
                          <SelectItem value="birthDate">Fecha Nacimiento</SelectItem>
                          <SelectItem value="city">Ciudad</SelectItem>
                          <SelectItem value="country">Pais</SelectItem>
                          <SelectItem value="marketingConsent">Acepta Marketing</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                onClick={() => importMutation.mutate()}
                disabled={importMutation.isPending}
                data-testid="button-import"
              >
                {importMutation.isPending ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Importar {preview.totalRows} Clientes
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function LoyaltyTab() {
  const { data: loyaltyStats } = useQuery({
    queryKey: ["/api/crm/loyalty/stats"],
    enabled: false,
  });

  const tiers = Object.entries(tierConfig).map(([key, config]) => ({
    id: key,
    ...config,
    count: 0,
  }));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        {tiers.map((tier) => {
          const Icon = tier.icon;
          return (
            <Card key={tier.id} data-testid={`card-tier-${tier.id}`}>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{tier.name}</CardTitle>
                <Icon className={`h-5 w-5 ${tier.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{tier.count}</div>
                <p className="text-xs text-muted-foreground">
                  {tier.minPoints.toLocaleString()}+ puntos
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Programa de Lealtad
          </CardTitle>
          <CardDescription>
            Gestiona niveles, recompensas y beneficios para tus clientes frecuentes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h4 className="font-medium">Niveles del Programa</h4>
            {Object.entries(tierConfig).map(([key, tier]) => {
              const Icon = tier.icon;
              const nextTier = Object.entries(tierConfig).find(([k]) => 
                tierConfig[k as LoyaltyTier].minPoints > tier.minPoints
              );
              
              return (
                <div key={key} className="flex items-center gap-4 rounded-lg border p-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-full bg-muted ${tier.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h5 className="font-medium">{tier.name}</h5>
                    <p className="text-sm text-muted-foreground">
                      {tier.minPoints.toLocaleString()} - {nextTier ? (tierConfig[nextTier[0] as LoyaltyTier].minPoints - 1).toLocaleString() : "ilimitado"} puntos
                    </p>
                  </div>
                  <Badge variant="outline">{key.toUpperCase()}</Badge>
                </div>
              );
            })}
          </div>

          <div className="space-y-4">
            <h4 className="font-medium">Reglas de Acumulacion</h4>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border p-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                    <Star className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Reservaciones</p>
                    <p className="text-sm text-muted-foreground">1 punto por cada $100 USD</p>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border p-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                    <Gift className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Cumpleanos</p>
                    <p className="text-sm text-muted-foreground">500 puntos de regalo</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CampaignsTab() {
  const { toast } = useToast();
  const [campaignName, setCampaignName] = useState("");
  const [campaignType, setCampaignType] = useState<string>("email");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [segmentFilter, setSegmentFilter] = useState<string>("all");

  const brandId = localStorage.getItem("selectedBrandId") || "";

  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ["/api/crm/campaigns", brandId],
    enabled: !!brandId,
  });

  const { data: segmentCount } = useQuery({
    queryKey: ["/api/crm/campaigns/segment/count", brandId, segmentFilter],
    queryFn: async () => {
      const res = await apiRequest("POST", "/api/crm/campaigns/segment/count", {
        brandId,
        filters: { segment: segmentFilter },
      });
      return res.json();
    },
    enabled: !!brandId,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/crm/campaigns", {
        brandId,
        name: campaignName,
        type: campaignType,
        subject,
        content,
        segmentFilters: { segment: segmentFilter },
        status: "draft",
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Campana creada", description: "La campana se guardo como borrador" });
      setCampaignName("");
      setSubject("");
      setContent("");
      queryClient.invalidateQueries({ queryKey: ["/api/crm/campaigns", brandId] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const executeMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      const res = await apiRequest("POST", `/api/crm/campaigns/${campaignId}/execute`, {});
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: "Campana enviada", description: `${data.sent} mensajes enviados` });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/campaigns", brandId] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Crear Campana
          </CardTitle>
          <CardDescription>
            Crea campanas de email o WhatsApp para comunicarte con tus clientes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="campaignName">Nombre de la Campana</Label>
              <Input
                id="campaignName"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder="Promocion de Verano"
                data-testid="input-campaign-name"
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo de Campana</Label>
              <Select value={campaignType} onValueChange={setCampaignType}>
                <SelectTrigger data-testid="select-campaign-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Segmento de Clientes</Label>
            <Select value={segmentFilter} onValueChange={setSegmentFilter}>
              <SelectTrigger data-testid="select-segment">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los clientes</SelectItem>
                <SelectItem value="active">Clientes activos</SelectItem>
                <SelectItem value="inactive">Clientes inactivos</SelectItem>
                <SelectItem value="vip">Clientes VIP (Oro/Platino)</SelectItem>
                <SelectItem value="birthday_month">Cumpleanos este mes</SelectItem>
              </SelectContent>
            </Select>
            {segmentCount && (
              <p className="text-sm text-muted-foreground">
                {segmentCount.count} clientes en este segmento
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Asunto</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Tu proxima aventura te espera..."
              data-testid="input-campaign-subject"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Contenido</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Escribe el mensaje de tu campana..."
              rows={6}
              data-testid="textarea-campaign-content"
            />
            <p className="text-xs text-muted-foreground">
              Variables disponibles: {"{{name}}"}, {"{{email}}"}, {"{{loyaltyPoints}}"}, {"{{tier}}"}
            </p>
          </div>

          <Button
            onClick={() => createMutation.mutate()}
            disabled={!campaignName || !content || createMutation.isPending}
            data-testid="button-create-campaign"
          >
            {createMutation.isPending ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="mr-2 h-4 w-4" />
            )}
            Guardar Campana
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Campanas Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (campaigns as any[]).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <MessageSquare className="mb-2 h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">No hay campanas creadas</p>
            </div>
          ) : (
            <div className="space-y-4">
              {(campaigns as any[]).map((campaign: any) => (
                <div key={campaign.id} className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <h4 className="font-medium">{campaign.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {campaign.type} - {campaign.status}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {campaign.status === "draft" && (
                      <Button
                        size="sm"
                        onClick={() => executeMutation.mutate(campaign.id)}
                        disabled={executeMutation.isPending}
                        data-testid={`button-execute-${campaign.id}`}
                      >
                        <Play className="mr-1 h-4 w-4" />
                        Enviar
                      </Button>
                    )}
                    <Badge variant={campaign.status === "sent" ? "default" : "secondary"}>
                      {campaign.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AutomationsTab() {
  const { toast } = useToast();
  const brandId = localStorage.getItem("selectedBrandId") || "";

  const runAutomation = useMutation({
    mutationFn: async (type: string) => {
      const res = await apiRequest("POST", `/api/crm/automation/${type}`, { brandId });
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Automatizacion ejecutada",
        description: `${data.sent || data.count || 0} mensajes procesados`,
      });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const automations = [
    {
      id: "birthdays",
      name: "Cumpleanos",
      description: "Envia felicitaciones y descuentos especiales a clientes que cumplen anos",
      schedule: "Diario a las 9:00 AM",
      icon: Gift,
    },
    {
      id: "cold-leads",
      name: "Leads Frios",
      description: "Seguimiento automatico a prospectos sin actividad reciente",
      schedule: "Cada 6 horas",
      icon: Clock,
    },
    {
      id: "winback",
      name: "Recuperacion de Clientes",
      description: "Campana para reactivar clientes que no han reservado en 90+ dias",
      schedule: "Lunes a las 10:00 AM",
      icon: RefreshCw,
    },
    {
      id: "reminders",
      name: "Recordatorios de Viaje",
      description: "Recordatorios automaticos antes de viajes programados",
      schedule: "Diario a las 8:00 AM",
      icon: Calendar,
    },
    {
      id: "reviews",
      name: "Solicitud de Resenas",
      description: "Pide resenas a clientes despues de completar su viaje",
      schedule: "Diario a las 6:00 PM",
      icon: Star,
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Automatizaciones de Marketing
          </CardTitle>
          <CardDescription>
            Flujos automaticos para mantener comunicacion constante con tus clientes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {automations.map((auto) => {
              const Icon = auto.icon;
              return (
                <div key={auto.id} className="flex items-center gap-4 rounded-lg border p-4" data-testid={`card-automation-${auto.id}`}>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{auto.name}</h4>
                    <p className="text-sm text-muted-foreground">{auto.description}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      <Clock className="mr-1 inline h-3 w-3" />
                      {auto.schedule}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => runAutomation.mutate(auto.id)}
                    disabled={runAutomation.isPending}
                    data-testid={`button-run-${auto.id}`}
                  >
                    <Play className="mr-1 h-4 w-4" />
                    Ejecutar
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Bot de Ventas WhatsApp
          </CardTitle>
          <CardDescription>
            Agente de IA que atiende consultas y genera leads las 24/7
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-4 rounded-lg border p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
              <MessageSquare className="h-6 w-6 text-green-500" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium">Asistente de Ventas con IA</h4>
              <p className="text-sm text-muted-foreground">
                Responde consultas sobre destinos, precios y disponibilidad. Captura leads automaticamente
                y escala conversaciones cuando el cliente esta listo para reservar.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant="secondary">Claude AI</Badge>
                <Badge variant="secondary">24/7</Badge>
                <Badge variant="secondary">Multi-idioma</Badge>
              </div>
            </div>
            <Badge className="bg-green-500">Activo</Badge>
          </div>

          <div className="mt-4">
            <p className="text-sm text-muted-foreground">
              <AlertCircle className="mr-1 inline h-4 w-4" />
              Configura el webhook de Twilio apuntando a: <code className="rounded bg-muted px-1">/api/webhooks/twilio/whatsapp</code>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminCRM() {
  return (
    <AdminLayout title="CRM">
      <Tabs defaultValue="import" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4" data-testid="tabs-crm">
          <TabsTrigger value="import" data-testid="tab-import">
            <Upload className="mr-2 h-4 w-4" />
            Importar
          </TabsTrigger>
          <TabsTrigger value="loyalty" data-testid="tab-loyalty">
            <Trophy className="mr-2 h-4 w-4" />
            Lealtad
          </TabsTrigger>
          <TabsTrigger value="campaigns" data-testid="tab-campaigns">
            <Send className="mr-2 h-4 w-4" />
            Campanas
          </TabsTrigger>
          <TabsTrigger value="automations" data-testid="tab-automations">
            <Zap className="mr-2 h-4 w-4" />
            Automatizaciones
          </TabsTrigger>
        </TabsList>

        <TabsContent value="import">
          <ImportCustomersTab />
        </TabsContent>

        <TabsContent value="loyalty">
          <LoyaltyTab />
        </TabsContent>

        <TabsContent value="campaigns">
          <CampaignsTab />
        </TabsContent>

        <TabsContent value="automations">
          <AutomationsTab />
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}
