import { NextResponse } from "next/server";
import { getModel, getOpenAIClient } from "@/lib/openai";
import type { InterviewAnswer, ResumeBasics } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { basics, answers, language } = body as {
      basics: ResumeBasics;
      answers: InterviewAnswer[];
      language: "en" | "ar";
    };

    if (!basics?.fullName || !basics?.targetRole) {
      return NextResponse.json(
        { error: "Name and target role are required" },
        { status: 400 }
      );
    }

    const openai = getOpenAIClient();
    const langInstruction =
      language === "ar"
        ? "Return skill names in Arabic when they are common soft skills; keep widely known technical skill names in their standard English form (e.g. React, Python) unless the user answered in Arabic."
        : "Return skill names in English.";

    const completion = await openai.chat.completions.create({
      model: getModel(),
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are an ATS resume specialist at Bahath Jobz. ${langInstruction}

Based on the candidate's target role, professional experience, and interview answers, suggest a comprehensive skills list they can select from for their resume.

Target role: "${basics.targetRole}"

Rules:
- Suggest 15–25 skills relevant to the target role and what the candidate actually described
- Mix technical/hard skills and soft skills
- Prefer concrete, ATS-friendly skill names (tools, languages, frameworks, methodologies, and soft skills)
- Do NOT invent skills that contradict the answers; prefer skills clearly supported or strongly implied
- Deduplicate and keep names short (1–4 words each)

Return JSON:
{
  "skills": ["React", "TypeScript", "Leadership", ...]
}`,
        },
        {
          role: "user",
          content: JSON.stringify({ basics, answers }, null, 2),
        },
      ],
      temperature: 0.5,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json(
        { error: "No response from AI" },
        { status: 500 }
      );
    }

    const parsed = JSON.parse(content) as { skills?: string[] };
    const skills = (parsed.skills ?? [])
      .map((s) => (typeof s === "string" ? s.trim() : ""))
      .filter(Boolean);

    return NextResponse.json({ skills });
  } catch (error) {
    console.error("Suggest skills error:", error);
    return NextResponse.json(
      { error: "Failed to suggest skills" },
      { status: 500 }
    );
  }
}
