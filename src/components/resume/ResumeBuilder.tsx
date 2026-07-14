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
} from "lucide-react";
import { useLocale } from "@/contexts/LocaleContext";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input, Label, Textarea } from "@/components/ui/Input";
import { ResumePreview } from "@/components/resume/ResumePreview";
import type {
  TemplateId,
  ResumeBasics,
  InterviewQuestion,
  InterviewAnswer,
} from "@/lib/types";
import {
  type BuilderStep,
  type DraftStore,
  type ResumeDraft,
  createEmptyDraft,
  deleteDraft,
  draftDisplayName,
  draftHasContent,
  getActiveDraft,
  loadDraftStore,
  migrateLegacyDraft,
  saveDraftStore,
  startNewDraft,
  switchActiveDraft,
  normalizeBasics,
  normalizeDraftStore,
  upsertDraft,
} from "@/lib/resume-drafts";
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

type Step = BuilderStep;

const steps: { id: Step; labelKey: "stepBasics" | "stepInterview" | "stepTemplate" | "stepPreview"; icon: typeof User }[] = [
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

export function ResumeBuilder() {
  const { t, locale, dir } = useLocale();
  const [store, setStore] = useState<DraftStore | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [showDraftMenu, setShowDraftMenu] = useState(false);

  const draft = store ? getActiveDraft(store) : null;
  const step = draft?.step ?? "basics";
  const maxStepIndex = draft?.maxStepIndex ?? 0;
  const basics = draft?.basics;
  const questions = draft?.questions ?? [];
  const answers = draft?.answers ?? {};
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
      saveDraftStore(next);
      return next;
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

  const updateBasics = (field: keyof ResumeBasics, value: string) => {
    patchDraft((d) => ({
      ...d,
      basics: normalizeBasics({ ...d.basics, [field]: value }),
    }));
  };

  const setTemplate = (id: TemplateId) => {
    patchDraft((d) => ({ ...d, template: id }));
  };

  const setAnswers = (updater: (prev: Record<string, string>) => Record<string, string>) => {
    patchDraft((d) => ({ ...d, answers: updater(d.answers) }));
  };

  const handleSwitchDraft = (id: string) => {
    if (!store) return;
    // Save current draft state is already in store; just switch
    const next = switchActiveDraft(store, id);
    saveDraftStore(next);
    setStore(next);
    setShowDraftMenu(false);
    setError("");
  };

  const handleDeleteDraft = (id: string) => {
    if (!store) return;
    if (!window.confirm(t("deleteDraftConfirm"))) return;
    const next = deleteDraft(store, id);
    saveDraftStore(next);
    setStore(next);
  };

  const handleStartNewClick = () => {
    if (!store || !draft) return;
    if (!draftHasContent(draft)) {
      const fresh = createEmptyDraft();
      const next: DraftStore = {
        activeId: fresh.id,
        drafts: store.drafts.map((d) =>
          d.id === draft.id ? { ...fresh, id: d.id } : d
        ),
      };
      saveDraftStore(next);
      setStore(next);
      setError("");
      return;
    }
    setShowNewModal(true);
  };

  const confirmStartNew = (saveCurrent: boolean) => {
    if (!store) return;
    const next = startNewDraft(store, saveCurrent);
    saveDraftStore(next);
    setStore(next);
    setShowNewModal(false);
    setError("");
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
        body: JSON.stringify({ basics, answers: answerList, language: locale }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("error"));
      patchDraft((d) => ({
        ...d,
        resume: data.resume,
        step: "preview",
        maxStepIndex: Math.max(d.maxStepIndex, 3),
      }));
    } catch (e) {
      setError(e instanceof Error ? e.message : t("error"));
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => window.print();

  const answeredCount = questions.filter((q) => answers[q.id]?.trim()).length;
  const minRequired = Math.max(5, Math.ceil(questions.length * 0.6));
  const canProceedInterview =
    questions.length > 0 && answeredCount >= minRequired;

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
      {/* Start new modal */}
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
          <h1 className="text-3xl font-bold text-[#141f2e]">{t("builderTitle")}</h1>
          <p className="mt-2 text-[#6b7c93]">{t("builderSubtitle")}</p>
          <p className="mt-1 text-xs text-[#1db4ce]">{t("dataAutoSaved")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* My Resumes dropdown */}
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
                              onClick={() => handleDeleteDraft(d.id)}
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

      {/* Step indicator — clickable pills */}
      <div className="no-print mb-8 flex items-center justify-center gap-2 sm:gap-4">
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
                        : "bg-[#f4f7fa] text-[#6b7c93]/50 cursor-not-allowed",
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
                    "h-px w-6 sm:w-12",
                    i < maxStepIndex ? "bg-[#1db4ce]" : "bg-[#e2e8f0]"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      <div className={cn("grid gap-8", step === "preview" ? "lg:grid-cols-2" : "max-w-3xl mx-auto")}>
        <div className={cn("space-y-6", step === "preview" && "no-print")}>
          {/* Step 1: Basics */}
          {step === "basics" && (
            <Card>
              <CardHeader>
                <CardTitle>{t("personalInfo")}</CardTitle>
                <CardDescription>{t("builderSubtitle")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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
                <div>
                  <Label>{t("careerBackground")} *</Label>
                  <Textarea
                    value={basics.careerBackground}
                    onChange={(e) => updateBasics("careerBackground", e.target.value)}
                    placeholder={t("careerBackgroundPlaceholder")}
                    rows={6}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: AI Interview */}
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

          {/* Step 3: Template */}
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

          {/* Step 4: Preview controls — template + regenerate */}
          {step === "preview" && (
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

          {/* Navigation buttons */}
          <div className="flex gap-3">
            {step !== "basics" && step !== "preview" && (
              <Button
                variant="outline"
                onClick={() => goToStep(stepIndex - 1)}
              >
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
                  disabled={
                    loading ||
                    !basics.fullName ||
                    !basics.email ||
                    !basics.targetRole ||
                    !basics.careerBackground
                  }
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
                onClick={() => advanceToStep(2)}
                disabled={!canProceedInterview}
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

            {step === "preview" && (
              <Button
                onClick={generateResume}
                disabled={loading}
                variant="secondary"
                className="flex-1"
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
            )}
          </div>
        </div>

        {/* Preview panel */}
        {(step === "preview" || step === "template") && (
          <div className={cn("lg:sticky lg:top-24 lg:self-start", step === "template" && "hidden lg:block")}>
            <Card className="border-0 shadow-none lg:border lg:shadow-sm">
              <CardHeader className="no-print flex flex-row items-center justify-between">
                <CardTitle>{t("preview")}</CardTitle>
                {resume && (
                  <Button variant="outline" size="sm" onClick={handlePrint}>
                    <Printer className="h-4 w-4" />
                    {t("print")}
                  </Button>
                )}
              </CardHeader>
              <CardContent className="p-0 lg:p-6">
                {resume ? (
                  <div
                    id="resume-print-area"
                    className="overflow-auto rounded-xl border border-[#e2e8f0] lg:border"
                  >
                    <ResumePreview data={resume} template={template} locale={locale} />
                  </div>
                ) : (
                  <div className="flex h-96 items-center justify-center rounded-xl border-2 border-dashed border-[#e2e8f0] text-[#6b7c93]">
                    <p className="text-sm text-center px-4">{t("chooseTemplate")}</p>
                  </div>
                )}
                {resume && (
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
