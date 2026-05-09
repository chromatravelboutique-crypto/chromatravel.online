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

interface PayPalCaptureData {
  id: string;
  status: string;
  payer?: {
    payer_id: string;
    email_address?: string;
    name?: {
      given_name?: string;
      surname?: string;
    };
  };
  purchase_units?: Array<{
    payments?: {
      captures?: Array<{
        id: string;
        amount: {
          value: string;
          currency_code: string;
        };
        status: string;
      }>;
    };
  }>;
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

export async function processPayPalPayment(
  paypalOrderId: string,
  captureData: PayPalCaptureData,
  bookingId: string,
  brandId: string
): Promise<PaymentResult> {
  const db = getDatabase();
  
  try {
    const capture = captureData.purchase_units?.[0]?.payments?.captures?.[0];
    
    if (!capture || capture.status !== "COMPLETED") {
      return {
        success: false,
        error: "Payment capture not completed",
      };
    }

    const [booking] = await db.select().from(bookings).where(eq(bookings.id, bookingId)).limit(1);

    if (!booking) {
      return {
        success: false,
        error: "Booking not found",
      };
    }

    const invoiceNumber = await generateInvoiceNumber(brandId);
    
    const [newInvoice] = await db.insert(invoices).values({
      brandId,
      bookingId,
      type: "factura",
      status: "stamped",
      invoiceNumber,
      subtotal: capture.amount.value,
      taxAmount: "0",
      total: capture.amount.value,
      currency: capture.amount.currency_code,
      cfdiUse: "G03",
      paymentMethod: "28",
      paymentForm: "PUE",
      notes: `Pago recibido via PayPal. Order ID: ${paypalOrderId}`,
    }).returning();

    const [newPayment] = await db.insert(payments).values({
      brandId,
      bookingId,
      invoiceId: newInvoice.id,
      paypalOrderId,
      paypalCaptureId: capture.id,
      paypalPayerId: captureData.payer?.payer_id,
      amount: capture.amount.value,
      currency: capture.amount.currency_code,
      status: "completed",
      method: "paypal",
      metadata: JSON.stringify(captureData),
      completedAt: new Date(),
    }).returning();

    await db.update(bookings)
      .set({ 
        status: "confirmed",
        paymentStatus: "paid",
      })
      .where(eq(bookings.id, bookingId));

    console.log(`[Payment] Processed PayPal payment ${paypalOrderId}:`, {
      paymentId: newPayment.id,
      invoiceId: newInvoice.id,
      invoiceNumber,
      bookingId,
      amount: capture.amount.value,
      currency: capture.amount.currency_code,
    });

    return {
      success: true,
      paymentId: newPayment.id,
      invoiceId: newInvoice.id,
      bookingId,
      invoiceNumber,
    };
  } catch (error) {
    console.error("[Payment] Error processing PayPal payment:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function getPaymentByPaypalOrder(paypalOrderId: string) {
  const db = getDatabase();
  const [payment] = await db.select().from(payments).where(eq(payments.paypalOrderId, paypalOrderId)).limit(1);
  return payment;
}

export async function getPaymentsByBooking(bookingId: string) {
  const db = getDatabase();
  return db.select().from(payments).where(eq(payments.bookingId, bookingId));
}

export async function getPaymentsByCustomer(customerId: string) {
  const db = getDatabase();
  return db.select().from(payments).where(eq(payments.customerId, customerId));
}
