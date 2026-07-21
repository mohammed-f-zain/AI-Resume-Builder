"use client";

import { useCallback, useState } from "react";
import { Upload, FileText, Loader2, TrendingUp } from "lucide-react";
import { useLocale } from "@/contexts/LocaleContext";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { AtsAnalysisResults } from "@/components/analyzer/AtsAnalysisResults";
import type { ATSAnalysis } from "@/lib/types";
import { cn } from "@/lib/utils";

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
        <p className="mt-2 text-[#6b7c93]">{t("analyzerSubtitle")}</p>
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

      {result && <AtsAnalysisResults result={result} />}
    </div>
  );
}
