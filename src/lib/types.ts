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

/** Structured skills for ATS resumes (soft vs technical). */
export interface ResumeSkills {
  technical: string[];
  soft: string[];
}

/** Certification shown on the CV; `url` links to an uploaded file when present. */
export interface CertificationItem {
  name: string;
  url?: string;
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
  startDate: string;
  endDate: string;
  current?: boolean;
}

/** User-entered education on the basics step. */
export interface EducationEntry {
  id: string;
  degree: string;
  institution: string;
  graduationDate: string;
  gpa?: string;
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
    | "general";
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

/** Normalize AI/legacy skills into soft + technical. */
export function normalizeResumeSkills(
  skills: ResumeSkills | string[] | undefined | null
): ResumeSkills {
  if (!skills) return { technical: [], soft: [] };
  if (Array.isArray(skills)) {
    return { technical: skills.filter(Boolean), soft: [] };
  }
  return {
    technical: Array.isArray(skills.technical) ? skills.technical.filter(Boolean) : [],
    soft: Array.isArray(skills.soft) ? skills.soft.filter(Boolean) : [],
  };
}

export function hasAnySkills(skills: ResumeSkills | string[] | undefined | null): boolean {
  const n = normalizeResumeSkills(skills);
  return n.technical.length > 0 || n.soft.length > 0;
}

/** Normalize AI/legacy certifications into name + optional url. */
export function normalizeCertifications(
  certs: (CertificationItem | string)[] | undefined | null
): CertificationItem[] {
  if (!certs?.length) return [];
  return certs
    .map((c) => {
      if (typeof c === "string") {
        const name = c.trim();
        return name ? { name } : null;
      }
      const name = (c.name ?? "").trim();
      if (!name) return null;
      return { name, url: c.url?.trim() || undefined };
    })
    .filter((c): c is CertificationItem => !!c);
}
