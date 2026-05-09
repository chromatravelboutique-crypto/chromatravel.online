import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import {
  Search,
  Filter,
  Phone,
  Mail,
  MapPin,
  Calendar,
  MessageSquare,
  MoreHorizontal,
  CheckCircle2,
  Clock,
  XCircle,
  UserPlus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { DashboardLayout } from "./dashboard-layout";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Lead } from "@shared/schema";

interface Brand {
  id: string;
  code: string;
  name: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  new: { label: "Nuevo", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: UserPlus },
  contacted: { label: "Contactado", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400", icon: Phone },
  qualified: { label: "Calificado", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400", icon: CheckCircle2 },
  proposal: { label: "Propuesta", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400", icon: MessageSquare },
  converted: { label: "Convertido", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle2 },
  lost: { label: "Perdido", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: XCircle },
};

function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || statusConfig.new;
  return (
    <Badge variant="secondary" className={config.color}>
      {config.label}
    </Badge>
  );
}

function LeadCard({ lead, onUpdate }: { lead: Lead; onUpdate: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Lead>) =>
      apiRequest("PATCH", `/api/admin/leads/${lead.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/leads"] });
      toast({ title: "Lead actualizado" });
      onUpdate();
    },
  });

  const handleStatusChange = (newStatus: string) => {
    updateMutation.mutate({ status: newStatus });
  };

  return (
    <>
      <Card className="hover-elevate cursor-pointer" onClick={() => setIsOpen(true)} data-testid={`card-lead-${lead.id}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex gap-3">
              <Avatar className="h-10 w-10" data-testid={`avatar-lead-${lead.id}`}>
                <AvatarFallback className="bg-primary/10 text-primary">
                  {lead.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate" data-testid={`text-lead-name-${lead.id}`}>{lead.name}</p>
                <p className="text-sm text-muted-foreground truncate" data-testid={`text-lead-email-${lead.id}`}>{lead.email}</p>
                {lead.destination && (
                  <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {lead.destination}
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <StatusBadge status={lead.status || "new"} />
              <span className="text-xs text-muted-foreground">
                {lead.createdAt
                  ? formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true, locale: es })
                  : "Reciente"}
              </span>
            </div>
          </div>
          {lead.message && (
            <p className="mt-3 text-sm text-muted-foreground line-clamp-2">{lead.message}</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">Detalle del Lead</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14">
                <AvatarFallback className="bg-primary/10 text-primary text-lg">
                  {lead.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-lg">{lead.name}</h3>
                <StatusBadge status={lead.status || "new"} />
              </div>
            </div>

            <div className="grid gap-3">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a href={`mailto:${lead.email}`} className="text-sm hover:underline">{lead.email}</a>
              </div>
              {lead.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a href={`tel:${lead.phone}`} className="text-sm hover:underline">{lead.phone}</a>
                </div>
              )}
              {lead.destination && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{lead.destination}</span>
                </div>
              )}
              {lead.travelDates && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{lead.travelDates}</span>
                </div>
              )}
            </div>

            {lead.message && (
              <div>
                <Label className="text-muted-foreground">Mensaje</Label>
                <p className="mt-1 text-sm p-3 bg-muted rounded-md">{lead.message}</p>
              </div>
            )}

            <div>
              <Label>Cambiar Estado</Label>
              <Select value={lead.status || "new"} onValueChange={handleStatusChange}>
                <SelectTrigger className="mt-1" data-testid="select-lead-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(statusConfig).map(([value, config]) => (
                    <SelectItem key={value} value={value}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-2">
              <Button className="flex-1" asChild>
                <a href={`mailto:${lead.email}`} data-testid={`button-email-lead-${lead.id}`}>
                  <Mail className="h-4 w-4 mr-2" />
                  Enviar Email
                </a>
              </Button>
              {lead.phone && (
                <Button variant="outline" className="flex-1" asChild>
                  <a href={`https://wa.me/${lead.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener" data-testid={`button-whatsapp-lead-${lead.id}`}>
                    <Phone className="h-4 w-4 mr-2" />
                    WhatsApp
                  </a>
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function LeadsManagement() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedBrand, setSelectedBrand] = useState<string>("all");

  const { data: brands } = useQuery<Brand[]>({
    queryKey: ["/api/brands"],
  });

  const { data: leads, isLoading, refetch } = useQuery<Lead[]>({
    queryKey: ["/api/admin/leads"],
  });

  const filteredLeads = leads?.filter((lead) => {
    const matchesSearch =
      lead.name.toLowerCase().includes(search.toLowerCase()) ||
      lead.email.toLowerCase().includes(search.toLowerCase()) ||
      (lead.destination?.toLowerCase().includes(search.toLowerCase()) ?? false);
    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
    const matchesBrand = selectedBrand === "all" || lead.brandId === selectedBrand;
    return matchesSearch && matchesStatus && matchesBrand;
  }) || [];

  const leadsByStatus = filteredLeads.reduce((acc, lead) => {
    const status = lead.status || "new";
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <DashboardLayout
      title="Gestión de Leads"
      description="Administra y da seguimiento a todos los prospectos"
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {Object.entries(statusConfig).slice(0, 4).map(([status, config]) => {
          const Icon = config.icon;
          return (
            <Card key={status}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm text-muted-foreground">{config.label}</p>
                    <p className="text-2xl font-bold" data-testid={`stat-leads-${status}`}>
                      {leadsByStatus[status] || 0}
                    </p>
                  </div>
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${config.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4">
          <CardTitle className="font-display">Todos los Leads</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar leads..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-64 pl-10"
                data-testid="input-search-leads"
              />
            </div>
            <Select value={selectedBrand} onValueChange={setSelectedBrand}>
              <SelectTrigger className="w-40" data-testid="select-filter-brand">
                <SelectValue placeholder="Marca" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las marcas</SelectItem>
                {brands?.map((brand) => (
                  <SelectItem key={brand.id} value={brand.id}>
                    {brand.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40" data-testid="select-filter-status">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {Object.entries(statusConfig).map(([value, config]) => (
                  <SelectItem key={value} value={value}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : filteredLeads.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredLeads.map((lead) => (
                <LeadCard key={lead.id} lead={lead} onUpdate={refetch} />
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay leads que coincidan con tu búsqueda.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
