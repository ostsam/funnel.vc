import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { founderProfile } from "@/db/schema";
import { PdfService } from "@/lib/pdf"; // Import PdfService
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { generateObject } from "ai";
import { model } from "@/lib/ai";

const founderProfileSchema = z.object({
	startupName: z.string().min(1, "Startup name is required"),
	sector: z.string().min(1, "Sector is required"),
	askAmount: z.number().int().positive("Ask amount must be a positive number"),
	deckLink: z.string().url("Must be a valid URL"),
});

const analysisSchema = z.object({
	strengths: z.array(z.string()),
	weaknesses: z.array(z.string()),
	viabilityScore: z.number().min(0).max(100),
	summary: z.string(),
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
		const contentType = req.headers.get("content-type") || "";

		let deckText: string | undefined;
		let data: {
			startupName: string;
			sector: string;
			askAmount: number;
			deckLink: string;
		};

		if (contentType.includes("multipart/form-data")) {
			const formData = await req.formData();
			const file = formData.get("file") as File | null;

			if (!file) {
				return NextResponse.json(
					{ message: "No file uploaded" },
					{ status: 400 }
				);
			}

			// Validate other fields
			const rawData = {
				startupName: formData.get("startupName") as string,
				sector: formData.get("sector") as string,
				askAmount: Number(formData.get("askAmount")),
				deckLink: `https://funnel.vc/uploads/${file.name}`, // Placeholder link
			};

			data = founderProfileSchema.parse(rawData);

			try {
				const arrayBuffer = await file.arrayBuffer();
				const buffer = Buffer.from(arrayBuffer);
				const { fullText, pages } = await PdfService.extractText(buffer);
				deckText = JSON.stringify({ fullText, pages });
			} catch (pdfError) {
				console.error("PDF Extraction Error:", pdfError);
				return NextResponse.json(
					{ message: "Failed to process pitch deck PDF." },
					{ status: 400 }
				);
			}
		} else {
			const body = await req.json();
			data = founderProfileSchema.parse(body);

			// Fetch PDF from deckLink and extract text
			try {
				const response = await fetch(data.deckLink);
				if (!response.ok) {
					throw new Error(`Failed to fetch PDF from ${data.deckLink}`);
				}
				const arrayBuffer = await response.arrayBuffer();
				const buffer = Buffer.from(arrayBuffer);
				const { fullText, pages } = await PdfService.extractText(buffer);
				deckText = JSON.stringify({ fullText, pages });
			} catch (pdfError) {
				console.error("PDF Extraction Error:", pdfError);
				// Optionally, return an error to the user or proceed without deckText
				return NextResponse.json(
					{ message: "Failed to process pitch deck PDF." },
					{ status: 400 }
				);
			}
		}

		let analysis: z.infer<typeof analysisSchema> | null = null;

		if (deckText) {
			try {
				const parsedDeck = JSON.parse(deckText);
				const fullText = parsedDeck.fullText;

				const { object } = await generateObject({
					model,
					schema: analysisSchema,
					system: `You are a General Partner at a Tier 1 Venture Capital firm (like Sequoia, Benchmark, or a16z). 
          Your job is to screen incoming deal flow. You are highly selective, cynical, and data-driven. 
          You ignore marketing fluff and look for:
          1. "Hair on fire" problems.
          2. Non-obvious insights or "Secrets".
          3. Structural advantages (Network effects, proprietary tech, high switching costs).
          4. Evidence of product-market fit (Retention, organic growth).
          
          You are grading this startup on its potential to be a "Fund Returner" (100x exit). 
          Be harsh. Most startups fail. Your analysis should reflect the reality of the power law.`,
					prompt: `Analyze the following pitch deck text for a startup in the "${
						data.sector
					}" sector raising $${data.askAmount}.

          DECK TEXT:
          """
          ${fullText.substring(0, 50000)}
          """

          TASK:
          Provide a critical investment memo.
          
          GUIDELINES:
          - Strengths: specific unfair advantages, not generic statements like "large market".
          - Weaknesses: fatal flaws, competitive risks, or unit economic challenges.
          - Viability Score: 0-100. (Note: <60 is a pass, 60-80 is interesting, >80 is a hot deal). Be conservative.
          - Summary: A 2-sentence punchy thesis on why we should or should not take a meeting.`,
				});

				analysis = object;
			} catch (aiError) {
				console.error("AI Analysis Error:", aiError);
				// Continue without analysis if it fails
			}
		}

		await db.transaction(async (tx) => {
			// 'true' as the 3rd argument is VITAL. It sets the variable ONLY for this transaction.
			await tx.execute(
				sql`SELECT set_config('app.current_user_id', ${userId}, true)`
			);

      await db.insert(founderProfile).values({
        userId: userId,
        startupName: data.startupName,
        sector: data.sector,
        askAmount: data.askAmount,
        deckLink: data.deckLink,
        deckText: deckText,
        generalAnalysis: analysis, // Save the AI analysis
      }).onConflictDoUpdate({
        target: founderProfile.userId,
        set: {
          startupName: data.startupName,
          sector: data.sector,
          askAmount: data.askAmount,
          deckLink: data.deckLink,
          deckText: deckText,
          generalAnalysis: analysis,
        },
      });
		});

		return NextResponse.json(
			{ message: "Founder profile created successfully" },
			{ status: 201 }
		);
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json({ message: error.issues }, { status: 400 });
		}
		console.error("Error creating founder profile:", error);
		return NextResponse.json(
			{ message: "Internal server error" },
			{ status: 500 }
		);
	}
}

export async function GET(req: NextRequest) {
	const session = await auth.api.getSession({
		headers: req.headers,
	});

	if (!session) {
		return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
	}

	const userId = session.user.id;

	try {
		const profile = await db.query.founderProfile.findFirst({
			where: eq(founderProfile.userId, userId),
		});

		if (!profile) {
			return NextResponse.json(
				{ message: "Profile not found" },
				{ status: 404 }
			);
		}

		return NextResponse.json(
			{
				startupName: profile.startupName,
				sector: profile.sector,
				askAmount: profile.askAmount,
				deckLink: profile.deckLink,
			},
			{ status: 200 }
		);
	} catch (error) {
		console.error("Error fetching founder profile:", error);
		return NextResponse.json(
			{ message: "Internal server error" },
			{ status: 500 }
		);
	}
}
