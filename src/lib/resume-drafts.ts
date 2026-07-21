import type {
  CertificateEntry,
  EducationEntry,
  ExperienceEntry,
  GuidedAnswer,
  GuidedQuestion,
  InterviewQuestion,
  LanguageEntry,
  ResumeBasics,
  ResumeData,
  TemplateId,
  BuilderMode,
} from "@/lib/types";
import { normalizeCertifications, normalizeResumeSkills } from "@/lib/types";

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

export function createEmptyExperience(): ExperienceEntry {
  return {
    id: crypto.randomUUID(),
    position: "",
    company: "",
    startDate: "",
    endDate: "",
    current: false,
  };
}

export function createEmptyEducation(): EducationEntry {
  return {
    id: crypto.randomUUID(),
    degree: "",
    institution: "",
    graduationDate: "",
    gpa: "",
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
    graduationDate: e.graduationDate ?? "",
    gpa: e.gpa ?? "",
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
    },
    questions: [],
    answers: {},
    guidedQuestions: [],
    guidedAnswers: {},
    guidedQuestionIndex: 0,
    suggestedSkills: [],
    selectedSkills: [],
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
  return (
    !!entry.position.trim() &&
    !!entry.company.trim() &&
    !!entry.startDate.trim() &&
    hasEnd
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
    !!basics.targetRole.trim()
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

/** Pull experience + skills from guided answers into basics/skills for generation. */
export function extractFromGuidedAnswers(
  questions: GuidedQuestion[],
  answers: Record<string, GuidedAnswer>
): { experience: ExperienceEntry[]; selectedSkills: string[] } {
  const experience: ExperienceEntry[] = [];
  const selectedSkills: string[] = [];

  for (const q of questions) {
    const a = answers[q.id];
    if (!a) continue;

    if (q.type === "multi_choice" && (q.category === "technologies" || q.category === "skills")) {
      selectedSkills.push(...(a.choices || []));
      if (a.otherText?.trim()) {
        a.otherText
          .split(/[,،]/)
          .map((s) => s.trim())
          .filter(Boolean)
          .forEach((s) => selectedSkills.push(s));
      }
    }

    if (a.fieldGroups?.length) {
      for (const g of a.fieldGroups) {
        const v = g.values;
        const company = (v.company || v.companyName || "").trim();
        const position = (v.position || v.title || v.jobTitle || "").trim();
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
            startDate,
            endDate,
            current,
          });
        }
      }
    }
  }

  return {
    experience: experience.length ? experience : [createEmptyExperience()],
    selectedSkills: [...new Set(selectedSkills)],
  };
}
