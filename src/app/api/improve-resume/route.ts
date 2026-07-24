import { NextResponse } from "next/server";
import { getModel, getOpenAIClient } from "@/lib/openai";
import type { ATSAnalysis, ResumeData } from "@/lib/types";
import { normalizeCertifications, normalizeResumeSkills } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { resume, analysis, language } = body as {
      resume?: ResumeData;
      analysis?: ATSAnalysis;
      language?: "en" | "ar";
    };

    if (!resume?.contact?.fullName || !resume?.contact?.email) {
      return NextResponse.json(
        { error: "Valid resume data is required" },
        { status: 400 }
      );
    }

    const openai = getOpenAIClient();
    const lang = language === "ar" ? "ar" : "en";
    const langInstruction =
      lang === "ar"
        ? "Keep all resume content in professional Arabic."
        : "Keep all resume content in professional English.";

    const suggestions = (analysis?.suggestions || []).filter(Boolean);
    const score =
      typeof analysis?.score === "number" ? analysis.score : "unknown";

    const completion = await openai.chat.completions.create({
      model: getModel(),
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are an elite ATS resume editor at Bahath Jobz. ${langInstruction}

You receive a structured resume JSON and an ATS analysis (score + suggestions).
Apply the suggestions to improve keywords, bullet impact, summary strength, and clarity.

## Hard rules
- NEVER invent employers, degrees, projects, certifications, dates, or metrics not supported by the input resume
- Preserve contact info exactly (name, email, phone, location, links, photo, headline) unless a suggestion only asks for formatting
- Preserve section presence: if projects is empty or missing, keep projects as []
- Keep the same JSON schema
- Prefer stronger action verbs and ATS keywords when grounded in existing content
- Do not remove real experience or education entries

Return JSON: { "resume": { ...same ResumeData schema... } }`,
        },
        {
          role: "user",
          content: JSON.stringify(
            {
              atsScore: score,
              suggestions,
              strengths: analysis?.strengths || [],
              resume,
            },
            null,
            2
          ),
        },
      ],
      temperature: 0.4,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json(
        { error: "No response from AI" },
        { status: 500 }
      );
    }

    const parsed = JSON.parse(content) as { resume?: ResumeData } & ResumeData;
    const improved = (parsed.resume || parsed) as ResumeData;

    improved.skills = normalizeResumeSkills(improved.skills);
    improved.certifications = normalizeCertifications(improved.certifications);

    // Never lose authoritative contact from the pre-improve resume
    improved.contact = {
      ...improved.contact,
      fullName: resume.contact.fullName,
      email: resume.contact.email,
      phone: resume.contact.phone || improved.contact?.phone,
      location: resume.contact.location || improved.contact?.location,
      linkedin: resume.contact.linkedin || improved.contact?.linkedin,
      github: resume.contact.github || improved.contact?.github,
      website: resume.contact.website || improved.contact?.website,
      headline: resume.contact.headline || improved.contact?.headline,
      photoDataUrl: resume.contact.photoDataUrl || improved.contact?.photoDataUrl,
    };

    if (!resume.projects?.length) {
      improved.projects = [];
    }

    improved.sectionOrder = resume.sectionOrder;
    improved.customSections = resume.customSections;

    return NextResponse.json({ resume: improved });
  } catch (error) {
    console.error("Improve resume error:", error);
    return NextResponse.json(
      { error: "Failed to improve resume" },
      { status: 500 }
    );
  }
}
