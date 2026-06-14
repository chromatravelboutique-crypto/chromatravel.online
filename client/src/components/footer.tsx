import { Link } from "wouter";
import { Facebook, Instagram, Youtube, Mail } from "lucide-react";
import { SiX } from "react-icons/si";
import { useBrand } from "@/lib/brand-context";
import chromaBirdLogo from "@assets/logo-chroma.png";

export function Footer() {
  const { brand, isChroma, isFenix } = useBrand();

  const brandName    = brand?.name    ?? "Chroma Travel";
  const brandEmail   = brand?.email   ?? "contacto@chromatravel.online";
  const brandDomain  = brand?.domain  ?? "chromatravel.online";
  const tagline      = isChroma ? "Agencia de Viajes LGBT+" : "Viajes Premium";
  const description  = isChroma
    ? "Tu agencia de viajes premium especializada en experiencias LGBT+ seguras e inclusivas."
    : "Agencia de viajes premium especializada en experiencias de lujo y destinos exclusivos.";

  const facebook  = brand?.facebookUrl  ?? (isChroma ? "https://www.facebook.com/chromatravelboutique" : null);
  const instagram = brand?.instagramUrl ?? (isChroma ? "https://www.instagram.com/chroma.travel.boutique/" : null);
  const twitter   = brand?.twitterUrl   ?? (isChroma ? "https://x.com/chromatravel" : null);
  const youtube   = brand?.youtubeUrl   ?? (isChroma ? "https://www.youtube.com/@chromatravel" : null);

  const hotelsLabel = isChroma ? "Hoteles LGBT+" : "Hoteles Premium";

  return (
    <footer className="relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background: isChroma
            ? "linear-gradient(135deg, rgba(255,0,0,0.3) 0%, rgba(255,165,0,0.3) 15%, rgba(255,255,0,0.3) 30%, rgba(0,128,0,0.3) 45%, rgba(0,0,255,0.3) 60%, rgba(75,0,130,0.3) 75%, rgba(238,130,238,0.3) 100%)"
            : "linear-gradient(135deg, rgba(180,83,9,0.3) 0%, rgba(234,179,8,0.3) 50%, rgba(15,23,42,0.3) 100%)",
        }}
      />

      <div className="relative border-t bg-background/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
          <div className="grid gap-8 md:grid-cols-4">

            {/* Brand identity */}
            <div className="md:col-span-1">
              <Link href="/" className="flex items-center gap-2" data-testid="link-footer-logo">
                {brand?.logoUrl ? (
                  <img src={brand.logoUrl} alt={brandName} className="h-10 w-10 object-contain" />
                ) : (
                  <img src={chromaBirdLogo} alt={brandName} className="h-10 w-10 object-contain" />
                )}
                <div className="flex flex-col">
                  <span className="font-display text-xl font-bold leading-none">
                    <span className="text-gradient">{isChroma ? "Chroma" : "Fenix"}</span>
                  </span>
                  <span className="text-[10px] text-muted-foreground">{tagline}</span>
                </div>
              </Link>
              <p className="mt-4 text-sm text-muted-foreground">{description}</p>
            </div>

            {/* Navigation */}
            <div>
              <h4 className="font-semibold mb-3">Explorar</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/hotels" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-footer-hotels">
                    {hotelsLabel}
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
                {isChroma && (
                  <li>
                    <Link href="/lgbt" className="text-muted-foreground hover:text-foreground transition-colors">
                      Comunidad LGBT+
                    </Link>
                  </li>
                )}
              </ul>
            </div>

            {/* Legal */}
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

            {/* Contact & Social */}
            <div>
              <h4 className="font-semibold mb-3">Contacto</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a
                    href={`mailto:${brandEmail}`}
                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                    data-testid="link-footer-email"
                  >
                    <Mail className="h-4 w-4" />
                    {brandEmail}
                  </a>
                </li>
                <li>
                  <Link href="/contact" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-footer-contact">
                    Formulario de Contacto
                  </Link>
                </li>
              </ul>

              <div className="flex items-center gap-3 mt-4">
                {facebook && (
                  <a href={facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook"
                    className="text-muted-foreground transition-colors hover:text-foreground" data-testid="link-social-facebook">
                    <Facebook className="h-5 w-5" />
                  </a>
                )}
                {twitter && (
                  <a href={twitter} target="_blank" rel="noopener noreferrer" aria-label="X (Twitter)"
                    className="text-muted-foreground transition-colors hover:text-foreground" data-testid="link-social-x">
                    <SiX className="h-4 w-4" />
                  </a>
                )}
                {instagram && (
                  <a href={instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram"
                    className="text-muted-foreground transition-colors hover:text-foreground" data-testid="link-social-instagram">
                    <Instagram className="h-5 w-5" />
                  </a>
                )}
                {youtube && (
                  <a href={youtube} target="_blank" rel="noopener noreferrer" aria-label="YouTube"
                    className="text-muted-foreground transition-colors hover:text-foreground" data-testid="link-social-youtube">
                    <Youtube className="h-5 w-5" />
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="mt-8 border-t pt-6 text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} {brandName}. Todos los derechos reservados.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
