/**
 * Run once before load testing to create test accounts in staging DB.
 * Usage: npx tsx k6/setup-test-users.ts
 *
 * Requires DATABASE_URL pointing to STAGING.
 */

import "dotenv/config";
import { hash } from "bcrypt";
import postgres from "postgres";

const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) { console.error("DATABASE_URL not set"); process.exit(1); }

const sql = postgres(DB_URL, { ssl: "prefer" });

const TEST_PASSWORD = "Test1234!";
const TEST_USERS = Array.from({ length: 5 }, (_, i) => ({
  email: `loadtest${i + 1}@test.chromatravel.online`,
  firstName: "Load",
  lastName: `Test${i + 1}`,
  role: "customer" as const,
}));

async function main() {
  const hashed = await hash(TEST_PASSWORD, 10);
  console.log("Creating test users in staging DB...");

  for (const user of TEST_USERS) {
    await sql`
      INSERT INTO users (email, password, first_name, last_name, role)
      VALUES (${user.email}, ${hashed}, ${user.firstName}, ${user.lastName}, ${user.role})
      ON CONFLICT (email) DO NOTHING
    `;
    console.log(`  ✓ ${user.email}`);
  }

  await sql.end();
  console.log("\nDone. You can now run the k6 load test.");
}

main().catch(err => { console.error(err); process.exit(1); });
