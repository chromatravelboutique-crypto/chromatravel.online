import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ==================== BRANDS (Multi-tenant) ====================
export const brands = pgTable("brands", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(), // 'chroma' | 'fenix'
  name: text("name").notNull(),
  domain: text("domain").notNull().unique(), // 'chromatravel.online' | 'fenixtraveler.com'
  tagline: text("tagline"),
  description: text("description"),
  
  // SEO Configuration
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  seoKeywords: text("seo_keywords").array(),
  ogImage: text("og_image"),
  twitterHandle: text("twitter_handle"),
  
  // Theme Configuration
  primaryColor: text("primary_color").default("#10b981"),
  secondaryColor: text("secondary_color").default("#ec4899"),
  accentColor: text("accent_color").default("#f59e0b"),
  logoUrl: text("logo_url"),
  faviconUrl: text("favicon_url"),
  
  // Contact & Social
  whatsappNumber: text("whatsapp_number"),
  whatsappMessage: text("whatsapp_message"),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  facebookUrl: text("facebook_url"),
  instagramUrl: text("instagram_url"),
  twitterUrl: text("twitter_url"),
  youtubeUrl: text("youtube_url"),
  
  // Tracking & Analytics
  googleAnalyticsId: text("google_analytics_id"),
  googleAdsenseId: text("google_adsense_id"),
  facebookPixelId: text("facebook_pixel_id"),
  amazonAffiliateId: text("amazon_affiliate_id"),
  
  // UTM Defaults
  utmSource: text("utm_source"),
  utmMedium: text("utm_medium").default("organic"),
  utmCampaign: text("utm_campaign"),
  
  // Social Automation
  metricoolApiKey: text("metricool_api_key"),
  zapierWebhookUrl: text("zapier_webhook_url"),
  socialHashtags: text("social_hashtags").array(),
  socialTemplates: jsonb("social_templates"), // { facebook: "...", instagram: "...", twitter: "..." }
  
  // Schema.org
  schemaOrgType: text("schema_org_type").default("TravelAgency"),
  schemaOrgData: jsonb("schema_org_data"),
  
  // Feature flags
  lgbtFocused: boolean("lgbt_focused").default(false),
  premiumBrand: boolean("premium_brand").default(false),
  
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  brandId: varchar("brand_id").references(() => brands.id),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  phone: text("phone"),
  role: text("role").notNull().default("customer"),
  customerCode: text("customer_code").unique(),
  language: text("language").notNull().default("es"),
  currency: text("currency").notNull().default("MXN"),
  marketingConsent: boolean("marketing_consent").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const hotels = pgTable("hotels", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  brandId: varchar("brand_id").references(() => brands.id),
  providerId: varchar("provider_id"),
  providerCode: text("provider_code"),
  name: text("name").notNull(),
  description: text("description").notNull(),
  shortDescription: text("short_description"),
  address: text("address").notNull(),
  city: text("city").notNull(),
  country: text("country").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  starRating: integer("star_rating").default(4),
  lgbtFriendlyLevel: integer("lgbt_friendly_level").default(1),
  lgbtCertified: boolean("lgbt_certified").default(false),
  amenities: text("amenities").array(),
  images: text("images").array(),
  thumbnail: text("thumbnail"),
  policies: jsonb("policies"),
  minPrice: decimal("min_price", { precision: 10, scale: 2 }),
  currency: text("currency").default("USD"),
  active: boolean("active").default(true),
});

export const rooms = pgTable("rooms", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  hotelId: varchar("hotel_id").notNull().references(() => hotels.id),
  name: text("name").notNull(),
  description: text("description"),
  maxOccupancy: integer("max_occupancy").default(2),
  bedType: text("bed_type"),
  size: integer("size"),
  amenities: text("amenities").array(),
  images: text("images").array(),
});

export const rates = pgTable("rates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  roomId: varchar("room_id").notNull().references(() => rooms.id),
  hotelId: varchar("hotel_id").notNull().references(() => hotels.id),
  name: text("name").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  originalPrice: decimal("original_price", { precision: 10, scale: 2 }),
  currency: text("currency").default("USD"),
  mealPlan: text("meal_plan"),
  cancellationPolicy: text("cancellation_policy"),
  refundable: boolean("refundable").default(true),
  availableFrom: timestamp("available_from"),
  availableTo: timestamp("available_to"),
});

export const bookings = pgTable("bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  brandId: varchar("brand_id").references(() => brands.id),
  confirmationCode: text("confirmation_code").notNull().unique(),
  userId: varchar("user_id").references(() => users.id),
  hotelId: varchar("hotel_id").notNull().references(() => hotels.id),
  roomId: varchar("room_id").notNull().references(() => rooms.id),
  rateId: varchar("rate_id").references(() => rates.id),
  checkIn: timestamp("check_in").notNull(),
  checkOut: timestamp("check_out").notNull(),
  guests: integer("guests").default(2),
  guestFirstName: text("guest_first_name").notNull(),
  guestLastName: text("guest_last_name").notNull(),
  guestEmail: text("guest_email").notNull(),
  guestPhone: text("guest_phone"),
  specialRequests: text("special_requests"),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default("USD"),
  status: text("status").notNull().default("pending"),
  paymentStatus: text("payment_status").default("pending"),
  paymentIntentId: text("payment_intent_id"),
  providerBookingId: text("provider_booking_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const leads = pgTable("leads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  brandId: varchar("brand_id").references(() => brands.id),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  message: text("message"),
  destination: text("destination"),
  travelDates: text("travel_dates"),
  source: text("source").default("website"),
  status: text("status").default("new"),
  assignedTo: varchar("assigned_to").references(() => users.id),
  customerId: varchar("customer_id").references(() => users.id),
  convertedAt: timestamp("converted_at"),
  // UTM Tracking
  utmSource: text("utm_source"),
  utmMedium: text("utm_medium"),
  utmCampaign: text("utm_campaign"),
  utmContent: text("utm_content"),
  utmTerm: text("utm_term"),
  referrerUrl: text("referrer_url"),
  landingPage: text("landing_page"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const interactions = pgTable("interactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  brandId: varchar("brand_id").references(() => brands.id),
  leadId: varchar("lead_id").references(() => leads.id),
  customerId: varchar("customer_id").references(() => users.id),
  userId: varchar("user_id").references(() => users.id),
  type: text("type").notNull(),
  channel: text("channel"),
  subject: text("subject"),
  content: text("content"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: varchar("created_by").references(() => users.id),
});

// ==================== AUDIT LOGS (Commercial Operations) ====================
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  action: text("action").notNull(), // create_lead, update_status, convert_lead, payment_created, booking_created
  entityType: text("entity_type").notNull(), // lead, customer, payment, booking
  entityId: varchar("entity_id"),
  beforeData: jsonb("before_data"),
  afterData: jsonb("after_data"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ==================== LEAD STATUS HISTORY ====================
export const leadStatusHistory = pgTable("lead_status_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leadId: varchar("lead_id").references(() => leads.id).notNull(),
  oldStatus: text("old_status"),
  newStatus: text("new_status").notNull(),
  changedBy: varchar("changed_by").references(() => users.id),
  changedAt: timestamp("changed_at").defaultNow(),
});

export const destinations = pgTable("destinations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  brandId: varchar("brand_id").references(() => brands.id),
  name: text("name").notNull(),
  country: text("country").notNull(),
  description: text("description"),
  shortDescription: text("short_description"),
  image: text("image"),
  lgbtFriendlyScore: integer("lgbt_friendly_score").default(5),
  featured: boolean("featured").default(false),
  slug: text("slug").unique(),
  // SEO
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  seoKeywords: text("seo_keywords").array(),
});

export const providers = pgTable("providers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull(),
  apiUrl: text("api_url"),
  authType: text("auth_type"),
  active: boolean("active").default(true),
  priority: integer("priority").default(1),
  lastSync: timestamp("last_sync"),
});

export const blogPosts = pgTable("blog_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  brandId: varchar("brand_id").references(() => brands.id),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  excerpt: text("excerpt"),
  content: text("content").notNull(),
  image: text("image"),
  authorId: varchar("author_id").references(() => users.id),
  category: text("category"),
  tags: text("tags").array(),
  published: boolean("published").default(false),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow(),
  // SEO Fields
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  seoKeywords: text("seo_keywords").array(),
  // Social Media / RSS
  featuredImageWebp: text("featured_image_webp"),
  featuredImageAlt: text("featured_image_alt"),
  socialExcerpt: text("social_excerpt"),
  hashtags: text("hashtags").array(),
  ogMeta: jsonb("og_meta"), // { ogTitle, ogDescription, ogImage, twitterCard }
  // UTM & Automation
  utmCampaign: text("utm_campaign"),
  automationStatus: text("automation_status").default("pending"), // pending, published, recycled
  lastPublishedToSocial: timestamp("last_published_to_social"),
  recycleAt: timestamp("recycle_at"),
});

// Blog post metrics for tracking conversions from social media
export const blogPostMetrics = pgTable("blog_post_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  blogPostId: varchar("blog_post_id").notNull().references(() => blogPosts.id),
  brandId: varchar("brand_id").references(() => brands.id),
  network: text("network").notNull(), // facebook, instagram, twitter, organic
  clicks: integer("clicks").default(0),
  leads: integer("leads").default(0),
  conversions: integer("conversions").default(0),
  revenue: decimal("revenue", { precision: 10, scale: 2 }).default("0"),
  date: timestamp("date").defaultNow(),
});

// LGBT Events (Pride, festivals, parties)
export const lgbtEvents = pgTable("lgbt_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  brandId: varchar("brand_id").references(() => brands.id),
  name: text("name").notNull(),
  description: text("description"),
  shortDescription: text("short_description"),
  eventType: text("event_type").notNull(), // pride, festival, party, circuit, cruise
  destination: text("destination").notNull(),
  country: text("country").notNull(),
  venue: text("venue"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  image: text("image"),
  images: text("images").array(),
  website: text("website"),
  ticketUrl: text("ticket_url"),
  priceFrom: decimal("price_from", { precision: 10, scale: 2 }),
  priceTo: decimal("price_to", { precision: 10, scale: 2 }),
  currency: text("currency").default("USD"),
  featured: boolean("featured").default(false),
  highlights: text("highlights").array(),
  slug: text("slug").unique(),
});

// LGBT Cruises
export const lgbtCruises = pgTable("lgbt_cruises", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  brandId: varchar("brand_id").references(() => brands.id),
  name: text("name").notNull(),
  description: text("description"),
  shortDescription: text("short_description"),
  cruiseLine: text("cruise_line").notNull(),
  shipName: text("ship_name"),
  departurePort: text("departure_port").notNull(),
  departureDate: timestamp("departure_date").notNull(),
  returnDate: timestamp("return_date").notNull(),
  duration: integer("duration").notNull(), // nights
  itinerary: text("itinerary").array(),
  destinations: text("destinations").array(),
  image: text("image"),
  images: text("images").array(),
  priceFrom: decimal("price_from", { precision: 10, scale: 2 }),
  currency: text("currency").default("USD"),
  cabinTypes: jsonb("cabin_types"), // { inside: price, ocean: price, balcony: price, suite: price }
  featured: boolean("featured").default(false),
  amenities: text("amenities").array(),
  highlights: text("highlights").array(),
  bookingUrl: text("booking_url"),
  slug: text("slug").unique(),
});

// ==================== CUSTOMER PROFILES (CRM Extended) ====================
export const customerProfiles = pgTable("customer_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  brandId: varchar("brand_id").references(() => brands.id),
  
  // Personal Info (for marketing)
  birthDate: timestamp("birth_date"),
  gender: text("gender"), // male, female, non-binary, prefer_not_to_say
  nationality: text("nationality"),
  preferredLanguage: text("preferred_language").default("es"),
  
  // Billing Info (for invoicing)
  rfc: text("rfc"), // Mexican tax ID
  razonSocial: text("razon_social"), // Business name for invoicing
  regimenFiscal: text("regimen_fiscal"), // SAT fiscal regime code
  usoCfdi: text("uso_cfdi").default("G03"), // CFDI use (G03 = gastos en general)
  billingEmail: text("billing_email"),
  billingAddress: text("billing_address"),
  billingCity: text("billing_city"),
  billingState: text("billing_state"),
  billingZip: text("billing_zip"),
  billingCountry: text("billing_country").default("MEX"),
  
  // Travel Preferences
  travelStyle: text("travel_style"), // luxury, budget, adventure, romantic
  preferredDestinations: text("preferred_destinations").array(),
  dietaryRestrictions: text("dietary_restrictions"),
  specialNeeds: text("special_needs"),
  
  // Marketing
  marketingConsent: boolean("marketing_consent").default(false),
  emailSubscribed: boolean("email_subscribed").default(true),
  smsSubscribed: boolean("sms_subscribed").default(false),
  whatsappSubscribed: boolean("whatsapp_subscribed").default(true),
  lastContactedAt: timestamp("last_contacted_at"),
  preferredContactMethod: text("preferred_contact_method").default("email"),
  
  // Analytics
  totalBookings: integer("total_bookings").default(0),
  totalSpent: decimal("total_spent", { precision: 12, scale: 2 }).default("0"),
  averageBookingValue: decimal("average_booking_value", { precision: 10, scale: 2 }),
  firstBookingAt: timestamp("first_booking_at"),
  lastBookingAt: timestamp("last_booking_at"),
  
  // Source tracking
  acquisitionSource: text("acquisition_source"),
  acquisitionCampaign: text("acquisition_campaign"),
  referredBy: varchar("referred_by").references(() => users.id),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ==================== LOYALTY PROGRAM ====================
export const loyaltyLevels = pgTable("loyalty_levels", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  brandId: varchar("brand_id").references(() => brands.id),
  name: text("name").notNull(), // Bronce, Plata, Oro, Platino, Diamante
  code: text("code").notNull(), // bronze, silver, gold, platinum, diamond
  minPoints: integer("min_points").notNull().default(0),
  maxPoints: integer("max_points"),
  pointsMultiplier: decimal("points_multiplier", { precision: 3, scale: 2 }).default("1.00"),
  discountPercent: decimal("discount_percent", { precision: 5, scale: 2 }).default("0"),
  benefits: text("benefits").array(),
  color: text("color").default("#cd7f32"), // Bronze color default
  icon: text("icon"),
  active: boolean("active").default(true),
  sortOrder: integer("sort_order").default(0),
});

export const loyaltyAccounts = pgTable("loyalty_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  brandId: varchar("brand_id").references(() => brands.id),
  levelId: varchar("level_id").references(() => loyaltyLevels.id),
  memberNumber: text("member_number").unique(), // Chroma-XXXX-XXXX
  currentPoints: integer("current_points").default(0),
  lifetimePoints: integer("lifetime_points").default(0),
  pointsExpiring: integer("points_expiring").default(0),
  pointsExpirationDate: timestamp("points_expiration_date"),
  enrolledAt: timestamp("enrolled_at").defaultNow(),
  lastActivityAt: timestamp("last_activity_at"),
  status: text("status").default("active"), // active, suspended, closed
});

export const loyaltyTransactions = pgTable("loyalty_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  accountId: varchar("account_id").notNull().references(() => loyaltyAccounts.id),
  brandId: varchar("brand_id").references(() => brands.id),
  type: text("type").notNull(), // earn, redeem, expire, adjust, bonus, referral
  points: integer("points").notNull(), // positive = earn, negative = redeem
  balance: integer("balance").notNull(), // balance after transaction
  description: text("description"),
  referenceType: text("reference_type"), // booking, referral, promotion, manual
  referenceId: varchar("reference_id"), // booking_id, etc.
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: varchar("created_by").references(() => users.id),
});

export const loyaltyRewards = pgTable("loyalty_rewards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  brandId: varchar("brand_id").references(() => brands.id),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(), // discount, upgrade, experience, gift
  pointsCost: integer("points_cost").notNull(),
  value: decimal("value", { precision: 10, scale: 2 }), // monetary value
  currency: text("currency").default("MXN"),
  image: text("image"),
  terms: text("terms"),
  minLevel: varchar("min_level").references(() => loyaltyLevels.id),
  stock: integer("stock"), // null = unlimited
  validFrom: timestamp("valid_from"),
  validUntil: timestamp("valid_until"),
  active: boolean("active").default(true),
});

export const loyaltyRedemptions = pgTable("loyalty_redemptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  accountId: varchar("account_id").notNull().references(() => loyaltyAccounts.id),
  rewardId: varchar("reward_id").notNull().references(() => loyaltyRewards.id),
  transactionId: varchar("transaction_id").references(() => loyaltyTransactions.id),
  pointsUsed: integer("points_used").notNull(),
  status: text("status").default("pending"), // pending, confirmed, used, expired, cancelled
  code: text("code"), // unique redemption code
  usedAt: timestamp("used_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ==================== INVOICING (CFDI) ====================
export const invoices = pgTable("invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  brandId: varchar("brand_id").references(() => brands.id),
  bookingId: varchar("booking_id").references(() => bookings.id),
  customerId: varchar("customer_id").references(() => customerProfiles.id),
  
  // Invoice Type
  type: text("type").notNull().default("factura"), // proforma, factura, nota_credito
  status: text("status").notNull().default("draft"), // draft, pending, stamped, cancelled, error
  
  // Series/Folio
  series: text("series"), // A, B, etc.
  folio: text("folio"),
  
  // CFDI Data
  cfdiUuid: text("cfdi_uuid"), // UUID from SAT (timbrado)
  cfdiVersion: text("cfdi_version").default("4.0"),
  tipoComprobante: text("tipo_comprobante").default("I"), // I=Ingreso, E=Egreso, T=Traslado
  formaPago: text("forma_pago").default("99"), // 99=Por definir, 01=Efectivo, 03=Transferencia, etc.
  metodoPago: text("metodo_pago").default("PUE"), // PUE=Pago en una sola exhibición, PPD=Pago en parcialidades
  
  // Customer Data (snapshot)
  rfcReceptor: text("rfc_receptor"),
  nombreReceptor: text("nombre_receptor"),
  domicilioFiscal: text("domicilio_fiscal"),
  regimenFiscalReceptor: text("regimen_fiscal_receptor"),
  usoCfdi: text("uso_cfdi").default("G03"),
  
  // Amounts
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull(),
  discount: decimal("discount", { precision: 10, scale: 2 }).default("0"),
  tax: decimal("tax", { precision: 10, scale: 2 }).default("0"),
  total: decimal("total", { precision: 12, scale: 2 }).notNull(),
  currency: text("currency").default("MXN"),
  exchangeRate: decimal("exchange_rate", { precision: 10, scale: 4 }).default("1"),
  
  // Items (JSON array of invoice lines)
  items: jsonb("items"), // [{ description, quantity, unitPrice, amount, productCode, unitCode }]
  
  // Files
  xmlUrl: text("xml_url"),
  pdfUrl: text("pdf_url"),
  
  // Provider data (Facturapi, etc.)
  providerId: text("provider_id"), // ID in the CFDI provider
  providerResponse: jsonb("provider_response"),
  
  // Timestamps
  issuedAt: timestamp("issued_at"),
  stampedAt: timestamp("stamped_at"),
  cancelledAt: timestamp("cancelled_at"),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: varchar("created_by").references(() => users.id),
});

// ==================== RELATIONS ====================
export const brandsRelations = relations(brands, ({ many }) => ({
  users: many(users),
  hotels: many(hotels),
  bookings: many(bookings),
  leads: many(leads),
  destinations: many(destinations),
  blogPosts: many(blogPosts),
}));

export const usersRelations = relations(users, ({ one }) => ({
  brand: one(brands, { fields: [users.brandId], references: [brands.id] }),
}));

export const hotelsRelations = relations(hotels, ({ one, many }) => ({
  brand: one(brands, { fields: [hotels.brandId], references: [brands.id] }),
  rooms: many(rooms),
  rates: many(rates),
  bookings: many(bookings),
}));

export const roomsRelations = relations(rooms, ({ one, many }) => ({
  hotel: one(hotels, { fields: [rooms.hotelId], references: [hotels.id] }),
  rates: many(rates),
}));

export const ratesRelations = relations(rates, ({ one }) => ({
  room: one(rooms, { fields: [rates.roomId], references: [rooms.id] }),
  hotel: one(hotels, { fields: [rates.hotelId], references: [hotels.id] }),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
  brand: one(brands, { fields: [bookings.brandId], references: [brands.id] }),
  user: one(users, { fields: [bookings.userId], references: [users.id] }),
  hotel: one(hotels, { fields: [bookings.hotelId], references: [hotels.id] }),
  room: one(rooms, { fields: [bookings.roomId], references: [rooms.id] }),
}));

export const leadsRelations = relations(leads, ({ one }) => ({
  brand: one(brands, { fields: [leads.brandId], references: [brands.id] }),
  assignedAgent: one(users, { fields: [leads.assignedTo], references: [users.id] }),
}));

export const destinationsRelations = relations(destinations, ({ one }) => ({
  brand: one(brands, { fields: [destinations.brandId], references: [brands.id] }),
}));

export const blogPostsRelations = relations(blogPosts, ({ one, many }) => ({
  brand: one(brands, { fields: [blogPosts.brandId], references: [brands.id] }),
  author: one(users, { fields: [blogPosts.authorId], references: [users.id] }),
  metrics: many(blogPostMetrics),
}));

export const blogPostMetricsRelations = relations(blogPostMetrics, ({ one }) => ({
  blogPost: one(blogPosts, { fields: [blogPostMetrics.blogPostId], references: [blogPosts.id] }),
  brand: one(brands, { fields: [blogPostMetrics.brandId], references: [brands.id] }),
}));

export const lgbtEventsRelations = relations(lgbtEvents, ({ one }) => ({
  brand: one(brands, { fields: [lgbtEvents.brandId], references: [brands.id] }),
}));

export const lgbtCruisesRelations = relations(lgbtCruises, ({ one }) => ({
  brand: one(brands, { fields: [lgbtCruises.brandId], references: [brands.id] }),
}));

export const customerProfilesRelations = relations(customerProfiles, ({ one }) => ({
  user: one(users, { fields: [customerProfiles.userId], references: [users.id] }),
  brand: one(brands, { fields: [customerProfiles.brandId], references: [brands.id] }),
  referrer: one(users, { fields: [customerProfiles.referredBy], references: [users.id] }),
}));

export const loyaltyLevelsRelations = relations(loyaltyLevels, ({ one, many }) => ({
  brand: one(brands, { fields: [loyaltyLevels.brandId], references: [brands.id] }),
  accounts: many(loyaltyAccounts),
}));

export const loyaltyAccountsRelations = relations(loyaltyAccounts, ({ one, many }) => ({
  user: one(users, { fields: [loyaltyAccounts.userId], references: [users.id] }),
  brand: one(brands, { fields: [loyaltyAccounts.brandId], references: [brands.id] }),
  level: one(loyaltyLevels, { fields: [loyaltyAccounts.levelId], references: [loyaltyLevels.id] }),
  transactions: many(loyaltyTransactions),
  redemptions: many(loyaltyRedemptions),
}));

export const loyaltyTransactionsRelations = relations(loyaltyTransactions, ({ one }) => ({
  account: one(loyaltyAccounts, { fields: [loyaltyTransactions.accountId], references: [loyaltyAccounts.id] }),
  brand: one(brands, { fields: [loyaltyTransactions.brandId], references: [brands.id] }),
}));

export const loyaltyRewardsRelations = relations(loyaltyRewards, ({ one, many }) => ({
  brand: one(brands, { fields: [loyaltyRewards.brandId], references: [brands.id] }),
  minLevelRequired: one(loyaltyLevels, { fields: [loyaltyRewards.minLevel], references: [loyaltyLevels.id] }),
  redemptions: many(loyaltyRedemptions),
}));

export const loyaltyRedemptionsRelations = relations(loyaltyRedemptions, ({ one }) => ({
  account: one(loyaltyAccounts, { fields: [loyaltyRedemptions.accountId], references: [loyaltyAccounts.id] }),
  reward: one(loyaltyRewards, { fields: [loyaltyRedemptions.rewardId], references: [loyaltyRewards.id] }),
  transaction: one(loyaltyTransactions, { fields: [loyaltyRedemptions.transactionId], references: [loyaltyTransactions.id] }),
}));

export const invoicesRelations = relations(invoices, ({ one }) => ({
  brand: one(brands, { fields: [invoices.brandId], references: [brands.id] }),
  booking: one(bookings, { fields: [invoices.bookingId], references: [bookings.id] }),
  customer: one(customerProfiles, { fields: [invoices.customerId], references: [customerProfiles.id] }),
}));

// ==================== PAYMENTS ====================
export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  brandId: varchar("brand_id").references(() => brands.id),
  bookingId: varchar("booking_id").references(() => bookings.id),
  customerId: varchar("customer_id").references(() => customerProfiles.id),
  invoiceId: varchar("invoice_id").references(() => invoices.id),
  
  paypalOrderId: text("paypal_order_id"),
  paypalCaptureId: text("paypal_capture_id"),
  paypalPayerId: text("paypal_payer_id"),
  
  amount: text("amount").notNull(),
  currency: text("currency").notNull().default("MXN"),
  status: text("status").notNull().default("pending"),
  method: text("method").notNull().default("paypal"),
  
  metadata: text("metadata"),
  errorMessage: text("error_message"),
  
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const paymentsRelations = relations(payments, ({ one }) => ({
  brand: one(brands, { fields: [payments.brandId], references: [brands.id] }),
  booking: one(bookings, { fields: [payments.bookingId], references: [bookings.id] }),
  customer: one(customerProfiles, { fields: [payments.customerId], references: [customerProfiles.id] }),
  invoice: one(invoices, { fields: [payments.invoiceId], references: [invoices.id] }),
}));

// ==================== CRM CAMPAIGNS ====================
export const campaigns = pgTable("campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  brandId: varchar("brand_id").references(() => brands.id),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull(), // birthday, winback, lead_followup, reminder, review, manual
  channels: text("channels").array(), // whatsapp, email, sms
  segmentFilters: jsonb("segment_filters"), // { tiers: [], preferences: [], inactiveDays: number, etc }
  whatsappMessage: text("whatsapp_message"),
  whatsappTemplateId: text("whatsapp_template_id"),
  emailSubject: text("email_subject"),
  emailHtml: text("email_html"),
  scheduleType: text("schedule_type").default("manual"), // manual, scheduled, recurring, trigger
  scheduledAt: timestamp("scheduled_at"),
  recurringConfig: jsonb("recurring_config"), // { cron: "0 9 * * *", timezone: "America/Mexico_City" }
  triggerEvent: text("trigger_event"), // booking_confirmed, birthday, inactive_60_days
  loyaltyPointsBonus: integer("loyalty_points_bonus").default(0),
  discountPercent: integer("discount_percent"),
  discountCode: text("discount_code"),
  status: text("status").default("draft"), // draft, scheduled, running, paused, completed
  targetCount: integer("target_count").default(0),
  sentCount: integer("sent_count").default(0),
  deliveredCount: integer("delivered_count").default(0),
  openedCount: integer("opened_count").default(0),
  clickedCount: integer("clicked_count").default(0),
  convertedCount: integer("converted_count").default(0),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
});

export const campaignLogs = pgTable("campaign_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").references(() => campaigns.id),
  userId: varchar("user_id").references(() => users.id),
  channel: text("channel").notNull(), // whatsapp, email, sms
  status: text("status").default("pending"), // pending, sent, delivered, opened, clicked, failed
  messageId: text("message_id"), // Twilio/provider message ID
  sentAt: timestamp("sent_at"),
  deliveredAt: timestamp("delivered_at"),
  openedAt: timestamp("opened_at"),
  clickedAt: timestamp("clicked_at"),
  errorMessage: text("error_message"),
  responseData: jsonb("response_data"),
  bookingId: varchar("booking_id").references(() => bookings.id),
  convertedAt: timestamp("converted_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const discountCodes = pgTable("discount_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  brandId: varchar("brand_id").references(() => brands.id),
  code: text("code").notNull().unique(),
  userId: varchar("user_id").references(() => users.id),
  campaignId: varchar("campaign_id").references(() => campaigns.id),
  type: text("type").notNull().default("percentage"), // percentage, fixed
  amount: decimal("amount", { precision: 10, scale: 2 }),
  percentage: integer("percentage"),
  currency: text("currency").default("MXN"),
  validFrom: timestamp("valid_from"),
  validUntil: timestamp("valid_until"),
  maxUses: integer("max_uses").default(1),
  timesUsed: integer("times_used").default(0),
  minBookingAmount: decimal("min_booking_amount", { precision: 10, scale: 2 }),
  status: text("status").default("active"), // active, used, expired, cancelled
  createdAt: timestamp("created_at").defaultNow(),
});

export const consents = pgTable("consents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  brandId: varchar("brand_id").references(() => brands.id),
  consentType: text("consent_type").notNull(), // marketing, whatsapp, email, sms, terms, privacy
  granted: boolean("granted").notNull(),
  source: text("source").notNull(), // website, import, whatsapp, manual
  sourceReference: text("source_reference"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  grantedBy: varchar("granted_by").references(() => users.id),
  grantedAt: timestamp("granted_at").defaultNow(),
  revokedAt: timestamp("revoked_at"),
  notes: text("notes"),
});

export const loyaltyRules = pgTable("loyalty_rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  brandId: varchar("brand_id").references(() => brands.id),
  name: text("name").notNull(),
  description: text("description"),
  ruleType: text("rule_type").notNull(), // per_dollar, bonus, birthday, referral, review
  config: jsonb("config").notNull(), // { pointsPerDollar: 1, bonusPoints: 100, etc }
  minBookingAmount: decimal("min_booking_amount", { precision: 10, scale: 2 }),
  applicableTiers: text("applicable_tiers").array(), // level IDs that this rule applies to
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  active: boolean("active").default(true),
  priority: integer("priority").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const whatsappConversations = pgTable("whatsapp_conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  brandId: varchar("brand_id").references(() => brands.id),
  phoneNumber: text("phone_number").notNull(),
  userId: varchar("user_id").references(() => users.id),
  leadId: varchar("lead_id").references(() => leads.id),
  context: jsonb("context"), // { intent: string, destination: string, dates: string, pax: number }
  lastMessage: text("last_message"),
  lastMessageAt: timestamp("last_message_at"),
  status: text("status").default("active"), // active, waiting_agent, closed
  assignedTo: varchar("assigned_to").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const whatsappMessages = pgTable("whatsapp_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").references(() => whatsappConversations.id),
  direction: text("direction").notNull(), // inbound, outbound
  messageType: text("message_type").default("text"), // text, template, image, document
  content: text("content"),
  twilioSid: text("twilio_sid"),
  status: text("status").default("sent"), // sent, delivered, read, failed
  aiAnalysis: jsonb("ai_analysis"), // { intent, entities, suggestedAction }
  createdAt: timestamp("created_at").defaultNow(),
});

// Campaign Relations
export const campaignsRelations = relations(campaigns, ({ one, many }) => ({
  brand: one(brands, { fields: [campaigns.brandId], references: [brands.id] }),
  createdByUser: one(users, { fields: [campaigns.createdBy], references: [users.id] }),
  logs: many(campaignLogs),
}));

export const campaignLogsRelations = relations(campaignLogs, ({ one }) => ({
  campaign: one(campaigns, { fields: [campaignLogs.campaignId], references: [campaigns.id] }),
  user: one(users, { fields: [campaignLogs.userId], references: [users.id] }),
  booking: one(bookings, { fields: [campaignLogs.bookingId], references: [bookings.id] }),
}));

export const discountCodesRelations = relations(discountCodes, ({ one }) => ({
  brand: one(brands, { fields: [discountCodes.brandId], references: [brands.id] }),
  user: one(users, { fields: [discountCodes.userId], references: [users.id] }),
  campaign: one(campaigns, { fields: [discountCodes.campaignId], references: [campaigns.id] }),
}));

export const consentsRelations = relations(consents, ({ one }) => ({
  user: one(users, { fields: [consents.userId], references: [users.id] }),
  brand: one(brands, { fields: [consents.brandId], references: [brands.id] }),
}));

export const loyaltyRulesRelations = relations(loyaltyRules, ({ one }) => ({
  brand: one(brands, { fields: [loyaltyRules.brandId], references: [brands.id] }),
}));

export const whatsappConversationsRelations = relations(whatsappConversations, ({ one, many }) => ({
  brand: one(brands, { fields: [whatsappConversations.brandId], references: [brands.id] }),
  user: one(users, { fields: [whatsappConversations.userId], references: [users.id] }),
  lead: one(leads, { fields: [whatsappConversations.leadId], references: [leads.id] }),
  messages: many(whatsappMessages),
}));

export const whatsappMessagesRelations = relations(whatsappMessages, ({ one }) => ({
  conversation: one(whatsappConversations, { fields: [whatsappMessages.conversationId], references: [whatsappConversations.id] }),
}));

// ==================== INSERT SCHEMAS ====================
export const insertBrandSchema = createInsertSchema(brands).omit({ id: true, createdAt: true });
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertHotelSchema = createInsertSchema(hotels).omit({ id: true });
export const insertRoomSchema = createInsertSchema(rooms).omit({ id: true });
export const insertRateSchema = createInsertSchema(rates).omit({ id: true });
export const insertBookingSchema = createInsertSchema(bookings).omit({ id: true, createdAt: true, confirmationCode: true }).extend({
  checkIn: z.union([z.date(), z.string().transform(val => new Date(val))]),
  checkOut: z.union([z.date(), z.string().transform(val => new Date(val))]),
});
export const insertLeadSchema = createInsertSchema(leads).omit({ id: true, createdAt: true, convertedAt: true, customerId: true });
export const insertInteractionSchema = createInsertSchema(interactions).omit({ id: true, createdAt: true });
export const insertDestinationSchema = createInsertSchema(destinations).omit({ id: true });
export const insertProviderSchema = createInsertSchema(providers).omit({ id: true });
export const insertBlogPostSchema = createInsertSchema(blogPosts).omit({ id: true, createdAt: true });
export const insertBlogPostMetricsSchema = createInsertSchema(blogPostMetrics).omit({ id: true });
export const insertLgbtEventSchema = createInsertSchema(lgbtEvents).omit({ id: true });
export const insertLgbtCruiseSchema = createInsertSchema(lgbtCruises).omit({ id: true });
export const insertCustomerProfileSchema = createInsertSchema(customerProfiles).omit({ id: true, createdAt: true, updatedAt: true });
export const insertLoyaltyLevelSchema = createInsertSchema(loyaltyLevels).omit({ id: true });
export const insertLoyaltyAccountSchema = createInsertSchema(loyaltyAccounts).omit({ id: true, enrolledAt: true });
export const insertLoyaltyTransactionSchema = createInsertSchema(loyaltyTransactions).omit({ id: true, createdAt: true });
export const insertLoyaltyRewardSchema = createInsertSchema(loyaltyRewards).omit({ id: true });
export const insertLoyaltyRedemptionSchema = createInsertSchema(loyaltyRedemptions).omit({ id: true, createdAt: true });
export const insertInvoiceSchema = createInsertSchema(invoices).omit({ id: true, createdAt: true });
export const insertPaymentSchema = createInsertSchema(payments).omit({ id: true, createdAt: true });
export const insertCampaignSchema = createInsertSchema(campaigns).omit({ id: true, createdAt: true });
export const insertCampaignLogSchema = createInsertSchema(campaignLogs).omit({ id: true, createdAt: true });
export const insertDiscountCodeSchema = createInsertSchema(discountCodes).omit({ id: true, createdAt: true });
export const insertConsentSchema = createInsertSchema(consents).omit({ id: true, grantedAt: true });
export const insertLoyaltyRuleSchema = createInsertSchema(loyaltyRules).omit({ id: true, createdAt: true });
export const insertWhatsappConversationSchema = createInsertSchema(whatsappConversations).omit({ id: true, createdAt: true });
export const insertWhatsappMessageSchema = createInsertSchema(whatsappMessages).omit({ id: true, createdAt: true });
export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({ id: true, createdAt: true });
export const insertLeadStatusHistorySchema = createInsertSchema(leadStatusHistory).omit({ id: true, changedAt: true });

// ==================== TYPES ====================
export type InsertBrand = z.infer<typeof insertBrandSchema>;
export type Brand = typeof brands.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertHotel = z.infer<typeof insertHotelSchema>;
export type Hotel = typeof hotels.$inferSelect;
export type InsertRoom = z.infer<typeof insertRoomSchema>;
export type Room = typeof rooms.$inferSelect;
export type InsertRate = z.infer<typeof insertRateSchema>;
export type Rate = typeof rates.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookings.$inferSelect;
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Lead = typeof leads.$inferSelect;
export type InsertInteraction = z.infer<typeof insertInteractionSchema>;
export type Interaction = typeof interactions.$inferSelect;
export type InsertDestination = z.infer<typeof insertDestinationSchema>;
export type Destination = typeof destinations.$inferSelect;
export type InsertProvider = z.infer<typeof insertProviderSchema>;
export type Provider = typeof providers.$inferSelect;
export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;
export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPostMetrics = z.infer<typeof insertBlogPostMetricsSchema>;
export type BlogPostMetrics = typeof blogPostMetrics.$inferSelect;
export type InsertLgbtEvent = z.infer<typeof insertLgbtEventSchema>;
export type LgbtEvent = typeof lgbtEvents.$inferSelect;
export type InsertLgbtCruise = z.infer<typeof insertLgbtCruiseSchema>;
export type LgbtCruise = typeof lgbtCruises.$inferSelect;
export type InsertCustomerProfile = z.infer<typeof insertCustomerProfileSchema>;
export type CustomerProfile = typeof customerProfiles.$inferSelect;
export type InsertLoyaltyLevel = z.infer<typeof insertLoyaltyLevelSchema>;
export type LoyaltyLevel = typeof loyaltyLevels.$inferSelect;
export type InsertLoyaltyAccount = z.infer<typeof insertLoyaltyAccountSchema>;
export type LoyaltyAccount = typeof loyaltyAccounts.$inferSelect;
export type InsertLoyaltyTransaction = z.infer<typeof insertLoyaltyTransactionSchema>;
export type LoyaltyTransaction = typeof loyaltyTransactions.$inferSelect;
export type InsertLoyaltyReward = z.infer<typeof insertLoyaltyRewardSchema>;
export type LoyaltyReward = typeof loyaltyRewards.$inferSelect;
export type InsertLoyaltyRedemption = z.infer<typeof insertLoyaltyRedemptionSchema>;
export type LoyaltyRedemption = typeof loyaltyRedemptions.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoices.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaignLog = z.infer<typeof insertCampaignLogSchema>;
export type CampaignLog = typeof campaignLogs.$inferSelect;
export type InsertDiscountCode = z.infer<typeof insertDiscountCodeSchema>;
export type DiscountCode = typeof discountCodes.$inferSelect;
export type InsertConsent = z.infer<typeof insertConsentSchema>;
export type Consent = typeof consents.$inferSelect;
export type InsertLoyaltyRule = z.infer<typeof insertLoyaltyRuleSchema>;
export type LoyaltyRule = typeof loyaltyRules.$inferSelect;
export type InsertWhatsappConversation = z.infer<typeof insertWhatsappConversationSchema>;
export type WhatsappConversation = typeof whatsappConversations.$inferSelect;
export type InsertWhatsappMessage = z.infer<typeof insertWhatsappMessageSchema>;
export type WhatsappMessage = typeof whatsappMessages.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertLeadStatusHistory = z.infer<typeof insertLeadStatusHistorySchema>;
export type LeadStatusHistory = typeof leadStatusHistory.$inferSelect;

export const searchFiltersSchema = z.object({
  destination: z.string().optional(),
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
  guests: z.number().min(1).max(10).optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  lgbtFriendlyOnly: z.boolean().optional(),
  amenities: z.array(z.string()).optional(),
});

export type SearchFilters = z.infer<typeof searchFiltersSchema>;

export const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

export type LoginCredentials = z.infer<typeof loginSchema>;
