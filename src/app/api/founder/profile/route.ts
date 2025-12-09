import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { founderProfile } from "@/db/schema";
import { PdfService } from "@/lib/pdf"; // Import PdfService
import { sql } from "drizzle-orm";
import { z } from "zod";

const founderProfileSchema = z.object({
  startupName: z.string().min(1, "Startup name is required"),
  sector: z.string().min(1, "Sector is required"),
  askAmount: z.number().int().positive("Ask amount must be a positive number"),
  deckLink: z.string().url("Must be a valid URL"),
});

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession();

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const contentType = req.headers.get("content-type") || "";

    let deckText: string | undefined;
    let data: { startupName: string; sector: string; askAmount: number; deckLink: string };

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      
      if (!file) {
        return NextResponse.json({ message: "No file uploaded" }, { status: 400 });
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
        const { fullText } = await PdfService.extractText(buffer);
        deckText = fullText;
      } catch (pdfError) {
        console.error("PDF Extraction Error:", pdfError);
        return NextResponse.json({ message: "Failed to process pitch deck PDF." }, { status: 400 });
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
        const { fullText } = await PdfService.extractText(buffer);
        deckText = fullText;
      } catch (pdfError) {
        console.error("PDF Extraction Error:", pdfError);
        // Optionally, return an error to the user or proceed without deckText
        return NextResponse.json({ message: "Failed to process pitch deck PDF." }, { status: 400 });
      }
    }

    await db.transaction(async (tx) => {
      // 'true' as the 3rd argument is VITAL. It sets the variable ONLY for this transaction.
      await tx.execute(sql`SELECT set_config('app.current_user_id', ${userId}, true)`);

      await tx.insert(founderProfile).values({
        userId: userId,
        startupName: data.startupName,
        sector: data.sector,
        askAmount: data.askAmount,
        deckLink: data.deckLink,
        deckText: deckText, // Save the extracted text
      });
    });

    return NextResponse.json({ message: "Founder profile created successfully" }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.errors }, { status: 400 });
    }
    console.error("Error creating founder profile:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
