import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

let pool: pg.Pool | null = null;
let db: ReturnType<typeof drizzle> | null = null;
let dbAvailable = false;

// Try to initialize database connection
if (process.env.DATABASE_URL) {
  try {
    pool = new Pool({ 
      connectionString: process.env.DATABASE_URL,
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
      max: 10,
    });
    db = drizzle(pool, { schema });
    dbAvailable = true;
  } catch (error) {
    console.warn("Database connection failed, running in static mode:", error);
    dbAvailable = false;
  }
} else {
  console.warn("DATABASE_URL not set, running in static mode");
}

// Export a safe database accessor
export function getDb() {
  if (!db) {
    throw new Error("Database not available");
  }
  return db;
}

export function isDbAvailable() {
  return dbAvailable;
}

export function getPool() {
  return pool;
}

// For backwards compatibility - but wrap in try/catch when using
export { pool, db };
