import type { GuidedAnswer, GuidedQuestion } from "@/lib/types";
import { isMonthNotInFuture } from "@/lib/resume-drafts";

export function emptyGuidedAnswer(): GuidedAnswer {
  return {
    choice: "",
    choices: [],
    otherText: "",
    fieldGroups: [],
  };
}

export function isFollowUpVisible(
  question: GuidedQuestion,
  answer: GuidedAnswer
): boolean {
  if (!question.followUp) return false;
  const when = question.followUp.showWhen.toLowerCase();
  if (question.type === "multi_choice") {
    return (answer.choices || []).some((c) => c.toLowerCase() === when);
  }
  return (answer.choice || "").toLowerCase() === when;
}

export function isGuidedAnswerComplete(
  question: GuidedQuestion,
  answer: GuidedAnswer | undefined
): boolean {
  if (!answer) return false;

  if (question.type === "multi_choice") {
    const hasChoice = (answer.choices || []).length > 0;
    const hasOther = !!answer.otherText?.trim();
    if (!hasChoice && !hasOther) return false;
  } else if (question.type === "yes_no" || question.type === "single_choice") {
    if (answer.choice === "other") {
      if (!answer.otherText?.trim()) return false;
    } else if (!answer.choice?.trim()) {
      return false;
    }
  }

  if (isFollowUpVisible(question, answer) && question.followUp) {
    const groups = answer.fieldGroups || [];
    if (!groups.length) return false;
    const required = question.followUp.fields.filter((f) => f.required);
    const hasEndDateField = question.followUp.fields.some(
      (f) => f.id === "endDate"
    );
    for (const g of groups) {
      for (const f of required) {
        if (!g.values[f.id]?.trim()) return false;
      }
      const isCurrent =
        (g.values.current || "").toLowerCase() === "true" ||
        (g.values.current || "").toLowerCase() === "yes";
      if (hasEndDateField && !isCurrent && !g.values.endDate?.trim()) {
        return false;
      }
      const start = (g.values.startDate || g.values.from || "").trim();
      const end = (g.values.endDate || g.values.to || "").trim();
      if (start && !isMonthNotInFuture(start)) return false;
      if (!isCurrent && end && !isMonthNotInFuture(end)) return false;
    }
  }

  return true;
}

export function createFieldGroup(
  question: GuidedQuestion
): { id: string; values: Record<string, string> } {
  const values: Record<string, string> = {};
  question.followUp?.fields.forEach((f) => {
    values[f.id] = "";
  });
  return { id: crypto.randomUUID(), values };
}
