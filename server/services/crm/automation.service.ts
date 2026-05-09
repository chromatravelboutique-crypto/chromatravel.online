import { getDb } from "../../db";
import {
  users,
  customerProfiles,
  loyaltyAccounts,
  leads,
  bookings,
  campaigns,
  campaignLogs,
  discountCodes,
} from "@shared/schema";
import { eq, and, sql, lt, gte, isNull, or } from "drizzle-orm";
import { campaignService } from "./campaign.service";
import { loyaltyService } from "../loyalty";

function getDatabase() {
  const db = getDb();
  if (!db) throw new Error("Database not initialized");
  return db;
}

class AutomationService {
  async sendBirthdayMessages(brandId: string) {
    const db = getDatabase();
    const today = new Date();
    const month = today.getMonth() + 1;
    const day = today.getDate();

    const birthdayUsers = await db
      .select({
        userId: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        phone: users.phone,
        profile: customerProfiles,
        loyaltyAccount: loyaltyAccounts,
      })
      .from(users)
      .leftJoin(customerProfiles, eq(customerProfiles.userId, users.id))
      .leftJoin(loyaltyAccounts, eq(loyaltyAccounts.userId, users.id))
      .where(
        and(
          eq(users.brandId, brandId),
          eq(users.marketingConsent, true)
        )
      );

    const todayBirthdays = birthdayUsers.filter(u => {
      if (!u.profile?.birthDate) return false;
      const birthDate = new Date(u.profile.birthDate);
      return birthDate.getMonth() + 1 === month && birthDate.getDate() === day;
    });

    console.log(`[Automation] Found ${todayBirthdays.length} birthdays today`);

    for (const user of todayBirthdays) {
      try {
        const discountCode = await campaignService.generateDiscountCode(
          brandId,
          user.userId,
          "",
          15,
          30
        );

        if (user.loyaltyAccount) {
          await loyaltyService.addPoints({
            accountId: user.loyaltyAccount.id,
            type: "bonus",
            points: 100,
            description: "Puntos de cumpleaños",
          });
        }

        await db.insert(campaignLogs).values({
          userId: user.userId,
          channel: "whatsapp",
          status: "pending",
        });

        console.log(`[Automation] Sent birthday message to ${user.firstName} ${user.lastName}`);
      } catch (error) {
        console.error(`[Automation] Error sending birthday to ${user.email}:`, error);
      }
    }

    return { sent: todayBirthdays.length };
  }

  async followUpColdLeads(brandId: string, inactiveDays: number = 3) {
    const db = getDatabase();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - inactiveDays);

    const coldLeads = await db
      .select()
      .from(leads)
      .where(
        and(
          eq(leads.brandId, brandId),
          eq(leads.status, "new"),
          lt(leads.createdAt, cutoffDate)
        )
      );

    console.log(`[Automation] Found ${coldLeads.length} cold leads (${inactiveDays}+ days)`);

    for (const lead of coldLeads) {
      try {
        await db
          .update(leads)
          .set({ status: "follow_up" })
          .where(eq(leads.id, lead.id));

        await db.insert(campaignLogs).values({
          userId: lead.assignedTo || undefined,
          channel: "whatsapp",
          status: "pending",
        });

        console.log(`[Automation] Queued follow-up for lead ${lead.name}`);
      } catch (error) {
        console.error(`[Automation] Error following up lead ${lead.id}:`, error);
      }
    }

    return { processed: coldLeads.length };
  }

  async winbackInactiveCustomers(brandId: string, inactiveDays: number = 180) {
    const db = getDatabase();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - inactiveDays);

    const inactiveCustomers = await db
      .select({
        userId: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        phone: users.phone,
        profile: customerProfiles,
        loyaltyAccount: loyaltyAccounts,
      })
      .from(users)
      .leftJoin(customerProfiles, eq(customerProfiles.userId, users.id))
      .leftJoin(loyaltyAccounts, eq(loyaltyAccounts.userId, users.id))
      .where(
        and(
          eq(users.brandId, brandId),
          eq(users.marketingConsent, true)
        )
      );

    const winbackTargets = inactiveCustomers.filter(u => {
      if (!u.profile?.lastBookingAt) return false;
      return new Date(u.profile.lastBookingAt) < cutoffDate;
    });

    console.log(`[Automation] Found ${winbackTargets.length} inactive customers (${inactiveDays}+ days)`);

    for (const user of winbackTargets) {
      try {
        const discountCode = await campaignService.generateDiscountCode(
          brandId,
          user.userId,
          "",
          20,
          15
        );

        await db.insert(campaignLogs).values({
          userId: user.userId,
          channel: "email",
          status: "pending",
        });

        console.log(`[Automation] Sent winback to ${user.firstName} ${user.lastName}`);
      } catch (error) {
        console.error(`[Automation] Error winback for ${user.email}:`, error);
      }
    }

    return { sent: winbackTargets.length };
  }

  async sendUpcomingTripReminders(brandId: string, daysAhead: number = 7) {
    const db = getDatabase();
    const reminderDate = new Date();
    reminderDate.setDate(reminderDate.getDate() + daysAhead);
    
    const startOfDay = new Date(reminderDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(reminderDate);
    endOfDay.setHours(23, 59, 59, 999);

    const upcomingBookings = await db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.brandId, brandId),
          eq(bookings.status, "confirmed"),
          gte(bookings.checkIn, startOfDay),
          lt(bookings.checkIn, endOfDay)
        )
      );

    console.log(`[Automation] Found ${upcomingBookings.length} bookings ${daysAhead} days away`);

    for (const booking of upcomingBookings) {
      try {
        await db.insert(campaignLogs).values({
          userId: booking.userId || undefined,
          channel: "whatsapp",
          status: "pending",
          bookingId: booking.id,
        });

        console.log(`[Automation] Sent reminder for booking ${booking.confirmationCode}`);
      } catch (error) {
        console.error(`[Automation] Error sending reminder for ${booking.id}:`, error);
      }
    }

    return { sent: upcomingBookings.length };
  }

  async requestReviews(brandId: string, daysAfterCheckout: number = 3) {
    const db = getDatabase();
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - daysAfterCheckout);
    
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const recentCheckouts = await db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.brandId, brandId),
          eq(bookings.status, "confirmed"),
          gte(bookings.checkOut, startOfDay),
          lt(bookings.checkOut, endOfDay)
        )
      );

    console.log(`[Automation] Found ${recentCheckouts.length} checkouts ${daysAfterCheckout} days ago`);

    for (const booking of recentCheckouts) {
      try {
        await db.insert(campaignLogs).values({
          userId: booking.userId || undefined,
          channel: "email",
          status: "pending",
          bookingId: booking.id,
        });

        console.log(`[Automation] Requested review for booking ${booking.confirmationCode}`);
      } catch (error) {
        console.error(`[Automation] Error requesting review for ${booking.id}:`, error);
      }
    }

    return { sent: recentCheckouts.length };
  }

  async runAllAutomations(brandId: string) {
    console.log(`[Automation] Running all automations for brand ${brandId}`);
    
    const results = {
      birthdays: await this.sendBirthdayMessages(brandId),
      coldLeads: await this.followUpColdLeads(brandId),
      winback: await this.winbackInactiveCustomers(brandId),
      reminders: await this.sendUpcomingTripReminders(brandId),
      reviews: await this.requestReviews(brandId),
    };

    console.log("[Automation] All automations completed:", results);
    return results;
  }
}

export const automationService = new AutomationService();
export default automationService;
