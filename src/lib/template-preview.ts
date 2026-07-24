import type { ResumeBasics, ResumeData } from "@/lib/types";
import {
  formatLanguageEntry,
  referenceEntriesToResume,
} from "@/lib/resume-drafts";

/** Build a lightweight resume from basics for template-step live preview. */
export function buildTemplatePreviewResume(
  basics: ResumeBasics,
  selectedSkills: string[],
  locale: "en" | "ar",
  selectedCompetencies: string[] = []
): ResumeData {
  const isAr = locale === "ar";
  const summary = isAr
    ? `${basics.targetRole || "محترف"} يسعى لفرصة مناسبة. سيتم تحسين الملخص والخبرات بالذكاء الاصطناعي بعد اختيار القالب.`
    : `${basics.targetRole || "Professional"} with relevant experience. AI will refine your summary and achievements after you generate the resume.`;

  const placeholderBullet = isAr
    ? "سيتم إنشاء نقاط الإنجاز التفصيلية بالذكاء الاصطناعي."
    : "Detailed achievement bullets will be written by AI.";

  const competencies =
    selectedCompetencies.length > 0
      ? selectedCompetencies
      : selectedSkills.slice(0, Math.ceil(selectedSkills.length / 2) || 0);
  const technical =
    selectedCompetencies.length > 0
      ? selectedSkills
      : selectedSkills.slice(Math.ceil(selectedSkills.length / 2));

  return {
    contact: {
      fullName: basics.fullName || (isAr ? "الاسم الكامل" : "Your Name"),
      email: basics.email || "email@example.com",
      phone: basics.phone || "",
      location: basics.location || "",
      linkedin: basics.linkedin || undefined,
      github: basics.github || undefined,
      website: basics.website || undefined,
      headline: basics.targetRole || undefined,
      photoDataUrl: basics.photoDataUrl || undefined,
    },
    summary,
    skills: {
      competencies: competencies.length
        ? competencies
        : [isAr ? "كفاءات أساسية" : "Core competencies"],
      technical: technical.length
        ? technical
        : [isAr ? "مهارات تقنية" : "Technical skills"],
      soft: [],
    },
    experience: (basics.experience || [])
      .filter((e) => e.position?.trim() || e.company?.trim())
      .map((e) => ({
        title: e.position || (isAr ? "المسمى الوظيفي" : "Job Title"),
        company: e.company || (isAr ? "الشركة" : "Company"),
        location: e.location || undefined,
        startDate: e.startDate || "",
        endDate: e.current ? "" : e.endDate || "",
        current: !!e.current,
        bullets: [placeholderBullet],
      })),
    education: (basics.education || [])
      .filter((e) => e.degree?.trim() || e.institution?.trim())
      .map((e) => ({
        degree: e.degree || (isAr ? "الدرجة" : "Degree"),
        institution: e.institution || (isAr ? "المؤسسة" : "Institution"),
        location: e.location || undefined,
        graduationDate: e.graduationDate || "",
        gpa: e.gpa || undefined,
      })),
    projects: [],
    certifications: (basics.certificates || [])
      .filter((c) => c.name?.trim())
      .map((c) => ({
        name: c.name.trim(),
        url: c.fileDataUrl || undefined,
      })),
    languages: (basics.languages || [])
      .filter((l) => l.language?.trim())
      .map((l) => formatLanguageEntry(l.language, l.proficiency, locale)),
    references: referenceEntriesToResume(basics.references || []),
  };
}
