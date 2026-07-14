"use client";

import { useCallback, useState } from "react";
import {
  Upload,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
} from "lucide-react";
import { useLocale } from "@/contexts/LocaleContext";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import type { ATSAnalysis } from "@/lib/types";
import { cn } from "@/lib/utils";

function ScoreRing({ score }: { score: number }) {
  const color =
    score >= 80 ? "text-[#1db4ce]" : score >= 60 ? "text-amber-600" : "text-red-600";
  const bg =
    score >= 80 ? "stroke-[#1db4ce]" : score >= 60 ? "stroke-amber-600" : "stroke-red-600";

  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative mx-auto h-36 w-36">
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
        <span className={cn("text-3xl font-bold", color)}>{score}</span>
        <span className="text-xs text-slate-500">/ 100</span>
      </div>
    </div>
  );
}

function BreakdownBar({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
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

export function ResumeAnalyzer() {
  const { t, locale } = useLocale();
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ATSAnalysis | null>(null);

  const handleFile = useCallback((f: File) => {
    const valid =
      f.type === "application/pdf" ||
      f.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      f.name.endsWith(".pdf") ||
      f.name.endsWith(".docx");
    if (!valid) {
      setError("Please upload a PDF or DOCX file.");
      return;
    }
    setFile(f);
    setError("");
    setResult(null);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile]
  );

  const analyze = async () => {
    if (!file) return;
    setLoading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("language", locale);

      const res = await fetch("/api/analyze-resume", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("error"));
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-[#141f2e]">
          {t("analyzerTitle")}
        </h1>
        <p className="mt-2 text-[#6b7c93]">
          {t("analyzerSubtitle")}
        </p>
      </div>

      <Card className="mb-8">
        <CardContent className="pt-6">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={cn(
              "flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 transition-colors",
              dragOver
                ? "border-[#1db4ce] bg-[#1db4ce]/5"
                : "border-[#e2e8f0] hover:border-[#1db4ce]/40"
            )}
          >
            <Upload className="mb-4 h-10 w-10 text-slate-400" />
            <p className="mb-1 text-sm font-medium text-slate-700">
              {t("dragDrop")}
            </p>
            <p className="mb-4 text-xs text-slate-500">{t("supportedFormats")}</p>
            <input
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="hidden"
              id="resume-upload"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
            <label
              htmlFor="resume-upload"
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#e2e8f0] bg-white px-5 py-2.5 text-sm font-medium text-[#141f2e] transition-colors hover:bg-[#f4f7fa]"
            >
              {t("uploadResume")}
            </label>
            {file && (
              <div className="mt-4 flex items-center gap-2 text-sm text-[#1db4ce]">
                <FileText className="h-4 w-4" />
                {file.name}
              </div>
            )}
          </div>

          {error && (
            <p className="mt-4 text-center text-sm text-red-600">{error}</p>
          )}

          <Button
            onClick={analyze}
            disabled={!file || loading}
            className="mt-6 w-full"
            size="lg"
            variant="secondary"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                {t("analyzing")}
              </>
            ) : (
              <>
                <TrendingUp className="h-5 w-5" />
                {t("analyzeResume")}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-6">
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
            <CardContent className="space-y-4">
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
                <CardTitle className="flex items-center gap-2">
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

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-600" />
                {t("suggestions")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {result.suggestions.map((s, i) => (
                  <li
                    key={i}
                    className="rounded-lg bg-amber-50 p-3 text-sm text-slate-700 dark:bg-amber-950/30"
                  >
                    {i + 1}. {s}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("extractedPreview")}</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="max-h-48 overflow-auto rounded-lg bg-slate-50 p-4 text-xs text-slate-600 whitespace-pre-wrap">
                {result.extractedText}
              </pre>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
