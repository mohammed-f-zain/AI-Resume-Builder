import { NextResponse } from "next/server";
import { getModel, getOpenAIClient } from "@/lib/openai";
import { parseResumeFile } from "@/lib/parsers/resume-parser";
import {
  breakdownLooksLikeWeights,
  normalizeAtsAnalysis,
  normalizeAtsBreakdown,
  scoreFromBreakdown,
} from "@/lib/ats-analysis";
import type { ATSAnalysis } from "@/lib/types";

async function runAtsAnalysis(
  extractedText: string,
  language: string
): Promise<ATSAnalysis> {
  const openai = getOpenAIClient();
  const langInstruction =
    language === "ar"
      ? "Provide all suggestions and analysis text in Arabic."
      : "Provide all suggestions and analysis text in English.";

  const completion = await openai.chat.completions.create({
    model: getModel(),
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are an ATS (Applicant Tracking System) resume expert. Analyze the resume text and provide a consistent, evidence-based ATS compatibility assessment. ${langInstruction}

Be deterministic: the same resume text must produce the same scores. Do not invent random variation.

Score EACH category independently from 0–100 (NOT weight percentages like 25/20/10):
- formatting: ATS-parseable layout, standard headings, no tables/columns issues
- keywords: industry-relevant keywords present for the implied role
- structure: clear sections (Summary, Experience, Education, Skills, …), logical order
- content: quality of achievements, metrics, relevance
- readability: clarity, conciseness, grammar

Use this rubric for EVERY category:
- 90–100: excellent / fully meets ATS expectations
- 75–89: good with minor gaps
- 60–74: acceptable but needs improvements
- 40–59: weak / several gaps
- 0–39: poor / major issues

Overall score will be computed server-side as:
formatting×0.25 + keywords×0.20 + structure×0.20 + content×0.25 + readability×0.10
You may still include "score" but category scores are the source of truth.

Return JSON only:
{
  "score": number,
  "breakdown": { "formatting": 0-100, "keywords": 0-100, "structure": 0-100, "content": 0-100, "readability": 0-100 },
  "suggestions": ["actionable improvement 1", "…"],
  "strengths": ["strength 1", "…"]
}`,
      },
      {
        role: "user",
        content: `Analyze this resume:\n\n${extractedText.slice(0, 12000)}`,
      },
    ],
    // Low temperature → stable scores for the same resume text
    temperature: 0,
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response from AI");
  }

  const parsed = JSON.parse(content) as Omit<ATSAnalysis, "extractedText">;
  const breakdown = normalizeAtsBreakdown(parsed.breakdown);

  // Never show weight-echo values as category scores
  if (breakdownLooksLikeWeights(breakdown)) {
    throw new Error("Invalid ATS breakdown from model; please retry");
  }

  const { analysis } = normalizeAtsAnalysis(
    {
      ...parsed,
      breakdown,
      score: scoreFromBreakdown(breakdown),
    },
    extractedText.slice(0, 2000)
  );

  return analysis;
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";

    let extractedText = "";
    let language = "en";

    if (contentType.includes("application/json")) {
      const body = (await request.json()) as {
        text?: string;
        language?: string;
      };
      language = body.language || "en";
      extractedText = (body.text || "").trim();
      if (!extractedText || extractedText.length < 50) {
        return NextResponse.json(
          { error: "Resume text is too short to analyze" },
          { status: 400 }
        );
      }
    } else {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      language = (formData.get("language") as string) || "en";

      if (!file) {
        return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      extractedText = await parseResumeFile(buffer, file.type, file.name);

      if (!extractedText || extractedText.length < 50) {
        return NextResponse.json(
          { error: "Could not extract enough text from the file" },
          { status: 400 }
        );
      }
    }

    const result = await runAtsAnalysis(extractedText, language);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Analyze resume error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to analyze resume";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
