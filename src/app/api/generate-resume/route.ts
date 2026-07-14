import { NextResponse } from "next/server";
import { getModel, getOpenAIClient } from "@/lib/openai";
import type {
  InterviewAnswer,
  ResumeBasics,
  ResumeData,
} from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { basics, answers, language } = body as {
      basics: ResumeBasics;
      answers: InterviewAnswer[];
      language: "en" | "ar";
    };

    if (!basics?.fullName || !basics?.email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    const openai = getOpenAIClient();
    const langInstruction =
      language === "ar"
        ? "Generate all resume content in Arabic. Use professional Arabic business language."
        : "Generate all resume content in English.";

    const targetRole = basics.targetRole || "the target role";

    const completion = await openai.chat.completions.create({
      model: getModel(),
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are an elite ATS resume writer and career strategist at Bahath Jobz. ${langInstruction}

Using the candidate's basic info and detailed interview answers, produce a highly professional, accurate, ATS-optimized resume for the role: "${targetRole}".

## Quality standards (MANDATORY)

1. **Consistent bullet points** — use bullet points uniformly across Experience, Projects, and any list sections. Every experience entry must use 3–5 parallel bullet points (action verb + context + result). Same structure for project outcomes. No mixed paragraph/bullet styles.

2. **Metrics and impact in Experience** — each experience bullet MUST emphasize measurable impact: percentages, revenue, users, performance gains, deadlines, team size, cost savings, error reduction, etc. Lead with the strongest quantified achievements. Never fabricate numbers not supported by the answers.

3. **Certifications & Courses section** — populate "certifications" with professional certs, licenses, and accreditations. Populate "courses" with relevant technical courses, bootcamps, and training (e.g. "AWS Cloud Practitioner — Udemy, 2024"). Include both sections when the candidate provided any; omit empty arrays.

4. **Keyword-rich Professional Summary** — write 3–4 sentences packed with role-specific ATS keywords for "${targetRole}": job titles, core technologies, frameworks, methodologies, industry terms, and soft skills recruiters search for. Name specific tools/stacks from the candidate's answers.

5. **Consistent formatting** — uniform date formats (e.g. "Jan 2022 – Present"), consistent tense (past for previous roles, present for current), aligned section hierarchy.

6. **Industry-specific keywords** — weave role-relevant ATS keywords naturally throughout summary, experience bullets, skills, and projects.

7. **Projects section** — include when the candidate described projects. Each project: name, description, technologies, measurable outcomes in bullet form, optional URL.

## Additional rules
- Reverse-chronological experience order
- Separate technical and soft skills in the skills array
- Include languages when provided
- Preserve contact links: linkedin, github, website from basics in contact object
- NEVER invent employers, degrees, projects, certs, or metrics not supported by the answers
- ATS-safe: plain text content, standard section names, no tables or graphics

Return JSON matching this exact schema:
{
  "contact": { "fullName", "email", "phone", "location", "linkedin?", "github?", "website?" },
  "summary": "keyword-rich professional summary for ${targetRole}",
  "experience": [{ "title", "company", "location?", "startDate", "endDate", "current?", "bullets": ["quantified bullet", ...] }],
  "projects": [{ "name", "description?", "technologies": [], "outcomes": ["measurable bullet", ...], "url?" }],
  "education": [{ "degree", "institution", "location?", "graduationDate", "gpa?" }],
  "skills": ["skill1", "skill2"],
  "certifications": ["AWS Certified Developer", ...],
  "courses": ["React Advanced Patterns — Frontend Masters, 2023", ...],
  "languages": ["English (Fluent)", "Arabic (Native)"]
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

    const resumeData: ResumeData = JSON.parse(content);

    resumeData.contact = {
      fullName: basics.fullName,
      email: basics.email,
      phone: basics.phone || resumeData.contact.phone,
      location: basics.location || resumeData.contact.location,
      linkedin: basics.linkedin || resumeData.contact.linkedin,
      github: basics.github || resumeData.contact.github,
      website: basics.website || resumeData.contact.website,
    };

    return NextResponse.json({ resume: resumeData });
  } catch (error) {
    console.error("Generate resume error:", error);
    return NextResponse.json(
      { error: "Failed to generate resume" },
      { status: 500 }
    );
  }
}
