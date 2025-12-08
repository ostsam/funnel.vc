CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"accountId" text NOT NULL,
	"providerId" text NOT NULL,
	"userId" text NOT NULL,
	"accessToken" text,
	"refreshToken" text,
	"idToken" text,
	"expiresAt" timestamp,
	"password" text
);
--> statement-breakpoint
CREATE TABLE "founder_profile" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" text NOT NULL,
	"startup_name" text NOT NULL,
	"sector" text NOT NULL,
	"ask_amount" integer NOT NULL,
	"deck_link" text NOT NULL,
	"deck_text" text,
	"general_analysis" jsonb,
	CONSTRAINT "founder_profile_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
ALTER TABLE "founder_profile" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"ipAddress" text,
	"userAgent" text,
	"userId" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"emailVerified" boolean NOT NULL,
	"image" text,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL,
	"role" text DEFAULT 'founder' NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "vc_profile" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" text NOT NULL,
	"firm_name" text NOT NULL,
	"thesis" text NOT NULL,
	"sectors" text NOT NULL,
	"min_check" integer NOT NULL,
	"max_check" integer NOT NULL,
	"monday_board_id" text,
	"slug" text NOT NULL,
	CONSTRAINT "vc_profile_userId_unique" UNIQUE("userId"),
	CONSTRAINT "vc_profile_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "vc_profile" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expiresAt" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "founder_profile" ADD CONSTRAINT "founder_profile_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vc_profile" ADD CONSTRAINT "vc_profile_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "founder_owner_access" ON "founder_profile" AS PERMISSIVE FOR ALL TO public USING ("founder_profile"."userId" = (select current_setting('app.current_user_id', true))) WITH CHECK ("founder_profile"."userId" = (select current_setting('app.current_user_id', true)));--> statement-breakpoint
CREATE POLICY "vc_owner_access" ON "vc_profile" AS PERMISSIVE FOR ALL TO public USING (true) WITH CHECK ("vc_profile"."userId" = (select current_setting('app.current_user_id', true)));