import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { founderProfile, vcProfile } from "@/db/schema";
import { eq, and, lte, gte, sql, desc } from "drizzle-orm";
import { generateObject } from "ai";
import { model } from "@/lib/ai";
import { z } from "zod";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({
    headers: req.headers,
  });

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    // 1. Fetch Founder Profile
    const founder = await db.query.founderProfile.findFirst({
      where: eq(founderProfile.userId, userId),
    });

    if (!founder) {
        // Return empty if profile not set up
      return NextResponse.json({ matches: [] }, { status: 200 });
    }

    // 2. Hard Filter (SQL): Fetch VCs where `vc.minCheck <= founder.askAmount <= vc.maxCheck`
    // And handle sector matching via soft filter later or partial match if possible.
    // Drizzle doesn't have easy "array contains" for JSON columns in all drivers, so let's fetch candidates first.
    
    const candidates = await db.select().from(vcProfile).where(
        and(
            lte(vcProfile.minCheck, founder.askAmount),
            gte(vcProfile.maxCheck, founder.askAmount)
        )
    );

    // 3. Soft Filter (Code): `vc.sectors.includes(founder.sector)`
    // Rank candidates by sector fit.
    
    let matchedVCs = candidates.filter(vc => {
        // Parse sectors if it's stored as a stringified JSON
        let vcSectors: string[] = [];
        try {
            vcSectors = JSON.parse(vc.sectors);
        } catch (e) {
            // Fallback if it's just a string or weird format
             console.error("Error parsing sectors for VC", vc.id, e);
             return false;
        }
        return vcSectors.includes(founder.sector);
    }).map(vc => ({
        ...vc,
        sectors: JSON.parse(vc.sectors), // Ensure frontend gets an array
        matchScore: 0, // Will be updated by AI
        matchReason: "Matches your sector and check size." // Default reason
    }));

    // 4. AI Ranking (Sonnet 4.5)
    if (matchedVCs.length > 0) {
      try {
        // Prepare Startup Context
        let startupSummary = `Name: ${founder.startupName}, Sector: ${founder.sector}, Ask: $${founder.askAmount}.`;
        
        // Use generalAnalysis summary if available, otherwise try to get text from deck
        const analysis = founder.generalAnalysis as any;
        if (analysis?.summary) {
          startupSummary += `\nSummary: ${analysis.summary}`;
        } else if (founder.deckText) {
          try {
            const parsedDeck = JSON.parse(founder.deckText);
            const excerpt = parsedDeck.fullText?.substring(0, 1000) || "";
            startupSummary += `\nDeck Excerpt: ${excerpt}...`;
          } catch (e) {
            // Ignore parsing error
          }
        }

        // Limit to top 20 candidates for AI analysis to save context/time
        const vcsToRank = matchedVCs.slice(0, 20);
        
        const vcList = vcsToRank.map(vc => 
          `ID: ${vc.id}\nFirm: ${vc.firmName}\nThesis: ${vc.thesis}\n`
        ).join("\n---\n");

        const rankingSchema = z.object({
          rankings: z.array(z.object({
            vcId: z.string(),
            score: z.number().min(0).max(100),
            reason: z.string()
          }))
        });

        const { object } = await generateObject({
          model,
          schema: rankingSchema,
          system: "You are an expert Deal Flow Manager. Your job is to match a specific startup with the most relevant investors based on their detailed investment thesis.",
          prompt: `Task: Rank these Venture Capital firms based on their likelihood to invest in this startup.

          STARTUP CONTEXT:
          ${startupSummary}

          CANDIDATE VCs:
          ${vcList}

          INSTRUCTIONS:
          - Assign a "score" (0-100) based on thesis fit. 
          - Provide a brief "reason" explaining the specific fit or misalignment.
          - Be discerning. A generic match should be ~70. A thesis match should be >85.
          - Return the results for ALL provided candidates.`
        });

        // Merge AI scores back into matchedVCs
        const scoreMap = new Map(object.rankings.map(r => [r.vcId, r]));
        
        matchedVCs = matchedVCs.map(vc => {
          const rank = scoreMap.get(vc.id);
          if (rank) {
            return { ...vc, matchScore: rank.score, matchReason: rank.reason };
          }
          return vc;
        });

        // Sort by score descending
        matchedVCs.sort((a, b) => b.matchScore - a.matchScore);

      } catch (aiError) {
        console.error("AI Ranking Error:", aiError);
        // Fallback: If AI fails, just keep the hard/soft filtered list (sorted by check size or something else if needed)
        // Currently they all have score 0, let's give them a default high score since they passed hard filters
        matchedVCs = matchedVCs.map(vc => ({ ...vc, matchScore: 70 }));
      }
    }

    return NextResponse.json({ matches: matchedVCs }, { status: 200 });

  } catch (error) {
    console.error("Error fetching matches:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
