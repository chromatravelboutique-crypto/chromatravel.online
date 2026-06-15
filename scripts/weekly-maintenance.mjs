#!/usr/bin/env node
/**
 * MANTENIMIENTO SEMANAL — chromatravel.online + fenixtraveler.com
 * Uso: node scripts/weekly-maintenance.mjs [--week N]
 *
 * Ejecuta los 5 pasos del plan de mantenimiento y genera reporte.
 */
import { execSync } from "child_process";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// ── Configuración ────────────────────────────────────────────────────────────
const PROD_URL     = "https://chromatravel.online";
const FENIX_URL    = "https://fenixtraveler.com";
const WEEK_NUMBER  = parseInt(process.argv.find(a => a.startsWith("--week="))?.split("=")[1] || String(getISOWeek(new Date())));
const IS_ODD_WEEK  = WEEK_NUMBER % 2 !== 0;
const TODAY        = new Date().toISOString().slice(0, 10);
const REPORT_PATH  = join(ROOT, "reports", `REPORTE-SEMANAL-${TODAY}.md`);

function getISOWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

async function timedFetch(url, opts = {}) {
  const t0 = Date.now();
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000), ...opts });
    const ms = Date.now() - t0;
    const body = await res.json().catch(() => null);
    return { ok: res.ok, status: res.status, ms, body };
  } catch (err) {
    return { ok: false, status: 0, ms: Date.now() - t0, error: err.message };
  }
}

// ── PASO 1: Salud del sistema ────────────────────────────────────────────────
async function checkHealth() {
  console.log("\n🔍 PASO 1: Auditoría de salud...");
  const results = {};

  for (const [name, url] of [["chroma", PROD_URL], ["fenix", FENIX_URL]]) {
    const health = await timedFetch(`${url}/api/health`);
    const bloqueos = await timedFetch(`${url}/api/paquetes-bloqueos?limit=1`);
    results[name] = {
      healthOk:   health.ok && health.body?.status === "ok",
      healthMs:   health.ms,
      bloqueosOk: bloqueos.ok,
      bloqueosMs: bloqueos.ms,
    };
    const hIcon = results[name].healthOk ? "✅" : "❌";
    const bIcon = results[name].bloqueosOk ? "✅" : "❌";
    const hWarn = health.ms > 2000 ? " ⚠️ LENTO" : "";
    const bWarn = bloqueos.ms > 2000 ? " ⚠️ LENTO" : "";
    console.log(`  ${name}: health ${hIcon} ${health.ms}ms${hWarn} | bloqueos ${bIcon} ${bloqueos.ms}ms${bWarn}`);
  }
  return results;
}

// ── PASO 3: Leads calientes ──────────────────────────────────────────────────
async function checkHotLeads() {
  console.log("\n🔥 PASO 3: Leads calientes (requiere auth — verificar en dashboard)...");
  return [];
}

// ── PASO 4: Stock bajo ───────────────────────────────────────────────────────
async function checkLowStock() {
  console.log("\n📦 PASO 4: Stock bajo (verificar en /admin/inventory)...");
  return [];
}

// ── PASO 2: Blog SEO ─────────────────────────────────────────────────────────
function getBlogTopic() {
  const fenixTopics = [
    { topic: "Luna de miel en el Caribe Mexicano: los resorts más románticos para parejas en 2026", keywords: ["luna de miel Cancún", "hoteles románticos Riviera Maya", "viaje de bodas México", "resort all-inclusive pareja", "agencia viajes Morelia luna de miel"] },
    { topic: "Viajes grupales corporativos a Los Cabos: incentivos y team building 2026", keywords: ["viajes grupales Los Cabos", "incentivos corporativos México", "team building playas", "agencia viajes grupos Morelia"] },
    { topic: "Top 10 experiencias de lujo en la Riviera Maya para viajeros premium", keywords: ["lujo Riviera Maya", "experiencias exclusivas México", "viajes premium Michoacán", "hoteles 5 estrellas Tulum"] },
    { topic: "Guía definitiva para planear una boda en destino en Cancún 2026-2027", keywords: ["boda en destino Cancún", "wedding planner México", "bodas playa Riviera Maya", "agencia bodas Morelia"] },
    { topic: "Temporada alta vs baja: cuándo viajar a México para ahorrar sin sacrificar lujo", keywords: ["temporada baja viajes México", "mejores épocas viajar Cancún", "ofertas vuelos playa Morelia"] },
  ];
  const chromaTopics = [
    { topic: "Destinos LGBT+ friendly en México: guía completa para viajar seguro y celebrar", keywords: ["destinos LGBT México", "viajes gay friendly", "turismo inclusivo", "hoteles LGBT Cancún", "Chroma Travel"] },
    { topic: "Puerto Vallarta gay friendly 2026: la guía que nadie más te da", keywords: ["Puerto Vallarta gay", "zona romántica Puerto Vallarta", "viajes LGBT Puerto Vallarta", "agencia viajes LGBT México"] },
    { topic: "Cómo elegir una agencia de viajes LGBT+ friendly: 7 señales de que estás en el lugar correcto", keywords: ["agencia viajes LGBT", "turismo inclusivo México", "viajes seguros comunidad LGBT", "Chroma Travel Morelia"] },
    { topic: "Cruceros gay friendly en el Caribe 2026: temporadas, líneas y cabinas ideales", keywords: ["cruceros gay Caribe", "viajes LGBT crucero", "Celebrity Edge LGBT", "agencia cruceros inclusivos"] },
  ];

  const topics = IS_ODD_WEEK ? fenixTopics : chromaTopics;
  const idx = (Math.floor(WEEK_NUMBER / 2)) % topics.length;
  return topics[idx];
}

async function generateBlogPost() {
  console.log(`\n📝 PASO 2: Blog SEO (semana ${WEEK_NUMBER} — ${IS_ODD_WEEK ? "Fénix" : "Chroma"})...`);
  const { topic, keywords } = getBlogTopic();
  console.log(`  Tema: "${topic}"`);
  console.log(`  Keywords: ${keywords.join(", ")}`);
  console.log(`  → Para generar: POST /api/admin/blog/generate con estos datos`);
  console.log(`  → O usar AdminBlogGenerator en /admin/blog/nuevo`);
  return { topic, keywords };
}

// ── REPORTE FINAL ────────────────────────────────────────────────────────────
async function generateReport(health, blogInfo) {
  const allHealthy = Object.values(health).every(h => h.healthOk && h.bloqueosOk);
  const systemStatus = allHealthy ? "🟢 OK" : "🔴 ATENCIÓN REQUERIDA";

  const chromaH = health.chroma || {};
  const fenixH  = health.fenix  || {};

  const warnings = [];
  if (!chromaH.healthOk)  warnings.push("chromatravel.online no responde al health check");
  if (!fenixH.healthOk)   warnings.push("fenixtraveler.com no responde al health check");
  if (chromaH.healthMs > 2000) warnings.push(`chromatravel.online lento: ${chromaH.healthMs}ms`);
  if (fenixH.healthMs > 2000)  warnings.push(`fenixtraveler.com lento: ${fenixH.healthMs}ms`);
  if (!chromaH.bloqueosOk) warnings.push("Endpoint /api/paquetes-bloqueos no responde en Chroma");
  if (!fenixH.bloqueosOk)  warnings.push("Endpoint /api/paquetes-bloqueos no responde en Fénix");

  const content = `# Reporte Semanal — ${TODAY}
Semana ${WEEK_NUMBER} | Generado automáticamente por scripts/weekly-maintenance.mjs

## ${systemStatus}

### 🌐 Salud de los Servidores
| Sitio | Health | Tiempo | Bloqueos API | Tiempo |
|-------|--------|--------|-------------|--------|
| chromatravel.online | ${chromaH.healthOk ? "✅ OK" : "❌ FALLA"} | ${chromaH.healthMs}ms | ${chromaH.bloqueosOk ? "✅ OK" : "❌ FALLA"} | ${chromaH.bloqueosMs}ms |
| fenixtraveler.com | ${fenixH.healthOk ? "✅ OK" : "❌ FALLA"} | ${fenixH.healthMs}ms | ${fenixH.bloqueosOk ? "✅ OK" : "❌ FALLA"} | ${fenixH.bloqueosMs}ms |

### 📊 Negocio Esta Semana
> Verificar manualmente en Railway dashboard o GET /api/admin/stats/multi-brand
- Leads nuevos: —
- Reservas nuevas: —
- Ingresos estimados: —
- Suscriptores newsletter: —

### 🔥 Leads Calientes
> Verificar en /dashboard → "Leads Calientes 🔥" o GET /api/admin/leads/hot

### 📦 Stock Bajo
> Verificar en /admin/inventory — filtrar habitaciones_disponibles <= 3

### ⚠️ Atención Requerida
${warnings.length === 0 ? "- Ninguna" : warnings.map(w => `- ${w}`).join("\n")}

### 📝 Contenido Esta Semana
- **Blog programado (${IS_ODD_WEEK ? "Fénix Traveler" : "Chroma Travel"}):**
  - Tema: "${blogInfo.topic}"
  - Keywords: ${blogInfo.keywords.join(", ")}
  - Estado: Pendiente generar en /admin/blog/nuevo

### 🎯 Próxima Semana (Semana ${WEEK_NUMBER + 1})
- Blog ${(WEEK_NUMBER + 1) % 2 !== 0 ? "Fénix Traveler" : "Chroma Travel"}
- Mejora incremental: ${["Performance", "SEO", "CRM", "Seguridad"][WEEK_NUMBER % 4]}
- Revisión de campaignLogs y tasa de entrega

---
*Generado por scripts/weekly-maintenance.mjs — ${new Date().toISOString()}*
`;

  mkdirSync(join(ROOT, "reports"), { recursive: true });
  writeFileSync(REPORT_PATH, content, "utf-8");
  console.log(`\n📋 Reporte guardado en: reports/REPORTE-SEMANAL-${TODAY}.md`);
  return content;
}

// ── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n${"=".repeat(50)}`);
  console.log(`MANTENIMIENTO SEMANAL — Semana ${WEEK_NUMBER} — ${TODAY}`);
  console.log(`Marca del blog: ${IS_ODD_WEEK ? "Fénix Traveler" : "Chroma Travel"}`);
  console.log("=".repeat(50));

  const health  = await checkHealth();
  const blog    = await generateBlogPost();
  await checkHotLeads();
  await checkLowStock();
  const report  = await generateReport(health, blog);

  console.log("\n" + "=".repeat(50));
  console.log("RESUMEN EJECUTIVO:");
  console.log(report.split("\n").slice(0, 20).join("\n"));
  console.log("=".repeat(50) + "\n");
}

main().catch(err => { console.error("Error:", err); process.exit(1); });
