import { getDb } from "../../db";
import { users, customerProfiles, loyaltyAccounts, consents } from "@shared/schema";
import { eq, or } from "drizzle-orm";
import { loyaltyService } from "../loyalty";
import { parse } from "csv-parse/sync";
import { hash } from "bcrypt";

function getDatabase() {
  const db = getDb();
  if (!db) throw new Error("Database not initialized");
  return db;
}

interface ImportMapping {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  birthDate?: string;
  city?: string;
  country?: string;
  marketingConsent?: string;
}

interface ImportResult {
  total: number;
  imported: number;
  skipped: number;
  errors: { row: number; error: string }[];
}

interface PreviewRow {
  [key: string]: string;
}

class ImportService {
  async parseCSV(content: string): Promise<PreviewRow[]> {
    try {
      const records = parse(content, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });
      return records as PreviewRow[];
    } catch (error) {
      console.error("[Import] CSV parse error:", error);
      throw new Error("Failed to parse CSV file");
    }
  }

  async getPreview(content: string, limit: number = 10): Promise<{
    headers: string[];
    sample: PreviewRow[];
    totalRows: number;
  }> {
    const allRows = await this.parseCSV(content);
    const headers = allRows.length > 0 ? Object.keys(allRows[0]) : [];
    
    return {
      headers,
      sample: allRows.slice(0, limit),
      totalRows: allRows.length,
    };
  }

  async importCustomers(
    brandId: string,
    content: string,
    mapping: ImportMapping,
    source: string = "csv_import"
  ): Promise<ImportResult> {
    const db = getDatabase();
    const rows = await this.parseCSV(content);
    
    const result: ImportResult = {
      total: rows.length,
      imported: 0,
      skipped: 0,
      errors: [],
    };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2;

      try {
        const firstName = mapping.firstName ? row[mapping.firstName]?.trim() : "";
        const lastName = mapping.lastName ? row[mapping.lastName]?.trim() : "";
        const email = mapping.email ? row[mapping.email]?.trim().toLowerCase() : "";
        const phone = mapping.phone ? this.normalizePhone(row[mapping.phone]) : "";
        const birthDateStr = mapping.birthDate ? row[mapping.birthDate] : null;
        const city = mapping.city ? row[mapping.city]?.trim() : undefined;
        const country = mapping.country ? row[mapping.country]?.trim() : undefined;
        const marketingConsent = mapping.marketingConsent 
          ? this.parseBoolean(row[mapping.marketingConsent])
          : false;

        if (!email && !phone) {
          result.errors.push({ row: rowNum, error: "Email or phone required" });
          continue;
        }

        if (!firstName) {
          result.errors.push({ row: rowNum, error: "First name required" });
          continue;
        }

        const existingConditions = [];
        if (email) {
          existingConditions.push(eq(users.email, email));
        }
        if (phone) {
          existingConditions.push(eq(users.phone, phone));
        }

        const [existingUser] = await db
          .select()
          .from(users)
          .where(or(...existingConditions))
          .limit(1);

        if (existingUser) {
          result.skipped++;
          continue;
        }

        const tempPassword = Math.random().toString(36).substring(2, 15);
        const hashedTempPassword = await hash(tempPassword, 10);

        const [newUser] = await db.insert(users).values({
          brandId,
          email: email || `import_${Date.now()}_${i}@placeholder.com`,
          password: hashedTempPassword,
          firstName,
          lastName: lastName || "",
          phone: phone || undefined,
          role: "customer",
          marketingConsent,
        }).returning();

        let birthDate: Date | undefined;
        if (birthDateStr) {
          const parsed = new Date(birthDateStr);
          if (!isNaN(parsed.getTime())) {
            birthDate = parsed;
          }
        }

        await db.insert(customerProfiles).values({
          userId: newUser.id,
          brandId,
          birthDate,
          billingCity: city,
          billingCountry: country,
          marketingConsent,
          emailSubscribed: marketingConsent,
          whatsappSubscribed: marketingConsent,
        });

        await loyaltyService.createAccount(newUser.id, brandId);

        if (marketingConsent) {
          await db.insert(consents).values({
            userId: newUser.id,
            brandId,
            consentType: "marketing",
            granted: true,
            source,
          });
        }

        result.imported++;
      } catch (error: any) {
        result.errors.push({ row: rowNum, error: error.message || "Unknown error" });
        console.error(`[Import] Error on row ${rowNum}:`, error);
      }
    }

    console.log(`[Import] Completed: ${result.imported} imported, ${result.skipped} skipped, ${result.errors.length} errors`);
    return result;
  }

  private normalizePhone(phone: string | undefined): string {
    if (!phone) return "";
    
    let normalized = phone.replace(/\D/g, "");
    
    if (normalized.length === 10 && !normalized.startsWith("52")) {
      normalized = "52" + normalized;
    }
    
    if (!normalized.startsWith("+")) {
      normalized = "+" + normalized;
    }
    
    return normalized;
  }

  private parseBoolean(value: string | undefined): boolean {
    if (!value) return false;
    const lower = value.toLowerCase().trim();
    return ["true", "1", "yes", "si", "sí", "y", "t"].includes(lower);
  }

  generateTemplate(): string {
    const headers = [
      "nombre",
      "apellido", 
      "email",
      "telefono",
      "fecha_nacimiento",
      "ciudad",
      "pais",
      "acepta_marketing"
    ];
    
    const example = [
      "Juan",
      "Pérez",
      "juan@ejemplo.com",
      "+525512345678",
      "1990-05-15",
      "Ciudad de México",
      "MEX",
      "si"
    ];

    return headers.join(",") + "\n" + example.join(",");
  }
}

export const importService = new ImportService();
export default importService;
