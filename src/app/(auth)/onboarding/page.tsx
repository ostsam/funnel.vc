import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function OnboardingPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const dbUser = await db.query.user.findFirst({
    where: eq(user.id, session.user.id),
  });

  if (!dbUser) {
    redirect("/login");
  }

  if (dbUser.role === "vc") {
    redirect("/vc/settings");
  } else {
    redirect("/founder/setup");
  }
}
