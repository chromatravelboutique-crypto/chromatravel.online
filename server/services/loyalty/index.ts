/**
 * Loyalty Program Service
 * 
 * Manages customer loyalty accounts, points transactions, rewards, and redemptions.
 * 
 * Points Earning:
 * - 1 point per $1 USD spent on bookings
 * - Bonus points for referrals (500 points)
 * - Birthday bonus (100 points)
 * - Level multipliers (Gold = 1.5x, Platinum = 2x, Diamond = 3x)
 * 
 * Levels:
 * - Bronce: 0-999 points
 * - Plata: 1,000-4,999 points (5% discount)
 * - Oro: 5,000-14,999 points (10% discount, 1.5x multiplier)
 * - Platino: 15,000-49,999 points (15% discount, 2x multiplier)
 * - Diamante: 50,000+ points (20% discount, 3x multiplier)
 */

import { getDb } from "../../db";
import {
  loyaltyAccounts,
  loyaltyTransactions,
  loyaltyLevels,
  loyaltyRewards,
  loyaltyRedemptions,
} from "@shared/schema";
import { eq, sql, and, gte, lte } from "drizzle-orm";

function getDatabase() {
  const db = getDb();
  if (!db) throw new Error("Database not initialized");
  return db;
}

export interface PointsTransaction {
  accountId: string;
  type: "earn" | "redeem" | "expire" | "adjust" | "bonus" | "referral";
  points: number;
  description: string;
  referenceType?: string;
  referenceId?: string;
  createdBy?: string;
}

export interface LoyaltyStats {
  totalMembers: number;
  activeMembers: number;
  totalPointsIssued: number;
  totalPointsRedeemed: number;
  membersByLevel: Record<string, number>;
}

class LoyaltyService {
  private defaultLevels = [
    { name: "Bronce", code: "bronze", minPoints: 0, maxPoints: 999, multiplier: "1.00", discount: "0", color: "#cd7f32" },
    { name: "Plata", code: "silver", minPoints: 1000, maxPoints: 4999, multiplier: "1.00", discount: "5", color: "#c0c0c0" },
    { name: "Oro", code: "gold", minPoints: 5000, maxPoints: 14999, multiplier: "1.50", discount: "10", color: "#ffd700" },
    { name: "Platino", code: "platinum", minPoints: 15000, maxPoints: 49999, multiplier: "2.00", discount: "15", color: "#e5e4e2" },
    { name: "Diamante", code: "diamond", minPoints: 50000, maxPoints: null, multiplier: "3.00", discount: "20", color: "#b9f2ff" },
  ];

  /**
   * Initialize default loyalty levels for a brand
   */
  async initializeLevels(brandId: string): Promise<void> {
    const db = getDatabase();
    const existing = await db
      .select()
      .from(loyaltyLevels)
      .where(eq(loyaltyLevels.brandId, brandId));

    if (existing.length > 0) {
      console.log(`[Loyalty] Levels already exist for brand ${brandId}`);
      return;
    }

    for (let i = 0; i < this.defaultLevels.length; i++) {
      const level = this.defaultLevels[i];
      await db.insert(loyaltyLevels).values({
        brandId,
        name: level.name,
        code: level.code,
        minPoints: level.minPoints,
        maxPoints: level.maxPoints,
        pointsMultiplier: level.multiplier,
        discountPercent: level.discount,
        color: level.color,
        sortOrder: i,
        active: true,
      });
    }

    console.log(`[Loyalty] Initialized ${this.defaultLevels.length} levels for brand ${brandId}`);
  }

  /**
   * Create a new loyalty account for a user
   */
  async createAccount(userId: string, brandId: string): Promise<string | null> {
    const db = getDatabase();
    try {
      const existing = await db
        .select()
        .from(loyaltyAccounts)
        .where(
          and(
            eq(loyaltyAccounts.userId, userId),
            eq(loyaltyAccounts.brandId, brandId)
          )
        );

      if (existing.length > 0) {
        return existing[0].id;
      }

      const bronzeLevel = await db
        .select()
        .from(loyaltyLevels)
        .where(
          and(
            eq(loyaltyLevels.brandId, brandId),
            eq(loyaltyLevels.code, "bronze")
          )
        )
        .limit(1);

      const memberNumber = this.generateMemberNumber(brandId);

      const [account] = await db
        .insert(loyaltyAccounts)
        .values({
          userId,
          brandId,
          levelId: bronzeLevel[0]?.id,
          memberNumber,
          currentPoints: 0,
          lifetimePoints: 0,
          status: "active",
        })
        .returning();

      console.log(`[Loyalty] Created account ${memberNumber} for user ${userId}`);
      return account.id;
    } catch (error) {
      console.error("[Loyalty] Error creating account:", error);
      return null;
    }
  }

  /**
   * Add points to an account
   */
  async addPoints(transaction: PointsTransaction): Promise<boolean> {
    const db = getDatabase();
    try {
      const [account] = await db
        .select()
        .from(loyaltyAccounts)
        .where(eq(loyaltyAccounts.id, transaction.accountId));

      if (!account) {
        console.error(`[Loyalty] Account not found: ${transaction.accountId}`);
        return false;
      }

      const newBalance = (account.currentPoints || 0) + transaction.points;
      const newLifetime = (account.lifetimePoints || 0) + (transaction.points > 0 ? transaction.points : 0);

      await db.insert(loyaltyTransactions).values({
        accountId: transaction.accountId,
        brandId: account.brandId,
        type: transaction.type,
        points: transaction.points,
        balance: newBalance,
        description: transaction.description,
        referenceType: transaction.referenceType,
        referenceId: transaction.referenceId,
        createdBy: transaction.createdBy,
      });

      await db
        .update(loyaltyAccounts)
        .set({
          currentPoints: newBalance,
          lifetimePoints: newLifetime,
          lastActivityAt: new Date(),
        })
        .where(eq(loyaltyAccounts.id, transaction.accountId));

      await this.checkLevelUp(transaction.accountId);

      console.log(`[Loyalty] Added ${transaction.points} points to account ${transaction.accountId}`);
      return true;
    } catch (error) {
      console.error("[Loyalty] Error adding points:", error);
      return false;
    }
  }

  /**
   * Calculate points for a booking
   */
  calculateBookingPoints(amount: number, currency: string, multiplier: number = 1): number {
    let usdAmount = amount;
    if (currency === "MXN") {
      usdAmount = amount / 18; // Approximate MXN to USD
    }
    return Math.floor(usdAmount * multiplier);
  }

  /**
   * Check if account should level up
   */
  private async checkLevelUp(accountId: string): Promise<void> {
    const db = getDatabase();
    const [account] = await db
      .select()
      .from(loyaltyAccounts)
      .where(eq(loyaltyAccounts.id, accountId));

    if (!account || !account.brandId) return;

    const levels = await db
      .select()
      .from(loyaltyLevels)
      .where(eq(loyaltyLevels.brandId, account.brandId))
      .orderBy(loyaltyLevels.minPoints);

    let newLevel = levels[0];
    for (const level of levels) {
      if ((account.lifetimePoints || 0) >= level.minPoints) {
        newLevel = level;
      }
    }

    if (newLevel && newLevel.id !== account.levelId) {
      await db
        .update(loyaltyAccounts)
        .set({ levelId: newLevel.id })
        .where(eq(loyaltyAccounts.id, accountId));

      console.log(`[Loyalty] Account ${accountId} leveled up to ${newLevel.name}`);
    }
  }

  /**
   * Get account details with level info
   */
  async getAccountDetails(accountId: string) {
    const db = getDatabase();
    const [account] = await db
      .select()
      .from(loyaltyAccounts)
      .where(eq(loyaltyAccounts.id, accountId));

    if (!account) return null;

    let level = null;
    if (account.levelId) {
      const [levelData] = await db
        .select()
        .from(loyaltyLevels)
        .where(eq(loyaltyLevels.id, account.levelId));
      level = levelData;
    }

    const transactions = await db
      .select()
      .from(loyaltyTransactions)
      .where(eq(loyaltyTransactions.accountId, accountId))
      .orderBy(sql`${loyaltyTransactions.createdAt} DESC`)
      .limit(10);

    return { account, level, recentTransactions: transactions };
  }

  /**
   * Get available rewards for an account
   */
  async getAvailableRewards(accountId: string) {
    const db = getDatabase();
    const [account] = await db
      .select()
      .from(loyaltyAccounts)
      .where(eq(loyaltyAccounts.id, accountId));

    if (!account || !account.brandId) return [];

    const rewards = await db
      .select()
      .from(loyaltyRewards)
      .where(
        and(
          eq(loyaltyRewards.brandId, account.brandId),
          eq(loyaltyRewards.active, true),
          lte(loyaltyRewards.pointsCost, account.currentPoints || 0)
        )
      );

    return rewards;
  }

  async getAccountByUser(userId: string, brandId?: string) {
    const db = getDatabase();
    const conditions = [eq(loyaltyAccounts.userId, userId)];
    if (brandId) {
      conditions.push(eq(loyaltyAccounts.brandId, brandId));
    }
    const [account] = await db
      .select()
      .from(loyaltyAccounts)
      .where(and(...conditions));

    if (!account) return null;

    let level = null;
    if (account.levelId) {
      const [levelData] = await db
        .select()
        .from(loyaltyLevels)
        .where(eq(loyaltyLevels.id, account.levelId));
      level = levelData;
    }

    return { ...account, level };
  }

  async getLevels(brandId?: string) {
    const db = getDatabase();
    if (brandId) {
      return db
        .select()
        .from(loyaltyLevels)
        .where(eq(loyaltyLevels.brandId, brandId))
        .orderBy(loyaltyLevels.minPoints);
    }
    return db.select().from(loyaltyLevels).orderBy(loyaltyLevels.minPoints);
  }

  async getTransactions(accountId: string) {
    const db = getDatabase();
    return db
      .select()
      .from(loyaltyTransactions)
      .where(eq(loyaltyTransactions.accountId, accountId))
      .orderBy(sql`${loyaltyTransactions.createdAt} DESC`)
      .limit(50);
  }

  private generateMemberNumber(brandId: string): string {
    const prefix = brandId.substring(0, 3).toUpperCase();
    const random = Math.random().toString(36).substring(2, 10).toUpperCase();
    return `${prefix}-${random.substring(0, 4)}-${random.substring(4, 8)}`;
  }
}

export const loyaltyService = new LoyaltyService();
export default loyaltyService;
