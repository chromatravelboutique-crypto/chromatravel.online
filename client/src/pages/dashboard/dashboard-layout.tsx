import { useState } from "react";
import { Link, useLocation } from "wouter";
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
  FileText,
  Share2,
  TrendingUp,
  Receipt,
  ImageIcon,
  UserCog,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { useAuth } from "@/lib/auth";

interface NavItem {
  href: string;
  icon: any;
  label: string;
  roles: string[];
}

const allNavItems: NavItem[] = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard", roles: ["admin", "agent", "marketing"] },
  { href: "/dashboard/crm", icon: UserCog, label: "CRM Kanban", roles: ["admin", "agent", "marketing"] },
  { href: "/dashboard/bookings", icon: CalendarCheck, label: "Reservaciones", roles: ["admin", "agent"] },
  { href: "/dashboard/hotels", icon: Building2, label: "Hoteles", roles: ["admin", "agent"] },
  { href: "/dashboard/customers", icon: Users, label: "Clientes", roles: ["admin", "agent"] },
  { href: "/dashboard/invoicing", icon: Receipt, label: "Facturación", roles: ["admin", "agent"] },
  { href: "/dashboard/leads", icon: MessageSquare, label: "Leads (Lista)", roles: ["admin", "agent", "marketing"] },
  { href: "/dashboard/blog", icon: FileText, label: "Destinos Destacados", roles: ["admin", "marketing"] },
  { href: "/dashboard/media", icon: ImageIcon, label: "Biblioteca de Medios", roles: ["admin", "marketing"] },
  { href: "/dashboard/social", icon: Share2, label: "Redes Sociales", roles: ["admin", "marketing"] },
  { href: "/dashboard/analytics", icon: TrendingUp, label: "Analytics", roles: ["admin", "marketing"] },
  { href: "/dashboard/reports", icon: BarChart3, label: "Reportes", roles: ["admin"] },
  { href: "/dashboard/settings", icon: Settings, label: "Configuración", roles: ["admin"] },
];

function DashboardSidebar({ className = "" }: { className?: string }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const navItems = allNavItems.filter(item => 
    user?.role && item.roles.includes(user.role)
  );

  return (
    <div className={`flex h-full flex-col border-r bg-card ${className}`}>
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md gradient-primary">
            <span className="text-sm font-bold text-white">C</span>
          </div>
          <span className="font-display text-lg font-bold">
            <span className="text-gradient">chroma</span>
            <span className="text-foreground">CRM</span>
          </span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const isActive = location === item.href || 
            (item.href !== "/dashboard" && location.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant="ghost"
                className={`w-full justify-start gap-3 ${
                  isActive ? "bg-muted text-foreground" : "text-muted-foreground"
                }`}
                data-testid={`link-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
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
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Mi cuenta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings">
                <Settings className="mr-2 h-4 w-4" />
                Configuración
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-destructive"
              onClick={() => logout()}
              data-testid="button-logout"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
}

export function DashboardLayout({ children, title, description }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen">
      <aside className="hidden w-64 lg:block">
        <DashboardSidebar />
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
                <DashboardSidebar />
              </SheetContent>
            </Sheet>

            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                className="w-80 pl-10"
                data-testid="input-search"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="relative" data-testid="button-notifications">
              <Bell className="h-5 w-5" />
            </Button>
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="mb-8">
            <h1 className="font-display text-2xl font-bold md:text-3xl">{title}</h1>
            {description && (
              <p className="mt-1 text-muted-foreground">{description}</p>
            )}
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
