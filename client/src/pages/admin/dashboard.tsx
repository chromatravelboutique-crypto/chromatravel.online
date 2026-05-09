import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import {
  LayoutDashboard,
  CalendarCheck,
  Building2,
  Users,
  MessageSquare,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  Bell,
  Search,
  TrendingUp,
  DollarSign,
  Bed,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/theme-toggle";
import type { Booking, Lead } from "@shared/schema";

interface AdminStats {
  totalBookings: number;
  totalLeads: number;
  totalHotels: number;
  totalRevenue: number;
}

const navItems = [
  { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/bookings", icon: CalendarCheck, label: "Reservaciones" },
  { href: "/admin/hotels", icon: Building2, label: "Hoteles" },
  { href: "/admin/customers", icon: Users, label: "Clientes" },
  { href: "/admin/leads", icon: MessageSquare, label: "Leads" },
  { href: "/admin/reports", icon: BarChart3, label: "Reportes" },
  { href: "/admin/settings", icon: Settings, label: "Configuración" },
];

function AdminSidebar({ className = "" }: { className?: string }) {
  const [location] = useLocation();

  return (
    <div className={`flex h-full flex-col border-r bg-card ${className}`}>
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md gradient-primary">
            <span className="text-sm font-bold text-white">C</span>
          </div>
          <span className="font-display text-lg font-bold">
            <span className="text-gradient">chroma</span>
            <span className="text-foreground">Admin</span>
          </span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant="ghost"
                className={`w-full justify-start gap-3 ${
                  isActive ? "bg-muted text-foreground" : "text-muted-foreground"
                }`}
                data-testid={`link-admin-${item.label.toLowerCase()}`}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Button>
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  AG
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium">Admin Usuario</p>
                <p className="text-xs text-muted-foreground">admin@chromatravel.com</p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Mi cuenta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              Configuración
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
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

function StatsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-8 w-16 mb-2" />
            <Skeleton className="h-4 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: stats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
  });

  const { data: bookings, isLoading: bookingsLoading } = useQuery<Booking[]>({
    queryKey: ["/api/admin/bookings"],
  });

  const { data: leads, isLoading: leadsLoading } = useQuery<Lead[]>({
    queryKey: ["/api/admin/leads"],
  });

  const recentBookings = bookings?.slice(0, 5) || [];
  const recentLeads = leads?.slice(0, 3) || [];

  const statsCards = [
    {
      title: "Reservaciones totales",
      value: stats?.totalBookings?.toString() || "0",
      icon: CalendarCheck,
    },
    {
      title: "Ingresos totales",
      value: `$${(stats?.totalRevenue || 0).toLocaleString()}`,
      icon: DollarSign,
    },
    {
      title: "Hoteles activos",
      value: stats?.totalHotels?.toString() || "0",
      icon: Bed,
    },
    {
      title: "Leads capturados",
      value: stats?.totalLeads?.toString() || "0",
      icon: TrendingUp,
    },
  ];

  return (
    <div className="flex h-screen">
      <aside className="hidden w-64 lg:block">
        <AdminSidebar />
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between gap-4 border-b bg-card px-4 md:px-6">
          <div className="flex items-center gap-4">
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <AdminSidebar />
              </SheetContent>
            </Sheet>

            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar reservaciones, clientes..."
                className="w-80 pl-10"
                data-testid="input-admin-search"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="relative" data-testid="button-notifications">
              <Bell className="h-5 w-5" />
              {(recentLeads.filter(l => l.status === "new").length > 0) && (
                <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-destructive" />
              )}
            </Button>
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="mb-8">
            <h1 className="font-display text-2xl font-bold md:text-3xl">
              Dashboard
            </h1>
            <p className="mt-1 text-muted-foreground">
              Bienvenido de vuelta. Aquí está el resumen de tu negocio.
            </p>
          </div>

          {statsLoading ? (
            <div className="mb-8">
              <StatsSkeleton />
            </div>
          ) : (
            <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {statsCards.map((stat) => (
                <Card key={stat.title}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">{stat.title}</p>
                        <p className="mt-2 font-display text-2xl font-bold" data-testid={`stat-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
                          {stat.value}
                        </p>
                      </div>
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <stat.icon className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
                <CardTitle className="font-display">Reservaciones recientes</CardTitle>
                <Link href="/admin/bookings">
                  <Button variant="outline" size="sm" data-testid="button-view-all-bookings">
                    Ver todas
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {bookingsLoading ? (
                  <TableSkeleton />
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
                <Link href="/admin/leads">
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
        </main>
      </div>
    </div>
  );
}
