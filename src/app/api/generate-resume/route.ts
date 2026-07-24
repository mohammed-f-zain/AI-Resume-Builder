import { NextResponse } from "next/server";
import { getModel, getOpenAIClient } from "@/lib/openai";
import type {
  InterviewAnswer,
  ResumeBasics,
  ResumeData,
} from "@/lib/types";
import {
  normalizeCertifications,
  normalizeReferences,
  normalizeResumeSkills,
} from "@/lib/types";
import {
  formatLanguageEntry,
  referenceEntriesToResume,
} from "@/lib/resume-drafts";

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
    references: (basics.references || [])
      .filter((r) => r.name?.trim())
      .map((r) => ({
        id: r.id,
        name: r.name,
        title: r.title,
        company: r.company,
        phone: r.phone,
        email: r.email,
      })),
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      basics,
      answers,
      selectedSkills,
      selectedCompetencies,
      language,
      includeProjects,
    } = body as {
      basics: ResumeBasics;
      answers: InterviewAnswer[];
      selectedSkills?: string[];
      selectedCompetencies?: string[];
      language: "en" | "ar";
      includeProjects?: boolean;
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
    const competenciesList = (selectedCompetencies ?? []).filter(Boolean);
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
    const referenceEntries = (basics.references || []).filter((e) =>
      e.name?.trim()
    );
    const allowProjects = includeProjects !== false;

    const projectsRule = allowProjects
      ? `5. **Projects** — include ONLY when described. If none, return "projects": [].`
      : `5. **Projects** — DO NOT include projects. Return "projects": [].`;

    const completion = await openai.chat.completions.create({
      model: getModel(),
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are an elite ATS resume writer at Bahath Jobz. ${langInstruction}

Produce an accurate ATS-optimized resume for: "${targetRole}".

## Section content (templates use standard ATS headings: Summary, Experience, Education, Skills, …)
Populate skills as three groups under Skills: competencies (role-specific), technical, soft.

## Quality standards

1. Experience bullets: 3–5 each, action + context + result. Never fabricate metrics.
2. Experience source of truth — titles, companies, locations, dates from known roles.
   **Dates MUST use YYYY-MM** (e.g. 2022-03) for consistency; use empty string for missing end when current:
${experienceEntries
  .map(
    (e) =>
      `- ${e.position} at ${e.company}${e.location?.trim() ? ` [${e.location.trim()}]` : ""} (${e.startDate} – ${e.current ? "Present" : e.endDate})`
  )
  .join("\n") || "- (see basics.experience)"}

3. **skills.competencies** — role-specific domain competencies:
${competenciesList.length ? competenciesList.map((s) => `- ${s}`).join("\n") : "- (derive from answers for this role)"}

4. **skills.technical** / **skills.soft** — tools/systems and soft skills:
${skillsList.length ? skillsList.map((s) => `- ${s}`).join("\n") : "- (derive carefully from answers)"}

5. Education source of truth — graduationDate as YYYY-MM or YYYY:
${educationEntries
  .map(
    (e) =>
      `- ${e.degree} at ${e.institution}${e.location?.trim() ? `, ${e.location.trim()}` : ""} (${e.graduationDate})${e.gpa ? ` GPA: ${e.gpa}` : ""}`
  )
  .join("\n") || "- (see basics.education)"}

6. Certifications — use provided names:
${certificateEntries.map((c) => `- ${c.name}`).join("\n") || "- (none provided)"}

7. Keyword-rich Summary — 3–4 sentences for "${targetRole}".

${projectsRule}

8. Languages:
${languageEntries
  .map((l) => `- ${formatLanguageEntry(l.language, l.proficiency, language)}`)
  .join("\n") || "- (none provided; include from answers if any)"}

9. References — use ONLY these if present (never invent):
${referenceEntries
  .map(
    (r) =>
      `- ${r.name}${r.title ? ` — ${r.title}` : ""}${r.company ? `, ${r.company}` : ""}${r.phone ? ` | ${r.phone}` : ""}${r.email ? ` | ${r.email}` : ""}`
  )
  .join("\n") || "- (none — return references: [])"}

## Additional rules
- Reverse-chronological experience
- All dates consistently as YYYY-MM (or YYYY when month unknown)
- Preserve contact links from basics
- NEVER invent employers, degrees, projects, certs, references, or metrics
- ATS-safe plain text

Return JSON:
{
  "contact": { "fullName", "email", "phone", "location", "linkedin?", "github?", "website?" },
  "summary": "...",
  "skills": {
    "competencies": ["..."],
    "technical": ["..."],
    "soft": ["..."]
  },
  "experience": [{ "title", "company", "location?", "startDate", "endDate", "current?", "bullets": [] }],
  "projects": [],
  "education": [{ "degree", "institution", "location?", "graduationDate", "gpa?" }],
  "certifications": [{ "name": "...", "url": null }],
  "courses": [],
  "languages": [],
  "references": [{ "name", "title?", "company?", "phone?", "email?" }]
}`,
        },
        {
          role: "user",
          content: JSON.stringify(
            {
              basics: basicsForAI(basics),
              answers,
              selectedCompetencies: competenciesList,
              selectedSkills: skillsList,
              includeProjects: allowProjects,
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

    if (competenciesList.length) {
      const have = new Set(
        resumeData.skills.competencies.map((s) => s.toLowerCase())
      );
      const missing = competenciesList.filter(
        (s) => !have.has(s.toLowerCase())
      );
      if (missing.length) {
        resumeData.skills.competencies = [
          ...resumeData.skills.competencies,
          ...missing,
        ];
      }
    }

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

    if (educationEntries.length) {
      resumeData.education = educationEntries.map((e) => ({
        degree: e.degree.trim(),
        institution: e.institution.trim(),
        location: e.location?.trim() || undefined,
        graduationDate: e.graduationDate,
        gpa: e.gpa?.trim() || undefined,
      }));
    }

    if (experienceEntries.length && Array.isArray(resumeData.experience)) {
      resumeData.experience = resumeData.experience.map((exp) => {
        const match =
          experienceEntries.find(
            (e) =>
              e.company.trim().toLowerCase() ===
                (exp.company || "").trim().toLowerCase() &&
              e.position.trim().toLowerCase() ===
                (exp.title || "").trim().toLowerCase()
          ) ||
          experienceEntries.find(
            (e) =>
              e.company.trim().toLowerCase() ===
              (exp.company || "").trim().toLowerCase()
          );
        if (!match) return exp;
        return {
          ...exp,
          location: match.location?.trim() || exp.location,
          current: match.current ?? exp.current,
          endDate: match.current ? "Present" : exp.endDate || match.endDate,
        };
      });
    }

    if (!allowProjects) {
      resumeData.projects = [];
    }

    if (languageEntries.length) {
      resumeData.languages = languageEntries.map((l) =>
        formatLanguageEntry(l.language, l.proficiency, language)
      );
    }

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

    // Authoritative references — never keep invented ones when basics has none
    if (referenceEntries.length) {
      resumeData.references = referenceEntriesToResume(referenceEntries);
    } else {
      resumeData.references = [];
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
        (typeof basics.photoDataUrl === "string" &&
          basics.photoDataUrl.trim()) ||
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
