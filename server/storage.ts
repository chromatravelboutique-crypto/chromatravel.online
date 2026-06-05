import { db, isDbAvailable } from "./db";
import { eq, ilike, and, or, gte, lte, desc, asc, sql } from "drizzle-orm";
import { cache, CK, TTL, invalidateBookingCaches, invalidateLeadCaches } from "./cache";
import {
  users, hotels, rooms, rates, bookings, leads, destinations, providers, blogPosts, lgbtEvents, lgbtCruises, brands,
  type User, type InsertUser,
  type Hotel, type InsertHotel,
  type Room, type InsertRoom,
  type Rate, type InsertRate,
  type Booking, type InsertBooking,
  type Lead, type InsertLead,
  type Destination, type InsertDestination,
  type Provider, type InsertProvider,
  type BlogPost, type InsertBlogPost,
  type LgbtEvent, type InsertLgbtEvent,
  type LgbtCruise, type InsertLgbtCruise,
  type SearchFilters
} from "@shared/schema";
import { randomUUID } from "crypto";

function getDatabase() {
  if (!db) {
    throw new Error("Database not available");
  }
  return db;
}

function generateConfirmationCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "CHR-";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export interface IStorage {
  // Users
  getUsers(): Promise<User[]>;
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined>;

  // Hotels
  getHotels(filters?: SearchFilters): Promise<Hotel[]>;
  getHotel(id: string): Promise<Hotel | undefined>;
  createHotel(hotel: InsertHotel): Promise<Hotel>;
  updateHotel(id: string, data: Partial<InsertHotel>): Promise<Hotel | undefined>;
  searchHotels(query: string): Promise<Hotel[]>;

  // Rooms
  getRoomsByHotel(hotelId: string): Promise<Room[]>;
  getRoom(id: string): Promise<Room | undefined>;
  createRoom(room: InsertRoom): Promise<Room>;

  // Rates
  getRatesByRoom(roomId: string): Promise<Rate[]>;
  getRatesByHotel(hotelId: string): Promise<Rate[]>;
  getRate(id: string): Promise<Rate | undefined>;
  createRate(rate: InsertRate): Promise<Rate>;

  // Bookings
  getBookings(): Promise<Booking[]>;
  getBooking(id: string): Promise<Booking | undefined>;
  getBookingByConfirmation(code: string): Promise<Booking | undefined>;
  getBookingsByUser(userId: string): Promise<Booking[]>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBooking(id: string, data: Partial<InsertBooking>): Promise<Booking | undefined>;

  // Leads
  getLeads(): Promise<Lead[]>;
  getLead(id: string): Promise<Lead | undefined>;
  getLeadById(id: string): Promise<Lead | undefined>;
  createLead(lead: InsertLead): Promise<Lead>;
  updateLead(id: string, data: Partial<InsertLead>): Promise<Lead | undefined>;
  deleteLead(id: string): Promise<void>;

  // Destinations
  getDestinations(): Promise<Destination[]>;
  getFeaturedDestinations(): Promise<Destination[]>;
  getDestination(id: string): Promise<Destination | undefined>;
  getDestinationBySlug(slug: string): Promise<Destination | undefined>;
  createDestination(destination: InsertDestination): Promise<Destination>;
  updateDestination(id: string, data: Partial<InsertDestination>): Promise<Destination | undefined>;

  // Providers
  getProviders(): Promise<Provider[]>;
  getActiveProviders(): Promise<Provider[]>;
  getProvider(id: string): Promise<Provider | undefined>;
  createProvider(provider: InsertProvider): Promise<Provider>;

  // Blog Posts
  getBlogPosts(published?: boolean): Promise<BlogPost[]>;
  getBlogPost(id: string): Promise<BlogPost | undefined>;
  getBlogPostBySlug(slug: string): Promise<BlogPost | undefined>;
  createBlogPost(post: InsertBlogPost): Promise<BlogPost>;
  updateBlogPost(id: string, data: Partial<InsertBlogPost>): Promise<BlogPost | undefined>;
  deleteBlogPost(id: string): Promise<void>;

  // LGBT Events
  getLgbtEvents(brandId?: string): Promise<LgbtEvent[]>;
  getUpcomingLgbtEvents(brandId?: string): Promise<LgbtEvent[]>;
  getFeaturedLgbtEvents(brandId?: string): Promise<LgbtEvent[]>;
  getLgbtEvent(id: string): Promise<LgbtEvent | undefined>;
  getLgbtEventBySlug(slug: string): Promise<LgbtEvent | undefined>;
  createLgbtEvent(event: InsertLgbtEvent): Promise<LgbtEvent>;
  updateLgbtEvent(id: string, data: Partial<InsertLgbtEvent>): Promise<LgbtEvent | undefined>;

  // LGBT Cruises
  getLgbtCruises(brandId?: string): Promise<LgbtCruise[]>;
  getUpcomingLgbtCruises(brandId?: string): Promise<LgbtCruise[]>;
  getFeaturedLgbtCruises(brandId?: string): Promise<LgbtCruise[]>;
  getLgbtCruise(id: string): Promise<LgbtCruise | undefined>;
  getLgbtCruiseBySlug(slug: string): Promise<LgbtCruise | undefined>;
  createLgbtCruise(cruise: InsertLgbtCruise): Promise<LgbtCruise>;
  updateLgbtCruise(id: string, data: Partial<InsertLgbtCruise>): Promise<LgbtCruise | undefined>;

  // Admin stats
  getAdminStats(): Promise<{
    totalBookings: number;
    totalRevenue: number;
    totalLeads: number;
    totalHotels: number;
  }>;
  
  getMultiBrandStats(): Promise<{
    totals: {
      totalBookings: number;
      totalRevenue: number;
      totalLeads: number;
      totalCustomers: number;
    };
    brands: Array<{
      brandId: string;
      brandCode: string;
      brandName: string;
      bookings: number;
      revenue: number;
      leads: number;
      customers: number;
      posts: number;
      destinations: number;
    }>;
  }>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUsers(): Promise<User[]> {
    return getDatabase().select().from(users);
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await getDatabase().select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await getDatabase().select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await getDatabase().insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await getDatabase().update(users).set(data).where(eq(users.id, id)).returning();
    return user;
  }

  // Hotels
  async getHotels(filters?: SearchFilters): Promise<Hotel[]> {
    let query = getDatabase().select().from(hotels).where(eq(hotels.active, true));
    
    if (filters) {
      const conditions: any[] = [eq(hotels.active, true)];
      
      if (filters.destination) {
        conditions.push(
          or(
            ilike(hotels.city, `%${filters.destination}%`),
            ilike(hotels.country, `%${filters.destination}%`),
            ilike(hotels.name, `%${filters.destination}%`)
          )
        );
      }
      
      if (filters.minPrice !== undefined) {
        conditions.push(gte(hotels.minPrice, filters.minPrice.toString()));
      }
      
      if (filters.maxPrice !== undefined) {
        conditions.push(lte(hotels.minPrice, filters.maxPrice.toString()));
      }
      
      if (filters.lgbtFriendlyOnly) {
        conditions.push(gte(hotels.lgbtFriendlyLevel, 4));
      }
      
      return getDatabase().select().from(hotels).where(and(...conditions)).orderBy(desc(hotels.lgbtFriendlyLevel));
    }
    
    return getDatabase().select().from(hotels).where(eq(hotels.active, true)).orderBy(desc(hotels.lgbtFriendlyLevel));
  }

  async getHotel(id: string): Promise<Hotel | undefined> {
    const [hotel] = await getDatabase().select().from(hotels).where(eq(hotels.id, id));
    return hotel;
  }

  async createHotel(insertHotel: InsertHotel): Promise<Hotel> {
    const [hotel] = await getDatabase().insert(hotels).values(insertHotel).returning();
    return hotel;
  }

  async updateHotel(id: string, data: Partial<InsertHotel>): Promise<Hotel | undefined> {
    const [hotel] = await getDatabase().update(hotels).set(data).where(eq(hotels.id, id)).returning();
    return hotel;
  }

  async searchHotels(query: string): Promise<Hotel[]> {
    return getDatabase().select().from(hotels)
      .where(
        and(
          eq(hotels.active, true),
          or(
            ilike(hotels.name, `%${query}%`),
            ilike(hotels.city, `%${query}%`),
            ilike(hotels.country, `%${query}%`),
            ilike(hotels.description, `%${query}%`)
          )
        )
      )
      .orderBy(desc(hotels.lgbtFriendlyLevel));
  }

  // Rooms
  async getRoomsByHotel(hotelId: string): Promise<Room[]> {
    return getDatabase().select().from(rooms).where(eq(rooms.hotelId, hotelId));
  }

  async getRoom(id: string): Promise<Room | undefined> {
    const [room] = await getDatabase().select().from(rooms).where(eq(rooms.id, id));
    return room;
  }

  async createRoom(insertRoom: InsertRoom): Promise<Room> {
    const [room] = await getDatabase().insert(rooms).values(insertRoom).returning();
    return room;
  }

  // Rates
  async getRatesByRoom(roomId: string): Promise<Rate[]> {
    return getDatabase().select().from(rates).where(eq(rates.roomId, roomId));
  }

  async getRatesByHotel(hotelId: string): Promise<Rate[]> {
    return getDatabase().select().from(rates).where(eq(rates.hotelId, hotelId));
  }

  async getRate(id: string): Promise<Rate | undefined> {
    const [rate] = await getDatabase().select().from(rates).where(eq(rates.id, id));
    return rate;
  }

  async createRate(insertRate: InsertRate): Promise<Rate> {
    const [rate] = await getDatabase().insert(rates).values(insertRate).returning();
    return rate;
  }

  // Bookings
  async getBookings(): Promise<Booking[]> {
    return getDatabase().select().from(bookings).orderBy(desc(bookings.createdAt));
  }

  async getBooking(id: string): Promise<Booking | undefined> {
    const [booking] = await getDatabase().select().from(bookings).where(eq(bookings.id, id));
    return booking;
  }

  async getBookingByConfirmation(code: string): Promise<Booking | undefined> {
    const [booking] = await getDatabase().select().from(bookings).where(eq(bookings.confirmationCode, code));
    return booking;
  }

  async getBookingsByUser(userId: string): Promise<Booking[]> {
    return getDatabase().select().from(bookings).where(eq(bookings.userId, userId)).orderBy(desc(bookings.createdAt));
  }

  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const confirmationCode = generateConfirmationCode();
    const [booking] = await getDatabase().insert(bookings).values({
      ...insertBooking,
      confirmationCode,
    }).returning();
    if (booking.brandId) invalidateBookingCaches(booking.brandId);
    return booking;
  }

  async updateBooking(id: string, data: Partial<InsertBooking>): Promise<Booking | undefined> {
    const [booking] = await getDatabase().update(bookings).set(data).where(eq(bookings.id, id)).returning();
    if (booking?.brandId) invalidateBookingCaches(booking.brandId);
    return booking;
  }

  // Leads
  async getLeads(): Promise<Lead[]> {
    return getDatabase().select().from(leads).orderBy(desc(leads.createdAt));
  }

  async getLead(id: string): Promise<Lead | undefined> {
    const [lead] = await getDatabase().select().from(leads).where(eq(leads.id, id));
    return lead;
  }

  async createLead(insertLead: InsertLead): Promise<Lead> {
    const [lead] = await getDatabase().insert(leads).values(insertLead).returning();
    if (lead.brandId) invalidateLeadCaches(lead.brandId);
    return lead;
  }

  async updateLead(id: string, data: Partial<InsertLead>): Promise<Lead | undefined> {
    const [lead] = await getDatabase().update(leads).set(data).where(eq(leads.id, id)).returning();
    if (lead?.brandId) invalidateLeadCaches(lead.brandId);
    return lead;
  }

  async getLeadById(id: string): Promise<Lead | undefined> {
    return this.getLead(id);
  }

  async deleteLead(id: string): Promise<void> {
    const [lead] = await getDatabase().select({ brandId: leads.brandId }).from(leads).where(eq(leads.id, id));
    await getDatabase().delete(leads).where(eq(leads.id, id));
    if (lead?.brandId) invalidateLeadCaches(lead.brandId);
  }

  // Destinations
  async getDestinations(): Promise<Destination[]> {
    return getDatabase().select().from(destinations).orderBy(desc(destinations.lgbtFriendlyScore));
  }

  async getFeaturedDestinations(): Promise<Destination[]> {
    return getDatabase().select().from(destinations)
      .where(eq(destinations.featured, true))
      .orderBy(desc(destinations.lgbtFriendlyScore));
  }

  async getDestination(id: string): Promise<Destination | undefined> {
    const [destination] = await getDatabase().select().from(destinations).where(eq(destinations.id, id));
    return destination;
  }

  async getDestinationBySlug(slug: string): Promise<Destination | undefined> {
    const [destination] = await getDatabase().select().from(destinations).where(eq(destinations.slug, slug));
    return destination;
  }

  async createDestination(insertDestination: InsertDestination): Promise<Destination> {
    const [destination] = await getDatabase().insert(destinations).values(insertDestination).returning();
    return destination;
  }

  async updateDestination(id: string, data: Partial<InsertDestination>): Promise<Destination | undefined> {
    const [destination] = await getDatabase().update(destinations).set(data).where(eq(destinations.id, id)).returning();
    return destination;
  }

  // Providers
  async getProviders(): Promise<Provider[]> {
    return getDatabase().select().from(providers).orderBy(asc(providers.priority));
  }

  async getActiveProviders(): Promise<Provider[]> {
    return getDatabase().select().from(providers)
      .where(eq(providers.active, true))
      .orderBy(asc(providers.priority));
  }

  async getProvider(id: string): Promise<Provider | undefined> {
    const [provider] = await getDatabase().select().from(providers).where(eq(providers.id, id));
    return provider;
  }

  async createProvider(insertProvider: InsertProvider): Promise<Provider> {
    const [provider] = await getDatabase().insert(providers).values(insertProvider).returning();
    return provider;
  }

  // Blog Posts
  async getBlogPosts(published?: boolean): Promise<BlogPost[]> {
    if (published !== undefined) {
      return getDatabase().select().from(blogPosts)
        .where(eq(blogPosts.published, published))
        .orderBy(desc(blogPosts.createdAt));
    }
    return getDatabase().select().from(blogPosts).orderBy(desc(blogPosts.createdAt));
  }

  async getBlogPost(id: string): Promise<BlogPost | undefined> {
    const [post] = await getDatabase().select().from(blogPosts).where(eq(blogPosts.id, id));
    return post;
  }

  async getBlogPostBySlug(slug: string): Promise<BlogPost | undefined> {
    const [post] = await getDatabase().select().from(blogPosts).where(eq(blogPosts.slug, slug));
    return post;
  }

  async createBlogPost(insertPost: InsertBlogPost): Promise<BlogPost> {
    const [post] = await getDatabase().insert(blogPosts).values(insertPost).returning();
    return post;
  }

  async updateBlogPost(id: string, data: Partial<InsertBlogPost>): Promise<BlogPost | undefined> {
    const [post] = await getDatabase().update(blogPosts).set(data).where(eq(blogPosts.id, id)).returning();
    return post;
  }

  async deleteBlogPost(id: string): Promise<void> {
    await getDatabase().delete(blogPosts).where(eq(blogPosts.id, id));
  }

  // LGBT Events
  async getLgbtEvents(brandId?: string): Promise<LgbtEvent[]> {
    if (brandId) {
      return getDatabase().select().from(lgbtEvents)
        .where(eq(lgbtEvents.brandId, brandId))
        .orderBy(asc(lgbtEvents.startDate));
    }
    return getDatabase().select().from(lgbtEvents).orderBy(asc(lgbtEvents.startDate));
  }

  async getUpcomingLgbtEvents(brandId?: string): Promise<LgbtEvent[]> {
    const now = new Date();
    if (brandId) {
      return getDatabase().select().from(lgbtEvents)
        .where(and(
          eq(lgbtEvents.brandId, brandId),
          gte(lgbtEvents.startDate, now)
        ))
        .orderBy(asc(lgbtEvents.startDate));
    }
    return getDatabase().select().from(lgbtEvents)
      .where(gte(lgbtEvents.startDate, now))
      .orderBy(asc(lgbtEvents.startDate));
  }

  async getFeaturedLgbtEvents(brandId?: string): Promise<LgbtEvent[]> {
    const now = new Date();
    if (brandId) {
      return getDatabase().select().from(lgbtEvents)
        .where(and(
          eq(lgbtEvents.brandId, brandId),
          eq(lgbtEvents.featured, true),
          gte(lgbtEvents.startDate, now)
        ))
        .orderBy(asc(lgbtEvents.startDate));
    }
    return getDatabase().select().from(lgbtEvents)
      .where(and(eq(lgbtEvents.featured, true), gte(lgbtEvents.startDate, now)))
      .orderBy(asc(lgbtEvents.startDate));
  }

  async getLgbtEvent(id: string): Promise<LgbtEvent | undefined> {
    const [event] = await getDatabase().select().from(lgbtEvents).where(eq(lgbtEvents.id, id));
    return event;
  }

  async getLgbtEventBySlug(slug: string): Promise<LgbtEvent | undefined> {
    const [event] = await getDatabase().select().from(lgbtEvents).where(eq(lgbtEvents.slug, slug));
    return event;
  }

  async createLgbtEvent(insertEvent: InsertLgbtEvent): Promise<LgbtEvent> {
    const [event] = await getDatabase().insert(lgbtEvents).values(insertEvent).returning();
    return event;
  }

  async updateLgbtEvent(id: string, data: Partial<InsertLgbtEvent>): Promise<LgbtEvent | undefined> {
    const [event] = await getDatabase().update(lgbtEvents).set(data).where(eq(lgbtEvents.id, id)).returning();
    return event;
  }

  // LGBT Cruises
  async getLgbtCruises(brandId?: string): Promise<LgbtCruise[]> {
    if (brandId) {
      return getDatabase().select().from(lgbtCruises)
        .where(eq(lgbtCruises.brandId, brandId))
        .orderBy(asc(lgbtCruises.departureDate));
    }
    return getDatabase().select().from(lgbtCruises).orderBy(asc(lgbtCruises.departureDate));
  }

  async getUpcomingLgbtCruises(brandId?: string): Promise<LgbtCruise[]> {
    const now = new Date();
    if (brandId) {
      return getDatabase().select().from(lgbtCruises)
        .where(and(
          eq(lgbtCruises.brandId, brandId),
          gte(lgbtCruises.departureDate, now)
        ))
        .orderBy(asc(lgbtCruises.departureDate));
    }
    return getDatabase().select().from(lgbtCruises)
      .where(gte(lgbtCruises.departureDate, now))
      .orderBy(asc(lgbtCruises.departureDate));
  }

  async getFeaturedLgbtCruises(brandId?: string): Promise<LgbtCruise[]> {
    const now = new Date();
    if (brandId) {
      return getDatabase().select().from(lgbtCruises)
        .where(and(
          eq(lgbtCruises.brandId, brandId),
          eq(lgbtCruises.featured, true),
          gte(lgbtCruises.departureDate, now)
        ))
        .orderBy(asc(lgbtCruises.departureDate));
    }
    return getDatabase().select().from(lgbtCruises)
      .where(and(eq(lgbtCruises.featured, true), gte(lgbtCruises.departureDate, now)))
      .orderBy(asc(lgbtCruises.departureDate));
  }

  async getLgbtCruise(id: string): Promise<LgbtCruise | undefined> {
    const [cruise] = await getDatabase().select().from(lgbtCruises).where(eq(lgbtCruises.id, id));
    return cruise;
  }

  async getLgbtCruiseBySlug(slug: string): Promise<LgbtCruise | undefined> {
    const [cruise] = await getDatabase().select().from(lgbtCruises).where(eq(lgbtCruises.slug, slug));
    return cruise;
  }

  async createLgbtCruise(insertCruise: InsertLgbtCruise): Promise<LgbtCruise> {
    const [cruise] = await getDatabase().insert(lgbtCruises).values(insertCruise).returning();
    return cruise;
  }

  async updateLgbtCruise(id: string, data: Partial<InsertLgbtCruise>): Promise<LgbtCruise | undefined> {
    const [cruise] = await getDatabase().update(lgbtCruises).set(data).where(eq(lgbtCruises.id, id)).returning();
    return cruise;
  }

  // Admin stats
  async getAdminStats() {
    const [bookingsCount] = await getDatabase().select({ count: sql<number>`count(*)` }).from(bookings);
    const [revenueResult] = await getDatabase().select({ 
      total: sql<string>`COALESCE(SUM(CAST(total_price AS DECIMAL)), 0)` 
    }).from(bookings).where(eq(bookings.paymentStatus, 'paid'));
    const [leadsCount] = await getDatabase().select({ count: sql<number>`count(*)` }).from(leads);
    const [hotelsCount] = await getDatabase().select({ count: sql<number>`count(*)` }).from(hotels).where(eq(hotels.active, true));

    return {
      totalBookings: Number(bookingsCount?.count || 0),
      totalRevenue: parseFloat(revenueResult?.total || '0'),
      totalLeads: Number(leadsCount?.count || 0),
      totalHotels: Number(hotelsCount?.count || 0),
    };
  }

  // Multi-brand stats for unified dashboard
  async getMultiBrandStats() {
    return cache.wrap(CK.multiStats(), TTL.MULTI_STATS, async () => {
      // Single query: all aggregates in one round-trip using LEFT JOINs + GROUP BY
      const rows = await getDatabase().execute(sql`
        SELECT
          b.id                                                          AS brand_id,
          b.code                                                        AS brand_code,
          b.name                                                        AS brand_name,
          COUNT(DISTINCT bk.id)                                         AS bookings_count,
          COALESCE(SUM(CASE WHEN bk.payment_status = 'paid'
            THEN CAST(bk.total_price AS DECIMAL) ELSE 0 END), 0)       AS revenue,
          COUNT(DISTINCT l.id)                                          AS leads_count,
          COUNT(DISTINCT CASE WHEN u.role = 'customer' THEN u.id END)  AS customers_count,
          COUNT(DISTINCT bp.id)                                         AS posts_count,
          COUNT(DISTINCT d.id)                                          AS destinations_count
        FROM brands b
        LEFT JOIN bookings  bk ON bk.brand_id = b.id
        LEFT JOIN leads      l ON l.brand_id  = b.id
        LEFT JOIN users      u ON u.brand_id  = b.id
        LEFT JOIN blog_posts bp ON bp.brand_id = b.id
        LEFT JOIN destinations d ON d.brand_id = b.id
        GROUP BY b.id, b.code, b.name
        ORDER BY b.name
      `);

      const brandStats = (rows as any[]).map((row) => ({
        brandId:      row.brand_id,
        brandCode:    row.brand_code,
        brandName:    row.brand_name,
        bookings:     Number(row.bookings_count  || 0),
        revenue:      parseFloat(row.revenue      || '0'),
        leads:        Number(row.leads_count      || 0),
        customers:    Number(row.customers_count  || 0),
        posts:        Number(row.posts_count      || 0),
        destinations: Number(row.destinations_count || 0),
      }));

      const totals = brandStats.reduce((acc, brand) => ({
        totalBookings:  acc.totalBookings  + brand.bookings,
        totalRevenue:   acc.totalRevenue   + brand.revenue,
        totalLeads:     acc.totalLeads     + brand.leads,
        totalCustomers: acc.totalCustomers + brand.customers,
      }), { totalBookings: 0, totalRevenue: 0, totalLeads: 0, totalCustomers: 0 });

      return { totals, brands: brandStats };
    });
  }
}

export const storage = new DatabaseStorage();
