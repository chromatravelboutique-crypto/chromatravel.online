import { getDb } from "../db";
import { auditLogs, leadStatusHistory } from "@shared/schema";
import type { InsertAuditLog, InsertLeadStatusHistory } from "@shared/schema";

export type AuditAction = 
  | 'create_lead' 
  | 'update_status' 
  | 'convert_lead' 
  | 'payment_created' 
  | 'booking_created'
  | 'booking_updated'
  | 'customer_created'
  | 'admin_update';

export type EntityType = 'lead' | 'customer' | 'payment' | 'booking' | 'user';

interface AuditContext {
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export class AuditService {
  async log(
    action: AuditAction,
    entityType: EntityType,
    entityId: string,
    beforeData: unknown,
    afterData: unknown,
    context: AuditContext = {}
  ): Promise<void> {
    try {
      const db = getDb();
      if (!db) {
        console.warn('[Audit] Database not available');
        return;
      }

      const logEntry: InsertAuditLog = {
        userId: context.userId || null,
        action,
        entityType,
        entityId,
        beforeData: beforeData as Record<string, unknown>,
        afterData: afterData as Record<string, unknown>,
        ipAddress: context.ipAddress || null,
        userAgent: context.userAgent || null,
      };

      await db.insert(auditLogs).values(logEntry);
      console.log(`[Audit] ${action} on ${entityType}:${entityId}`);
    } catch (error) {
      console.error('[Audit] Failed to log:', error);
    }
  }

  async logLeadStatusChange(
    leadId: string,
    oldStatus: string | null,
    newStatus: string,
    changedBy?: string
  ): Promise<void> {
    try {
      const db = getDb();
      if (!db) {
        console.warn('[Audit] Database not available');
        return;
      }

      const historyEntry: InsertLeadStatusHistory = {
        leadId,
        oldStatus,
        newStatus,
        changedBy: changedBy || null,
      };

      await db.insert(leadStatusHistory).values(historyEntry);
      console.log(`[Audit] Lead ${leadId} status: ${oldStatus} → ${newStatus}`);

      await this.log(
        'update_status',
        'lead',
        leadId,
        { status: oldStatus },
        { status: newStatus },
        { userId: changedBy }
      );
    } catch (error) {
      console.error('[Audit] Failed to log lead status change:', error);
    }
  }

  async logLeadConversion(
    leadId: string,
    customerId: string,
    customerCode: string,
    convertedBy?: string
  ): Promise<void> {
    await this.log(
      'convert_lead',
      'lead',
      leadId,
      { status: 'won' },
      { customerId, customerCode, convertedAt: new Date().toISOString() },
      { userId: convertedBy }
    );
  }

  async logPaymentCreated(
    paymentId: string,
    paymentData: Record<string, unknown>,
    userId?: string
  ): Promise<void> {
    await this.log(
      'payment_created',
      'payment',
      paymentId,
      null,
      paymentData,
      { userId }
    );
  }

  async logBookingCreated(
    bookingId: string,
    bookingData: Record<string, unknown>,
    userId?: string
  ): Promise<void> {
    await this.log(
      'booking_created',
      'booking',
      bookingId,
      null,
      bookingData,
      { userId }
    );
  }

  async logBookingUpdated(
    bookingId: string,
    beforeData: Record<string, unknown>,
    afterData: Record<string, unknown>,
    userId?: string
  ): Promise<void> {
    await this.log(
      'booking_updated',
      'booking',
      bookingId,
      beforeData,
      afterData,
      { userId }
    );
  }
}

export const auditService = new AuditService();
