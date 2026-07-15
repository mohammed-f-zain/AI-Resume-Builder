import type {
  CertificateEntry,
  EducationEntry,
  ExperienceEntry,
  InterviewQuestion,
  LanguageEntry,
  ResumeBasics,
  ResumeData,
  TemplateId,
} from "@/lib/types";
import { normalizeCertifications, normalizeResumeSkills } from "@/lib/types";

export type BuilderStep =
  | "basics"
  | "interview"
  | "skills"
  | "template"
  | "preview";

export interface ResumeDraft {
  id: string;
  name: string;
  updatedAt: string;
  basics: ResumeBasics;
  questions: InterviewQuestion[];
  answers: Record<string, string>;
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
    basics: {
      ...emptyBasics,
      experience: [createEmptyExperience()],
      education: [createEmptyEducation()],
      languages: [],
      certificates: [],
    },
    questions: [],
    answers: {},
    suggestedSkills: [],
    selectedSkills: [],
    template: "modern",
    step: "basics",
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
    skills: normalizeResumeSkills(resume.skills),
    certifications: normalizeCertifications(resume.certifications),
  };
}

const VALID_STEPS: BuilderStep[] = [
  "basics",
  "interview",
  "skills",
  "template",
  "preview",
];

export function normalizeDraft(draft: ResumeDraft): ResumeDraft {
  const step = VALID_STEPS.includes(draft.step) ? draft.step : "basics";
  return {
    ...draft,
    basics: normalizeBasics(draft.basics),
    questions: draft.questions ?? [],
    answers: draft.answers ?? {},
    suggestedSkills: draft.suggestedSkills ?? [],
    selectedSkills: draft.selectedSkills ?? [],
    template: draft.template ?? "modern",
    step,
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
    Object.values(draft.answers).some((a) => a.trim()) ||
    draft.selectedSkills.length > 0 ||
    !!draft.resume
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

    const saved = JSON.parse(raw) as Omit<ResumeDraft, "id" | "name" | "updatedAt">;
    const draft: ResumeDraft = {
      id: crypto.randomUUID(),
      name: draftDisplayName({
        ...createEmptyDraft(),
        ...saved,
        basics: normalizeBasics(saved.basics),
      }),
      updatedAt: new Date().toISOString(),
      basics: normalizeBasics(saved.basics),
      questions: saved.questions ?? [],
      answers: saved.answers ?? {},
      suggestedSkills: saved.suggestedSkills ?? [],
      selectedSkills: saved.selectedSkills ?? [],
      template: saved.template ?? "modern",
      step: VALID_STEPS.includes(saved.step) ? saved.step : "basics",
      maxStepIndex: saved.maxStepIndex ?? 0,
      resume: normalizeResume(saved.resume ?? null),
    };

    localStorage.removeItem(legacyKey);
    const store: DraftStore = { activeId: draft.id, drafts: [draft] };
    saveDraftStore(store);
    return store;
  } catch {
    localStorage.removeItem(legacyKey);
    return null;
  }
}
