import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  DndContext, 
  DragEndEvent, 
  DragOverlay,
  DragStartEvent,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { 
  SortableContext, 
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  MoreVertical, 
  MessageSquare, 
  UserCheck,
  Trash2,
  MapPin,
} from "lucide-react";
import type { Lead } from "@shared/schema";

const LEAD_STATUSES = [
  { id: "new", label: "Nuevos", color: "bg-blue-500" },
  { id: "contacted", label: "Contactados", color: "bg-yellow-500" },
  { id: "qualified", label: "Calificados", color: "bg-purple-500" },
  { id: "proposal", label: "Propuesta", color: "bg-orange-500" },
  { id: "negotiation", label: "Negociación", color: "bg-pink-500" },
  { id: "won", label: "Ganados", color: "bg-green-500" },
  { id: "lost", label: "Perdidos", color: "bg-red-500" },
];

interface LeadCardProps {
  lead: Lead;
  onConvert: (id: string) => void;
  onDelete: (id: string) => void;
  onAddNote: (id: string) => void;
}

function LeadCard({ lead, onConvert, onDelete, onAddNote }: LeadCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card 
      ref={setNodeRef} 
      style={style}
      className="cursor-grab active:cursor-grabbing mb-2 hover-elevate"
      {...attributes}
      {...listeners}
      data-testid={`card-lead-${lead.id}`}
    >
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate" data-testid={`text-lead-name-${lead.id}`}>
              {lead.name}
            </p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <Mail className="h-3 w-3" />
              <span className="truncate">{lead.email}</span>
            </div>
            {lead.phone && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Phone className="h-3 w-3" />
                <span>{lead.phone}</span>
              </div>
            )}
            {lead.destination && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span>{lead.destination}</span>
              </div>
            )}
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6" data-testid={`button-lead-menu-${lead.id}`}>
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onAddNote(lead.id)} data-testid={`button-add-note-${lead.id}`}>
                <MessageSquare className="h-4 w-4 mr-2" />
                Agregar nota
              </DropdownMenuItem>
              {lead.status !== "won" && (
                <DropdownMenuItem onClick={() => onConvert(lead.id)} data-testid={`button-convert-${lead.id}`}>
                  <UserCheck className="h-4 w-4 mr-2" />
                  Convertir a cliente
                </DropdownMenuItem>
              )}
              <DropdownMenuItem 
                onClick={() => onDelete(lead.id)} 
                className="text-destructive"
                data-testid={`button-delete-${lead.id}`}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {lead.createdAt && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2 pt-2 border-t">
            <Calendar className="h-3 w-3" />
            <span>{new Date(lead.createdAt).toLocaleDateString("es-MX")}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface KanbanColumnProps {
  status: typeof LEAD_STATUSES[number];
  leads: Lead[];
  onConvert: (id: string) => void;
  onDelete: (id: string) => void;
  onAddNote: (id: string) => void;
}

function KanbanColumn({ status, leads, onConvert, onDelete, onAddNote }: KanbanColumnProps) {
  return (
    <div className="flex-shrink-0 w-72" data-testid={`column-${status.id}`}>
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-3 h-3 rounded-full ${status.color}`} />
        <h3 className="font-semibold text-sm">{status.label}</h3>
        <Badge variant="secondary" className="ml-auto">{leads.length}</Badge>
      </div>
      
      <div className="bg-muted/50 rounded-lg p-2 min-h-[400px]">
        <SortableContext items={leads.map(l => l.id)} strategy={verticalListSortingStrategy}>
          {leads.map((lead) => (
            <LeadCard 
              key={lead.id} 
              lead={lead} 
              onConvert={onConvert}
              onDelete={onDelete}
              onAddNote={onAddNote}
            />
          ))}
        </SortableContext>
        
        {leads.length === 0 && (
          <div className="flex items-center justify-center h-20 text-muted-foreground text-sm">
            Sin leads
          </div>
        )}
      </div>
    </div>
  );
}

export function LeadKanban() {
  const { toast } = useToast();
  const [activeId, setActiveId] = useState<string | null>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const { data, isLoading } = useQuery<{
    kanban: Record<string, Lead[]>;
    metrics: { total: number; conversionRate: string; byStatus: { status: string; count: number }[] };
  }>({
    queryKey: ["/api/admin/leads/kanban"],
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ leadId, status }: { leadId: string; status: string }) => {
      return apiRequest("PATCH", `/api/admin/leads/${leadId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/leads/kanban"] });
      toast({ title: "Lead actualizado" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const convertMutation = useMutation({
    mutationFn: async (leadId: string) => {
      return apiRequest("POST", `/api/admin/leads/${leadId}/convert`);
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/leads/kanban"] });
      toast({ 
        title: "Lead convertido", 
        description: `Código cliente: ${data.customerCode}` 
      });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (leadId: string) => {
      return apiRequest("DELETE", `/api/admin/leads/${leadId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/leads/kanban"] });
      toast({ title: "Lead eliminado" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeLeadId = active.id as string;
    const overColumnId = over.id as string;
    
    let currentStatus = "";
    let newStatus = overColumnId;
    
    for (const [status, leads] of Object.entries(data?.kanban || {})) {
      if (leads.some(l => l.id === activeLeadId)) {
        currentStatus = status;
        break;
      }
    }
    
    if (!LEAD_STATUSES.find(s => s.id === newStatus)) {
      for (const [status, leads] of Object.entries(data?.kanban || {})) {
        if (leads.some(l => l.id === overColumnId)) {
          newStatus = status;
          break;
        }
      }
    }

    if (currentStatus !== newStatus && newStatus) {
      updateStatusMutation.mutate({ leadId: activeLeadId, status: newStatus });
    }
  };

  const handleAddNote = (leadId: string) => {
    toast({ title: "Próximamente", description: "La función de notas estará disponible pronto" });
  };

  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto p-4">
        {LEAD_STATUSES.map(status => (
          <div key={status.id} className="flex-shrink-0 w-72">
            <Skeleton className="h-8 w-full mb-3" />
            <Skeleton className="h-96 w-full" />
          </div>
        ))}
      </div>
    );
  }

  const kanbanData = data?.kanban || {};
  const metrics = data?.metrics;

  return (
    <div className="space-y-4">
      {metrics && (
        <div className="flex gap-4 flex-wrap">
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{metrics.total}</p>
                <p className="text-xs text-muted-foreground">Total Leads</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{metrics.conversionRate}</p>
                <p className="text-xs text-muted-foreground">Tasa de conversión</p>
              </div>
            </div>
          </Card>
        </div>
      )}
      
      <DndContext 
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {LEAD_STATUSES.map(status => (
            <KanbanColumn
              key={status.id}
              status={status}
              leads={kanbanData[status.id] || []}
              onConvert={(id) => convertMutation.mutate(id)}
              onDelete={(id) => deleteMutation.mutate(id)}
              onAddNote={handleAddNote}
            />
          ))}
        </div>
      </DndContext>
    </div>
  );
}

export default LeadKanban;
