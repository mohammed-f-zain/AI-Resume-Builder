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
  Zap,
  Pencil,
  TrendingUp,
} from "lucide-react";
import { useLocale } from "@/contexts/LocaleContext";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Input";
import { ResumePreview } from "@/components/resume/ResumePreview";
import { ResumeEditor } from "@/components/resume/ResumeEditor";
import { PhotoUpload } from "@/components/resume/PhotoUpload";
import { AtsAnalysisResults } from "@/components/analyzer/AtsAnalysisResults";
import { GuidedQuestionEditor } from "@/components/resume/GuidedQuestionEditor";
import type {
  TemplateId,
  ResumeBasics,
  ResumeData,
  GuidedQuestion,
  GuidedAnswer,
  LanguageEntry,
  ATSAnalysis,
} from "@/lib/types";
import {
  type DraftStore,
  type ResumeDraft,
  LANGUAGE_PROFICIENCIES,
  languageProficiencyLabel,
  createEmptyLanguage,
  deleteDraft,
  draftDisplayName,
  draftHasContent,
  extractFromGuidedAnswers,
  getActiveDraft,
  guidedAnswersToInterviewAnswers,
  hasValidGuidedBasics,
  isValidInternationalPhone,
  loadDraftStore,
  migrateLegacyDraft,
  normalizeBasics,
  normalizeDraftStore,
  saveDraftStore,
  startNewDraft,
  switchActiveDraft,
  upsertDraft,
} from "@/lib/resume-drafts";
import { ConfirmDeleteModal } from "@/components/ui/ConfirmDeleteModal";
import {
  emptyGuidedAnswer,
  isGuidedAnswerComplete,
} from "@/lib/guided-answers";
import { buildTemplatePreviewResume } from "@/lib/template-preview";
import { polishResumeWithAts, type PolishPhase } from "@/lib/polish-resume";
import { resumeToPlainText } from "@/lib/resume-to-text";
import { printResume } from "@/lib/print-resume";
import { cn } from "@/lib/utils";

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

type GuidedStep = "basics" | "interview" | "template" | "preview";

const guidedSteps: {
  id: GuidedStep;
  labelKey: "stepBasics" | "stepInterview" | "stepTemplate" | "stepPreview";
  icon: typeof User;
}[] = [
  { id: "basics", labelKey: "stepBasics", icon: User },
  { id: "interview", labelKey: "stepInterview", icon: MessageSquare },
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

export function GuidedResumeBuilder({
  onModeCleared,
}: {
  onModeCleared?: () => void;
}) {
  const { t, locale, dir } = useLocale();
  const [store, setStore] = useState<DraftStore | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState<PolishPhase>("generating");
  const [error, setError] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [showDraftMenu, setShowDraftMenu] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [fetchingQuestion, setFetchingQuestion] = useState(false);
  const [editingResume, setEditingResume] = useState(false);
  const [resumeBackup, setResumeBackup] = useState<ResumeData | null>(null);
  const [atsLoading, setAtsLoading] = useState(false);
  const [atsResult, setAtsResult] = useState<ATSAnalysis | null>(null);

  const draft = store ? getActiveDraft(store) : null;
  const stepRaw = draft?.step ?? "basics";
  const activeStep: GuidedStep =
    stepRaw === "template" || stepRaw === "preview" || stepRaw === "interview" || stepRaw === "basics"
      ? stepRaw
      : "basics";
  const maxStepIndex = draft?.maxStepIndex ?? 0;
  const basics = draft?.basics;
  const guidedQuestions = draft?.guidedQuestions ?? [];
  const guidedAnswers = draft?.guidedAnswers ?? {};
  const qIndex = draft?.guidedQuestionIndex ?? 0;
  const template = draft?.template ?? "modern";
  const resume = draft?.resume ?? null;
  const selectedSkills = draft?.selectedSkills ?? [];

  const stepIndex = guidedSteps.findIndex((s) => s.id === activeStep);
  const Chevron = dir === "rtl" ? ChevronLeft : ChevronRight;
  const ChevronBack = dir === "rtl" ? ChevronRight : ChevronLeft;
  const currentQuestion: GuidedQuestion | undefined = guidedQuestions[qIndex];
  const currentAnswer: GuidedAnswer =
    (currentQuestion && guidedAnswers[currentQuestion.id]) || emptyGuidedAnswer();

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

  const goToStep = (targetIndex: number) => {
    if (targetIndex <= maxStepIndex) {
      patchDraft((d) => ({ ...d, step: guidedSteps[targetIndex].id }));
      setError("");
    }
  };

  const advanceToStep = (targetIndex: number) => {
    patchDraft((d) => ({
      ...d,
      step: guidedSteps[targetIndex].id,
      maxStepIndex: Math.max(d.maxStepIndex, targetIndex),
    }));
    setError("");
  };

  const updateBasics = (
    field: keyof Omit<ResumeBasics, "experience" | "education" | "languages" | "certificates">,
    value: string
  ) => {
    patchDraft((d) => ({
      ...d,
      basics: normalizeBasics({ ...d.basics, [field]: value }),
    }));
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

  const setTemplate = (id: TemplateId) => {
    patchDraft((d) => ({ ...d, template: id }));
  };

  const setGuidedAnswer = (questionId: string, answer: GuidedAnswer) => {
    patchDraft((d) => ({
      ...d,
      guidedAnswers: { ...d.guidedAnswers, [questionId]: answer },
    }));
  };

  const fetchNextQuestion = async (
    askedQuestions: GuidedQuestion[],
    answers: Record<string, GuidedAnswer>,
    options?: { enterInterview?: boolean }
  ) => {
    setFetchingQuestion(true);
    setError("");
    try {
      const res = await fetch("/api/guided-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          basics,
          language: locale,
          askedQuestions,
          answers,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("error"));

      if (data.done) {
        const extracted = extractFromGuidedAnswers(askedQuestions, answers);
        patchDraft((d) => ({
          ...d,
          basics: normalizeBasics({
            ...d.basics,
            experience: extracted.experience.some(
              (e) => e.position.trim() || e.company.trim()
            )
              ? extracted.experience
              : d.basics.experience,
            education: extracted.education.length
              ? extracted.education
              : d.basics.education,
            references: extracted.references.length
              ? extracted.references
              : d.basics.references,
          }),
          selectedSkills: extracted.selectedSkills.length
            ? extracted.selectedSkills
            : d.selectedSkills,
          selectedCompetencies: extracted.selectedCompetencies.length
            ? extracted.selectedCompetencies
            : d.selectedCompetencies,
          step: "template",
          maxStepIndex: Math.max(d.maxStepIndex, 2),
          guidedQuestionIndex: Math.max(0, askedQuestions.length - 1),
        }));
        return;
      }

      const nextQ: GuidedQuestion = {
        ...data.question,
        allowOther: true,
      };

      patchDraft((d) => {
        const questions = [...askedQuestions, nextQ];
        return {
          ...d,
          guidedQuestions: questions,
          guidedQuestionIndex: questions.length - 1,
          ...(options?.enterInterview
            ? {
                step: "interview" as const,
                maxStepIndex: Math.max(d.maxStepIndex, 1),
              }
            : {}),
        };
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : t("error"));
    } finally {
      setFetchingQuestion(false);
    }
  };

  const startGuidedInterview = async () => {
    setLoading(true);
    setError("");
    try {
      patchDraft((d) => ({
        ...d,
        guidedQuestions: [],
        guidedAnswers: {},
        guidedQuestionIndex: 0,
      }));
      await fetchNextQuestion([], {}, { enterInterview: true });
    } finally {
      setLoading(false);
    }
  };

  const goNextQuestion = async () => {
    if (!currentQuestion) return;
    if (!isGuidedAnswerComplete(currentQuestion, currentAnswer)) {
      setError(t("guidedAnswerRequired"));
      return;
    }
    setError("");

    // Persist current answer first
    const nextAnswers = {
      ...guidedAnswers,
      [currentQuestion.id]: currentAnswer,
    };
    patchDraft((d) => ({
      ...d,
      guidedAnswers: nextAnswers,
    }));

    // If user went back and is not on the last asked question, just advance locally
    if (qIndex < guidedQuestions.length - 1) {
      patchDraft((d) => ({ ...d, guidedQuestionIndex: qIndex + 1 }));
      return;
    }

    await fetchNextQuestion(guidedQuestions, nextAnswers);
  };

  const goPrevQuestion = () => {
    setError("");
    if (qIndex > 0) {
      patchDraft((d) => ({ ...d, guidedQuestionIndex: qIndex - 1 }));
    } else {
      goToStep(0);
    }
  };

  /** Interview finished when template step is unlocked (maxStepIndex >= 2). */
  const interviewComplete =
    maxStepIndex >= 2 && guidedQuestions.length > 0;

  const continueFromInterviewReview = () => {
    for (const q of guidedQuestions) {
      if (!isGuidedAnswerComplete(q, guidedAnswers[q.id])) {
        setError(t("guidedAnswerRequired"));
        return;
      }
    }
    setError("");
    const extracted = extractFromGuidedAnswers(guidedQuestions, guidedAnswers);
    patchDraft((d) => ({
      ...d,
      basics: normalizeBasics({
        ...d.basics,
        experience: extracted.experience.some(
          (e) => e.position.trim() || e.company.trim()
        )
          ? extracted.experience
          : d.basics.experience,
        education: extracted.education.length
          ? extracted.education
          : d.basics.education,
        references: extracted.references.length
          ? extracted.references
          : d.basics.references,
      }),
      selectedSkills: extracted.selectedSkills.length
        ? extracted.selectedSkills
        : d.selectedSkills,
      selectedCompetencies: extracted.selectedCompetencies.length
        ? extracted.selectedCompetencies
        : d.selectedCompetencies,
      step: "template",
      maxStepIndex: Math.max(d.maxStepIndex, 2),
    }));
  };

  const generateResume = async () => {
    if (!basics) return;
    setLoading(true);
    setLoadingPhase("generating");
    setError("");
    try {
      const extracted = extractFromGuidedAnswers(guidedQuestions, guidedAnswers);
      const mergedBasics = normalizeBasics({
        ...basics,
        experience: extracted.experience.some(
          (e) => e.position.trim() || e.company.trim()
        )
          ? extracted.experience
          : basics.experience,
        education: extracted.education.length
          ? extracted.education
          : basics.education,
        references: extracted.references.length
          ? extracted.references
          : basics.references,
      });
      const skills =
        extracted.selectedSkills.length > 0
          ? extracted.selectedSkills
          : selectedSkills;
      const competencies =
        extracted.selectedCompetencies.length > 0
          ? extracted.selectedCompetencies
          : draft?.selectedCompetencies ?? [];
      const answerList = guidedAnswersToInterviewAnswers(
        guidedQuestions,
        guidedAnswers
      );

      const includeProjects = guidedQuestions.some(
        (q) =>
          q.category === "projects" || q.topic === "projects_or_portfolio"
      );

      const res = await fetch("/api/generate-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          basics: mergedBasics,
          answers: answerList,
          selectedSkills: skills,
          selectedCompetencies: competencies,
          language: locale,
          includeProjects,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("error"));

      let finalResume = data.resume as ResumeData;
      let analysis: ATSAnalysis | null = null;
      try {
        const polished = await polishResumeWithAts(
          data.resume,
          locale,
          setLoadingPhase
        );
        finalResume = polished.resume;
        analysis = polished.analysis;
      } catch {
        // Still show the generated CV if ATS polish fails
      }

      setAtsResult(analysis);
      setEditingResume(false);
      setResumeBackup(null);
      patchDraft((d) => ({
        ...d,
        basics: mergedBasics,
        selectedSkills: skills,
        selectedCompetencies: competencies,
        resume: finalResume,
        step: "preview",
        maxStepIndex: Math.max(d.maxStepIndex, 3),
      }));
    } catch (e) {
      setError(e instanceof Error ? e.message : t("error"));
    } finally {
      setLoading(false);
      setLoadingPhase("generating");
    }
  };

  const handlePrint = () =>
    printResume(resume?.contact?.fullName || basics?.fullName);

  const updateResume = (next: ResumeData) => {
    patchDraft((d) => ({ ...d, resume: next }));
    setAtsResult(null);
  };

  const startEditingResume = () => {
    if (!resume) return;
    setResumeBackup(structuredClone(resume));
    setEditingResume(true);
  };

  const doneEditingResume = () => {
    setResumeBackup(null);
    setEditingResume(false);
  };

  const cancelEditingResume = () => {
    if (resumeBackup) {
      updateResume(resumeBackup);
    }
    setResumeBackup(null);
    setEditingResume(false);
  };

  const analyzeAts = async () => {
    if (!resume) return;
    setAtsLoading(true);
    setError("");
    try {
      const text = resumeToPlainText(resume, locale);
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

  const handleSwitchDraft = (id: string) => {
    if (!store) return;
    const next = switchActiveDraft(store, id);
    saveDraftStore(next);
    setStore(next);
    setShowDraftMenu(false);
    setError("");
    const switched = getActiveDraft(next);
    if (switched.mode !== "guided") {
      queueMicrotask(() => onModeCleared?.());
    }
  };

  const handleDeleteDraft = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDraftMenu(false);
    window.setTimeout(() => setDeleteTargetId(id), 0);
  };

  const confirmDeleteDraft = () => {
    if (!store || !deleteTargetId) return;
    const next = deleteDraft(store, deleteTargetId);
    saveDraftStore(next);
    setStore(next);
    setDeleteTargetId(null);
    const switched = getActiveDraft(next);
    if (switched.mode !== "guided") {
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
      selectedCompetencies: [],
      suggestedCompetencies: [],
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

  const canProceedBasics = !!basics && hasValidGuidedBasics(basics);
  const yesLabel = locale === "ar" ? "نعم" : "Yes";
  const noLabel = locale === "ar" ? "لا" : "No";

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
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#1db4ce]/15 px-3 py-1 text-xs font-semibold text-[#002b49]">
            <Zap className="h-3.5 w-3.5" />
            {t("modeGuidedBadge")}
          </div>
          <h1 className="text-3xl font-bold text-[#141f2e]">{t("builderTitle")}</h1>
          <p className="mt-2 text-[#6b7c93]">{t("guidedSubtitle")}</p>
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
                            className="min-w-0 flex-1 text-start text-sm"
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
                              className="rounded p-1 text-[#6b7c93] hover:bg-red-50 hover:text-red-600"
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
        {guidedSteps.map((s, i) => {
          const Icon = s.icon;
          const isActive = activeStep === s.id;
          const isDone = i < stepIndex;
          const isClickable = i <= maxStepIndex;
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
                      ? "bg-[#1db4ce]/15 text-[#002b49]"
                      : "bg-[#f4f7fa] text-[#6b7c93]",
                  !isClickable && "cursor-not-allowed opacity-50"
                )}
              >
                {isDone && !isActive ? (
                  <Check className="h-4 w-4 text-[#1db4ce]" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">{t(s.labelKey)}</span>
              </button>
              {i < guidedSteps.length - 1 && (
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
          activeStep === "preview" || activeStep === "template"
            ? "lg:grid-cols-2"
            : "mx-auto max-w-3xl"
        )}
      >
        <div className={cn("min-w-0 space-y-6", activeStep === "preview" && "no-print")}>
          {activeStep === "basics" && (
            <Card>
              <CardHeader>
                <CardTitle>{t("personalInfo")}</CardTitle>
                <CardDescription>{t("guidedBasicsHint")}</CardDescription>
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
                    <Label>{t("phone")} *</Label>
                    <Input
                      value={basics.phone}
                      onChange={(e) => updateBasics("phone", e.target.value)}
                      placeholder="+974..."
                    />
                    <p className="mt-1 text-xs text-[#6b7c93]">{t("phoneHint")}</p>
                    {basics.phone.trim() &&
                      !isValidInternationalPhone(basics.phone) && (
                        <p className="mt-1 text-xs text-red-600">
                          {t("phoneInvalid")}
                        </p>
                      )}
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
                    />
                  </div>
                  <div>
                    <Label>{t("github")}</Label>
                    <Input
                      value={basics.github}
                      onChange={(e) => updateBasics("github", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>{t("website")}</Label>
                    <Input
                      value={basics.website}
                      onChange={(e) => updateBasics("website", e.target.value)}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>{t("targetRole")} *</Label>
                    <Input
                      value={basics.targetRole}
                      onChange={(e) => updateBasics("targetRole", e.target.value)}
                      placeholder={t("guidedJobPlaceholder")}
                    />
                  </div>
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
                          className="flex h-11 w-full rounded-xl border border-[#e2e8f0] bg-white px-4 text-sm"
                        >
                          {LANGUAGE_PROFICIENCIES.map((p) => (
                            <option key={p} value={p}>
                              {languageProficiencyLabel(p, locale)}
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
              </CardContent>
            </Card>
          )}

          {activeStep === "interview" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-[#1db4ce]" />
                  {interviewComplete
                    ? t("guidedReviewTitle")
                    : t("guidedQuestionTitle")}
                </CardTitle>
                {!fetchingQuestion && (
                  <CardDescription>
                    {interviewComplete
                      ? t("guidedReviewHint")
                      : t("guidedQuestionProgress").replace(
                          "{current}",
                          String(qIndex + 1)
                        )}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-5">
                {fetchingQuestion || (!interviewComplete && !currentQuestion) ? (
                  <div className="flex min-h-[160px] items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-[#1db4ce]" />
                  </div>
                ) : interviewComplete ? (
                  <div className="space-y-6">
                    {guidedQuestions.map((q, i) => (
                      <div
                        key={q.id}
                        className="rounded-xl border border-[#e2e8f0] bg-[#f4f7fa]/40 p-4"
                      >
                        <GuidedQuestionEditor
                          question={q}
                          answer={guidedAnswers[q.id] || emptyGuidedAnswer()}
                          onChange={(next) => setGuidedAnswer(q.id, next)}
                          yesLabel={yesLabel}
                          noLabel={noLabel}
                          t={t}
                          indexLabel={`${i + 1}.`}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <GuidedQuestionEditor
                    question={currentQuestion!}
                    answer={currentAnswer}
                    onChange={(next) =>
                      setGuidedAnswer(currentQuestion!.id, next)
                    }
                    yesLabel={yesLabel}
                    noLabel={noLabel}
                    t={t}
                  />
                )}
              </CardContent>
            </Card>
          )}

          {activeStep === "template" && (
            <Card>
              <CardHeader>
                <CardTitle>{t("chooseTemplate")}</CardTitle>
              </CardHeader>
              <CardContent>
                <TemplatePicker template={template} onSelect={setTemplate} t={t} />
              </CardContent>
            </Card>
          )}

          {activeStep === "preview" && !editingResume && (
            <Card>
              <CardHeader>
                <CardTitle>{t("changeTemplate")}</CardTitle>
              </CardHeader>
              <CardContent>
                <TemplatePicker template={template} onSelect={setTemplate} t={t} />
              </CardContent>
            </Card>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          {activeStep !== "preview" && (
          <div className="flex gap-3">
            {activeStep === "basics" && (
              <Button
                onClick={() =>
                  guidedQuestions.length > 0 ? advanceToStep(1) : startGuidedInterview()
                }
                disabled={loading || fetchingQuestion || !canProceedBasics}
                className="flex-1"
                size="lg"
                variant="secondary"
              >
                {loading || fetchingQuestion ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    {t("loadingQuestions")}
                  </>
                ) : (
                  <>
                    {t("getAIQuestions")}
                    <Chevron className="h-5 w-5" />
                  </>
                )}
              </Button>
            )}

            {activeStep === "interview" && (
              <>
                <Button
                  variant="outline"
                  onClick={() =>
                    interviewComplete ? goToStep(0) : goPrevQuestion()
                  }
                  disabled={fetchingQuestion}
                >
                  <ChevronBack className="h-4 w-4" />
                  {t("previousStep")}
                </Button>
                {interviewComplete ? (
                  <Button
                    className="flex-1"
                    size="lg"
                    onClick={continueFromInterviewReview}
                  >
                    {t("guidedReviewContinue")}
                    <Chevron className="h-5 w-5" />
                  </Button>
                ) : (
                  <Button
                    className="flex-1"
                    size="lg"
                    onClick={() => void goNextQuestion()}
                    disabled={fetchingQuestion || !currentQuestion}
                  >
                    {fetchingQuestion ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        {t("loadingQuestions")}
                      </>
                    ) : (
                      <>
                        {t("nextStep")}
                        <Chevron className="h-5 w-5" />
                      </>
                    )}
                  </Button>
                )}
              </>
            )}

            {activeStep === "template" && (
              <>
                <Button variant="outline" onClick={() => goToStep(1)}>
                  <ChevronBack className="h-4 w-4" />
                  {t("previousStep")}
                </Button>
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
                      {loadingPhase === "polishing"
                        ? t("polishingResume")
                        : t("generating")}
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5" />
                      {t("generateResume")}
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
          )}

          {activeStep === "preview" && (
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
                      {loadingPhase === "polishing"
                        ? t("polishingResume")
                        : t("generating")}
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
                <ResumeEditor
                  data={resume}
                  onChange={updateResume}
                />
              )}

              {atsResult && <AtsAnalysisResults result={atsResult} compact />}
            </div>
          )}
        </div>

        {(activeStep === "preview" || activeStep === "template") && (
          <div className="min-w-0 lg:sticky lg:top-24 lg:self-start">
            <Card className="border-0 shadow-none lg:border lg:shadow-sm">
              <CardHeader className="no-print flex flex-row flex-wrap items-center justify-between gap-2">
                <CardTitle>{t("preview")}</CardTitle>
                {resume && activeStep === "preview" && (
                  <div className="flex flex-wrap gap-2">
                    {!editingResume ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={startEditingResume}
                      >
                        <Pencil className="h-4 w-4" />
                        {t("editResume")}
                      </Button>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={cancelEditingResume}
                        >
                          {t("cancelEdit")}
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={doneEditingResume}
                        >
                          {t("doneEditing")}
                        </Button>
                      </>
                    )}
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
                  className="max-h-[80vh] overflow-auto rounded-xl border border-[#e2e8f0] lg:border"
                >
                  <ResumePreview
                    data={
                      resume ??
                      buildTemplatePreviewResume(
                        basics,
                        selectedSkills,
                        locale,
                        draft?.selectedCompetencies ?? []
                      )
                    }
                    template={template}
                    locale={locale}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
