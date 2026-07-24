import type {
  CertificateEntry,
  EducationEntry,
  ExperienceEntry,
  GuidedAnswer,
  GuidedQuestion,
  InterviewQuestion,
  LanguageEntry,
  ReferenceEntry,
  ResumeBasics,
  ResumeData,
  TemplateId,
  BuilderMode,
  Reference,
} from "@/lib/types";
import {
  normalizeCertifications,
  normalizeReferences,
  normalizeResumeSkills,
} from "@/lib/types";

export type BuilderStep =
  | "basics"
  | "interview"
  | "skills"
  | "template"
  | "preview"
  | "mode";

export type GuidedBuilderStep = "basics" | "interview" | "template" | "preview";

export interface ResumeDraft {
  id: string;
  name: string;
  updatedAt: string;
  /** null until user picks Quick or Detailed */
  mode: BuilderMode | null;
  basics: ResumeBasics;
  questions: InterviewQuestion[];
  answers: Record<string, string>;
  guidedQuestions: GuidedQuestion[];
  guidedAnswers: Record<string, GuidedAnswer>;
  guidedQuestionIndex: number;
  suggestedSkills: string[];
  selectedSkills: string[];
  /** Core competencies selected on Detailed skills step. */
  selectedCompetencies: string[];
  suggestedCompetencies: string[];
  template: TemplateId;
  step: BuilderStep;
  maxStepIndex: number;
  resume: ResumeData | null;
}

export interface DraftStore {
  activeId: string;
  drafts: ResumeDraft[];
}

const STORAGE_KEY = "bahath-resume-builder-drafts";

export const LANGUAGE_PROFICIENCIES = [
  "Native",
  "Fluent",
  "Advanced",
  "Intermediate",
  "Basic",
] as const;

export type LanguageProficiency = (typeof LANGUAGE_PROFICIENCIES)[number];

const PROFICIENCY_LABELS: Record<
  LanguageProficiency,
  { en: string; ar: string }
> = {
  Native: { en: "Native", ar: "لغة أم" },
  Fluent: { en: "Fluent", ar: "طلاقة" },
  Advanced: { en: "Advanced", ar: "متقدم" },
  Intermediate: { en: "Intermediate", ar: "متوسط" },
  Basic: { en: "Basic", ar: "أساسي" },
};

/** Localized label for a stored proficiency value (values stay English for consistency). */
export function languageProficiencyLabel(
  value: string,
  locale: "en" | "ar"
): string {
  const key = value as LanguageProficiency;
  if (PROFICIENCY_LABELS[key]) return PROFICIENCY_LABELS[key][locale];
  return value;
}

/** Format "Language (Proficiency)" for CV text, localized when needed. */
export function formatLanguageEntry(
  language: string,
  proficiency: string | undefined,
  locale: "en" | "ar" = "en"
): string {
  const name = language.trim();
  if (!name) return "";
  if (!proficiency?.trim()) return name;
  return `${name} (${languageProficiencyLabel(proficiency.trim(), locale)})`;
}

export function createEmptyExperience(): ExperienceEntry {
  return {
    id: crypto.randomUUID(),
    position: "",
    company: "",
    location: "",
    startDate: "",
    endDate: "",
    current: false,
  };
}

/** Current calendar month as `YYYY-MM` (for `<input type="month">`). */
export function currentYearMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

/** Phone must be international: starts with `+` or `00`, with enough digits. */
export function isValidInternationalPhone(phone: string): boolean {
  const p = phone.trim();
  if (!p) return false;
  if (!(p.startsWith("+") || p.startsWith("00"))) return false;
  const digits = p.replace(/\D/g, "");
  return digits.length >= 8 && digits.length <= 15;
}

/** Month value `YYYY-MM` must not be after the current month. Empty is allowed. */
export function isMonthNotInFuture(ym: string): boolean {
  const v = ym.trim();
  if (!v) return true;
  return v <= currentYearMonth();
}

export function createEmptyEducation(): EducationEntry {
  return {
    id: crypto.randomUUID(),
    degree: "",
    institution: "",
    location: "",
    graduationDate: "",
    gpa: "",
  };
}

export function createEmptyReference(): ReferenceEntry {
  return {
    id: crypto.randomUUID(),
    name: "",
    title: "",
    company: "",
    phone: "",
    email: "",
  };
}

export function createEmptyLanguage(): LanguageEntry {
  return {
    id: crypto.randomUUID(),
    language: "",
    proficiency: "Fluent",
  };
}

export function createEmptyCertificate(): CertificateEntry {
  return {
    id: crypto.randomUUID(),
    name: "",
    fileName: "",
    fileDataUrl: "",
    mimeType: "",
  };
}

export function normalizeExperience(
  entries?: Partial<ExperienceEntry>[] | null
): ExperienceEntry[] {
  if (!entries?.length) return [createEmptyExperience()];
  return entries.map((e) => ({
    id: e.id || crypto.randomUUID(),
    position: e.position ?? "",
    company: e.company ?? "",
    location: e.location ?? "",
    startDate: e.startDate ?? "",
    endDate: e.endDate ?? "",
    current: !!e.current,
  }));
}

export function normalizeEducationEntries(
  entries?: Partial<EducationEntry>[] | null
): EducationEntry[] {
  if (!entries?.length) return [createEmptyEducation()];
  return entries.map((e) => ({
    id: e.id || crypto.randomUUID(),
    degree: e.degree ?? "",
    institution: e.institution ?? "",
    location: e.location ?? "",
    graduationDate: e.graduationDate ?? "",
    gpa: e.gpa ?? "",
  }));
}

export function normalizeReferenceEntries(
  entries?: Partial<ReferenceEntry>[] | null
): ReferenceEntry[] {
  if (!entries) return [];
  return entries.map((e) => ({
    id: e.id || crypto.randomUUID(),
    name: e.name ?? "",
    title: e.title ?? "",
    company: e.company ?? "",
    phone: e.phone ?? "",
    email: e.email ?? "",
  }));
}

export function normalizeLanguageEntries(
  entries?: Partial<LanguageEntry>[] | null
): LanguageEntry[] {
  if (!entries) return [];
  return entries.map((e) => ({
    id: e.id || crypto.randomUUID(),
    language: e.language ?? "",
    proficiency: e.proficiency ?? "Fluent",
  }));
}

export function normalizeCertificateEntries(
  entries?: Partial<CertificateEntry>[] | null
): CertificateEntry[] {
  if (!entries) return [];
  return entries.map((e) => ({
    id: e.id || crypto.randomUUID(),
    name: e.name ?? "",
    fileName: e.fileName ?? "",
    fileDataUrl: e.fileDataUrl ?? "",
    mimeType: e.mimeType ?? "",
  }));
}

export const emptyBasics: ResumeBasics = {
  fullName: "",
  email: "",
  phone: "",
  location: "",
  linkedin: "",
  github: "",
  website: "",
  targetRole: "",
  careerBackground: "",
  photoDataUrl: "",
  experience: [],
  education: [],
  languages: [],
  certificates: [],
  references: [],
};

export function createEmptyDraft(): ResumeDraft {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  return {
    id,
    name: "Untitled Resume",
    updatedAt: now,
    mode: null,
    basics: {
      ...emptyBasics,
      experience: [createEmptyExperience()],
      education: [createEmptyEducation()],
      languages: [],
      certificates: [],
      references: [],
    },
    questions: [],
    answers: {},
    guidedQuestions: [],
    guidedAnswers: {},
    guidedQuestionIndex: 0,
    suggestedSkills: [],
    selectedSkills: [],
    suggestedCompetencies: [],
    selectedCompetencies: [],
    template: "modern",
    step: "mode",
    maxStepIndex: 0,
    resume: null,
  };
}

export function normalizeBasics(basics?: Partial<ResumeBasics>): ResumeBasics {
  return {
    fullName: basics?.fullName ?? "",
    email: basics?.email ?? "",
    phone: basics?.phone ?? "",
    location: basics?.location ?? "",
    linkedin: basics?.linkedin ?? "",
    github: basics?.github ?? "",
    website: basics?.website ?? "",
    targetRole: basics?.targetRole ?? "",
    careerBackground: basics?.careerBackground ?? "",
    photoDataUrl: basics?.photoDataUrl ?? "",
    experience: normalizeExperience(basics?.experience),
    education: normalizeEducationEntries(basics?.education),
    languages: normalizeLanguageEntries(basics?.languages),
    certificates: normalizeCertificateEntries(basics?.certificates),
    references: normalizeReferenceEntries(basics?.references),
  };
}

export function normalizeResume(resume: ResumeData | null): ResumeData | null {
  if (!resume) return null;
  return {
    ...resume,
    experience: Array.isArray(resume.experience) ? resume.experience : [],
    education: Array.isArray(resume.education) ? resume.education : [],
    projects: Array.isArray(resume.projects) ? resume.projects : [],
    languages: Array.isArray(resume.languages) ? resume.languages : [],
    skills: normalizeResumeSkills(resume.skills),
    certifications: normalizeCertifications(resume.certifications),
    references: normalizeReferences(resume.references),
  };
}

const VALID_STEPS: BuilderStep[] = [
  "mode",
  "basics",
  "interview",
  "skills",
  "template",
  "preview",
];

export function normalizeDraft(draft: ResumeDraft): ResumeDraft {
  const mode =
    draft.mode === "guided" || draft.mode === "detailed" ? draft.mode : null;
  const step = VALID_STEPS.includes(draft.step)
    ? draft.step
    : mode
      ? "basics"
      : "mode";

  // Explicit mode picker (Change writing mode / nav select) — do not re-infer.
  // Legacy drafts with no mode still get inferred from content when not on picker.
  const inferredMode =
    mode ??
    (step === "mode"
      ? null
      : draft.questions?.length || draft.resume
        ? "detailed"
        : draft.guidedQuestions?.length
          ? "guided"
          : null);

  return {
    ...draft,
    mode: inferredMode,
    basics: normalizeBasics(draft.basics),
    questions: draft.questions ?? [],
    answers: draft.answers ?? {},
    guidedQuestions: draft.guidedQuestions ?? [],
    guidedAnswers: draft.guidedAnswers ?? {},
    guidedQuestionIndex: draft.guidedQuestionIndex ?? 0,
    suggestedSkills: draft.suggestedSkills ?? [],
    selectedSkills: draft.selectedSkills ?? [],
    suggestedCompetencies: draft.suggestedCompetencies ?? [],
    selectedCompetencies: draft.selectedCompetencies ?? [],
    template: draft.template ?? "modern",
    // Only coerce step away from "mode" when a mode is already chosen
    step: inferredMode && step === "mode" ? "basics" : step,
    maxStepIndex: draft.maxStepIndex ?? 0,
    resume: normalizeResume(draft.resume ?? null),
  };
}

export function normalizeDraftStore(store: DraftStore): DraftStore {
  const drafts = store.drafts.map(normalizeDraft);
  const activeId = drafts.some((d) => d.id === store.activeId)
    ? store.activeId
    : drafts[0]?.id ?? store.activeId;
  return { activeId, drafts };
}

export function draftDisplayName(draft: ResumeDraft): string {
  const { fullName, targetRole } = draft.basics;
  if (fullName && targetRole) return `${fullName} — ${targetRole}`;
  if (fullName) return fullName;
  if (targetRole) return targetRole;
  return draft.name;
}

export function isExperienceComplete(entry: ExperienceEntry): boolean {
  const hasEnd = entry.current || !!entry.endDate.trim();
  const datesOk =
    isMonthNotInFuture(entry.startDate) &&
    (entry.current || isMonthNotInFuture(entry.endDate));
  return (
    !!entry.position.trim() &&
    !!entry.company.trim() &&
    !!entry.startDate.trim() &&
    hasEnd &&
    datesOk
  );
}

export function hasValidExperience(basics: ResumeBasics): boolean {
  return basics.experience.some(isExperienceComplete);
}

export function isEducationComplete(entry: EducationEntry): boolean {
  return (
    !!entry.degree.trim() &&
    !!entry.institution.trim() &&
    !!entry.graduationDate.trim()
  );
}

export function hasValidEducation(basics: ResumeBasics): boolean {
  return basics.education.some(isEducationComplete);
}

export function draftHasContent(draft: ResumeDraft): boolean {
  return (
    !!draft.mode ||
    !!draft.basics.fullName ||
    !!draft.basics.email ||
    !!draft.basics.careerBackground ||
    draft.basics.experience.some(
      (e) => e.position.trim() || e.company.trim()
    ) ||
    draft.basics.education.some(
      (e) => e.degree.trim() || e.institution.trim()
    ) ||
    draft.basics.languages.some((e) => e.language.trim()) ||
    draft.basics.certificates.some((e) => e.name.trim()) ||
    draft.questions.length > 0 ||
    draft.guidedQuestions.length > 0 ||
    Object.values(draft.answers).some((a) => a.trim()) ||
    Object.keys(draft.guidedAnswers).length > 0 ||
    draft.selectedSkills.length > 0 ||
    !!draft.resume
  );
}

export function hasValidGuidedBasics(basics: ResumeBasics): boolean {
  return (
    !!basics.fullName.trim() &&
    !!basics.email.trim() &&
    !!basics.targetRole.trim() &&
    isValidInternationalPhone(basics.phone)
  );
}

export function loadDraftStore(): DraftStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const draft = createEmptyDraft();
      return { activeId: draft.id, drafts: [draft] };
    }

    const parsed = JSON.parse(raw) as DraftStore;
    if (!parsed.drafts?.length) {
      const draft = createEmptyDraft();
      return { activeId: draft.id, drafts: [draft] };
    }

    return normalizeDraftStore(parsed);
  } catch {
    const draft = createEmptyDraft();
    return { activeId: draft.id, drafts: [draft] };
  }
}

export function saveDraftStore(store: DraftStore): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch (e) {
    const message =
      e instanceof DOMException && e.name === "QuotaExceededError"
        ? "Storage full — try smaller certificate files (max ~1.5MB each)."
        : "Failed to save draft";
    throw new Error(message);
  }
}

export function getActiveDraft(store: DraftStore): ResumeDraft {
  return store.drafts.find((d) => d.id === store.activeId) ?? store.drafts[0];
}

export function upsertDraft(store: DraftStore, draft: ResumeDraft): DraftStore {
  const name = draftDisplayName(draft);
  const updated: ResumeDraft = normalizeDraft({
    ...draft,
    name,
    updatedAt: new Date().toISOString(),
  });
  const exists = store.drafts.some((d) => d.id === updated.id);
  const drafts = exists
    ? store.drafts.map((d) => (d.id === updated.id ? updated : d))
    : [...store.drafts, updated];

  return { activeId: updated.id, drafts };
}

export function switchActiveDraft(store: DraftStore, id: string): DraftStore {
  if (!store.drafts.some((d) => d.id === id)) return store;
  return { ...store, activeId: id };
}

export function deleteDraft(store: DraftStore, id: string): DraftStore {
  const drafts = store.drafts.filter((d) => d.id !== id);
  if (!drafts.length) {
    const fresh = createEmptyDraft();
    return { activeId: fresh.id, drafts: [fresh] };
  }
  const activeId =
    store.activeId === id ? drafts[drafts.length - 1].id : store.activeId;
  return { activeId, drafts };
}

export function startNewDraft(store: DraftStore, saveCurrent: boolean): DraftStore {
  const current = getActiveDraft(store);
  let drafts = [...store.drafts];

  if (saveCurrent && draftHasContent(current)) {
    const saved = {
      ...current,
      name: draftDisplayName(current),
      updatedAt: new Date().toISOString(),
    };
    drafts = drafts.map((d) => (d.id === current.id ? saved : d));
  } else {
    drafts = drafts.filter((d) => d.id !== current.id);
  }

  const fresh = createEmptyDraft();
  return {
    activeId: fresh.id,
    drafts: [...drafts, fresh],
  };
}

/** Migrate legacy single-draft key if present */
export function migrateLegacyDraft(): DraftStore | null {
  const legacyKey = "bahath-resume-builder-draft";
  try {
    const raw = localStorage.getItem(legacyKey);
    if (!raw) return null;

    const saved = JSON.parse(raw) as Partial<ResumeDraft>;
    const draft = normalizeDraft({
      ...createEmptyDraft(),
      ...saved,
      id: crypto.randomUUID(),
      name: "Untitled Resume",
      updatedAt: new Date().toISOString(),
      basics: normalizeBasics(saved.basics),
    } as ResumeDraft);
    draft.name = draftDisplayName(draft);

    localStorage.removeItem(legacyKey);
    const store: DraftStore = { activeId: draft.id, drafts: [draft] };
    saveDraftStore(store);
    return store;
  } catch {
    localStorage.removeItem(legacyKey);
    return null;
  }
}

/** Format guided answers into text Q&A for the generate-resume API. */
export function guidedAnswersToInterviewAnswers(
  questions: GuidedQuestion[],
  answers: Record<string, GuidedAnswer>
): { questionId: string; answer: string }[] {
  return questions.map((q) => {
    const a = answers[q.id];
    if (!a) return { questionId: q.id, answer: "" };
    const parts: string[] = [];
    if (q.type === "multi_choice") {
      const picks = [...(a.choices || [])];
      if (a.otherText?.trim()) picks.push(`Other: ${a.otherText.trim()}`);
      parts.push(picks.join(", ") || "");
    } else {
      parts.push(a.choice || "");
      if (a.otherText?.trim()) parts.push(`Other: ${a.otherText.trim()}`);
    }
    if (a.fieldGroups?.length) {
      a.fieldGroups.forEach((g, i) => {
        const fields = Object.entries(g.values)
          .filter(([, v]) => v?.trim())
          .map(([k, v]) => `${k}: ${v}`)
          .join(", ");
        if (fields) parts.push(`Entry ${i + 1}: ${fields}`);
      });
    }
    return { questionId: q.id, answer: parts.filter(Boolean).join(". ") };
  });
}

/** Pull experience, skills, competencies, references from guided answers. */
export function extractFromGuidedAnswers(
  questions: GuidedQuestion[],
  answers: Record<string, GuidedAnswer>
): {
  experience: ExperienceEntry[];
  education: EducationEntry[];
  selectedSkills: string[];
  selectedCompetencies: string[];
  references: ReferenceEntry[];
} {
  const experience: ExperienceEntry[] = [];
  const education: EducationEntry[] = [];
  const selectedSkills: string[] = [];
  const selectedCompetencies: string[] = [];
  const references: ReferenceEntry[] = [];

  for (const q of questions) {
    const a = answers[q.id];
    if (!a) continue;

    if (q.type === "multi_choice") {
      const picks = [...(a.choices || [])];
      if (a.otherText?.trim()) {
        a.otherText
          .split(/[,،]/)
          .map((s) => s.trim())
          .filter(Boolean)
          .forEach((s) => picks.push(s));
      }
      if (
        q.category === "skills" ||
        q.topic === "job_skills_tools" ||
        q.topic === "soft_skills"
      ) {
        // Role core competencies vs tools: prefer competencies for "skills",
        // technical for "technologies"
        if (q.category === "technologies") {
          selectedSkills.push(...picks);
        } else {
          selectedCompetencies.push(...picks);
        }
      } else if (q.category === "technologies") {
        selectedSkills.push(...picks);
      }
    }

    if (a.fieldGroups?.length) {
      for (const g of a.fieldGroups) {
        const v = g.values;

        if (q.category === "references") {
          const name = (v.name || v.referenceName || "").trim();
          if (name) {
            references.push({
              id: g.id || crypto.randomUUID(),
              name,
              title: (v.title || v.jobTitle || "").trim(),
              company: (v.company || v.organization || "").trim(),
              phone: (v.phone || "").trim(),
              email: (v.email || "").trim(),
            });
          }
          continue;
        }

        if (q.category === "education" || (v.degree && v.institution)) {
          const degree = (v.degree || "").trim();
          const institution = (v.institution || v.school || "").trim();
          const location = (v.location || v.city || "").trim();
          if (degree || institution) {
            education.push({
              id: g.id || crypto.randomUUID(),
              degree,
              institution,
              location,
              graduationDate: (v.graduationDate || v.endDate || "").trim(),
              gpa: (v.gpa || "").trim(),
            });
            continue;
          }
        }

        const company = (v.company || v.companyName || "").trim();
        const position = (v.position || v.title || v.jobTitle || "").trim();
        const location = (v.location || v.city || "").trim();
        const startDate = (v.startDate || v.from || "").trim();
        const endDate = (v.endDate || v.to || "").trim();
        const current =
          (v.current || "").toLowerCase() === "true" ||
          (v.current || "").toLowerCase() === "yes";

        if (company || position) {
          experience.push({
            id: g.id || crypto.randomUUID(),
            company,
            position,
            location,
            startDate,
            endDate: current ? "" : endDate,
            current,
          });
        }
      }
    }
  }

  return {
    experience: experience.length ? experience : [createEmptyExperience()],
    education,
    selectedSkills: [...new Set(selectedSkills)],
    selectedCompetencies: [...new Set(selectedCompetencies)],
    references,
  };
}

export function referenceEntriesToResume(
  entries: ReferenceEntry[]
): Reference[] {
  return normalizeReferences(
    entries
      .filter((e) => e.name.trim())
      .map((e) => ({
        name: e.name.trim(),
        title: e.title?.trim() || undefined,
        company: e.company?.trim() || undefined,
        phone: e.phone?.trim() || undefined,
        email: e.email?.trim() || undefined,
      }))
  );
}
