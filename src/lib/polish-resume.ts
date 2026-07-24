import type { ATSAnalysis, ResumeData } from "@/lib/types";
import { resumeToPlainText } from "@/lib/resume-to-text";

export type PolishPhase = "generating" | "polishing";

/** Don't block the user for minutes if polish hangs or truncates. */
const POLISH_TIMEOUT_MS = 55_000;

async function analyzePolishedResume(
  resume: ResumeData,
  language: "en" | "ar"
): Promise<ATSAnalysis | null> {
  try {
    const text = resumeToPlainText(resume, language);
    const res = await fetch("/api/analyze-resume", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, language }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (typeof data?.score !== "number" || !data?.breakdown) return null;
    return data as ATSAnalysis;
  } catch {
    return null;
  }
}

/**
 * After AI generation: one server call critiques, improves, and scores the CV
 * before showing it to the user. Times out → caller should keep the draft CV.
 * If polish returns a bad/missing analysis, falls back to /api/analyze-resume.
 */
export async function polishResumeWithAts(
  resume: ResumeData,
  language: "en" | "ar",
  onPhase?: (phase: Exclude<PolishPhase, "generating">) => void
): Promise<{ resume: ResumeData; analysis: ATSAnalysis | null }> {
  onPhase?.("polishing");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), POLISH_TIMEOUT_MS);

  let polished: ResumeData;
  let analysis: ATSAnalysis | null = null;

  try {
    const res = await fetch("/api/polish-resume", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        // Never send base64 photo/files to the polish API — strip on client too
        resume: {
          ...resume,
          contact: {
            ...resume.contact,
            photoDataUrl: resume.contact.photoDataUrl
              ? "[photo provided]"
              : undefined,
          },
          certifications: (resume.certifications || []).map((c) =>
            typeof c === "string"
              ? c
              : {
                  name: c.name,
                  url: c.url?.startsWith("data:") ? undefined : c.url,
                }
          ),
        },
        language,
      }),
      signal: controller.signal,
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "ATS polish failed");
    }

    polished = data.resume as ResumeData;
    // Re-attach photo / cert data URLs from the pre-polish resume
    polished.contact = {
      ...polished.contact,
      photoDataUrl: resume.contact.photoDataUrl,
      fullName: resume.contact.fullName,
      email: resume.contact.email,
      phone: resume.contact.phone || polished.contact?.phone,
      location: resume.contact.location || polished.contact?.location,
      linkedin: resume.contact.linkedin || polished.contact?.linkedin,
      github: resume.contact.github || polished.contact?.github,
      website: resume.contact.website || polished.contact?.website,
      headline: resume.contact.headline || polished.contact?.headline,
    };
    if (resume.certifications?.length) {
      polished.certifications = resume.certifications.map((orig) => {
        if (typeof orig === "string") return orig;
        return orig;
      });
    }

    analysis = (data.analysis as ATSAnalysis | null) ?? null;
  } finally {
    clearTimeout(timer);
  }

  // Rescore when polish omitted analysis or returned weight-echo breakdown
  if (!analysis) {
    analysis = await analyzePolishedResume(polished!, language);
  }

  return {
    resume: polished!,
    analysis,
  };
}
