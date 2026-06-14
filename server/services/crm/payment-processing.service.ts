import { getDb } from "../../db";
import { payments, invoices, bookings } from "@shared/schema";
import { eq, sql } from "drizzle-orm";
import { format } from "date-fns";

function getDatabase() {
  const db = getDb();
  if (!db) throw new Error("Database not initialized");
  return db;
}

interface PaymentResult {
  success: boolean;
  paymentId?: string;
  invoiceId?: string;
  bookingId?: string;
  invoiceNumber?: string;
  error?: string;
}

async function generateInvoiceNumber(brandId: string): Promise<string> {
  const db = getDatabase();
  const now = new Date();
  const year = format(now, "yyyy");
  const month = format(now, "MM");

  const result = await db.execute(sql`
    SELECT COUNT(*) as count FROM invoices
    WHERE brand_id = ${brandId}
    AND EXTRACT(YEAR FROM created_at) = ${parseInt(year)}
    AND EXTRACT(MONTH FROM created_at) = ${parseInt(month)}
  `);

  const count = Number((result as any).rows?.[0]?.count || 0) + 1;
  const sequence = count.toString().padStart(4, "0");

  return `FAC-${year}${month}-${sequence}`;
}

export async function processClipPayment(
  chargeId: string,
  amount: string,
  currency: string,
  bookingId: string,
  brandId: string
): Promise<PaymentResult> {
  const db = getDatabase();

  try {
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, bookingId)).limit(1);

    if (!booking) {
      return { success: false, error: "Booking not found" };
    }

    const invoiceNumber = await generateInvoiceNumber(brandId);

    const [newInvoice] = await db.insert(invoices).values({
      brandId,
      bookingId,
      type: "factura",
      status: "stamped",
      folio: invoiceNumber,
      subtotal: amount,
      tax: "0",
      total: amount,
      currency,
      usoCfdi: "G03",
      metodoPago: "PUE",
      formaPago: "28",
    }).returning();

    const [newPayment] = await db.insert(payments).values({
      brandId,
      bookingId,
      invoiceId: newInvoice.id,
      paypalOrderId: chargeId,
      amount,
      currency,
      status: "completed",
      method: "clip",
      metadata: JSON.stringify({ chargeId }),
      completedAt: new Date(),
    }).returning();

    await db.update(bookings)
      .set({ status: "confirmed", paymentStatus: "paid" })
      .where(eq(bookings.id, bookingId));

    return {
      success: true,
      paymentId: newPayment.id,
      invoiceId: newInvoice.id,
      bookingId,
      invoiceNumber,
    };
  } catch (error) {
    console.error("[Payment] Error processing Clip payment:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function getPaymentsByBooking(bookingId: string) {
  const db = getDatabase();
  return db.select().from(payments).where(eq(payments.bookingId, bookingId));
}

export async function getPaymentsByCustomer(customerId: string) {
  const db = getDatabase();
  return db.select().from(payments).where(eq(payments.customerId, customerId));
}
