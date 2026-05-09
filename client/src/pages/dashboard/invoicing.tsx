import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileText, Info } from "lucide-react";

export default function InvoicingPage() {
  return (
    <div className="flex flex-col gap-6 p-6" data-testid="invoicing-page">
      <div className="flex items-center gap-3">
        <FileText className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Facturación Electrónica</h1>
          <p className="text-muted-foreground">Genera facturas CFDI 4.0 para tus clientes</p>
        </div>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Utiliza FacturaTotal para generar facturas electrónicas. Los datos de facturación de tus clientes se encuentran en su perfil del CRM.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="facturatotal" className="w-full">
        <TabsList>
          <TabsTrigger value="facturatotal" data-testid="tab-facturatotal">FacturaTotal</TabsTrigger>
          <TabsTrigger value="historial" data-testid="tab-historial">Historial</TabsTrigger>
        </TabsList>

        <TabsContent value="facturatotal" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Portal de Facturación</CardTitle>
              <CardDescription>
                Inicia sesión en FacturaTotal para crear y administrar tus facturas CFDI
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="w-full min-h-[600px] border rounded-lg overflow-hidden bg-white">
                <iframe 
                  src="https://app.facturatotal.com.mx/login-iframe"
                  className="w-full h-[600px]"
                  title="FacturaTotal - Portal de Facturación"
                  data-testid="iframe-facturatotal"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="historial" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Facturas</CardTitle>
              <CardDescription>
                Registro de facturas emitidas a través de la plataforma
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No hay facturas registradas aún</p>
                <p className="text-sm mt-2">Las facturas aparecerán aquí cuando se integre una API de facturación</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
