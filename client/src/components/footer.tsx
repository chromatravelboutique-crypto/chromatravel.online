import { Link } from "wouter";
import { Facebook, Instagram, Youtube, Mail } from "lucide-react";
import { SiX } from "react-icons/si";
import chromaBirdLogo from "@assets/logo-chroma.png";

export function Footer() {
  return (
    <footer className="relative overflow-hidden">
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          background: "linear-gradient(135deg, rgba(255,0,0,0.3) 0%, rgba(255,165,0,0.3) 15%, rgba(255,255,0,0.3) 30%, rgba(0,128,0,0.3) 45%, rgba(0,0,255,0.3) 60%, rgba(75,0,130,0.3) 75%, rgba(238,130,238,0.3) 100%)"
        }}
      />
      
      <div className="relative border-t bg-background/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
          <div className="grid gap-8 md:grid-cols-4">
            <div className="md:col-span-1">
              <Link href="/" className="flex items-center gap-2" data-testid="link-footer-logo">
                <img 
                  src={chromaBirdLogo} 
                  alt="" 
                  className="h-10 w-10 object-contain"
                />
                <div className="flex flex-col">
                  <span className="font-display text-xl font-bold leading-none">
                    <span className="text-gradient">Chroma</span>
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Agencia de Viajes LGBT+
                  </span>
                </div>
              </Link>
              <p className="mt-4 text-sm text-muted-foreground">
                Tu agencia de viajes premium especializada en experiencias LGBT+ seguras e inclusivas.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Explorar</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/hotels" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-footer-hotels">
                    Hoteles LGBT+
                  </Link>
                </li>
                <li>
                  <Link href="/destinations" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-footer-destinations">
                    Destinos
                  </Link>
                </li>
                <li>
                  <Link href="/experiences" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-footer-experiences">
                    Experiencias
                  </Link>
                </li>
                <li>
                  <Link href="/blog" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-footer-blog">
                    Destinos Destacados
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/privacy-policy" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-footer-privacy">
                    Política de Privacidad
                  </Link>
                </li>
                <li>
                  <Link href="/terms-and-conditions" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-footer-terms">
                    Términos y Condiciones
                  </Link>
                </li>
                <li>
                  <Link href="/cookie-policy" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-footer-cookies">
                    Política de Cookies
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-footer-about">
                    Sobre Nosotros
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Contacto</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a 
                    href="mailto:contacto@chromatravel.online" 
                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                    data-testid="link-footer-email"
                  >
                    <Mail className="h-4 w-4" />
                    contacto@chromatravel.online
                  </a>
                </li>
                <li>
                  <Link href="/contact" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-footer-contact">
                    Formulario de Contacto
                  </Link>
                </li>
              </ul>
              
              <div className="flex items-center gap-3 mt-4">
                <a
                  href="https://www.facebook.com/chromatravelboutique"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                  data-testid="link-social-facebook"
                >
                  <Facebook className="h-5 w-5" />
                </a>
                <a
                  href="https://x.com/chromatravel"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="X (Twitter)"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                  data-testid="link-social-x"
                >
                  <SiX className="h-4 w-4" />
                </a>
                <a
                  href="https://www.instagram.com/chroma.travel.boutique/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                  data-testid="link-social-instagram"
                >
                  <Instagram className="h-5 w-5" />
                </a>
                <a
                  href="https://www.youtube.com/@chromatravel"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="YouTube"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                  data-testid="link-social-youtube"
                >
                  <Youtube className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>

          <div className="mt-8 border-t pt-6 text-center text-sm text-muted-foreground">
            <p>© 2025 CHROMA by Fénix Traveler. Todos los derechos reservados.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
