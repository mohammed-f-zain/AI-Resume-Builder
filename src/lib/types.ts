export type Locale = "en" | "ar";

export type TemplateId = "classic" | "modern" | "minimal" | "executive" | "creative";

export interface ContactInfo {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedin?: string;
  github?: string;
  website?: string;
  /** Job title / headline shown under the name (ATS PDF style). */
  headline?: string;
  /** Optional personal photo as a data URL (shown on CV when provided). */
  photoDataUrl?: string;
}

export interface Experience {
  title: string;
  company: string;
  location?: string;
  startDate: string;
  endDate: string;
  current?: boolean;
  bullets: string[];
}

export interface Education {
  degree: string;
  institution: string;
  location?: string;
  graduationDate: string;
  gpa?: string;
}

export interface Project {
  name: string;
  description?: string;
  technologies?: string[];
  outcomes: string[];
  url?: string;
}

/**
 * Structured skills for ATS resumes.
 * - competencies → Core Competencies (near top)
 * - technical + soft → Technical & Additional Skills (near bottom)
 */
export interface ResumeSkills {
  competencies: string[];
  technical: string[];
  soft: string[];
}

/** Certification shown on the CV; `url` links to an uploaded file when present. */
export interface CertificationItem {
  name: string;
  url?: string;
}

/** Optional professional reference on the CV. */
export interface Reference {
  name: string;
  title?: string;
  company?: string;
  phone?: string;
  email?: string;
}

/** Built-in CV body sections (contact/header is always fixed above these). */
export type BuiltinSectionId =
  | "summary"
  | "competencies"
  | "experience"
  | "projects"
  | "education"
  | "certifications"
  | "technical"
  | "languages"
  | "references"
  | "courses";

/** User-defined section: custom heading + free-text body. */
export interface CustomSection {
  id: string;
  heading: string;
  content: string;
}

export interface ResumeData {
  contact: ContactInfo;
  summary: string;
  experience: Experience[];
  projects?: Project[];
  education: Education[];
  skills: ResumeSkills;
  certifications?: CertificationItem[];
  courses?: string[];
  languages?: string[];
  /** Optional references section — omit or empty when not provided. */
  references?: Reference[];
  /**
   * Body section order. Values are BuiltinSectionId or `custom:${id}`.
   * When omitted, DEFAULT_SECTION_ORDER is used (see resume-sections).
   */
  sectionOrder?: string[];
  /** Custom sections keyed by id; referenced from sectionOrder as `custom:${id}`. */
  customSections?: CustomSection[];
}

export interface UserInfoInput {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedin?: string;
  website?: string;
  targetRole?: string;
  summary?: string;
  experience: string;
  education: string;
  skills: string;
  certifications?: string;
  languages?: string;
  additionalInfo?: string;
}

/** User-entered roles on the basics step (before AI expands bullets). */
export interface ExperienceEntry {
  id: string;
  position: string;
  company: string;
  /** Optional workplace / city. */
  location?: string;
  startDate: string;
  endDate: string;
  current?: boolean;
}

/** User-entered education on the basics step. */
export interface EducationEntry {
  id: string;
  degree: string;
  institution: string;
  /** Optional city / country shown under education. */
  location?: string;
  graduationDate: string;
  gpa?: string;
}

/** Optional reference entry on the basics step. */
export interface ReferenceEntry {
  id: string;
  name: string;
  title?: string;
  company?: string;
  phone?: string;
  email?: string;
}

/** Optional language entry on the basics step. */
export interface LanguageEntry {
  id: string;
  language: string;
  proficiency: string;
}

/** Optional certificate with optional uploaded file (stored as data URL for CV links). */
export interface CertificateEntry {
  id: string;
  name: string;
  fileName?: string;
  fileDataUrl?: string;
  mimeType?: string;
}

export interface ResumeBasics {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedin?: string;
  github?: string;
  website?: string;
  targetRole: string;
  careerBackground: string;
  /** Optional personal photo (data URL) to place on the generated CV. */
  photoDataUrl?: string;
  experience: ExperienceEntry[];
  education: EducationEntry[];
  languages: LanguageEntry[];
  certificates: CertificateEntry[];
  /** Optional professional references. */
  references: ReferenceEntry[];
}

export interface InterviewQuestion {
  id: string;
  question: string;
  placeholder?: string;
  category:
    | "experience"
    | "skills"
    | "education"
    | "achievements"
    | "projects"
    | "technologies"
    | "certifications"
    | "references"
    | "general";
}

export interface InterviewAnswer {
  questionId: string;
  answer: string;
}

/** Quick guided builder: choice-based questions with optional follow-up fields. */
export type GuidedQuestionType = "yes_no" | "single_choice" | "multi_choice";

export interface GuidedFollowUpField {
  id: string;
  label: string;
  inputType: "text" | "month";
  required?: boolean;
}

export interface GuidedFollowUp {
  /** Show follow-up when answer matches (e.g. "yes", or a specific option id/label). */
  showWhen: string;
  fields: GuidedFollowUpField[];
  /** Allow adding multiple field groups (e.g. multiple jobs). */
  allowMultiple?: boolean;
}

export interface GuidedQuestion {
  id: string;
  question: string;
  type: GuidedQuestionType;
  /** Options for single_choice / multi_choice (ignored for yes_no). */
  options?: string[];
  allowOther?: boolean;
  followUp?: GuidedFollowUp;
  category?:
    | "experience"
    | "skills"
    | "education"
    | "achievements"
    | "projects"
    | "technologies"
    | "certifications"
    | "references"
    | "general";
  /** Topic tag from guided-questions API (e.g. projects_or_portfolio). */
  topic?: string;
}

export interface GuidedFieldGroup {
  id: string;
  values: Record<string, string>;
}

export interface GuidedAnswer {
  /** yes_no / single_choice selected value */
  choice?: string;
  /** multi_choice selected values */
  choices?: string[];
  otherText?: string;
  /** Follow-up field groups (one or more when allowMultiple). */
  fieldGroups?: GuidedFieldGroup[];
}

export type BuilderMode = "guided" | "detailed";

export interface ATSBreakdown {
  formatting: number;
  keywords: number;
  structure: number;
  content: number;
  readability: number;
}

export interface ATSAnalysis {
  score: number;
  breakdown: ATSBreakdown;
  suggestions: string[];
  strengths: string[];
  extractedText: string;
}

export interface CoverLetterResult {
  coverLetter: string;
  enhancements: string[];
  keywordMatches?: string[];
  missingKeywords?: string[];
}

/** Normalize AI/legacy skills into competencies + technical + soft. */
export function normalizeResumeSkills(
  skills: ResumeSkills | string[] | undefined | null
): ResumeSkills {
  if (!skills) return { competencies: [], technical: [], soft: [] };
  if (Array.isArray(skills)) {
    return { competencies: [...skills], technical: [], soft: [] };
  }
  const technical = Array.isArray(skills.technical) ? [...skills.technical] : [];
  const soft = Array.isArray(skills.soft) ? [...skills.soft] : [];
  const competencies = Array.isArray(skills.competencies)
    ? [...skills.competencies]
    : [];
  return { competencies, technical, soft };
}

export function hasAnySkills(skills: ResumeSkills | string[] | undefined | null): boolean {
  const n = normalizeResumeSkills(skills);
  return (
    n.competencies.some((s) => s.trim().length > 0) ||
    n.technical.some((s) => s.trim().length > 0) ||
    n.soft.some((s) => s.trim().length > 0)
  );
}

export function hasCompetencies(
  skills: ResumeSkills | string[] | undefined | null
): boolean {
  return normalizeResumeSkills(skills).competencies.some((s) => s.trim().length > 0);
}

export function hasTechnicalAdditionalSkills(
  skills: ResumeSkills | string[] | undefined | null
): boolean {
  const n = normalizeResumeSkills(skills);
  return (
    n.technical.some((s) => s.trim().length > 0) ||
    n.soft.some((s) => s.trim().length > 0)
  );
}

export function normalizeReferences(
  refs: Reference[] | undefined | null
): Reference[] {
  if (!refs?.length) return [];
  return refs
    .map((r) => ({
      name: (r.name || "").trim(),
      title: r.title?.trim() || undefined,
      company: r.company?.trim() || undefined,
      phone: r.phone?.trim() || undefined,
      email: r.email?.trim() || undefined,
    }))
    .filter((r) => r.name);
}

/** Normalize AI/legacy certifications into name + optional url. Keeps empty rows for the editor. */
export function normalizeCertifications(
  certs: (CertificationItem | string)[] | undefined | null
): CertificationItem[] {
  if (!certs?.length) return [];
  return certs.map((c) => {
    if (typeof c === "string") {
      return { name: c };
    }
    return {
      name: c.name ?? "",
      url: c.url?.trim() || undefined,
    };
  });
}
