import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, LogIn, User, LayoutDashboard, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth";
import { PerformanceToggle } from "@/components/three-webgl";
import chromaBirdLogo from "@assets/logo-chroma.png";

const navLinks = [
  { href: "/", label: "Inicio" },
  { href: "/ofertas", label: "Ofertas" },
  { href: "/destinations", label: "Destinos" },
  { href: "/blog", label: "Destinos Destacados" },
  { href: "/hotels", label: "Hoteles" },
  { href: "/bloqueos", label: "Bloqueos" },
  { href: "/experiences", label: "Experiencias" },
  { href: "/about", label: "Sobre Nosotros" },
  { href: "/contact", label: "Contacto" },
];

export function Navigation() {
  const [location, navigate] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, logout, hasRole } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2" data-testid="link-logo">
            <div className="flex flex-col">
              <span className="font-display text-2xl font-bold leading-none tracking-tight">
                <span className="text-gradient">CHROMA</span>
              </span>
              <span className="text-xs text-muted-foreground">
                by Fénix Traveler
              </span>
            </div>
            <img 
              src={chromaBirdLogo} 
              alt="" 
              className="h-10 w-10 object-contain"
            />
          </Link>

          <div className="hidden items-center gap-5 lg:flex">
            {navLinks.map((link) => (
              <Link 
                key={link.href} 
                href={link.href}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  location === link.href
                    ? "text-foreground"
                    : "text-muted-foreground"
                }`}
                data-testid={`link-nav-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="hidden items-center gap-2 lg:flex">
          <PerformanceToggle />
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" data-testid="button-user-menu">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user?.firstName} {user?.lastName}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                {hasRole("admin", "agent", "marketing") && (
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="flex cursor-pointer items-center" data-testid="link-dashboard">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Panel Admin
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild>
                  <Link href="/account" className="flex cursor-pointer items-center" data-testid="link-account">
                    <User className="mr-2 h-4 w-4" />
                    Mi Cuenta
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive" data-testid="button-logout">
                  <LogOut className="mr-2 h-4 w-4" />
                  Cerrar Sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/login">
              <Button variant="outline" size="sm" data-testid="button-login">
                <LogIn className="mr-2 h-4 w-4" />
                Iniciar Sesión
              </Button>
            </Link>
          )}
        </div>

        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild className="lg:hidden">
            <Button variant="ghost" size="icon" data-testid="button-mobile-menu">
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[280px] p-0">
            <div className="flex h-full flex-col">
              <div className="flex h-16 items-center border-b px-6">
                <Link href="/" className="flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
                  <span className="font-display text-xl font-bold">
                    <span className="text-gradient">CHROMA</span>
                  </span>
                  <img 
                    src={chromaBirdLogo} 
                    alt="" 
                    className="h-8 w-8 object-contain"
                  />
                </Link>
              </div>
              <div className="flex-1 overflow-auto py-4">
                <div className="flex flex-col gap-1 px-4">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Button
                        variant="ghost"
                        className={`w-full justify-start ${
                          location === link.href
                            ? "bg-muted text-foreground"
                            : "text-muted-foreground"
                        }`}
                        data-testid={`link-mobile-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        {link.label}
                      </Button>
                    </Link>
                  ))}
                </div>
              </div>
              <div className="border-t p-4 space-y-2">
                {isAuthenticated ? (
                  <>
                    <div className="px-2 py-2 mb-2">
                      <p className="text-sm font-medium">{user?.firstName} {user?.lastName}</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                    </div>
                    {hasRole("admin", "agent", "marketing") && (
                      <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                        <Button variant="outline" className="w-full justify-start" data-testid="button-mobile-dashboard">
                          <LayoutDashboard className="mr-2 h-4 w-4" />
                          Panel Admin
                        </Button>
                      </Link>
                    )}
                    <Button 
                      variant="destructive" 
                      className="w-full" 
                      onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                      data-testid="button-mobile-logout"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Cerrar Sesión
                    </Button>
                  </>
                ) : (
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full" data-testid="button-mobile-login">
                      <LogIn className="mr-2 h-4 w-4" />
                      Iniciar Sesión
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </header>
  );
}
