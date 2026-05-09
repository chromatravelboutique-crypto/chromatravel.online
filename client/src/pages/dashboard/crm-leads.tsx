import { DashboardLayout } from "./dashboard-layout";
import { LeadKanban } from "@/components/crm/LeadKanban";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { 
  Users, 
  TrendingUp, 
  Calendar,
  Mail,
  Phone,
  LayoutGrid,
  List,
} from "lucide-react";
import type { Lead } from "@shared/schema";

function LeadsList() {
  const { data: leads, isLoading } = useQuery<Lead[]>({
    queryKey: ["/api/admin/leads"],
  });

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Cargando leads...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Todos los Leads
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Destino</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fecha</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads?.map((lead) => (
              <TableRow key={lead.id} data-testid={`row-lead-${lead.id}`}>
                <TableCell className="font-medium">{lead.name}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Mail className="h-3 w-3 text-muted-foreground" />
                    {lead.email}
                  </div>
                </TableCell>
                <TableCell>
                  {lead.phone ? (
                    <div className="flex items-center gap-1">
                      <Phone className="h-3 w-3 text-muted-foreground" />
                      {lead.phone}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>{lead.destination || "-"}</TableCell>
                <TableCell>
                  <StatusBadge status={lead.status || "new"} />
                </TableCell>
                <TableCell>
                  {lead.createdAt ? format(new Date(lead.createdAt), "dd MMM yyyy", { locale: es }) : "-"}
                </TableCell>
              </TableRow>
            ))}
            {(!leads || leads.length === 0) && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No hay leads registrados
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, { label: string; className: string }> = {
    new: { label: "Nuevo", className: "bg-blue-500" },
    contacted: { label: "Contactado", className: "bg-yellow-500" },
    qualified: { label: "Calificado", className: "bg-purple-500" },
    proposal: { label: "Propuesta", className: "bg-orange-500" },
    negotiation: { label: "Negociación", className: "bg-pink-500" },
    won: { label: "Ganado", className: "bg-green-500" },
    lost: { label: "Perdido", className: "bg-red-500" },
  };

  const variant = variants[status] || { label: status, className: "bg-gray-500" };

  return (
    <Badge className={`${variant.className} text-white`}>
      {variant.label}
    </Badge>
  );
}

export default function CRMLeadsPage() {
  return (
    <DashboardLayout 
      title="CRM - Gestión de Leads"
      description="Gestiona tu pipeline de ventas con el tablero Kanban"
    >
      <Tabs defaultValue="kanban" className="space-y-4">
        <TabsList>
          <TabsTrigger value="kanban" className="flex items-center gap-2" data-testid="tab-kanban">
            <LayoutGrid className="h-4 w-4" />
            Kanban
          </TabsTrigger>
          <TabsTrigger value="list" className="flex items-center gap-2" data-testid="tab-list">
            <List className="h-4 w-4" />
            Lista
          </TabsTrigger>
        </TabsList>

        <TabsContent value="kanban" className="space-y-4">
          <LeadKanban />
        </TabsContent>

        <TabsContent value="list">
          <LeadsList />
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
