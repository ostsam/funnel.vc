import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db/client";

const secret = process.env.BETTER_AUTH_SECRET;

if (!secret) {
  throw new Error("BETTER_AUTH_SECRET is required for Better Auth");
}

export const auth = betterAuth({
  // If hosting on a different domain, set BETTER_AUTH_URL (e.g., https://app.example.com)
  baseURL: process.env.BETTER_AUTH_URL,
  secret,
  database: drizzleAdapter(db, { provider: "pg" }),
  emailAndPassword: {
    enabled: true,
  },
  emailVerification: {
    sendOnSignUp: false,
  },
});

