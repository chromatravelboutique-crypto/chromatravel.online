import { useQuery } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import {
  CalendarCheck,
  MessageSquare,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link } from "wouter";
import { DashboardLayout } from "./dashboard-layout";
import { useAuth } from "@/lib/auth";
import type { Booking, Lead } from "@shared/schema";

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, { label: string; className: string }> = {
    confirmed: { label: "Confirmada", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
    pending: { label: "Pendiente", className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
    cancelled: { label: "Cancelada", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
    new: { label: "Nuevo", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
    contacted: { label: "Contactado", className: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
  };

  const variant = variants[status] || { label: status, className: "" };

  return (
    <Badge variant="secondary" className={variant.className}>
      {variant.label}
    </Badge>
  );
}

export default function AgentDashboard() {
  const { user } = useAuth();

  const { data: bookings, isLoading: bookingsLoading } = useQuery<Booking[]>({
    queryKey: ["/api/admin/bookings"],
  });

  const { data: leads, isLoading: leadsLoading } = useQuery<Lead[]>({
    queryKey: ["/api/admin/leads"],
  });

  const pendingBookings = bookings?.filter(b => b.status === "pending") || [];
  const newLeads = leads?.filter(l => l.status === "new") || [];
  const contactedLeads = leads?.filter(l => l.status === "contacted") || [];

  const statsCards = [
    {
      title: "Reservaciones pendientes",
      value: pendingBookings.length.toString(),
      icon: Clock,
      color: "text-yellow-500",
    },
    {
      title: "Leads nuevos",
      value: newLeads.length.toString(),
      icon: MessageSquare,
      color: "text-blue-500",
    },
    {
      title: "En seguimiento",
      value: contactedLeads.length.toString(),
      icon: CalendarCheck,
      color: "text-purple-500",
    },
    {
      title: "Cerrados este mes",
      value: bookings?.filter(b => b.status === "confirmed").length.toString() || "0",
      icon: CheckCircle2,
      color: "text-green-500",
    },
  ];

  return (
    <DashboardLayout 
      title={`Hola, ${user?.firstName}`}
      description="Panel de agente - Gestiona tus leads y reservaciones"
    >
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="mt-2 font-display text-2xl font-bold">
                    {stat.value}
                  </p>
                </div>
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-muted ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
            <CardTitle className="font-display">Leads por atender</CardTitle>
            <Link href="/dashboard/leads">
              <Button variant="outline" size="sm">Ver todos</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {leadsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : newLeads.length > 0 ? (
              <div className="space-y-4">
                {newLeads.slice(0, 5).map((lead) => (
                  <div
                    key={lead.id}
                    className="flex items-start justify-between gap-4 rounded-lg border p-3"
                  >
                    <div className="flex gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          {lead.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{lead.name}</p>
                        <p className="text-sm text-muted-foreground">{lead.email}</p>
                        <p className="text-xs text-muted-foreground">
                          {lead.destination || "Sin destino"} - {lead.createdAt
                            ? formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true, locale: es })
                            : "Reciente"}
                        </p>
                      </div>
                    </div>
                    <Button size="sm" data-testid={`button-contact-${lead.id}`}>
                      Contactar
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                No hay leads nuevos
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
            <CardTitle className="font-display">Reservaciones pendientes</CardTitle>
            <Link href="/dashboard/bookings">
              <Button variant="outline" size="sm">Ver todas</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {bookingsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : pendingBookings.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Huésped</TableHead>
                    <TableHead>Fechas</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingBookings.slice(0, 5).map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell className="font-medium">
                        {booking.guestFirstName} {booking.guestLastName}
                      </TableCell>
                      <TableCell>
                        {booking.checkIn && format(new Date(booking.checkIn), "d MMM", { locale: es })}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={booking.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                No hay reservaciones pendientes
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
