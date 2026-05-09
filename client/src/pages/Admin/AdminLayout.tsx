import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  CalendarCheck,
  Package,
  Users,
  ArrowLeft,
  Menu,
  Warehouse,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/theme-toggle";

interface NavItem {
  href: string;
  icon: any;
  label: string;
}

const navItems: NavItem[] = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/dashboard/bookings", icon: CalendarCheck, label: "Reservaciones" },
  { href: "/admin/inventory", icon: Warehouse, label: "Inventario" },
  { href: "/admin/tbo/certification", icon: Package, label: "TBO Certificación" },
  { href: "/admin/crm", icon: Users, label: "CRM" },
];

function AdminSidebar({ className = "" }: { className?: string }) {
  const [location] = useLocation();

  return (
    <div className={`flex h-full flex-col border-r bg-card ${className}`}>
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/dashboard" className="flex items-center gap-2">
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
        <Link href="/dashboard">
          <Button variant="ghost" className="w-full justify-start gap-3">
            <ArrowLeft className="h-5 w-5" />
            Volver al Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
  activeMenu?: string;
}

export default function AdminLayout({ children, title }: AdminLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background">
      <AdminSidebar className="hidden w-64 lg:block" />

      <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <AdminSidebar />
        </SheetContent>
      </Sheet>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b bg-card px-6">
          <div className="flex items-center gap-4">
            <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden" data-testid="button-menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
            </Sheet>
            <h1 className="text-xl font-semibold">{title}</h1>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
