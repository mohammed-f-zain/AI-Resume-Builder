import { NextResponse } from "next/server";
import { getModel, getOpenAIClient } from "@/lib/openai";
import type { ATSAnalysis, CertificationItem, ResumeData } from "@/lib/types";
import { normalizeCertifications, normalizeResumeSkills } from "@/lib/types";
import { normalizeAtsAnalysis } from "@/lib/ats-analysis";
import { resumeToPlainText } from "@/lib/resume-to-text";

/** Drop base64 photo / file payloads — they blow the context and truncate JSON output. */
function resumeForAI(resume: ResumeData): ResumeData {
  return {
    ...resume,
    contact: {
      ...resume.contact,
      photoDataUrl: resume.contact.photoDataUrl ? "[photo provided]" : undefined,
    },
    certifications: (resume.certifications || []).map((c) => {
      if (typeof c === "string") return c;
      const cert = c as CertificationItem;
      return {
        name: cert.name,
        url: cert.url?.startsWith("data:") ? "[file attached]" : cert.url,
      };
    }),
  };
}

function mergeAuthoritativeContact(
  improved: ResumeData,
  original: ResumeData
): ResumeData {
  return {
    ...improved,
    skills: normalizeResumeSkills(improved.skills),
    certifications: normalizeCertifications(
      improved.certifications?.length
        ? improved.certifications
        : original.certifications
    ),
    contact: {
      ...improved.contact,
      fullName: original.contact.fullName,
      email: original.contact.email,
      phone: original.contact.phone || improved.contact?.phone,
      location: original.contact.location || improved.contact?.location,
      linkedin: original.contact.linkedin || improved.contact?.linkedin,
      github: original.contact.github || improved.contact?.github,
      website: original.contact.website || improved.contact?.website,
      headline: original.contact.headline || improved.contact?.headline,
      photoDataUrl: original.contact.photoDataUrl,
    },
    projects: original.projects?.length
      ? improved.projects || original.projects
      : [],
    references: original.references?.length
      ? improved.references?.length
        ? improved.references
        : original.references
      : [],
    sectionOrder: original.sectionOrder,
    customSections: original.customSections,
  };
}

function tryParseJson(content: string): {
  resume?: ResumeData;
  analysis?: Omit<ATSAnalysis, "extractedText">;
} | null {
  try {
    return JSON.parse(content);
  } catch {
    // Model sometimes wraps JSON or truncates — try to extract the object
    const start = content.indexOf("{");
    const end = content.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(content.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

/**
 * One-shot ATS polish: critique → rewrite → score the improved resume.
 * Bulky binary fields are stripped before the model call to avoid truncated JSON.
 */
export async function POST(request: Request) {
  let original: ResumeData | undefined;
  try {
    const body = await request.json();
    const { resume, language } = body as {
      resume?: ResumeData;
      language?: "en" | "ar";
    };
    original = resume;

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
        ? "Write all analysis text and resume content in professional Arabic."
        : "Write all analysis text and resume content in professional English.";

    const slim = resumeForAI(resume);
    const plainText = resumeToPlainText(resume, lang).slice(0, 8000);

    const completion = await openai.chat.completions.create({
      model: getModel(),
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are an elite ATS resume editor at Bahath Jobz. ${langInstruction}

Improve the resume for ATS (keywords, bullet impact, summary), then score the IMPROVED version.

## Hard rules
- NEVER invent employers, degrees, projects, certs, dates, metrics, or references
- Do NOT include photoDataUrl or any base64/data URLs in your output
- Keep certifications as { "name": "...", "url": null } only
- If projects is empty, keep projects: []
- If references is empty, keep references: []
- Keep skills as { "competencies": [], "technical": [], "soft": [] }
- Normalize all experience/education dates to YYYY-MM (or YYYY) consistently
- Do NOT invent or change sectionOrder or customSections (omit them from output)
- Keep the same ResumeData schema (contact without photo)
- Preserve real experience, education, competencies, and references

## Scoring the IMPROVED resume
Score EACH breakdown category independently from 0–100 (NOT the weight percentages):
- formatting (0–100): ATS-parseable layout, standard headings
- keywords (0–100): industry-relevant keywords present
- structure (0–100): clear sections, logical order
- content (0–100): achievement quality, metrics, relevance
- readability (0–100): clarity, conciseness, grammar

Overall score = weighted average of those category scores:
formatting×0.25 + keywords×0.20 + structure×0.20 + content×0.25 + readability×0.10

Example of a GOOD breakdown (category scores out of 100):
"breakdown": { "formatting": 90, "keywords": 75, "structure": 85, "content": 80, "readability": 80 }
WRONG (do not return weight values like 25/20/20/25/10 as the breakdown):
"breakdown": { "formatting": 25, "keywords": 20, "structure": 20, "content": 25, "readability": 10 }

Return compact JSON (no markdown, no extra keys):
{
  "resume": { "contact", "summary", "skills", "experience", "projects", "education", "certifications", "courses", "languages", "references" },
  "analysis": {
    "score": number,
    "breakdown": { "formatting": 0-100, "keywords": 0-100, "structure": 0-100, "content": 0-100, "readability": 0-100 },
    "suggestions": ["up to 3 short remaining tips"],
    "strengths": ["up to 3 strengths"]
  }
}`,
        },
        {
          role: "user",
          content: JSON.stringify({ resume: slim, text: plainText }),
        },
      ],
      temperature: 0,
      max_tokens: 4500,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      // Soft fallback — still return the original CV so the UI can proceed
      return NextResponse.json({
        resume,
        analysis: null,
        polished: false,
        warning: "No response from AI",
      });
    }

    const parsed = tryParseJson(content);
    if (!parsed?.resume?.contact) {
      console.error(
        "Polish resume: failed to parse JSON (likely truncated). Returning original resume."
      );
      return NextResponse.json({
        resume,
        analysis: null,
        polished: false,
        warning: "Polish response was incomplete",
      });
    }

    const improved = mergeAuthoritativeContact(parsed.resume, resume);

    // Restore original cert file links by name when model stripped them
    if (resume.certifications?.length) {
      improved.certifications = normalizeCertifications(
        resume.certifications.map((orig) => {
          if (typeof orig === "string") return orig;
          const match = (improved.certifications || []).find((c) => {
            if (typeof c === "string") return c === orig.name;
            return (c as CertificationItem).name === orig.name;
          });
          if (typeof match === "string") return orig;
          return {
            name: orig.name,
            url: orig.url || (match as CertificationItem | undefined)?.url,
          };
        })
      );
    }

    const analysis: ATSAnalysis | null = parsed.analysis
      ? (() => {
          const { analysis: normalized, needsRescore } = normalizeAtsAnalysis(
            parsed.analysis!,
            plainText.slice(0, 2000)
          );
          // Weight-echo breakdown is useless — omit so client can rescore
          if (needsRescore) return null;
          return normalized;
        })()
      : null;

    return NextResponse.json({
      resume: improved,
      analysis,
      polished: true,
    });
  } catch (error) {
    console.error("Polish resume error:", error);
    if (original?.contact?.fullName) {
      return NextResponse.json({
        resume: original,
        analysis: null,
        polished: false,
        warning: "Polish failed; returning original resume",
      });
    }
    return NextResponse.json(
      { error: "Failed to polish resume" },
      { status: 500 }
    );
  }
}
