import type {
  ResumeBasics,
  ResumeData,
} from "@/lib/types";

/** Build a lightweight resume from basics for template-step live preview (before AI generation). */
export function buildTemplatePreviewResume(
  basics: ResumeBasics,
  selectedSkills: string[],
  locale: "en" | "ar"
): ResumeData {
  const isAr = locale === "ar";
  const summary = isAr
    ? `${basics.targetRole || "محترف"} يسعى لفرصة مناسبة. سيتم تحسين الملخص والخبرات بالذكاء الاصطناعي بعد اختيار القالب.`
    : `${basics.targetRole || "Professional"} with relevant experience. AI will refine your summary and achievements after you generate the resume.`;

  const placeholderBullet = isAr
    ? "سيتم إنشاء نقاط الإنجاز التفصيلية بالذكاء الاصطناعي."
    : "Detailed achievement bullets will be written by AI.";

  const mid = Math.ceil(selectedSkills.length / 2) || 0;
  const technical = selectedSkills.slice(0, mid);
  const soft = selectedSkills.slice(mid);

  return {
    contact: {
      fullName: basics.fullName || (isAr ? "الاسم الكامل" : "Your Name"),
      email: basics.email || "email@example.com",
      phone: basics.phone || "",
      location: basics.location || "",
      linkedin: basics.linkedin || undefined,
      github: basics.github || undefined,
      website: basics.website || undefined,
    },
    summary,
    skills: {
      technical: technical.length
        ? technical
        : [isAr ? "مهارات تقنية" : "Technical skills"],
      soft: soft.length ? soft : [isAr ? "مهارات شخصية" : "Soft skills"],
    },
    experience: (basics.experience || [])
      .filter((e) => e.position?.trim() || e.company?.trim())
      .map((e) => ({
        title: e.position || (isAr ? "المسمى الوظيفي" : "Job Title"),
        company: e.company || (isAr ? "الشركة" : "Company"),
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
      .map((l) =>
        l.proficiency?.trim()
          ? `${l.language.trim()} (${l.proficiency.trim()})`
          : l.language.trim()
      ),
  };
}
