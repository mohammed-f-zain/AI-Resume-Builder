import { NextResponse } from "next/server";
import { getModel, getOpenAIClient } from "@/lib/openai";
import { parseResumeFile } from "@/lib/parsers/resume-parser";
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
        content: `You are an ATS (Applicant Tracking System) resume expert. Analyze the resume text and provide a detailed ATS compatibility assessment. ${langInstruction}

Score each category 0-100:
- formatting: ATS-parseable layout, no problematic elements
- keywords: industry-relevant keywords present
- structure: clear sections, standard headings
- content: quality of achievements, metrics, relevance
- readability: clarity, conciseness, grammar

Overall score is weighted average (formatting 25%, keywords 20%, structure 20%, content 25%, readability 10%).

Return JSON:
{
  "score": number (0-100),
  "breakdown": { "formatting", "keywords", "structure", "content", "readability" },
  "suggestions": ["actionable improvement 1", ...],
  "strengths": ["strength 1", ...]
}`,
      },
      {
        role: "user",
        content: `Analyze this resume:\n\n${extractedText.slice(0, 12000)}`,
      },
    ],
    temperature: 0.5,
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response from AI");
  }

  const analysis = JSON.parse(content) as Omit<ATSAnalysis, "extractedText">;
  return {
    ...analysis,
    extractedText: extractedText.slice(0, 2000),
  };
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
