import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import compression from "compression";
import connectPgSimple from "connect-pg-simple";
import path from "path";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { initializeAutomationJobs } from "./jobs/automation.jobs";
import { startCleanupJob } from "./jobs/cleanup-bloqueos";
import { startHoldExpiryJob } from "./jobs/hold-expiry";
import { createServer } from "http";
import { brandMiddleware } from "./brand-middleware";
import { seedBrands } from "./seed-brands";
import { seedBloqueos } from "./seed-bloqueos";
import { seedBloqueosFenix } from "./seed-bloqueos-fenix";
import { pool } from "./db";

const app = express();
const httpServer = createServer(app);
const PgStore = connectPgSimple(session);

app.disable('x-powered-by');

// Trust proxy for correct protocol detection behind reverse proxies
app.set('trust proxy', true);

// WWW to non-WWW redirect (301 permanent) for SEO
// Always redirect to HTTPS for security
app.use((req, res, next) => {
  const host = req.get('host') || '';
  if (host.startsWith('www.')) {
    const newHost = host.replace('www.', '');
    return res.redirect(301, `https://${newHost}${req.originalUrl}`);
  }
  next();
});

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

(async () => {
  // Seed brands on startup (with error handling for missing tables)
  try {
    await seedBrands();
  } catch (error) {
    console.error("Brand seeding failed (database may not be ready):", error);
    console.log("Continuing with default brand configuration...");
  }

  // Seed bloqueos data if table is empty (ensures production has rates)
  try {
    await seedBloqueos();
  } catch (error) {
    console.error("Bloqueos seeding failed:", error);
  }

  // Seed Fenix 2026 inventory (upsert — safe to run every startup)
  try {
    await seedBloqueosFenix();
  } catch (error) {
    console.error("Fenix bloqueos seeding failed:", error);
  }
  
  // Enable Gzip/Brotli compression for all responses
  app.use(compression());

  // ── Rate limiting — protege endpoints públicos contra abuso ─────────────────
  const { default: rateLimit } = await import("express-rate-limit");
  const publicLimiter = rateLimit({
    windowMs: 60 * 1000,     // 1 minuto
    max: 60,                 // 60 req/min por IP en endpoints públicos generales
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Demasiadas solicitudes. Intenta en un momento." },
  });
  const strictLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,                 // 10 req/min para endpoints de reservas/leads/pagos
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Límite de solicitudes alcanzado. Intenta en un momento." },
  });
  app.use("/api/reservar-precompra", strictLimiter);
  app.use("/api/leads",              strictLimiter);
  app.use("/api/reservas",           strictLimiter);
  app.use("/api/payments",           strictLimiter);
  app.use("/api/tarifas-especiales", publicLimiter);
  app.use("/api/hotels",             publicLimiter);

  // Start hold expiry job (libera habitaciones de holds expirados cada 5 min)
  startHoldExpiryJob();

  // Domain redirect handled by Cloudflare Page Rule (apex → www)

  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  
  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    // Allow iframe embedding for bloqueos widget
    if (req.path === '/iframe-bloqueos.html') {
      res.setHeader('X-Frame-Options', 'ALLOWALL');
      res.setHeader('Content-Security-Policy', "frame-ancestors *");
    } else {
      res.setHeader("X-Frame-Options", "SAMEORIGIN");
    }
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    if (process.env.NODE_ENV === "production") {
      const proto = req.headers["x-forwarded-proto"];
      if (proto && proto !== "https") {
        return res.redirect(301, `https://${req.get("host")}${req.originalUrl}`);
      }
    }
    next();
  });

  const blockedPaths = ["/env-file.txt", "/env-file", "/.env", "/ecosystem.config.cjs", "/ecosystem.config.js"];
  app.use((req, res, next) => {
    if (blockedPaths.includes(req.path)) {
      return res.status(404).send("Not found");
    }
    if (req.path === "/download-deploy") {
      const sess = req.session as any;
      if (!sess?.user || sess.user.role !== "admin") {
        return res.status(401).json({ message: "Unauthorized" });
      }
    }
    next();
  });

  const sessionSecret = process.env.SESSION_SECRET;
  if (!sessionSecret && process.env.NODE_ENV === "production") {
    console.error("FATAL: SESSION_SECRET must be set in production");
    process.exit(1);
  }

  app.use(session({
    store: pool
      ? new PgStore({ pool, tableName: "session", createTableIfMissing: true })
      : new (require("memorystore")(session))({ checkPeriod: 86400000 }),
    secret: sessionSecret || "dev-only-secret-not-for-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000
    }
  }));
  
  // Brand resolution middleware
  app.use(brandMiddleware);
  
  // Serve static assets from attached_assets/generated_images as /assets/
  app.use('/assets', express.static(path.join(process.cwd(), 'attached_assets', 'generated_images')));
  // Also serve directly from attached_assets for other images
  app.use('/attached_assets', express.static(path.join(process.cwd(), 'attached_assets')));

  app.use((req, res, next) => {
    const start = Date.now();
    const reqPath = req.path;
    let capturedJsonResponse: Record<string, any> | undefined = undefined;

    const originalResJson = res.json;
    res.json = function (bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };

    res.on("finish", () => {
      const duration = Date.now() - start;
      if (reqPath.startsWith("/api")) {
        let logLine = `${req.method} ${reqPath} ${res.statusCode} in ${duration}ms`;
        if (capturedJsonResponse) {
          logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
        }

        log(logLine);
      }
    });

    next();
  });

  await registerRoutes(httpServer, app);
  startCleanupJob();

  initializeAutomationJobs();

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
