import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Clock, RefreshCw, Eye } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "./AdminLayout";

interface UploadResult {
  success?: boolean;
  dry_run?: boolean;
  filename?: string;
  provider?: string;
  records_total: number;
  records_inserted?: number;
  records_updated?: number;
  records_skipped: number;
  valid?: number;
  invalid?: number;
  errors: string[];
  preview?: any[];
  error?: string;
}

interface InventoryLog {
  id: number;
  action: string;
  filename: string;
  provider: string | null;
  records_total: number;
  records_inserted: number;
  records_updated: number;
  records_skipped: number;
  errors: string[];
  created_at: string;
}

const PROVIDERS = [
  { value: "none", label: "Sin proveedor específico" },
  { value: "Grand Oasis", label: "Grand Oasis" },
  { value: "Palace Resorts", label: "Palace Resorts" },
  { value: "AMR Collection", label: "AMR Collection" },
  { value: "Barcelo", label: "Barcelo Hotels" },
  { value: "Sandos", label: "Sandos Hotels" },
  { value: "Iberostar", label: "Iberostar" },
  { value: "Viva Wyndham", label: "Viva Wyndham" },
  { value: "Otro", label: "Otro" },
];

export default function AdminInventory() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [provider, setProvider] = useState("");
  const [dryRun, setDryRun] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const { data: logs, isLoading: logsLoading, refetch: refetchLogs } = useQuery<InventoryLog[]>({
    queryKey: ["/api/admin/inventory/logs"],
  });

  const ensureIndexMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/inventory/ensure-index", {}),
    onSuccess: () => toast({ title: "Índice creado correctamente" }),
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile) throw new Error("No hay archivo seleccionado");
      const formData = new FormData();
      formData.append("file", selectedFile);
      if (provider) formData.append("provider", provider);
      if (dryRun) formData.append("dry_run", "true");

      const res = await fetch("/api/admin/upload-inventory", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al subir archivo");
      return data as UploadResult;
    },
    onSuccess: (data) => {
      setUploadResult(data);
      if (!data.dry_run) {
        queryClient.invalidateQueries({ queryKey: ["/api/admin/inventory/logs"] });
        queryClient.invalidateQueries({ queryKey: ["/api/admin/bloqueos"] });
        toast({
          title: data.success ? "Inventario actualizado" : "Subida con errores",
          description: `${data.records_inserted || 0} nuevos, ${data.records_updated || 0} actualizados`,
        });
      } else {
        toast({ title: "Vista previa generada", description: `${data.valid} filas válidas de ${data.records_total}` });
      }
    },
    onError: (e: any) => {
      toast({ title: "Error al subir", description: e.message, variant: "destructive" });
    },
  });

  const handleFile = (file: File) => {
    const validTypes = [".csv", ".xlsx", ".xls"];
    const ext = file.name.toLowerCase().substring(file.name.lastIndexOf("."));
    if (!validTypes.includes(ext)) {
      toast({ title: "Formato inválido", description: "Solo CSV o XLSX permitidos", variant: "destructive" });
      return;
    }
    setSelectedFile(file);
    setUploadResult(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleString("es-MX", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Gestión de Inventario</h1>
            <p className="text-muted-foreground text-sm mt-1">Carga y actualiza bloqueos hoteleros vía CSV o XLSX</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => ensureIndexMutation.mutate()}
            disabled={ensureIndexMutation.isPending}
            data-testid="button-ensure-index"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Inicializar DB
          </Button>
        </div>

        <Tabs defaultValue="upload">
          <TabsList>
            <TabsTrigger value="upload" data-testid="tab-upload">Subir Inventario</TabsTrigger>
            <TabsTrigger value="logs" data-testid="tab-logs">Historial de Cargas</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Proveedor (opcional)</Label>
                <Select value={provider || "none"} onValueChange={(v) => setProvider(v === "none" ? "" : v)}>
                  <SelectTrigger data-testid="select-provider">
                    <SelectValue placeholder="Seleccionar proveedor..." />
                  </SelectTrigger>
                  <SelectContent>
                    {PROVIDERS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 flex flex-col justify-end">
                <label className="flex items-center gap-2 cursor-pointer select-none" data-testid="check-dry-run">
                  <input
                    type="checkbox"
                    checked={dryRun}
                    onChange={(e) => setDryRun(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium">Vista previa (dry run — no guarda en DB)</span>
                </label>
              </div>
            </div>

            <div
              className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors cursor-pointer ${
                isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
              }`}
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onClick={() => fileInputRef.current?.click()}
              data-testid="dropzone-inventory"
            >
              <FileSpreadsheet className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
              {selectedFile ? (
                <div>
                  <p className="font-semibold text-primary">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {(selectedFile.size / 1024).toFixed(1)} KB · Listo para subir
                  </p>
                </div>
              ) : (
                <div>
                  <p className="font-medium">Arrastra tu archivo CSV o XLSX aquí</p>
                  <p className="text-sm text-muted-foreground mt-1">o haz clic para seleccionar</p>
                  <p className="text-xs text-muted-foreground mt-3">Máximo 10 MB · CSV, XLS, XLSX</p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                data-testid="input-file-inventory"
              />
            </div>

            <Alert className="text-sm">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>
                <strong>Columnas reconocidas:</strong> hotel, proveedor, fecha inicio (DD/MM/YYYY), fecha fin, tipo habitacion,
                tarifa sencilla (SGL), tarifa doble (DBL), tarifa triple (TPL), tarifa cuadruple (QUAD), tarifa primer menor,
                tarifa junior, habitaciones disponibles, estado.
              </AlertDescription>
            </Alert>

            <div className="flex gap-3">
              <Button
                onClick={() => uploadMutation.mutate()}
                disabled={!selectedFile || uploadMutation.isPending}
                className="flex-1"
                data-testid="button-upload-inventory"
              >
                {uploadMutation.isPending ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                {dryRun ? "Vista previa" : "Subir y procesar"}
              </Button>
              {selectedFile && (
                <Button
                  variant="outline"
                  onClick={() => { setSelectedFile(null); setUploadResult(null); }}
                  data-testid="button-clear-file"
                >
                  Limpiar
                </Button>
              )}
            </div>

            {uploadResult && (
              <Card className={uploadResult.error ? "border-destructive" : uploadResult.dry_run ? "border-blue-500" : "border-green-500"}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    {uploadResult.error ? (
                      <AlertCircle className="w-4 h-4 text-destructive" />
                    ) : (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    )}
                    {uploadResult.dry_run ? "Vista previa (no guardado)" : uploadResult.error ? "Error" : "Carga exitosa"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {uploadResult.error ? (
                    <p className="text-sm text-destructive">{uploadResult.error}</p>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="bg-muted rounded-lg p-3 text-center">
                          <div className="text-2xl font-bold">{uploadResult.records_total}</div>
                          <div className="text-xs text-muted-foreground">Total filas</div>
                        </div>
                        {uploadResult.dry_run ? (
                          <>
                            <div className="bg-green-50 dark:bg-green-950 rounded-lg p-3 text-center">
                              <div className="text-2xl font-bold text-green-600">{uploadResult.valid}</div>
                              <div className="text-xs text-muted-foreground">Válidas</div>
                            </div>
                            <div className="bg-red-50 dark:bg-red-950 rounded-lg p-3 text-center">
                              <div className="text-2xl font-bold text-red-600">{uploadResult.invalid}</div>
                              <div className="text-xs text-muted-foreground">Inválidas</div>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="bg-green-50 dark:bg-green-950 rounded-lg p-3 text-center">
                              <div className="text-2xl font-bold text-green-600">{uploadResult.records_inserted}</div>
                              <div className="text-xs text-muted-foreground">Nuevos</div>
                            </div>
                            <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-3 text-center">
                              <div className="text-2xl font-bold text-blue-600">{uploadResult.records_updated}</div>
                              <div className="text-xs text-muted-foreground">Actualizados</div>
                            </div>
                            <div className="bg-yellow-50 dark:bg-yellow-950 rounded-lg p-3 text-center">
                              <div className="text-2xl font-bold text-yellow-600">{uploadResult.records_skipped}</div>
                              <div className="text-xs text-muted-foreground">Omitidos</div>
                            </div>
                          </>
                        )}
                      </div>

                      {uploadResult.errors && uploadResult.errors.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-muted-foreground">Errores detectados:</p>
                          <div className="bg-muted/50 rounded-md p-3 max-h-32 overflow-y-auto space-y-1">
                            {uploadResult.errors.map((err, i) => (
                              <p key={i} className="text-xs text-destructive font-mono" data-testid={`error-row-${i}`}>{err}</p>
                            ))}
                          </div>
                        </div>
                      )}

                      {uploadResult.dry_run && uploadResult.preview && uploadResult.preview.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-2 flex items-center gap-1">
                            <Eye className="w-3 h-3" /> Vista previa (primeras {uploadResult.preview.length} filas)
                          </p>
                          <div className="overflow-x-auto rounded-md border">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Hotel</TableHead>
                                  <TableHead>Check-in</TableHead>
                                  <TableHead>Check-out</TableHead>
                                  <TableHead className="text-right">DBL</TableHead>
                                  <TableHead className="text-right">Habitaciones</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {uploadResult.preview.map((row, i) => (
                                  <TableRow key={i} data-testid={`preview-row-${i}`}>
                                    <TableCell className="font-medium text-xs">{row.hotel}</TableCell>
                                    <TableCell className="text-xs">{row.fecha_inicio}</TableCell>
                                    <TableCell className="text-xs">{row.fecha_fin}</TableCell>
                                    <TableCell className="text-right text-xs">
                                      {row.tarifa_doble ? `$${parseFloat(row.tarifa_doble).toLocaleString("es-MX")}` : "—"}
                                    </TableCell>
                                    <TableCell className="text-right text-xs">{row.habitaciones_disponibles}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="logs" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">Historial de Sincronización</CardTitle>
                  <CardDescription>Últimas cargas de inventario registradas</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => refetchLogs()} data-testid="button-refresh-logs">
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent>
                {logsLoading ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">Cargando historial...</div>
                ) : !logs || logs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    Sin cargas previas. Sube tu primer archivo de inventario.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Archivo</TableHead>
                          <TableHead>Proveedor</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead className="text-right">Nuevos</TableHead>
                          <TableHead className="text-right">Actualizados</TableHead>
                          <TableHead className="text-right">Errores</TableHead>
                          <TableHead>Fecha</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {logs.map((log) => (
                          <TableRow key={log.id} data-testid={`log-row-${log.id}`}>
                            <TableCell className="text-sm font-medium max-w-40 truncate">{log.filename}</TableCell>
                            <TableCell>
                              {log.provider ? (
                                <Badge variant="secondary" className="text-xs">{log.provider}</Badge>
                              ) : (
                                <span className="text-muted-foreground text-xs">—</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right text-sm">{log.records_total}</TableCell>
                            <TableCell className="text-right text-sm text-green-600">{log.records_inserted}</TableCell>
                            <TableCell className="text-right text-sm text-blue-600">{log.records_updated}</TableCell>
                            <TableCell className="text-right text-sm">
                              {log.records_skipped > 0 ? (
                                <span className="text-destructive font-medium">{log.records_skipped}</span>
                              ) : (
                                <span className="text-muted-foreground">0</span>
                              )}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDate(log.created_at)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
