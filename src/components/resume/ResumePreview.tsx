"use client";

import type { TemplateId, ResumeData } from "@/lib/types";
import {
  ClassicTemplate,
  ModernTemplate,
  MinimalTemplate,
  ExecutiveTemplate,
  CreativeTemplate,
} from "./templates";

interface ResumePreviewProps {
  data: ResumeData;
  template: TemplateId;
  locale: "en" | "ar";
}

export function ResumePreview({ data, template, locale }: ResumePreviewProps) {
  switch (template) {
    case "modern":
      return <ModernTemplate data={data} locale={locale} />;
    case "minimal":
      return <MinimalTemplate data={data} locale={locale} />;
    case "executive":
      return <ExecutiveTemplate data={data} locale={locale} />;
    case "creative":
      return <CreativeTemplate data={data} locale={locale} />;
    case "classic":
    default:
      return <ClassicTemplate data={data} locale={locale} />;
  }
}
