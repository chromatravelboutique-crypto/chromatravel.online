import { useQuery, useMutation } from "@tanstack/react-query";
import { Play, Loader2, Gift, Users, Repeat2, Bell, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DashboardLayout } from "@/pages/dashboard/dashboard-layout";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";

interface AutoFlow {
  key: string;
  name: string;
  description: string;
}

const FLOW_ICONS: Record<string, React.ReactNode> = {
  birthdays: <Gift className="h-5 w-5 text-pink-500" />,
  coldLeads: <Users className="h-5 w-5 text-blue-500" />,
  winback:   <Repeat2 className="h-5 w-5 text-orange-500" />,
  reminders: <Bell className="h-5 w-5 text-amber-500" />,
  reviews:   <Star className="h-5 w-5 text-yellow-500" />,
};

interface RunResult {
  birthdays?: { sent: number };
  coldLeads?: { sent: number };
  winback?: { sent: number };
  reminders?: { sent: number };
  reviews?: { sent: number };
}

export default function AdminAutomations() {
  const [lastRun, setLastRun] = useState<RunResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const { data, isLoading } = useQuery<{ flows: AutoFlow[] }>({
    queryKey: ["/api/admin/automations/status"],
  });

  const triggerMutation = useMutation({
    mutationFn: () => {
      setIsRunning(true);
      return apiRequest("POST", "/api/admin/automations/trigger", {});
    },
    onSuccess: (data: any) => {
      setLastRun(data);
      setIsRunning(false);
    },
    onError: () => setIsRunning(false),
  });

  const flows = data?.flows || [];

  return (
    <DashboardLayout
      title="Automatizaciones CRM"
      description="Flujos automáticos de seguimiento para leads y clientes"
    >
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">
            Los flujos se ejecutan automáticamente cada día. También puedes disparar manualmente todos los flujos para tu marca.
          </p>
        </div>
        <Button onClick={() => triggerMutation.mutate()} disabled={isRunning}>
          {isRunning ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Ejecutando...</>
          ) : (
            <><Play className="mr-2 h-4 w-4" />Ejecutar ahora</>
          )}
        </Button>
      </div>

      {lastRun && (
        <Card className="mb-6 border-green-500/30 bg-green-500/5">
          <CardContent className="p-4">
            <p className="font-medium text-green-700 dark:text-green-400 mb-2">Resultado de la última ejecución:</p>
            <div className="flex flex-wrap gap-3 text-sm">
              {Object.entries(lastRun).map(([key, val]) => (
                <span key={key} className="flex items-center gap-1.5">
                  {FLOW_ICONS[key]}
                  <span className="font-medium">{flows.find((f) => f.key === key)?.name || key}:</span>
                  <Badge variant="outline">{(val as any)?.sent ?? 0} enviados</Badge>
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Cargando flujos...</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {flows.map((flow) => (
            <Card key={flow.key}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  {FLOW_ICONS[flow.key]}
                  {flow.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{flow.description}</p>
                <div className="mt-3 flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">Activo</Badge>
                  <span className="text-xs text-muted-foreground">Diario — 8:00 AM</span>
                </div>
                {lastRun && (lastRun as any)[flow.key] && (
                  <p className="mt-2 text-xs text-green-600 font-medium">
                    Último resultado: {(lastRun as any)[flow.key]?.sent} enviados
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-base">Triggers de pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Cuando un agente cambia la etapa de un lead, se genera automáticamente un mensaje de WhatsApp personalizado para enviar:
          </p>
          <div className="space-y-3">
            {[
              { stage: "Contactado",  msg: "Mensaje de presentación y apertura de conversación" },
              { stage: "Cotizado",    msg: "Notificación de cotización lista con invitación a revisarla" },
              { stage: "Ganado",      msg: "Confirmación de viaje y mensaje de celebración" },
            ].map((t) => (
              <div key={t.stage} className="flex items-start gap-3 rounded-lg border p-3">
                <Badge variant="secondary" className="shrink-0">{t.stage}</Badge>
                <p className="text-sm text-muted-foreground">{t.msg}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
