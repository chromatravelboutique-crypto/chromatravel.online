import { getDb } from "../../db";
import { users, customerProfiles, loyaltyAccounts, leads, interactions } from "@shared/schema";
import { eq } from "drizzle-orm";
import { loyaltyService } from "../loyalty";
import { hash } from "bcrypt";
import { auditService } from "../audit.service";

function getDatabase() {
  const db = getDb();
  if (!db) throw new Error("Database not initialized");
  return db;
}

function generateCustomerCode(brandCode: string = "CH"): string {
  const prefix = brandCode.toUpperCase().substring(0, 2);
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}-${randomNum}`;
}

interface ConversionResult {
  success: boolean;
  customerId?: string;
  customerCode?: string;
  loyaltyAccountId?: string;
  error?: string;
}

class LeadConversionService {
  async convertLeadToCustomer(leadId: string, convertedBy?: string): Promise<ConversionResult> {
    const db = getDatabase();
    
    try {
      const [lead] = await db.select().from(leads).where(eq(leads.id, leadId)).limit(1);
      
      if (!lead) {
        return { success: false, error: "Lead not found" };
      }
      
      if (lead.customerId) {
        return { success: false, error: "Lead already converted" };
      }
      
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, lead.email))
        .limit(1);
      
      let customerId: string;
      let customerCode: string;
      
      if (existingUser) {
        customerId = existingUser.id;
        customerCode = existingUser.customerCode || generateCustomerCode();
        
        if (!existingUser.customerCode) {
          await db.update(users)
            .set({ customerCode })
            .where(eq(users.id, customerId));
        }
      } else {
        const nameParts = lead.name.split(" ");
        const firstName = nameParts[0] || lead.name;
        const lastName = nameParts.slice(1).join(" ") || "";
        customerCode = generateCustomerCode();
        
        const tempPassword = Math.random().toString(36).substring(2, 15);
        const hashedPassword = await hash(tempPassword, 10);
        
        const [newUser] = await db.insert(users).values({
          brandId: lead.brandId,
          email: lead.email,
          password: hashedPassword,
          firstName,
          lastName,
          phone: lead.phone || undefined,
          role: "customer",
          customerCode,
          marketingConsent: true,
        }).returning();
        
        customerId = newUser.id;
      }
      
      const [existingProfile] = await db
        .select()
        .from(customerProfiles)
        .where(eq(customerProfiles.userId, customerId))
        .limit(1);
      
      if (!existingProfile) {
        await db.insert(customerProfiles).values({
          userId: customerId,
          brandId: lead.brandId,
          acquisitionSource: lead.source || "website",
          acquisitionCampaign: lead.utmCampaign || undefined,
          marketingConsent: true,
          emailSubscribed: true,
          whatsappSubscribed: true,
        });
      }
      
      let loyaltyAccountId: string | undefined;
      try {
        const defaultBrandId = "27b1012c-bb90-4461-b8e6-e77ec003843c";
        const accountId = await loyaltyService.createAccount(customerId, lead.brandId || defaultBrandId);
        loyaltyAccountId = accountId || undefined;
      } catch (error) {
        console.log("[LeadConversion] Loyalty account may already exist:", error);
        const [existing] = await db
          .select()
          .from(loyaltyAccounts)
          .where(eq(loyaltyAccounts.userId, customerId))
          .limit(1);
        loyaltyAccountId = existing?.id;
      }
      
      await db.update(leads)
        .set({
          customerId,
          convertedAt: new Date(),
          status: "won",
        })
        .where(eq(leads.id, leadId));
      
      await db.insert(interactions).values({
        brandId: lead.brandId,
        leadId: lead.id,
        customerId,
        type: "conversion",
        channel: "system",
        subject: "Lead convertido a cliente",
        content: `Lead ${lead.name} convertido exitosamente. Código cliente: ${customerCode}`,
        metadata: { customerCode, loyaltyAccountId },
        createdBy: convertedBy || undefined,
      });
      
      await auditService.logLeadConversion(leadId, customerId, customerCode, convertedBy);
      
      console.log(`[LeadConversion] Successfully converted lead ${leadId} to customer ${customerId} (${customerCode})`);
      
      return {
        success: true,
        customerId,
        customerCode,
        loyaltyAccountId,
      };
    } catch (error: any) {
      console.error("[LeadConversion] Error converting lead:", error);
      return { success: false, error: error.message || "Unknown error" };
    }
  }
  
  async addInteraction(data: {
    brandId?: string;
    leadId?: string;
    customerId?: string;
    type: string;
    channel?: string;
    subject?: string;
    content?: string;
    metadata?: any;
    createdBy?: string;
  }) {
    const db = getDatabase();
    
    const [interaction] = await db.insert(interactions).values({
      brandId: data.brandId,
      leadId: data.leadId,
      customerId: data.customerId,
      type: data.type,
      channel: data.channel,
      subject: data.subject,
      content: data.content,
      metadata: data.metadata,
      createdBy: data.createdBy,
    }).returning();
    
    return interaction;
  }
  
  async getInteractionsByLead(leadId: string) {
    const db = getDatabase();
    
    const result = await db
      .select()
      .from(interactions)
      .where(eq(interactions.leadId, leadId))
      .orderBy(interactions.createdAt);
    
    return result;
  }
  
  async getInteractionsByCustomer(customerId: string) {
    const db = getDatabase();
    
    const result = await db
      .select()
      .from(interactions)
      .where(eq(interactions.customerId, customerId))
      .orderBy(interactions.createdAt);
    
    return result;
  }
}

export const leadConversionService = new LeadConversionService();
export default leadConversionService;
