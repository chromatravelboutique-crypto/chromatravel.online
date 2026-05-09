import { useEffect } from "react";

interface Benefit {
  icon: string;
  title: string;
  desc: string;
}
interface Testimonial {
  quote: string;
  author: string;
  origin?: string;
}
interface Feature {
  icon: string;
  label: string;
}

export interface XcaretLandingConfig {
  brand: "fenix" | "chroma";
  metaTitle: string;
  metaDescription: string;
  keywords: string;

  hero: {
    eyebrow: string;
    headline: string;
    sub: string;
    ctaLabel: string;
    waMessage: string;
    badge?: string;
    bgClass: string;
    bgImage?: string;
  };

  benefits: Benefit[];

  emotional: {
    headline: string;
    body: string;
    highlight: string;
  };

  features: Feature[];
  testimonials: Testimonial[];

  urgency: {
    headline: string;
    items: string[];
    ctaLabel: string;
    waMessage: string;
  };

  finalCta: {
    headline: string;
    sub: string;
    ctaLabel: string;
    waMessage: string;
  };

  waNumber: string;
}

const WA = "524434044104";

function waLink(msg: string) {
  return `https://wa.me/${WA}?text=${encodeURIComponent(msg)}`;
}

function trackWA(slug: string) {
  if (typeof window !== "undefined" && (window as any).fbq) {
    (window as any).fbq("trackCustom", "WhatsAppClick", { landing: slug });
  }
}

export function XcaretLanding({ config, slug }: { config: XcaretLandingConfig; slug: string }) {
  const isDark = config.brand === "chroma";

  useEffect(() => {
    document.title = config.metaTitle;
    let desc = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!desc) { desc = document.createElement("meta"); desc.name = "description"; document.head.appendChild(desc); }
    desc.content = config.metaDescription;
  }, [config]);

  const btnPrimary = isDark
    ? "bg-emerald-500 hover:bg-emerald-400 text-white"
    : "bg-emerald-600 hover:bg-emerald-500 text-white";
  const btnWA = "bg-[#25D366] hover:bg-[#128C7E] text-white";
  const accent = isDark ? "text-emerald-400" : "text-emerald-600";
  const accentBg = isDark ? "bg-emerald-500/10 border-emerald-500/30" : "bg-emerald-50 border-emerald-200";
  const cardBg = isDark ? "bg-white/5 border-white/10" : "bg-white border-gray-100 shadow-md";
  const textBase = isDark ? "text-gray-100" : "text-gray-800";
  const textMuted = isDark ? "text-gray-400" : "text-gray-500";
  const pageBg = isDark ? "bg-[#09110e]" : "bg-gray-50";
  const sectionBg = isDark ? "bg-white/5" : "bg-white";

  function CTAButton({ label, msg, cls = "" }: { label: string; msg: string; cls?: string }) {
    return (
      <a
        href={waLink(msg)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackWA(slug)}
        className={`inline-flex items-center gap-2 rounded-xl px-6 py-3 font-bold text-base transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-95 ${cls}`}
        data-testid={`cta-wa-${slug}`}
      >
        <WASvg />
        {label}
      </a>
    );
  }

  return (
    <div className={`min-h-screen ${pageBg} ${textBase} font-sans`}>
      {/* ── HERO ─────────────────────────────────────────── */}
      <section
        className={`relative min-h-[92vh] flex flex-col justify-center items-center text-center px-4 overflow-hidden ${config.hero.bgImage ? "bg-black" : config.hero.bgClass}`}
        style={config.hero.bgImage ? { backgroundImage: `url(${config.hero.bgImage})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
      >
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center gap-5">
          {config.hero.badge && (
            <span className="inline-block bg-white/20 backdrop-blur border border-white/30 text-white text-xs font-semibold uppercase tracking-widest px-4 py-1.5 rounded-full">
              {config.hero.badge}
            </span>
          )}
          <p className="text-emerald-300 font-semibold text-sm tracking-widest uppercase">{config.hero.eyebrow}</p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight drop-shadow-lg">
            {config.hero.headline}
          </h1>
          <p className="text-lg sm:text-xl text-white/85 max-w-xl leading-relaxed">
            {config.hero.sub}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mt-2">
            <CTAButton label={config.hero.ctaLabel} msg={config.hero.waMessage} cls={btnWA} />
          </div>
          <p className="text-white/50 text-xs mt-1">Sin costo por asesoría · Respuesta en minutos</p>
        </div>
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce">
          <svg className="w-6 h-6 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </section>

      {/* ── BENEFITS ──────────────────────────────────────── */}
      <section className="py-16 px-4 max-w-5xl mx-auto">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {config.benefits.map((b, i) => (
            <div key={i} className={`rounded-2xl border p-6 flex flex-col gap-3 ${cardBg}`}>
              <span className="text-3xl">{b.icon}</span>
              <h3 className="font-bold text-lg">{b.title}</h3>
              <p className={`text-sm leading-relaxed ${textMuted}`}>{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── EMOTIONAL ─────────────────────────────────────── */}
      <section className={`py-16 px-4 ${sectionBg}`}>
        <div className="max-w-3xl mx-auto text-center flex flex-col gap-6">
          <h2 className="text-3xl sm:text-4xl font-black leading-tight">
            {config.emotional.headline}
          </h2>
          <p className={`text-base sm:text-lg leading-relaxed ${textMuted}`}>{config.emotional.body}</p>
          <div className={`rounded-2xl border p-6 ${accentBg}`}>
            <p className={`text-lg font-bold ${accent}`}>{config.emotional.highlight}</p>
          </div>
          <div className="flex justify-center">
            <CTAButton label="Ver disponibilidad" msg={config.finalCta.waMessage} cls={btnPrimary} />
          </div>
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────────────── */}
      <section className="py-12 px-4 max-w-4xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {config.features.map((f, i) => (
            <div key={i} className={`rounded-xl border p-4 flex flex-col items-center gap-2 text-center ${cardBg}`}>
              <span className="text-2xl">{f.icon}</span>
              <p className="text-xs font-semibold leading-tight">{f.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── SOCIAL PROOF ──────────────────────────────────── */}
      {config.testimonials.length > 0 && (
        <section className={`py-16 px-4 ${sectionBg}`}>
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-black text-center mb-10">Lo que dicen quienes ya vivieron esto</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {config.testimonials.map((t, i) => (
                <div key={i} className={`rounded-2xl border p-6 flex flex-col gap-4 ${cardBg}`}>
                  <div className="flex gap-1 text-amber-400 text-sm">★★★★★</div>
                  <p className={`text-sm leading-relaxed italic ${textMuted}`}>"{t.quote}"</p>
                  <div>
                    <p className="font-bold text-sm">{t.author}</p>
                    {t.origin && <p className={`text-xs ${textMuted}`}>{t.origin}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── URGENCY ───────────────────────────────────────── */}
      <section className="py-16 px-4">
        <div className="max-w-2xl mx-auto">
          <div className={`rounded-2xl border p-8 text-center flex flex-col gap-6 ${isDark ? "bg-emerald-500/10 border-emerald-500/30" : "bg-emerald-50 border-emerald-200"}`}>
            <p className="text-2xl font-black">{config.urgency.headline}</p>
            <ul className="flex flex-col gap-2 text-left">
              {config.urgency.items.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className={`font-bold mt-0.5 ${accent}`}>✓</span>
                  <span className={textMuted}>{item}</span>
                </li>
              ))}
            </ul>
            <CTAButton label={config.urgency.ctaLabel} msg={config.urgency.waMessage} cls={btnWA} />
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────── */}
      <section className={`py-20 px-4 text-center ${isDark ? "bg-gradient-to-br from-emerald-900/30 to-pink-900/20" : "bg-gradient-to-br from-emerald-600 to-emerald-800"}`}>
        <div className="max-w-2xl mx-auto flex flex-col gap-5 items-center">
          <h2 className={`text-3xl sm:text-4xl font-black ${isDark ? "text-white" : "text-white"}`}>{config.finalCta.headline}</h2>
          <p className={`text-base ${isDark ? "text-white/70" : "text-white/80"}`}>{config.finalCta.sub}</p>
          <CTAButton label={config.finalCta.ctaLabel} msg={config.finalCta.waMessage} cls={`${btnWA} text-lg px-8 py-4 shadow-2xl`} />
          <p className={`text-xs ${isDark ? "text-white/40" : "text-white/60"}`}>Atención personalizada · Precios exclusivos · Sin compromiso</p>
        </div>
      </section>

      {/* ── FLOATING WA ───────────────────────────────────── */}
      <a
        href={waLink(config.finalCta.waMessage)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackWA(slug)}
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-full px-4 py-3 shadow-2xl font-semibold text-sm transition-all duration-200 hover:-translate-y-0.5"
        data-testid="floating-wa-btn"
      >
        <WASvg />
        <span className="hidden sm:inline">Cotizar ahora</span>
      </a>

      {/* ── FOOTER ────────────────────────────────────────── */}
      <footer className={`py-8 px-4 text-center border-t ${isDark ? "border-white/10 text-gray-500" : "border-gray-200 text-gray-400"} text-xs`}>
        <p>{config.brand === "fenix" ? "Fenix Traveler" : "Chroma Travel"} · Agencia de Viajes Certificada · SECTUR México</p>
        <p className="mt-1">WA: <a href={`https://wa.me/${WA}`} className={`${accent} underline`}>+52 443 404 4104</a></p>
      </footer>
    </div>
  );
}

function WASvg() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="flex-shrink-0">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}
