import type {
  InterviewQuestion,
  ResumeBasics,
  ResumeData,
  TemplateId,
} from "@/lib/types";

export type BuilderStep = "basics" | "interview" | "template" | "preview";

export interface ResumeDraft {
  id: string;
  name: string;
  updatedAt: string;
  basics: ResumeBasics;
  questions: InterviewQuestion[];
  answers: Record<string, string>;
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
};

export function createEmptyDraft(): ResumeDraft {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  return {
    id,
    name: "Untitled Resume",
    updatedAt: now,
    basics: { ...emptyBasics },
    questions: [],
    answers: {},
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
  };
}

export function normalizeDraft(draft: ResumeDraft): ResumeDraft {
  return {
    ...draft,
    basics: normalizeBasics(draft.basics),
    questions: draft.questions ?? [],
    answers: draft.answers ?? {},
    template: draft.template ?? "modern",
    step: draft.step ?? "basics",
    maxStepIndex: draft.maxStepIndex ?? 0,
    resume: draft.resume ?? null,
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

export function draftHasContent(draft: ResumeDraft): boolean {
  return (
    !!draft.basics.fullName ||
    !!draft.basics.email ||
    !!draft.basics.careerBackground ||
    draft.questions.length > 0 ||
    Object.values(draft.answers).some((a) => a.trim()) ||
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
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
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
      template: saved.template ?? "modern",
      step: saved.step ?? "basics",
      maxStepIndex: saved.maxStepIndex ?? 0,
      resume: saved.resume ?? null,
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
