# AUDITORÍA COMPLETA — Chroma Travel + Fénix Traveler — 2026-06-15

Auditoría realizada en modo READ ONLY con 6 agentes paralelos.
Ningún archivo fue modificado durante este proceso.
Rama auditada: `claude/setup-chromatravel-crypto-8Z524`

---

## SCORE GENERAL

| Área | Score | Notas |
|---|---|---|
| Arquitectura | 74/100 | Multi-tenant bien diseñado; monolito routes.ts de 3,989 líneas |
| Código | 71/100 | Funcional, TypeScript limpio, deuda técnica visible |
| SEO | 38/100 | Meta tags client-side only; Fénix invisible para crawlers |
| Performance | 45/100 | Bundle 73MB, sin code splitting, Three.js en todas las páginas |
| Seguridad | 62/100 | bcrypt ok, rate limit ok; sin CORS, sin CSP, password hardcodeado |
| UX | 65/100 | Cotizador funcional; deposit display correcto; bugs menores |
| Negocio | 78/100 | Modelo claro, inventario real activo, bloqueos + Clip operativos |
| Monetización | 55/100 | Bloqueos activos; afiliados configurados; automatización sin enviar |
| Escalabilidad | 61/100 | Pool per-request, filtrado en memoria, sin Redis |
| CRM | 45/100 | Estructura completa, ejecución de envíos inexistente |
| Automatización | 22/100 | 5 automaciones codificadas, 0 envíos reales despachados |

---

## HALLAZGOS CRÍTICOS

Problemas que rompen producción o afectan ingresos directamente hoy.

---

### H-01 — Fénix Traveler invisible para Google

**Qué:** Los meta tags (title, description, og:*, canonical) se inyectan vía JavaScript en `SEOHead.tsx`. El archivo `client/index.html` tiene hardcodeado el canonical de Chroma y los meta de Chroma como fallback estático. Los crawlers que no ejecutan JS (y Google no siempre lo hace) solo ven la versión Chroma en `fenixtraveler.com`.

**Dónde:** `client/index.html` (todo el archivo) y `client/src/components/seo-head.tsx`

**Código problemático en index.html:**
```html
<link rel="canonical" href="https://www.chromatravel.online">
<meta name="description" content="[descripción Chroma hardcodeada]">
<meta property="og:title" content="Chroma Travel | ...">
```

**Impacto:** Fénix Traveler no puede posicionarse en Google. Todo el tráfico orgánico que debería ir a `fenixtraveler.com` llega a `chromatravel.online` o no llega a ninguna.

**Solución propuesta:** Implementar SSR para el `<head>` en Express — enviar el HTML con los meta tags correctos según el brand (`req.brand`) antes de que llegue al cliente. Alternativa rápida: middleware Express que reescriba el `<head>` del HTML estático con los valores correctos por dominio.

---

### H-02 — Links mailto rotos en Política de Privacidad

**Qué:** Dos instancias de `href="mailto:{brandEmail}"` con llaves literales — no es una expresión JSX interpolada. El link abre `mailto:{brandEmail}` literalmente, no el email real.

**Dónde:** `client/src/pages/privacy-policy.tsx` líneas 149 y 187

**Código actual:**
```jsx
<a href="mailto:{brandEmail}" ...>{brandEmail}</a>
```

**Código correcto (como lo hacen otras páginas):**
```jsx
<a href={`mailto:${brandEmail}`} ...>{brandEmail}</a>
```

**Impacto:** Los visitantes no pueden contactar a la agencia desde la página legal. Afecta confianza y cumplimiento legal.

**Solución:** Cambiar comillas dobles por backticks y agregar `${}` en ambas líneas.

---

### H-03 — WhatsApp bot falla en segundo mensaje del mismo número

**Qué:** El bot crea leads con email `wa_{phone}@placeholder.com`. Si el mismo número de WhatsApp envía un segundo mensaje en una conversación nueva, el sistema intenta crear un segundo usuario con el mismo email — falla por el constraint `UNIQUE` en `users.email`.

**Dónde:** `server/services/crm/whatsapp-sales.service.ts` — función `createLeadFromConversation()` (línea ~295)

**Código problemático:**
```typescript
email: `wa_${phoneNumber.replace(/[^0-9]/g, '')}@placeholder.com`
```

**Impacto:** El bot de WhatsApp crashea silenciosamente para cualquier número que haya contactado antes. Leads se pierden.

**Solución:** Verificar existencia por teléfono antes de crear; actualizar lead existente en lugar de insertar.

---

### H-04 — Métricas de reservas hardcodeadas en cero en el ERP

**Qué:** El endpoint principal del dashboard ERP (`/api/admin/metrics`) retorna siempre `reservas: { total: 0, pendientes: 0, confirmadas: 0, montoConfirmadoMes: 0 }` sin consultar la base de datos.

**Dónde:** `server/routes.ts` — aproximadamente línea 1787 (endpoint `GET /api/admin/metrics`)

**Código problemático:**
```typescript
reservas: {
  total: 0,
  pendientes: 0,
  confirmadas: 0,
  montoConfirmadoMes: 0
}
```

**Impacto:** El panel de administración no refleja ventas reales. Decisiones de negocio basadas en datos incorrectos.

**Solución:** Reemplazar con query real a la tabla `reservas` usando `getPool()`.

---

### H-05 — `/api/calculate-deposit` retorna porcentajes incorrectos

**Qué:** Existen 3 implementaciones de cálculo de depósito con thresholds distintos. El endpoint público `/api/calculate-deposit` (en `ota-b2c-routes.ts`) usa un esquema completamente diferente al booking real.

**Dónde:**
- Endpoint público: `server/ota-b2c-routes.ts` — función `calculateDepositRules()`
- Booking real: `server/routes.ts` — función `serverGetDeposit()`

**Comparación:**

| Días al check-in | `/api/calculate-deposit` | Booking real |
|---|---|---|
| < 20 días | 100% | 100% (≤10 días) |
| 20-45 días | 40% | 70% (≤24 días) |
| > 45 días | 20% | 50% (≤89 días) |
| — | — | 30% (>89 días) |

**Impacto:** Clientes o integraciones que consultan el endpoint de depósito reciben información incorrecta. La CLAUDE.md también documenta un cuarto esquema diferente.

**Solución:** Unificar en una sola función en `shared/` y usarla en ambos lugares. Actualizar CLAUDE.md.

---

### H-06 — `new Pool()` por cada request en endpoints admin (riesgo de crash)

**Qué:** Cuatro endpoints admin en `routes.ts` crean una nueva instancia de `pg.Pool` por cada request HTTP y la destruyen al terminar. Esto evita el pool compartido (`getPool()`) y puede agotar conexiones de PostgreSQL bajo carga.

**Dónde:** `server/routes.ts` — endpoints:
- `GET /api/admin/bloqueos`
- `GET /api/admin/bloqueos/hotels`
- `GET /api/admin/audit-logs`
- `GET /api/admin/lead-history/:leadId`

**Código problemático (patrón repetido):**
```typescript
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const result = await pool.query(...);
await pool.end();
```

**Impacto:** En producción bajo carga, Neon PostgreSQL tiene límite de conexiones simultáneas. Crear/destruir pools por request puede alcanzar ese límite y hacer caer la app.

**Solución:** Reemplazar con `const pool = getPool(); if (!pool) return res.status(503)...`

---

### H-07 — Todas las automaciones CRM son stubs sin despacho real

**Qué:** Las 5 automaciones de `automation.service.ts` y el ejecutor de campañas `executeCampaign()` solo insertan registros en `campaignLogs` con `status: "pending"`. Ninguna llama a Twilio ni a Nodemailer. Los mensajes nunca se envían.

**Dónde:**
- `server/services/crm/automation.service.ts` — métodos `sendBirthdayMessages`, `followUpColdLeads`, `winbackInactiveCustomers`, `sendUpcomingTripReminders`, `requestReviews`
- `server/services/crm/campaign.service.ts` — método `executeCampaign()`

**Impacto:** El CRM completo (cumpleaños, seguimiento de leads, winback, recordatorios de viaje, solicitudes de reseña) está arquitectonicamente completo pero funcionalmente inoperante. Cero automatización real.

**Solución:** Implementar un worker (job de cron o background task) que lea `campaignLogs` con `status: "pending"` y los despache via `sendWhatsAppMessage()` o `sendCrmEmail()` según el `channel`.

---

### H-08 — Sitemap genera URLs que dan 404

**Qué:** El sitemap dinámico genera URLs en español (`/destinos/:slug`, `/hoteles/:id`) pero el router de React (Wouter en `App.tsx`) usa rutas en inglés (`/destinations/:id`, `/hotels/:id`).

**Dónde:** `server/seo-routes.ts` líneas 197 y 258

**Impacto:** Googlebot sigue los links del sitemap y recibe 404. Las páginas de hoteles y destinos no se indexan. Penalización de SEO directa.

**Solución:** Actualizar `seo-routes.ts` para usar los mismos paths que `App.tsx` (`/hotels/` y `/destinations/`).

---

### H-09 — Bundle de producción: 73MB sin code splitting

**Qué:** El build de producción (`dist/`) pesa 73MB. No hay `manualChunks` en `vite.config.ts`, no hay `React.lazy()` en ninguno de los 138 archivos `.tsx`, y Three.js (`@react-three/fiber`, `@react-three/drei`, `three`) se importa en `navigation.tsx` — cargándose en absolutamente todas las páginas.

**Dónde:**
- `vite.config.ts` — sin `rollupOptions.output.manualChunks`
- `client/src/components/navigation.tsx` — importa Three.js WebGL components
- 138 archivos `.tsx` — ninguno usa `React.lazy()` o `<Suspense>`

**Impacto:** First Load Time muy alto. Los usuarios en móviles o conexiones lentas ven la página cargando durante segundos. Core Web Vitals (LCP) degradado. Puede afectar posicionamiento SEO.

**Solución:** Lazy load Three.js (solo se usa en hero visual); code splitting por sección (dashboard, admin, public).

---

## HALLAZGOS MEDIOS

Problemas que afectan calidad, conversiones o mantenibilidad.

---

### H-10 — `requireAdmin` duplicado en ota-b2c-routes.ts

**Qué:** `ota-b2c-routes.ts` define su propio middleware `requireAdmin` local (líneas 37-41) que solo verifica `role === 'admin'`. No importa de `server/auth-middleware.ts`. Si la lógica de auth cambia en el archivo central, esta copia no se actualiza.

**Dónde:** `server/ota-b2c-routes.ts` líneas 37-41

**Impacto:** Divergencia silenciosa de auth. Si se agrega 2FA o logging de accesos en `auth-middleware.ts`, los endpoints de `ota-b2c-routes.ts` no lo tendrán.

**Solución:** Importar y usar `requireAdmin` de `server/auth-middleware.ts`.

---

### H-11 — PayPal no eliminado completamente (3 lugares)

**Qué:** El commit `3dd1196` ("quitar PayPal") no completó la eliminación. PayPal persiste en:
1. `package.json` — `@paypal/paypal-server-sdk ^2.1.0` en dependencies
2. `shared/schema.ts` — columnas `paypalOrderId`, `paypalCaptureId`, `paypalPayerId` en tabla `payments`; campo `method` con default `"paypal"`
3. `server/services/crm/payment-processing.service.ts:77` — `paypalOrderId: chargeId`
4. `shared/schema.ts` — `reservas.paymentMethod` acepta `"paypal"` como valor válido

**Impacto:** Superficie de ataque innecesaria, bundle más pesado, datos inconsistentes (nuevos pagos se registran con method "paypal" aunque paguen con Clip).

**Solución:** Remover SDK de package.json; cambiar default de `payments.method` a `"clip"`; remover columnas PayPal o mantenerlas como nullable legacy.

---

### H-12 — seed-brands.ts nunca actualiza datos de marca después de primera inserción

**Qué:** `seedBrands()` usa `if (existing.length === 0)` para decidir si insertar. Si la marca ya existe, no actualiza ningún dato. Los números de WhatsApp placeholder (`+525512345678`, `+525598765432`) y el logo `kueani-logo.png` de Chroma persisten para siempre a menos que se borre la fila manualmente.

**Dónde:** `server/seed-brands.ts` — lógica de upsert en la función principal

**Datos placeholder activos en producción:**
```
Chroma WhatsApp: +525512345678 (falso)
Fénix WhatsApp: +525598765432 (falso)
Chroma logo: /assets/kueani-logo.png (nombre incorrecto)
```

**Impacto:** Usuarios que intentan contactar por WhatsApp desde la web llegarán a números incorrectos.

**Solución:** Cambiar a UPSERT que actualice los campos de contacto, o mejor, leer estos datos de variables de entorno.

---

### H-13 — Sin CORS configurado

**Qué:** No se encontró ningún middleware de CORS en todo el servidor. Express sin configuración CORS explícita rechaza requests cross-origin por defecto para algunos métodos, pero podría permitir otros sin intención.

**Dónde:** `server/index.ts` — sin `app.use(cors(...))`

**Impacto:** Si en el futuro se integra un frontend externo, widget embebido o app móvil que haga fetch a la API, los requests serán bloqueados o permitidos de forma impredecible.

**Solución:** Agregar `cors` package con lista blanca de dominios permitidos (`chromatravel.online`, `fenixtraveler.com`).

---

### H-14 — Sin Content Security Policy (CSP)

**Qué:** `index.html` tiene un comentario: `<!-- CSP will be added when HTTPS is configured -->`. HTTPS está configurado (Cloudflare + Railway). La CSP nunca se implementó.

**Dónde:** `client/index.html` (comentario en el archivo)

**Impacto:** Sin CSP, cualquier XSS exitoso puede inyectar scripts arbitrarios. El blog acepta contenido Markdown que se renderiza — vector potencial.

**Solución:** Agregar header `Content-Security-Policy` en Express o vía Cloudflare. Configuración mínima: `default-src 'self'; script-src 'self' 'unsafe-inline' googletagmanager.com`.

---

### H-15 — `import.service.ts:131` guarda `tempPassword` posiblemente sin hash

**Qué:** En el servicio de importación de CRM, `tempPassword` se asigna en línea 131 y se escribe al objeto. No está claro si pasa por `bcrypt.hash()` antes de insertarse en la tabla `users`.

**Dónde:** `server/services/crm/import.service.ts` línea 131

**Código identificado:**
```typescript
password: tempPassword,  // sin hash aparente
```

**Impacto:** Si la contraseña temporal se guarda en plaintext en la base de datos, cualquier dump de DB expone todas las contraseñas importadas.

**Solución:** Verificar y asegurar que toda inserción en `users.password` pase por `bcrypt.hash(password, 10)`.

---

### H-16 — Social share iFrame hardcodea branding de Chroma

**Qué:** El endpoint que genera la previsualización OG social share renderiza HTML con `chromatravel.online · Tarifas Negociadas Exclusivas` hardcodeado aunque el bloqueo pertenezca a Fénix.

**Dónde:** `server/ota-b2c-routes.ts` línea ~742

**Código problemático:**
```html
<div class="brand">chromatravel.online · Tarifas Negociadas Exclusivas</div>
```

**Impacto:** Cuando Fénix comparte un bloqueo en redes sociales, la preview muestra marca Chroma. Confusión de marca.

**Solución:** Usar `req.brand.domain` y `req.brand.name` en lugar de strings hardcodeados.

---

### H-17 — `brand_id` tipo incorrecto en seed-bloqueos-fenix.ts

**Qué:** La interfaz `BloqueoGroup` en el seed declara `brand_id: number | null` pero el campo real en la base de datos es `VARCHAR` (UUID generado por `gen_random_uuid()`).

**Dónde:** `server/seed-bloqueos-fenix.ts` — interfaz `BloqueoGroup`

**Impacto:** El seed puede insertar `brand_id` como número entero 0 o undefined cuando debería ser un UUID. Los filtros por marca en los bloqueos de Fénix podrían fallar.

**Solución:** Cambiar la declaración a `brand_id: string | null`.

---

### H-18 — `getSegmentCustomers()` carga toda la tabla users en memoria

**Qué:** El servicio de campañas obtiene todos los usuarios de una marca con un JOIN y luego filtra en JavaScript con `.filter()`. No usa cláusulas WHERE en SQL para filtrar por consentimiento, tier, bookings, etc.

**Dónde:** `server/services/crm/campaign.service.ts` — función `getSegmentCustomers()`

**Impacto:** Con 1,000+ usuarios, este método carga todos los registros en memoria Node.js. Con 10,000+ usuarios puede causar OOM o timeouts.

**Solución:** Trasladar los filtros a SQL con WHERE clauses dinámicas. Agregar LIMIT/OFFSET para paginación.

---

### H-19 — `campaignLogs` sin `campaignId` en automaciones

**Qué:** Todos los inserts a `campaign_logs` en `automation.service.ts` omiten el campo `campaignId`. Los logs quedan registrados pero sin asociación a ninguna campaña, haciendo imposible el tracking de conversiones por campaña.

**Dónde:** `server/services/crm/automation.service.ts` — todos los métodos

**Impacto:** El sistema de tracking de campañas (`sentCount`, `deliveredCount`, `convertedCount`) en la tabla `campaigns` nunca se actualiza para automaciones. Métricas de CRM incorrectas.

**Solución:** Crear una "campaña automática" por cada tipo de automatización, o generar un `campaignId` temporal para tracking.

---

### H-20 — `db` importado directamente en seo-routes.ts y seed-brands.ts

**Qué:** Dos archivos importan `db` directamente en lugar de usar `getDb()` como establece CLAUDE.md. Si `DATABASE_URL` no está configurado, `db` es `null` y el código puede fallar silenciosamente.

**Dónde:**
- `server/seo-routes.ts` línea 2: `import { db } from "./db"`
- `server/seed-brands.ts` línea 1: `import { db } from "./db"`

**Impacto:** En modo sin base de datos, estas rutas pueden retornar errores inesperados en lugar del fallback graceful que ofrece `getDb()`.

**Solución:** Reemplazar con `getDb()` y envolver en try/catch.

---

### H-21 — `SearchAction` de Schema.org apunta a `/buscar` inexistente

**Qué:** El endpoint `/api/schema/travel-agency` en `seo-routes.ts` genera un Schema.org `SearchAction` que apunta a `/buscar?q={search_term_string}` pero esa ruta no existe en `App.tsx`.

**Dónde:** `server/seo-routes.ts` — función `generateTravelAgencySchema()`

**Impacto:** Google puede mostrar un sitelink de búsqueda en los resultados, pero al hacer clic, el usuario llega a una página 404.

**Solución:** Crear la ruta `/buscar` en el frontend, o cambiar el Schema.org a `/hotels?q=` que sí existe.

---

### H-22 — Google Analytics, AdSense y Metricool hardcodeados en index.html

**Qué:** `client/index.html` tiene IDs de tracking hardcodeados que aplican a ambas marcas sin diferenciación:
- Google Analytics: `G-P2MTNY41BQ`
- AdSense: `ca-pub-9377043040912794`
- Metricool: `fdeda5c83611e34c4c6473b79098a2de`

**Dónde:** `client/index.html` — sección `<head>`

**Impacto:** Ambas marcas comparten el mismo GA4 property, mezclando métricas de Chroma y Fénix. No es posible separar analytics por marca.

**Solución:** Mover IDs de tracking a `req.brand.googleAnalyticsId` (ya existe en el schema de brands) e inyectarlos server-side, o usar `VITE_GA_ID` por marca.

---

### H-23 — Node 20 en nixpacks vs Node 22 en .nvmrc

**Qué:** `nixpacks.toml` instala `nodejs_20` pero `.nvmrc` especifica `22.12.0`. En Railway se ejecuta Node 20; en desarrollo local (si se usa nvm) se usa Node 22.

**Dónde:** `nixpacks.toml` línea `nixPkgs = ["nodejs_20", ...]` vs `.nvmrc`

**Impacto:** Diferencias de comportamiento entre entorno local y producción. Posibles incompatibilidades con packages que requieren Node 22.

**Solución:** Actualizar `nixpacks.toml` a `nodejs_22`.

---

### H-24 — Password admin hardcodeado como fallback

**Qué:** `seed-brands.ts` usa `process.env.ADMIN_PASSWORD || "ChromaAdmin2024!"`. Si `ADMIN_PASSWORD` no está configurado en Railway, la contraseña de producción es `ChromaAdmin2024!` — visible en el código fuente del repositorio.

**Dónde:** `server/seed-brands.ts` línea 219

**Impacto:** Si alguien con acceso al repo (GitHub) conoce este fallback y `ADMIN_PASSWORD` no está configurado, puede acceder al panel admin de producción.

**Solución:** Remover el fallback. Hacer que el seed falle explícitamente si `ADMIN_PASSWORD` no está configurado en producción.

---

### H-25 — `sanitizeInput()` no aplicada universalmente

**Qué:** La función `sanitizeInput()` se aplica solo a 3 campos en `routes.ts` (name, phone, comments en leads/reservas). Otros endpoints que reciben texto libre (blog, campañas, WhatsApp templates) no sanitizan.

**Dónde:** `server/routes.ts` líneas 675-678 y 1279-1280

**Impacto:** Posible inyección de HTML/scripts en campos no sanitizados que luego se muestran en el admin o en emails.

**Solución:** Centralizar la sanitización en un middleware que aplique a todos los requests, o crear un helper que se use consistentemente en todos los endpoints de creación.

---

### H-26 — WhatsApp bot no diferencia respuestas por marca

**Qué:** Las respuestas del bot de WhatsApp son genéricas para ambas marcas. El `SALES_SYSTEM_PROMPT` no incluye diferenciación Chroma (LGBT+, inclusivo) vs Fénix (premium, lujo).

**Dónde:** `server/services/crm/whatsapp-sales.service.ts` — constante `SALES_SYSTEM_PROMPT`

**Impacto:** Un cliente de Fénix Traveler recibe respuestas con tono de Chroma Travel (o viceversa). Inconsistencia de marca en el principal canal de ventas.

**Solución:** Inyectar `brand.name`, `brand.tagline` y `brand.lgbtFocused` en el system prompt, diferenciando el tono por marca.

---

### H-27 — Variables de entorno no documentadas en RAILWAY.md

**Qué:** La auditoría encontró variables de entorno usadas en el código que no están en `RAILWAY.md`:

```bash
FACEBOOK_FENIX_ACCESS_TOKEN
FACEBOOK_CHROMA_ACCESS_TOKEN
FACEBOOK_FENIX_PAGE_ID
FACEBOOK_CHROMA_PAGE_ID
METRICOOL_API_KEY
METRICOOL_ENABLED
FENIX_EMAIL / FENIX_EMAIL_PASSWORD
CHROMA_EMAIL / CHROMA_EMAIL_PASSWORD
TWILIO_FENIX_WHATSAPP
TWILIO_CHROMA_WHATSAPP
AI_PROVIDER / AI_ENABLED
DEFAULT_BRAND_ID
CLEANUP_DAYS_AHEAD
HOLD_EXPIRY_MINUTES
VITE_ADSENSE_CLIENT_ID / VITE_ADSENSE_SLOT_*
VITE_AMAZON_AFFILIATE_TAG
RSS_FENIX_URL / RSS_CHROMA_URL
```

**Impacto:** En un nuevo deploy o al incorporar a otro desarrollador, estas features fallan silenciosamente sin documentación de las variables requeridas.

**Solución:** Agregar todas las variables a `RAILWAY.md` con descripción y si son requeridas u opcionales.

---

## HALLAZGOS BAJOS

Deuda técnica, documentación incorrecta, duplicados, código muerto.

---

### H-28 — `AdminMetrics` importado sin ruta registrada

**Qué:** `App.tsx` importa `AdminMetrics` en la línea 43 pero no existe ningún `<Route path="/admin/metrics">` en el Router. El componente es código muerto.

**Dónde:** `client/src/App.tsx` línea 43

**Solución:** Agregar `<Route path="/admin/metrics" component={AdminMetrics} />` o eliminar el import.

---

### H-29 — `scoreLeadData()` definido inline en routes.ts

**Qué:** La función de scoring de leads (153+ líneas) está definida directamente en `routes.ts` en lugar de en `server/services/crm/` o un archivo dedicado. Contribuye al monolito de 3,989 líneas.

**Dónde:** `server/routes.ts` — primeras líneas del archivo

**Solución:** Extraer a `server/services/crm/lead-scoring.service.ts`.

---

### H-30 — Archivo huérfano `admin/dashboard.tsx` (minúsculas)

**Qué:** Existe `client/src/pages/admin/dashboard.tsx` (directorio con minúscula `admin`) que no está importado en `App.tsx`. El directorio de admin funcional es `Admin/` (mayúscula). El archivo en minúsculas es código muerto.

**Dónde:** `client/src/pages/admin/dashboard.tsx`

**Solución:** Verificar si tiene código útil; si no, eliminar.

---

### H-31 — Comentario incorrecto en loyalty service: "USD" vs "MXN"

**Qué:** El comentario en `loyalty/index.ts` dice "1 point per $1 USD spent" pero el sistema opera completamente en MXN. Cualquier integración que confíe en ese comentario calculará mal los puntos.

**Dónde:** `server/services/loyalty/index.ts` líneas 1-15 (bloque de comentario)

**Solución:** Cambiar a "1 punto por cada $1 MXN" o aclarar la tasa de conversión USD/MXN usada.

---

### H-32 — Typo en nombre de archivo de blog

**Qué:** Un archivo markdown tiene "stavle" en su nombre, probablemente debería decir "stable" o "stavel" (variación del nombre de marca).

**Dónde:** `posts/por-que-confiar-agencia-viajes-stavle-chroma-travel.md`

**Solución:** Renombrar el archivo y actualizar referencias en sitemap/blog si existen.

---

### H-33 — Los 7 artículos de blog son solo contenido LGBT+/Chroma

**Qué:** Todos los artículos en `/posts/` son sobre turismo LGBT+ y mencionan Chroma Travel. Fénix Traveler no tiene ningún artículo en markdown para posicionamiento SEO de lujo/premium.

**Dónde:** `posts/` — los 7 archivos

**Solución:** Crear artículos para Fénix: "viajes de lujo en México", "hoteles premium Xcaret", "bodas en destinos de playa", etc.

---

### H-34 — Dos sistemas de tiers paralelos sin documentación clara

**Qué:** Existen dos sistemas de tiers distintos:
1. **Booking tier** (en pricing-engine.ts): BASICO/MEDIO/PREMIUM por `tarifaNeta` — determina MSI y % de Fénix Points por reserva
2. **Loyalty tier** (en loyalty/index.ts): Bronce/Plata/Oro/Platino/Diamante por puntos acumulados — determina descuentos y multiplicadores

No está documentado cómo interactúan entre sí.

**Dónde:** `shared/pricing-engine.ts` y `server/services/loyalty/index.ts`

**Solución:** Documentar la relación en CLAUDE.md. Los dos sistemas son complementarios (uno determina puntos ganados, el otro los beneficios de niveles acumulados).

---

### H-35 — CLAUDE.md documenta deposit thresholds incorrectos

**Qué:** CLAUDE.md dice que el depósito es ">60 días → 30%, 30-60 días → 50%, <30 días → 100%". El código real en `routes.ts` usa: ≤10 días=100%, ≤24 días=70%, ≤89 días=50%, >89 días=30%.

**Dónde:** `CLAUDE.md` sección "Deposit calculation"

**Solución:** Actualizar CLAUDE.md con los thresholds reales del código.

---

### H-36 — Email admin de Chroma inconsistente

**Qué:** El seed crea el admin de Chroma con email `contacto@chromatravel.online` pero el campo `brand.email` de Chroma está configurado como `hola@chromatravel.online`. Son dos emails diferentes.

**Dónde:** `server/seed-brands.ts` — email del admin vs email del brand

**Solución:** Unificar en un solo email o documentar explícitamente la diferencia (admin login vs email de contacto público).

---

### H-37 — `discountCode` generado pero nunca usado en winback

**Qué:** En `automation.service.ts`, el método `winbackInactiveCustomers()` genera un código de descuento del 20%, lo guarda en la variable `discountCode`, pero nunca lo incluye en el `campaignLog` ni lo envía al cliente.

**Dónde:** `server/services/crm/automation.service.ts` — método `winbackInactiveCustomers()`

**Solución:** Incluir el `discountCode` en el contenido del mensaje cuando se implemente el dispatcher.

---

### H-38 — `ArticleSchema` duplicado en dos componentes

**Qué:** `ArticleSchema` está definido e implementado tanto en `client/src/components/seo-head.tsx` como en `client/src/components/schema-json-ld.tsx`. Dos fuentes de verdad para el mismo Schema.org tipo.

**Dónde:** Ambos archivos mencionados

**Solución:** Consolidar en uno y hacer que el otro importe del primero.

---

### H-39 — Logo de Chroma apunta a archivo con nombre de marca anterior

**Qué:** En `seed-brands.ts`, el `logoUrl` de Chroma Travel está configurado como `/assets/kueani-logo.png`. "Kueani" era el nombre anterior de la plataforma.

**Dónde:** `server/seed-brands.ts` — campo `logoUrl` de Chroma

**Solución:** Actualizar a `/assets/chroma-logo.png` y asegurarse de que el archivo exista con ese nombre.

---

### H-40 — AdSense: mismo publisher ID para ambas marcas

**Qué:** Ambas marcas comparten `googleAdsenseId: "ca-pub-9377043040912794"`. Los ingresos de AdSense van a una sola cuenta y no es posible separar revenue por marca.

**Dónde:** `server/seed-brands.ts` — ambos brands

**Solución:** Si se desea separación financiera, crear dos cuentas AdSense o dos sitios en la misma cuenta. Si no importa, documentar que es intencional.

---

## QUÉ FUNCIONA BIEN

Lista de lo que NO se debe modificar sin análisis profundo.

- **`shared/pricing-engine.ts`** — Canónico, correcto, bien documentado. Divide method, tier system, MSI rules. No tocar.
- **Sistema de holds de inventario** — `habitaciones_disponibles` se decrementa atómicamente en hold y se restaura correctamente en expiry. Funciona.
- **`server/jobs/hold-expiry.ts`** — Cron job que libera holds expirados cada 5 min. Funciona correctamente.
- **Clip webhook + HMAC verification** — `verifyClipSignature()` con `timingSafeEqual`. Implementación correcta.
- **Multi-tenant brand resolution** — `brand-middleware.ts` con cache de 5 min. Bien diseñado.
- **Rate limiting** — Dos tiers (public 60/min, strict 10/min) aplicados correctamente.
- **bcrypt en passwords** — Costo 10, consistente en todos los puntos de creación de usuarios.
- **`getDb()` pattern** — Bien definido; la mayoría del código lo usa correctamente.
- **Drizzle schema** — Single source of truth, 30+ tablas bien estructuradas.
- **8 landing pages Xcaret** — Funnels de venta listos y funcionando.
- **Sitemap y robots.txt** — Server-side rendered, brand-aware, correctamente configurados.
- **Arquitectura multi-tenant** — Un solo deployment para dos marcas. Elegante y económico.
- **Session management** — connect-pg-simple + fallback a memorystore. Correcto.
- **TypeScript** — `tsc` pasa con 0 errores. Mantener esta disciplina.

---

## QUÉ FALTA CONSTRUIR

Ordenado por impacto de negocio.

### Crítico — Sin esto el CRM no funciona
1. **Dispatcher de campañas** — Worker que lea `campaignLogs` con `status: "pending"` y los envíe por Twilio o Nodemailer. Sin esto, 0% de las automaciones funcionan.
2. **SSR de meta tags para Fénix** — Express middleware que inyecte `<head>` correcto por dominio. Sin esto, Fénix no se indexa en Google.

### Alto — Impacto directo en ingresos
3. **Formulario de grupos y bodas** — Las 2 landing pages existen, falta el formulario de captura con WhatsApp directo
4. **Seguros de viaje afiliados** — Integración con Assist-Card o Chubb (formulario + link afiliado)
5. **Newsletter + captura de emails** — Modal de suscripción + envío semanal de mejores tarifas
6. **Confirmación de email al lead** — Email automático con resumen de cotización tras completar el hold

### Medio — Calidad y conversión
7. **Página `/admin/metrics`** — El componente existe, falta la ruta en App.tsx
8. **Reporte de comisiones** — ¿Cuánto ganó la agencia este mes? No existe vista de esto
9. **CFDI / Facturación** — Tablas listas, zero implementación frontend y de generación real
10. **Blog para Fénix** — 0 artículos de lujo/premium. Solo contenido LGBT+
11. **Recuperación de cotizaciones abandonadas** — Detección de holds que expiraron sin pago
12. **Agenda de check-ins** — Calendario de reservas confirmadas por fecha

### Bajo — Mejora técnica
13. **Code splitting con React.lazy** — Dashboard, admin, Three.js en chunks separados
14. **Redis para sessions** — Para escalar a múltiples instancias
15. **GitHub Actions CI** — tsc check automático en cada PR

---

## QUÉ PUEDO MONETIZAR HOY

Sin credenciales de TBO, Hotelbeds, Expedia u otros bedbanks externos.

### Activo y generando (0 trabajo adicional)
| Producto | Cómo | Margen estimado |
|---|---|---|
| Bloqueos Chroma (625 blocks) | Cotizador web + WhatsApp | 5-8% neto/reserva |
| Bloqueos Fénix 2026 (409 blocks) | Cotizador web + WhatsApp | 5-8% neto/reserva |
| Google AdSense | Blog + tráfico | Pasivo (escala con tráfico) |
| Amazon Affiliates (Fénix) | Blog + recomendaciones | 3-8% por producto |

### Listo para activar (1-4 horas de trabajo)
| Producto | Qué falta | ROI estimado |
|---|---|---|
| Grupos 15+ personas | Formulario de grupo en landing existente | Alto (reservas >$50k MXN) |
| Bodas en destinos | Formulario en xcaret-bodas.tsx existente | Muy alto (ticket promedio $80k+) |
| Concierge premium (Fénix) | WhatsApp directo, 0 desarrollo | Inmediato (traslados, spa, restaurantes) |

### Listo para activar (1 día de trabajo)
| Producto | Qué falta | ROI estimado |
|---|---|---|
| Seguros de viaje | Afiliación Assist-Card / Chubb + form simple | 20-30% comisión |
| Contenido patrocinado blog | Política de precios + página de contacto B2B | $2,000-$5,000 MXN/artículo |
| Paquetes bloqueo + traslado | Acuerdo con transportista local + combo en cotizador | +10-15% por reserva |

### Activable en 1 semana
| Producto | Qué falta | ROI estimado |
|---|---|---|
| Newsletter de ofertas | Captura de email + envío semanal | Base para ingresos recurrentes |
| Luna de miel packages | Landing existente + formulario + cuestionario | Ticket alto ($40k-$100k MXN) |

---

## AUTOMATIZACIONES PROPUESTAS

Ordenadas por ROI. Las primeras 7 ya tienen código (solo falta el dispatcher).

| # | Automatización | Estado actual | Impacto | Esfuerzo |
|---|---|---|---|---|
| 1 | **Birthday message** — descuento 15% el día del cumpleaños | Código listo, no envía | Alto (conversión emocional) | Bajo (solo dispatcher) |
| 2 | **Lead follow-up 48h** — WhatsApp a leads WARM sin respuesta | Código listo, no envía | Alto (recupera leads) | Bajo |
| 3 | **Trip reminder 7 días** — WhatsApp antes del check-in | Código listo, no envía | Medio (NPS, upsell) | Bajo |
| 4 | **Post-trip review request** — Email 3 días post-checkout | Código listo, no envía | Medio (testimonios) | Bajo |
| 5 | **Winback inactivos 6 meses** — Email con 20% descuento | Código listo, no envía | Alto (reactiva clientes) | Bajo |
| 6 | **Stock bajo alert** — WhatsApp admin cuando <2 habitaciones | No existe | Alto (evita perder ventas) | Bajo |
| 7 | **Daily ERP report** — Resumen diario al admin vía WhatsApp | No existe | Medio (visibilidad negocio) | Bajo |
| 8 | **Oferta semanal** — Email con las 3 mejores tarifas activas | No existe | Alto (mantiene top-of-mind) | Medio |
| 9 | **Blog scheduler IA** — Publicar 3 artículos/semana automáticos | No existe | Alto (SEO) | Medio |
| 10 | **Cotización abandonada** — Email 2h después de hold expirado | No existe | Alto (recupera ventas) | Medio |
| 11 | **Confirmación de reserva** — Email inmediato con detalles del hold | No existe | Crítico (confianza) | Medio |
| 12 | **Sync inventario CSV** — Detección de nuevos CSVs en attached_assets/ | No existe | Medio (operacional) | Medio |

---

## ROADMAP RECOMENDADO

### FASE 1 — Correcciones críticas (Esta semana)

| Tarea | Archivo | Tiempo |
|---|---|---|
| Fix mailto roto en privacy-policy.tsx | `client/src/pages/privacy-policy.tsx:149,187` | 15 min |
| Fix WhatsApp bot crash en segundo mensaje | `server/services/crm/whatsapp-sales.service.ts` | 1h |
| Fix métricas reservas hardcodeadas en cero | `server/routes.ts` endpoint metrics | 1h |
| Fix `new Pool()` per-request (4 endpoints) | `server/routes.ts` admin bloqueos/audit | 2h |
| Fix sitemap URLs /hoteles/ → /hotels/ | `server/seo-routes.ts:197,258` | 30 min |
| Deploy a main | Railway | 10 min |

### FASE 2 — Optimización (Semanas 2-3)

| Tarea | Impacto |
|---|---|
| SSR meta tags para Fénix | SEO crítico — Fénix empieza a indexarse |
| Unificar cálculo de depósito en shared/ | Consistencia cliente/servidor |
| Code splitting: lazy load Three.js + dashboard | Performance +40% First Load |
| Eliminar PayPal completamente (package + schema) | Limpieza técnica |
| Actualizar seed-brands.ts para leer contacto de env vars | Datos reales en producción |
| Corregir `requireAdmin` duplicado en ota-b2c-routes | Seguridad |
| Agregar CORS y CSP headers | Seguridad |

### FASE 3 — Automatización (Semana 3-4)

| Tarea | Impacto |
|---|---|
| **Implementar dispatcher de campaignLogs** | Activa 5 automaciones de golpe |
| Email de confirmación de hold al cliente | Confianza + reducción de soporte |
| Stock bajo alert vía WhatsApp al admin | Operacional |
| Daily ERP report WhatsApp | Visibilidad de negocio |
| Fix `campaignId` en automation.service.ts | Tracking de campañas |

### FASE 4 — CRM/ERP (Mes 2)

| Tarea | Impacto |
|---|---|
| Formulario de grupos/bodas funcional | Revenue inmediato |
| Seguros de viaje afiliados | +ROI por reserva |
| Newsletter de ofertas | Base recurrente de clientes |
| Reporte de comisiones mensual | ERP real |
| Pipeline de ventas con valores en $ | Visibilidad de negocio |
| CFDI real (las tablas ya existen) | Cumplimiento fiscal |
| Calendario de check-ins | Operacional |

### FASE 5 — IA y escala (Mes 3+)

| Tarea | Impacto |
|---|---|
| Blog automático con IA (3 artículos/semana) | SEO compuesto a largo plazo |
| Cotizador inteligente (recomienda bloqueo óptimo) | Conversión +20% |
| Diferenciación de tono WhatsApp bot por marca | Brand consistency |
| Precio dinámico por demanda y días al check-in | Revenue management |
| Redis para sessions (escala multi-instancia) | Escalabilidad |
| GitHub Actions CI/CD | Calidad de código |
| Hotelbeds / TBO cuando lleguen credenciales | Catálogo ilimitado |

---

## MATRIZ DE PRIORIDADES

| # | Elemento | Estado | Impacto | Prioridad | Tiempo estimado |
|---|---|---|---|---|---|
| H-02 | Mailto roto privacy-policy | ❌ Bug | Confianza legal | P0 | 15 min |
| H-03 | WhatsApp bot crash 2do mensaje | ❌ Bug | Pérdida de leads | P0 | 1h |
| H-04 | Métricas ERP en cero | ❌ Bug | ERP inoperante | P0 | 1h |
| H-06 | Pool per-request en admin | ⚠️ Riesgo | Crash en producción | P0 | 2h |
| H-08 | Sitemap URLs en 404 | ❌ Bug SEO | Indexación Google | P0 | 30 min |
| H-01 | Fénix invisible para crawlers | ❌ Estructural | SEO Fénix = 0 | P0 | 4h |
| H-07 | Automaciones no envían | ❌ Stub | CRM inoperante | P1 | 8h |
| H-05 | 3 calculadoras de depósito distintas | ⚠️ Inconsistencia | Confusión clientes | P1 | 2h |
| H-09 | Bundle 73MB sin code splitting | ❌ Performance | LCP degradado | P1 | 4h |
| H-16 | Social share hardcodea Chroma | ❌ Bug marca | Brand Fénix afectada | P1 | 1h |
| H-17 | `brand_id` tipo incorrecto seed Fénix | ❌ Bug datos | Bloqueos Fénix mal asociados | P1 | 30 min |
| H-12 | Seed no actualiza datos (placeholders) | ⚠️ Datos | WhatsApp falso | P1 | 2h |
| H-13 | Sin CORS | ❌ Seguridad | Integraciones futuras rotas | P2 | 1h |
| H-14 | Sin CSP | ❌ Seguridad | XSS posible | P2 | 2h |
| H-15 | tempPassword posible plaintext | ⚠️ Seguridad | Passwords expuestos | P2 | 1h |
| H-10 | requireAdmin duplicado | ⚠️ Auth | Divergencia silenciosa | P2 | 1h |
| H-11 | PayPal no eliminado (3 lugares) | 🧹 Limpieza | Superficie ataque, datos sucios | P2 | 2h |
| H-18 | getSegmentCustomers en memoria | ⚠️ Performance | OOM con 10k+ users | P2 | 3h |
| H-19 | campaignLogs sin campaignId | ❌ Tracking | Métricas CRM rotas | P2 | 1h |
| H-20 | `db` directo en seo-routes | ⚠️ Patrón | Error silencioso sin DB | P2 | 30 min |
| H-21 | SearchAction apunta a /buscar | ❌ SEO | Sitelink de búsqueda roto | P2 | 1h |
| H-22 | Analytics hardcodeados index.html | ⚠️ Analytics | Sin separación de marcas | P2 | 2h |
| H-23 | Node 20 vs Node 22 | ⚠️ Config | Inconsistencia dev/prod | P2 | 15 min |
| H-24 | Password hardcodeado en seed | ⚠️ Seguridad | Acceso admin si env var falta | P2 | 30 min |
| H-25 | sanitizeInput no universal | ⚠️ Seguridad | Inyección HTML/scripts | P2 | 2h |
| H-26 | WhatsApp bot no diferencia marca | ⚠️ Brand | Tono incorrecto | P2 | 2h |
| H-27 | Env vars no documentadas | ⚠️ Docs | Deploy incompleto | P2 | 1h |
| H-28 | AdminMetrics sin ruta | 🔴 Muerto | Página inaccesible | P3 | 15 min |
| H-29 | scoreLeadData inline routes.ts | 🧹 Deuda | Mantenibilidad | P3 | 1h |
| H-30 | admin/dashboard.tsx huérfano | 🧹 Limpieza | Confusión en codebase | P3 | 15 min |
| H-31 | Comentario loyalty USD vs MXN | 📝 Docs | Error de integración futura | P3 | 15 min |
| H-32 | Typo "stavle" en filename blog | 🧹 Limpieza | SEO del artículo | P3 | 15 min |
| H-33 | 0 artículos blog para Fénix | ❌ Contenido | SEO Fénix | P3 ongoing | Semanas |
| H-34 | Dos sistemas de tiers sin docs | 📝 Docs | Confusión desarrollo | P3 | 30 min |
| H-35 | CLAUDE.md deposit incorrecto | 📝 Docs | Onboarding incorrecto | P3 | 15 min |
| H-36 | Email admin vs email brand | ⚠️ Datos | Comunicaciones perdidas | P3 | 15 min |
| H-37 | discountCode generado pero unused | 🔴 Bug lógica | Descuento nunca llega al cliente | P3 | 1h |
| H-38 | ArticleSchema duplicado | 🧹 Limpieza | Conflicto JSON-LD | P3 | 30 min |
| H-39 | Logo Chroma llama a "kueani-logo" | ⚠️ Branding | Logo incorrecto en prod | P3 | 15 min |
| H-40 | AdSense mismo ID ambas marcas | ℹ️ Config | Sin separación revenue | P3 | 1h |

---

*Auditoría generada el 2026-06-15. Modo READ ONLY — ningún archivo del proyecto fue modificado.*
*40 hallazgos documentados. 6 agentes de análisis paralelos.*
*Rama: `claude/setup-chromatravel-crypto-8Z524`*
