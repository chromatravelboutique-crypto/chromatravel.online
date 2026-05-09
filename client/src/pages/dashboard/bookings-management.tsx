import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Search,
  Filter,
  Calendar,
  DollarSign,
  Users,
  Hotel,
  MoreHorizontal,
  Eye,
  CheckCircle2,
  Clock,
  XCircle,
  Download,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { DashboardLayout } from "./dashboard-layout";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Booking } from "@shared/schema";

interface Brand {
  id: string;
  code: string;
  name: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "Pendiente", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400", icon: Clock },
  confirmed: { label: "Confirmada", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle2 },
  paid: { label: "Pagada", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: DollarSign },
  cancelled: { label: "Cancelada", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: XCircle },
  completed: { label: "Completada", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400", icon: CheckCircle2 },
};

function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || statusConfig.pending;
  return (
    <Badge variant="secondary" className={config.color}>
      {config.label}
    </Badge>
  );
}

function BookingDetailDialog({ booking, open, onOpenChange }: { booking: Booking | null; open: boolean; onOpenChange: (open: boolean) => void }) {
  const { toast } = useToast();

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Booking>) =>
      apiRequest("PATCH", `/api/bookings/${booking?.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/bookings"] });
      toast({ title: "Reservación actualizada" });
    },
  });

  if (!booking) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-3">
            <span>Reservación #{booking.confirmationCode}</span>
            <StatusBadge status={booking.status} />
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div>
              <Label className="text-muted-foreground">Huésped</Label>
              <p className="font-medium">{booking.guestFirstName} {booking.guestLastName}</p>
              <p className="text-sm text-muted-foreground">{booking.guestEmail}</p>
              {booking.guestPhone && (
                <p className="text-sm text-muted-foreground">{booking.guestPhone}</p>
              )}
            </div>

            <Separator />

            <div>
              <Label className="text-muted-foreground">Fechas</Label>
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>
                  {booking.checkIn && format(new Date(booking.checkIn), "d MMMM yyyy", { locale: es })}
                  {" - "}
                  {booking.checkOut && format(new Date(booking.checkOut), "d MMMM yyyy", { locale: es })}
                </span>
              </div>
            </div>

            <div>
              <Label className="text-muted-foreground">Habitaciones / Huéspedes</Label>
              <div className="flex items-center gap-4 mt-1">
                <div className="flex items-center gap-1">
                  <Hotel className="h-4 w-4 text-muted-foreground" />
                  <span>{(booking as any).roomCount || 1} hab.</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{booking.guests || 1} huéspedes</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-muted">
              <Label className="text-muted-foreground">Total</Label>
              <p className="text-3xl font-bold text-primary" data-testid="text-booking-total">
                ${Number(booking.totalPrice).toLocaleString()} {booking.currency}
              </p>
            </div>

            <div>
              <Label>Cambiar Estado</Label>
              <Select
                value={booking.status}
                onValueChange={(value) => updateMutation.mutate({ status: value })}
              >
                <SelectTrigger className="mt-1" data-testid="select-booking-status">
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

            {booking.specialRequests && (
              <div>
                <Label className="text-muted-foreground">Solicitudes Especiales</Label>
                <p className="mt-1 text-sm p-3 bg-muted rounded-md">{booking.specialRequests}</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function BookingsManagement() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedBrand, setSelectedBrand] = useState<string>("all");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const { data: brands } = useQuery<Brand[]>({
    queryKey: ["/api/brands"],
  });

  const { data: bookings, isLoading } = useQuery<Booking[]>({
    queryKey: ["/api/admin/bookings"],
  });

  const filteredBookings = bookings?.filter((booking) => {
    const searchLower = search.toLowerCase();
    const matchesSearch =
      booking.confirmationCode?.toLowerCase().includes(searchLower) ||
      booking.guestFirstName?.toLowerCase().includes(searchLower) ||
      booking.guestLastName?.toLowerCase().includes(searchLower) ||
      booking.guestEmail?.toLowerCase().includes(searchLower);
    const matchesStatus = statusFilter === "all" || booking.status === statusFilter;
    const matchesBrand = selectedBrand === "all" || booking.brandId === selectedBrand;
    return matchesSearch && matchesStatus && matchesBrand;
  }) || [];

  const stats = {
    total: filteredBookings.length,
    confirmed: filteredBookings.filter((b) => b.status === "confirmed").length,
    pending: filteredBookings.filter((b) => b.status === "pending").length,
    revenue: filteredBookings.reduce((sum, b) => sum + Number(b.totalPrice || 0), 0),
  };

  return (
    <DashboardLayout
      title="Gestión de Reservaciones"
      description="Administra todas las reservaciones de hoteles"
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm text-muted-foreground">Total Reservaciones</p>
                <p className="text-2xl font-bold" data-testid="stat-total-bookings">{stats.total}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                <Calendar className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm text-muted-foreground">Confirmadas</p>
                <p className="text-2xl font-bold" data-testid="stat-confirmed-bookings">{stats.confirmed}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm text-muted-foreground">Pendientes</p>
                <p className="text-2xl font-bold" data-testid="stat-pending-bookings">{stats.pending}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400">
                <Clock className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm text-muted-foreground">Ingresos Totales</p>
                <p className="text-2xl font-bold" data-testid="stat-total-revenue">${stats.revenue.toLocaleString()}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4">
          <CardTitle className="font-display">Todas las Reservaciones</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por código, nombre..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-64 pl-10"
                data-testid="input-search-bookings"
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
              <SelectTrigger className="w-40" data-testid="select-filter-bookings">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Estado" />
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
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredBookings.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Huésped</TableHead>
                    <TableHead className="hidden md:table-cell">Fechas</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBookings.map((booking) => (
                    <TableRow key={booking.id} data-testid={`row-booking-${booking.confirmationCode}`}>
                      <TableCell className="font-mono text-sm">
                        {booking.confirmationCode}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{booking.guestFirstName} {booking.guestLastName}</p>
                          <p className="text-sm text-muted-foreground">{booking.guestEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {booking.checkIn && format(new Date(booking.checkIn), "d MMM", { locale: es })}
                        {" - "}
                        {booking.checkOut && format(new Date(booking.checkOut), "d MMM", { locale: es })}
                      </TableCell>
                      <TableCell className="font-medium">
                        ${Number(booking.totalPrice).toLocaleString()} {booking.currency}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={booking.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedBooking(booking)}
                          data-testid={`button-view-booking-${booking.confirmationCode}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay reservaciones que coincidan con tu búsqueda.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <BookingDetailDialog
        booking={selectedBooking}
        open={!!selectedBooking}
        onOpenChange={(open) => !open && setSelectedBooking(null)}
      />
    </DashboardLayout>
  );
}
