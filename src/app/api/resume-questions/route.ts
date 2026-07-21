import { NextResponse } from "next/server";
import { getModel, getOpenAIClient } from "@/lib/openai";
import type { InterviewQuestion, ResumeBasics } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { basics, language } = body as {
      basics: ResumeBasics;
      language: "en" | "ar";
    };

    if (!basics?.fullName || !basics?.targetRole) {
      return NextResponse.json(
        { error: "Name and target role are required" },
        { status: 400 }
      );
    }

    if (!basics.experience?.some((e) => e.position?.trim() && e.company?.trim())) {
      return NextResponse.json(
        { error: "At least one professional experience entry is required" },
        { status: 400 }
      );
    }

    if (!basics.education?.some((e) => e.degree?.trim() && e.institution?.trim())) {
      return NextResponse.json(
        { error: "At least one education entry is required" },
        { status: 400 }
      );
    }

    const openai = getOpenAIClient();
    const langInstruction =
      language === "ar"
        ? `Write ALL questions and placeholders in clear, natural Modern Standard Arabic (عربية فصحى مبسطة) for Qatar/GCC job seekers.

Arabic quality rules:
- Sound like a real Arabic career coach — NOT a word-for-word English translation
- Use natural professional terms (خبرة، إنجازات قابلة للقياس، مسؤوليات، مشاريع، أدوات وتقنيات)
- Placeholders must be concrete Arabic examples with metrics when useful
- Keep well-known tool/brand names in English when needed (React, Excel, SAP)
- Avoid awkward, literal, or mixed broken Arabic/English phrasing
- Every question must be practical for the target role "${basics.targetRole}"`
        : "Write all questions and placeholders in English.";

    const experienceSummary = (basics.experience || [])
      .filter((e) => e.position?.trim() && e.company?.trim())
      .map(
        (e) =>
          `${e.position} at ${e.company} (${e.startDate} – ${e.current ? "Present" : e.endDate})`
      )
      .join("; ");

    const educationSummary = (basics.education || [])
      .filter((e) => e.degree?.trim() && e.institution?.trim())
      .map(
        (e) =>
          `${e.degree} at ${e.institution} (${e.graduationDate})${e.gpa ? ` GPA ${e.gpa}` : ""}`
      )
      .join("; ");

    const languagesSummary = (basics.languages || [])
      .filter((e) => e.language?.trim())
      .map((e) =>
        e.proficiency ? `${e.language} (${e.proficiency})` : e.language
      )
      .join("; ");

    const certificatesSummary = (basics.certificates || [])
      .filter((e) => e.name?.trim())
      .map((e) => e.name)
      .join("; ");

    const completion = await openai.chat.completions.create({
      model: getModel(),
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are a senior career coach and ATS resume specialist at Bahath Jobz. ${langInstruction}

Generate 10–14 detailed, role-specific interview questions to collect EVERYTHING needed for a strong, ATS-optimized resume for the candidate's target role: "${basics.targetRole}".

## Already known (DO NOT re-ask for these)
Professional experience:
${experienceSummary || "(none)"}

Education:
${educationSummary || "(none)"}

Languages:
${languagesSummary || "(none)"}

Certificates:
${certificatesSummary || "(none)"}

Do NOT ask for job titles, company names, employment dates, degrees, institutions, graduation dates, languages, or certificate names already listed above. Dig into achievements, responsibilities, metrics, projects, and impact instead.

Your questions MUST comprehensively cover ALL of the following areas (at least one question per area when relevant):
1. **Role achievements** — for each known position, ask for quantified achievements (metrics, %, revenue, users, performance, team size)
2. **Responsibilities & impact** — day-to-day scope and business impact per role
3. **Technologies & tools** — languages, frameworks, databases, cloud platforms, DevOps tools specific to their role
4. **Methodologies** — Agile, Scrum, CI/CD, TDD, microservices, etc. as relevant to target role
5. **Projects** — personal, academic, or professional projects: name, tech stack, problem solved, measurable outcomes, links
6. **Education depth** — only if education is missing; otherwise ask about honors, coursework, or thesis relevant to the target role
7. **Additional training** — courses/bootcamps not already listed as certificates
8. **Skills context** — how they applied technical and soft skills — do not ask them to list every skill; that comes later
9. **Industry keywords** — role-specific terminology recruiters and ATS systems scan for
10. **Career goals** — how their background aligns with the target role

Rules:
- Questions must be specific to "${basics.targetRole}"
- Each question should be detailed enough that a thorough answer gives rich resume content
- Include helpful placeholders with concrete examples (e.g. "Increased API response time by 40% using Redis caching")
- Do NOT ask for info already fully provided — instead dig deeper or clarify gaps
- Order questions logically: achievements per role → projects → skills/tech context → education depth (if needed) → extra training

Return JSON:
{
  "questions": [
    {
      "id": "q1",
      "question": "...",
      "placeholder": "e.g. ...",
      "category": "experience" | "skills" | "education" | "achievements" | "projects" | "technologies" | "certifications" | "general"
    }
  ]
}`,
        },
        {
          role: "user",
          content: JSON.stringify(
            {
              ...basics,
              certificates: (basics.certificates || []).map((c) => ({
                id: c.id,
                name: c.name,
                fileName: c.fileName,
              })),
            },
            null,
            2
          ),
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

    const { questions } = JSON.parse(content) as {
      questions: InterviewQuestion[];
    };

    return NextResponse.json({ questions });
  } catch (error) {
    console.error("Resume questions error:", error);
    return NextResponse.json(
      { error: "Failed to generate questions" },
      { status: 500 }
    );
  }
}
