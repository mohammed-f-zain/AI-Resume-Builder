"use client";

import { Check, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import {
  createFieldGroup,
  isFollowUpVisible,
} from "@/lib/guided-answers";
import {
  currentYearMonth,
  isMonthNotInFuture,
} from "@/lib/resume-drafts";
import type { TranslationKey } from "@/lib/i18n/translations";
import type { GuidedAnswer, GuidedQuestion } from "@/lib/types";
import { cn } from "@/lib/utils";

type TFn = (key: TranslationKey) => string;

interface GuidedQuestionEditorProps {
  question: GuidedQuestion;
  answer: GuidedAnswer;
  onChange: (answer: GuidedAnswer) => void;
  yesLabel: string;
  noLabel: string;
  t: TFn;
  /** Optional heading prefix e.g. "1." */
  indexLabel?: string;
}

function ensureFollowUpGroups(
  question: GuidedQuestion,
  answer: GuidedAnswer
): GuidedAnswer {
  if (!isFollowUpVisible(question, answer) || !question.followUp) {
    return answer;
  }
  if (answer.fieldGroups?.length) return answer;
  return { ...answer, fieldGroups: [createFieldGroup(question)] };
}

export function GuidedQuestionEditor({
  question,
  answer,
  onChange,
  yesLabel,
  noLabel,
  t,
  indexLabel,
}: GuidedQuestionEditorProps) {
  const setAnswer = (next: GuidedAnswer) => onChange(next);

  return (
    <div className="space-y-4">
      <p className="text-lg font-semibold text-[#002b49]">
        {indexLabel ? (
          <span className="me-2 text-[#1db4ce]">{indexLabel}</span>
        ) : null}
        {question.question}
      </p>

      {question.type === "yes_no" && (
        <div className="flex w-full flex-col gap-2">
          {[
            { value: "yes", label: yesLabel },
            { value: "no", label: noLabel },
          ].map(({ value, label }) => {
            const selected = answer.choice === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setAnswer(
                    ensureFollowUpGroups(question, {
                      ...answer,
                      choice: value,
                      otherText: "",
                    })
                  );
                }}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3 text-start text-sm font-medium transition-all",
                  selected
                    ? "border-[#002b49] bg-[#002b49] text-white"
                    : "border-[#e2e8f0] bg-white hover:border-[#1db4ce]"
                )}
              >
                <span
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
                    selected
                      ? "border-white bg-white text-[#002b49]"
                      : "border-[#e2e8f0]"
                  )}
                >
                  {selected && <Check className="h-3.5 w-3.5" />}
                </span>
                {label}
              </button>
            );
          })}
          <div className="rounded-xl border-2 border-dashed border-[#e2e8f0] p-3">
            <Label>{t("guidedOtherOption")}</Label>
            <Input
              className="mt-1"
              value={answer.choice === "other" ? answer.otherText || "" : ""}
              onChange={(e) =>
                setAnswer({
                  ...answer,
                  choice: "other",
                  otherText: e.target.value,
                  fieldGroups: [],
                })
              }
              placeholder={t("guidedOtherPlaceholder")}
            />
          </div>
        </div>
      )}

      {question.type === "single_choice" && (
        <div className="flex w-full flex-col gap-2">
          {(question.options || []).map((opt) => {
            const selected = answer.choice === opt;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  setAnswer(
                    ensureFollowUpGroups(question, {
                      ...answer,
                      choice: opt,
                      otherText: "",
                    })
                  );
                }}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3 text-start text-sm transition-all",
                  selected
                    ? "border-[#002b49] bg-[#002b49]/5 font-medium text-[#002b49]"
                    : "border-[#e2e8f0] bg-white hover:border-[#1db4ce]"
                )}
              >
                <span
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
                    selected
                      ? "border-[#002b49] bg-[#002b49] text-white"
                      : "border-[#e2e8f0]"
                  )}
                >
                  {selected && <Check className="h-3 w-3" />}
                </span>
                <span className="flex-1">{opt}</span>
              </button>
            );
          })}
          <div className="rounded-xl border-2 border-dashed border-[#e2e8f0] p-3">
            <Label>{t("guidedOtherOption")}</Label>
            <Input
              className="mt-1"
              value={answer.choice === "other" ? answer.otherText || "" : ""}
              onFocus={() => {
                if (answer.choice !== "other") {
                  setAnswer({
                    ...answer,
                    choice: "other",
                    fieldGroups: [],
                  });
                }
              }}
              onChange={(e) =>
                setAnswer({
                  ...answer,
                  choice: "other",
                  otherText: e.target.value,
                  fieldGroups: [],
                })
              }
              placeholder={t("guidedOtherPlaceholder")}
            />
          </div>
        </div>
      )}

      {question.type === "multi_choice" && (
        <div className="flex w-full flex-col gap-2">
          {(question.options || []).map((opt) => {
            const selected = (answer.choices || []).includes(opt);
            return (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  const prev = answer.choices || [];
                  const choices = selected
                    ? prev.filter((c) => c !== opt)
                    : [...prev, opt];
                  setAnswer(
                    ensureFollowUpGroups(question, {
                      ...answer,
                      choices,
                    })
                  );
                }}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3 text-start text-sm transition-all",
                  selected
                    ? "border-[#002b49] bg-[#002b49]/5 font-medium text-[#002b49]"
                    : "border-[#e2e8f0] bg-white hover:border-[#1db4ce]"
                )}
              >
                <span
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded border-2",
                    selected
                      ? "border-[#002b49] bg-[#002b49] text-white"
                      : "border-[#e2e8f0]"
                  )}
                >
                  {selected && <Check className="h-3.5 w-3.5" />}
                </span>
                <span className="flex-1">{opt}</span>
              </button>
            );
          })}
          <div className="rounded-xl border-2 border-dashed border-[#e2e8f0] p-3">
            <Label>{t("guidedOtherOption")}</Label>
            <Input
              className="mt-1"
              value={answer.otherText || ""}
              onChange={(e) =>
                setAnswer({
                  ...answer,
                  otherText: e.target.value,
                })
              }
              placeholder={t("guidedOtherPlaceholder")}
            />
          </div>
        </div>
      )}

      {isFollowUpVisible(question, answer) && question.followUp && (
        <div className="space-y-3 rounded-xl border border-[#e2e8f0] bg-[#f4f7fa]/60 p-4">
          <p className="text-sm font-medium text-[#002b49]">
            {t("guidedFollowUpTitle")}
          </p>
          {(answer.fieldGroups || []).map((group, gi) => (
            <div
              key={group.id}
              className="space-y-3 rounded-lg border border-[#e2e8f0] bg-white p-3"
            >
              <div className="flex justify-between">
                <span className="text-xs font-semibold text-[#6b7c93]">
                  #{gi + 1}
                </span>
                {(answer.fieldGroups || []).length > 1 && (
                  <button
                    type="button"
                    className="text-xs text-red-600"
                    onClick={() =>
                      setAnswer({
                        ...answer,
                        fieldGroups: (answer.fieldGroups || []).filter(
                          (g) => g.id !== group.id
                        ),
                      })
                    }
                  >
                    {t("removeExperience")}
                  </button>
                )}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {question.followUp!.fields.map((field) => {
                  const isCurrent =
                    (group.values.current || "").toLowerCase() === "true" ||
                    (group.values.current || "").toLowerCase() === "yes";
                  const isEndDate = field.id === "endDate";
                  return (
                    <div key={field.id}>
                      <Label>
                        {field.label}
                        {field.required || (isEndDate && !isCurrent)
                          ? " *"
                          : ""}
                      </Label>
                      <Input
                        type={field.inputType === "month" ? "month" : "text"}
                        value={group.values[field.id] || ""}
                        max={
                          field.inputType === "month"
                            ? currentYearMonth()
                            : undefined
                        }
                        disabled={isEndDate && isCurrent}
                        onChange={(e) => {
                          const fieldGroups = (answer.fieldGroups || []).map(
                            (g) =>
                              g.id === group.id
                                ? {
                                    ...g,
                                    values: {
                                      ...g.values,
                                      [field.id]: e.target.value,
                                    },
                                  }
                                : g
                          );
                          setAnswer({ ...answer, fieldGroups });
                        }}
                      />
                      {isEndDate &&
                        !isCurrent &&
                        group.values.endDate &&
                        !isMonthNotInFuture(group.values.endDate) && (
                          <p className="mt-1 text-xs text-red-600">
                            {t("endDateFuture")}
                          </p>
                        )}
                    </div>
                  );
                })}
              </div>
              {question.followUp!.fields.some((f) => f.id === "endDate") && (
                <label className="flex items-center gap-2 text-sm text-[#141f2e]">
                  <input
                    type="checkbox"
                    checked={
                      (group.values.current || "").toLowerCase() === "true" ||
                      (group.values.current || "").toLowerCase() === "yes"
                    }
                    onChange={(e) => {
                      const checked = e.target.checked;
                      const fieldGroups = (answer.fieldGroups || []).map((g) =>
                        g.id === group.id
                          ? {
                              ...g,
                              values: {
                                ...g.values,
                                current: checked ? "true" : "",
                                endDate: checked ? "" : g.values.endDate || "",
                              },
                            }
                          : g
                      );
                      setAnswer({ ...answer, fieldGroups });
                    }}
                    className="rounded border-[#e2e8f0]"
                  />
                  {t("currentlyWorking")}
                </label>
              )}
            </div>
          ))}
          {question.followUp.allowMultiple && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setAnswer({
                  ...answer,
                  fieldGroups: [
                    ...(answer.fieldGroups || []),
                    createFieldGroup(question),
                  ],
                })
              }
            >
              <Plus className="h-4 w-4" />
              {t("guidedAddAnother")}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
