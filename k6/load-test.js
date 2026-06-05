/**
 * k6 Load Test — chromatravel.online
 *
 * BEFORE RUNNING:
 *   1. Point this at STAGING, never at production with real users.
 *   2. Set the BASE_URL env var:
 *        k6 run -e BASE_URL=https://staging.chromatravel.online k6/load-test.js
 *   3. Install k6:  brew install k6  |  choco install k6  |  see k6.io/docs/get-started
 *
 * SCENARIOS (staged ramp-up):
 *   smoke    →  5 VUs  for  1 min   — sanity check, catches obvious breaks
 *   load     → 100 VUs for  5 min   — normal expected traffic
 *   stress   → 500 VUs for  5 min   — 5× normal, finds first bottlenecks
 *   spike    → 1000 VUs for 2 min   — worst-case burst, finds hard limits
 *
 * THRESHOLDS (test fails if any of these break):
 *   http_req_duration p(95) < 500 ms   — 95% of requests under 500 ms
 *   http_req_duration p(99) < 2000 ms  — 99% under 2 s (covers slow DB queries)
 *   http_req_failed   rate  < 0.01     — less than 1% errors
 *   hotel_search_duration p(95) < 8000 ms — external APIs get extra budget
 */

import http from "k6/http";
import { check, sleep, group } from "k6";
import { Counter, Trend } from "k6/metrics";
import { randomItem, randomIntBetween } from "https://jslib.k6.io/k6-utils/1.4.0/index.js";

// ── Configuration ─────────────────────────────────────────────────────────────

const BASE_URL = __ENV.BASE_URL || "http://localhost:5000";

// Destinations and hotels matching the seed data / real bloqueos
const DESTINATIONS = [
  "Cancún", "Playa del Carmen", "Riviera Maya",
  "Puerto Vallarta", "Los Cabos", "Huatulco",
  "Ixtapa", "Mazatlán",
];

const HOTELS_SAMPLE = [
  "Hotel Krystal Grand Cancun",
  "Grand Velas Riviera Maya",
  "Barceló Puerto Vallarta",
  "Casa Natalia Los Cabos",
  "Dreams Huatulco",
];

const ROOM_TYPES = ["ESTANDAR", "PREMIUM", "PREMIUM PLUS", "LUXURY"];

// Test user accounts — create these in your staging DB before running
// Script: INSERT INTO users (email, password, role) VALUES (...)
// Password hash for 'Test1234!': generate with `npx ts-node -e "const b=require('bcrypt');b.hash('Test1234!',10).then(console.log)"`
const TEST_USERS = [
  { email: "loadtest1@test.chromatravel.online", password: "Test1234!" },
  { email: "loadtest2@test.chromatravel.online", password: "Test1234!" },
  { email: "loadtest3@test.chromatravel.online", password: "Test1234!" },
  { email: "loadtest4@test.chromatravel.online", password: "Test1234!" },
  { email: "loadtest5@test.chromatravel.online", password: "Test1234!" },
];

// ── Custom metrics ─────────────────────────────────────────────────────────────

const hotelSearchDuration = new Trend("hotel_search_duration", true);
const cotizacionSuccess   = new Counter("cotizacion_submitted");
const leadSuccess         = new Counter("lead_submitted");
const cacheHits           = new Counter("cache_hits");

// ── Thresholds ────────────────────────────────────────────────────────────────

export const options = {
  scenarios: {
    // 1. Smoke test — always runs first, fast sanity check
    smoke: {
      executor: "constant-vus",
      vus: 5,
      duration: "1m",
      tags: { scenario: "smoke" },
    },

    // 2. Normal load — expected daily traffic
    load: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "1m",  target: 100 }, // ramp up to 100 in 1 min
        { duration: "4m",  target: 100 }, // hold at 100 for 4 min
        { duration: "30s", target: 0   }, // ramp down
      ],
      startTime: "1m30s", // start after smoke finishes + 30s buffer
      tags: { scenario: "load" },
    },

    // 3. Stress test — 5× normal, find first bottleneck
    stress: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "2m",  target: 500 }, // ramp to 500
        { duration: "3m",  target: 500 }, // hold
        { duration: "1m",  target: 0   }, // ramp down
      ],
      startTime: "8m",
      tags: { scenario: "stress" },
    },

    // 4. Spike test — sudden 1000-user burst
    spike: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "30s", target: 1000 }, // instant spike
        { duration: "2m",  target: 1000 }, // hold
        { duration: "30s", target: 0    }, // drop
      ],
      startTime: "15m",
      tags: { scenario: "spike" },
    },
  },

  thresholds: {
    // Global thresholds — applied across all scenarios
    "http_req_duration":                  ["p(95)<500", "p(99)<2000"],
    "http_req_failed":                    ["rate<0.01"],

    // Per-scenario: smoke must be perfect
    "http_req_duration{scenario:smoke}":  ["p(95)<300"],
    "http_req_failed{scenario:smoke}":    ["rate<0.001"],

    // Hotel search gets extra time budget (hits external APIs: TBO/Hotelbeds)
    "hotel_search_duration":              ["p(95)<8000"],

    // Conversion endpoints must be reliable
    "http_req_failed{endpoint:cotizacion}": ["rate<0.005"],
    "http_req_failed{endpoint:lead}":       ["rate<0.005"],
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function headers(jar) {
  return {
    "Content-Type": "application/json",
    "Accept":       "application/json",
    ...(jar ? { Cookie: jar } : {}),
  };
}

function futureDate(daysFromNow) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().split("T")[0];
}

function assertOk(res, name) {
  return check(res, {
    [`${name} → status 2xx`]: (r) => r.status >= 200 && r.status < 300,
    [`${name} → has body`]:   (r) => r.body && r.body.length > 0,
  });
}

// ── Scenario: Anonymous visitor (homepage flow) ───────────────────────────────
// Weight: ~60% of traffic. No login needed.

function scenarioAnonymous() {
  let sessionCookie = "";

  group("01 health check", () => {
    const res = http.get(`${BASE_URL}/api/health`, { headers: headers() });
    assertOk(res, "health");
  });

  sleep(randomIntBetween(1, 2));

  group("02 brand context", () => {
    const res = http.get(`${BASE_URL}/api/brand`, { headers: headers() });
    assertOk(res, "brand");
    // Track cache hits via X-Cache header
    if (res.headers["X-Cache"] === "HIT") cacheHits.add(1);
  });

  sleep(randomIntBetween(1, 3));

  group("03 tarifas especiales (homepage)", () => {
    const page      = randomIntBetween(1, 3);
    const diversify = Math.random() > 0.5 ? "true" : "false";
    const res = http.get(
      `${BASE_URL}/api/tarifas-especiales?page=${page}&limit=12&diversify=${diversify}`,
      { headers: headers(), tags: { endpoint: "tarifas" } },
    );
    assertOk(res, "tarifas");
    if (res.headers["X-Cache"] === "HIT") cacheHits.add(1);
    check(res, {
      "tarifas → has tarifas array": (r) => {
        try { return Array.isArray(JSON.parse(r.body).tarifas); } catch { return false; }
      },
    });
  });

  sleep(randomIntBetween(2, 5));

  group("04 destinations", () => {
    const res = http.get(`${BASE_URL}/api/destinations`, { headers: headers() });
    assertOk(res, "destinations");
  });

  sleep(randomIntBetween(1, 3));

  group("05 blog listing", () => {
    const res = http.get(`${BASE_URL}/api/blog?published=true`, { headers: headers() });
    assertOk(res, "blog");
  });

  sleep(randomIntBetween(2, 4));

  // ~30% of anonymous users submit a lead
  if (Math.random() < 0.3) {
    group("06 submit lead (contact form)", () => {
      const dest = randomItem(DESTINATIONS);
      const ts   = Date.now();
      const res  = http.post(
        `${BASE_URL}/api/leads`,
        JSON.stringify({
          name:        `Load Test User ${ts}`,
          email:       `loadtest+${ts}@test.chromatravel.online`,
          phone:       `+52555${String(randomIntBetween(1000000, 9999999))}`,
          destination: dest,
          message:     `Me interesa viajar a ${dest}. Somos 2 adultos.`,
          source:      "k6-load-test",
        }),
        { headers: headers(), tags: { endpoint: "lead" } },
      );
      if (assertOk(res, "submit lead")) leadSuccess.add(1);
    });
  }

  sleep(randomIntBetween(1, 2));
}

// ── Scenario: Hotel search flow ───────────────────────────────────────────────
// Weight: ~25% of traffic. Heavy — hits external APIs.

function scenarioHotelSearch() {
  group("10 hotel search (unified)", () => {
    const checkIn  = futureDate(randomIntBetween(30, 90));
    const checkOut = futureDate(randomIntBetween(91, 97));
    const dest     = randomItem(DESTINATIONS);

    const start = Date.now();
    const res   = http.post(
      `${BASE_URL}/api/hotels/unified-search`,
      JSON.stringify({
        destination: dest,
        checkIn,
        checkOut,
        adults:   randomIntBetween(1, 4),
        children: 0,
        rooms:    1,
      }),
      { headers: headers(), timeout: "30s", tags: { endpoint: "hotel_search" } },
    );
    hotelSearchDuration.add(Date.now() - start);

    if (res.headers["X-Cache"] === "HIT") cacheHits.add(1);

    check(res, {
      "hotel search → 2xx or timeout handled": (r) =>
        (r.status >= 200 && r.status < 300) || r.status === 504,
    });
  });

  sleep(randomIntBetween(3, 8));
}

// ── Scenario: Cotización / precompra flow ─────────────────────────────────────
// Weight: ~10% of traffic. Most critical conversion path.

function scenarioCotizacion() {
  // First, get available inventory to use real data
  let bloqueo = null;

  group("20 fetch available tarifas", () => {
    const res = http.get(
      `${BASE_URL}/api/tarifas-especiales?limit=50&diversify=false`,
      { headers: headers() },
    );
    if (res.status === 200) {
      try {
        const body   = JSON.parse(res.body);
        const avail  = (body.tarifas || []).filter((t) => t.availability > 0);
        if (avail.length > 0) bloqueo = randomItem(avail);
      } catch (_) {}
    }
  });

  if (!bloqueo) { sleep(2); return; } // no inventory, skip cotización

  sleep(randomIntBetween(3, 8)); // simulate user reading tarifa details

  group("21 submit cotización (precompra)", () => {
    const ts = Date.now();
    const checkInDate  = bloqueo.checkIn  || futureDate(randomIntBetween(30, 60));
    const checkOutDate = bloqueo.checkOut || futureDate(randomIntBetween(61, 65));

    const res = http.post(
      `${BASE_URL}/api/reservar-precompra`,
      JSON.stringify({
        name:         `Load Test ${ts}`,
        email:        `loadtest+${ts}@test.chromatravel.online`,
        phone:        `+52555${String(randomIntBetween(1000000, 9999999))}`,
        hotel:        bloqueo.hotel,
        roomType:     bloqueo.roomType,
        checkIn:      checkInDate,
        checkOut:     checkOutDate,
        adults:       randomIntBetween(1, 2),
        children:     0,
        juniors:      0,
        infants:      0,
        roomsNeeded:  1,
        comments:     "Prueba de carga k6 — ignorar",
      }),
      { headers: headers(), tags: { endpoint: "cotizacion" } },
    );

    // 200 OK = cotización creada; 404/409 = inventory race condition (expected under load)
    check(res, {
      "cotizacion → accepted or inventory race": (r) =>
        r.status === 200 || r.status === 404 || r.status === 409,
      "cotizacion → not 500": (r) => r.status !== 500,
    });
    if (res.status === 200) cotizacionSuccess.add(1);
  });

  sleep(randomIntBetween(2, 4));
}

// ── Scenario: Authenticated user ─────────────────────────────────────────────
// Weight: ~5% of traffic. Tests session management.

function scenarioAuthenticated() {
  const user     = randomItem(TEST_USERS);
  let   cookieJar = "";

  group("30 login", () => {
    const res = http.post(
      `${BASE_URL}/api/auth/login`,
      JSON.stringify({ email: user.email, password: user.password }),
      { headers: headers() },
    );
    check(res, {
      "login → 200":       (r) => r.status === 200,
      "login → has user":  (r) => {
        try { return !!JSON.parse(r.body).email; } catch { return false; }
      },
    });
    // Capture session cookie for subsequent requests
    const setCookie = res.headers["Set-Cookie"];
    if (setCookie) cookieJar = setCookie.split(";")[0];
  });

  if (!cookieJar) { sleep(2); return; }

  sleep(randomIntBetween(1, 3));

  group("31 get current user", () => {
    const res = http.get(
      `${BASE_URL}/api/auth/me`,
      { headers: headers(cookieJar) },
    );
    assertOk(res, "auth/me");
  });

  sleep(randomIntBetween(2, 5));

  group("32 browse tarifas (authenticated)", () => {
    const res = http.get(
      `${BASE_URL}/api/tarifas-especiales?page=1&limit=12`,
      { headers: headers(cookieJar) },
    );
    assertOk(res, "tarifas auth");
  });

  sleep(randomIntBetween(1, 2));

  group("33 logout", () => {
    const res = http.post(
      `${BASE_URL}/api/auth/logout`,
      null,
      { headers: headers(cookieJar) },
    );
    check(res, { "logout → 200": (r) => r.status === 200 });
  });
}

// ── Main entry point ──────────────────────────────────────────────────────────
// k6 calls this once per VU per iteration. Route VUs to scenarios by probability.

export default function () {
  const rand = Math.random();

  if (rand < 0.60) {
    scenarioAnonymous();        // 60% — anonymous browsing + lead form
  } else if (rand < 0.85) {
    scenarioHotelSearch();      // 25% — hotel search (heavy, hits external APIs)
  } else if (rand < 0.95) {
    scenarioCotizacion();       // 10% — cotización flow (conversion critical path)
  } else {
    scenarioAuthenticated();    //  5% — login / session
  }
}

// ── Setup: verify staging is up before test ───────────────────────────────────

export function setup() {
  console.log(`\n🏁 Starting load test against: ${BASE_URL}\n`);
  const res = http.get(`${BASE_URL}/api/health`);
  if (res.status !== 200) {
    throw new Error(`Staging server is not healthy (status ${res.status}). Aborting.`);
  }
  console.log("✅ Server healthy — test starting\n");
  return { baseUrl: BASE_URL };
}

// ── Teardown: summary ─────────────────────────────────────────────────────────

export function teardown(data) {
  console.log(`\n✅ Test complete against ${data.baseUrl}`);
  console.log("Check the summary above for threshold results.");
  console.log("Key metrics to examine:");
  console.log("  http_req_duration{p95} — should be < 500ms");
  console.log("  http_req_failed        — should be < 1%");
  console.log("  hotel_search_duration  — watch for p95 > 8s (external API timeout)");
  console.log("  cache_hits             — more hits = cache working");
  console.log("  cotizacion_submitted   — conversion rate indicator\n");
}
