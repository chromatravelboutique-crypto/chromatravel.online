import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "./AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
  Play, 
  Download, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileJson,
  Package,
  Loader2,
  AlertCircle,
  RefreshCw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CertificationCase {
  id: string;
  name: string;
  description: string;
  rooms: Array<{
    adults: number;
    children: number;
    childrenAges: number[];
  }>;
  withSupplements?: boolean;
}

interface CaseStatus {
  caseId: string;
  name: string;
  hasLogs: boolean;
  logFiles: string[];
}

interface CertificationResult {
  caseId: string;
  caseName?: string;
  success: boolean;
  steps: Array<{ step: string; success: boolean; error?: string }>;
  confirmationNumber?: string;
}

export default function AdminTBOCertification() {
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [cityCode, setCityCode] = useState("115936");
  const [hotelCodes, setHotelCodes] = useState("");
  const [nationality, setNationality] = useState("MX");
  const [runningCase, setRunningCase] = useState<string | null>(null);
  const [results, setResults] = useState<CertificationResult[]>([]);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const getAuthHeader = (): Record<string, string> => {
    const token = localStorage.getItem("adminToken");
    return token ? { "Authorization": `Bearer ${token}` } : {};
  };

  const { data, isLoading, refetch } = useQuery<{ cases: CertificationCase[]; status: CaseStatus[] }>({
    queryKey: ["/api/admin/tbo/certification/cases"],
    queryFn: async () => {
      const res = await fetch("/api/admin/tbo/certification/cases", { headers: getAuthHeader() });
      if (!res.ok) throw new Error("Error al cargar casos");
      return res.json();
    },
  });

  const runCaseMutation = useMutation({
    mutationFn: async (caseId: string) => {
      const res = await fetch("/api/admin/tbo/certification/run", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify({ caseId, checkIn, checkOut, cityCode, hotelCodes: hotelCodes || undefined, nationality }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al ejecutar caso");
      }
      return res.json();
    },
    onSuccess: (result: CertificationResult) => {
      setResults(prev => [...prev.filter(r => r.caseId !== result.caseId), result]);
      refetch();
      toast({ title: "Éxito", description: `Caso ${result.caseId} completado` });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
    onSettled: () => {
      setRunningCase(null);
    },
  });

  const runAllMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/tbo/certification/run-all", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify({ checkIn, checkOut, cityCode, hotelCodes: hotelCodes || undefined, nationality }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al ejecutar casos");
      }
      return res.json();
    },
    onSuccess: (data: { results: CertificationResult[] }) => {
      setResults(data.results);
      refetch();
      toast({ title: "Éxito", description: "Todos los casos ejecutados" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const clearLogsMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/tbo/certification/clear", {
        method: "POST",
        headers: getAuthHeader(),
      });
      if (!res.ok) throw new Error("Error al limpiar logs");
      return res.json();
    },
    onSuccess: () => {
      setResults([]);
      refetch();
      toast({ title: "Éxito", description: "Logs eliminados" });
    },
    onError: () => toast({ title: "Error", description: "Error al eliminar logs", variant: "destructive" }),
  });

  const handleRunCase = (caseId: string) => {
    if (!checkIn || !checkOut) {
      toast({ title: "Error", description: "Por favor selecciona fechas de check-in y check-out", variant: "destructive" });
      return;
    }
    setRunningCase(caseId);
    runCaseMutation.mutate(caseId);
  };

  const handleRunAll = () => {
    if (!checkIn || !checkOut) {
      toast({ title: "Error", description: "Por favor selecciona fechas de check-in y check-out", variant: "destructive" });
      return;
    }
    runAllMutation.mutate();
  };

  const handleDownload = () => {
    window.open("/api/admin/tbo/certification/download", "_blank");
  };

  const getStepIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="h-4 w-4 text-green-600" />
    ) : (
      <XCircle className="h-4 w-4 text-red-600" />
    );
  };

  const getCaseResult = (caseId: string) => {
    return results.find(r => r.caseId === caseId);
  };

  const getCaseStatus = (caseId: string) => {
    return data?.status.find(s => s.caseId === caseId);
  };

  const completedCases = data?.status.filter(s => s.hasLogs).length || 0;
  const totalCases = data?.cases.length || 0;
  const progress = totalCases > 0 ? (completedCases / totalCases) * 100 : 0;

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 30);
  const defaultCheckIn = tomorrow.toISOString().split('T')[0];
  
  const dayAfter = new Date(tomorrow);
  dayAfter.setDate(dayAfter.getDate() + 3);
  const defaultCheckOut = dayAfter.toISOString().split('T')[0];

  return (
    <AdminLayout title="Certificación TBO" activeMenu="tbo">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Package className="h-6 w-6 text-blue-600" />
              Certificación TBO Holidays
            </h1>
            <p className="text-muted-foreground">
              Ejecuta los casos de prueba y genera el paquete ZIP para enviar a TBO
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => refetch()} data-testid="button-refresh">
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => clearLogsMutation.mutate()}
              disabled={clearLogsMutation.isPending}
              data-testid="button-clear"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Limpiar Logs
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Progreso de Certificación</CardTitle>
            <CardDescription>
              {completedCases} de {totalCases} casos completados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={progress} className="h-3" />
            <div className="flex justify-between mt-2 text-sm text-muted-foreground">
              <span>0%</span>
              <span>{Math.round(progress)}%</span>
              <span>100%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Parámetros de Búsqueda</CardTitle>
            <CardDescription>
              Configura los parámetros para ejecutar las pruebas de certificación
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label htmlFor="checkIn">Check-in</Label>
                <Input
                  id="checkIn"
                  type="date"
                  value={checkIn || defaultCheckIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  data-testid="input-checkin"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="checkOut">Check-out</Label>
                <Input
                  id="checkOut"
                  type="date"
                  value={checkOut || defaultCheckOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  min={checkIn || defaultCheckIn}
                  data-testid="input-checkout"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cityCode">Código Ciudad TBO</Label>
                <Input
                  id="cityCode"
                  value={cityCode}
                  onChange={(e) => setCityCode(e.target.value)}
                  placeholder="Ej: 115936 (Cancún)"
                  data-testid="input-citycode"
                />
                <p className="text-xs text-muted-foreground">115936 = Cancún</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="hotelCodes">Códigos Hotel (opcional)</Label>
                <Input
                  id="hotelCodes"
                  value={hotelCodes}
                  onChange={(e) => setHotelCodes(e.target.value)}
                  placeholder="Ej: 1234567,7654321"
                  data-testid="input-hotelcodes"
                />
                <p className="text-xs text-muted-foreground">Separar con comas</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="nationality">Nacionalidad</Label>
                <Input
                  id="nationality"
                  value={nationality}
                  onChange={(e) => setNationality(e.target.value)}
                  placeholder="MX"
                  maxLength={2}
                  data-testid="input-nationality"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <Button 
                onClick={handleRunAll}
                disabled={runAllMutation.isPending || !checkIn || !checkOut}
                className="bg-blue-600 hover:bg-blue-700"
                data-testid="button-run-all"
              >
                {runAllMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                Ejecutar Todos los Casos
              </Button>
              <Button 
                onClick={handleDownload}
                disabled={completedCases === 0}
                variant="secondary"
                data-testid="button-download"
              >
                <Download className="h-4 w-4 mr-2" />
                Descargar ZIP para TBO
              </Button>
            </div>
          </CardContent>
        </Card>

        {runAllMutation.isPending && (
          <Alert>
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertDescription>
              Ejecutando todos los casos de certificación. Esto puede tomar varios minutos...
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4">
          <h2 className="text-xl font-semibold">Casos de Certificación</h2>
          
          {isLoading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto" />
              <p className="mt-2 text-muted-foreground">Cargando casos...</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {data?.cases.map((caseConfig) => {
                const status = getCaseStatus(caseConfig.id);
                const result = getCaseResult(caseConfig.id);
                const isRunning = runningCase === caseConfig.id;
                
                return (
                  <Card key={caseConfig.id} className={status?.hasLogs ? "border-green-200" : ""} data-testid={`card-case-${caseConfig.id}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            {status?.hasLogs ? (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            ) : (
                              <Clock className="h-5 w-5 text-gray-400" />
                            )}
                            {caseConfig.name}
                          </CardTitle>
                          <CardDescription>{caseConfig.description}</CardDescription>
                        </div>
                        <Badge variant={status?.hasLogs ? "default" : "secondary"}>
                          {status?.hasLogs ? "Completado" : "Pendiente"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                          {caseConfig.rooms.map((room, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              Hab {idx + 1}: {room.adults}A 
                              {room.children > 0 && ` + ${room.children}N (${room.childrenAges.join(', ')} años)`}
                            </Badge>
                          ))}
                          {caseConfig.withSupplements && (
                            <Badge variant="outline" className="text-xs bg-purple-50">
                              + Suplementos
                            </Badge>
                          )}
                        </div>

                        {result && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg space-y-2">
                            <div className="flex flex-wrap gap-2">
                              {result.steps.map((step, idx) => (
                                <div key={idx} className="flex items-center gap-1 text-sm">
                                  {getStepIcon(step.success)}
                                  <span className={step.success ? "text-green-700" : "text-red-700"}>
                                    {step.step}
                                  </span>
                                </div>
                              ))}
                            </div>
                            {result.confirmationNumber && (
                              <p className="text-sm text-green-700">
                                Confirmación: <strong>{result.confirmationNumber}</strong>
                              </p>
                            )}
                          </div>
                        )}

                        {status?.hasLogs && status.logFiles.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {status.logFiles.map((file, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                <FileJson className="h-3 w-3 mr-1" />
                                {file}
                              </Badge>
                            ))}
                          </div>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRunCase(caseConfig.id)}
                          disabled={isRunning || runAllMutation.isPending}
                          className="w-full mt-2"
                          data-testid={`button-run-${caseConfig.id}`}
                        >
                          {isRunning ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Play className="h-4 w-4 mr-2" />
                          )}
                          {status?.hasLogs ? "Re-ejecutar" : "Ejecutar"} Caso
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        <Alert className="bg-blue-50 border-blue-200">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Instrucciones:</strong> Una vez completados todos los casos, descarga el ZIP y envíalo al equipo de certificación de TBO Holidays.
            El ZIP incluye todos los JSON de Request/Response y una carta de presentación lista para enviar.
          </AlertDescription>
        </Alert>
      </div>
    </AdminLayout>
  );
}
