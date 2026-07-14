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

    const openai = getOpenAIClient();
    const langInstruction =
      language === "ar"
        ? "Write all questions and placeholders in Arabic."
        : "Write all questions and placeholders in English.";

    const completion = await openai.chat.completions.create({
      model: getModel(),
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are a senior career coach and ATS resume specialist at Bahath Jobz. ${langInstruction}

Generate 10–14 detailed, role-specific interview questions to collect EVERYTHING needed for a strong, ATS-optimized resume for the candidate's target role: "${basics.targetRole}".

Your questions MUST comprehensively cover ALL of the following areas (at least one question per area when relevant):
1. **Work experience** — exact job titles, company names, locations, start/end dates, employment type
2. **Quantified achievements** — metrics, percentages, revenue, users, performance gains, deadlines met, team size led
3. **Technologies & tools** — languages, frameworks, databases, cloud platforms, DevOps tools specific to their role
4. **Methodologies** — Agile, Scrum, CI/CD, TDD, microservices, etc. as relevant to target role
5. **Projects** — personal, academic, or professional projects: name, tech stack, problem solved, measurable outcomes, links
6. **Education** — degrees, institutions, graduation dates, honors, relevant coursework
7. **Certifications & training** — professional certs, online courses, licenses
8. **Skills** — technical hard skills AND soft skills (leadership, communication, problem-solving)
9. **Industry keywords** — role-specific terminology recruiters and ATS systems scan for in their field
10. **Languages** — spoken/written languages and proficiency levels
11. **Career goals** — how their background aligns with the target role

Rules:
- Questions must be specific to "${basics.targetRole}" — e.g. for Full Stack Developer ask about frontend/backend stacks, APIs, databases, deployment
- Each question should be detailed enough that a thorough answer gives rich resume content
- Include helpful placeholders with concrete examples (e.g. "Increased API response time by 40% using Redis caching")
- Do NOT ask for info already fully provided in careerBackground — instead dig deeper or clarify gaps
- Order questions logically: experience → achievements → projects → skills/tech → education → certs

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
          content: JSON.stringify(basics, null, 2),
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
