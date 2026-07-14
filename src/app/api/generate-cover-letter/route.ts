import { NextResponse } from "next/server";
import { getModel, getOpenAIClient } from "@/lib/openai";
import { parseResumeFile } from "@/lib/parsers/resume-parser";
import type { CoverLetterResult } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";

    let position: string;
    let jobDescription: string;
    let cvText: string;
    let language: "en" | "ar";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      position = (formData.get("position") as string) || "";
      jobDescription = (formData.get("jobDescription") as string) || "";
      language = ((formData.get("language") as string) || "en") as "en" | "ar";
      const file = formData.get("file") as File | null;

      if (!file) {
        return NextResponse.json({ error: "CV file is required" }, { status: 400 });
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      cvText = await parseResumeFile(buffer, file.type, file.name);
    } else {
      const body = await request.json();
      position = body.position;
      jobDescription = body.jobDescription;
      cvText = body.cvText;
      language = body.language || "en";
    }

    if (!position || !jobDescription || !cvText?.trim()) {
      return NextResponse.json(
        { error: "Position, job description, and CV are required" },
        { status: 400 }
      );
    }

    const openai = getOpenAIClient();
    const langInstruction =
      language === "ar"
        ? "Write the cover letter and all suggestions in professional Arabic."
        : "Write the cover letter and all suggestions in professional English.";

    const completion = await openai.chat.completions.create({
      model: getModel(),
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are an expert career coach and cover letter writer. ${langInstruction}

Write a compelling, tailored cover letter that:
- Addresses the specific job requirements
- Highlights relevant experience from the CV
- Uses keywords from the job description naturally
- Has a professional tone with clear structure (opening, body, closing)
- Is concise (250-400 words)

Also provide enhancement suggestions for how the candidate can better fit the role.

Return JSON:
{
  "coverLetter": "full cover letter text",
  "enhancements": ["suggestion 1", ...],
  "keywordMatches": ["matched keyword 1", ...],
  "missingKeywords": ["missing keyword 1", ...]
}`,
        },
        {
          role: "user",
          content: `Position: ${position}\n\nJob Description:\n${jobDescription}\n\nCandidate CV:\n${cvText.slice(0, 12000)}`,
        },
      ],
      temperature: 0.7,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json(
        { error: "No response from AI" },
        { status: 500 }
      );
    }

    const result: CoverLetterResult = JSON.parse(content);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Cover letter error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to generate cover letter";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
