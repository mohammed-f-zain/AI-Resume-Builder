import type { ComponentType, ReactNode } from "react";
import { Mail, Globe, Phone, MapPin } from "lucide-react";
import type { ContactInfo, CustomSection, ResumeData, Reference } from "@/lib/types";
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
import { cn } from "@/lib/utils";

interface TemplateProps {
  data: ResumeData;
  locale?: "en" | "ar";
}

/**
 * Layout modeled on the sample ATS PDFs (HR Qatar + Executive roles):
 * - Name + headline + Location • Phone • Email • LinkedIn (clickable icons)
 * - ALL CAPS section headings with underline
 * - Title on its own line; Company | Location | Dates below
 * - Core Competencies as •-joined text (or bullet list)
 */

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function normalizeContactUrl(
  value: string,
  type: "linkedin" | "github" | "website"
): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  if (type === "linkedin") {
    return trimmed.includes("linkedin.com")
      ? `https://${trimmed.replace(/^https?:\/\//, "")}`
      : `https://linkedin.com/in/${trimmed.replace(/^\/+/, "")}`;
  }
  if (type === "github") {
    return trimmed.includes("github.com")
      ? `https://${trimmed.replace(/^https?:\/\//, "")}`
      : `https://github.com/${trimmed.replace(/^\/+/, "")}`;
  }
  return `https://${trimmed.replace(/^\/+/, "")}`;
}

const sectionLabels = {
  en: {
    summary: "Professional Summary",
    executiveSummary: "Professional Summary",
    experience: "Experience",
    education: "Education",
    skills: "Skills",
    technicalSkills: "Technical Skills",
    softSkills: "Soft Skills",
    coreCompetencies: "Core Competencies",
    technicalAdditional: "Technical Skills",
    projects: "Projects",
    certifications: "Certifications",
    courses: "Courses",
    languages: "Languages",
    references: "References",
    present: "Present",
  },
  ar: {
    summary: "الملخص المهني",
    executiveSummary: "الملخص المهني",
    experience: "الخبرة",
    education: "التعليم",
    skills: "المهارات",
    technicalSkills: "المهارات التقنية",
    softSkills: "المهارات الشخصية",
    coreCompetencies: "الكفاءات الأساسية",
    technicalAdditional: "المهارات التقنية",
    projects: "المشاريع",
    certifications: "الشهادات",
    courses: "الدورات",
    languages: "اللغات",
    references: "المراجع",
    present: "حتى الآن",
  },
};

type Labels = (typeof sectionLabels)["en"];

function getLabels(locale: "en" | "ar") {
  return sectionLabels[locale];
}

/** Shared spacing / bullet styles for consistent ATS readability */
const sectionClass = "mb-5";
const entryClass = "resume-entry mb-3.5 last:mb-0";
const bodyTextClass = "text-[13px] leading-[1.55] text-slate-800";
const bulletListClass =
  "mt-1.5 list-disc space-y-1 ps-5 text-[13px] leading-[1.55] text-slate-800";
const skillGroupClass = "mb-2.5 last:mb-0";
const skillSubheadClass = "mb-0.5 text-[12px] font-semibold text-slate-700";

/** PDF contact order: Location • Phone • Email • LinkedIn • GitHub • Website (links clickable + icons) */
function ContactBulletLine({
  contact,
  className,
  align = "start",
}: {
  contact: ContactInfo;
  className?: string;
  align?: "start" | "center";
}) {
  type Item = {
    key: string;
    node: ReactNode;
  };

  const items: Item[] = [];

  if (contact.location?.trim()) {
    items.push({
      key: "location",
      node: (
        <span className="inline-flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-500" aria-hidden />
          {contact.location.trim()}
        </span>
      ),
    });
  }

  if (contact.phone?.trim()) {
    const phone = contact.phone.trim();
    items.push({
      key: "phone",
      node: (
        <a
          href={`tel:${phone.replace(/\s+/g, "")}`}
          className="resume-contact-link inline-flex items-center gap-1 text-slate-700 hover:text-[#1db4ce]"
        >
          <Phone className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {phone}
        </a>
      ),
    });
  }

  if (contact.email?.trim()) {
    items.push({
      key: "email",
      node: (
        <a
          href={`mailto:${contact.email.trim()}`}
          className="resume-contact-link inline-flex items-center gap-1 text-slate-700 hover:text-[#1db4ce]"
        >
          <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {contact.email.trim()}
        </a>
      ),
    });
  }

  if (contact.linkedin?.trim()) {
    items.push({
      key: "linkedin",
      node: (
        <a
          href={normalizeContactUrl(contact.linkedin, "linkedin")}
          target="_blank"
          rel="noopener noreferrer"
          className="resume-contact-link inline-flex items-center gap-1 text-slate-700 hover:text-[#1db4ce]"
          aria-label="LinkedIn"
          title="LinkedIn"
        >
          <LinkedInIcon className="h-3.5 w-3.5 shrink-0" />
          <span>LinkedIn</span>
        </a>
      ),
    });
  }

  if (contact.github?.trim()) {
    items.push({
      key: "github",
      node: (
        <a
          href={normalizeContactUrl(contact.github, "github")}
          target="_blank"
          rel="noopener noreferrer"
          className="resume-contact-link inline-flex items-center gap-1 text-slate-700 hover:text-[#1db4ce]"
          aria-label="GitHub"
          title="GitHub"
        >
          <GitHubIcon className="h-3.5 w-3.5 shrink-0" />
          <span>GitHub</span>
        </a>
      ),
    });
  }

  if (contact.website?.trim()) {
    items.push({
      key: "website",
      node: (
        <a
          href={normalizeContactUrl(contact.website, "website")}
          target="_blank"
          rel="noopener noreferrer"
          className="resume-contact-link inline-flex items-center gap-1 text-slate-700 hover:text-[#1db4ce]"
          aria-label="Website"
          title="Website"
        >
          <Globe className="h-3.5 w-3.5 shrink-0" />
          <span>Website</span>
        </a>
      ),
    });
  }

  if (!items.length) return null;

  return (
    <p
      className={cn(
        "flex flex-wrap items-center gap-x-0 gap-y-1 text-[13px] leading-relaxed text-slate-700",
        align === "center" && "justify-center text-center",
        className
      )}
    >
      {items.map((item, i) => (
        <span key={item.key} className="inline-flex items-center">
          {i > 0 && <span className="mx-1.5 text-slate-400">•</span>}
          {item.node}
        </span>
      ))}
    </p>
  );
}

function AtsHeader({
  contact,
  className,
  nameClassName,
  headlineClassName,
  align = "start",
  nameUppercase,
}: {
  contact: ContactInfo;
  className?: string;
  nameClassName?: string;
  headlineClassName?: string;
  align?: "start" | "center";
  nameUppercase?: boolean;
}) {
  const photo = contact.photoDataUrl?.trim();
  const displayName = nameUppercase
    ? contact.fullName.toUpperCase()
    : contact.fullName;

  return (
    <header className={cn("resume-header mb-5", className)}>
      <div
        className={cn(
          "flex gap-4",
          align === "center"
            ? "flex-col items-center text-center"
            : "items-start justify-between"
        )}
      >
        <div className={cn("min-w-0 flex-1", align === "center" && "w-full")}>
          <h1
            className={cn(
              "text-[26px] font-bold leading-tight tracking-tight text-black",
              nameClassName
            )}
          >
            {displayName}
          </h1>
          {contact.headline?.trim() && (
            <p
              className={cn(
                "mt-1 text-[14px] font-medium leading-snug text-slate-800",
                headlineClassName
              )}
            >
              {contact.headline}
            </p>
          )}
          <ContactBulletLine contact={contact} align={align} className="mt-1.5" />
        </div>
        {photo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo}
            alt=""
            className="resume-photo h-24 w-24 shrink-0 rounded object-cover print:h-24 print:w-24"
          />
        )}
      </div>
    </header>
  );
}

type ExperienceLayout = "sample" | "two-line" | "inline";

function ResumeBody({
  data,
  labels,
  Heading,
  locale,
  summaryClassName,
  summaryLabel,
  competenciesAsBullets,
}: {
  data: ResumeData;
  labels: Labels;
  Heading: ComponentType<{ children: ReactNode }>;
  locale: "en" | "ar";
  summaryClassName?: string;
  summaryLabel?: string;
  competenciesAsBullets?: boolean;
}) {
  const order = normalizeSectionOrder(data);
  const customs = normalizeCustomSections(data.customSections);
  const coursesSeparate = order.includes("courses");
  let skillsRendered = false;

  return (
    <>
      {order.map((key) => {
        if (isCustomSectionKey(key)) {
          const id = customSectionIdFromKey(key);
          const section = customs.find((c) => c.id === id);
          return (
            <CustomSectionBlock
              key={key}
              section={section}
              Heading={Heading}
            />
          );
        }
        if (!isBuiltinSectionId(key)) return null;

        switch (key) {
          case "summary":
            if (!data.summary?.trim()) return null;
            return (
              <section key={key} className={sectionClass}>
                <Heading>{summaryLabel ?? labels.summary}</Heading>
                <p className={summaryClassName ?? bodyTextClass}>
                  {data.summary}
                </p>
              </section>
            );
          case "competencies":
          case "technical": {
            if (skillsRendered) return null;
            skillsRendered = true;
            return (
              <SkillsSection
                key="skills"
                data={data}
                labels={labels}
                Heading={Heading}
                competenciesAsBullets={competenciesAsBullets}
              />
            );
          }
          case "experience":
            return (
              <ExperienceSection
                key={key}
                data={data}
                labels={labels}
                Heading={Heading}
                locale={locale}
              />
            );
          case "projects":
            return (
              <ProjectsSection
                key={key}
                data={data}
                labels={labels}
                Heading={Heading}
              />
            );
          case "education":
            return (
              <EducationSection
                key={key}
                data={data}
                labels={labels}
                Heading={Heading}
                locale={locale}
              />
            );
          case "certifications":
            return (
              <CertificationsSection
                key={key}
                data={data}
                labels={labels}
                Heading={Heading}
                includeCourses={!coursesSeparate}
              />
            );
          case "courses":
            return (
              <CoursesSection
                key={key}
                data={data}
                labels={labels}
                Heading={Heading}
              />
            );
          case "languages":
            return (
              <LanguagesSection
                key={key}
                data={data}
                labels={labels}
                Heading={Heading}
              />
            );
          case "references":
            return (
              <ReferencesSection
                key={key}
                data={data}
                labels={labels}
                Heading={Heading}
              />
            );
          default:
            return null;
        }
      })}
    </>
  );
}

function CustomSectionBlock({
  section,
  Heading,
}: {
  section: CustomSection | undefined;
  Heading: ComponentType<{ children: ReactNode }>;
}) {
  if (!section) return null;
  const heading = section.heading?.trim();
  const content = section.content?.trim();
  if (!heading && !content) return null;
  return (
    <section className={sectionClass}>
      {heading ? <Heading>{heading}</Heading> : null}
      {content ? (
        <p className={cn("whitespace-pre-wrap", bodyTextClass)}>
          {section.content}
        </p>
      ) : null}
    </section>
  );
}

function ExperienceSection({
  data,
  labels,
  Heading,
  locale,
}: {
  data: ResumeData;
  labels: Labels;
  Heading: ComponentType<{ children: ReactNode }>;
  locale: "en" | "ar";
}) {
  if (!data.experience?.length) return null;
  return (
    <section className={sectionClass}>
      <Heading>{labels.experience}</Heading>
      {data.experience.map((exp, i) => {
        const dateRange = formatResumeDateRange(
          exp.startDate,
          exp.endDate,
          exp.current,
          labels.present,
          locale
        );

        const companyLine = [exp.company, exp.location]
          .filter(Boolean)
          .join(" - ");
        const bullets = (exp.bullets || []).filter((b) => b.trim());

        return (
          <div key={i} className={entryClass}>
            <p className="text-[13px] font-bold leading-[1.55] text-black">
              {exp.title}
              {dateRange ? (
                <span className="font-normal text-slate-700">
                  {" | "}
                  {dateRange}
                </span>
              ) : null}
            </p>
            {companyLine ? (
              <p className="text-[13px] leading-[1.55] text-slate-500">
                {companyLine}
              </p>
            ) : null}
            {bullets.length > 0 ? (
              <ul className={bulletListClass}>
                {bullets.map((b, j) => (
                  <li key={j}>{b}</li>
                ))}
              </ul>
            ) : null}
          </div>
        );
      })}
    </section>
  );
}

function EducationSection({
  data,
  labels,
  Heading,
  locale,
}: {
  data: ResumeData;
  labels: Labels;
  Heading: ComponentType<{ children: ReactNode }>;
  locale: "en" | "ar";
}) {
  if (!data.education?.length) return null;
  return (
    <section className={sectionClass}>
      <Heading>{labels.education}</Heading>
      {data.education.map((edu, i) => {
        const institutionPart = [edu.institution, edu.location]
          .filter(Boolean)
          .join(", ");
        const main = [edu.degree, institutionPart].filter(Boolean).join(" - ");
        const years = edu.graduationDate
          ? ` (${formatResumeDate(edu.graduationDate, locale)})`
          : "";
        return (
          <div key={i} className={entryClass}>
            <p className={bodyTextClass}>
              <span className="font-bold text-black">{main}</span>
              {years}
              {edu.gpa ? ` | GPA: ${edu.gpa}` : ""}
            </p>
          </div>
        );
      })}
    </section>
  );
}

function ProjectsSection({
  data,
  labels,
  Heading,
}: {
  data: ResumeData;
  labels: Labels;
  Heading: ComponentType<{ children: ReactNode }>;
}) {
  if (!data.projects?.length) return null;
  return (
    <section className={sectionClass}>
      <Heading>{labels.projects}</Heading>
      {data.projects.map((project, i) => {
        const outcomes = (project.outcomes || []).filter((o) => o.trim());
        return (
          <div key={i} className={entryClass}>
            <p className="text-[13px] font-bold leading-[1.55] text-black">
              {project.name}
              {project.url ? (
                <span className="font-normal text-slate-700">
                  {" | "}
                  {project.url}
                </span>
              ) : null}
            </p>
            {project.description?.trim() ? (
              <p className={bodyTextClass}>{project.description}</p>
            ) : null}
            {project.technologies && project.technologies.length > 0 ? (
              <p className="mt-0.5 text-[12px] leading-[1.55] text-slate-600">
                {project.technologies.filter((t) => t.trim()).join(" • ")}
              </p>
            ) : null}
            {outcomes.length > 0 ? (
              <ul className={bulletListClass}>
                {outcomes.map((outcome, j) => (
                  <li key={j}>{outcome}</li>
                ))}
              </ul>
            ) : null}
          </div>
        );
      })}
    </section>
  );
}

function CertificationsSection({
  data,
  labels,
  Heading,
  includeCourses = true,
}: {
  data: ResumeData;
  labels: Labels;
  Heading: ComponentType<{ children: ReactNode }>;
  includeCourses?: boolean;
}) {
  const certs = normalizeCertifications(data.certifications).filter((c) =>
    c.name.trim()
  );
  const courses = includeCourses
    ? (data.courses ?? []).filter((c) => c.trim())
    : [];
  if (!certs.length && !courses.length) return null;

  return (
    <section className={sectionClass}>
      <Heading>{labels.certifications}</Heading>
      <ul className={bulletListClass}>
        {certs.map((cert, i) => (
          <li key={`cert-${i}`}>
            {cert.url ? (
              <a
                href={cert.url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2"
              >
                {cert.name}
              </a>
            ) : (
              cert.name
            )}
          </li>
        ))}
        {courses.map((course, i) => (
          <li key={`course-${i}`}>{course}</li>
        ))}
      </ul>
    </section>
  );
}

function CoursesSection({
  data,
  labels,
  Heading,
}: {
  data: ResumeData;
  labels: Labels;
  Heading: ComponentType<{ children: ReactNode }>;
}) {
  const courses = (data.courses ?? []).filter((c) => c.trim());
  if (!courses.length) return null;
  return (
    <section className={sectionClass}>
      <Heading>{labels.courses}</Heading>
      <ul className={bulletListClass}>
        {courses.map((course, i) => (
          <li key={i}>{course}</li>
        ))}
      </ul>
    </section>
  );
}

function LanguagesSection({
  data,
  labels,
  Heading,
}: {
  data: ResumeData;
  labels: Labels;
  Heading: ComponentType<{ children: ReactNode }>;
}) {
  if (!data.languages?.length) return null;
  const langs = data.languages.filter((l) => l.trim());
  if (!langs.length) return null;
  return (
    <section className={sectionClass}>
      <Heading>{labels.languages}</Heading>
      <ul className={bulletListClass}>
        {langs.map((lang, i) => (
          <li key={i}>{lang}</li>
        ))}
      </ul>
    </section>
  );
}

function SkillsSection({
  data,
  labels,
  Heading,
  competenciesAsBullets,
}: {
  data: ResumeData;
  labels: Labels;
  Heading: ComponentType<{ children: ReactNode }>;
  competenciesAsBullets?: boolean;
}) {
  const skills = normalizeResumeSkills(data.skills);
  const competencies = skills.competencies.filter((s) => s.trim());
  const technical = skills.technical.filter((s) => s.trim());
  const soft = skills.soft.filter((s) => s.trim());

  if (!competencies.length && !technical.length && !soft.length) return null;

  const renderSkillGroup = (
    title: string,
    items: string[],
    asBullets: boolean
  ) => (
    <div className={skillGroupClass}>
      <p className={skillSubheadClass}>{title}</p>
      {asBullets ? (
        <ul className={bulletListClass}>
          {items.map((skill, i) => (
            <li key={i}>{skill}</li>
          ))}
        </ul>
      ) : (
        <p className={bodyTextClass}>{items.join(" • ")}</p>
      )}
    </div>
  );

  return (
    <section className={sectionClass}>
      <Heading>{labels.skills}</Heading>
      {competencies.length > 0 &&
        renderSkillGroup(
          labels.coreCompetencies,
          competencies,
          !!competenciesAsBullets
        )}
      {technical.length > 0 &&
        renderSkillGroup(labels.technicalSkills, technical, false)}
      {soft.length > 0 && renderSkillGroup(labels.softSkills, soft, false)}
    </section>
  );
}

function ReferencesSection({
  data,
  labels,
  Heading,
}: {
  data: ResumeData;
  labels: Labels;
  Heading: ComponentType<{ children: ReactNode }>;
}) {
  const refs = normalizeReferences(data.references);
  if (!refs.length) return null;

  const formatRef = (r: Reference) => {
    const role = [r.title, r.company].filter(Boolean).join(", ");
    const head = role ? `${r.name} - ${role}` : r.name;
    const contact = [r.phone, r.email].filter(Boolean).join(" | ");
    return contact ? `${head} | ${contact}` : head;
  };

  return (
    <section className={sectionClass}>
      <Heading>{labels.references}</Heading>
      <ul className={bulletListClass}>
        {refs.map((r, i) => (
          <li key={i}>{formatRef(r)}</li>
        ))}
      </ul>
    </section>
  );
}

/** Black underline ALL CAPS — matches both sample PDFs */
function AtsSectionHeading({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h2
      className={cn(
        "resume-section-heading mb-2 border-b border-black pb-0.5 text-[12px] font-bold uppercase tracking-[0.06em] text-black",
        className
      )}
    >
      {children}
    </h2>
  );
}

function ClassicHeading({ children }: { children: ReactNode }) {
  return <AtsSectionHeading>{children}</AtsSectionHeading>;
}

function ModernHeading({ children }: { children: ReactNode }) {
  return (
    <AtsSectionHeading className="border-[#002b49] tracking-[0.12em] text-[#002b49]">
      {children}
    </AtsSectionHeading>
  );
}

function MinimalHeading({ children }: { children: ReactNode }) {
  return (
    <AtsSectionHeading className="border-slate-400 font-semibold tracking-[0.14em] text-slate-700">
      {children}
    </AtsSectionHeading>
  );
}

function ExecutiveHeading({ children }: { children: ReactNode }) {
  return (
    <AtsSectionHeading className="border-b-[1.5px] border-black">
      {children}
    </AtsSectionHeading>
  );
}

function CreativeHeading({ children }: { children: ReactNode }) {
  return (
    <AtsSectionHeading className="border-[#1db4ce] text-[#002b49]">
      {children}
    </AtsSectionHeading>
  );
}

/** Classic — ATS sample layout (uppercase name). */
export function ClassicTemplate({ data, locale = "en" }: TemplateProps) {
  const labels = getLabels(locale);
  return (
    <div className="resume-template mx-auto max-w-[800px] bg-white px-9 py-8 font-sans text-black">
      <AtsHeader contact={data.contact} nameUppercase />
      <ResumeBody
        data={data}
        labels={labels}
        Heading={ClassicHeading}
        locale={locale}
      />
    </div>
  );
}

/** Modern — same ATS structure, navy accents. */
export function ModernTemplate({ data, locale = "en" }: TemplateProps) {
  const labels = getLabels(locale);
  return (
    <div className="resume-template mx-auto max-w-[800px] bg-white px-9 py-8 font-sans text-black">
      <AtsHeader
        contact={data.contact}
        nameClassName="text-[#002b49]"
        headlineClassName="text-slate-700"
      />
      <ResumeBody
        data={data}
        labels={labels}
        Heading={ModernHeading}
        locale={locale}
      />
    </div>
  );
}

/** Minimal — more whitespace, same ATS content rules. */
export function MinimalTemplate({ data, locale = "en" }: TemplateProps) {
  const labels = getLabels(locale);
  return (
    <div className="resume-template mx-auto max-w-[800px] bg-white px-10 py-10 font-sans text-black">
      <AtsHeader
        contact={data.contact}
        className="mb-7"
        nameClassName="text-[28px] font-semibold tracking-tight"
      />
      <ResumeBody
        data={data}
        labels={labels}
        Heading={MinimalHeading}
        locale={locale}
      />
    </div>
  );
}

/** Executive — Executive Summary + bullet core competencies. */
export function ExecutiveTemplate({ data, locale = "en" }: TemplateProps) {
  const labels = getLabels(locale);
  return (
    <div className="resume-template mx-auto max-w-[800px] bg-white px-9 py-8 font-sans text-black">
      <AtsHeader contact={data.contact} />
      <ResumeBody
        data={data}
        labels={labels}
        Heading={ExecutiveHeading}
        locale={locale}
        summaryLabel={labels.executiveSummary}
        competenciesAsBullets
      />
    </div>
  );
}

/** Creative — ATS structure with cyan section rules only. */
export function CreativeTemplate({ data, locale = "en" }: TemplateProps) {
  const labels = getLabels(locale);
  return (
    <div className="resume-template mx-auto max-w-[800px] bg-white px-9 py-8 font-sans text-black">
      <AtsHeader
        contact={data.contact}
        nameClassName="text-[#002b49]"
        headlineClassName="text-slate-700"
      />
      <ResumeBody
        data={data}
        labels={labels}
        Heading={CreativeHeading}
        locale={locale}
      />
    </div>
  );
}
