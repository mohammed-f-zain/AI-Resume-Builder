import type {
  BuiltinSectionId,
  CustomSection,
  ResumeData,
} from "@/lib/types";
import {
  hasCompetencies,
  hasTechnicalAdditionalSkills,
  normalizeCertifications,
  normalizeReferences,
  normalizeResumeSkills,
} from "@/lib/types";

export const DEFAULT_SECTION_ORDER: BuiltinSectionId[] = [
  "summary",
  "competencies",
  "experience",
  "projects",
  "education",
  "certifications",
  "technical",
  "languages",
  "references",
];

export const ALL_BUILTIN_SECTIONS: BuiltinSectionId[] = [
  ...DEFAULT_SECTION_ORDER,
  "courses",
];

const BUILTIN_SET = new Set<string>(ALL_BUILTIN_SECTIONS);

export function isBuiltinSectionId(id: string): id is BuiltinSectionId {
  return BUILTIN_SET.has(id);
}

export function isCustomSectionKey(id: string): boolean {
  return id.startsWith("custom:");
}

export function customSectionIdFromKey(key: string): string | null {
  if (!isCustomSectionKey(key)) return null;
  return key.slice("custom:".length) || null;
}

export function customSectionKey(id: string): string {
  return `custom:${id}`;
}

export function normalizeCustomSections(
  sections: CustomSection[] | undefined | null
): CustomSection[] {
  if (!sections?.length) return [];
  return sections
    .map((s) => ({
      id: (s.id || "").trim(),
      heading: (s.heading || "").trim(),
      content: s.content ?? "",
    }))
    .filter((s) => s.id);
}

/**
 * Resolve a valid section order for a resume.
 * - Missing/empty → default order (plus any existing custom sections appended)
 * - Drops unknown keys; keeps custom keys only if the section exists
 * - Dedupes
 */
export function normalizeSectionOrder(data: ResumeData): string[] {
  const customs = normalizeCustomSections(data.customSections);
  const customIds = new Set(customs.map((c) => c.id));
  const raw = data.sectionOrder;

  const source =
    raw && raw.length > 0
      ? raw
      : [
          ...DEFAULT_SECTION_ORDER,
          ...customs.map((c) => customSectionKey(c.id)),
        ];

  const seen = new Set<string>();
  const order: string[] = [];
  for (const key of source) {
    if (!key || seen.has(key)) continue;
    if (isBuiltinSectionId(key)) {
      seen.add(key);
      order.push(key);
      continue;
    }
    const cid = customSectionIdFromKey(key);
    if (cid && customIds.has(cid)) {
      seen.add(key);
      order.push(key);
    }
  }

  // Ensure custom sections not listed still appear (append)
  for (const c of customs) {
    const key = customSectionKey(c.id);
    if (!seen.has(key)) {
      order.push(key);
    }
  }

  return order.length ? order : [...DEFAULT_SECTION_ORDER];
}

/** Whether a built-in section has content worth rendering on the CV. */
export function builtinSectionHasContent(
  data: ResumeData,
  id: BuiltinSectionId
): boolean {
  switch (id) {
    case "summary":
      return Boolean(data.summary?.trim());
    case "competencies":
      return hasCompetencies(data.skills);
    case "experience":
      return Boolean(data.experience?.length);
    case "projects":
      return Boolean(data.projects?.some((p) => p.name?.trim() || p.outcomes?.some((o) => o.trim())));
    case "education":
      return Boolean(data.education?.length);
    case "certifications": {
      const certs = normalizeCertifications(data.certifications).filter((c) =>
        c.name.trim()
      );
      const order = data.sectionOrder;
      const coursesSeparate = order?.includes("courses");
      const courses = (data.courses ?? []).filter((c) => c.trim());
      return certs.length > 0 || (!coursesSeparate && courses.length > 0);
    }
    case "courses":
      return Boolean(data.courses?.some((c) => c.trim()));
    case "technical":
      return hasTechnicalAdditionalSkills(data.skills);
    case "languages":
      return Boolean(data.languages?.some((l) => l.trim()));
    case "references":
      return normalizeReferences(data.references).length > 0;
    default:
      return false;
  }
}

export function customSectionHasContent(
  section: CustomSection | undefined
): boolean {
  if (!section) return false;
  return Boolean(section.heading?.trim() || section.content?.trim());
}

/** Built-ins not currently in sectionOrder (available to Add menu). */
export function getMissingBuiltinSections(data: ResumeData): BuiltinSectionId[] {
  const order = new Set(normalizeSectionOrder(data));
  return ALL_BUILTIN_SECTIONS.filter((id) => !order.has(id));
}

export function getCustomSection(
  data: ResumeData,
  key: string
): CustomSection | undefined {
  const id = customSectionIdFromKey(key);
  if (!id) return undefined;
  return normalizeCustomSections(data.customSections).find((c) => c.id === id);
}

/** Seed empty starter rows when first adding an optional built-in. */
export function seedBuiltinSection(
  data: ResumeData,
  id: BuiltinSectionId
): Partial<ResumeData> {
  switch (id) {
    case "summary":
      return data.summary ? {} : { summary: "" };
    case "competencies": {
      const skills = normalizeResumeSkills(data.skills);
      if (skills.competencies.length) return {};
      return { skills: { ...skills, competencies: [""] } };
    }
    case "technical": {
      const skills = normalizeResumeSkills(data.skills);
      if (skills.technical.length || skills.soft.length) return {};
      return { skills: { ...skills, technical: [""] } };
    }
    case "experience":
      if (data.experience?.length) return {};
      return {
        experience: [
          {
            title: "",
            company: "",
            location: "",
            startDate: "",
            endDate: "",
            current: false,
            bullets: [""],
          },
        ],
      };
    case "education":
      if (data.education?.length) return {};
      return {
        education: [
          {
            degree: "",
            institution: "",
            location: "",
            graduationDate: "",
            gpa: "",
          },
        ],
      };
    case "projects":
      if (data.projects?.length) return {};
      return {
        projects: [
          {
            name: "",
            description: "",
            technologies: [],
            outcomes: [""],
          },
        ],
      };
    case "certifications":
      if (normalizeCertifications(data.certifications).length) return {};
      return { certifications: [{ name: "" }] };
    case "courses":
      if (data.courses?.length) return {};
      return { courses: [""] };
    case "languages":
      if (data.languages?.length) return {};
      return { languages: [""] };
    case "references":
      if (normalizeReferences(data.references).length) return {};
      return {
        references: [
          { name: "", title: "", company: "", phone: "", email: "" },
        ],
      };
    default:
      return {};
  }
}

export function createCustomSectionId(): string {
  return `cs_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}
