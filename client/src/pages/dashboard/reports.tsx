import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Users,
  Calendar,
  Hotel,
  MessageSquare,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardLayout } from "./dashboard-layout";
import type { Booking, Lead } from "@shared/schema";

interface AdminStats {
  totalBookings: number;
  totalLeads: number;
  totalHotels: number;
  totalRevenue: number;
}

function MetricCard({
  title,
  value,
  change,
  changeType,
  icon: Icon,
  iconColor,
  testId,
}: {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: any;
  iconColor: string;
  testId?: string;
}) {
  return (
    <Card data-testid={testId}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="mt-2 font-display text-3xl font-bold" data-testid={testId ? `${testId}-value` : undefined}>{value}</p>
            {change && (
              <div className={`flex items-center gap-1 mt-1 text-sm ${
                changeType === "positive" ? "text-green-600" :
                changeType === "negative" ? "text-red-600" : "text-muted-foreground"
              }`}>
                {changeType === "positive" && <ArrowUpRight className="h-4 w-4" />}
                {changeType === "negative" && <ArrowDownRight className="h-4 w-4" />}
                {change}
              </div>
            )}
          </div>
          <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${iconColor}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RevenueByStatusChart({ bookings }: { bookings: Booking[] }) {
  const statusRevenue = bookings.reduce((acc, booking) => {
    const status = booking.status || "pending";
    acc[status] = (acc[status] || 0) + Number(booking.totalPrice || 0);
    return acc;
  }, {} as Record<string, number>);

  const statusLabels: Record<string, string> = {
    pending: "Pendiente",
    confirmed: "Confirmada",
    paid: "Pagada",
    cancelled: "Cancelada",
    completed: "Completada",
  };

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-500",
    confirmed: "bg-green-500",
    paid: "bg-blue-500",
    cancelled: "bg-red-500",
    completed: "bg-purple-500",
  };

  const total = Object.values(statusRevenue).reduce((a, b) => a + b, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display">Ingresos por Estado</CardTitle>
        <CardDescription>Distribución de ingresos según el estado de las reservaciones</CardDescription>
      </CardHeader>
      <CardContent>
        {total > 0 ? (
          <div className="space-y-4">
            {Object.entries(statusRevenue).map(([status, revenue]) => {
              const percentage = (revenue / total) * 100;
              return (
                <div key={status} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>{statusLabels[status] || status}</span>
                    <span className="font-medium">${revenue.toLocaleString()} ({percentage.toFixed(1)}%)</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full ${statusColors[status] || "bg-gray-500"}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">No hay datos disponibles</p>
        )}
      </CardContent>
    </Card>
  );
}

function LeadsByStatusChart({ leads }: { leads: Lead[] }) {
  const statusCounts = leads.reduce((acc, lead) => {
    const status = lead.status || "new";
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusLabels: Record<string, string> = {
    new: "Nuevo",
    contacted: "Contactado",
    qualified: "Calificado",
    proposal: "Propuesta",
    converted: "Convertido",
    lost: "Perdido",
  };

  const statusColors: Record<string, string> = {
    new: "bg-blue-500",
    contacted: "bg-purple-500",
    qualified: "bg-yellow-500",
    proposal: "bg-orange-500",
    converted: "bg-green-500",
    lost: "bg-red-500",
  };

  const total = leads.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display">Leads por Estado</CardTitle>
        <CardDescription>Distribución del pipeline de ventas</CardDescription>
      </CardHeader>
      <CardContent>
        {total > 0 ? (
          <div className="space-y-4">
            {Object.entries(statusCounts).map(([status, count]) => {
              const percentage = (count / total) * 100;
              return (
                <div key={status} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>{statusLabels[status] || status}</span>
                    <span className="font-medium">{count} ({percentage.toFixed(1)}%)</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full ${statusColors[status] || "bg-gray-500"}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">No hay datos disponibles</p>
        )}
      </CardContent>
    </Card>
  );
}

function ConversionFunnel({ leads, bookings }: { leads: Lead[]; bookings: Booking[] }) {
  const totalLeads = leads.length;
  const qualifiedLeads = leads.filter((l) => 
    l.status === "qualified" || l.status === "proposal" || l.status === "converted"
  ).length;
  const convertedLeads = leads.filter((l) => l.status === "converted").length;
  const confirmedBookings = bookings.filter((b) => 
    b.status === "confirmed" || b.status === "paid" || b.status === "completed"
  ).length;

  const stages = [
    { name: "Leads Totales", value: totalLeads, color: "bg-blue-500" },
    { name: "Calificados", value: qualifiedLeads, color: "bg-yellow-500" },
    { name: "Convertidos", value: convertedLeads, color: "bg-green-500" },
    { name: "Reservaciones", value: confirmedBookings, color: "bg-purple-500" },
  ];

  const maxValue = Math.max(...stages.map((s) => s.value), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display">Embudo de Conversión</CardTitle>
        <CardDescription>De lead a reservación confirmada</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {stages.map((stage, index) => {
            const width = (stage.value / maxValue) * 100;
            const prevValue = index > 0 ? stages[index - 1].value : stage.value;
            const conversionRate = prevValue > 0 ? ((stage.value / prevValue) * 100).toFixed(1) : "0";
            return (
              <div key={stage.name} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span>{stage.name}</span>
                  <span className="font-medium">
                    {stage.value}
                    {index > 0 && (
                      <span className="text-muted-foreground ml-2">({conversionRate}%)</span>
                    )}
                  </span>
                </div>
                <div className="h-8 rounded bg-muted overflow-hidden">
                  <div
                    className={`h-full ${stage.color} transition-all`}
                    style={{ width: `${width}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Reports() {
  const { data: stats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
  });

  const { data: bookings, isLoading: bookingsLoading } = useQuery<Booking[]>({
    queryKey: ["/api/admin/bookings"],
  });

  const { data: leads, isLoading: leadsLoading } = useQuery<Lead[]>({
    queryKey: ["/api/admin/leads"],
  });

  const isLoading = statsLoading || bookingsLoading || leadsLoading;

  const avgBookingValue = bookings && bookings.length > 0
    ? bookings.reduce((sum, b) => sum + Number(b.totalPrice || 0), 0) / bookings.length
    : 0;

  const conversionRate = leads && leads.length > 0 && bookings
    ? ((bookings.length / leads.length) * 100).toFixed(1)
    : "0";

  return (
    <DashboardLayout
      title="Reportes y Analytics"
      description="Métricas clave y análisis del negocio"
    >
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
            <MetricCard
              title="Ingresos Totales"
              value={`$${(stats?.totalRevenue || 0).toLocaleString()}`}
              icon={DollarSign}
              iconColor="bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
              testId="card-metric-revenue"
            />
            <MetricCard
              title="Reservaciones"
              value={stats?.totalBookings || 0}
              icon={Calendar}
              iconColor="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
              testId="card-metric-bookings"
            />
            <MetricCard
              title="Leads Capturados"
              value={stats?.totalLeads || 0}
              icon={MessageSquare}
              iconColor="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
              testId="card-metric-leads"
            />
            <MetricCard
              title="Tasa de Conversión"
              value={`${conversionRate}%`}
              icon={TrendingUp}
              iconColor="bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
              testId="card-metric-conversion"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
            <MetricCard
              title="Valor Promedio de Reservación"
              value={`$${avgBookingValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
              icon={BarChart3}
              iconColor="bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400"
              testId="card-metric-avg-booking"
            />
            <MetricCard
              title="Hoteles Activos"
              value={stats?.totalHotels || 0}
              icon={Hotel}
              iconColor="bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400"
              testId="card-metric-hotels"
            />
            <MetricCard
              title="Clientes Registrados"
              value="-"
              icon={Users}
              iconColor="bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400"
              testId="card-metric-customers"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2 mb-6">
            <RevenueByStatusChart bookings={bookings || []} />
            <LeadsByStatusChart leads={leads || []} />
          </div>

          <ConversionFunnel leads={leads || []} bookings={bookings || []} />
        </>
      )}
    </DashboardLayout>
  );
}
