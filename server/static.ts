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

function rewriteHead(html: string, brand: any, reqPath: string): string {
  const code = brand?.code === "fenix" ? "fenix" : "chroma";
  const meta = BRAND_META[code];
  const domain = brand?.domain || (code === "fenix" ? "fenixtraveler.com" : "chromatravel.online");
  const canonical = `https://www.${domain}${reqPath === "/" ? "" : reqPath}`;

  return html
    .replace(/<title>[^<]*<\/title>/, `<title>${meta.title}</title>`)
    .replace(/(<meta name="description" content=")[^"]*(")/,       `$1${meta.description}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/,      `$1${meta.ogTitle}$2`)
    .replace(/(<meta property="og:description" content=")[^"]*(")/,`$1${meta.description}$2`)
    .replace(/(<meta name="twitter:title" content=")[^"]*(")/,     `$1${meta.ogTitle}$2`)
    .replace(/(<meta name="twitter:description" content=")[^"]*(")/,`$1${meta.description}$2`)
    .replace(/(<link rel="canonical" href=")[^"]*(")/,             `$1${canonical}$2`);
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

  // SSR head: rewrite meta tags per brand before serving index.html
  app.use("*", (req: Request, res: Response) => {
    const brand = (req as any).brand;
    const html = rewriteHead(baseHtml, brand, req.path);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(html);
  });
}
