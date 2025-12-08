import { pgTable, text, timestamp, integer, uuid, boolean, pgPolicy, jsonb } from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

// --- Better-Auth Required Tables ---
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull(),
  image: text("image"),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
  role: text("role").notNull().default("founder"), // "vc" or "founder"
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt").notNull(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId").notNull().references(() => user.id),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId").notNull().references(() => user.id),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  expiresAt: timestamp("expiresAt"),
  password: text("password"),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
});

// --- Funnel.vc Custom Tables with RLS ---

// Helper for RLS: Checks if current_setting('app.current_user_id') matches the row's userId
// CRITICAL: This depends on the transaction setting 'is_local=true' to avoid connection pooling leaks.
const authenticatedUser = sql`(select current_setting('app.current_user_id', true))`;

export const vcProfile = pgTable("vc_profile", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("userId").notNull().references(() => user.id).unique(),
  firmName: text("firm_name").notNull(),
  thesis: text("thesis").notNull(),
  sectors: text("sectors").notNull(), // JSON string or array of strings from Shared Taxonomy
  minCheck: integer("min_check").notNull(),
  maxCheck: integer("max_check").notNull(),
  mondayBoardId: text("monday_board_id"),
  slug: text("slug").notNull().unique(),
}, (t) => [
  // RLS Policy:
  // 1. SELECT: Publicly visible (Founders need to see VCs to pitch them)
  // 2. INSERT/UPDATE: Only the owner (VC) can modify their own profile
  pgPolicy("vc_owner_access", {
    for: "all",
    using: sql`true`, // Public Read
    withCheck: sql`${t.userId} = ${authenticatedUser}`, // Owner Write
  }),
]);

export const founderProfile = pgTable("founder_profile", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("userId").notNull().references(() => user.id).unique(),
  startupName: text("startup_name").notNull(),
  sector: text("sector").notNull(),
  askAmount: integer("ask_amount").notNull(),
  deckLink: text("deck_link").notNull(),
  deckText: text("deck_text"), // Raw extracted text for search/AI
  generalAnalysis: jsonb("general_analysis"), // Structured "Report Card" (Strengths, Weaknesses, Viability)
}, (t) => [
  // RLS Policy:
  // 1. Founder can see/edit their own profile
  // 2. VCs can see profiles that have PITCHED them (Complex join, simplified for hackathon to "Public Read" or "Owner Read")
  pgPolicy("founder_owner_access", {
    for: "all",
    using: sql`${t.userId} = ${authenticatedUser}`,
    withCheck: sql`${t.userId} = ${authenticatedUser}`,
  }),
]);

// --- RELATIONS (Crucial for Drizzle Queries) ---

export const userRelations = relations(user, ({ one }) => ({
  vcProfile: one(vcProfile, {
    fields: [user.id],
    references: [vcProfile.userId],
  }),
  founderProfile: one(founderProfile, {
    fields: [user.id],
    references: [founderProfile.userId],
  }),
}));

export const vcProfileRelations = relations(vcProfile, ({ one }) => ({
  user: one(user, {
    fields: [vcProfile.userId],
    references: [user.id],
  }),
}));

export const founderProfileRelations = relations(founderProfile, ({ one }) => ({
  user: one(user, {
    fields: [founderProfile.userId],
    references: [user.id],
  }),
}));
