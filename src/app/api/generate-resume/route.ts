import { NextResponse } from "next/server";
import { getModel, getOpenAIClient } from "@/lib/openai";
import type {
  InterviewAnswer,
  ResumeBasics,
  ResumeData,
} from "@/lib/types";
import { normalizeCertifications, normalizeResumeSkills } from "@/lib/types";
import { formatLanguageEntry } from "@/lib/resume-drafts";

/** Strip bulky file payloads before sending basics to the model. */
function basicsForAI(basics: ResumeBasics): Omit<ResumeBasics, "certificates"> & {
  certificates: { id: string; name: string; fileName?: string }[];
} {
  return {
    ...basics,
    certificates: (basics.certificates || [])
      .filter((c) => c.name?.trim())
      .map((c) => ({
        id: c.id,
        name: c.name,
        fileName: c.fileName || undefined,
      })),
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { basics, answers, selectedSkills, language } = body as {
      basics: ResumeBasics;
      answers: InterviewAnswer[];
      selectedSkills?: string[];
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
    const skillsList = (selectedSkills ?? []).filter(Boolean);
    const experienceEntries = (basics.experience || []).filter(
      (e) => e.position?.trim() && e.company?.trim()
    );
    const educationEntries = (basics.education || []).filter(
      (e) => e.degree?.trim() && e.institution?.trim()
    );
    const languageEntries = (basics.languages || []).filter((e) =>
      e.language?.trim()
    );
    const certificateEntries = (basics.certificates || []).filter((e) =>
      e.name?.trim()
    );

    const completion = await openai.chat.completions.create({
      model: getModel(),
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are an elite ATS resume writer and career strategist at Bahath Jobz. ${langInstruction}

Using the candidate's basic info, structured professional experience, education, languages, certificates, interview answers, and selected skills, produce a highly professional, accurate, ATS-optimized resume for the role: "${targetRole}".

## Section order (MANDATORY — match this schema order)
1. Professional Summary
2. Professional Skills (split into technical and soft)
3. Professional Experience
4. Projects
5. Education
6. Certifications & Courses
7. Languages

## Quality standards (MANDATORY)

1. **Consistent bullet points** — use bullet points uniformly across Experience and Projects. Every experience entry must use 3–5 parallel bullet points (action verb + context + result). Same structure for project outcomes.

2. **Metrics and impact in Experience** — each experience bullet MUST emphasize measurable impact when supported by answers. Never fabricate numbers.

3. **Professional Experience roles** — use the provided experience entries as the source of truth for titles, companies, and dates. Expand each with detailed bullets from interview answers. Preserve chronological dates; reverse-chronological order.

Known roles:
${experienceEntries
  .map(
    (e) =>
      `- ${e.position} at ${e.company} (${e.startDate} – ${e.current ? "Present" : e.endDate})`
  )
  .join("\n") || "- (see basics.experience)"}

4. **Skills** — use the candidate's selected skills as the primary skills list. Categorize them into "technical" and "soft" based on the target role. You may lightly refine wording but do NOT add unrelated skills.

Selected skills to include:
${skillsList.length ? skillsList.map((s) => `- ${s}`).join("\n") : "- (derive carefully from answers only)"}

5. **Education** — use the provided education entries as the source of truth (degree, institution, graduation date, GPA). Do not invent degrees.
Known education:
${educationEntries
  .map(
    (e) =>
      `- ${e.degree} at ${e.institution} (${e.graduationDate})${e.gpa ? ` GPA: ${e.gpa}` : ""}`
  )
  .join("\n") || "- (see basics.education)"}

6. **Certifications & Courses** — include provided certificate names. Populate "courses" only from interview answers when relevant. For certifications return objects: { "name": "...", "url": null } (urls are attached server-side).

Known certificates:
${certificateEntries.map((c) => `- ${c.name}`).join("\n") || "- (none provided)"}

7. **Keyword-rich Professional Summary** — 3–4 sentences packed with role-specific ATS keywords for "${targetRole}".

8. **Projects** — include when described. Each: name, description, technologies, measurable outcomes, optional URL.

9. **Languages** — use provided languages when present:
${languageEntries
  .map((l) => `- ${formatLanguageEntry(l.language, l.proficiency, language)}`)
  .join("\n") || "- (none provided; include from answers if any)"}

## Additional rules
- Reverse-chronological experience order
- Preserve contact links: linkedin, github, website from basics
- NEVER invent employers, degrees, projects, certs, or metrics not supported by the input
- ATS-safe: plain text, standard section names, no tables/graphics/columns

Return JSON matching this exact schema:
{
  "contact": { "fullName", "email", "phone", "location", "linkedin?", "github?", "website?" },
  "summary": "keyword-rich professional summary for ${targetRole}",
  "skills": {
    "technical": ["skill1", "skill2"],
    "soft": ["skill3", "skill4"]
  },
  "experience": [{ "title", "company", "location?", "startDate", "endDate", "current?", "bullets": ["quantified bullet", ...] }],
  "projects": [{ "name", "description?", "technologies": [], "outcomes": ["measurable bullet", ...], "url?" }],
  "education": [{ "degree", "institution", "location?", "graduationDate", "gpa?" }],
  "certifications": [{ "name": "AWS Certified Developer", "url": null }],
  "courses": ["React Advanced Patterns — Frontend Masters, 2023", ...],
  "languages": ["English (Fluent)", "Arabic (Native)"]
}`,
        },
        {
          role: "user",
          content: JSON.stringify(
            {
              basics: basicsForAI(basics),
              answers,
              selectedSkills: skillsList,
            },
            null,
            2
          ),
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
    resumeData.skills = normalizeResumeSkills(resumeData.skills);

    if (skillsList.length) {
      const allAi = new Set([
        ...resumeData.skills.technical.map((s) => s.toLowerCase()),
        ...resumeData.skills.soft.map((s) => s.toLowerCase()),
      ]);
      const missing = skillsList.filter((s) => !allAi.has(s.toLowerCase()));
      if (missing.length) {
        resumeData.skills.technical = [
          ...resumeData.skills.technical,
          ...missing,
        ];
      }
    }

    // Authoritative education from basics
    if (educationEntries.length) {
      resumeData.education = educationEntries.map((e) => ({
        degree: e.degree.trim(),
        institution: e.institution.trim(),
        graduationDate: e.graduationDate,
        gpa: e.gpa?.trim() || undefined,
      }));
    }

    // Authoritative languages from basics
    if (languageEntries.length) {
      resumeData.languages = languageEntries.map((l) =>
        formatLanguageEntry(l.language, l.proficiency, language)
      );
    }

    // Authoritative certifications with uploaded file links
    if (certificateEntries.length) {
      resumeData.certifications = certificateEntries.map((c) => ({
        name: c.name.trim(),
        url: c.fileDataUrl || undefined,
      }));
    } else {
      resumeData.certifications = normalizeCertifications(
        resumeData.certifications
      );
    }

    resumeData.contact = {
      fullName: basics.fullName,
      email: basics.email,
      phone: basics.phone || resumeData.contact?.phone,
      location: basics.location || resumeData.contact?.location,
      linkedin: basics.linkedin || resumeData.contact?.linkedin,
      github: basics.github || resumeData.contact?.github,
      website: basics.website || resumeData.contact?.website,
      headline:
        (typeof basics.targetRole === "string" && basics.targetRole.trim()) ||
        resumeData.contact?.headline ||
        undefined,
      photoDataUrl:
        (typeof basics.photoDataUrl === "string" && basics.photoDataUrl.trim()) ||
        resumeData.contact?.photoDataUrl ||
        undefined,
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
