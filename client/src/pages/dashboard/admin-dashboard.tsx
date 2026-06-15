import { useQuery } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import {
  CalendarCheck,
  DollarSign,
  TrendingUp,
  Users,
  FileText,
  MapPin,
  Building2,
  KanbanSquare,
  Mail,
  Shield,
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
import type { Booking, Lead } from "@shared/schema";

interface BrandStats {
  brandId: string;
  brandCode: string;
  brandName: string;
  bookings: number;
  revenue: number;
  leads: number;
  customers: number;
  posts: number;
  destinations: number;
}

interface NewsletterStats {
  total: number;
  byBrand: Record<string, number>;
}

interface MultiBrandStats {
  totals: {
    totalBookings: number;
    totalRevenue: number;
    totalLeads: number;
    totalCustomers: number;
  };
  brands: BrandStats[];
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, { label: string; className: string }> = {
    confirmed: { label: "Confirmada", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
    pending: { label: "Pendiente", className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
    cancelled: { label: "Cancelada", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
    new: { label: "Nuevo", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
    contacted: { label: "Contactado", className: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
    paid: { label: "Pagado", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  };

  const variant = variants[status] || { label: status, className: "" };

  return (
    <Badge variant="secondary" className={variant.className}>
      {variant.label}
    </Badge>
  );
}

function BrandCard({ brand }: { brand: BrandStats }) {
  const isFenix = brand.brandCode === "fenix";
  const brandColor = isFenix 
    ? "from-blue-500/10 to-amber-500/10 border-blue-500/30" 
    : "from-purple-500/10 to-cyan-500/10 border-purple-500/30";
  const iconColor = isFenix ? "text-blue-600" : "text-purple-600";

  return (
    <Card className={`bg-gradient-to-br ${brandColor} border`} data-testid={`card-brand-${brand.brandCode}`}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 font-display text-lg">
          <Building2 className={`h-5 w-5 ${iconColor}`} />
          {brand.brandName}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-2xl font-bold">${brand.revenue.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Ingresos</p>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold">{brand.bookings}</p>
            <p className="text-xs text-muted-foreground">Reservas</p>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold">{brand.customers}</p>
            <p className="text-xs text-muted-foreground">Clientes</p>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold">{brand.leads}</p>
            <p className="text-xs text-muted-foreground">Leads</p>
          </div>
        </div>
        <div className="mt-4 flex gap-4 border-t pt-4">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <FileText className="h-4 w-4" />
            <span>{brand.posts} posts</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{brand.destinations} destinos</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboard() {
  const { data: multiBrandStats, isLoading: statsLoading } = useQuery<MultiBrandStats>({
    queryKey: ["/api/admin/stats/multi-brand"],
  });

  const { data: bookings, isLoading: bookingsLoading } = useQuery<Booking[]>({
    queryKey: ["/api/admin/bookings"],
  });

  const { data: leads, isLoading: leadsLoading } = useQuery<Lead[]>({
    queryKey: ["/api/admin/leads"],
  });

  const { data: newsletterStats } = useQuery<NewsletterStats>({
    queryKey: ["/api/admin/newsletter/stats"],
  });

  const { data: pipeline } = useQuery({
    queryKey: ["/api/admin/pipeline"],
  });

  const { data: checkinsData } = useQuery({
    queryKey: ["/api/admin/checkins", new Date().toISOString().slice(0, 7)],
    queryFn: () =>
      fetch(`/api/admin/checkins?mes=${new Date().toISOString().slice(0, 7)}`).then((r) => r.json()),
  });

  const recentBookings = bookings?.slice(0, 5) || [];
  const recentLeads = leads?.slice(0, 3) || [];

  // Quick stats from pipeline and checkins
  const pipelineLeadsActivos = pipeline
    ? (pipeline as any).nuevo?.cantidad + (pipeline as any).contactado?.cantidad + (pipeline as any).cotizado?.cantidad
    : null;
  const holdsActivos = pipeline ? (pipeline as any).hold_activo?.cantidad : null;
  const proximosCheckins = checkinsData?.total ?? null;
  const totals = multiBrandStats?.totals;
  const brands = multiBrandStats?.brands || [];

  const statsCards = [
    {
      title: "Reservaciones totales",
      value: totals?.totalBookings?.toString() || "0",
      icon: CalendarCheck,
      color: "text-blue-500",
    },
    {
      title: "Ingresos totales",
      value: `$${(totals?.totalRevenue || 0).toLocaleString()}`,
      icon: DollarSign,
      color: "text-green-500",
    },
    {
      title: "Clientes totales",
      value: totals?.totalCustomers?.toString() || "0",
      icon: Users,
      color: "text-purple-500",
    },
    {
      title: "Leads capturados",
      value: totals?.totalLeads?.toString() || "0",
      icon: TrendingUp,
      color: "text-orange-500",
    },
  ];

  return (
    <DashboardLayout 
      title="Dashboard Unificado"
      description="Vista completa de ambas empresas: Fenix Traveler y Chroma Travel"
    >
      {statsLoading ? (
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16 mb-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {statsCards.map((stat) => (
              <Card key={stat.title}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.title}</p>
                      <p className="mt-2 font-display text-2xl font-bold" data-testid={`stat-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
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

          <div className="mb-8 grid gap-4 md:grid-cols-2">
            {brands.map((brand) => (
              <BrandCard key={brand.brandId} brand={brand} />
            ))}
          </div>
        </>
      )}

      {/* CRM Quick Links */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/admin/pipeline">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm text-muted-foreground">Pipeline</p>
                  <p className="mt-2 text-2xl font-bold">
                    {pipelineLeadsActivos !== null ? pipelineLeadsActivos : "—"}
                  </p>
                  <p className="text-xs text-muted-foreground">leads activos</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-purple-500">
                  <KanbanSquare className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/checkins">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm text-muted-foreground">Check-ins este mes</p>
                  <p className="mt-2 text-2xl font-bold">
                    {proximosCheckins !== null ? proximosCheckins : "—"}
                  </p>
                  <p className="text-xs text-muted-foreground">reservas confirmadas</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-green-500">
                  <CalendarCheck className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/comisiones">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm text-muted-foreground">Comisiones</p>
                  <p className="mt-2 text-2xl font-bold">
                    {holdsActivos !== null ? holdsActivos : "—"}
                  </p>
                  <p className="text-xs text-muted-foreground">holds activos</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-amber-500">
                  <DollarSign className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/crm">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm text-muted-foreground">Newsletter</p>
                  <p className="mt-2 text-2xl font-bold">
                    {newsletterStats?.total !== undefined ? newsletterStats.total : "—"}
                  </p>
                  <p className="text-xs text-muted-foreground">suscriptores activos</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-blue-500">
                  <Mail className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
            <CardTitle className="font-display">Reservaciones recientes</CardTitle>
            <Link href="/dashboard/bookings">
              <Button variant="outline" size="sm" data-testid="button-view-all-bookings">
                Ver todas
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {bookingsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : recentBookings.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Huésped</TableHead>
                    <TableHead className="hidden sm:table-cell">Fechas</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentBookings.map((booking) => (
                    <TableRow key={booking.id} data-testid={`row-booking-${booking.confirmationCode}`}>
                      <TableCell className="font-mono text-sm">
                        {booking.confirmationCode}
                      </TableCell>
                      <TableCell className="font-medium">
                        {booking.guestFirstName} {booking.guestLastName}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {booking.checkIn && format(new Date(booking.checkIn), "d MMM", { locale: es })} - {booking.checkOut && format(new Date(booking.checkOut), "d MMM", { locale: es })}
                      </TableCell>
                      <TableCell>
                        ${Number(booking.totalPrice).toLocaleString()} {booking.currency}
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
                No hay reservaciones todavía.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
            <CardTitle className="font-display">Leads recientes</CardTitle>
            <Link href="/dashboard/leads">
              <Button variant="outline" size="sm" data-testid="button-view-all-leads">
                Ver todos
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {leadsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentLeads.length > 0 ? (
              <div className="space-y-4">
                {recentLeads.map((lead) => (
                  <div
                    key={lead.id}
                    className="flex items-start justify-between gap-4"
                    data-testid={`card-lead-${lead.id}`}
                  >
                    <div className="flex gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="text-xs">
                          {lead.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{lead.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {lead.destination || "Sin destino"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {lead.createdAt
                            ? formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true, locale: es })
                            : "Reciente"}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={lead.status || "new"} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                No hay leads todavía.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
