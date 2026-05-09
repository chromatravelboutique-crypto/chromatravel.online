import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Link, useLocation } from "wouter";
import {
  User,
  CalendarCheck,
  Heart,
  Settings,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth, ProtectedRoute } from "@/lib/auth";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import type { Booking } from "@shared/schema";

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, { label: string; className: string }> = {
    confirmed: { label: "Confirmada", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
    pending: { label: "Pendiente", className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
    cancelled: { label: "Cancelada", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
    paid: { label: "Pagada", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  };

  const variant = variants[status] || { label: status, className: "" };

  return (
    <Badge variant="secondary" className={variant.className}>
      {variant.label}
    </Badge>
  );
}

function AccountContent() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();

  const { data: bookings, isLoading } = useQuery<Booking[]>({
    queryKey: ["/api/bookings/user"],
  });

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-background">
        <div className="container mx-auto max-w-4xl px-4 py-8 md:py-12">
          <div className="mb-8 flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="font-display text-2xl font-bold md:text-3xl">
                Hola, {user?.firstName}
              </h1>
              <p className="text-muted-foreground">{user?.email}</p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display">
                  <CalendarCheck className="h-5 w-5" />
                  Mis Reservaciones
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2].map((i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : bookings && bookings.length > 0 ? (
                  <div className="space-y-3">
                    {bookings.slice(0, 3).map((booking) => (
                      <div
                        key={booking.id}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div>
                          <p className="font-medium">{booking.confirmationCode}</p>
                          <p className="text-sm text-muted-foreground">
                            {booking.checkIn && format(new Date(booking.checkIn), "d MMM yyyy", { locale: es })}
                          </p>
                        </div>
                        <StatusBadge status={booking.status} />
                      </div>
                    ))}
                    <Link href="/account/bookings">
                      <Button variant="outline" className="w-full" data-testid="link-view-all-bookings">
                        Ver todas
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="py-6 text-center">
                    <p className="text-muted-foreground">No tienes reservaciones aún</p>
                    <Link href="/hotels">
                      <Button className="mt-4" data-testid="button-explore-hotels">
                        Explorar hoteles
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display">
                  <User className="h-5 w-5" />
                  Mi Perfil
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Nombre</p>
                  <p className="font-medium">{user?.firstName} {user?.lastName}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{user?.email}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Teléfono</p>
                  <p className="font-medium">{user?.phone || "No registrado"}</p>
                </div>
                <Link href="/account/settings">
                  <Button variant="outline" className="w-full" data-testid="link-edit-profile">
                    <Settings className="mr-2 h-4 w-4" />
                    Editar perfil
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            <Link href="/account/favorites">
              <Card className="hover-elevate cursor-pointer">
                <CardContent className="flex items-center gap-3 p-4">
                  <Heart className="h-5 w-5 text-red-500" />
                  <span>Mis Favoritos</span>
                  <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>

            <Link href="/account/settings">
              <Card className="hover-elevate cursor-pointer">
                <CardContent className="flex items-center gap-3 p-4">
                  <Settings className="h-5 w-5" />
                  <span>Configuración</span>
                  <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>

            <Card 
              className="hover-elevate cursor-pointer" 
              onClick={handleLogout}
              data-testid="button-logout"
            >
              <CardContent className="flex items-center gap-3 p-4">
                <LogOut className="h-5 w-5 text-destructive" />
                <span className="text-destructive">Cerrar sesión</span>
                <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

export default function AccountPage() {
  return (
    <ProtectedRoute>
      <AccountContent />
    </ProtectedRoute>
  );
}
