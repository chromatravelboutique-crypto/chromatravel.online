import type { Express } from "express";
import { createServer, type Server } from "http";
import { registerOtaB2cRoutes } from "./ota-b2c-routes";
import { calcularPrecioBloqueo, type KuaniTier } from "@shared/pricing-engine";
import { storage } from "./storage";
import { insertLeadSchema, insertBookingSchema, insertUserSchema, searchFiltersSchema, loginSchema } from "@shared/schema";
import { z } from "zod";
import { hash, compare } from "bcrypt";
import { getAllBrands } from "./brand-middleware";
import { registerSeoRoutes } from "./seo-routes";
import { registerRssRoutes } from "./rss-routes";
import { registerAutomationRoutes } from "./automation-routes";
import { sendLeadNotification, sendEmail, verifyEmailConnection } from "./email-service";
import { tboClient, type TBOSearchRequest, type TBOPreBookRequest, type TBOBookRequest, type TBOCancelRequest } from "./tbo-holidays";
import {
  searchHotelsFromProviders,
  searchAttractionsFromProviders,
  searchFlightsFromProviders,
  getProviderStatus,
  xcaretProvider,
  amadeusProvider,
} from "./services";
import { insertLgbtEventSchema, insertLgbtCruiseSchema, insertDestinationSchema } from "@shared/schema";
import { TBOCertificationService } from "./services/tbo-certification";
import { HotelbedsCertificationService } from "./services/hotelbeds-certification";
import { unifiedHotelSearch, getProviderStatus as getUnifiedProviderStatus, getConfiguredProviders } from "./services/bedbanks/unified-search";
import { getAllDestinations } from "./services/bedbanks/destination-mapping";
import { sendEmail as sendCrmEmail, generateBirthdayEmail, generatePromoEmail, generateBookingConfirmationEmail } from "./crm/communications";
import { readFeed, detectNewArticles, checkAndPublishNewContent, generateSocialButtons } from "./crm/rss-social";
import { generateReceipt, generateProforma as generateProformaPdf, generateQRCode } from "./crm/document-generator";
import { sendWhatsAppMessage, generateBookingWhatsAppMessage, generatePromoWhatsAppMessage, generateBirthdayWhatsAppMessage } from "./crm/whatsapp";
import path from "path";
import fs from "fs";
import { cache, CK, TTL, invalidateTarifasCaches } from "./cache";
import { enqueueJob } from "./jobs/job-queue";

const crmEmailSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1),
  html: z.string().min(1),
  text: z.string().optional(),
  brandCode: z.enum(['fenix', 'chroma']).optional()
});

const crmBirthdaySchema = z.object({
  nombre: z.string().min(1),
  email: z.string().email(),
  puntosRegalo: z.number().optional(),
  codigoDescuento: z.string().optional(),
  brandCode: z.enum(['fenix', 'chroma']).optional()
});

const crmPromoSchema = z.object({
  nombre: z.string().min(1),
  email: z.string().email(),
  tier: z.string().optional(),
  promocion: z.object({
    titulo: z.string(),
    descuento: z.string(),
    destino: z.string()
  }),
  brandCode: z.enum(['fenix', 'chroma']).optional()
});

const crmBookingEmailSchema = z.object({
  booking: z.object({
    confirmationCode: z.string(),
    checkIn: z.string(),
    checkOut: z.string(),
    guests: z.number(),
    totalPrice: z.union([z.string(), z.number()]),
    currency: z.string(),
    guestFirstName: z.string()
  }),
  email: z.string().email(),
  brandCode: z.enum(['fenix', 'chroma']).optional()
});

const crmWhatsAppSchema = z.object({
  to: z.string().min(10),
  message: z.string().min(1),
  brandCode: z.enum(['fenix', 'chroma']).optional()
});

const crmReceiptSchema = z.object({
  datosPago: z.object({
    id: z.string(),
    fechaPago: z.string(),
    referencia: z.string(),
    reservaId: z.string(),
    metodoPago: z.string(),
    monto: z.number(),
    moneda: z.string()
  }),
  cliente: z.object({
    nombre: z.string(),
    apellidos: z.string(),
    email: z.string().email(),
    telefono: z.string()
  }),
  brandCode: z.enum(['fenix', 'chroma']).optional()
});

const crmProformaSchema = z.object({
  reserva: z.object({
    confirmationCode: z.string(),
    checkIn: z.string(),
    checkOut: z.string(),
    guests: z.number(),
    rooms: z.number().optional(),
    totalPrice: z.union([z.string(), z.number()]),
    currency: z.string()
  }),
  cliente: z.object({
    nombre: z.string(),
    apellidos: z.string(),
    email: z.string().email(),
    telefono: z.string()
  }),
  brandCode: z.enum(['fenix', 'chroma']).optional()
});

const crmWhatsAppBookingSchema = z.object({
  phone: z.string().min(10),
  booking: z.object({
    confirmationCode: z.string(),
    checkIn: z.string(),
    checkOut: z.string(),
    guests: z.number(),
    totalPrice: z.union([z.string(), z.number()]),
    currency: z.string(),
    guestFirstName: z.string()
  }),
  brandCode: z.enum(['fenix', 'chroma']).optional()
});

const crmWhatsAppPromoSchema = z.object({
  phone: z.string().min(10),
  nombre: z.string().min(1),
  promocion: z.object({
    titulo: z.string(),
    descuento: z.string(),
    destino: z.string()
  }),
  brandCode: z.enum(['fenix', 'chroma']).optional()
});

const crmWhatsAppBirthdaySchema = z.object({
  phone: z.string().min(10),
  nombre: z.string().min(1),
  codigoDescuento: z.string().optional(),
  brandCode: z.enum(['fenix', 'chroma']).optional()
});

function scoreLeadData(data: { phone?: string | null; destination?: string | null; travelDates?: string | null; message?: string | null; source?: string | null }): { points: number; category: 'HOT' | 'WARM' | 'COLD' } {
  let points = 0;
  if (data.phone) points += 25;
  if (data.destination) points += 20;
  if (data.travelDates) points += 20;
  if (data.message && data.message.length > 10) points += 15;
  if (data.source === 'whatsapp' || data.source === 'referral') points += 10;
  if (data.source === 'widget-cotizador' || data.source === 'exit-intent') points += 5;
  points += 10;
  let category: 'HOT' | 'WARM' | 'COLD' = 'COLD';
  if (points >= 70) category = 'HOT';
  else if (points >= 40) category = 'WARM';
  return { points, category };
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Register SEO routes (sitemap.xml, robots.txt, schema.org)
  registerSeoRoutes(app);
  
  // Register RSS/Atom/JSON feed routes
  registerRssRoutes(app);
  
  // Register automation/webhook routes
  registerAutomationRoutes(app);
  
  // ============================================
  // HEALTH CHECK (for Railway/deployment)
  // ============================================
  
  app.get("/api/health", async (req, res) => {
    try {
      res.status(200).json({ 
        status: "ok", 
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      });
    } catch (error) {
      res.status(500).json({ status: "error" });
    }
  });
  
  // ============================================
  // BRAND API
  // ============================================
  
  // Get current brand context
  app.get("/api/brand", async (req, res) => {
    try {
      if (req.brand) {
        res.json(req.brand);
      } else {
        res.status(404).json({ message: "Brand not found" });
      }
    } catch (error) {
      console.error("Error fetching brand:", error);
      res.status(500).json({ message: "Error fetching brand" });
    }
  });
  
  // Get all brands (for admin)
  app.get("/api/brands", async (req, res) => {
    try {
      const brands = await getAllBrands();
      res.json(brands);
    } catch (error) {
      console.error("Error fetching brands:", error);
      res.status(500).json({ message: "Error fetching brands" });
    }
  });
  
  // ============================================
  // HOTELS API
  // ============================================
  
  // Get all hotels with optional filters
  app.get("/api/hotels", async (req, res) => {
    try {
      const filters = searchFiltersSchema.parse({
        destination: req.query.destination as string,
        checkIn: req.query.checkIn as string,
        checkOut: req.query.checkOut as string,
        guests: req.query.guests ? parseInt(req.query.guests as string) : undefined,
        minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
        maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
        lgbtFriendlyOnly: req.query.lgbtFriendlyOnly === "true",
        amenities: req.query.amenities ? (req.query.amenities as string).split(",") : undefined,
      });
      
      const hotels = await storage.getHotels(filters);
      res.json(hotels);
    } catch (error) {
      console.error("Error fetching hotels:", error);
      res.status(500).json({ message: "Error fetching hotels" });
    }
  });

  // Search hotels by query (local database)
  app.get("/api/hotels/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.json([]);
      }
      const hotels = await storage.searchHotels(query);
      res.json(hotels);
    } catch (error) {
      console.error("Error searching hotels:", error);
      res.status(500).json({ message: "Error searching hotels" });
    }
  });

  // ============================================
  // UNIFIED BEDBANK SEARCH API
  // ============================================

  const unifiedSearchSchema = z.object({
    checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido (YYYY-MM-DD)"),
    checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido (YYYY-MM-DD)"),
    destination: z.string().min(2, "Destino requerido"),
    rooms: z.array(z.object({
      adults: z.number().min(1).max(6),
      children: z.number().min(0).max(4).default(0),
      childrenAges: z.array(z.number()).optional(),
    })).default([{ adults: 2, children: 0 }]),
    currency: z.string().length(3).default("USD"),
    nationality: z.string().length(2).default("MX"),
  });

  // Unified hotel search across TBO, Hotelbeds, RateHawk
  app.post("/api/hotels/unified-search", async (req, res) => {
    try {
      const validation = unifiedSearchSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: validation.error.errors.map(e => e.message).join(", "),
        });
      }

      const cacheKey = CK.hotelSearch(validation.data as unknown as Record<string, unknown>);
      const cached = cache.get<object>(cacheKey);
      if (cached) {
        res.setHeader("X-Cache", "HIT");
        return res.json(cached);
      }

      const result = await unifiedHotelSearch(validation.data);
      // Only cache successful responses with results
      if (result && (result as any).total > 0) {
        cache.set(cacheKey, result, TTL.HOTEL_SEARCH);
      }
      res.setHeader("X-Cache", "MISS");
      res.json(result);
    } catch (error) {
      console.error("Unified search error:", error);
      res.status(500).json({
        success: false,
        error: "Error al buscar hoteles",
        hotels: [],
        total: 0,
      });
    }
  });

  // Get configured bedbank providers status
  app.get("/api/hotels/providers", async (req, res) => {
    try {
      const providers = getUnifiedProviderStatus();
      const configured = getConfiguredProviders();
      res.json({
        providers,
        configured,
        total: providers.length,
        active: configured.length,
      });
    } catch (error) {
      console.error("Error fetching providers:", error);
      res.status(500).json({ message: "Error fetching providers" });
    }
  });

  // Get available destinations for bedbank search
  app.get("/api/hotels/destinations", async (req, res) => {
    try {
      const destinations = getAllDestinations();
      res.json({
        destinations,
        total: destinations.length,
      });
    } catch (error) {
      console.error("Error fetching destinations:", error);
      res.status(500).json({ message: "Error fetching destinations" });
    }
  });

  // Get single hotel with rooms and rates
  app.get("/api/hotels/:id", async (req, res) => {
    try {
      const hotel = await storage.getHotel(req.params.id);
      if (!hotel) {
        return res.status(404).json({ message: "Hotel not found" });
      }
      
      const rooms = await storage.getRoomsByHotel(req.params.id);
      const rates = await storage.getRatesByHotel(req.params.id);
      
      res.json({
        ...hotel,
        rooms: rooms.map(room => ({
          ...room,
          rates: rates.filter(rate => rate.roomId === room.id)
        }))
      });
    } catch (error) {
      console.error("Error fetching hotel:", error);
      res.status(500).json({ message: "Error fetching hotel" });
    }
  });

  // ============================================
  // ROOMS API
  // ============================================
  
  app.get("/api/hotels/:hotelId/rooms", async (req, res) => {
    try {
      const rooms = await storage.getRoomsByHotel(req.params.hotelId);
      res.json(rooms);
    } catch (error) {
      console.error("Error fetching rooms:", error);
      res.status(500).json({ message: "Error fetching rooms" });
    }
  });

  app.get("/api/rooms/:id", async (req, res) => {
    try {
      const room = await storage.getRoom(req.params.id);
      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }
      const rates = await storage.getRatesByRoom(req.params.id);
      res.json({ ...room, rates });
    } catch (error) {
      console.error("Error fetching room:", error);
      res.status(500).json({ message: "Error fetching room" });
    }
  });

  // ============================================
  // RATES API
  // ============================================
  
  app.get("/api/rates/:id", async (req, res) => {
    try {
      const rate = await storage.getRate(req.params.id);
      if (!rate) {
        return res.status(404).json({ message: "Rate not found" });
      }
      res.json(rate);
    } catch (error) {
      console.error("Error fetching rate:", error);
      res.status(500).json({ message: "Error fetching rate" });
    }
  });

  // ============================================
  // TARIFAS ESPECIALES (Public Bloqueos API)
  // ============================================

  app.get("/api/tarifas-especiales", async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    try {
      const { getPool } = await import("./db");
      const pool = getPool();
      if (!pool) return res.status(503).json({ error: "Database not available" });

      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 12));
      const offset = (page - 1) * limit;
      const hotel = req.query.hotel as string | undefined;
      const diversify = req.query.diversify === "true";

      // ── Cache check ──────────────────────────────────────────────────────────
      const brandId = (req as any).brand?.id ?? "public";
      const cacheKey = CK.tarifas(brandId, page, limit, hotel ?? "", diversify);
      const cached = cache.get<object>(cacheKey);
      if (cached) {
        res.setHeader("X-Cache", "HIT");
        res.setHeader("Cache-Control", "public, max-age=180");
        return res.json(cached);
      }
      // ────────────────────────────────────────────────────────────────────────

      const today = new Date().toISOString().split("T")[0];
      const baseWhere = `WHERE estado = 'Activo' AND fecha_inicio >= '${today}'`;
      let whereClause = baseWhere;
      const params: any[] = [];
      let paramIdx = 1;

      if (hotel) {
        whereClause += ` AND LOWER(hotel) LIKE $${paramIdx}`;
        params.push(`%${hotel.toLowerCase()}%`);
        paramIdx++;
      }

      const safeNotes = (notes: string | null): string | null => {
        if (!notes) return null;
        const lower = notes.toLowerCase();
        if (lower.includes("comision") || lower.includes("interno") || lower.includes("agente")) return null;
        return notes;
      };

      const mapRow = (row: any) => ({
        hotel: row.hotel,
        roomType: row.tipo_habitacion,
        checkIn: row.fecha_inicio,
        checkOut: row.fecha_fin,
        priceDouble: row.tarifa_doble,
        priceSingle: row.tarifa_sencilla,
        priceTriple: row.tarifa_triple,
        priceQuad: row.tarifa_cuadruple,
        priceChildFirst: row.tarifa_primer_menor,
        priceChildSecond: row.tarifa_segundo_menor,
        priceJunior: row.tarifa_junior,
        availability: row.habitaciones_disponibles,
        notes: safeNotes(row.observaciones),
      });

      if (diversify && !hotel) {
        const destPriority: Record<string, number> = {
          "cancun": 1, "cancún": 1,
          "playa del carmen": 2, "riviera maya": 2, "playacar": 2, "xcaret": 2,
          "puerto vallarta": 3, "vallarta": 3,
          "ixtapa": 4, "zihuatanejo": 4,
          "huatulco": 5,
          "mazatlan": 6, "mazatlán": 6,
          "los cabos": 7, "cabo": 7,
          "europa": 8, "europe": 8,
        };

        const extractDest = (hotelName: string): string => {
          const lower = hotelName.toLowerCase();
          for (const [keyword, _] of Object.entries(destPriority)) {
            if (lower.includes(keyword)) return keyword;
          }
          return lower;
        };

        const getDestPriority = (hotelName: string): number => {
          const lower = hotelName.toLowerCase();
          for (const [keyword, priority] of Object.entries(destPriority)) {
            if (lower.includes(keyword)) return priority;
          }
          return 99;
        };

        const allResult = await pool.query(
          `SELECT hotel, tipo_habitacion, fecha_inicio, fecha_fin, tarifa_doble, tarifa_sencilla, tarifa_triple, tarifa_cuadruple, tarifa_primer_menor, tarifa_segundo_menor, tarifa_junior, habitaciones_disponibles, observaciones
           FROM bloqueos ${baseWhere}
           ORDER BY tarifa_doble ASC, fecha_inicio ASC`
        );

        const byDest: Record<string, any[]> = {};
        for (const row of allResult.rows) {
          const dest = extractDest(row.hotel);
          if (!byDest[dest]) byDest[dest] = [];
          byDest[dest].push(row);
        }

        const selected: any[] = [];
        const seenHotels = new Set<string>();

        const sortedDests = Object.keys(byDest).sort((a, b) => {
          const pa = destPriority[a] ?? 99;
          const pb = destPriority[b] ?? 99;
          return pa - pb;
        });

        for (const dest of sortedDests) {
          const rows = byDest[dest];
          const cheapest = rows[0];
          if (!seenHotels.has(cheapest.hotel)) {
            selected.push(cheapest);
            seenHotels.add(cheapest.hotel);
          }

          if (rows.length > 1) {
            const expensive = rows[rows.length - 1];
            const cheapPrice = parseFloat(cheapest.tarifa_doble);
            const expPrice = parseFloat(expensive.tarifa_doble);
            if (expPrice > cheapPrice * 1.3 && !seenHotels.has(expensive.hotel)) {
              selected.push(expensive);
              seenHotels.add(expensive.hotel);
            }
          }
        }

        selected.sort((a, b) => {
          const pa = getDestPriority(a.hotel);
          const pb = getDestPriority(b.hotel);
          if (pa !== pb) return pa - pb;
          return parseFloat(a.tarifa_doble) - parseFloat(b.tarifa_doble);
        });

        const finalSelection = selected.slice(0, limit);

        const [countResult, hotelsResult] = await Promise.all([
          pool.query(`SELECT COUNT(*) FROM bloqueos ${baseWhere}`),
          pool.query(`SELECT DISTINCT hotel FROM bloqueos ${baseWhere} ORDER BY hotel`),
        ]);

        const diversifyPayload = {
          total: parseInt(countResult.rows[0].count),
          page: 1,
          limit: finalSelection.length,
          totalPages: 1,
          hotels: hotelsResult.rows.map((r: any) => r.hotel),
          tarifas: finalSelection.map(mapRow),
        };
        cache.set(cacheKey, diversifyPayload, TTL.TARIFAS);
        res.setHeader("X-Cache", "MISS");
        res.setHeader("Cache-Control", "public, max-age=180");
        return res.json(diversifyPayload);
      }

      const countQuery = `SELECT COUNT(*) FROM bloqueos ${whereClause}`;
      const dataQuery = `SELECT hotel, tipo_habitacion, fecha_inicio, fecha_fin, tarifa_doble, tarifa_sencilla, tarifa_triple, tarifa_cuadruple, tarifa_primer_menor, tarifa_segundo_menor, tarifa_junior, habitaciones_disponibles, observaciones FROM bloqueos ${whereClause} ORDER BY tarifa_doble ASC, fecha_inicio ASC LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`;
      const dataParams = [...params, limit, offset];

      const [countResult, dataResult, hotelsResult] = await Promise.all([
        pool.query(countQuery, params),
        pool.query(dataQuery, dataParams),
        pool.query(`SELECT DISTINCT hotel FROM bloqueos ${baseWhere} ORDER BY hotel`),
      ]);

      const total = parseInt(countResult.rows[0].count);

      const payload = {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hotels: hotelsResult.rows.map((r: any) => r.hotel),
        tarifas: dataResult.rows.map(mapRow),
      };
      cache.set(cacheKey, payload, TTL.TARIFAS);
      res.setHeader("X-Cache", "MISS");
      res.setHeader("Cache-Control", "public, max-age=180");
      res.json(payload);
    } catch (error: any) {
      console.error("[Tarifas Especiales] Error:", error);
      res.status(500).json({ error: "Error fetching special rates" });
    }
  });

  // ============================================
  // RESERVAR PRECOMPRA (Cotizador Modal)
  // ============================================

  const precompraSchema = z.object({
    name: z.string().min(2).max(200),
    email: z.string().email().max(200),
    phone: z.string().max(30).optional(),
    comments: z.string().max(1000).optional(),
    hotel: z.string().min(1).max(200),
    roomType: z.string().min(1).max(200),
    checkIn: z.string().min(1),
    checkOut: z.string().min(1),
    adults: z.number().int().min(1).max(8),
    children: z.number().int().min(0).max(6),
    juniors: z.number().int().min(0).max(4),
    infants: z.number().int().min(0).max(4),
    roomsNeeded: z.number().int().min(1).max(4),
  });

  function serverCalculateTotal(
    bloqueo: any,
    adults: number,
    children: number,
    juniors: number,
    _infants: number
  ): { totalPrice: number; rooms: Array<{ adults: number; children: number; juniors: number; infants: number; rateType: string }> } {
    const pSgl = parseFloat(bloqueo.tarifa_sencilla) || 0;
    const pDbl = parseFloat(bloqueo.tarifa_doble) || 0;
    const pTpl = parseFloat(bloqueo.tarifa_triple) || pDbl;
    const pQuad = parseFloat(bloqueo.tarifa_cuadruple || "0") || pTpl;
    const pChild = parseFloat(bloqueo.tarifa_primer_menor || "0") || 0;
    const pJunior = parseFloat(bloqueo.tarifa_junior || "0") || 0;

    const totalGuests = adults + juniors + children;
    const maxPerRoom = 4;
    const roomsNeeded = Math.max(1, Math.ceil(totalGuests / maxPerRoom));
    const rooms: Array<{ adults: number; children: number; juniors: number; infants: number; rateType: string }> = [];

    let rAdults = adults, rChildren = children, rJuniors = juniors, rInfants = _infants;
    let totalPrice = 0;

    for (let i = 0; i < roomsNeeded; i++) {
      const a = Math.ceil(rAdults / (roomsNeeded - i));
      rAdults -= a;
      const j = Math.min(rJuniors, maxPerRoom - a);
      rJuniors -= j;
      const c = Math.min(rChildren, maxPerRoom - a - j);
      rChildren -= c;
      const inf = Math.min(rInfants, 2);
      rInfants -= inf;

      const occ = a + j + c;
      let rateType = "DBL";
      let baseRate = pDbl;
      if (occ === 1) { rateType = "SGL"; baseRate = pSgl; }
      else if (occ === 2) { rateType = "DBL"; baseRate = pDbl; }
      else if (occ === 3) { rateType = "TPL"; baseRate = pTpl; }
      else if (occ >= 4) { rateType = "QUAD"; baseRate = pQuad; }

      totalPrice += a * baseRate;
      if (c > 0) totalPrice += c * (pChild > 0 ? pChild : baseRate * 0.5);
      if (j > 0) totalPrice += j * (pJunior > 0 ? pJunior : baseRate * 0.7);

      rooms.push({ adults: a, children: c, juniors: j, infants: inf, rateType });
    }

    return { totalPrice: Math.round(totalPrice * 100) / 100, rooms };
  }

  function serverGetDeposit(checkIn: string): { percent: number; label: string } {
    const days = Math.max(0, Math.round((new Date(checkIn).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
    if (days <= 10) return { percent: 100, label: "Pago total" };
    if (days <= 24) return { percent: 70, label: "70% anticipo" };
    if (days <= 89) return { percent: 50, label: "50% anticipo" };
    return { percent: 30, label: "30% anticipo" };
  }

  app.post("/api/reservar-precompra", async (req, res) => {
    try {
      const parsed = precompraSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Datos inválidos", errors: parsed.error.errors });
      }

      const data = parsed.data;
      data.name = sanitizeInput(data.name);
      data.email = data.email.trim().toLowerCase();
      if (data.phone) data.phone = sanitizeInput(data.phone);
      if (data.comments) data.comments = sanitizeInput(data.comments);

      const { getPool } = await import("./db");
      const pool = getPool();
      if (!pool) return res.status(503).json({ message: "Database not available" });

      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        const bloqueoResult = await client.query(
          `SELECT id, hotel, tipo_habitacion, fecha_inicio, fecha_fin, tarifa_doble, tarifa_sencilla, tarifa_triple, tarifa_cuadruple, tarifa_primer_menor, tarifa_segundo_menor, tarifa_junior, habitaciones_disponibles, observaciones
           FROM bloqueos
           WHERE estado = 'Activo' AND hotel = $1 AND tipo_habitacion = $2 AND fecha_inicio = $3 AND fecha_fin = $4
           FOR UPDATE
           LIMIT 1`,
          [data.hotel, data.roomType, data.checkIn.split('T')[0], data.checkOut.split('T')[0]]
        );

        if (bloqueoResult.rows.length === 0) {
          await client.query('ROLLBACK');
          return res.status(404).json({ message: "Tarifa no encontrada o ya no disponible" });
        }

        const bloqueo = bloqueoResult.rows[0];
        const { totalPrice, rooms } = serverCalculateTotal(bloqueo, data.adults, data.children, data.juniors, data.infants);
        const deposit = serverGetDeposit(data.checkIn);
        const depositAmount = Math.ceil(totalPrice * deposit.percent / 100);
        const roomsNeeded = rooms.length;
        const availableRooms = bloqueo.habitaciones_disponibles || 0;

        if (availableRooms < roomsNeeded) {
          await client.query('ROLLBACK');
          return res.status(409).json({ message: `Solo quedan ${availableRooms} habitaciones disponibles` });
        }

        const updateResult = await client.query(
          `UPDATE bloqueos SET habitaciones_disponibles = habitaciones_disponibles - $1 WHERE id = $2 AND habitaciones_disponibles >= $1 RETURNING habitaciones_disponibles`,
          [roomsNeeded, bloqueo.id]
        );

        if (updateResult.rowCount === 0) {
          await client.query('ROLLBACK');
          return res.status(409).json({ message: "No hay suficientes habitaciones disponibles" });
        }

        const remainingRooms = updateResult.rows[0].habitaciones_disponibles;

        await client.query('COMMIT');

        // Calcular precios con el motor oficial (no hardcoded)
        const noches = Math.max(1, Math.ceil(
          (new Date(data.checkOut).getTime() - new Date(data.checkIn).getTime()) / 86400000
        ));
        const kuaniTierRaw = (bloqueo.tipo_habitacion as string || '').toUpperCase();
        const kuaniTier = (['PREMIUM PLUS', 'PREMIUM', 'LUXURY'].includes(kuaniTierRaw)
          ? kuaniTierRaw
          : kuaniTierRaw.includes('PREMIUM') ? 'PREMIUM' : 'ESTANDAR') as KuaniTier;
        const pricing = calcularPrecioBloqueo({
          precioHabitacion: totalPrice,
          adultos: data.adults,
          menores: data.children,
          juniors: data.juniors,
          infantes: data.infants,
          noches,
          kuaniTier,
        });

        // Crear reserva real con hold de 30 min
        const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
        const reservaResult = await (async () => {
          try {
            const { db } = await import("./db");
            const { reservas } = await import("@shared/schema");
            const [reserva] = await db.insert(reservas).values({
              brandId:                (req as any).brand?.id ?? null,
              hotel:                  data.hotel,
              tipoHabitacion:         data.roomType,
              checkIn:                data.checkIn.split('T')[0],
              checkOut:               data.checkOut.split('T')[0],
              habitacionesReservadas: roomsNeeded,
              bloqueoId:              String(bloqueo.id),
              guestName:              data.name,
              guestEmail:             data.email,
              guestPhone:             data.phone ?? null,
              adults:                 data.adults,
              children:               data.children,
              juniors:                data.juniors,
              infants:                data.infants,
              tarifaPublicaTotal:     String(pricing.tarifaPublicaTotal),
              precioVenta:            String(pricing.precioVenta),
              precioTarjeta:          String(pricing.precioTarjeta),
              depositPercent:         deposit.percent,
              depositAmount:          String(depositAmount),
              kuaniGenerados:         pricing.kuaniGenerados,
              status:                 "hold",
              expiresAt,
              reference:              lead.id.substring(0, 8).toUpperCase(),
              comments:               data.comments ?? null,
              ipAddress:              (req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || '').split(',')[0].trim(),
            }).returning();
            return reserva;
          } catch (err) {
            console.error('[Precompra] reserva insert failed (non-fatal):', err);
            return null;
          }
        })();

        const leadData = {
          name: data.name,
          email: data.email,
          phone: data.phone || null,
          destination: data.hotel,
          travelDates: `${data.checkIn.split('T')[0]} al ${data.checkOut.split('T')[0]}`,
          message: `COTIZACION PRECOMPRA: ${data.hotel} - ${data.roomType}\nAdultos: ${data.adults}, Menores: ${data.children}, Juniors: ${data.juniors}, Infantes: ${data.infants}\nHabitaciones: ${roomsNeeded}\nTotal: $${totalPrice.toLocaleString()} MXN\nAnticipo: $${depositAmount.toLocaleString()} MXN (${deposit.percent}%)\n${data.comments ? `Comentarios: ${data.comments}` : ''}`,
          source: "cotizador-precompra",
          status: "hot",
        };

        const lead = await storage.createLead(leadData);
        const ref = lead.id.substring(0, 8).toUpperCase();

        const { sendEmail } = await import("./email-service");

        const staffHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #10b981, #6366f1); padding: 20px; text-align: center;">
              <h2 style="color: white; margin: 0;">Nueva Cotizacion de Precompra</h2>
            </div>
            <div style="padding: 20px; background: #f9f9f9;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Cliente</td><td style="padding: 8px; border: 1px solid #ddd;">${data.name}</td></tr>
                <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Email</td><td style="padding: 8px; border: 1px solid #ddd;"><a href="mailto:${data.email}">${data.email}</a></td></tr>
                ${data.phone ? `<tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Telefono</td><td style="padding: 8px; border: 1px solid #ddd;"><a href="tel:${data.phone}">${data.phone}</a></td></tr>` : ''}
                <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Hotel</td><td style="padding: 8px; border: 1px solid #ddd;">${data.hotel}</td></tr>
                <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Habitacion</td><td style="padding: 8px; border: 1px solid #ddd;">${data.roomType}</td></tr>
                <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Fechas</td><td style="padding: 8px; border: 1px solid #ddd;">${data.checkIn.split('T')[0]} al ${data.checkOut.split('T')[0]}</td></tr>
                <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Viajeros</td><td style="padding: 8px; border: 1px solid #ddd;">${data.adults} adultos, ${data.children} menores, ${data.juniors} juniors, ${data.infants} infantes</td></tr>
                <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Habitaciones</td><td style="padding: 8px; border: 1px solid #ddd;">${roomsNeeded}</td></tr>
                <tr style="background: #e8f5e9;"><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Total</td><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; font-size: 18px;">$${totalPrice.toLocaleString()} MXN</td></tr>
                <tr style="background: #fff3e0;"><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Anticipo (${deposit.percent}%)</td><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; font-size: 18px;">$${depositAmount.toLocaleString()} MXN</td></tr>
                ${data.comments ? `<tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Comentarios</td><td style="padding: 8px; border: 1px solid #ddd;">${data.comments}</td></tr>` : ''}
              </table>
              <p style="margin-top: 15px; color: #f44336; font-weight: bold;">Inventario actualizado: quedan ${remainingRooms} habitaciones</p>
            </div>
          </div>
        `;

        // Enqueue staff notification — idempotency key prevents re-sending on retry
        await enqueueJob("send_email", {
          to: process.env.SMTP_USER || "contacto@chromatravel.online",
          subject: `COTIZACION PRECOMPRA: ${data.hotel} - ${data.name} - $${totalPrice.toLocaleString()} MXN`,
          html: staffHtml,
          replyTo: data.email,
        }, `email-precompra-staff-${lead.id}`);

        const customerHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #10b981, #ec4899); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">Tu Cotizacion de Viaje</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0;">Referencia: ${ref}</p>
            </div>
            <div style="padding: 30px; background: #f9f9f9;">
              <p>Hola <strong>${data.name}</strong>,</p>
              <p>Recibimos tu solicitud de cotizacion. Un asesor revisara la disponibilidad y te contactara pronto.</p>
              <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #10b981;">${data.hotel}</h3>
                <p><strong>Habitacion:</strong> ${data.roomType}</p>
                <p><strong>Fechas:</strong> ${data.checkIn.split('T')[0]} al ${data.checkOut.split('T')[0]}</p>
                <p><strong>Viajeros:</strong> ${data.adults} adultos${data.children > 0 ? `, ${data.children} menores` : ''}${data.juniors > 0 ? `, ${data.juniors} juniors` : ''}${data.infants > 0 ? `, ${data.infants} infantes` : ''}</p>
                <p style="font-size: 20px; font-weight: bold; color: #10b981;">Total estimado: $${totalPrice.toLocaleString()} MXN</p>
                <p><strong>Anticipo requerido (${deposit.percent}%):</strong> $${depositAmount.toLocaleString()} MXN</p>
              </div>
              <p style="color: #666; font-size: 13px;">Esta cotizacion es informativa. Los precios estan sujetos a disponibilidad al momento de confirmar.</p>
              <p style="margin-top: 30px;"><strong>Chroma Travel</strong><br><a href="mailto:contacto@chromatravel.online">contacto@chromatravel.online</a></p>
            </div>
          </div>
        `;

        // Enqueue customer confirmation — idempotency key prevents duplicate email
        await enqueueJob("send_email", {
          to: data.email,
          subject: `Tu cotizacion: ${data.hotel} - Ref. ${ref}`,
          html: customerHtml,
        }, `email-precompra-customer-${lead.id}`);

        const { auditService } = await import("./services/audit.service");
        await auditService.log('create_precompra', 'lead', lead.id, null, {
          hotel: data.hotel,
          roomType: data.roomType,
          adults: data.adults,
          children: data.children,
          juniors: data.juniors,
          infants: data.infants,
          totalPrice,
          depositAmount,
          depositPercent: deposit.percent,
          roomsNeeded,
        }, {});

        console.log(`[Precompra] ${data.name} | ${data.hotel} | $${totalPrice} MXN | Rooms: ${roomsNeeded} | Remaining: ${remainingRooms}`);

        // WhatsApp admin + cliente (non-blocking)
        try {
          const { notificarReserva } = await import('./services/notification.service');
          const checkInDate = data.checkIn.split('T')[0];
          const daysToCI = Math.ceil((new Date(checkInDate).getTime() - Date.now()) / 86400000);
          await notificarReserva({
            nombre: data.name,
            email: data.email,
            telefono: data.phone || null,
            hotel: data.hotel,
            checkIn: checkInDate,
            checkOut: data.checkOut.split('T')[0],
            noches: Math.ceil((new Date(data.checkOut).getTime() - new Date(data.checkIn).getTime()) / 86400000),
            adultos: data.adults,
            menores: data.children,
            juniors: data.juniors,
            infantes: data.infants,
            distribucion: `${roomsNeeded} hab.`,
            totalEfectivo: `$${pricing.precioVenta.toLocaleString()} MXN`,
            totalTarjeta: `$${pricing.precioTarjeta.toLocaleString()} MXN`,
            anticipo: `$${depositAmount.toLocaleString()} MXN (${deposit.percent}%)`,
            kuaniGenerados: pricing.kuaniGenerados,
            leadId: 0,
            diasAlCheckIn: daysToCI,
          });
        } catch (waErr) {
          console.error('[notificarReserva] non-fatal:', waErr);
        }

        res.status(201).json({
          success: true,
          leadId: lead.id,
          reservaId: reservaResult?.id ?? null,
          reference: ref,
          expiresAt: expiresAt.toISOString(),
          pricing: {
            precioVenta:    pricing.precioVenta,
            precioTarjeta:  pricing.precioTarjeta,
            depositPercent: deposit.percent,
            depositAmount,
            kuaniGenerados: pricing.kuaniGenerados,
          },
          message: "Cotizacion enviada exitosamente",
        });
      } catch (txError) {
        await client.query('ROLLBACK');
        throw txError;
      } finally {
        client.release();
      }
    } catch (error: any) {
      console.error("[Precompra] Error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Datos invalidos", errors: error.errors });
      }
      res.status(500).json({ message: "Error procesando la cotizacion" });
    }
  });

  // ============================================
  // DESTINATIONS API
  // ============================================
  
  app.get("/api/destinations", async (req, res) => {
    try {
      const featured = req.query.featured === "true";
      const destinations = featured 
        ? await storage.getFeaturedDestinations()
        : await storage.getDestinations();
      res.json(destinations);
    } catch (error) {
      console.error("Error fetching destinations:", error);
      res.status(500).json({ message: "Error fetching destinations" });
    }
  });

  app.get("/api/destinations/:slug", async (req, res) => {
    try {
      const destination = await storage.getDestinationBySlug(req.params.slug);
      if (!destination) {
        return res.status(404).json({ message: "Destination not found" });
      }
      res.json(destination);
    } catch (error) {
      console.error("Error fetching destination:", error);
      res.status(500).json({ message: "Error fetching destination" });
    }
  });

  app.post("/api/destinations", async (req, res) => {
    try {
      const baseSlug = req.body.name?.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "") || "destination";
      let slug = baseSlug;
      let counter = 1;
      while (await storage.getDestinationBySlug(slug)) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
      
      const destinationData = insertDestinationSchema.parse({
        ...req.body,
        slug,
        brandId: req.body.brandId || req.brand?.id || null,
      });
      const destination = await storage.createDestination(destinationData);
      res.status(201).json(destination);
    } catch (error) {
      console.error("Error creating destination:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid destination data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating destination" });
    }
  });

  app.patch("/api/destinations/:id", async (req, res) => {
    try {
      const updateData = { ...req.body };
      if (updateData.name && !updateData.slug) {
        updateData.slug = updateData.name.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "");
      }
      const destination = await storage.updateDestination(req.params.id, updateData);
      if (!destination) {
        return res.status(404).json({ message: "Destination not found" });
      }
      res.json(destination);
    } catch (error) {
      console.error("Error updating destination:", error);
      res.status(500).json({ message: "Error updating destination" });
    }
  });

  // ============================================
  // BOOKINGS API
  // ============================================
  
  app.post("/api/bookings", async (req, res) => {
    try {
      const bookingData = insertBookingSchema.parse(req.body);

      // Validar precio contra la tarifa real en la DB — previene manipulación frontend
      if (bookingData.rateId) {
        const rate = await storage.getRate(bookingData.rateId);
        if (rate) {
          const checkIn  = new Date(bookingData.checkIn);
          const checkOut = new Date(bookingData.checkOut);
          const nights   = Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / 86400000));
          const expected = Math.round(Number(rate.price) * nights * 100) / 100;
          const submitted = Math.round(Number(bookingData.totalPrice) * 100) / 100;
          if (Math.abs(submitted - expected) > 1) {
            return res.status(400).json({ message: "Price mismatch — recalculate from current rate" });
          }
        }
      }

      const confirmationCode = `CHR-${Array.from({ length: 6 }, () =>
        'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]
      ).join('')}`;

      const booking = await storage.createBooking({ ...bookingData, confirmationCode } as any);
      res.status(201).json(booking);
    } catch (error) {
      console.error("Error creating booking:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid booking data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating booking" });
    }
  });

  app.get("/api/bookings/:id", async (req, res) => {
    try {
      const booking = await storage.getBooking(req.params.id);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      res.json(booking);
    } catch (error) {
      console.error("Error fetching booking:", error);
      res.status(500).json({ message: "Error fetching booking" });
    }
  });

  app.get("/api/bookings/confirmation/:code", async (req, res) => {
    try {
      const booking = await storage.getBookingByConfirmation(req.params.code);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      res.json(booking);
    } catch (error) {
      console.error("Error fetching booking:", error);
      res.status(500).json({ message: "Error fetching booking" });
    }
  });

  app.patch("/api/bookings/:id", async (req, res) => {
    try {
      const booking = await storage.updateBooking(req.params.id, req.body);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      res.json(booking);
    } catch (error) {
      console.error("Error updating booking:", error);
      res.status(500).json({ message: "Error updating booking" });
    }
  });

  // ============================================
  // RESERVAS API — hold/release state machine
  // ============================================

  app.get("/api/reservas/:id", async (req, res) => {
    try {
      const { db } = await import("./db");
      const { reservas } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      const [reserva] = await db.select().from(reservas).where(eq(reservas.id, req.params.id)).limit(1);
      if (!reserva) return res.status(404).json({ message: "Reserva no encontrada" });
      const now = new Date();
      if (reserva.status === "hold" && reserva.expiresAt && new Date(reserva.expiresAt) < now) {
        return res.json({ ...reserva, status: "expired", timeLeft: 0 });
      }
      const timeLeft = reserva.expiresAt
        ? Math.max(0, Math.round((new Date(reserva.expiresAt).getTime() - now.getTime()) / 1000))
        : null;
      res.json({ ...reserva, timeLeft });
    } catch (err) {
      res.status(500).json({ message: "Error consultando reserva" });
    }
  });

  app.post("/api/reservas/:id/cancel", async (req, res) => {
    try {
      const { db } = await import("./db");
      const { reservas } = await import("@shared/schema");
      const { eq, and, inArray } = await import("drizzle-orm");
      const { getPool } = await import("./db");
      const pool = getPool();

      const [reserva] = await db.select().from(reservas).where(eq(reservas.id, req.params.id)).limit(1);
      if (!reserva) return res.status(404).json({ message: "Reserva no encontrada" });
      if (!["hold", "pending_payment"].includes(reserva.status)) {
        return res.status(400).json({ message: `No se puede cancelar: estado actual es '${reserva.status}'` });
      }

      // Restaurar inventario y marcar como cancelada atómicamente
      if (pool) {
        const client = await pool.connect();
        try {
          await client.query("BEGIN");
          await client.query(
            `UPDATE bloqueos SET habitaciones_disponibles = habitaciones_disponibles + $1
             WHERE hotel = $2 AND tipo_habitacion = $3 AND fecha_inicio = $4 AND fecha_fin = $5`,
            [reserva.habitacionesReservadas, reserva.hotel, reserva.tipoHabitacion, reserva.checkIn, reserva.checkOut]
          );
          await db.update(reservas)
            .set({ status: "cancelled", cancelledAt: new Date(), updatedAt: new Date() })
            .where(eq(reservas.id, reserva.id));
          await client.query("COMMIT");
        } catch (err) {
          await client.query("ROLLBACK");
          throw err;
        } finally {
          client.release();
        }
      }
      res.json({ success: true, message: "Reserva cancelada e inventario restaurado" });
    } catch (err) {
      console.error("[reservas/cancel]", err);
      res.status(500).json({ message: "Error cancelando reserva" });
    }
  });

  app.post("/api/reservas/:id/confirm", async (req, res) => {
    try {
      const { paymentMethod, paymentIntentId } = req.body;
      if (!paymentMethod) return res.status(400).json({ message: "paymentMethod requerido" });

      const { db } = await import("./db");
      const { reservas } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");

      const [reserva] = await db.select().from(reservas).where(eq(reservas.id, req.params.id)).limit(1);
      if (!reserva) return res.status(404).json({ message: "Reserva no encontrada" });
      if (reserva.status === "expired" || (reserva.expiresAt && new Date(reserva.expiresAt) < new Date())) {
        return res.status(410).json({ message: "La reserva expiró. Inicia una nueva cotización." });
      }
      if (reserva.status === "confirmed") return res.json({ success: true, reserva });
      if (reserva.status !== "hold" && reserva.status !== "pending_payment") {
        return res.status(400).json({ message: `No se puede confirmar: estado '${reserva.status}'` });
      }

      const confirmationCode = `RES-${Array.from({ length: 8 }, () =>
        'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]
      ).join('')}`;

      const [updated] = await db.update(reservas).set({
        status: "confirmed",
        paymentMethod,
        paymentIntentId: paymentIntentId ?? null,
        confirmationCode,
        confirmedAt: new Date(),
        updatedAt: new Date(),
      }).where(eq(reservas.id, reserva.id)).returning();

      res.json({ success: true, confirmationCode, reserva: updated });
    } catch (err) {
      console.error("[reservas/confirm]", err);
      res.status(500).json({ message: "Error confirmando reserva" });
    }
  });

  // ============================================
  // LEADS API
  // ============================================

  app.post("/api/leads", async (req, res) => {
    try {
      const rawData = req.body;
      if (rawData.name) rawData.name = sanitizeInput(rawData.name);
      if (rawData.message) rawData.message = sanitizeInput(rawData.message);
      if (rawData.destination) rawData.destination = sanitizeInput(rawData.destination);
      if (rawData.phone) rawData.phone = sanitizeInput(rawData.phone);
      
      const leadData = insertLeadSchema.parse(rawData);
      
      const score = scoreLeadData(leadData);
      const scoredData = { ...leadData, status: score.category === 'HOT' ? 'hot' : 'new' };
      
      const lead = await storage.createLead(scoredData);
      
      // Build HTML inline (same content as sendLeadNotification) so it's serialisable into the queue
      const leadNotifHtml = `
        <h2>Nuevo Lead Recibido</h2>
        <table style="border-collapse:collapse;width:100%;max-width:600px;">
          <tr><td style="padding:10px;border:1px solid #ddd;font-weight:bold;">Nombre:</td><td style="padding:10px;border:1px solid #ddd;">${lead.name}</td></tr>
          <tr><td style="padding:10px;border:1px solid #ddd;font-weight:bold;">Email:</td><td style="padding:10px;border:1px solid #ddd;"><a href="mailto:${lead.email}">${lead.email}</a></td></tr>
          ${lead.phone ? `<tr><td style="padding:10px;border:1px solid #ddd;font-weight:bold;">Teléfono:</td><td style="padding:10px;border:1px solid #ddd;">${lead.phone}</td></tr>` : ''}
          ${lead.destination ? `<tr><td style="padding:10px;border:1px solid #ddd;font-weight:bold;">Destino:</td><td style="padding:10px;border:1px solid #ddd;">${lead.destination}</td></tr>` : ''}
          ${lead.source ? `<tr><td style="padding:10px;border:1px solid #ddd;font-weight:bold;">Fuente:</td><td style="padding:10px;border:1px solid #ddd;">${lead.source}</td></tr>` : ''}
          ${lead.message ? `<tr><td style="padding:10px;border:1px solid #ddd;font-weight:bold;">Mensaje:</td><td style="padding:10px;border:1px solid #ddd;">${lead.message}</td></tr>` : ''}
        </table>
      `;
      await enqueueJob("send_email", {
        to: process.env.SMTP_USER || "contacto@chromatravel.online",
        subject: `Nuevo Lead: ${lead.name} - ${lead.destination || 'Consulta General'}`,
        html: leadNotifHtml,
        replyTo: lead.email,
      }, `email-lead-staff-${lead.id}`);

      // WhatsApp admin (non-blocking, best-effort — not queued, tolerates failure)
      import('./services/notification.service').then(({ notificarLead }) =>
        notificarLead({
          nombre: lead.name,
          email: lead.email,
          telefono: lead.phone || undefined,
          mensaje: lead.message || lead.destination || 'Sin mensaje',
          fuente: lead.source || 'web',
        })
      ).catch(() => {});
      
      const { auditService } = await import("./services/audit.service");
      await auditService.log('create_lead', 'lead', lead.id, null, {
        name: lead.name,
        email: lead.email,
        destination: lead.destination,
        score: score.points,
        category: score.category,
        source: lead.source,
      }, {});
      
      console.log(`[Lead] New lead: ${lead.name} | Score: ${score.points} (${score.category}) | Dest: ${lead.destination || 'N/A'}`);
      
      res.status(201).json({ ...lead, score: score.points, category: score.category });
    } catch (error) {
      console.error("Error creating lead:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid lead data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating lead" });
    }
  });

  // ============================================
  // BLOG API (Markdown-based + DB fallback)
  // ============================================
  
  app.get("/api/blog", async (req, res) => {
    const { getMarkdownPosts } = await import("./markdown-blog");
    const { getStaticBlogPosts } = await import("./static-blog");
    const brandCode = req.brand?.code || 'chroma';
    
    try {
      // Combine ALL sources: markdown + database + static JSON
      const allPosts: any[] = [];
      const seenSlugs = new Set<string>();
      
      // 1. Markdown posts from /posts folder (highest priority)
      const mdPosts = getMarkdownPosts(brandCode) || [];
      for (const post of mdPosts) {
        if (!seenSlugs.has(post.slug)) {
          seenSlugs.add(post.slug);
          allPosts.push(post);
        }
      }
      
      // 2. Database posts
      const published = req.query.published !== "false";
      const dbPosts = await storage.getBlogPosts(published);
      for (const post of dbPosts) {
        if (!seenSlugs.has(post.slug)) {
          seenSlugs.add(post.slug);
          allPosts.push(post);
        }
      }
      
      // 3. Static JSON posts (lowest priority)
      const staticPosts = getStaticBlogPosts(brandCode) || [];
      for (const post of staticPosts) {
        if (!seenSlugs.has(post.slug)) {
          seenSlugs.add(post.slug);
          allPosts.push(post);
        }
      }
      
      res.json(allPosts);
    } catch (error) {
      console.error("Error fetching blog posts:", error);
      const staticPosts = getStaticBlogPosts(brandCode);
      res.json(staticPosts);
    }
  });

  app.get("/api/blog/:slug", async (req, res) => {
    const { getMarkdownPostBySlug } = await import("./markdown-blog");
    const { getStaticBlogPostBySlug } = await import("./static-blog");
    
    try {
      // First try markdown post
      const mdPost = getMarkdownPostBySlug(req.params.slug);
      if (mdPost) {
        return res.json(mdPost);
      }
      
      // Then try database
      const post = await storage.getBlogPostBySlug(req.params.slug);
      if (post) {
        return res.json(post);
      }
      
      // Finally fallback to static
      const staticPost = getStaticBlogPostBySlug(req.params.slug);
      if (staticPost) {
        return res.json(staticPost);
      }
      
      return res.status(404).json({ message: "Blog post not found" });
    } catch (error) {
      console.error("Error fetching blog post:", error);
      const staticPost = getStaticBlogPostBySlug(req.params.slug);
      if (staticPost) {
        return res.json(staticPost);
      }
      res.status(404).json({ message: "Blog post not found" });
    }
  });

  // ============================================
  // AUTH API
  // ============================================
  
  app.get("/api/auth/me", async (req, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        req.session.destroy(() => {});
        return res.status(401).json({ message: "User not found" });
      }
      
      // Verify session brand matches current request brand for security
      const currentBrandId = req.brand?.id;
      if (req.session.brandId && currentBrandId && req.session.brandId !== currentBrandId) {
        req.session.destroy(() => {});
        return res.status(401).json({ message: "Session invalid for this brand" });
      }
      
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Error fetching user" });
    }
  });
  
  app.post("/api/auth/register", async (req, res) => {
    try {
      const rawBody = { ...req.body };
      if (rawBody.name) rawBody.name = sanitizeInput(rawBody.name);
      if (rawBody.firstName) rawBody.firstName = sanitizeInput(rawBody.firstName);
      if (rawBody.lastName) rawBody.lastName = sanitizeInput(rawBody.lastName);
      const userData = insertUserSchema.parse(rawBody);
      
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }
      
      const hashedPassword = await hash(userData.password, 10);
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
        brandId: req.brand?.id,
      });
      
      // Set session
      req.session.userId = user.id;
      req.session.userRole = user.role;
      req.session.userEmail = user.email;
      req.session.brandId = user.brandId || undefined;
      
      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error("Error registering user:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      res.status(500).json({ message: "Error registering user" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const credentials = loginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(credentials.email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Verify user belongs to current brand (or is admin with null brandId)
      const currentBrandId = req.brand?.id;
      if (user.brandId && currentBrandId && user.brandId !== currentBrandId) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      const isValidPassword = await compare(credentials.password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Set session with brand context
      req.session.userId = user.id;
      req.session.userRole = user.role;
      req.session.userEmail = user.email;
      req.session.brandId = user.brandId || currentBrandId;
      
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error logging in:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid login data", errors: error.errors });
      }
      res.status(500).json({ message: "Error logging in" });
    }
  });
  
  app.post("/api/auth/logout", async (req, res) => {
    try {
      req.session.destroy((err) => {
        if (err) {
          return res.status(500).json({ message: "Error logging out" });
        }
        res.clearCookie("connect.sid");
        res.json({ message: "Logged out successfully" });
      });
    } catch (error) {
      console.error("Error logging out:", error);
      res.status(500).json({ message: "Error logging out" });
    }
  });

  // ============================================
  // AUTH MIDDLEWARE (defined early so all admin routes can use them)
  // ============================================

  const requireAdminRole = (req: any, res: any, next: any) => {
    if (!req.session?.userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    const userRole = req.session?.userRole;
    if (!userRole || !["admin", "agent"].includes(userRole)) {
      return res.status(403).json({ error: "Admin or agent role required" });
    }
    next();
  };

  const requireAgentOrAdmin = (req: any, res: any, next: any) => {
    if (!req.session?.userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    const userRole = req.session?.userRole;
    if (!userRole || !["admin", "agent", "marketing"].includes(userRole)) {
      return res.status(403).json({ error: "Agent, admin or marketing role required" });
    }
    next();
  };

  function sanitizeInput(str: string | null | undefined): string {
    if (!str) return str as any;
    return str
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  // ============================================
  // ADMIN API
  // ============================================
  
  let emailStatusCache: { data: any; timestamp: number } | null = null;
  const EMAIL_STATUS_CACHE_TTL = 60000;

  app.get("/api/admin/email/status", requireAdminRole, async (req, res) => {
    try {
      const now = Date.now();
      if (emailStatusCache && (now - emailStatusCache.timestamp) < EMAIL_STATUS_CACHE_TTL) {
        return res.json(emailStatusCache.data);
      }

      const isConnected = await verifyEmailConnection();
      const data = { 
        connected: isConnected,
        configured: !!(process.env.SMTP_USER && process.env.SMTP_PASSWORD),
        smtpHost: process.env.SMTP_HOST || "Not configured",
        smtpUser: process.env.SMTP_USER || "Not configured",
      };
      emailStatusCache = { data, timestamp: now };
      res.json(data);
    } catch (error) {
      res.json({ connected: false, error: String(error) });
    }
  });
  
  app.post("/api/admin/email/test", requireAdminRole, async (req, res) => {
    try {
      const { to, subject, message } = req.body;
      if (!to || !subject) {
        return res.status(400).json({ message: "Destinatario y asunto son requeridos" });
      }
      
      const success = await sendEmail({
        to,
        subject,
        html: `<div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Correo de Prueba - Chroma Travel</h2>
          <p>${message || "Este es un correo de prueba del sistema."}</p>
          <hr style="margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">Este correo fue enviado desde el panel de administración de Chroma Travel.</p>
        </div>`,
        text: message || "Este es un correo de prueba del sistema.",
      });
      
      if (success) {
        res.json({ success: true, message: "Correo enviado exitosamente" });
      } else {
        res.status(500).json({ success: false, message: "Error al enviar el correo" });
      }
    } catch (error) {
      console.error("Error sending test email:", error);
      res.status(500).json({ success: false, message: String(error) });
    }
  });
  
  app.get("/api/admin/stats", requireAgentOrAdmin, async (req, res) => {
    try {
      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Error fetching admin stats" });
    }
  });

  // Multi-brand stats for unified dashboard
  app.get("/api/admin/stats/multi-brand", requireAgentOrAdmin, async (req, res) => {
    try {
      const stats = await storage.getMultiBrandStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching multi-brand stats:", error);
      res.status(500).json({ message: "Error fetching multi-brand stats" });
    }
  });

  app.get("/api/admin/bookings", requireAgentOrAdmin, async (req, res) => {
    try {
      const bookings = await storage.getBookings();
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      res.status(500).json({ message: "Error fetching bookings" });
    }
  });

  // ── ERP DASHBOARD — métricas reales de inventario y revenue ─────────────────
  app.get("/api/admin/erp/dashboard", requireAgentOrAdmin, async (req, res) => {
    try {
      const { getPool } = await import("./db");
      const { db: ormDb } = await import("./db");
      const { reservas: reservasTable } = await import("@shared/schema");
      const { count, sum, sql: sqlExpr, eq, and, gte, lt, inArray } = await import("drizzle-orm");
      const pool = getPool();
      if (!pool) return res.status(503).json({ error: "DB not available" });

      const now = new Date();
      const todayStr = now.toISOString().split("T")[0];
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];

      // Inventario: totales de bloqueos activos
      const inventoryResult = await pool.query(`
        SELECT
          COUNT(*)                                       AS total_bloqueos,
          SUM(habitaciones_disponibles)                  AS habitaciones_disponibles,
          SUM(COALESCE(habitaciones_totales, 0))         AS habitaciones_totales,
          COUNT(*) FILTER (WHERE habitaciones_disponibles = 0) AS bloqueos_agotados,
          COUNT(*) FILTER (WHERE fecha_inicio = $1)      AS check_ins_hoy
        FROM bloqueos
        WHERE estado = 'Activo' AND fecha_inicio >= $1
      `, [todayStr]);

      // Hoteles con más disponibilidad
      const topHotelsResult = await pool.query(`
        SELECT hotel,
               SUM(habitaciones_disponibles) AS disponibles,
               MIN(tarifa_doble)::numeric     AS precio_desde,
               COUNT(*)                       AS bloqueos_activos
        FROM bloqueos
        WHERE estado = 'Activo' AND fecha_inicio >= $1
        GROUP BY hotel
        ORDER BY disponibles DESC
        LIMIT 10
      `, [todayStr]);

      // Reservas por estado
      const reservaStats = await ormDb
        .select({ status: reservasTable.status, total: count() })
        .from(reservasTable)
        .groupBy(reservasTable.status);

      // Revenue de reservas confirmadas este mes
      const revenueResult = await ormDb
        .select({
          totalVenta:   sqlExpr<number>`COALESCE(SUM(precio_venta::numeric), 0)`,
          totalTarjeta: sqlExpr<number>`COALESCE(SUM(precio_tarjeta::numeric), 0)`,
          totalDeposit: sqlExpr<number>`COALESCE(SUM(deposit_amount::numeric), 0)`,
          count:        count(),
        })
        .from(reservasTable)
        .where(
          and(
            eq(reservasTable.status, "confirmed"),
            gte(reservasTable.createdAt, new Date(monthStart))
          )
        );

      // Holds activos en riesgo de expirar en los próximos 10 min
      const expiringSoon = await ormDb
        .select({ id: reservasTable.id, hotel: reservasTable.hotel, expiresAt: reservasTable.expiresAt })
        .from(reservasTable)
        .where(
          and(
            eq(reservasTable.status, "hold"),
            lt(reservasTable.expiresAt, new Date(now.getTime() + 10 * 60 * 1000))
          )
        );

      // Leads del mes
      const leadsResult = await pool.query(`
        SELECT COUNT(*) AS total,
               COUNT(*) FILTER (WHERE status = 'hot')  AS hot,
               COUNT(*) FILTER (WHERE status = 'warm') AS warm
        FROM leads
        WHERE created_at >= $1
      `, [monthStart]);

      const inv = inventoryResult.rows[0];
      const rev = revenueResult[0];
      const reservasByStatus = Object.fromEntries(reservaStats.map(r => [r.status, r.total]));
      const leads = leadsResult.rows[0];

      res.json({
        timestamp: now.toISOString(),
        inventario: {
          bloqueos_activos:    Number(inv.total_bloqueos),
          habitaciones_disp:   Number(inv.habitaciones_disponibles),
          habitaciones_total:  Number(inv.habitaciones_totales),
          bloqueos_agotados:   Number(inv.bloqueos_agotados),
          check_ins_hoy:       Number(inv.check_ins_hoy),
          ocupacion_pct: inv.habitaciones_totales > 0
            ? Math.round((1 - inv.habitaciones_disponibles / inv.habitaciones_totales) * 100)
            : null,
        },
        top_hoteles: topHotelsResult.rows.map(r => ({
          hotel:          r.hotel,
          disponibles:    Number(r.disponibles),
          precio_desde:   Number(r.precio_desde),
          bloqueos:       Number(r.bloqueos_activos),
        })),
        reservas: {
          por_estado:    reservasByStatus,
          holds_activos: reservasByStatus["hold"] ?? 0,
          confirmadas:   reservasByStatus["confirmed"] ?? 0,
          expiradas:     reservasByStatus["expired"] ?? 0,
          expirando_pronto: expiringSoon.length,
        },
        revenue_mes: {
          total_venta:   Number(rev?.totalVenta   ?? 0),
          total_tarjeta: Number(rev?.totalTarjeta ?? 0),
          total_deposit: Number(rev?.totalDeposit ?? 0),
          reservas_conf: Number(rev?.count        ?? 0),
        },
        leads_mes: {
          total: Number(leads.total),
          hot:   Number(leads.hot),
          warm:  Number(leads.warm),
        },
      });
    } catch (err) {
      console.error("[ERP dashboard]", err);
      res.status(500).json({ message: "Error generando dashboard ERP" });
    }
  });

  app.get("/api/admin/leads", requireAgentOrAdmin, async (req, res) => {
    try {
      const leads = await storage.getLeads();
      res.json(leads);
    } catch (error) {
      console.error("Error fetching leads:", error);
      res.status(500).json({ message: "Error fetching leads" });
    }
  });

  app.patch("/api/admin/leads/:id", requireAgentOrAdmin, async (req, res) => {
    try {
      const body = { ...req.body };
      if (body.name) body.name = sanitizeInput(body.name);
      if (body.message) body.message = sanitizeInput(body.message);
      if (body.destination) body.destination = sanitizeInput(body.destination);
      const lead = await storage.updateLead(req.params.id, body);
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      res.json(lead);
    } catch (error) {
      console.error("Error updating lead:", error);
      res.status(500).json({ message: "Error updating lead" });
    }
  });

  // ============================================
  // ADMIN BLOG API
  // ============================================
  
  app.get("/api/admin/blog", requireAgentOrAdmin, async (req, res) => {
    const { getMarkdownPosts } = await import("./markdown-blog");
    const brandId = req.query.brandId as string | undefined;
    
    try {
      // Get database posts (primary source for admin)
      const dbPosts = await storage.getBlogPosts(false);
      
      // Get all brands to map brandCode to brandId
      const brands = await getAllBrands();
      const brandCodeToId: Record<string, string> = {};
      brands.forEach((b: any) => {
        brandCodeToId[b.code] = b.id;
      });
      
      // Get markdown posts and normalize to BlogPost-like structure (no filter to get all)
      const mdPosts = getMarkdownPosts() || [];
      const normalizedMdPosts = mdPosts.map((p: any, index: number) => ({
        id: `md-${p.slug || index}`,
        brandId: brandCodeToId[p.brandCode] || null,
        brandCode: p.brandCode,
        title: p.title,
        slug: p.slug,
        excerpt: p.excerpt || p.seoDescription,
        content: p.content || '',
        image: p.image,
        authorId: null,
        category: p.category || 'destinos',
        tags: p.seoKeywords || [],
        published: true, // Markdown posts are considered published
        publishedAt: p.publishedAt ? new Date(p.publishedAt) : new Date(),
        createdAt: p.publishedAt ? new Date(p.publishedAt) : new Date(),
        seoTitle: p.seoTitle,
        seoDescription: p.seoDescription,
        seoKeywords: p.seoKeywords,
        isMarkdown: true, // Flag to identify markdown posts
      }));
      
      // Combine both sources (DB posts first as they're editable)
      const allPosts = [...(dbPosts || []), ...normalizedMdPosts];
      
      // Filter by brand if specified
      const filteredPosts = brandId && brandId !== 'all' 
        ? allPosts.filter((p: any) => p.brandId === brandId)
        : allPosts;
      
      res.json(filteredPosts);
    } catch (error) {
      console.error("Error fetching admin blog posts:", error);
      res.status(500).json({ message: "Error fetching blog posts" });
    }
  });

  app.get("/api/admin/blog/stats", requireAgentOrAdmin, async (req, res) => {
    const { getMarkdownPosts } = await import("./markdown-blog");
    const brandId = req.query.brandId as string | undefined;
    
    try {
      // Get database posts
      const dbPosts = await storage.getBlogPosts(false);
      
      // Get all brands to map brandCode to brandId
      const brands = await getAllBrands();
      const brandCodeToId: Record<string, string> = {};
      brands.forEach((b: any) => {
        brandCodeToId[b.code] = b.id;
      });
      
      // Get markdown posts (no filter to get all)
      const mdPosts = getMarkdownPosts() || [];
      
      // Combine and filter
      const allPosts = [
        ...dbPosts.map((p: any) => ({ ...p, isMarkdown: false })),
        ...mdPosts.map((p: any) => ({ 
          ...p, 
          brandId: brandCodeToId[p.brandCode] || null,
          published: true, 
          isMarkdown: true 
        })),
      ];
      
      const filteredPosts = brandId && brandId !== 'all'
        ? allPosts.filter((p: any) => p.brandId === brandId)
        : allPosts;
      
      const stats = {
        total: filteredPosts.length,
        published: filteredPosts.filter((p: any) => p.published).length,
        drafts: filteredPosts.filter((p: any) => !p.published && !p.isMarkdown).length,
        scheduled: 0,
      };
      res.json(stats);
    } catch (error) {
      console.error("Error fetching blog stats:", error);
      res.status(500).json({ message: "Error fetching blog stats" });
    }
  });

  // Upload markdown file and parse frontmatter
  app.post("/api/admin/blog/upload-markdown", requireAdminRole, async (req, res) => {
    const matter = await import("gray-matter");
    const { marked } = await import("marked");
    
    try {
      let { content: rawContent, filename } = req.body;
      
      if (!rawContent) {
        return res.status(400).json({ message: "Markdown content is required" });
      }
      
      // Clean content: remove BOM, normalize line endings, trim
      rawContent = rawContent
        .replace(/^\uFEFF/, '') // Remove BOM
        .replace(/\r\n/g, '\n') // Normalize line endings
        .replace(/\r/g, '\n')
        .trim();
      
      // Fix frontmatter indentation: remove leading whitespace from all lines until after the closing ---
      const lines = rawContent.split('\n');
      let inFrontmatter = false;
      let frontmatterClosed = false;
      const cleanedLines = lines.map((line: string, index: number) => {
        const trimmedLine = line.trimStart();
        
        if (index === 0 && trimmedLine === '---') {
          inFrontmatter = true;
          return '---';
        }
        
        if (inFrontmatter && !frontmatterClosed) {
          if (trimmedLine === '---') {
            frontmatterClosed = true;
            return '---';
          }
          return trimmedLine;
        }
        
        return line;
      });
      rawContent = cleanedLines.join('\n');
      
      // Parse frontmatter
      const { data: frontmatter, content } = matter.default(rawContent);
      
      // Generate slug from filename or frontmatter
      const slug = frontmatter.slug || (filename ? filename.replace('.md', '') : `post-${Date.now()}`);
      
      // Validate required frontmatter fields
      if (!frontmatter.title) {
        return res.status(400).json({ 
          message: "El archivo markdown debe tener un título en el frontmatter",
          parsed: { frontmatter, hasContent: content.length > 0 }
        });
      }
      
      // Check if slug already exists in database
      const existingPost = await storage.getBlogPostBySlug(slug);
      if (existingPost) {
        return res.status(400).json({ 
          message: `Ya existe un artículo con el slug "${slug}". Cambia el slug en el frontmatter.` 
        });
      }
      
      // Convert markdown to HTML
      const htmlContent = await marked(content);
      
      // Generate excerpt from content if not provided
      const excerpt = frontmatter.description || frontmatter.excerpt || 
        content.replace(/[#*`\[\]]/g, '').substring(0, 200).trim() + '...';
      
      // Determine brand ID from brand code - use actual UUIDs from database
      const brandCode = frontmatter.brand || 'chroma';
      // Map brand codes to actual database UUIDs
      const brandIdMap: Record<string, string> = {
        'chroma': '27b1012c-bb90-4461-b8e6-e77ec003843c',
        'fenix': '6014f591-6633-469b-a728-427ea6f6e0ad'
      };
      const brandId = brandIdMap[brandCode] || brandIdMap['chroma'];
      
      // Save to database
      const newPost = await storage.createBlogPost({
        brandId,
        title: frontmatter.title,
        slug,
        excerpt,
        content: htmlContent,
        image: frontmatter.image || frontmatter.ogImage || null,
        category: frontmatter.category || 'General',
        tags: frontmatter.tags || frontmatter.keywords || [],
        published: true,
        publishedAt: frontmatter.date ? new Date(frontmatter.date) : new Date(),
        seoTitle: frontmatter.seoTitle || frontmatter.title,
        seoDescription: frontmatter.seoDescription || frontmatter.description || excerpt,
        seoKeywords: frontmatter.keywords || frontmatter.seoKeywords || [],
        featuredImageAlt: frontmatter.imageAlt || frontmatter.title,
        socialExcerpt: frontmatter.socialExcerpt || excerpt,
        hashtags: frontmatter.hashtags || [],
      });
      
      // Return parsed data
      res.status(201).json({
        message: "Artículo guardado exitosamente en la base de datos",
        post: {
          id: newPost.id,
          slug: newPost.slug,
          title: newPost.title,
          excerpt: newPost.excerpt,
          image: newPost.image,
          category: newPost.category,
          author: frontmatter.author || 'Chroma Travel',
          brandCode,
          seoTitle: newPost.seoTitle,
          seoDescription: newPost.seoDescription,
          seoKeywords: newPost.seoKeywords,
          published: newPost.published,
          savedToDatabase: true,
        }
      });
    } catch (error) {
      console.error("Error uploading markdown:", error);
      res.status(500).json({ message: "Error al procesar el archivo markdown" });
    }
  });

  // Parse markdown content without saving (preview)
  app.post("/api/admin/blog/parse-markdown", requireAgentOrAdmin, async (req, res) => {
    const matter = await import("gray-matter");
    
    try {
      let { content: rawContent } = req.body;
      
      if (!rawContent) {
        return res.status(400).json({ message: "Markdown content is required" });
      }
      
      // Clean content: remove BOM, normalize line endings, trim
      rawContent = rawContent
        .replace(/^\uFEFF/, '') // Remove BOM
        .replace(/\r\n/g, '\n') // Normalize line endings
        .replace(/\r/g, '\n')
        .trim();
      
      // Fix frontmatter indentation: remove leading whitespace from all lines until after the closing ---
      const lines = rawContent.split('\n');
      let inFrontmatter = false;
      let frontmatterClosed = false;
      const cleanedLines = lines.map((line: string, index: number) => {
        const trimmedLine = line.trimStart();
        
        // Detect frontmatter start
        if (index === 0 && trimmedLine === '---') {
          inFrontmatter = true;
          return '---';
        }
        
        // Inside frontmatter, clean all lines
        if (inFrontmatter && !frontmatterClosed) {
          if (trimmedLine === '---') {
            frontmatterClosed = true;
            return '---';
          }
          return trimmedLine; // Remove leading whitespace
        }
        
        return line; // Keep content lines as-is
      });
      rawContent = cleanedLines.join('\n');
      
      // Parse frontmatter
      const { data: frontmatter, content } = matter.default(rawContent);
      
      res.json({
        frontmatter,
        contentPreview: content.substring(0, 500),
        hasContent: content.length > 0,
        valid: !!frontmatter.title,
      });
    } catch (error) {
      console.error("Error parsing markdown:", error);
      res.status(500).json({ message: "Error parsing markdown" });
    }
  });

  app.post("/api/admin/blog", requireAdminRole, async (req, res) => {
    try {
      const { title, slug, excerpt, content, image, category, brandId, published, seoTitle, seoDescription, tags } = req.body;
      
      if (!title || !slug || !content) {
        return res.status(400).json({ message: "Title, slug, and content are required" });
      }
      
      const post = await storage.createBlogPost({
        title,
        slug,
        excerpt,
        content,
        image,
        category,
        brandId,
        published: published || false,
        publishedAt: published ? new Date() : null,
        seoTitle,
        seoDescription,
        tags,
      });
      res.status(201).json(post);
    } catch (error) {
      console.error("Error creating blog post:", error);
      res.status(500).json({ message: "Error creating blog post" });
    }
  });

  app.patch("/api/admin/blog/:id", requireAdminRole, async (req, res) => {
    try {
      // Check if it's a markdown post (cannot be edited via API)
      if (req.params.id.startsWith('md-')) {
        return res.status(400).json({ message: "Markdown posts cannot be edited via API. Edit the .md file directly." });
      }
      
      const existingPost = await storage.getBlogPost(req.params.id);
      if (!existingPost) {
        return res.status(404).json({ message: "Blog post not found" });
      }
      
      const { title, slug, excerpt, content, image, category, brandId, published, seoTitle, seoDescription, tags } = req.body;
      
      // Only update publishedAt when explicitly changing publish state
      let publishedAt = existingPost.publishedAt;
      if (published !== undefined) {
        if (published && !existingPost.published) {
          // Transitioning from draft to published
          publishedAt = new Date();
        } else if (published === false) {
          // Explicitly unpublishing
          publishedAt = null;
        }
      }
      
      const post = await storage.updateBlogPost(req.params.id, {
        ...(title !== undefined && { title }),
        ...(slug !== undefined && { slug }),
        ...(excerpt !== undefined && { excerpt }),
        ...(content !== undefined && { content }),
        ...(image !== undefined && { image }),
        ...(category !== undefined && { category }),
        ...(brandId !== undefined && { brandId }),
        ...(published !== undefined && { published }),
        publishedAt,
        ...(seoTitle !== undefined && { seoTitle }),
        ...(seoDescription !== undefined && { seoDescription }),
        ...(tags !== undefined && { tags }),
      });
      
      res.json(post);
    } catch (error) {
      console.error("Error updating blog post:", error);
      res.status(500).json({ message: "Error updating blog post" });
    }
  });

  app.delete("/api/admin/blog/:id", requireAdminRole, async (req, res) => {
    try {
      // Check if it's a markdown post (cannot be deleted via API)
      if (req.params.id.startsWith('md-')) {
        return res.status(400).json({ message: "Markdown posts cannot be deleted via API. Delete the .md file directly." });
      }
      
      await storage.deleteBlogPost(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting blog post:", error);
      res.status(500).json({ message: "Error deleting blog post" });
    }
  });

  // Bulk operations for blog posts
  app.post("/api/admin/blog/bulk", requireAdminRole, async (req, res) => {
    try {
      const { action, ids } = req.body as { action: string; ids: string[] };
      
      if (!action || !ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "Action and ids are required" });
      }

      // Filter out markdown posts for destructive operations
      const dbIds = ids.filter(id => !id.startsWith('md-'));
      const markdownIds = ids.filter(id => id.startsWith('md-'));
      
      let processed = 0;
      let skipped = markdownIds.length;

      switch (action) {
        case "publish":
          for (const id of dbIds) {
            await storage.updateBlogPost(id, { published: true });
            processed++;
          }
          break;
        case "unpublish":
          for (const id of dbIds) {
            await storage.updateBlogPost(id, { published: false });
            processed++;
          }
          break;
        case "delete":
          for (const id of dbIds) {
            await storage.deleteBlogPost(id);
            processed++;
          }
          break;
        default:
          return res.status(400).json({ message: "Invalid action. Use: publish, unpublish, delete" });
      }

      res.json({ 
        success: true, 
        processed, 
        skipped,
        message: skipped > 0 
          ? `${processed} posts processed. ${skipped} markdown posts skipped (cannot be modified via API).`
          : `${processed} posts processed successfully.`
      });
    } catch (error) {
      console.error("Error in bulk blog operation:", error);
      res.status(500).json({ message: "Error processing bulk operation" });
    }
  });

  // ============================================
  // MEDIA LIBRARY API
  // ============================================
  
  app.get("/api/admin/media", requireAgentOrAdmin, async (req, res) => {
    try {
      const fs = await import("fs").then(m => m.promises);
      const path = await import("path");
      
      const mediaDir = path.join(process.cwd(), "attached_assets");
      const publicDir = path.join(process.cwd(), "public/assets");
      
      const media: Array<{ name: string; path: string; type: string; size: number; url: string }> = [];
      
      // Scan attached_assets
      try {
        const files = await fs.readdir(mediaDir);
        for (const file of files) {
          if (/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file)) {
            const stat = await fs.stat(path.join(mediaDir, file));
            media.push({
              name: file,
              path: path.join(mediaDir, file),
              type: file.split('.').pop()?.toLowerCase() || 'unknown',
              size: stat.size,
              url: `/assets/${file}`
            });
          }
        }
      } catch (e) {
        // Directory might not exist
      }
      
      // Scan public/assets
      try {
        const files = await fs.readdir(publicDir);
        for (const file of files) {
          if (/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file)) {
            const stat = await fs.stat(path.join(publicDir, file));
            media.push({
              name: file,
              path: path.join(publicDir, file),
              type: file.split('.').pop()?.toLowerCase() || 'unknown',
              size: stat.size,
              url: `/assets/${file}`
            });
          }
        }
      } catch (e) {
        // Directory might not exist
      }
      
      // Sort by name
      media.sort((a, b) => a.name.localeCompare(b.name));
      
      res.json({
        total: media.length,
        items: media
      });
    } catch (error) {
      console.error("Error fetching media:", error);
      res.status(500).json({ message: "Error fetching media library" });
    }
  });

  // ============================================
  // PROVIDERS API
  // ============================================
  
  app.get("/api/providers", async (req, res) => {
    try {
      const active = req.query.active === "true";
      const providers = active 
        ? await storage.getActiveProviders()
        : await storage.getProviders();
      res.json(providers);
    } catch (error) {
      console.error("Error fetching providers:", error);
      res.status(500).json({ message: "Error fetching providers" });
    }
  });

  // ============================================
  // AFFILIATE PRODUCTS API
  // ============================================
  
  app.get("/api/affiliate-products", async (req, res) => {
    try {
      const fs = await import("fs").then(m => m.promises);
      const path = await import("path");
      const filePath = path.join(process.cwd(), "src/data/affiliate-products.json");
      const data = await fs.readFile(filePath, "utf-8");
      res.json(JSON.parse(data));
    } catch (error) {
      console.error("Error fetching affiliate products:", error);
      res.status(500).json({ message: "Error fetching affiliate products" });
    }
  });

  app.post("/api/affiliate-products", async (req, res) => {
    try {
      const fs = await import("fs").then(m => m.promises);
      const path = await import("path");
      const filePath = path.join(process.cwd(), "src/data/affiliate-products.json");
      const data = await fs.readFile(filePath, "utf-8");
      const products = JSON.parse(data);
      
      const newProduct = {
        id: Date.now().toString(),
        ...req.body
      };
      products.push(newProduct);
      
      await fs.writeFile(filePath, JSON.stringify(products, null, 2));
      res.json(newProduct);
    } catch (error) {
      console.error("Error adding affiliate product:", error);
      res.status(500).json({ message: "Error adding affiliate product" });
    }
  });

  app.delete("/api/affiliate-products/:id", async (req, res) => {
    try {
      const fs = await import("fs").then(m => m.promises);
      const path = await import("path");
      const filePath = path.join(process.cwd(), "src/data/affiliate-products.json");
      const data = await fs.readFile(filePath, "utf-8");
      let products = JSON.parse(data);
      
      products = products.filter((p: any) => p.id !== req.params.id);
      
      await fs.writeFile(filePath, JSON.stringify(products, null, 2));
      res.json({ message: "Product deleted" });
    } catch (error) {
      console.error("Error deleting affiliate product:", error);
      res.status(500).json({ message: "Error deleting affiliate product" });
    }
  });

  // ============================================
  // EXTERNAL INTEGRATIONS API
  // ============================================

  app.get("/api/integrations/status", async (req, res) => {
    try {
      const status = getProviderStatus();
      res.json(status);
    } catch (error) {
      console.error("Error getting provider status:", error);
      res.status(500).json({ message: "Error getting provider status" });
    }
  });

  app.post("/api/integrations/hotels/search", async (req, res) => {
    try {
      const params = z.object({
        destination: z.string(),
        checkIn: z.string(),
        checkOut: z.string(),
        guests: z.number().min(1),
        rooms: z.number().optional(),
        currency: z.string().optional(),
      }).parse(req.body);

      const hotels = await searchHotelsFromProviders(params);
      res.json(hotels);
    } catch (error) {
      console.error("Error searching hotels:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid search params", errors: error.errors });
      }
      res.status(500).json({ message: "Error searching hotels" });
    }
  });

  app.post("/api/integrations/attractions/search", async (req, res) => {
    try {
      const params = z.object({
        destination: z.string(),
        date: z.string().optional(),
        category: z.string().optional(),
        language: z.string().optional(),
        currency: z.string().optional(),
      }).parse(req.body);

      const attractions = await searchAttractionsFromProviders(params);
      res.json(attractions);
    } catch (error) {
      console.error("Error searching attractions:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid search params", errors: error.errors });
      }
      res.status(500).json({ message: "Error searching attractions" });
    }
  });

  app.get("/api/integrations/attractions/:id", async (req, res) => {
    try {
      const attraction = await xcaretProvider.getAttractionDetails(req.params.id);
      if (!attraction) {
        return res.status(404).json({ message: "Attraction not found" });
      }
      res.json(attraction);
    } catch (error) {
      console.error("Error getting attraction:", error);
      res.status(500).json({ message: "Error getting attraction" });
    }
  });

  app.post("/api/integrations/flights/search", async (req, res) => {
    try {
      const params = z.object({
        origin: z.string().length(3),
        destination: z.string().length(3),
        departureDate: z.string(),
        returnDate: z.string().optional(),
        passengers: z.object({
          adults: z.number().min(1),
          children: z.number().optional(),
          infants: z.number().optional(),
        }),
        cabinClass: z.enum(["economy", "premium_economy", "business", "first"]).optional(),
        currency: z.string().optional(),
        directOnly: z.boolean().optional(),
      }).parse(req.body);

      const flights = await searchFlightsFromProviders(params);
      res.json(flights);
    } catch (error) {
      console.error("Error searching flights:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid search params", errors: error.errors });
      }
      res.status(500).json({ message: "Error searching flights" });
    }
  });

  // ============================================
  // LGBT MODULE API
  // ============================================

  // LGBT Events
  app.get("/api/lgbt/events", async (req, res) => {
    try {
      const brandId = req.brand?.id;
      const featured = req.query.featured === "true";
      const upcoming = req.query.upcoming !== "false";

      let events;
      if (featured) {
        events = await storage.getFeaturedLgbtEvents(brandId);
      } else if (upcoming) {
        events = await storage.getUpcomingLgbtEvents(brandId);
      } else {
        events = await storage.getLgbtEvents(brandId);
      }
      res.json(events);
    } catch (error) {
      console.error("Error fetching LGBT events:", error);
      res.status(500).json({ message: "Error fetching events" });
    }
  });

  app.get("/api/lgbt/events/:idOrSlug", async (req, res) => {
    try {
      const { idOrSlug } = req.params;
      let event = await storage.getLgbtEvent(idOrSlug);
      if (!event) {
        event = await storage.getLgbtEventBySlug(idOrSlug);
      }
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      console.error("Error fetching LGBT event:", error);
      res.status(500).json({ message: "Error fetching event" });
    }
  });

  app.post("/api/lgbt/events", async (req, res) => {
    try {
      const eventData = insertLgbtEventSchema.parse({
        ...req.body,
        brandId: req.brand?.id,
      });
      const event = await storage.createLgbtEvent(eventData);
      res.status(201).json(event);
    } catch (error) {
      console.error("Error creating LGBT event:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid event data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating event" });
    }
  });

  app.patch("/api/lgbt/events/:id", async (req, res) => {
    try {
      const event = await storage.updateLgbtEvent(req.params.id, req.body);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      console.error("Error updating LGBT event:", error);
      res.status(500).json({ message: "Error updating event" });
    }
  });

  // LGBT Cruises
  app.get("/api/lgbt/cruises", async (req, res) => {
    try {
      const brandId = req.brand?.id;
      const featured = req.query.featured === "true";
      const upcoming = req.query.upcoming !== "false";

      let cruises;
      if (featured) {
        cruises = await storage.getFeaturedLgbtCruises(brandId);
      } else if (upcoming) {
        cruises = await storage.getUpcomingLgbtCruises(brandId);
      } else {
        cruises = await storage.getLgbtCruises(brandId);
      }
      res.json(cruises);
    } catch (error) {
      console.error("Error fetching LGBT cruises:", error);
      res.status(500).json({ message: "Error fetching cruises" });
    }
  });

  app.get("/api/lgbt/cruises/:idOrSlug", async (req, res) => {
    try {
      const { idOrSlug } = req.params;
      let cruise = await storage.getLgbtCruise(idOrSlug);
      if (!cruise) {
        cruise = await storage.getLgbtCruiseBySlug(idOrSlug);
      }
      if (!cruise) {
        return res.status(404).json({ message: "Cruise not found" });
      }
      res.json(cruise);
    } catch (error) {
      console.error("Error fetching LGBT cruise:", error);
      res.status(500).json({ message: "Error fetching cruise" });
    }
  });

  app.post("/api/lgbt/cruises", async (req, res) => {
    try {
      const cruiseData = insertLgbtCruiseSchema.parse({
        ...req.body,
        brandId: req.brand?.id,
      });
      const cruise = await storage.createLgbtCruise(cruiseData);
      res.status(201).json(cruise);
    } catch (error) {
      console.error("Error creating LGBT cruise:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid cruise data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating cruise" });
    }
  });

  app.patch("/api/lgbt/cruises/:id", async (req, res) => {
    try {
      const cruise = await storage.updateLgbtCruise(req.params.id, req.body);
      if (!cruise) {
        return res.status(404).json({ message: "Cruise not found" });
      }
      res.json(cruise);
    } catch (error) {
      console.error("Error updating LGBT cruise:", error);
      res.status(500).json({ message: "Error updating cruise" });
    }
  });

  // LGBT-friendly destinations (filter existing destinations by score)
  app.get("/api/lgbt/destinations", async (req, res) => {
    try {
      const destinations = await storage.getDestinations();
      const lgbtFriendly = destinations.filter(d => (d.lgbtFriendlyScore || 0) >= 7);
      res.json(lgbtFriendly);
    } catch (error) {
      console.error("Error fetching LGBT destinations:", error);
      res.status(500).json({ message: "Error fetching destinations" });
    }
  });

  // ============================================
  // TBO HOLIDAYS API INTEGRATION
  // ============================================

  // Check TBO API status
  app.get("/api/tbo/status", async (req, res) => {
    try {
      const status = tboClient.getStatus();
      res.json(status);
    } catch (error) {
      console.error("Error checking TBO status:", error);
      res.status(500).json({ message: "Error checking TBO status" });
    }
  });

  // TBO Hotel Search
  app.post("/api/tbo/search", async (req, res) => {
    try {
      if (!tboClient.isReady()) {
        return res.status(503).json({ 
          message: "TBO API no configurado. Esperando credenciales.",
          code: "TBO_NOT_CONFIGURED" 
        });
      }
      const searchParams: TBOSearchRequest = req.body;
      const results = await tboClient.search(searchParams);
      res.json(results);
    } catch (error: any) {
      console.error("TBO Search error:", error);
      res.status(500).json({ message: error.message || "Error en búsqueda TBO" });
    }
  });

  // TBO PreBook
  app.post("/api/tbo/prebook", async (req, res) => {
    try {
      if (!tboClient.isReady()) {
        return res.status(503).json({ 
          message: "TBO API no configurado",
          code: "TBO_NOT_CONFIGURED" 
        });
      }
      const preBookParams: TBOPreBookRequest = req.body;
      const results = await tboClient.preBook(preBookParams);
      res.json(results);
    } catch (error: any) {
      console.error("TBO PreBook error:", error);
      res.status(500).json({ message: error.message || "Error en pre-reserva TBO" });
    }
  });

  // TBO Book
  app.post("/api/tbo/book", async (req, res) => {
    try {
      if (!tboClient.isReady()) {
        return res.status(503).json({ 
          message: "TBO API no configurado",
          code: "TBO_NOT_CONFIGURED" 
        });
      }
      const bookParams: TBOBookRequest = req.body;
      const results = await tboClient.book(bookParams);
      res.json(results);
    } catch (error: any) {
      console.error("TBO Book error:", error);
      res.status(500).json({ message: error.message || "Error en reserva TBO" });
    }
  });

  // TBO Cancel
  app.post("/api/tbo/cancel", async (req, res) => {
    try {
      if (!tboClient.isReady()) {
        return res.status(503).json({ 
          message: "TBO API no configurado",
          code: "TBO_NOT_CONFIGURED" 
        });
      }
      const cancelParams: TBOCancelRequest = req.body;
      const results = await tboClient.cancel(cancelParams);
      res.json(results);
    } catch (error: any) {
      console.error("TBO Cancel error:", error);
      res.status(500).json({ message: error.message || "Error al cancelar TBO" });
    }
  });

  // TBO Booking Detail
  app.post("/api/tbo/booking-detail", async (req, res) => {
    try {
      if (!tboClient.isReady()) {
        return res.status(503).json({ 
          message: "TBO API no configurado",
          code: "TBO_NOT_CONFIGURED" 
        });
      }
      const results = await tboClient.getBookingDetail(req.body);
      res.json(results);
    } catch (error: any) {
      console.error("TBO BookingDetail error:", error);
      res.status(500).json({ message: error.message || "Error obteniendo detalles TBO" });
    }
  });

  // TBO Static Data - Countries
  app.get("/api/tbo/countries", async (req, res) => {
    try {
      if (!tboClient.isReady()) {
        return res.status(503).json({ message: "TBO API no configurado" });
      }
      const results = await tboClient.getCountryList();
      res.json(results);
    } catch (error: any) {
      console.error("TBO Countries error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // TBO Static Data - Cities
  app.post("/api/tbo/cities", async (req, res) => {
    try {
      if (!tboClient.isReady()) {
        return res.status(503).json({ message: "TBO API no configurado" });
      }
      const results = await tboClient.getCityList(req.body);
      res.json(results);
    } catch (error: any) {
      console.error("TBO Cities error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // TBO Static Data - Hotel Details
  app.post("/api/tbo/hotel-details", async (req, res) => {
    try {
      if (!tboClient.isReady()) {
        return res.status(503).json({ message: "TBO API no configurado" });
      }
      const results = await tboClient.getHotelDetails(req.body);
      res.json(results);
    } catch (error: any) {
      console.error("TBO Hotel Details error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // ============================================
  // ADMIN - CUSTOMERS API
  // ============================================

  app.get("/api/admin/customers", requireAgentOrAdmin, async (req, res) => {
    try {
      const users = await storage.getUsers();
      const customers = users.filter((u: any) => u.role === 'customer');
      res.json(customers);
    } catch (error) {
      console.error("Error fetching customers:", error);
      res.status(500).json({ message: "Error fetching customers" });
    }
  });

  app.get("/api/admin/customers/:id", requireAgentOrAdmin, async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user || user.role !== 'customer') {
        return res.status(404).json({ message: "Customer not found" });
      }
      // Get customer's bookings
      const bookings = await storage.getBookingsByUser(req.params.id);
      res.json({ ...user, bookings });
    } catch (error) {
      console.error("Error fetching customer:", error);
      res.status(500).json({ message: "Error fetching customer" });
    }
  });

  // ============================================
  // ADMIN - TBO CERTIFICATION API
  // ============================================

  const tboCertificationService = new TBOCertificationService();

  app.get("/api/admin/tbo/certification/cases", requireAdminRole, async (req, res) => {
    try {
      const cases = tboCertificationService.getCertificationCases();
      const status = tboCertificationService.getCaseStatus();
      res.json({ cases, status });
    } catch (error: any) {
      console.error("TBO Certification cases error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/tbo/certification/run", requireAdminRole, async (req, res) => {
    try {
      const { caseId, checkIn, checkOut, cityCode, hotelCodes, nationality } = req.body;
      const cases = tboCertificationService.getCertificationCases();
      const caseConfig = cases.find(c => c.id === caseId);
      
      if (!caseConfig) {
        return res.status(404).json({ error: "Case not found" });
      }

      const result = await tboCertificationService.runCertificationCase(caseConfig, {
        checkIn,
        checkOut,
        cityCode,
        hotelCodes,
        nationality,
      });
      res.json(result);
    } catch (error: any) {
      console.error("TBO Certification run error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/tbo/certification/run-all", requireAdminRole, async (req, res) => {
    try {
      const { checkIn, checkOut, cityCode, hotelCodes, nationality } = req.body;
      const result = await tboCertificationService.runAllCertificationCases({
        checkIn,
        checkOut,
        cityCode,
        hotelCodes,
        nationality,
      });
      res.json(result);
    } catch (error: any) {
      console.error("TBO Certification run-all error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/tbo/certification/clear", requireAdminRole, async (req, res) => {
    try {
      tboCertificationService.clearLogs();
      res.json({ success: true });
    } catch (error: any) {
      console.error("TBO Certification clear error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/admin/tbo/certification/download", requireAdminRole, async (req, res) => {
    try {
      const result = await tboCertificationService.generateCertificationZip();
      if (!result.success || !result.zipPath) {
        return res.status(500).json({ error: result.error || "Failed to generate ZIP" });
      }
      res.download(result.zipPath);
    } catch (error: any) {
      console.error("TBO Certification download error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Public download route for TBO certification ZIP (no auth required)
  app.get("/downloads/TBO_Certification_Chromatravel.zip", async (req, res) => {
    try {
      tboCertificationService.setBrand('chromatravel');
      const result = await tboCertificationService.generateCertificationZip();
      if (!result.success || !result.zipPath) {
        return res.status(404).json({ error: result.error || "No certification ZIP available" });
      }
      res.download(result.zipPath, "TBO_Certification_Chromatravel.zip");
    } catch (error: any) {
      console.error("TBO Certification public download error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Public download route for HotelDO Business Case
  app.get("/downloads/HotelDO_Business_Case_FenixTraveler.md", (req, res) => {
    const filePath = path.join(process.cwd(), "public/documents/HotelDO_Business_Case_FenixTraveler.md");
    res.download(filePath, "HotelDO_Business_Case_FenixTraveler.md");
  });

  // ============================================
  // HOTELBEDS CERTIFICATION ROUTES
  // ============================================
  
  const hotelbedsCertificationService = new HotelbedsCertificationService();

  app.get("/api/admin/hotelbeds/certification/info", requireAdminRole, async (req, res) => {
    try {
      const certInfo = hotelbedsCertificationService.getCertificateInfo();
      const documents = hotelbedsCertificationService.getDocuments();
      res.json({ certificate: certInfo, documents });
    } catch (error: any) {
      console.error("Hotelbeds Certification info error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/admin/hotelbeds/certification/download", requireAdminRole, async (req, res) => {
    try {
      const brand = (req.query.brand as 'fenix' | 'chroma') || 'fenix';
      const result = await hotelbedsCertificationService.generateCertificationPackage(brand);
      if (!result.success || !result.zipPath) {
        return res.status(500).json({ error: result.error || "Failed to generate ZIP" });
      }
      res.download(result.zipPath);
    } catch (error: any) {
      console.error("Hotelbeds Certification download error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================
  // LOYALTY PROGRAM ROUTES
  // ============================================
  
  const { loyaltyService } = await import("./services/loyalty");
  const { aiAssistant } = await import("./services/ai-assistant");
  const { invoicingService } = await import("./services/invoicing");

  app.get("/api/loyalty/status", async (req, res) => {
    try {
      res.json({ 
        enabled: true,
        aiStatus: aiAssistant.getStatus(),
        invoicingStatus: invoicingService.getStatus(),
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/loyalty/initialize/:brandId", requireAdminRole, async (req, res) => {
    try {
      await loyaltyService.initializeLevels(req.params.brandId);
      res.json({ success: true, message: "Loyalty levels initialized" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/loyalty/initialize", requireAdminRole, async (req, res) => {
    try {
      const brandId = req.session?.brandId || req.brand?.id;
      if (!brandId) {
        return res.status(400).json({ error: "brandId required (from session or request body)" });
      }
      await loyaltyService.initializeLevels(brandId);
      res.json({ success: true, message: "Loyalty levels initialized" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/loyalty/enroll", async (req, res) => {
    try {
      const userId = req.body.userId || req.session?.userId;
      const brandId = req.body.brandId || req.session?.brandId || req.brand?.id;
      if (!userId || !brandId) {
        return res.status(400).json({ error: "userId and brandId required" });
      }
      if (typeof userId !== "string" || typeof brandId !== "string") {
        return res.status(400).json({ error: "Invalid userId or brandId format" });
      }
      const accountId = await loyaltyService.createAccount(userId, brandId);
      res.json({ success: !!accountId, accountId });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/loyalty/account/:accountId", async (req, res) => {
    try {
      const details = await loyaltyService.getAccountDetails(req.params.accountId);
      if (!details) {
        return res.status(404).json({ error: "Account not found" });
      }
      res.json(details);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/loyalty/account", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      const brandId = req.session?.brandId || req.brand?.id;
      const details = await loyaltyService.getAccountByUser(userId, brandId);
      if (!details) {
        return res.status(404).json({ error: "Loyalty account not found. Enroll first." });
      }
      res.json(details);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/loyalty/levels", async (req, res) => {
    try {
      const brandId = req.query.brandId as string || req.session?.brandId || req.brand?.id;
      const levels = await loyaltyService.getLevels(brandId);
      res.json(levels);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/loyalty/rewards/:accountId", async (req, res) => {
    try {
      const rewards = await loyaltyService.getAvailableRewards(req.params.accountId);
      res.json(rewards);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/loyalty/rewards", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      const brandId = req.session?.brandId || req.brand?.id;
      const account = await loyaltyService.getAccountByUser(userId, brandId);
      if (!account) {
        return res.status(404).json({ error: "Loyalty account not found" });
      }
      const rewards = await loyaltyService.getAvailableRewards(account.id);
      res.json(rewards);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/loyalty/transactions", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      const brandId = req.session?.brandId || req.brand?.id;
      const account = await loyaltyService.getAccountByUser(userId, brandId);
      if (!account) {
        return res.status(404).json({ error: "Loyalty account not found" });
      }
      const transactions = await loyaltyService.getTransactions(account.id);
      res.json(transactions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/loyalty/points", requireAdminRole, async (req, res) => {
    try {
      const { accountId, type, points, description, referenceType, referenceId } = req.body;
      if (!accountId || !type || points === undefined) {
        return res.status(400).json({ error: "accountId, type, and points required" });
      }
      if (typeof accountId !== "string" || typeof type !== "string" || typeof points !== "number") {
        return res.status(400).json({ error: "Invalid input types" });
      }
      const validTypes = ["earn", "redeem", "expire", "adjust", "bonus", "referral"];
      if (!validTypes.includes(type)) {
        return res.status(400).json({ error: `Invalid type. Must be one of: ${validTypes.join(", ")}` });
      }
      const success = await loyaltyService.addPoints({
        accountId,
        type: type as any,
        points,
        description: description || "",
        referenceType,
        referenceId,
        createdBy: req.session?.userId as string,
      });
      res.json({ success });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================
  // INVOICING ROUTES (Admin only for mutations)
  // ============================================

  app.get("/api/invoicing/status", async (req, res) => {
    try {
      res.json(invoicingService.getStatus());
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/invoicing/codes", async (req, res) => {
    try {
      res.json({
        productCodes: invoicingService.getCommonProductCodes(),
        fiscalRegimes: invoicingService.getFiscalRegimes(),
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/invoicing/proforma", requireAdminRole, async (req, res) => {
    try {
      const result = await invoicingService.createProforma(req.body);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/invoicing/invoice", requireAdminRole, async (req, res) => {
    try {
      const result = await invoicingService.createInvoice(req.body);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================
  // AI ASSISTANT STATUS (Read-only)
  // ============================================

  app.get("/api/ai/status", async (req, res) => {
    try {
      res.json(aiAssistant.getStatus());
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================
  // CRM COMMUNICATIONS API
  // ============================================

  app.post("/api/crm/email/send", requireAdminRole, async (req, res) => {
    try {
      const validated = crmEmailSchema.parse(req.body);
      const success = await sendCrmEmail({ to: validated.to, subject: validated.subject, html: validated.html, text: validated.text }, validated.brandCode || 'chroma');
      res.json({ success });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Invalid request', details: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/crm/email/birthday", requireAdminRole, async (req, res) => {
    try {
      const validated = crmBirthdaySchema.parse(req.body);
      const html = generateBirthdayEmail(validated.nombre, validated.puntosRegalo || 100, validated.codigoDescuento || 'CUMPLE15', validated.brandCode || 'chroma');
      const success = await sendCrmEmail({ to: validated.email, subject: `Feliz Cumpleanos ${validated.nombre}!`, html }, validated.brandCode || 'chroma');
      res.json({ success, preview: html });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Invalid request', details: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/crm/email/promo", requireAdminRole, async (req, res) => {
    try {
      const validated = crmPromoSchema.parse(req.body);
      const html = generatePromoEmail(validated.nombre, validated.tier || 'Bronce', validated.promocion, validated.brandCode || 'chroma');
      const success = await sendCrmEmail({ to: validated.email, subject: validated.promocion.titulo, html }, validated.brandCode || 'chroma');
      res.json({ success, preview: html });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Invalid request', details: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/crm/email/booking-confirmation", requireAdminRole, async (req, res) => {
    try {
      const validated = crmBookingEmailSchema.parse(req.body);
      const html = generateBookingConfirmationEmail(validated.booking, validated.brandCode || 'chroma');
      const success = await sendCrmEmail({ to: validated.email, subject: `Reservacion Confirmada - ${validated.booking.confirmationCode}`, html }, validated.brandCode || 'chroma');
      res.json({ success, preview: html });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Invalid request', details: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================
  // CRM WHATSAPP API
  // ============================================

  app.post("/api/crm/whatsapp/send", requireAdminRole, async (req, res) => {
    try {
      const validated = crmWhatsAppSchema.parse(req.body);
      const result = await sendWhatsAppMessage(validated.to, validated.message, validated.brandCode || 'chroma');
      res.json(result);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Invalid request', details: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/crm/whatsapp/booking", requireAdminRole, async (req, res) => {
    try {
      const validated = crmWhatsAppBookingSchema.parse(req.body);
      const message = generateBookingWhatsAppMessage(validated.booking, validated.brandCode || 'chroma');
      const result = await sendWhatsAppMessage(validated.phone, message, validated.brandCode || 'chroma');
      res.json(result);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Invalid request', details: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/crm/whatsapp/promo", requireAdminRole, async (req, res) => {
    try {
      const validated = crmWhatsAppPromoSchema.parse(req.body);
      const message = generatePromoWhatsAppMessage(validated.nombre, validated.promocion);
      const result = await sendWhatsAppMessage(validated.phone, message, validated.brandCode || 'chroma');
      res.json(result);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Invalid request', details: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/crm/whatsapp/birthday", requireAdminRole, async (req, res) => {
    try {
      const validated = crmWhatsAppBirthdaySchema.parse(req.body);
      const message = generateBirthdayWhatsAppMessage(validated.nombre, validated.codigoDescuento || 'CUMPLE15');
      const result = await sendWhatsAppMessage(validated.phone, message, validated.brandCode || 'chroma');
      res.json(result);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Invalid request', details: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================
  // CRM RSS/SOCIAL MEDIA API
  // ============================================

  app.get("/api/crm/rss/:empresa", async (req, res) => {
    try {
      const empresa = req.params.empresa as 'fenix' | 'chroma';
      const articles = await readFeed(empresa);
      res.json(articles);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/crm/rss/:empresa/new", requireAdminRole, async (req, res) => {
    try {
      const empresa = req.params.empresa as 'fenix' | 'chroma';
      const newArticles = await detectNewArticles(empresa);
      res.json(newArticles);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/crm/social/publish", requireAdminRole, async (req, res) => {
    try {
      const results = await checkAndPublishNewContent();
      res.json({ success: true, published: results });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/crm/social/buttons", async (req, res) => {
    try {
      const { url, titulo } = req.query;
      const html = generateSocialButtons(url as string, titulo as string);
      res.json({ html });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================
  // CRM DOCUMENT GENERATION API
  // ============================================

  app.post("/api/crm/documents/receipt", requireAdminRole, async (req, res) => {
    try {
      const validated = crmReceiptSchema.parse(req.body);
      const idempotencyKey = `pdf-receipt-${validated.datosPago.id}`;
      await enqueueJob("generate_pdf", {
        documentType: "receipt",
        brandCode: validated.brandCode || 'chroma',
        data: validated.datosPago as unknown as Record<string, unknown>,
        clientData: validated.cliente as unknown as Record<string, unknown>,
        notifyEmail: validated.cliente.email,
      }, idempotencyKey);
      res.status(202).json({
        success: true,
        message: "El recibo se está generando. Recibirás un email cuando esté listo.",
        jobKey: idempotencyKey,
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Invalid request', details: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/crm/documents/proforma", requireAdminRole, async (req, res) => {
    try {
      const validated = crmProformaSchema.parse(req.body);
      const idempotencyKey = `pdf-proforma-${validated.reserva.id || Date.now()}`;
      await enqueueJob("generate_pdf", {
        documentType: "proforma",
        brandCode: validated.brandCode || 'chroma',
        data: validated.reserva as unknown as Record<string, unknown>,
        clientData: validated.cliente as unknown as Record<string, unknown>,
        notifyEmail: validated.cliente.email,
      }, idempotencyKey);
      res.status(202).json({
        success: true,
        message: "La proforma se está generando. Recibirás un email cuando esté lista.",
        jobKey: idempotencyKey,
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Invalid request', details: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/crm/documents/qr", async (req, res) => {
    try {
      const { data } = req.body;
      if (!data) {
        return res.status(400).json({ error: 'Data required for QR code' });
      }
      const filepath = await generateQRCode(data);
      const filename = path.basename(filepath);
      res.json({ success: true, filepath, downloadUrl: `/api/crm/documents/download/${filename}` });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Job status endpoint — for polling after async document generation
  app.get("/api/jobs/:idempotencyKey/status", requireAdminRole, async (req, res) => {
    try {
      const { jobQueue: jq } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      const { db: ormDb } = await import("./db");
      const [job] = await ormDb.select({
        status:    jq.status,
        attempts:  jq.attempts,
        lastError: jq.lastError,
        updatedAt: jq.updatedAt,
      }).from(jq).where(eq(jq.idempotencyKey, req.params.idempotencyKey));
      if (!job) return res.status(404).json({ error: "Job not found" });
      res.json(job);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/crm/documents/download/:filename", requireAdminRole, async (req, res) => {
    try {
      const { filename } = req.params;
      const safeName = path.basename(filename);
      const filepath = path.join('./documents', safeName);
      
      if (!fs.existsSync(filepath)) {
        return res.status(404).json({ error: 'Document not found' });
      }
      
      res.download(filepath, safeName);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================
  // CRM CAMPAIGNS API
  // ============================================

  const { campaignService } = await import("./services/crm/campaign.service");
  const { importService } = await import("./services/crm/import.service");
  const { automationService } = await import("./services/crm/automation.service");
  const { whatsappSalesService } = await import("./services/crm/whatsapp-sales.service");

  app.post("/api/crm/campaigns", requireAdminRole, async (req, res) => {
    try {
      const campaign = await campaignService.createCampaign(req.body);
      res.json(campaign);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/crm/campaigns", requireAdminRole, async (req, res) => {
    try {
      const brandId = req.query.brandId as string;
      if (!brandId) {
        return res.status(400).json({ error: "brandId required" });
      }
      const campaigns = await campaignService.getCampaigns(brandId);
      res.json(campaigns);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/crm/campaigns/:id", requireAdminRole, async (req, res) => {
    try {
      const campaign = await campaignService.getCampaignById(req.params.id);
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }
      res.json(campaign);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/crm/campaigns/:id/execute", requireAdminRole, async (req, res) => {
    try {
      const result = await campaignService.executeCampaign(req.params.id);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/crm/campaigns/:id/logs", requireAdminRole, async (req, res) => {
    try {
      const logs = await campaignService.getCampaignLogs(req.params.id);
      res.json(logs);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/crm/campaigns/segment/count", requireAdminRole, async (req, res) => {
    try {
      const { brandId, filters } = req.body;
      const segmentFilters = typeof filters === "object" ? filters : { segment: filters };
      const count = await campaignService.getSegmentCount(brandId, segmentFilters);
      res.json({ count });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================
  // CRM IMPORT API
  // ============================================

  app.get("/api/crm/import/template", (req, res) => {
    try {
      const template = importService.generateTemplate();
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=import_template.csv");
      res.send(template);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/crm/import/preview", requireAdminRole, async (req, res) => {
    try {
      const { content } = req.body;
      if (!content) {
        return res.status(400).json({ error: "CSV content required" });
      }
      const preview = await importService.getPreview(content);
      res.json(preview);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/crm/import/customers", requireAdminRole, async (req, res) => {
    try {
      const { brandId, content, mapping, source } = req.body;
      if (!brandId || !content || !mapping) {
        return res.status(400).json({ error: "brandId, content, and mapping required" });
      }
      const result = await importService.importCustomers(brandId, content, mapping, source);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================
  // CRM AUTOMATION API
  // ============================================

  app.post("/api/crm/automation/run-all", requireAdminRole, async (req, res) => {
    try {
      const { brandId } = req.body;
      if (!brandId) {
        return res.status(400).json({ error: "brandId required" });
      }
      const results = await automationService.runAllAutomations(brandId);
      res.json(results);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/crm/automation/birthdays", requireAdminRole, async (req, res) => {
    try {
      const { brandId } = req.body;
      if (!brandId) {
        return res.status(400).json({ error: "brandId required" });
      }
      const result = await automationService.sendBirthdayMessages(brandId);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/crm/automation/cold-leads", requireAdminRole, async (req, res) => {
    try {
      const { brandId, inactiveDays } = req.body;
      if (!brandId) {
        return res.status(400).json({ error: "brandId required" });
      }
      const result = await automationService.followUpColdLeads(brandId, inactiveDays);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/crm/automation/winback", requireAdminRole, async (req, res) => {
    try {
      const { brandId, inactiveDays } = req.body;
      if (!brandId) {
        return res.status(400).json({ error: "brandId required" });
      }
      const result = await automationService.winbackInactiveCustomers(brandId, inactiveDays);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/crm/automation/reminders", requireAdminRole, async (req, res) => {
    try {
      const { brandId, daysAhead } = req.body;
      if (!brandId) {
        return res.status(400).json({ error: "brandId required" });
      }
      const result = await automationService.sendUpcomingTripReminders(brandId, daysAhead);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/crm/automation/reviews", requireAdminRole, async (req, res) => {
    try {
      const { brandId, daysAfterCheckout } = req.body;
      if (!brandId) {
        return res.status(400).json({ error: "brandId required" });
      }
      const result = await automationService.requestReviews(brandId, daysAfterCheckout);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================
  // WHATSAPP SALES BOT API (Webhook)
  // ============================================

  app.post("/api/webhooks/twilio/whatsapp", async (req, res) => {
    try {
      const { From, Body, To } = req.body;
      const phoneNumber = From?.replace("whatsapp:", "") || "";
      const message = Body || "";
      
      const brandId = req.query.brandId as string || process.env.DEFAULT_BRAND_ID || "";
      
      if (!phoneNumber || !message) {
        return res.status(400).send("Invalid webhook data");
      }

      const result = await whatsappSalesService.handleIncomingMessage(phoneNumber, message, brandId);
      
      res.type("text/xml");
      res.send(`<?xml version="1.0" encoding="UTF-8"?>
        <Response>
          <Message>${result.response}</Message>
        </Response>`);
    } catch (error: any) {
      console.error("[WhatsApp Webhook] Error:", error);
      res.status(500).send("Error processing message");
    }
  });

  app.get("/api/crm/whatsapp/conversations", requireAdminRole, async (req, res) => {
    try {
      const brandId = req.query.brandId as string;
      if (!brandId) {
        return res.status(400).json({ error: "brandId required" });
      }
      const conversations = await whatsappSalesService.getActiveConversations(brandId);
      res.json(conversations);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/crm/whatsapp/conversations/:id", requireAdminRole, async (req, res) => {
    try {
      const conversation = await whatsappSalesService.getConversation(req.params.id);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      res.json(conversation);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/crm/whatsapp/conversations/:id/messages", requireAdminRole, async (req, res) => {
    try {
      const messages = await whatsappSalesService.getConversationMessages(req.params.id);
      res.json(messages);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================
  // LEAD CONVERSION & INTERACTIONS API
  // ============================================
  
  const { leadConversionService } = await import("./services/crm/lead-conversion.service");

  app.post("/api/admin/leads/:id/convert", requireAgentOrAdmin, async (req, res) => {
    try {
      const leadId = req.params.id;
      const convertedBy = req.session?.userId;
      
      const result = await leadConversionService.convertLeadToCustomer(leadId, convertedBy);
      
      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }
      
      res.json({
        message: "Lead converted successfully",
        customerId: result.customerId,
        customerCode: result.customerCode,
        loyaltyAccountId: result.loyaltyAccountId,
      });
    } catch (error: any) {
      console.error("Error converting lead:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/admin/leads/:id", requireAdminRole, async (req, res) => {
    try {
      await storage.deleteLead(req.params.id);
      res.json({ message: "Lead deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting lead:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/admin/leads/:id/interactions", requireAgentOrAdmin, async (req, res) => {
    try {
      const interactions = await leadConversionService.getInteractionsByLead(req.params.id);
      res.json(interactions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/leads/:id/interactions", requireAgentOrAdmin, async (req, res) => {
    try {
      const { type, channel, subject, content, metadata } = req.body;
      
      if (!type) {
        return res.status(400).json({ error: "type is required" });
      }
      
      const lead = await storage.getLeadById(req.params.id);
      if (!lead) {
        return res.status(404).json({ error: "Lead not found" });
      }
      
      const interaction = await leadConversionService.addInteraction({
        brandId: lead.brandId || undefined,
        leadId: lead.id,
        customerId: lead.customerId || undefined,
        type,
        channel,
        subject,
        content,
        metadata,
        createdBy: req.session?.userId,
      });
      
      res.json(interaction);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/admin/customers/:id/interactions", requireAgentOrAdmin, async (req, res) => {
    try {
      const interactions = await leadConversionService.getInteractionsByCustomer(req.params.id);
      res.json(interactions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/admin/leads/:id/status", requireAgentOrAdmin, async (req, res) => {
    try {
      const { status } = req.body;
      const leadId = req.params.id;
      
      if (!status) {
        return res.status(400).json({ error: "status is required" });
      }
      
      const currentLead = await storage.getLeadById(leadId);
      const oldStatus = currentLead?.status || null;
      
      if (status === "won") {
        const result = await leadConversionService.convertLeadToCustomer(leadId, req.session?.userId);
        if (result.success) {
          return res.json({
            message: "Lead converted to customer",
            lead: await storage.getLeadById(leadId),
            conversion: result,
          });
        }
      }
      
      const lead = await storage.updateLead(leadId, { status });
      
      await leadConversionService.addInteraction({
        leadId,
        type: "status_change",
        channel: "system",
        subject: `Status changed to ${status}`,
        createdBy: req.session?.userId,
      });
      
      const { auditService } = await import("./services/audit.service");
      await auditService.logLeadStatusChange(leadId, oldStatus, status, req.session?.userId);
      
      res.json(lead);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/admin/leads/kanban", requireAgentOrAdmin, async (req, res) => {
    try {
      const allLeads = await storage.getLeads();
      
      const kanbanData = {
        new: allLeads.filter(l => l.status === "new" || !l.status),
        contacted: allLeads.filter(l => l.status === "contacted"),
        qualified: allLeads.filter(l => l.status === "qualified"),
        proposal: allLeads.filter(l => l.status === "proposal"),
        negotiation: allLeads.filter(l => l.status === "negotiation"),
        won: allLeads.filter(l => l.status === "won"),
        lost: allLeads.filter(l => l.status === "lost"),
      };
      
      const metrics = {
        total: allLeads.length,
        byStatus: Object.entries(kanbanData).map(([status, leads]) => ({
          status,
          count: leads.length,
        })),
        conversionRate: allLeads.length > 0 
          ? ((kanbanData.won.length / allLeads.length) * 100).toFixed(1) + '%'
          : '0%',
      };
      
      res.json({ kanban: kanbanData, metrics });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================
  // BLOQUEOS API (Hotel Inventory for Sales Team)
  // ============================================
  
  app.get("/api/admin/bloqueos", requireAgentOrAdmin, async (req, res) => {
    try {
      const { getDb } = await import("./db");
      const db = getDb();
      if (!db) return res.status(503).json({ error: "Database not available" });
      
      const hotel = req.query.hotel as string | undefined;
      const desde = req.query.desde as string | undefined;
      const hasta = req.query.hasta as string | undefined;
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));
      const offset = (page - 1) * limit;
      
      let whereClause = 'WHERE estado = $1';
      const params: any[] = ['Activo'];
      let paramIdx = 2;
      
      if (hotel) {
        whereClause += ` AND LOWER(hotel) LIKE $${paramIdx}`;
        params.push(`%${hotel.toLowerCase()}%`);
        paramIdx++;
      }
      if (desde) {
        whereClause += ` AND fecha_fin >= $${paramIdx}`;
        params.push(desde);
        paramIdx++;
      }
      if (hasta) {
        whereClause += ` AND fecha_inicio <= $${paramIdx}`;
        params.push(hasta);
        paramIdx++;
      }
      
      const countQuery = `SELECT COUNT(*) FROM bloqueos ${whereClause}`;
      const dataQuery = `SELECT * FROM bloqueos ${whereClause} ORDER BY hotel, fecha_inicio LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`;
      const dataParams = [...params, limit, offset];
      
      const { Pool } = await import("pg");
      const pool = new Pool({ connectionString: process.env.DATABASE_URL });
      const [countResult, dataResult] = await Promise.all([
        pool.query(countQuery, params),
        pool.query(dataQuery, dataParams),
      ]);
      await pool.end();
      
      const total = parseInt(countResult.rows[0].count);
      
      res.json({
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        bloqueos: dataResult.rows,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/admin/bloqueos/hotels", requireAgentOrAdmin, async (req, res) => {
    try {
      const { Pool } = await import("pg");
      const pool = new Pool({ connectionString: process.env.DATABASE_URL });
      const result = await pool.query('SELECT DISTINCT hotel, proveedor, COUNT(*) as total_bloqueos FROM bloqueos WHERE estado = $1 GROUP BY hotel, proveedor ORDER BY hotel', ['Activo']);
      await pool.end();
      res.json(result.rows);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================
  // AUDIT LOGS API (Admin only)
  // ============================================
  
  app.get("/api/admin/audit-logs", requireAdminRole, async (req, res) => {
    try {
      const { Pool } = await import("pg");
      const pool = new Pool({ connectionString: process.env.DATABASE_URL });
      const limit = parseInt(req.query.limit as string) || 50;
      const entityType = req.query.entityType as string | undefined;
      
      let query = 'SELECT al.*, u.email as user_email, u.first_name as user_name FROM audit_logs al LEFT JOIN users u ON al.user_id = u.id';
      const params: any[] = [];
      let paramIdx = 1;
      
      if (entityType) {
        query += ` WHERE al.entity_type = $${paramIdx}`;
        params.push(entityType);
        paramIdx++;
      }
      
      query += ` ORDER BY al.created_at DESC LIMIT $${paramIdx}`;
      params.push(limit);
      
      const result = await pool.query(query, params);
      await pool.end();
      res.json(result.rows);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/admin/lead-history/:leadId", requireAgentOrAdmin, async (req, res) => {
    try {
      const { Pool } = await import("pg");
      const pool = new Pool({ connectionString: process.env.DATABASE_URL });
      const result = await pool.query(
        'SELECT lsh.*, u.email as changed_by_email FROM lead_status_history lsh LEFT JOIN users u ON lsh.changed_by = u.id WHERE lsh.lead_id = $1 ORDER BY lsh.changed_at DESC',
        [req.params.leadId]
      );
      await pool.end();
      res.json(result.rows);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ── OTA B2C Module (isolated) ──────────────────────────────────────────────
  registerOtaB2cRoutes(app);


  // ── ADMIN DASHBOARD METRICS ─────────────────────────────────────────────
  app.get("/api/admin/metrics", requireAgentOrAdmin, async (req, res) => {
    try {
      const { getPool } = await import("./db");
      const pool = getPool();
      if (!pool) return res.status(503).json({ error: "DB not available" });

      const today = new Date().toISOString().split('T')[0];
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

      const [bloqueos, leads, leadsHoy, leadsEsteMes, topDestinos, stockBajo] = await Promise.all([
        pool.query(`SELECT COUNT(*) as total,
          SUM(habitaciones_disponibles) as disponibles,
          SUM(CASE WHEN habitaciones_disponibles = 0 THEN 1 ELSE 0 END) as agotados,
          COUNT(DISTINCT destino) as destinos
          FROM bloqueos WHERE estado = 'Activo' AND fecha_inicio >= $1`, [today]),
        pool.query(`SELECT COUNT(*) as total FROM leads`),
        pool.query(`SELECT COUNT(*) as total FROM leads WHERE DATE(created_at) = $1`, [today]),
        pool.query(`SELECT COUNT(*) as total FROM leads WHERE created_at >= $1`, [monthStart]),
        pool.query(`SELECT destino, COUNT(*) as bloqueos, SUM(habitaciones_disponibles) as disponibles
          FROM bloqueos WHERE estado = 'Activo' AND fecha_inicio >= $1
          GROUP BY destino ORDER BY bloqueos DESC LIMIT 7`, [today]),
        pool.query(`SELECT hotel, destino, habitaciones_disponibles, fecha_inicio as check_in
          FROM bloqueos WHERE estado = 'Activo' AND habitaciones_disponibles <= 3 AND fecha_inicio >= $1
          ORDER BY habitaciones_disponibles ASC, fecha_inicio ASC LIMIT 10`, [today]),
      ]);

      res.json({
        inventario: {
          totalBloqueos: parseInt(bloqueos.rows[0].total),
          habitacionesDisponibles: parseInt(bloqueos.rows[0].disponibles || 0),
          bloqueoAgotados: parseInt(bloqueos.rows[0].agotados),
          destinosActivos: parseInt(bloqueos.rows[0].destinos),
        },
        leads: {
          total: parseInt(leads.rows[0].total),
          hoy: parseInt(leadsHoy.rows[0].total),
          esteMes: parseInt(leadsEsteMes.rows[0].total),
        },
        reservas: { total: 0, pendientes: 0, confirmadas: 0, montoConfirmadoMes: 0 },
        topDestinos: topDestinos.rows,
        stockBajo: stockBajo.rows,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });


  return httpServer;
}
