import type { ResumeData } from "@/lib/types";
import {
  hasAnySkills,
  normalizeCertifications,
  normalizeResumeSkills,
} from "@/lib/types";

/** Flatten structured resume data into plain text for ATS analysis. */
export function resumeToPlainText(data: ResumeData): string {
  const lines: string[] = [];
  const c = data.contact;

  lines.push(c.fullName || "");
  if (c.headline) lines.push(c.headline);
  lines.push(
    [c.email, c.phone, c.location, c.linkedin, c.github, c.website]
      .filter(Boolean)
      .join(" | ")
  );
  lines.push("");

  if (data.summary) {
    lines.push("PROFESSIONAL SUMMARY");
    lines.push(data.summary);
    lines.push("");
  }

  const skills = normalizeResumeSkills(data.skills);
  if (hasAnySkills(skills)) {
    lines.push("PROFESSIONAL SKILLS");
    if (skills.technical.length) {
      lines.push(`Technical Skills: ${skills.technical.join(", ")}`);
    }
    if (skills.soft.length) {
      lines.push(`Soft Skills: ${skills.soft.join(", ")}`);
    }
    lines.push("");
  }

  if (data.experience?.length) {
    lines.push("PROFESSIONAL EXPERIENCE");
    for (const exp of data.experience) {
      const dates = `${exp.startDate || ""} – ${exp.current ? "Present" : exp.endDate || ""}`;
      const loc = exp.location ? ` | ${exp.location}` : "";
      lines.push(`${exp.title} — ${exp.company}${loc} | ${dates}`);
      for (const b of exp.bullets || []) {
        if (b.trim()) lines.push(`• ${b}`);
      }
      lines.push("");
    }
  }

  if (data.projects?.length) {
    lines.push("PROJECTS");
    for (const p of data.projects) {
      lines.push(p.name + (p.url ? ` (${p.url})` : ""));
      if (p.description) lines.push(p.description);
      if (p.technologies?.length) {
        lines.push(`Technologies: ${p.technologies.join(", ")}`);
      }
      for (const o of p.outcomes || []) {
        if (o.trim()) lines.push(`• ${o}`);
      }
      lines.push("");
    }
  }

  if (data.education?.length) {
    lines.push("EDUCATION");
    for (const edu of data.education) {
      lines.push(
        `${edu.degree} — ${edu.institution}${edu.gpa ? ` — GPA: ${edu.gpa}` : ""} | ${edu.graduationDate || ""}`
      );
    }
    lines.push("");
  }

  const certs = normalizeCertifications(data.certifications);
  const courses = data.courses ?? [];
  if (certs.length || courses.length) {
    lines.push("CERTIFICATIONS & COURSES");
    for (const cert of certs) lines.push(`• ${cert.name}`);
    for (const course of courses) lines.push(`• ${course}`);
    lines.push("");
  }

  if (data.languages?.length) {
    lines.push("LANGUAGES");
    lines.push(data.languages.join(", "));
  }

  return lines.filter((l, i, arr) => !(l === "" && arr[i - 1] === "")).join("\n");
}
