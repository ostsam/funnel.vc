import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { founderProfile, vcProfile } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { generateObject } from "ai";
import { model } from "@/lib/ai";
import { z } from "zod";

const pitchSchema = z.object({
  vcId: z.string().min(1, "VC ID is required"),
  deckLink: z.string().url("Must be a valid URL"), // This should come from founderProfile.deckLink if already uploaded
});

const aiAnalysisSchema = z.object({
  isMatch: z.boolean(),
  memo: z.string(),
  analysis: z.object({
    strengths: z.array(z.string()),
    weaknesses: z.array(z.string()),
  }),
});

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({
    headers: req.headers,
  });

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const body = await req.json();
    const { vcId, deckLink } = pitchSchema.parse(body);

    // Fetch Founder's Profile (to get deckText and generalAnalysis)
    const founder = await db.query.founderProfile.findFirst({
      where: eq(founderProfile.userId, userId),
    });

    if (!founder) {
      return NextResponse.json({ message: "Founder profile not found." }, { status: 404 });
    }
    
    // Use the founder's stored deckText or analysis
    let founderDeckContent = "";
    if (founder.generalAnalysis) {
      const analysis = founder.generalAnalysis as any; // Cast to any to access properties
      founderDeckContent = `Startup Summary: ${analysis.summary}\nStrengths: ${analysis.strengths.join(", ")}\nWeaknesses: ${analysis.weaknesses.join(", ")}`;
    } else if (founder.deckText) {
      try {
        const parsedDeck = JSON.parse(founder.deckText);
        founderDeckContent = parsedDeck.fullText?.substring(0, 50000) || ""; // Truncate for AI
      } catch (e) {
        console.error("Error parsing founder deck text:", e);
        return NextResponse.json({ message: "Invalid deck content in profile." }, { status: 400 });
      }
    }

    if (!founderDeckContent) {
      return NextResponse.json({ message: "No valid deck content found for pitching." }, { status: 400 });
    }

    // Fetch VC's Profile (to get thesis)
    const vc = await db.query.vcProfile.findFirst({
      where: eq(vcProfile.id, vcId),
    });

    if (!vc) {
      return NextResponse.json({ message: "VC profile not found." }, { status: 404 });
    }

    // Step A: Anthropic Validation (Sonnet 4.5)
    const { object: aiResponse } = await generateObject({
      model,
      schema: aiAnalysisSchema,
      system: `You are an AI assistant specialized in venture capital deal flow. Your task is to critically assess the fit between a startup's pitch and a VC's investment thesis. Be objective and concise.`,
      prompt: `Startup Pitch Deck Content:
      """
      ${founderDeckContent}
      """

      VC Investment Thesis:
      """
      ${vc.thesis}
      """

      Based on the startup's content and the VC's thesis, determine if there is a strong, viable match.
      - 'isMatch': boolean, true if there's a strong fit, false otherwise.
      - 'memo': string, a concise explanation (1-2 sentences) of the match/no-match decision.
      - 'analysis': object, detailing relevant strengths and weaknesses of the match.`,
    });

    // Step B: The Monday Sync (TODO: Implement Monday.com integration here)
    if (aiResponse.isMatch) {
      console.log(`TODO: Implement Monday.com sync for VC ${vc.firmName} with Founder ${founder.startupName}`);
      // In a real scenario, you'd call a Monday.com API here
      // For now, we'll just return the AI response.
    }

    // Step C: Feedback Loop
    return NextResponse.json(aiResponse, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.issues }, { status: 400 });
    }
    console.error("Error submitting pitch:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
