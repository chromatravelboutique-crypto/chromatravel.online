import { Shield, BadgeCheck, Building2, ExternalLink } from "lucide-react";

export function RntTrustSection() {
  return (
    <section className="border-t bg-muted/30 py-12">
      <div className="mx-auto max-w-5xl px-4 md:px-8">
        <div className="flex flex-col items-center gap-8 md:flex-row md:items-center md:gap-12">
          
          <div className="flex-shrink-0">
            <div className="relative">
              <img
                src="/attached_assets/rnt-certificado.png"
                alt="Registro Nacional de Turismo No. 0416053e07358 — Chroma Travel"
                className="h-auto w-72 rounded-2xl object-contain shadow-lg ring-1 ring-border/40 md:w-80"
                data-testid="img-rnt-certificado"
              />
              <div className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-green-500 text-white shadow">
                <BadgeCheck className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="flex-1 text-center md:text-left">
            <div className="mb-3 flex items-center justify-center gap-2 md:justify-start">
              <Shield className="h-5 w-5 text-primary" />
              <span className="text-sm font-semibold uppercase tracking-wider text-primary">Agencia certificada</span>
            </div>

            <h2 className="mb-3 text-2xl font-bold leading-snug text-foreground md:text-3xl">
              Registro Nacional de Turismo
            </h2>

            <p className="mb-4 text-muted-foreground">
              Chroma Travel opera bajo <strong>Asesores Turísticos Fenix Traveler S.A.S.</strong>, 
              inscrita en el Registro Nacional de Turismo de la Secretaría de Turismo de México 
              (SECTUR) desde enero 2026. Tu viaje está respaldado por una agencia legalmente 
              constituida y regulada.
            </p>

            <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-background p-3 text-center shadow-sm ring-1 ring-border/40">
                <p className="text-xs font-medium text-muted-foreground">No. de Registro</p>
                <p className="mt-0.5 font-bold text-foreground" data-testid="text-rnt-number">0416053e07358</p>
              </div>
              <div className="rounded-xl bg-background p-3 text-center shadow-sm ring-1 ring-border/40">
                <p className="text-xs font-medium text-muted-foreground">Categoría</p>
                <p className="mt-0.5 font-bold text-foreground">Agencia de Viajes</p>
              </div>
              <div className="rounded-xl bg-background p-3 text-center shadow-sm ring-1 ring-border/40">
                <p className="text-xs font-medium text-muted-foreground">Vigencia</p>
                <p className="mt-0.5 font-bold text-foreground">Ene 2026 — Ene 2028</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 md:justify-start">
              <div className="flex items-center gap-1.5 rounded-full bg-green-50 dark:bg-green-950 px-3 py-1.5 text-xs font-medium text-green-700 dark:text-green-400">
                <BadgeCheck className="h-3.5 w-3.5" />
                Verificado por SECTUR
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-blue-50 dark:bg-blue-950 px-3 py-1.5 text-xs font-medium text-blue-700 dark:text-blue-400">
                <Building2 className="h-3.5 w-3.5" />
                Morelia, Michoacán
              </div>
              <a
                href="https://www.gob.mx/sectur"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/70"
                data-testid="link-sectur-website"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                gob.mx/sectur
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
