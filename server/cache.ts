/**
 * In-process LRU-style cache with TTL.
 * Sprint 1: no Redis dependency. Each entry expires independently.
 * Replace get/set calls with Redis equivalents when Redis is added.
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

class AppCache {
  private store = new Map<string, CacheEntry<unknown>>();

  get<T>(key: string): T | undefined {
    const entry = this.store.get(key) as CacheEntry<T> | undefined;
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set<T>(key: string, value: T, ttlMs: number): void {
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  del(key: string): void {
    this.store.delete(key);
  }

  /** Delete all keys that start with the given prefix. */
  delByPrefix(prefix: string): void {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) this.store.delete(key);
    }
  }

  /** Wrap an async function: return cached value or compute and cache. */
  async wrap<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== undefined) return cached;
    const value = await fn();
    this.set(key, value, ttlMs);
    return value;
  }

  size(): number {
    return this.store.size;
  }
}

export const cache = new AppCache();

export const TTL = {
  TARIFAS:       3 * 60 * 1000,  //  3 min — inventario público
  HOTEL_SEARCH:  15 * 60 * 1000, // 15 min — APIs externas
  MULTI_STATS:   5 * 60 * 1000,  //  5 min — dashboard multi-brand
  ADMIN_STATS:   2 * 60 * 1000,  //  2 min — stats por brand
  ERP_DASHBOARD: 2 * 60 * 1000,  //  2 min — ERP aggregates
} as const;

// ── Cache key builders ────────────────────────────────────────────────────────

export const CK = {
  tarifas: (brandId: string, page: number, limit: number, hotel: string, diversify: boolean) =>
    `tarifas:${brandId}:${page}:${limit}:${hotel || ""}:${diversify}`,

  hotelSearch: (params: Record<string, unknown>) =>
    `hotel-search:${JSON.stringify(params)}`,

  multiStats: () => `stats:multi-brand`,

  adminStats: (brandId: string) => `stats:admin:${brandId}`,

  erpDashboard: (brandId: string) => `erp-dashboard:${brandId}`,
} as const;

// ── Invalidation helpers ──────────────────────────────────────────────────────

/** Call after any booking create/update/delete. */
export function invalidateBookingCaches(brandId: string): void {
  cache.del(CK.multiStats());
  cache.del(CK.adminStats(brandId));
  cache.del(CK.erpDashboard(brandId));
}

/** Call after any lead create/update/delete. */
export function invalidateLeadCaches(brandId: string): void {
  cache.del(CK.multiStats());
  cache.del(CK.adminStats(brandId));
}

/** Call after inventory upload or bloqueo update. */
export function invalidateTarifasCaches(brandId: string): void {
  cache.delByPrefix(`tarifas:${brandId}:`);
  // Also bust pages without a specific brand prefix (public endpoint)
  cache.delByPrefix(`tarifas::`);
}
