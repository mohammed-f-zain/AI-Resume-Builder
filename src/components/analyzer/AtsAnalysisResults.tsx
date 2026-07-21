"use client";

import { CheckCircle2, AlertCircle } from "lucide-react";
import { useLocale } from "@/contexts/LocaleContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import type { ATSAnalysis } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ScoreRing({
  score,
  size = "md",
}: {
  score: number;
  size?: "sm" | "md";
}) {
  const color =
    score >= 80 ? "text-[#1db4ce]" : score >= 60 ? "text-amber-600" : "text-red-600";
  const bg =
    score >= 80 ? "stroke-[#1db4ce]" : score >= 60 ? "stroke-amber-600" : "stroke-red-600";

  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;
  const box = size === "sm" ? "h-24 w-24" : "h-36 w-36";
  const scoreClass = size === "sm" ? "text-2xl" : "text-3xl";

  return (
    <div className={cn("relative mx-auto", box)}>
      <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
        <circle
          cx="60"
          cy="60"
          r="54"
          fill="none"
          strokeWidth="8"
          className="stroke-slate-200"
        />
        <circle
          cx="60"
          cy="60"
          r="54"
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          className={bg}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn("font-bold", scoreClass, color)}>{score}</span>
        <span className="text-xs text-slate-500">/ 100</span>
      </div>
    </div>
  );
}

function BreakdownBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span className="text-slate-600">{label}</span>
        <span className="font-medium">{value}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-[#002b49] transition-all"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

export function AtsAnalysisResults({
  result,
  compact,
}: {
  result: ATSAnalysis;
  compact?: boolean;
}) {
  const { t } = useLocale();

  if (compact) {
    return (
      <Card className="min-w-0 overflow-hidden">
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="text-base">{t("atsScore")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <div className="shrink-0">
              <ScoreRing score={result.score} size="sm" />
            </div>
            <div className="min-w-0 w-full flex-1 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t("scoreBreakdown")}
              </p>
              <BreakdownBar label={t("formatting")} value={result.breakdown.formatting} />
              <BreakdownBar label={t("keywords")} value={result.breakdown.keywords} />
              <BreakdownBar label={t("structure")} value={result.breakdown.structure} />
              <BreakdownBar label={t("content")} value={result.breakdown.content} />
              <BreakdownBar label={t("readability")} value={result.breakdown.readability} />
            </div>
          </div>

          {result.strengths?.length > 0 && (
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-800">
                <CheckCircle2 className="h-4 w-4 text-[#1db4ce]" />
                {t("strengths")}
              </p>
              <ul className="space-y-1.5">
                {result.strengths.map((s, i) => (
                  <li key={i} className="flex gap-2 text-sm text-slate-700">
                    <span className="text-[#1db4ce]">✓</span>
                    <span className="min-w-0 break-words">{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.suggestions?.length > 0 && (
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-800">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                {t("suggestions")}
              </p>
              <ul className="space-y-2">
                {result.suggestions.map((s, i) => (
                  <li
                    key={i}
                    className="rounded-lg bg-amber-50 p-2.5 text-sm text-slate-700 break-words"
                  >
                    {i + 1}. {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-center">{t("atsScore")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ScoreRing score={result.score} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("scoreBreakdown")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <BreakdownBar label={t("formatting")} value={result.breakdown.formatting} />
          <BreakdownBar label={t("keywords")} value={result.breakdown.keywords} />
          <BreakdownBar label={t("structure")} value={result.breakdown.structure} />
          <BreakdownBar label={t("content")} value={result.breakdown.content} />
          <BreakdownBar label={t("readability")} value={result.breakdown.readability} />
        </CardContent>
      </Card>

      {result.strengths?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle2 className="h-5 w-5 text-[#1db4ce]" />
              {t("strengths")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {result.strengths.map((s, i) => (
                <li key={i} className="flex gap-2 text-sm text-slate-700">
                  <span className="text-[#1db4ce]">✓</span>
                  {s}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {result.suggestions?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              {t("suggestions")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {result.suggestions.map((s, i) => (
                <li
                  key={i}
                  className="rounded-lg bg-amber-50 p-3 text-sm text-slate-700"
                >
                  {i + 1}. {s}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
