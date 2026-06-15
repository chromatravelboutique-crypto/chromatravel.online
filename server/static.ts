import express, { type Express, type Request, type Response } from "express";
import fs from "fs";
import path from "path";

const BRAND_META: Record<string, { title: string; description: string; ogTitle: string }> = {
  fenix: {
    title: "Fénix Traveler | Viajes de Lujo desde Morelia",
    description: "Agencia de viajes premium en Morelia. Paquetes exclusivos, bodas en destino y grupos.",
    ogTitle: "Fénix Traveler — Viajes de Lujo",
  },
  chroma: {
    title: "Chroma Travel Boutique | Viajes LGBT+ de Lujo",
    description: "Agencia de viajes LGBT+ friendly en México. Experiencias únicas e inclusivas.",
    ogTitle: "Chroma Travel Boutique — Viajes LGBT+",
  },
};

// Route-specific descriptions override the default brand description
const ROUTE_DESCRIPTIONS: Record<string, Record<string, string>> = {
  fenix: {
    "/paquetes":   "Explora nuestros paquetes de viaje premium con tarifas negociadas directamente con los mejores hoteles de México.",
    "/blog":       "Artículos y guías de viaje escritos por nuestros expertos desde Morelia. Inspiración para tu próximo destino.",
    "/nosotros":   "Conoce a Fénix Traveler, tu agencia de viajes de lujo en Morelia. Historia, valores y equipo especializado.",
    "/contacto":   "Contáctanos por WhatsApp o email. Respondemos en menos de 2 horas en horario de oficina.",
    "/grupos":     "Cotiza tu viaje grupal de 15 a 200 personas. Tarifas exclusivas y coordinador dedicado para tu grupo.",
    "/bodas":      "Organiza tu boda en destino con Fénix Traveler. Wedding planners especializados en Cancún, Los Cabos y más.",
  },
  chroma: {
    "/paquetes":   "Explora nuestros paquetes de viaje LGBT+ friendly con tarifas negociadas y experiencias inclusivas únicas.",
    "/blog":       "Artículos y guías de viaje para la comunidad LGBT+ desde México. Destinos, tips y experiencias recomendadas.",
    "/nosotros":   "Conoce a Chroma Travel Boutique, tu agencia de viajes LGBT+ en México. Inclusividad, diversidad y lujo.",
    "/contacto":   "Contáctanos por WhatsApp o email. Tu consultor LGBT+ friendly responde en menos de 2 horas.",
    "/grupos":     "Cotiza tu viaje grupal LGBT+ friendly. Coordinamos grupos de 15 a 200 personas con experiencia e inclusividad.",
    "/bodas":      "Organiza tu boda o ceremonia simbólica LGBT+ en destino. Ambientes seguros e inclusivos garantizados.",
  },
};

const LOCAL_BUSINESS: Record<string, object> = {
  fenix: {
    "@context": "https://schema.org",
    "@type": "TravelAgency",
    "name": "Fénix Traveler",
    "url": "https://www.fenixtraveler.com",
    "telephone": "+524435049568",
    "email": "contacto@fenixtraveler.com",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Morelia",
      "addressRegion": "Michoacán",
      "addressCountry": "MX",
    },
    "priceRange": "$$",
    "description": "Agencia de viajes premium en Morelia especializada en paquetes de lujo, bodas en destino y grupos.",
    "sameAs": ["https://www.fenixtraveler.com"],
  },
  chroma: {
    "@context": "https://schema.org",
    "@type": "TravelAgency",
    "name": "Chroma Travel Boutique",
    "url": "https://www.chromatravel.online",
    "telephone": "+524434044104",
    "email": "contacto@chromatravel.online",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Morelia",
      "addressRegion": "Michoacán",
      "addressCountry": "MX",
    },
    "priceRange": "$$",
    "description": "Agencia de viajes LGBT+ friendly en México especializada en experiencias únicas e inclusivas.",
    "sameAs": ["https://www.chromatravel.online"],
  },
};

function rewriteHead(html: string, brand: any, reqPath: string): string {
  const code = brand?.code === "fenix" ? "fenix" : "chroma";
  const meta = BRAND_META[code];
  const domain = brand?.domain || (code === "fenix" ? "fenixtraveler.com" : "chromatravel.online");
  const canonical = `https://www.${domain}${reqPath === "/" ? "" : reqPath}`;

  // Use route-specific description if available
  const routeDesc = ROUTE_DESCRIPTIONS[code]?.[reqPath];
  const description = routeDesc || meta.description;

  // Inject LocalBusiness JSON-LD before </head>
  const ldJson = `<script type="application/ld+json">${JSON.stringify(LOCAL_BUSINESS[code])}</script>`;

  let result = html
    .replace(/<title>[^<]*<\/title>/, `<title>${meta.title}</title>`)
    .replace(/(<meta name="description" content=")[^"]*(")/,        `$1${description}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/,       `$1${meta.ogTitle}$2`)
    .replace(/(<meta property="og:description" content=")[^"]*(")/,  `$1${description}$2`)
    .replace(/(<meta name="twitter:title" content=")[^"]*(")/,      `$1${meta.ogTitle}$2`)
    .replace(/(<meta name="twitter:description" content=")[^"]*(")/,`$1${description}$2`)
    .replace(/(<link rel="canonical" href=")[^"]*(")/,              `$1${canonical}$2`);

  // Inject LocalBusiness schema before </head>
  result = result.replace("</head>", `${ldJson}\n</head>`);

  return result;
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath, {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith(".js") || filePath.endsWith(".mjs")) {
        res.setHeader("Content-Type", "application/javascript; charset=utf-8");
      } else if (filePath.endsWith(".css")) {
        res.setHeader("Content-Type", "text/css; charset=utf-8");
      }
    },
  }));

  const indexPath = path.resolve(distPath, "index.html");
  const baseHtml = fs.readFileSync(indexPath, "utf-8");

  // SSR head: rewrite meta tags + inject LocalBusiness schema per brand before serving index.html
  app.use("*", (req: Request, res: Response) => {
    const brand = (req as any).brand;
    const html = rewriteHead(baseHtml, brand, req.path);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(html);
  });
}
