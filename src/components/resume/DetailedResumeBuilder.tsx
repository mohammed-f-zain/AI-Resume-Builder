"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Layout,
  Sparkles,
  Minimize2,
  Briefcase,
  Palette,
  Loader2,
  Printer,
  RefreshCw,
  MessageSquare,
  User,
  ChevronRight,
  ChevronLeft,
  Check,
  Plus,
  FolderOpen,
  Trash2,
  X,
  Wrench,
  Pencil,
  TrendingUp,
} from "lucide-react";
import { useLocale } from "@/contexts/LocaleContext";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input, Label, Textarea } from "@/components/ui/Input";
import { ResumePreview } from "@/components/resume/ResumePreview";
import { ResumeEditor } from "@/components/resume/ResumeEditor";
import { PhotoUpload } from "@/components/resume/PhotoUpload";
import { AtsAnalysisResults } from "@/components/analyzer/AtsAnalysisResults";
import type {
  TemplateId,
  ResumeBasics,
  ResumeData,
  InterviewQuestion,
  InterviewAnswer,
  ExperienceEntry,
  EducationEntry,
  LanguageEntry,
  CertificateEntry,
  ATSAnalysis,
} from "@/lib/types";
import {
  type BuilderStep,
  type DraftStore,
  type ResumeDraft,
  LANGUAGE_PROFICIENCIES,
  createEmptyCertificate,
  createEmptyEducation,
  createEmptyExperience,
  createEmptyLanguage,
  deleteDraft,
  draftDisplayName,
  draftHasContent,
  getActiveDraft,
  hasValidEducation,
  hasValidExperience,
  loadDraftStore,
  migrateLegacyDraft,
  saveDraftStore,
  startNewDraft,
  switchActiveDraft,
  normalizeBasics,
  normalizeDraftStore,
  upsertDraft,
} from "@/lib/resume-drafts";
import { ConfirmDeleteModal } from "@/components/ui/ConfirmDeleteModal";
import { buildTemplatePreviewResume } from "@/lib/template-preview";
import { resumeToPlainText } from "@/lib/resume-to-text";
import { cn } from "@/lib/utils";

const CERT_MAX_BYTES = 1.5 * 1024 * 1024;
const CERT_ACCEPT =
  ".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/png,image/jpeg,image/webp";

function isAllowedCertFile(file: File): boolean {
  const name = file.name.toLowerCase();
  const byExt =
    name.endsWith(".pdf") ||
    name.endsWith(".doc") ||
    name.endsWith(".docx") ||
    name.endsWith(".png") ||
    name.endsWith(".jpg") ||
    name.endsWith(".jpeg") ||
    name.endsWith(".webp");
  const byMime =
    file.type === "application/pdf" ||
    file.type === "application/msword" ||
    file.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    file.type.startsWith("image/");
  return byExt || byMime;
}

/** Normalize stored dates to `YYYY-MM` for `<input type="month">`. */
function toMonthInputValue(value: string): string {
  if (!value) return "";
  if (/^\d{4}-\d{2}$/.test(value)) return value;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value.slice(0, 7);
  const parsed = Date.parse(value);
  if (!Number.isNaN(parsed)) {
    const d = new Date(parsed);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }
  return "";
}

const templates: {
  id: TemplateId;
  labelKey: "templateClassic" | "templateModern" | "templateMinimal" | "templateExecutive" | "templateCreative";
  icon: typeof Layout;
}[] = [
  { id: "classic", labelKey: "templateClassic", icon: Layout },
  { id: "modern", labelKey: "templateModern", icon: Sparkles },
  { id: "minimal", labelKey: "templateMinimal", icon: Minimize2 },
  { id: "executive", labelKey: "templateExecutive", icon: Briefcase },
  { id: "creative", labelKey: "templateCreative", icon: Palette },
];

type Step = BuilderStep;

const steps: {
  id: Step;
  labelKey: "stepBasics" | "stepInterview" | "stepSkills" | "stepTemplate" | "stepPreview";
  icon: typeof User;
}[] = [
  { id: "basics", labelKey: "stepBasics", icon: User },
  { id: "interview", labelKey: "stepInterview", icon: MessageSquare },
  { id: "skills", labelKey: "stepSkills", icon: Wrench },
  { id: "template", labelKey: "stepTemplate", icon: Layout },
  { id: "preview", labelKey: "stepPreview", icon: Sparkles },
];

function TemplatePicker({
  template,
  onSelect,
  t,
}: {
  template: TemplateId;
  onSelect: (id: TemplateId) => void;
  t: (key: "templateClassic" | "templateModern" | "templateMinimal" | "templateExecutive" | "templateCreative" | "chooseTemplate") => string;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {templates.map(({ id, labelKey, icon: Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => onSelect(id)}
          className={cn(
            "flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all",
            template === id
              ? "border-[#002b49] bg-[#002b49]/5"
              : "border-[#e2e8f0] hover:border-[#1db4ce]/50"
          )}
        >
          <Icon
            className={cn(
              "h-6 w-6",
              template === id ? "text-[#002b49]" : "text-[#6b7c93]"
            )}
          />
          <span className="text-sm font-medium">{t(labelKey)}</span>
        </button>
      ))}
    </div>
  );
}

export function DetailedResumeBuilder({
  onModeCleared,
}: {
  onModeCleared?: () => void;
}) {
  const { t, locale, dir } = useLocale();
  const [store, setStore] = useState<DraftStore | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [showDraftMenu, setShowDraftMenu] = useState(false);
  const [customSkill, setCustomSkill] = useState("");
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [editingResume, setEditingResume] = useState(false);
  const [atsLoading, setAtsLoading] = useState(false);
  const [atsResult, setAtsResult] = useState<ATSAnalysis | null>(null);

  const draft = store ? getActiveDraft(store) : null;
  const rawStep = draft?.step ?? "basics";
  const step = rawStep === "mode" ? "basics" : rawStep;
  const maxStepIndex = draft?.maxStepIndex ?? 0;
  const basics = draft?.basics;
  const questions = draft?.questions ?? [];
  const answers = draft?.answers ?? {};
  const suggestedSkills = draft?.suggestedSkills ?? [];
  const selectedSkills = draft?.selectedSkills ?? [];
  const template = draft?.template ?? "modern";
  const resume = draft?.resume ?? null;

  const stepIndex = steps.findIndex((s) => s.id === step);
  const Chevron = dir === "rtl" ? ChevronLeft : ChevronRight;
  const ChevronBack = dir === "rtl" ? ChevronRight : ChevronLeft;

  const patchDraft = useCallback((updater: (current: ResumeDraft) => ResumeDraft) => {
    setStore((prev) => {
      if (!prev) return prev;
      const current = getActiveDraft(prev);
      const next = upsertDraft(prev, updater(current));
      try {
        saveDraftStore(next);
        return next;
      } catch (e) {
        const message = e instanceof Error ? e.message : "Failed to save";
        queueMicrotask(() => setError(message));
        return prev;
      }
    });
  }, []);

  useEffect(() => {
    const migrated = migrateLegacyDraft();
    const loaded = normalizeDraftStore(migrated ?? loadDraftStore());
    setStore(loaded);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!showDraftMenu) return;
    const close = () => setShowDraftMenu(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [showDraftMenu]);

  const goToStep = useCallback(
    (targetIndex: number) => {
      if (targetIndex <= maxStepIndex) {
        patchDraft((d) => ({ ...d, step: steps[targetIndex].id }));
        setError("");
      }
    },
    [maxStepIndex, patchDraft]
  );

  const advanceToStep = useCallback(
    (targetIndex: number) => {
      patchDraft((d) => ({
        ...d,
        step: steps[targetIndex].id,
        maxStepIndex: Math.max(d.maxStepIndex, targetIndex),
      }));
      setError("");
    },
    [patchDraft]
  );

  const updateBasics = (
    field: keyof Omit<
      ResumeBasics,
      "experience" | "education" | "languages" | "certificates"
    >,
    value: string
  ) => {
    patchDraft((d) => ({
      ...d,
      basics: normalizeBasics({ ...d.basics, [field]: value }),
    }));
  };

  const updateExperience = (id: string, field: keyof ExperienceEntry, value: string | boolean) => {
    patchDraft((d) => ({
      ...d,
      basics: normalizeBasics({
        ...d.basics,
        experience: d.basics.experience.map((e) =>
          e.id === id ? { ...e, [field]: value } : e
        ),
      }),
    }));
  };

  const addExperience = () => {
    patchDraft((d) => ({
      ...d,
      basics: normalizeBasics({
        ...d.basics,
        experience: [...d.basics.experience, createEmptyExperience()],
      }),
    }));
  };

  const removeExperience = (id: string) => {
    patchDraft((d) => {
      const next = d.basics.experience.filter((e) => e.id !== id);
      return {
        ...d,
        basics: normalizeBasics({
          ...d.basics,
          experience: next.length ? next : [createEmptyExperience()],
        }),
      };
    });
  };

  const updateEducation = (id: string, field: keyof EducationEntry, value: string) => {
    patchDraft((d) => ({
      ...d,
      basics: normalizeBasics({
        ...d.basics,
        education: d.basics.education.map((e) =>
          e.id === id ? { ...e, [field]: value } : e
        ),
      }),
    }));
  };

  const addEducation = () => {
    patchDraft((d) => ({
      ...d,
      basics: normalizeBasics({
        ...d.basics,
        education: [...d.basics.education, createEmptyEducation()],
      }),
    }));
  };

  const removeEducation = (id: string) => {
    patchDraft((d) => {
      const next = d.basics.education.filter((e) => e.id !== id);
      return {
        ...d,
        basics: normalizeBasics({
          ...d.basics,
          education: next.length ? next : [createEmptyEducation()],
        }),
      };
    });
  };

  const updateLanguage = (id: string, field: keyof LanguageEntry, value: string) => {
    patchDraft((d) => ({
      ...d,
      basics: normalizeBasics({
        ...d.basics,
        languages: d.basics.languages.map((e) =>
          e.id === id ? { ...e, [field]: value } : e
        ),
      }),
    }));
  };

  const addLanguage = () => {
    patchDraft((d) => ({
      ...d,
      basics: normalizeBasics({
        ...d.basics,
        languages: [...d.basics.languages, createEmptyLanguage()],
      }),
    }));
  };

  const removeLanguage = (id: string) => {
    patchDraft((d) => ({
      ...d,
      basics: normalizeBasics({
        ...d.basics,
        languages: d.basics.languages.filter((e) => e.id !== id),
      }),
    }));
  };

  const updateCertificate = (
    id: string,
    field: keyof CertificateEntry,
    value: string
  ) => {
    patchDraft((d) => ({
      ...d,
      basics: normalizeBasics({
        ...d.basics,
        certificates: d.basics.certificates.map((e) =>
          e.id === id ? { ...e, [field]: value } : e
        ),
      }),
    }));
  };

  const addCertificate = () => {
    patchDraft((d) => ({
      ...d,
      basics: normalizeBasics({
        ...d.basics,
        certificates: [...d.basics.certificates, createEmptyCertificate()],
      }),
    }));
  };

  const removeCertificate = (id: string) => {
    patchDraft((d) => ({
      ...d,
      basics: normalizeBasics({
        ...d.basics,
        certificates: d.basics.certificates.filter((e) => e.id !== id),
      }),
    }));
  };

  const handleCertificateFile = async (id: string, file: File | null) => {
    if (!file) return;
    if (!isAllowedCertFile(file)) {
      setError(t("certificateFileInvalid"));
      return;
    }
    if (file.size > CERT_MAX_BYTES) {
      setError(t("certificateFileTooLarge"));
      return;
    }
    setError("");
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(file);
      });
      patchDraft((d) => ({
        ...d,
        basics: normalizeBasics({
          ...d.basics,
          certificates: d.basics.certificates.map((c) => {
            if (c.id !== id) return c;
            const defaultName =
              c.name.trim() || file.name.replace(/\.[^.]+$/, "");
            return {
              ...c,
              name: defaultName,
              fileName: file.name,
              fileDataUrl: dataUrl,
              mimeType: file.type || "",
            };
          }),
        }),
      }));
    } catch {
      setError(t("error"));
    }
  };

  const clearCertificateFile = (id: string) => {
    patchDraft((d) => ({
      ...d,
      basics: normalizeBasics({
        ...d.basics,
        certificates: d.basics.certificates.map((c) =>
          c.id === id
            ? { ...c, fileName: "", fileDataUrl: "", mimeType: "" }
            : c
        ),
      }),
    }));
  };

  const setTemplate = (id: TemplateId) => {
    patchDraft((d) => ({ ...d, template: id }));
  };

  const setAnswers = (updater: (prev: Record<string, string>) => Record<string, string>) => {
    patchDraft((d) => ({ ...d, answers: updater(d.answers) }));
  };

  const toggleSkill = (skill: string) => {
    patchDraft((d) => {
      const exists = d.selectedSkills.includes(skill);
      return {
        ...d,
        selectedSkills: exists
          ? d.selectedSkills.filter((s) => s !== skill)
          : [...d.selectedSkills, skill],
      };
    });
  };

  const addCustomSkill = () => {
    const skill = customSkill.trim();
    if (!skill) return;
    patchDraft((d) => {
      const already =
        d.selectedSkills.some((s) => s.toLowerCase() === skill.toLowerCase()) ||
        d.suggestedSkills.some((s) => s.toLowerCase() === skill.toLowerCase());
      return {
        ...d,
        suggestedSkills: already
          ? d.suggestedSkills
          : [...d.suggestedSkills, skill],
        selectedSkills: d.selectedSkills.some(
          (s) => s.toLowerCase() === skill.toLowerCase()
        )
          ? d.selectedSkills
          : [...d.selectedSkills, skill],
      };
    });
    setCustomSkill("");
  };

  const handleSwitchDraft = (id: string) => {
    if (!store) return;
    const next = switchActiveDraft(store, id);
    saveDraftStore(next);
    setStore(next);
    setShowDraftMenu(false);
    setError("");
    const switched = getActiveDraft(next);
    if (switched.mode !== "detailed") {
      queueMicrotask(() => onModeCleared?.());
    }
  };

  const handleDeleteDraft = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDraftMenu(false);
    // Defer so the document click that closes the menu can't clear the modal open state
    window.setTimeout(() => setDeleteTargetId(id), 0);
  };

  const confirmDeleteDraft = () => {
    if (!store || !deleteTargetId) return;
    const next = deleteDraft(store, deleteTargetId);
    saveDraftStore(next);
    setStore(next);
    setDeleteTargetId(null);
    const switched = getActiveDraft(next);
    if (switched.mode !== "detailed") {
      queueMicrotask(() => onModeCleared?.());
    }
  };

  const returnToModePicker = (nextStore: DraftStore) => {
    const active = getActiveDraft(nextStore);
    const cleared = upsertDraft(nextStore, {
      ...active,
      mode: null,
      step: "mode",
      maxStepIndex: 0,
      guidedQuestions: [],
      guidedAnswers: {},
      guidedQuestionIndex: 0,
      questions: [],
      answers: {},
      suggestedSkills: [],
      selectedSkills: [],
      resume: null,
    });
    saveDraftStore(cleared);
    setStore(cleared);
    setShowNewModal(false);
    setError("");
    queueMicrotask(() => onModeCleared?.());
  };

  const handleStartNewClick = () => {
    if (!store || !draft) return;
    if (!draftHasContent(draft)) {
      returnToModePicker(store);
      return;
    }
    setShowNewModal(true);
  };

  const confirmStartNew = (saveCurrent: boolean) => {
    if (!store) return;
    const next = startNewDraft(store, saveCurrent);
    returnToModePicker(next);
  };

  const changeMode = () => {
    patchDraft((d) => ({
      ...d,
      mode: null,
      step: "mode",
      maxStepIndex: 0,
    }));
    queueMicrotask(() => onModeCleared?.());
  };

  const fetchQuestions = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/resume-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ basics, language: locale }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("error"));
      patchDraft((d) => {
        const merged: Record<string, string> = {};
        data.questions.forEach((q: InterviewQuestion) => {
          merged[q.id] = d.answers[q.id] || "";
        });
        return {
          ...d,
          questions: data.questions,
          answers: merged,
          step: "interview",
          maxStepIndex: Math.max(d.maxStepIndex, 1),
        };
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : t("error"));
    } finally {
      setLoading(false);
    }
  };

  const fetchSkills = async () => {
    setLoading(true);
    setError("");
    try {
      const answerList: InterviewAnswer[] = questions.map((q) => ({
        questionId: q.id,
        answer: answers[q.id] || "",
      }));

      const res = await fetch("/api/suggest-skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ basics, answers: answerList, language: locale }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("error"));

      const skills: string[] = data.skills || [];
      patchDraft((d) => {
        const extras = d.selectedSkills.filter(
          (s) => !skills.some((x) => x.toLowerCase() === s.toLowerCase())
        );
        const mergedSuggested = [...skills, ...extras];
        const nextSelected =
          d.selectedSkills.length > 0
            ? d.selectedSkills.filter((s) =>
                mergedSuggested.some((x) => x.toLowerCase() === s.toLowerCase())
              )
            : skills.slice(0, 8);
        return {
          ...d,
          suggestedSkills: mergedSuggested,
          selectedSkills: nextSelected,
          step: "skills",
          maxStepIndex: Math.max(d.maxStepIndex, 2),
        };
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : t("error"));
    } finally {
      setLoading(false);
    }
  };

  const goToSkills = async () => {
    if (suggestedSkills.length > 0) {
      advanceToStep(2);
      return;
    }
    await fetchSkills();
  };

  const generateResume = async () => {
    setLoading(true);
    setError("");
    try {
      const answerList: InterviewAnswer[] = questions.map((q) => ({
        questionId: q.id,
        answer: answers[q.id] || "",
      }));

      const res = await fetch("/api/generate-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          basics,
          answers: answerList,
          selectedSkills,
          language: locale,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("error"));
      setAtsResult(null);
      setEditingResume(false);
      patchDraft((d) => ({
        ...d,
        resume: data.resume,
        step: "preview",
        maxStepIndex: Math.max(d.maxStepIndex, 4),
      }));
    } catch (e) {
      setError(e instanceof Error ? e.message : t("error"));
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => window.print();

  const updateResume = (next: ResumeData) => {
    patchDraft((d) => ({ ...d, resume: next }));
    setAtsResult(null);
  };

  const analyzeAts = async () => {
    if (!resume) return;
    setAtsLoading(true);
    setError("");
    try {
      const text = resumeToPlainText(resume);
      const res = await fetch("/api/analyze-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, language: locale }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("error"));
      setAtsResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("error"));
    } finally {
      setAtsLoading(false);
    }
  };

  const answeredCount = questions.filter((q) => answers[q.id]?.trim()).length;
  const minRequired = Math.max(5, Math.ceil(questions.length * 0.6));
  const canProceedInterview =
    questions.length > 0 && answeredCount >= minRequired;
  const canProceedBasics =
    !!basics?.fullName &&
    !!basics?.email &&
    !!basics?.targetRole &&
    !!basics &&
    hasValidExperience(basics) &&
    hasValidEducation(basics);
  const canProceedSkills = selectedSkills.length > 0;

  const canNavigateToStep = (index: number) => index <= maxStepIndex;

  if (!hydrated || !draft || !basics) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#1db4ce]" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <ConfirmDeleteModal
        open={!!deleteTargetId}
        title={t("deleteDraftTitle")}
        description={t("deleteDraftDesc")}
        confirmLabel={t("deleteDraft")}
        cancelLabel={t("cancel")}
        onConfirm={confirmDeleteDraft}
        onCancel={() => setDeleteTargetId(null)}
      />
      {showNewModal && (
        <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="w-full max-w-md shadow-xl">
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle>{t("startNewTitle")}</CardTitle>
                <CardDescription className="mt-1">{t("startNewDesc")}</CardDescription>
              </div>
              <button
                type="button"
                onClick={() => setShowNewModal(false)}
                className="rounded-lg p-1 text-[#6b7c93] hover:bg-[#f4f7fa]"
                aria-label={t("cancel")}
              >
                <X className="h-5 w-5" />
              </button>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Button variant="secondary" onClick={() => confirmStartNew(true)}>
                {t("saveAndStartNew")}
              </Button>
              <Button variant="outline" onClick={() => confirmStartNew(false)}>
                {t("discardAndStartNew")}
              </Button>
              <Button variant="ghost" onClick={() => setShowNewModal(false)}>
                {t("cancel")}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="no-print mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#002b49]/10 px-3 py-1 text-xs font-semibold text-[#002b49]">
            {t("modeDetailedBadge")}
          </div>
          <h1 className="text-3xl font-bold text-[#141f2e]">{t("builderTitle")}</h1>
          <p className="mt-2 text-[#6b7c93]">{t("builderSubtitle")}</p>
          <p className="mt-1 text-xs text-[#1db4ce]">{t("dataAutoSaved")}</p>
          <button
            type="button"
            onClick={changeMode}
            className="mt-2 text-xs text-[#1db4ce] underline-offset-2 hover:underline"
          >
            {t("changeBuilderMode")}
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setShowDraftMenu(!showDraftMenu);
              }}
            >
              <FolderOpen className="h-4 w-4" />
              {t("myResumes")}
              {store && store.drafts.length > 0 && (
                <span className="ms-1 rounded-full bg-[#002b49] px-1.5 py-0.5 text-xs text-white">
                  {store.drafts.length}
                </span>
              )}
            </Button>
            {showDraftMenu && store && (
              <div
                className="absolute end-0 z-40 mt-2 w-72 rounded-xl border border-[#e2e8f0] bg-white shadow-lg"
                onClick={(e) => e.stopPropagation()}
              >
                <p className="border-b border-[#e2e8f0] px-4 py-2 text-xs font-semibold text-[#6b7c93]">
                  {t("switchResume")}
                </p>
                <ul className="max-h-64 overflow-y-auto py-1">
                  {store.drafts.length === 0 && (
                    <li className="px-4 py-3 text-sm text-[#6b7c93]">{t("noSavedResumes")}</li>
                  )}
                  {[...store.drafts]
                    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
                    .map((d) => (
                      <li key={d.id}>
                        <div
                          className={cn(
                            "flex items-center gap-2 px-3 py-2",
                            d.id === store.activeId && "bg-[#1db4ce]/10"
                          )}
                        >
                          <button
                            type="button"
                            onClick={() => handleSwitchDraft(d.id)}
                            className="min-w-0 flex-1 text-start text-sm text-[#141f2e] hover:text-[#1db4ce]"
                          >
                            <span className="block truncate font-medium">
                              {draftDisplayName(d)}
                            </span>
                            <span className="text-xs text-[#6b7c93]">
                              {new Date(d.updatedAt).toLocaleDateString()}
                            </span>
                          </button>
                          {store.drafts.length > 1 && (
                            <button
                              type="button"
                              onClick={(e) => handleDeleteDraft(e, d.id)}
                              className="shrink-0 rounded p-1 text-[#6b7c93] hover:bg-red-50 hover:text-red-600"
                              aria-label={t("deleteDraft")}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </li>
                    ))}
                </ul>
              </div>
            )}
          </div>
          <Button variant="secondary" size="sm" onClick={handleStartNewClick}>
            <Plus className="h-4 w-4" />
            {t("startNewResume")}
          </Button>
        </div>
      </div>

      <div className="no-print mb-8 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
        {steps.map((s, i) => {
          const Icon = s.icon;
          const isActive = step === s.id;
          const isDone = i < stepIndex;
          const isClickable = canNavigateToStep(i);
          return (
            <div key={s.id} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => isClickable && goToStep(i)}
                disabled={!isClickable}
                className={cn(
                  "flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-all",
                  isActive
                    ? "bg-[#002b49] text-white shadow-md"
                    : isDone
                      ? "bg-[#1db4ce]/15 text-[#002b49] hover:bg-[#1db4ce]/25"
                      : isClickable
                        ? "bg-[#f4f7fa] text-[#6b7c93] hover:bg-[#e2e8f0]"
                        : "cursor-not-allowed bg-[#f4f7fa] text-[#6b7c93]/50",
                  isClickable && !isActive && "cursor-pointer"
                )}
              >
                {isDone && !isActive ? (
                  <Check className="h-4 w-4 text-[#1db4ce]" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">{t(s.labelKey)}</span>
              </button>
              {i < steps.length - 1 && (
                <div
                  className={cn(
                    "h-px w-4 sm:w-8",
                    i < maxStepIndex ? "bg-[#1db4ce]" : "bg-[#e2e8f0]"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      <div
        className={cn(
          "grid gap-8",
          step === "preview" || step === "template"
            ? "lg:grid-cols-2"
            : "mx-auto max-w-3xl"
        )}
      >
        <div className={cn("min-w-0 space-y-6", step === "preview" && "no-print")}>
          {step === "basics" && (
            <Card>
              <CardHeader>
                <CardTitle>{t("personalInfo")}</CardTitle>
                <CardDescription>{t("builderSubtitle")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <PhotoUpload
                  value={basics.photoDataUrl}
                  onChange={(url) => updateBasics("photoDataUrl", url)}
                  label={t("photoLabel")}
                  hint={t("photoHint")}
                  removeLabel={t("removePhoto")}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>{t("fullName")} *</Label>
                    <Input
                      value={basics.fullName}
                      onChange={(e) => updateBasics("fullName", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>{t("email")} *</Label>
                    <Input
                      type="email"
                      value={basics.email}
                      onChange={(e) => updateBasics("email", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>{t("phone")}</Label>
                    <Input
                      value={basics.phone}
                      onChange={(e) => updateBasics("phone", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>{t("location")}</Label>
                    <Input
                      value={basics.location}
                      onChange={(e) => updateBasics("location", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>{t("linkedin")}</Label>
                    <Input
                      value={basics.linkedin}
                      onChange={(e) => updateBasics("linkedin", e.target.value)}
                      placeholder="https://linkedin.com/in/username"
                    />
                  </div>
                  <div>
                    <Label>{t("github")}</Label>
                    <Input
                      value={basics.github}
                      onChange={(e) => updateBasics("github", e.target.value)}
                      placeholder="https://github.com/username"
                    />
                  </div>
                  <div>
                    <Label>{t("website")}</Label>
                    <Input
                      value={basics.website}
                      onChange={(e) => updateBasics("website", e.target.value)}
                      placeholder="https://yourportfolio.com"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>{t("targetRole")} *</Label>
                    <Input
                      value={basics.targetRole}
                      onChange={(e) => updateBasics("targetRole", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-3 border-t border-[#e2e8f0] pt-4">
                  <div>
                    <Label className="text-base">{t("workExperience")} *</Label>
                    <p className="mt-1 text-xs text-[#6b7c93]">{t("workExperienceHint")}</p>
                  </div>
                  {basics.experience.map((entry, index) => (
                    <div
                      key={entry.id}
                      className="rounded-xl border border-[#e2e8f0] bg-[#f4f7fa]/50 p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-[#002b49]">
                          {t("workExperience")} {index + 1}
                        </span>
                        {basics.experience.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeExperience(entry.id)}
                            className="text-xs text-red-600 hover:underline"
                          >
                            {t("removeExperience")}
                          </button>
                        )}
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <Label>{t("jobPosition")} *</Label>
                          <Input
                            value={entry.position}
                            onChange={(e) =>
                              updateExperience(entry.id, "position", e.target.value)
                            }
                          />
                        </div>
                        <div>
                          <Label>{t("company")} *</Label>
                          <Input
                            value={entry.company}
                            onChange={(e) =>
                              updateExperience(entry.id, "company", e.target.value)
                            }
                          />
                        </div>
                        <div>
                          <Label>{t("dateFrom")} *</Label>
                          <Input
                            type="month"
                            value={toMonthInputValue(entry.startDate)}
                            onChange={(e) =>
                              updateExperience(entry.id, "startDate", e.target.value)
                            }
                            max={
                              entry.endDate && !entry.current
                                ? toMonthInputValue(entry.endDate) || undefined
                                : undefined
                            }
                          />
                        </div>
                        <div>
                          <Label>{t("dateTo")}{entry.current ? "" : " *"}</Label>
                          <Input
                            type="month"
                            value={toMonthInputValue(entry.endDate)}
                            onChange={(e) =>
                              updateExperience(entry.id, "endDate", e.target.value)
                            }
                            min={toMonthInputValue(entry.startDate) || undefined}
                            disabled={entry.current}
                          />
                        </div>
                      </div>
                      <label className="flex items-center gap-2 text-sm text-[#141f2e]">
                        <input
                          type="checkbox"
                          checked={!!entry.current}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            patchDraft((d) => ({
                              ...d,
                              basics: normalizeBasics({
                                ...d.basics,
                                experience: d.basics.experience.map((exp) =>
                                  exp.id === entry.id
                                    ? {
                                        ...exp,
                                        current: checked,
                                        endDate: checked ? "" : exp.endDate,
                                      }
                                    : exp
                                ),
                              }),
                            }));
                          }}
                          className="rounded border-[#e2e8f0]"
                        />
                        {t("currentlyWorking")}
                      </label>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={addExperience}>
                    <Plus className="h-4 w-4" />
                    {t("addExperience")}
                  </Button>
                </div>

                <div className="space-y-3 border-t border-[#e2e8f0] pt-4">
                  <div>
                    <Label className="text-base">{t("education")} *</Label>
                    <p className="mt-1 text-xs text-[#6b7c93]">{t("educationHint")}</p>
                  </div>
                  {basics.education.map((entry, index) => (
                    <div
                      key={entry.id}
                      className="space-y-3 rounded-xl border border-[#e2e8f0] bg-[#f4f7fa]/50 p-4"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-[#002b49]">
                          {t("education")} {index + 1}
                        </span>
                        {basics.education.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeEducation(entry.id)}
                            className="text-xs text-red-600 hover:underline"
                          >
                            {t("removeEducation")}
                          </button>
                        )}
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <Label>{t("educationDegree")} *</Label>
                          <Input
                            value={entry.degree}
                            onChange={(e) =>
                              updateEducation(entry.id, "degree", e.target.value)
                            }
                          />
                        </div>
                        <div>
                          <Label>{t("educationInstitution")} *</Label>
                          <Input
                            value={entry.institution}
                            onChange={(e) =>
                              updateEducation(entry.id, "institution", e.target.value)
                            }
                          />
                        </div>
                        <div>
                          <Label>{t("educationGraduation")} *</Label>
                          <Input
                            type="month"
                            value={toMonthInputValue(entry.graduationDate)}
                            onChange={(e) =>
                              updateEducation(entry.id, "graduationDate", e.target.value)
                            }
                          />
                        </div>
                        <div>
                          <Label>{t("educationGpa")}</Label>
                          <Input
                            value={entry.gpa || ""}
                            onChange={(e) =>
                              updateEducation(entry.id, "gpa", e.target.value)
                            }
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={addEducation}>
                    <Plus className="h-4 w-4" />
                    {t("addEducation")}
                  </Button>
                </div>

                <div className="space-y-3 border-t border-[#e2e8f0] pt-4">
                  <div>
                    <Label className="text-base">{t("languages")}</Label>
                    <p className="mt-1 text-xs text-[#6b7c93]">{t("languagesHint")}</p>
                  </div>
                  {basics.languages.map((entry) => (
                    <div
                      key={entry.id}
                      className="grid gap-3 rounded-xl border border-[#e2e8f0] bg-[#f4f7fa]/50 p-4 sm:grid-cols-[1fr_1fr_auto]"
                    >
                      <div>
                        <Label>{t("languageName")}</Label>
                        <Input
                          value={entry.language}
                          onChange={(e) =>
                            updateLanguage(entry.id, "language", e.target.value)
                          }
                        />
                      </div>
                      <div>
                        <Label>{t("languageProficiency")}</Label>
                        <select
                          value={entry.proficiency}
                          onChange={(e) =>
                            updateLanguage(entry.id, "proficiency", e.target.value)
                          }
                          className="flex h-11 w-full rounded-xl border border-[#e2e8f0] bg-white px-4 text-sm text-[#141f2e] focus:border-[#1db4ce] focus:outline-none focus:ring-2 focus:ring-[#1db4ce]/20"
                        >
                          {LANGUAGE_PROFICIENCIES.map((p) => (
                            <option key={p} value={p}>
                              {p}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeLanguage(entry.id)}
                        >
                          {t("removeLanguage")}
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={addLanguage}>
                    <Plus className="h-4 w-4" />
                    {t("addLanguage")}
                  </Button>
                </div>

                <div className="space-y-3 border-t border-[#e2e8f0] pt-4">
                  <div>
                    <Label className="text-base">{t("certifications")}</Label>
                    <p className="mt-1 text-xs text-[#6b7c93]">{t("certificatesHint")}</p>
                  </div>
                  {basics.certificates.map((entry, index) => (
                    <div
                      key={entry.id}
                      className="space-y-3 rounded-xl border border-[#e2e8f0] bg-[#f4f7fa]/50 p-4"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-[#002b49]">
                          {t("certifications")} {index + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeCertificate(entry.id)}
                          className="text-xs text-red-600 hover:underline"
                        >
                          {t("removeExperience")}
                        </button>
                      </div>
                      <div>
                        <Label>{t("certificateName")}</Label>
                        <Input
                          value={entry.name}
                          onChange={(e) =>
                            updateCertificate(entry.id, "name", e.target.value)
                          }
                        />
                      </div>
                      <div>
                        <Label>{t("certificateUpload")}</Label>
                        <p className="mb-2 text-xs text-[#6b7c93]">
                          {t("certificateFileTypes")}
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[#e2e8f0] bg-white px-3 py-2 text-sm text-[#141f2e] hover:border-[#1db4ce]">
                            <input
                              type="file"
                              accept={CERT_ACCEPT}
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0] || null;
                                void handleCertificateFile(entry.id, file);
                                e.target.value = "";
                              }}
                            />
                            {entry.fileName ? t("certificateReplace") : t("certificateUpload")}
                          </label>
                          {entry.fileName && (
                            <>
                              <span className="truncate text-xs text-[#6b7c93]">
                                {entry.fileName}
                              </span>
                              {entry.fileDataUrl && (
                                <a
                                  href={entry.fileDataUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-[#1db4ce] underline"
                                >
                                  {t("preview")}
                                </a>
                              )}
                              <button
                                type="button"
                                onClick={() => clearCertificateFile(entry.id)}
                                className="text-xs text-red-600 hover:underline"
                              >
                                {t("certificateRemoveFile")}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={addCertificate}>
                    <Plus className="h-4 w-4" />
                    {t("addCertificate")}
                  </Button>
                </div>

                <div>
                  <Label>{t("careerBackground")}</Label>
                  <Textarea
                    value={basics.careerBackground}
                    onChange={(e) => updateBasics("careerBackground", e.target.value)}
                    placeholder={t("careerBackgroundPlaceholder")}
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {step === "interview" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-[#1db4ce]" />
                  {t("aiInterviewTitle")}
                </CardTitle>
                <CardDescription>
                  {t("aiInterviewSubtitle")}{" "}
                  <span className="font-medium text-[#002b49]">
                    ({answeredCount}/{questions.length} —{" "}
                    {t("interviewProgress")
                      .replace("{min}", String(minRequired))
                      .replace("{total}", String(questions.length))}
                    )
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {questions.map((q, i) => (
                  <div
                    key={q.id}
                    className="rounded-xl border border-[#e2e8f0] bg-[#f4f7fa]/50 p-4"
                  >
                    <p className="mb-2 text-sm font-semibold text-[#002b49]">
                      {i + 1}. {q.question}
                    </p>
                    <Textarea
                      value={answers[q.id] || ""}
                      onChange={(e) =>
                        setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                      }
                      placeholder={q.placeholder || t("answerPlaceholder")}
                      rows={3}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {step === "skills" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-[#1db4ce]" />
                  {t("skillsSelectTitle")}
                </CardTitle>
                <CardDescription>{t("skillsSelectSubtitle")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <p className="mb-2 text-sm font-medium text-[#002b49]">
                    {t("skillsSuggested")}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {suggestedSkills.map((skill) => {
                      const selected = selectedSkills.includes(skill);
                      return (
                        <button
                          key={skill}
                          type="button"
                          onClick={() => toggleSkill(skill)}
                          className={cn(
                            "rounded-lg border px-3 py-1.5 text-sm transition-all",
                            selected
                              ? "border-[#002b49] bg-[#002b49] text-white"
                              : "border-[#e2e8f0] bg-white text-[#141f2e] hover:border-[#1db4ce]"
                          )}
                        >
                          {selected && <Check className="me-1 inline h-3.5 w-3.5" />}
                          {skill}
                        </button>
                      );
                    })}
                    {suggestedSkills.length === 0 && (
                      <p className="text-sm text-[#6b7c93]">{t("skillsEmptyHint")}</p>
                    )}
                  </div>
                </div>

                {selectedSkills.length > 0 && (
                  <div>
                    <p className="mb-2 text-sm font-medium text-[#002b49]">
                      {t("skillsSelected")} ({selectedSkills.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedSkills.map((skill) => (
                        <span
                          key={skill}
                          className="inline-flex items-center gap-1 rounded-lg bg-[#1db4ce]/15 px-2.5 py-1 text-sm text-[#002b49]"
                        >
                          {skill}
                          <button
                            type="button"
                            onClick={() => toggleSkill(skill)}
                            className="rounded p-0.5 hover:bg-[#1db4ce]/25"
                            aria-label={t("removeExperience")}
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <Label>{t("skillsAddCustom")}</Label>
                  <div className="mt-1 flex gap-2">
                    <Input
                      value={customSkill}
                      onChange={(e) => setCustomSkill(e.target.value)}
                      placeholder={t("skillsAddCustomPlaceholder")}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addCustomSkill();
                        }
                      }}
                    />
                    <Button type="button" variant="outline" onClick={addCustomSkill}>
                      <Plus className="h-4 w-4" />
                      {t("skillsAddBtn")}
                    </Button>
                  </div>
                </div>

                {selectedSkills.length === 0 && (
                  <p className="text-sm text-amber-700">{t("skillsEmptyHint")}</p>
                )}

                {suggestedSkills.length > 0 && (
                  <button
                    type="button"
                    onClick={fetchSkills}
                    disabled={loading}
                    className="text-xs text-[#6b7c93] underline-offset-2 hover:text-[#1db4ce] hover:underline"
                  >
                    {t("regenerate")} {t("stepSkills").toLowerCase()}
                  </button>
                )}
              </CardContent>
            </Card>
          )}

          {step === "template" && (
            <Card>
              <CardHeader>
                <CardTitle>{t("chooseTemplate")}</CardTitle>
              </CardHeader>
              <CardContent>
                <TemplatePicker template={template} onSelect={setTemplate} t={t} />
              </CardContent>
            </Card>
          )}

          {step === "preview" && !editingResume && (
            <Card>
              <CardHeader>
                <CardTitle>{t("changeTemplate")}</CardTitle>
                <CardDescription>{t("chooseTemplate")}</CardDescription>
              </CardHeader>
              <CardContent>
                <TemplatePicker template={template} onSelect={setTemplate} t={t} />
              </CardContent>
            </Card>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          {step !== "preview" && (
          <div className="flex gap-3">
            {step !== "basics" && (
              <Button variant="outline" onClick={() => goToStep(stepIndex - 1)}>
                <ChevronBack className="h-4 w-4" />
                {t("previousStep")}
              </Button>
            )}

            {step === "basics" && (
              <div className="flex flex-1 flex-col gap-2">
                <Button
                  onClick={() =>
                    questions.length > 0 ? advanceToStep(1) : fetchQuestions()
                  }
                  disabled={loading || !canProceedBasics}
                  className="w-full"
                  size="lg"
                  variant="secondary"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      {t("loadingQuestions")}
                    </>
                  ) : questions.length > 0 ? (
                    <>
                      {t("nextStep")}
                      <Chevron className="h-5 w-5" />
                    </>
                  ) : (
                    <>
                      {t("getAIQuestions")}
                      <Chevron className="h-5 w-5" />
                    </>
                  )}
                </Button>
                {questions.length > 0 && (
                  <button
                    type="button"
                    onClick={fetchQuestions}
                    disabled={loading}
                    className="text-center text-xs text-[#6b7c93] underline-offset-2 hover:text-[#1db4ce] hover:underline"
                  >
                    {t("regenerate")} {t("stepInterview").toLowerCase()}
                  </button>
                )}
              </div>
            )}

            {step === "interview" && (
              <Button
                onClick={goToSkills}
                disabled={!canProceedInterview || loading}
                className="flex-1"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    {t("loadingSkills")}
                  </>
                ) : (
                  <>
                    {t("nextStep")}
                    <Chevron className="h-5 w-5" />
                  </>
                )}
              </Button>
            )}

            {step === "skills" && (
              <Button
                onClick={() => advanceToStep(3)}
                disabled={!canProceedSkills}
                className="flex-1"
                size="lg"
              >
                {t("nextStep")}
                <Chevron className="h-5 w-5" />
              </Button>
            )}

            {step === "template" && (
              <Button
                onClick={generateResume}
                disabled={loading}
                className="flex-1"
                size="lg"
                variant="secondary"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    {t("generating")}
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5" />
                    {t("generateResume")}
                  </>
                )}
              </Button>
            )}
          </div>
          )}

          {step === "preview" && (
            <div className="no-print space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Button
                  onClick={generateResume}
                  disabled={loading}
                  variant="secondary"
                  className="w-full"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      {t("generating")}
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-5 w-5" />
                      {t("regenerate")}
                    </>
                  )}
                </Button>
                {resume && (
                  <Button
                    onClick={analyzeAts}
                    disabled={atsLoading}
                    variant="outline"
                    className="w-full"
                    size="lg"
                  >
                    {atsLoading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        {t("atsAnalyzing")}
                      </>
                    ) : (
                      <>
                        <TrendingUp className="h-5 w-5" />
                        {t("generateAtsScore")}
                      </>
                    )}
                  </Button>
                )}
              </div>

              {editingResume && resume && (
                <ResumeEditor data={resume} onChange={updateResume} />
              )}

              {atsResult && <AtsAnalysisResults result={atsResult} compact />}
            </div>
          )}
        </div>

        {(step === "preview" || step === "template") && (
          <div className="min-w-0 lg:sticky lg:top-24 lg:self-start">
            <Card className="border-0 shadow-none lg:border lg:shadow-sm">
              <CardHeader className="no-print flex flex-row flex-wrap items-center justify-between gap-2">
                <div>
                  <CardTitle>{t("preview")}</CardTitle>
                  {step === "template" && !resume && (
                    <CardDescription className="mt-1">
                      {t("templatePreviewHint")}
                    </CardDescription>
                  )}
                </div>
                {resume && step === "preview" && (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingResume((v) => !v)}
                    >
                      <Pencil className="h-4 w-4" />
                      {editingResume ? t("doneEditing") : t("editResume")}
                    </Button>
                    <Button variant="outline" size="sm" onClick={handlePrint}>
                      <Printer className="h-4 w-4" />
                      {t("print")}
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent className="p-0 lg:p-6">
                <div
                  id={resume ? "resume-print-area" : undefined}
                  className="max-h-[80vh] overflow-auto rounded-xl border border-[#e2e8f0] print:max-h-none print:overflow-visible lg:border"
                >
                  <ResumePreview
                    data={
                      resume ??
                      buildTemplatePreviewResume(basics, selectedSkills, locale)
                    }
                    template={template}
                    locale={locale}
                  />
                </div>
                {resume && step === "preview" && (
                  <p className="no-print mt-3 text-xs text-[#6b7c93]">{t("downloadHint")}</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
