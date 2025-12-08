Project: Funnel.vc

Tagline: The Thesis-Driven Deal Flow Network.
Domain: funnel.vc

1. The High-Level Pitch

Founders spray-and-pray pitch decks. VCs ignore 99% of them.
Funnel.vc is a two-sided marketplace where VCs publish their "Executable Thesis" and Founders get algorithmically matched to the right investors.
We use AI to validate the match and Monday.com to automate the workflow.

2. The Architecture & Stack

We are building a Real-Time Data Pipeline across three environments.

The Stack (Speedrun Edition)

Frontend: Next.js 14 (App Router) + Tailwind CSS.

Auth: Better-Auth (Lightweight, self-hosted, type-safe). https://www.better-auth.com/docs/introduction

Database: Postgres (Hosted on Neon). _Chosen for paid-tier performance and Database Branching (Instant "Undo" button)._

ORM: Drizzle ORM & Kit (SQL-like, zero runtime overhead). https://orm.drizzle.team/docs/get-started/postgresql-new

Security: Postgres RLS (Row Level Security) enforcing tenant isolation with Transaction-Scoped Config.

AI: Anthropic Claude Sonnet 4.5 (Latest reasoning model for Thesis Matching).

CRM: Monday.com (The VC Dashboard). https://developer.monday.com/api-reference/docs/basics

3. Database Schema (Drizzle ORM with RLS)

Copy-paste this into your src/db/schema.ts file immediately.

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
}, (t) => ({
// RLS Policy:
// 1. SELECT: Publicly visible (Founders need to see VCs to pitch them)
// 2. INSERT/UPDATE: Only the owner (VC) can modify their own profile
policy: pgPolicy("vc_owner_access", {
for: "all",
using: sql`true`, // Public Read
withCheck: sql`${t.userId} = ${authenticatedUser}`, // Owner Write
}),
}));

export const founderProfile = pgTable("founder_profile", {
id: uuid("id").defaultRandom().primaryKey(),
userId: text("userId").notNull().references(() => user.id).unique(),
startupName: text("startup_name").notNull(),
sector: text("sector").notNull(),
askAmount: integer("ask_amount").notNull(),
deckLink: text("deck_link").notNull(),
deckText: text("deck_text"), // Raw extracted text for search/AI
generalAnalysis: jsonb("general_analysis"), // Structured "Report Card" (Strengths, Weaknesses, Viability)
}, (t) => ({// RLS Policy:
// 1. Founder can see/edit their own profile
// 2. VCs can see profiles that have PITCHED them (Complex join, simplified for hackathon to "Public Read" or "Owner Read")
policy: pgPolicy("founder_owner_access", {
for: "all",
using: sql`${t.userId} = ${authenticatedUser}`,
withCheck: sql`${t.userId} = ${authenticatedUser}`,
}),
}));

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

4. The 4-Hour Execution Phase

Phase 1: Infrastructure & Auth (Hour 0:00 - 0:45)

Goal: A working app where users can log in via Better-Auth and select a role.

Neon Setup:

Create a new Project in Neon (use your paid account).
Get the Connection String (Pooled).
Copy DATABASE_URL and BETTER_AUTH_SECRET (generate one) to .env.
Repo Setup:

bun create next-app funnel-vc --typescript --tailwind --eslint
bun add better-auth drizzle-orm pg dotenv ai @ai-sdk/anthropic zod pdf2json
bun add -d drizzle-kit @types/pg
Database Sync:

Create drizzle.config.ts.
Run bun drizzle-kit push to deploy the schema to Neon.
Enable RLS: Run this raw SQL in Neon SQL Editor:
ALTER TABLE vc_profile ENABLE ROW LEVEL SECURITY; ALTER TABLE founder_profile ENABLE ROW LEVEL SECURITY;
Better-Auth Implementation:

Create lib/auth.ts: Configure email/password provider.
Create app/api/auth/[...all]/route.ts: Mount the handlers.

Role Selection: Create an /onboarding page. If user.role is null, force them to pick "VC" or "Founder". Update the DB row on click.

Phase 2: The VC Onboarding (Hour 0:45 - 1:45)

Goal: VCs generate their public profile page and connect Monday.com.

Shared Taxonomy (CRITICAL):

Create src/lib/constants.ts with `export const SECTORS = [
  "B2B SaaS",
  "Fintech",
  "Consumer (B2C)",
  "Marketplace",
  "Healthtech & Digital Health",
  "BioTech & Life Sciences",
  "Deep Tech & Frontier",
  "Artificial Intelligence (AI) & ML",
  "Crypto & Web3",
  "Climate & CleanTech",
  "Proptech",
  "EdTech",
  "E-commerce & DTC",
  "Hardware & Robotics",
  "Cybersecurity",
  "DevOps & Developer Tools",
  "Gaming & Interactive Media",
  "Mobility & Logistics",
  "LegalTech",
  "InsurTech",
  "AgTech",
  "SpaceTech",
  "GovTech",
  "Industrial & Manufacturing",
  "Social & Community"
] as const;`
Both VCs and Founders MUST use this list. VCs = Multi-select. Founders = Single-select.

The VC Form (/vc/settings):

Inputs: Firm Name, Thesis (Text Area), Min/Max Check Size, Sectors (Checkbox Grid).
Server Action: createVCProfile. Inserts into vcProfile.

The Monday Hook:

Input field: "Monday Board ID".
Use Monday API to validate board existence if possible.

Dynamic Profile Page (app/[slug]/page.tsx):

This is the public landing page for the VC (e.g., funnel.vc/isaac).
Fetch vcProfile by slug using Drizzle.

Phase 3: The Matching Engine (Hour 1:45 - 2:45)

Goal: Founders see a ranked list of VCs to pitch.

The Hybrid Matching Logic:

1. Hard Filter (SQL): Fetch VCs where `vc.minCheck <= founder.askAmount <= vc.maxCheck`.
2. Soft Filter (Code): `vc.sectors.includes(founder.sector)`.
3. AI Ranking (Sonnet 4.5):
   Take the remaining VCs (e.g., top 20).
   Send their Theses + Founder Deck to Claude.
   Prompt: "Rank these investors for this startup. Return top 5 IDs."

The "Pitch" Action:

Render a "Pitch Now" button on each VC card.
Clicking opens a modal: "Confirm Deck Link".
Submitting calls POST /api/pitch.

Phase 4: The Intelligence Bridge (Hour 2:45 - 3:45)

Goal: Validating the match with Sonnet 4.5 and pushing to Monday.

API Route: app/api/pitch/route.ts

Step 0: The PDF Extraction Layer
Reuse the PDF parser utility from `/columbia-hackathon`.
Copy/paste the `lib/pdf.ts` file verbatim into this project.
Use `pdf2json` to extract raw text from the Founder's uploaded PDF URL.
Save this text to `founderProfile.deckText`.

CRITICAL RLS SAFETY:
When running queries on behalf of a user, you MUST use a transaction with `is_local=true` to prevent connection pool poisoning.

await db.transaction(async (tx) => {
// 'true' as the 3rd argument is VITAL. It sets the variable ONLY for this transaction.
await tx.execute(sql`SELECT set_config('app.current_user_id', ${userId}, true)`);

// Now RLS policies apply safely to all queries in this tx
await tx.insert(founderProfile).values(...);
});

Step A: Anthropic Validation (Sonnet 4.5)

Use `generateObject` from the Vercel AI SDK for strict JSON output.
Schema: `z.object({ isMatch: z.boolean(), memo: z.string(), analysis: z.object({ strengths: z.array(z.string()), weaknesses: z.array(z.string()) }) })`.
Prompt: "You are a Partner... Is this a match? Return JSON."
Step B: The Monday Sync

Only if isMatch === true.
Use monday-sdk-js.
Mutation: Create Item with Columns (Email, Deck Link, AI Memo).

Step C: Feedback Loop

If isMatch === false, return the AI's rejection reason to the Founder immediately.

Phase 4.5: The Monday Webhook (Closing the Loop)

Goal: If Isaac moves the deal to "Meeting Scheduled" on Monday.com, the Founder gets an email/alert.
Create /api/webhooks/monday.
Parse the event. Update a `status` field in the DB.

Phase 5: Polish & Deployment (Hour 3:45 - 4:00)

Pre-Seed Data (CRITICAL FOR DEMO):
Run a script to inject 10-15 diverse VC profiles (Fintech, Bio, Deep Tech, Consumer) with distinct theses.
The matching engine needs targets to work visually.

Deploy: Push to Vercel.

Env Vars: Ensure DATABASE_URL, BETTER_AUTH_SECRET, ANTHROPIC_API_KEY, and MONDAY_API_TOKEN are set in Vercel.

Sanity Check: Log in as "Isaac" (VC), setup profile. Log in as "Founder", pitch Isaac. Check Monday board.

5. Judge-Specific Feature Checklist

🦄 For Isaac (VC)
The Hook: "The Gatekeeper."
Feature: Thesis-Gating.
Demo Moment: Upload a "Generic AI Wrapper" deck to Isaac's funnel. Show it getting auto-rejected.

👷 For Alexander (Ops)
The Hook: "The Auto-CRM."
Feature: Monday.com Injection.
Demo Moment: Open the Monday board on the big screen. Click "Submit" on the founder side. Watch the row appear instantly.

👩‍💻 For Karen (Anthropic)
The Hook: "Reasoning, not Search."
Feature: Sonnet 4.5 Analysis.
Demo Moment: Show the AI's internal monologue. "I see this startup is in Fintech, but Isaac's thesis specifically excludes 'Neobanks'. Therefore, reject."

6. The "Emergency" Prompts

Prompt 1: Generate the VC Dashboard (Lovable/Cursor)
"Create a dashboard for a VC using Tailwind CSS... Sidebar: Deal Flow, Thesis Settings. Main: Grid of Pending Pitches."

Prompt 2: The Monday.com Integration Function
"Write a TypeScript function syncToMonday using monday-sdk-js... Execute a GraphQL mutation to create an item..."

Prompt 3: The Matching Algorithm (AI-First)
"I have a list of VC objects { id, thesis, sectors } and a Founder object { deck, sector }. Write a function that uses the Anthropic SDK to send this JSON to Claude. Ask Claude to return the IDs of the top 3 best matching VCs based on the thesis fit."
