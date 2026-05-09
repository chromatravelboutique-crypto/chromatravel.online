import { getDb } from "../../db";
import {
  campaigns,
  campaignLogs,
  users,
  customerProfiles,
  loyaltyAccounts,
  loyaltyLevels,
  discountCodes,
  consents,
} from "@shared/schema";
import { eq, and, sql, gte, lte, inArray, isNull, or } from "drizzle-orm";

function getDatabase() {
  const db = getDb();
  if (!db) throw new Error("Database not initialized");
  return db;
}

export interface SegmentFilters {
  tiers?: string[];
  preferences?: string[];
  inactiveDays?: number;
  minBookings?: number;
  maxBookings?: number;
  minSpent?: number;
  maxSpent?: number;
  cities?: string[];
  countries?: string[];
  hasBirthdayThisMonth?: boolean;
  hasBirthdayToday?: boolean;
  hasMarketingConsent?: boolean;
  hasWhatsappConsent?: boolean;
  hasEmailConsent?: boolean;
}

export interface CreateCampaignInput {
  brandId: string;
  name: string;
  description?: string;
  type: string;
  channels?: string[];
  segmentFilters: SegmentFilters;
  subject?: string;
  content?: string;
  whatsappMessage?: string;
  whatsappTemplateId?: string;
  emailSubject?: string;
  emailHtml?: string;
  scheduleType?: string;
  scheduledAt?: Date;
  recurringConfig?: any;
  triggerEvent?: string;
  loyaltyPointsBonus?: number;
  discountPercent?: number;
  createdBy?: string;
  status?: string;
}

class CampaignService {
  async createCampaign(input: CreateCampaignInput) {
    const db = getDatabase();
    
    const targetCount = await this.getSegmentCount(input.brandId, input.segmentFilters || {});
    
    const channels = input.channels || [input.type];
    const emailSubject = input.emailSubject || input.subject;
    const emailHtml = input.emailHtml || input.content;
    const whatsappMessage = input.whatsappMessage || (input.type === "whatsapp" ? input.content : undefined);
    
    const [campaign] = await db.insert(campaigns).values({
      brandId: input.brandId,
      name: input.name,
      description: input.description,
      type: input.type,
      channels,
      segmentFilters: input.segmentFilters || {},
      whatsappMessage,
      whatsappTemplateId: input.whatsappTemplateId,
      emailSubject,
      emailHtml,
      scheduleType: input.scheduleType || "manual",
      scheduledAt: input.scheduledAt,
      recurringConfig: input.recurringConfig,
      triggerEvent: input.triggerEvent,
      loyaltyPointsBonus: input.loyaltyPointsBonus || 0,
      discountPercent: input.discountPercent,
      status: input.status || "draft",
      targetCount,
      createdBy: input.createdBy,
    }).returning();

    console.log(`[Campaign] Created campaign "${input.name}" targeting ${targetCount} users`);
    return campaign;
  }

  async getSegmentCount(brandId: string, filters: SegmentFilters): Promise<number> {
    const customers = await this.getSegmentCustomers(brandId, filters);
    return customers.length;
  }

  async getSegmentCustomers(brandId: string, filters: SegmentFilters) {
    const db = getDatabase();
    
    let query = db
      .select({
        userId: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        phone: users.phone,
        marketingConsent: users.marketingConsent,
        profile: customerProfiles,
        loyaltyAccount: loyaltyAccounts,
      })
      .from(users)
      .leftJoin(customerProfiles, eq(customerProfiles.userId, users.id))
      .leftJoin(loyaltyAccounts, eq(loyaltyAccounts.userId, users.id))
      .where(eq(users.brandId, brandId));

    const results = await query;
    
    let filtered = results;

    if (filters.hasMarketingConsent) {
      filtered = filtered.filter(r => r.marketingConsent === true);
    }

    if (filters.hasWhatsappConsent) {
      filtered = filtered.filter(r => r.profile?.whatsappSubscribed === true);
    }

    if (filters.hasEmailConsent) {
      filtered = filtered.filter(r => r.profile?.emailSubscribed !== false);
    }

    if (filters.tiers && filters.tiers.length > 0) {
      filtered = filtered.filter(r => 
        r.loyaltyAccount?.levelId && filters.tiers!.includes(r.loyaltyAccount.levelId)
      );
    }

    if (filters.minBookings !== undefined) {
      filtered = filtered.filter(r => 
        (r.profile?.totalBookings || 0) >= filters.minBookings!
      );
    }

    if (filters.maxBookings !== undefined) {
      filtered = filtered.filter(r => 
        (r.profile?.totalBookings || 0) <= filters.maxBookings!
      );
    }

    if (filters.hasBirthdayToday) {
      const today = new Date();
      const month = today.getMonth() + 1;
      const day = today.getDate();
      filtered = filtered.filter(r => {
        if (!r.profile?.birthDate) return false;
        const birthDate = new Date(r.profile.birthDate);
        return birthDate.getMonth() + 1 === month && birthDate.getDate() === day;
      });
    }

    if (filters.hasBirthdayThisMonth) {
      const month = new Date().getMonth() + 1;
      filtered = filtered.filter(r => {
        if (!r.profile?.birthDate) return false;
        const birthDate = new Date(r.profile.birthDate);
        return birthDate.getMonth() + 1 === month;
      });
    }

    if (filters.inactiveDays) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - filters.inactiveDays);
      filtered = filtered.filter(r => {
        if (!r.profile?.lastBookingAt) return true;
        return new Date(r.profile.lastBookingAt) < cutoffDate;
      });
    }

    return filtered;
  }

  async executeCampaign(campaignId: string) {
    const db = getDatabase();
    
    const [campaign] = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, campaignId));

    if (!campaign) {
      throw new Error("Campaign not found");
    }

    if (!campaign.brandId) {
      throw new Error("Campaign has no brand");
    }

    await db
      .update(campaigns)
      .set({ status: "running", startedAt: new Date() })
      .where(eq(campaigns.id, campaignId));

    const filters = (campaign.segmentFilters as SegmentFilters) || {};
    filters.hasMarketingConsent = true;
    
    const customers = await this.getSegmentCustomers(campaign.brandId, filters);
    
    let sentCount = 0;
    for (const customer of customers) {
      try {
        for (const channel of campaign.channels || []) {
          await db.insert(campaignLogs).values({
            campaignId: campaign.id,
            userId: customer.userId,
            channel,
            status: "pending",
          });
          sentCount++;
        }
      } catch (error) {
        console.error(`[Campaign] Error logging send for ${customer.email}:`, error);
      }
    }

    await db
      .update(campaigns)
      .set({ 
        status: "completed", 
        completedAt: new Date(),
        sentCount,
        targetCount: customers.length,
      })
      .where(eq(campaigns.id, campaignId));

    console.log(`[Campaign] Executed "${campaign.name}" - sent to ${sentCount} recipients`);
    return { sentCount, targetCount: customers.length };
  }

  async getCampaigns(brandId: string) {
    const db = getDatabase();
    return await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.brandId, brandId))
      .orderBy(sql`${campaigns.createdAt} DESC`);
  }

  async getCampaignById(id: string) {
    const db = getDatabase();
    const [campaign] = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, id));
    return campaign;
  }

  async getCampaignLogs(campaignId: string) {
    const db = getDatabase();
    return await db
      .select()
      .from(campaignLogs)
      .where(eq(campaignLogs.campaignId, campaignId))
      .orderBy(sql`${campaignLogs.createdAt} DESC`);
  }

  async generateDiscountCode(
    brandId: string, 
    userId: string, 
    campaignId: string,
    percentage: number,
    validDays: number = 30
  ): Promise<string> {
    const db = getDatabase();
    
    const code = `PROMO${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + validDays);
    
    await db.insert(discountCodes).values({
      brandId,
      code,
      userId,
      campaignId,
      type: "percentage",
      percentage,
      validFrom: new Date(),
      validUntil,
      maxUses: 1,
      status: "active",
    });

    return code;
  }
}

export const campaignService = new CampaignService();
export default campaignService;
