import type { ResumeData } from "@/lib/types";
import {
  normalizeCertifications,
  normalizeReferences,
  normalizeResumeSkills,
} from "@/lib/types";
import {
  formatResumeDate,
  formatResumeDateRange,
} from "@/lib/format-resume-date";
import {
  customSectionIdFromKey,
  isBuiltinSectionId,
  isCustomSectionKey,
  normalizeCustomSections,
  normalizeSectionOrder,
} from "@/lib/resume-sections";

/** Flatten structured resume data into plain text for ATS analysis. */
export function resumeToPlainText(
  data: ResumeData,
  locale: "en" | "ar" = "en"
): string {
  const lines: string[] = [];
  const c = data.contact;
  const present = locale === "ar" ? "حتى الآن" : "Present";

  lines.push(c.fullName || "");
  if (c.headline) lines.push(c.headline);
  lines.push(
    [c.email, c.phone, c.location, c.linkedin, c.github, c.website]
      .filter(Boolean)
      .join(" | ")
  );
  lines.push("");

  const skills = normalizeResumeSkills(data.skills);
  const order = normalizeSectionOrder(data);
  const customs = normalizeCustomSections(data.customSections);
  const coursesSeparate = order.includes("courses");
  let skillsRendered = false;

  for (const key of order) {
    if (isCustomSectionKey(key)) {
      const id = customSectionIdFromKey(key);
      const section = customs.find((s) => s.id === id);
      if (!section) continue;
      const heading = section.heading?.trim();
      const content = section.content?.trim();
      if (!heading && !content) continue;
      lines.push((heading || "SECTION").toUpperCase());
      if (content) lines.push(section.content);
      lines.push("");
      continue;
    }

    if (!isBuiltinSectionId(key)) continue;

    switch (key) {
      case "summary":
        if (data.summary) {
          lines.push("PROFESSIONAL SUMMARY");
          lines.push(data.summary);
          lines.push("");
        }
        break;
      case "competencies":
      case "technical": {
        if (skillsRendered) break;
        skillsRendered = true;
        const competencies = skills.competencies.filter((s) => s.trim());
        const technical = skills.technical.filter((s) => s.trim());
        const soft = skills.soft.filter((s) => s.trim());
        if (!competencies.length && !technical.length && !soft.length) break;
        lines.push("SKILLS");
        if (competencies.length) {
          lines.push("Core Competencies:");
          lines.push(competencies.join(" • "));
        }
        if (technical.length) {
          lines.push("Technical Skills:");
          lines.push(technical.join(" • "));
        }
        if (soft.length) {
          lines.push("Soft Skills:");
          lines.push(soft.join(" • "));
        }
        lines.push("");
        break;
      }
      case "experience":
        if (data.experience?.length) {
          lines.push("EXPERIENCE");
          for (const exp of data.experience) {
            const dates = formatResumeDateRange(
              exp.startDate,
              exp.endDate,
              exp.current,
              present,
              locale
            );
            lines.push(`${exp.title}${dates ? ` | ${dates}` : ""}`);
            const companyLine = [exp.company, exp.location]
              .filter(Boolean)
              .join(" - ");
            if (companyLine) lines.push(companyLine);
            for (const b of exp.bullets || []) {
              if (b.trim()) lines.push(`• ${b}`);
            }
            lines.push("");
          }
        }
        break;
      case "projects":
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
        break;
      case "education":
        if (data.education?.length) {
          lines.push("EDUCATION");
          for (const edu of data.education) {
            const inst = [edu.institution, edu.location]
              .filter(Boolean)
              .join(", ");
            const grad = formatResumeDate(edu.graduationDate, locale);
            lines.push(
              `${edu.degree}${inst ? ` - ${inst}` : ""}${
                grad ? ` (${grad})` : ""
              }${edu.gpa ? ` | GPA: ${edu.gpa}` : ""}`
            );
          }
          lines.push("");
        }
        break;
      case "certifications": {
        const certs = normalizeCertifications(data.certifications);
        const courses = coursesSeparate
          ? []
          : (data.courses ?? []).filter((x) => x.trim());
        if (certs.length || courses.length) {
          lines.push("CERTIFICATIONS");
          for (const cert of certs) {
            if (cert.name.trim()) lines.push(`• ${cert.name}`);
          }
          for (const course of courses) lines.push(`• ${course}`);
          lines.push("");
        }
        break;
      }
      case "courses": {
        const courses = (data.courses ?? []).filter((x) => x.trim());
        if (courses.length) {
          lines.push("COURSES");
          for (const course of courses) lines.push(`• ${course}`);
          lines.push("");
        }
        break;
      }
      case "languages":
        if (data.languages?.length) {
          lines.push("LANGUAGES");
          lines.push(data.languages.filter((l) => l.trim()).join(", "));
          lines.push("");
        }
        break;
      case "references": {
        const refs = normalizeReferences(data.references);
        if (refs.length) {
          lines.push("REFERENCES");
          for (const r of refs) {
            const role = [r.title, r.company].filter(Boolean).join(", ");
            const head = role ? `${r.name} - ${role}` : r.name;
            const contact = [r.phone, r.email].filter(Boolean).join(" | ");
            lines.push(contact ? `${head} | ${contact}` : head);
          }
          lines.push("");
        }
        break;
      }
      default:
        break;
    }
  }

  return lines
    .filter((l, i, arr) => !(l === "" && arr[i - 1] === ""))
    .join("\n");
}
