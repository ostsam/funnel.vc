
import { db } from "../src/db/client";
import { user, vcProfile } from "../src/db/schema";
import { SECTORS } from "../src/lib/constants";
import { sql } from "drizzle-orm";

const ADJECTIVES = ["Blue", "Red", "Green", "Golden", "Iron", "Velocity", "First", "Next", "Future", "Global", "Local", "Alpha", "Omega", "Prime", "Apex", "Summit", "Horizon", "North", "South", "East", "West"];
const NOUNS = ["Rock", "River", "Mountain", "Star", "Gate", "Bridge", "Oak", "Pine", "Wave", "Peak", "Valley", "Harbor", "Bay", "Point", "Capital", "Ventures", "Partners", "Fund", "Group", "Associates"];

function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomSubset<T>(array: readonly T[], min: number, max: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, getRandomInt(min, max));
}

async function seed() {
  console.log("Seeding VCs...");

  for (let i = 0; i < 100; i++) {
    const adj = ADJECTIVES[getRandomInt(0, ADJECTIVES.length - 1)];
    const noun = NOUNS[getRandomInt(0, NOUNS.length - 1)];
    const firmName = `${adj} ${noun} ${i}`; // Adding index to ensure uniqueness nicely
    const slug = `${adj.toLowerCase()}-${noun.toLowerCase()}-${i}`;
    const email = `vc${i}@demo.com`;
    const userId = crypto.randomUUID();
    
    const targetSectors = getRandomSubset(SECTORS, 1, 5);
    const thesis = `We invest in ambitious founders building in ${targetSectors.join(", ")}. Looking for 10x returns.`;
    
    const minCheck = getRandomInt(50, 200) * 1000; // 50k - 200k
    const maxCheck = minCheck + getRandomInt(100, 1000) * 1000; // min + 100k - 1m

    try {
      await db.transaction(async (tx) => {
        // 1. Create User (Bypassing RLS for user creation as it's usually open or we are admin)
        // Wait, user table might have RLS too. Let's check schema.
        // User table has RLS policy: `user_owner_access` (id = current_user_id).
        // So we need to "be" the user to insert them? No, usually INSERT policies are permissive or handled by auth service.
        // But here we are inserting directly.
        // If we run as superuser (which the db client likely is), we might bypass. 
        // Let's try inserting user first. If it fails, we know why.
        // Actually, usually RLS applies to SELECT/UPDATE/DELETE. INSERT is often open OR restricted.
        // But wait, `user_owner_access` is `for: "all"`, so it includes INSERT.
        // `withCheck` ensures we can only insert rows where id = current_user_id.
        // So we MUST set the config variable BEFORE inserting the user if we want to satisfy the policy.
        
        await tx.execute(sql`SELECT set_config('app.current_user_id', ${userId}, true)`);

        await tx.insert(user).values({
          id: userId,
          name: `Partner at ${firmName}`,
          email: email,
          emailVerified: true,
          role: "vc",
          createdAt: new Date(),
          updatedAt: new Date(),
          image: `https://api.dicebear.com/9.x/avataaars/svg?seed=${slug}`,
        });

        // 2. Create VC Profile
        // The transaction config is already set, so this should pass the `vc_owner_access` policy check (userId = authenticatedUser).
        await tx.insert(vcProfile).values({
          userId: userId,
          firmName: firmName,
          thesis: thesis,
          sectors: JSON.stringify(targetSectors),
          minCheck: minCheck,
          maxCheck: maxCheck,
          slug: slug,
        });
      });
      
      if (i % 10 === 0) process.stdout.write(".");
    } catch (e) {
      console.error(`\nFailed to insert VC ${i}:`, e);
    }
  }

  console.log("\nDone seeding 100 VCs.");
  process.exit(0);
}

seed();
