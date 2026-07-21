"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Loader2,
  Zap,
  ClipboardList,
  FolderOpen,
  Trash2,
  ChevronRight,
} from "lucide-react";
import { useLocale } from "@/contexts/LocaleContext";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { ConfirmDeleteModal } from "@/components/ui/ConfirmDeleteModal";
import { DetailedResumeBuilder } from "@/components/resume/DetailedResumeBuilder";
import { GuidedResumeBuilder } from "@/components/resume/GuidedResumeBuilder";
import {
  type DraftStore,
  deleteDraft,
  draftDisplayName,
  draftHasContent,
  getActiveDraft,
  loadDraftStore,
  migrateLegacyDraft,
  normalizeDraftStore,
  saveDraftStore,
  switchActiveDraft,
  upsertDraft,
} from "@/lib/resume-drafts";
import type { BuilderMode } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ResumeBuilder() {
  const { t, dir } = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [store, setStore] = useState<DraftStore | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [showAllResumes, setShowAllResumes] = useState(false);

  useEffect(() => {
    const migrated = migrateLegacyDraft();
    let loaded = normalizeDraftStore(migrated ?? loadDraftStore());

    if (searchParams.get("select") === "1") {
      const current = getActiveDraft(loaded);
      loaded = upsertDraft(loaded, {
        ...current,
        mode: null,
        step: "mode",
        maxStepIndex: 0,
      });
      saveDraftStore(loaded);
      router.replace("/builder");
    }

    setStore(loaded);
    setHydrated(true);
  }, [searchParams, router]);

  const selectMode = (mode: BuilderMode) => {
    if (!store) return;
    const current = getActiveDraft(store);
    const next = upsertDraft(store, {
      ...current,
      mode,
      step: "basics",
      maxStepIndex: 0,
      ...(mode === "guided"
        ? {
            guidedQuestions: [],
            guidedAnswers: {},
            guidedQuestionIndex: 0,
          }
        : {}),
    });
    saveDraftStore(next);
    setStore(next);
  };

  const openSavedDraft = (id: string) => {
    if (!store) return;
    let next = switchActiveDraft(store, id);
    const d = getActiveDraft(next);
    if (!d.mode) {
      const inferred: BuilderMode =
        d.guidedQuestions.length > 0 || Object.keys(d.guidedAnswers || {}).length > 0
          ? "guided"
          : "detailed";
      const step = d.resume
        ? "preview"
        : d.step && d.step !== "mode"
          ? d.step
          : "basics";
      next = upsertDraft(next, {
        ...d,
        mode: inferred,
        step,
        maxStepIndex: Math.max(d.maxStepIndex ?? 0, step === "preview" ? 4 : 0),
      });
    } else if (d.resume && (d.step === "mode" || !d.step)) {
      next = upsertDraft(next, {
        ...d,
        step: "preview",
        maxStepIndex: Math.max(d.maxStepIndex ?? 0, 4),
      });
    } else if (d.resume) {
      // Jump straight to preview so user can edit the saved CV
      next = upsertDraft(next, {
        ...d,
        step: "preview",
        maxStepIndex: Math.max(d.maxStepIndex ?? 0, 4),
      });
    }
    saveDraftStore(next);
    setStore(next);
  };

  const confirmDeleteDraft = () => {
    if (!store || !deleteTargetId) return;
    const next = deleteDraft(store, deleteTargetId);
    saveDraftStore(next);
    setStore(next);
    setDeleteTargetId(null);
  };

  if (!hydrated || !store) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#1db4ce]" />
      </div>
    );
  }

  const draft = getActiveDraft(store);

  const reloadStore = () => {
    setStore(normalizeDraftStore(loadDraftStore()));
  };

  if (draft.mode === "guided") {
    return <GuidedResumeBuilder onModeCleared={reloadStore} />;
  }

  if (draft.mode === "detailed") {
    return <DetailedResumeBuilder onModeCleared={reloadStore} />;
  }

  const savedDrafts = [...store.drafts]
    .filter(draftHasContent)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const visibleDrafts = showAllResumes
    ? savedDrafts
    : savedDrafts.slice(0, 2);
  const hasMoreResumes = savedDrafts.length > 2;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <ConfirmDeleteModal
        open={!!deleteTargetId}
        title={t("deleteDraftTitle")}
        description={t("deleteDraftDesc")}
        confirmLabel={t("deleteDraft")}
        cancelLabel={t("cancel")}
        onConfirm={confirmDeleteDraft}
        onCancel={() => setDeleteTargetId(null)}
      />

      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-[#141f2e]">{t("builderTitle")}</h1>
        <p className="mt-2 text-[#6b7c93]">{t("modeSelectSubtitle")}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-2 border-[#e2e8f0] transition-colors hover:border-[#1db4ce]">
          <CardHeader>
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-[#1db4ce]/15 text-[#002b49]">
              <Zap className="h-5 w-5" />
            </div>
            <CardTitle>{t("modeGuidedTitle")}</CardTitle>
            <CardDescription>{t("modeGuidedDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="secondary"
              className="w-full"
              size="lg"
              onClick={() => selectMode("guided")}
            >
              {t("modeGuidedCta")}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-2 border-[#e2e8f0] transition-colors hover:border-[#002b49]">
          <CardHeader>
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-[#002b49]/10 text-[#002b49]">
              <ClipboardList className="h-5 w-5" />
            </div>
            <CardTitle>{t("modeDetailedTitle")}</CardTitle>
            <CardDescription>{t("modeDetailedDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" size="lg" onClick={() => selectMode("detailed")}>
              {t("modeDetailedCta")}
            </Button>
          </CardContent>
        </Card>
      </div>

      {savedDrafts.length > 0 && (
        <Card className="mt-8 border-[#e2e8f0]">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <FolderOpen className="h-5 w-5 text-[#1db4ce]" />
              {t("myResumes")}
              <span className="rounded-full bg-[#002b49] px-2 py-0.5 text-xs font-semibold text-white">
                {savedDrafts.length}
              </span>
            </CardTitle>
            <CardDescription>{t("modeSavedResumesHint")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {visibleDrafts.map((d) => {
              const modeLabel =
                d.mode === "guided"
                  ? t("modeGuidedBadge")
                  : d.mode === "detailed"
                    ? t("modeDetailedBadge")
                    : t("modeSavedUnknown");
              return (
                <div
                  key={d.id}
                  className="flex items-center gap-2 rounded-xl border border-[#e2e8f0] bg-[#f4f7fa]/50 px-3 py-2.5"
                >
                  <button
                    type="button"
                    onClick={() => openSavedDraft(d.id)}
                    className="min-w-0 flex-1 text-start"
                  >
                    <span className="block truncate text-sm font-medium text-[#141f2e]">
                      {draftDisplayName(d)}
                    </span>
                    <span className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-[#6b7c93]">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 font-medium",
                          d.mode === "guided"
                            ? "bg-[#1db4ce]/15 text-[#002b49]"
                            : "bg-[#002b49]/10 text-[#002b49]"
                        )}
                      >
                        {modeLabel}
                      </span>
                      <span>{new Date(d.updatedAt).toLocaleDateString()}</span>
                    </span>
                  </button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => openSavedDraft(d.id)}
                    className="shrink-0"
                  >
                    {t("continueResume")}
                    <ChevronRight
                      className={cn("h-4 w-4", dir === "rtl" && "rotate-180")}
                    />
                  </Button>
                  <button
                    type="button"
                    onClick={() => setDeleteTargetId(d.id)}
                    className="shrink-0 rounded-lg p-2 text-[#6b7c93] hover:bg-red-50 hover:text-red-600"
                    aria-label={t("deleteDraft")}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
            {hasMoreResumes && (
              <button
                type="button"
                onClick={() => setShowAllResumes((v) => !v)}
                className="w-full rounded-xl py-2 text-sm font-medium text-[#1db4ce] transition-colors hover:bg-[#1db4ce]/10"
              >
                {showAllResumes
                  ? t("showLessResumes")
                  : t("showMoreResumes").replace(
                      "{count}",
                      String(savedDrafts.length - 2)
                    )}
              </button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
