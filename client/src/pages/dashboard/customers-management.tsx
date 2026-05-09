import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Search,
  Users,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  Eye,
  UserCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { DashboardLayout } from "./dashboard-layout";
import type { User, Booking } from "@shared/schema";

interface CustomerWithBookings extends User {
  bookings?: Booking[];
}

function CustomerDetailDialog({ 
  customer, 
  open, 
  onOpenChange 
}: { 
  customer: CustomerWithBookings | null; 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
}) {
  if (!customer) return null;

  const totalSpent = customer.bookings?.reduce((sum, b) => sum + Number(b.totalPrice || 0), 0) || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display">Perfil del Cliente</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                {customer.firstName?.[0]}{customer.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-xl font-semibold">{customer.firstName} {customer.lastName}</h3>
              <p className="text-muted-foreground">{customer.email}</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="p-4 text-center">
                <Calendar className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                <p className="text-2xl font-bold">{customer.bookings?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Reservaciones</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <DollarSign className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                <p className="text-2xl font-bold">${totalSpent.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Gastado</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <UserCircle className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                <p className="text-2xl font-bold capitalize">{customer.role}</p>
                <p className="text-sm text-muted-foreground">Tipo de Cuenta</p>
              </CardContent>
            </Card>
          </div>

          {customer.phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{customer.phone}</span>
            </div>
          )}

          <Separator />

          <div>
            <Label className="text-muted-foreground mb-3 block">Historial de Reservaciones</Label>
            {customer.bookings && customer.bookings.length > 0 ? (
              <div className="space-y-2">
                {customer.bookings.map((booking) => (
                  <div 
                    key={booking.id} 
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div>
                      <p className="font-mono text-sm">{booking.confirmationCode}</p>
                      <p className="text-sm text-muted-foreground">
                        {booking.checkIn && format(new Date(booking.checkIn), "d MMM yyyy", { locale: es })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${Number(booking.totalPrice).toLocaleString()}</p>
                      <Badge variant="secondary" className="text-xs">
                        {booking.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                Este cliente no tiene reservaciones.
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <Button className="flex-1" asChild>
              <a href={`mailto:${customer.email}`} data-testid="button-email-customer">
                <Mail className="h-4 w-4 mr-2" />
                Enviar Email
              </a>
            </Button>
            {customer.phone && (
              <Button variant="outline" className="flex-1" asChild>
                <a href={`tel:${customer.phone}`} data-testid="button-call-customer">
                  <Phone className="h-4 w-4 mr-2" />
                  Llamar
                </a>
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function CustomersManagement() {
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithBookings | null>(null);

  const { data: customers, isLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/customers"],
  });

  const filteredCustomers = customers?.filter((customer) => {
    const searchLower = search.toLowerCase();
    return (
      customer.firstName?.toLowerCase().includes(searchLower) ||
      customer.lastName?.toLowerCase().includes(searchLower) ||
      customer.email?.toLowerCase().includes(searchLower)
    );
  }) || [];

  const handleViewCustomer = async (customer: User) => {
    try {
      const response = await fetch(`/api/admin/customers/${customer.id}`);
      const data = await response.json();
      setSelectedCustomer(data);
    } catch (error) {
      setSelectedCustomer(customer as CustomerWithBookings);
    }
  };

  return (
    <DashboardLayout
      title="Gestión de Clientes"
      description="Administra la base de clientes y su historial"
    >
      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm text-muted-foreground">Total Clientes</p>
                <p className="text-2xl font-bold" data-testid="stat-total-customers">{customers?.length || 0}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                <Users className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm text-muted-foreground">Nuevos Este Mes</p>
                <p className="text-2xl font-bold" data-testid="stat-new-customers">
                  {customers?.filter((c) => {
                    const createdAt = (c as any).createdAt;
                    if (!createdAt) return false;
                    const now = new Date();
                    const created = new Date(createdAt);
                    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
                  }).length || 0}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                <UserCircle className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm text-muted-foreground">Con Reservaciones</p>
                <p className="text-2xl font-bold" data-testid="stat-customers-with-bookings">-</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
                <Calendar className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4">
          <CardTitle className="font-display">Todos los Clientes</CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar clientes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64 pl-10"
              data-testid="input-search-customers"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredCustomers.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="hidden md:table-cell">Teléfono</TableHead>
                    <TableHead className="hidden lg:table-cell">Registro</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer) => (
                    <TableRow key={customer.id} data-testid={`row-customer-${customer.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {customer.firstName?.[0]}{customer.lastName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{customer.firstName} {customer.lastName}</span>
                        </div>
                      </TableCell>
                      <TableCell>{customer.email}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        {customer.phone || "-"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {(customer as any).createdAt 
                          ? format(new Date((customer as any).createdAt), "d MMM yyyy", { locale: es })
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewCustomer(customer)}
                          data-testid={`button-view-customer-${customer.id}`}
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
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay clientes que coincidan con tu búsqueda.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <CustomerDetailDialog
        customer={selectedCustomer}
        open={!!selectedCustomer}
        onOpenChange={(open) => !open && setSelectedCustomer(null)}
      />
    </DashboardLayout>
  );
}
