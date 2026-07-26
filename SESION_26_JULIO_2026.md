# Sesión 26 Julio 2026 — Resumen + Auditoría SEO

> Continúa desde aquí cuando retomes en PowerShell.  
> Branch activo: `claude/setup-chromatravel-crypto-8Z524` → repo `chromatravelboutique-crypto/chromatravel.online`

---

## ✅ LO QUE SE HIZO ESTA SESIÓN

### 1. gstack v1.60.1.0 documentado
- Verificado instalado en `~/.claude/skills/gstack`
- Agregado al `CLAUDE.md` del repo Chroma con lista de skills + routing rules
- Commiteado y pusheado a branch `claude/setup-chromatravel-crypto-8Z524`

### 2. P0 Fix — Login admin Fénix Traveler
- **Root cause**: `seed.ts` era manual, nunca corría en deploy. La DB tenía hash de contraseña antigua/desconocida.
- **Fix**: Agregado bloque UPSERT en `server/index.ts` del repo Fénix que corre en CADA arranque:
  ```typescript
  // Upsert admin on every startup
  const adminEmail = process.env.ADMIN_EMAIL || "eric.cervantes@fenixtraveler.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "Egcl0327#";
  await db.insert(schema.users).values({ ... }).onConflictDoUpdate({ ... });
  ```
- Commits pusheados a `main` del repo `chromatravelboutique-crypto/fenixtraveler`
- **Contraseña efectiva**: valor de env var `ADMIN_PASSWORD`, fallback `Egcl0327#`

### 3. P1 Fix — Contaminación cross-brand Chroma
- Eliminado `server/seed-bloqueos-fenix.ts` del repo `chroma`
- Eliminado endpoint `POST /api/admin/inventory/seed-fenix` de `ota-b2c-routes.ts`
- Changeset también aplicado al repo `chromatravel.online` en branch de trabajo

### 4. Password alignment
- Chroma `seed-brands.ts` línea 219: fallback cambiado de `"ChromaAdmin2024!"` → `"Egcl0327#"`
- Fénix `index.ts`: fallback `"Egcl0327#"`

---

## ⚠️ PENDIENTE: Railway debe tener esta env var en AMBOS servicios
```
ADMIN_PASSWORD = Egcl0327#
```
Verificar en: Railway Dashboard → cada servicio → Variables

---

## 📊 AUDITORÍA SEO — NOTA 1: Fénix Traveler (fenixtraveler.com)

### Tracking & Medición ✅
| Herramienta | ID / Hash | Estado |
|---|---|---|
| Google Analytics 4 | G-CH02MRYRMP | ✅ Activo |
| Facebook Pixel | 749652105924812 | ✅ Activo |
| Metricool | 433340f6cc8ad17308af364d12b5661c | ✅ Activo |

### Meta tags básicos ✅
- **Title**: "Fénix Traveler | Viajes Todo Incluido a Xcaret, Nickelodeon, Europa y Asia" ✅ (keywords de dinero incluidas)
- **Description**: 160 chars, menciona STAVLE y Morelia ✅
- **Robots**: `index, follow` ✅
- **Canonical**: `https://www.fenixtraveler.com` ✅ (www correcto)
- **og:locale**: `es_MX` ✅ (México correcto)
- **lang**: `es` ✅

### Open Graph / Social ⚠️
- og:title, og:description, og:url: ✅
- og:image declarado: `https://www.fenixtraveler.com/og-image.jpg` ❌
  - El archivo real se llama `opengraph.jpg` (existe en `client/public/opengraph.jpg`)
  - **Fix**: renombrar `opengraph.jpg` → `og-image.jpg` O cambiar la meta tag
- og:image:width/height: 1200×630 ✅ (dimensiones correctas declaradas)
- Twitter card: `summary_large_image` ✅

### Schema.org / Datos Estructurados ✅ (el más completo de los dos)
- **TravelAgency** con @id, address, geo, telephone, email, sameAs ✅
- **LoyaltyProgram** — programa de puntos Fénix ✅
- **WebSite** con potentialAction (SearchAction) ✅
- **FAQPage** con 3 Q&A reales ✅ ← excelente para featured snippets y LLMs
- Certificación STAVLE en `memberOf` ✅
- RNT 04160530469 mencionado en FAQ ✅
- Coordenadas GeoCoordinates (19.6782, -101.2047) ✅

**Problema address**: Schema dice "Avenida Periodismo No. 2196, Col. Jardines de Torremolinos" — verificar si es la dirección física correcta (MASTER doc dice "Av. Insurgente Oaxaqueño 27"). Debe ser consistente con Google My Business.

**Problema logo URL**: Schema.org apunta a `https://fenixtraveler.com/logo.png` → archivo NO existe en `client/public/`. El archivo real es `images/kauani-fenix.png` o `favicon.png`.

### Archivos especiales (AI Visibility) ✅
- **robots.txt**: ✅ existe como archivo estático `client/public/robots.txt`
- **llms.txt**: ✅ existe en `client/public/llms.txt` ← excepcional, pocos sitios lo tienen
- **site.webmanifest**: ✅ PWA listo
- **ads.txt**: ✅ presente

### Fixes prioritizados para Fénix
| Prioridad | Fix | Impacto |
|---|---|---|
| P0 | Renombrar `opengraph.jpg` → `og-image.jpg` en `client/public/` | Imagen social en WhatsApp/Facebook |
| P1 | Corregir logo URL en Schema.org a URL real | E-E-A-T de Google |
| P2 | Verificar/corregir dirección en Schema.org vs Google My Business | Local SEO |
| P2 | Agregar AdSense a páginas editoriales | Revenue |

---

## 📊 AUDITORÍA SEO — NOTA 2: Chroma Travel (chromatravel.online)

### Tracking & Medición ✅
| Herramienta | ID / Hash | Estado |
|---|---|---|
| Google Analytics 4 | G-P2MTNY41BQ | ✅ Activo |
| AdSense | ca-pub-9377043040912794 | ✅ Carga condicional (excluye checkout) |
| Metricool | fdeda5c83611e34c4c6473b79098a2de | ✅ Activo |

### Meta tags básicos ✅/⚠️
- **Title**: "Chroma Travel Boutique | Viajes LGBT+ Premium" ✅
- **Description**: presente ✅
- **Canonical**: `https://www.chromatravel.online` ✅ (www correcto)
- **lang**: `es` ✅
- **og:locale**: `es_ES` ❌ → debe ser `es_MX` (México, no España)
- **og:url**: ❌ NO está en index.html (SEOHead lo inyecta por JS pero crawlers no ven JS)
- **og:image**: ❌ NO está en index.html — solo en SEOHead.tsx (JS-only)
- **Facebook Pixel**: ❌ NO presente (Fénix sí lo tiene)
- **Twitter handle**: ❌ NO hay `twitter:site` ni `twitter:creator`

### Open Graph — Problema arquitectónico ⚠️
Chroma usa `SEOHead.tsx` (React) para inyectar og:title, og:description, og:image vía `document.title` y `updateMeta()` en JavaScript. Esto significa que:
- **Facebook/WhatsApp/Telegram scrapers** no ejecutan JS → ven `index.html` crudo → ven tags incompletos
- Cada vez que compartes un link de Chroma en WhatsApp, sale sin imagen y con título genérico
- **Fix correcto**: agregar og:image, og:url, og:title, og:description en `index.html` como fallback estático, además del JS dinámico

### Schema.org / Datos Estructurados ⚠️
- Schema.org está en `seo-routes.ts` y `SEOHead.tsx` (inyección JS)
- Para Googlebot y crawlers de IA, el JSON-LD en `<script type="application/ld+json">` solo es visible si el crawler ejecuta JS (Googlebot sí lo hace, la mayoría de LLM scrapers NO)
- No hay FAQPage schema → sin featured snippets posibles
- No hay LoyaltyProgram schema (Chroma tiene programa de puntos Kuani)

### Archivos especiales (AI Visibility) ⚠️
- **robots.txt**: ✅ generado dinámicamente por `seo-routes.ts`
- **llms.txt**: ❌ NO existe — Fénix sí lo tiene
- **site.webmanifest**: ✅ existe
- **ads.txt**: ✅ existe
- **sitemap.xml**: ✅ generado por `seo-routes.ts`

### Fixes prioritizados para Chroma
| Prioridad | Fix | Archivo | Impacto |
|---|---|---|---|
| P0 | Cambiar `og:locale` de `es_ES` → `es_MX` | `client/index.html` línea 45 | Targeting geográfico correcto |
| P0 | Agregar og:image estático a index.html | `client/index.html` | Imagen en WhatsApp/Facebook shares |
| P1 | Agregar og:url estático | `client/index.html` | Deduplicación social |
| P1 | Agregar Facebook Pixel | `client/index.html` | Retargeting y lookalike audiences |
| P1 | Crear `client/public/llms.txt` | nuevo archivo | AI visibility (Perplexity, ChatGPT, etc.) |
| P2 | Agregar FAQPage JSON-LD estático | `client/index.html` | Featured snippets |
| P2 | Mover Schema.org TravelAgency al `index.html` estático | `client/index.html` | LLM crawlers |

---

## 🔥 FIXES INMEDIATOS A IMPLEMENTAR (ordenados por impacto)

### Fix 1 — Chroma og:locale (1 línea, trivial)
```html
<!-- client/index.html línea 45 -->
<!-- ANTES: -->
<meta property="og:locale" content="es_ES" />
<!-- DESPUÉS: -->
<meta property="og:locale" content="es_MX" />
```

### Fix 2 — Fénix og:image (renombrar archivo)
```bash
# En repo fenixtraveler:
git mv client/public/opengraph.jpg client/public/og-image.jpg
```

### Fix 3 — Chroma og:image estático
```html
<!-- Agregar en client/index.html antes de </head> -->
<meta property="og:image" content="https://www.chromatravel.online/images/boda-playa.jpg" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:url" content="https://www.chromatravel.online" />
```
(Usar una imagen existente: `client/public/images/boda-playa.jpg` ✅)

### Fix 4 — Crear llms.txt para Chroma
```
# Chroma Travel Boutique — Agencia LGBT+ Premium
> Viajes seguros e inclusivos para la comunidad LGBT+

## Servicios
- Paquetes todo incluido hoteles gay-friendly verificados
- Destinos LGBT+ certificados en México y el mundo
- Programa de puntos Kuani (acumula y canjea viajes)
- Asesoría personalizada por agentes capacitados

## Destinos principales
Cancún, Los Cabos, Puerto Vallarta, Riviera Maya, Madrid, Amsterdam, Barcelona, New York

## Contacto
- Web: https://www.chromatravel.online
- WhatsApp: Disponible en sitio web
- Email: hola@chromatravel.online

## Certificaciones
- Miembro STAVLE (Agencia legalmente establecida)
- Especialización en turismo LGBT+ seguro
```

---

## 📁 Repos y branches
| Repo | Branch activo | Auto-deploy |
|---|---|---|
| `chromatravelboutique-crypto/chromatravel.online` | `claude/setup-chromatravel-crypto-8Z524` → PR a `main` | Railway auto-deploy desde main |
| `chromatravelboutique-crypto/fenixtraveler` | `main` | Railway auto-deploy desde main |
| `chromatravelboutique-crypto/chroma` | `main` | Railway auto-deploy desde main |

## 🔑 Credenciales (no compartir)
- Admin Fénix: `eric.cervantes@fenixtraveler.com` / `Egcl0327#`
- Admin Chroma: `contacto@chromatravel.online` / `Egcl0327#`
- Ambos: password viene de env var `ADMIN_PASSWORD` en Railway

## 🛠️ Próximos pasos cuando retomes
1. Implementar los 4 fixes de arriba (30 min)
2. Verificar `ADMIN_PASSWORD=Egcl0327#` está seteado en Railway para ambos servicios
3. Probar login en ambos sitios
4. Corregir logo URL en Schema.org de Fénix (`/logo.png` → `/images/kauani-fenix.png`)
5. Verificar dirección en Schema.org de Fénix vs Google My Business
