"use client";

import { useCallback, useState } from "react";
import { Loader2, Copy, Check, Lightbulb, Upload, FileText } from "lucide-react";
import { useLocale } from "@/contexts/LocaleContext";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input, Label, Textarea } from "@/components/ui/Input";
import type { CoverLetterResult } from "@/lib/types";
import { cn } from "@/lib/utils";

export function CoverLetterGenerator() {
  const { t, locale } = useLocale();
  const [position, setPosition] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<CoverLetterResult | null>(null);
  const [copied, setCopied] = useState(false);

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
    setCvFile(f);
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

  const generate = async () => {
    if (!cvFile) return;
    setLoading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("position", position);
      formData.append("jobDescription", jobDescription);
      formData.append("language", locale);
      formData.append("file", cvFile);

      const res = await fetch("/api/generate-cover-letter", {
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

  const copyToClipboard = async () => {
    if (!result?.coverLetter) return;
    await navigator.clipboard.writeText(result.coverLetter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#141f2e]">
          {t("coverTitle")}
        </h1>
        <p className="mt-2 text-[#6b7c93]">{t("coverSubtitle")}</p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardContent className="space-y-4 pt-6">
            <div>
              <Label>{t("position")} *</Label>
              <Input
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="e.g. Senior Software Engineer"
              />
            </div>
            <div>
              <Label>{t("jobDescription")} *</Label>
              <Textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder={t("jobDescriptionPlaceholder")}
                rows={8}
              />
            </div>
            <div>
              <Label>{t("yourCV")} *</Label>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                className={cn(
                  "mt-1.5 flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors",
                  dragOver
                    ? "border-[#1db4ce] bg-[#1db4ce]/5"
                    : "border-[#e2e8f0] hover:border-[#1db4ce]/40"
                )}
              >
                <Upload className="mb-3 h-8 w-8 text-[#6b7c93]" />
                <p className="mb-1 text-sm font-medium text-[#141f2e]">
                  {t("dragDrop")}
                </p>
                <p className="mb-4 text-xs text-[#6b7c93]">
                  {t("supportedFormats")}
                </p>
                <input
                  type="file"
                  accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  className="hidden"
                  id="cv-upload"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(f);
                  }}
                />
                <label
                  htmlFor="cv-upload"
                  className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#e2e8f0] bg-white px-5 py-2.5 text-sm font-medium text-[#141f2e] transition-colors hover:bg-[#f4f7fa]"
                >
                  {t("uploadCV")}
                </label>
                {cvFile && (
                  <div className="mt-4 flex items-center gap-2 text-sm text-[#1db4ce]">
                    <FileText className="h-4 w-4" />
                    {cvFile.name}
                  </div>
                )}
              </div>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <Button
              onClick={generate}
              disabled={loading || !position || !jobDescription || !cvFile}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  {t("generating")}
                </>
              ) : (
                t("generateCover")
              )}
            </Button>
          </CardContent>
        </Card>

        {result && (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{t("coverLetterResult")}</CardTitle>
                <Button variant="outline" size="sm" onClick={copyToClipboard}>
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 text-[#1db4ce]" />
                      {t("copied")}
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      {t("copyToClipboard")}
                    </>
                  )}
                </Button>
              </CardHeader>
              <CardContent>
                <div className="whitespace-pre-wrap rounded-xl bg-[#f4f7fa] p-6 text-sm leading-relaxed text-[#141f2e]">
                  {result.coverLetter}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-amber-500" />
                  {t("enhancements")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {result.enhancements.map((item, i) => (
                    <li
                      key={i}
                      className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-slate-700"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
