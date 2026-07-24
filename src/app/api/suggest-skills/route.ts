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

Based on the candidate's target role, experience, and interview answers, suggest skills in TWO groups:

1. **competencies** — role-specific core domain competencies (e.g. for a nurse: Critical Care Nursing, Mechanical Ventilation; for an engineer: System Design, CI/CD). 10–16 items.
2. **skills** — technical tools/systems PLUS soft/additional skills (e.g. EHR, Leadership, Communication). 10–16 items.

Target role: "${basics.targetRole}"

Rules:
- Prefer skills supported or strongly implied by answers
- Do NOT invent unrelated skills
- Deduplicate; keep names short (1–5 words)
- competencies and skills must not heavily overlap

Return JSON:
{
  "competencies": ["...", "..."],
  "skills": ["...", "..."]
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

    const parsed = JSON.parse(content) as {
      competencies?: string[];
      skills?: string[];
    };

    const competencies = (parsed.competencies ?? [])
      .map((s) => (typeof s === "string" ? s.trim() : ""))
      .filter(Boolean);
    let skills = (parsed.skills ?? [])
      .map((s) => (typeof s === "string" ? s.trim() : ""))
      .filter(Boolean);

    // Backward-compatible: if model returned only skills, split roughly
    if (!competencies.length && skills.length) {
      const mid = Math.ceil(skills.length / 2);
      return NextResponse.json({
        competencies: skills.slice(0, mid),
        skills: skills.slice(mid),
      });
    }

    return NextResponse.json({ competencies, skills });
  } catch (error) {
    console.error("Suggest skills error:", error);
    return NextResponse.json(
      { error: "Failed to suggest skills" },
      { status: 500 }
    );
  }
}
