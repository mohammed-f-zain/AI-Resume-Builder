import type { ComponentType, ReactNode } from "react";
import type { ContactInfo, ResumeData } from "@/lib/types";
import {
  hasAnySkills,
  normalizeCertifications,
  normalizeResumeSkills,
} from "@/lib/types";
import { cn } from "@/lib/utils";

interface TemplateProps {
  data: ResumeData;
  locale?: "en" | "ar";
}

/**
 * Layout modeled on the sample ATS PDFs (HR Qatar + Executive roles):
 * - Name + headline + Location • Phone • Email • LinkedIn
 * - ALL CAPS section headings with underline
 * - Title on its own line; Company | Location | Dates below
 * - Core Competencies as •-joined text (or bullet list)
 */

const sectionLabels = {
  en: {
    summary: "Professional Summary",
    executiveSummary: "Executive Summary",
    experience: "Professional Experience",
    education: "Education",
    skills: "Professional Skills",
    technicalSkills: "Technical Skills",
    softSkills: "Soft Skills",
    coreCompetencies: "Core Competencies",
    projects: "Projects",
    certifications: "Certifications",
    languages: "Languages",
    present: "Present",
  },
  ar: {
    summary: "الملخص المهني",
    executiveSummary: "الملخص التنفيذي",
    experience: "الخبرة المهنية",
    education: "التعليم",
    skills: "المهارات المهنية",
    technicalSkills: "المهارات التقنية",
    softSkills: "المهارات الشخصية",
    coreCompetencies: "الكفاءات الأساسية",
    projects: "المشاريع",
    certifications: "الشهادات",
    languages: "اللغات",
    present: "حتى الآن",
  },
};

type Labels = (typeof sectionLabels)["en"];

function getLabels(locale: "en" | "ar") {
  return sectionLabels[locale];
}

/** PDF contact order: Location • Phone • Email • LinkedIn • GitHub • Website */
function ContactBulletLine({
  contact,
  className,
  align = "start",
}: {
  contact: ContactInfo;
  className?: string;
  align?: "start" | "center";
}) {
  const parts = [
    contact.location,
    contact.phone,
    contact.email,
    contact.linkedin,
    contact.github,
    contact.website,
  ].filter(Boolean) as string[];

  if (!parts.length) return null;

  return (
    <p
      className={cn(
        "text-[13px] leading-relaxed text-slate-700",
        align === "center" && "text-center",
        className
      )}
    >
      {parts.join(" • ")}
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

type ExperienceLayout = "two-line" | "inline";

function ResumeBody({
  data,
  labels,
  Heading,
  summaryClassName,
  summaryLabel,
  skillsAsCompetencies,
  competenciesAsBullets,
  experienceLayout = "two-line",
}: {
  data: ResumeData;
  labels: Labels;
  Heading: ComponentType<{ children: ReactNode }>;
  summaryClassName?: string;
  summaryLabel?: string;
  skillsAsCompetencies?: boolean;
  competenciesAsBullets?: boolean;
  experienceLayout?: ExperienceLayout;
}) {
  return (
    <>
      {data.summary && (
        <section className="mb-4">
          <Heading>{summaryLabel ?? labels.summary}</Heading>
          <p
            className={
              summaryClassName ??
              "text-[13px] leading-[1.55] text-slate-800"
            }
          >
            {data.summary}
          </p>
        </section>
      )}
      <SkillsSection
        data={data}
        labels={labels}
        Heading={Heading}
        asCompetencies={skillsAsCompetencies}
        asBullets={competenciesAsBullets}
      />
      <ExperienceSection
        data={data}
        labels={labels}
        Heading={Heading}
        layout={experienceLayout}
      />
      <ProjectsSection data={data} labels={labels} Heading={Heading} />
      <EducationSection data={data} labels={labels} Heading={Heading} />
      <CertificationsSection data={data} labels={labels} Heading={Heading} />
      <LanguagesSection data={data} labels={labels} Heading={Heading} />
    </>
  );
}

function ExperienceSection({
  data,
  labels,
  Heading,
  layout,
}: {
  data: ResumeData;
  labels: Labels;
  Heading: ComponentType<{ children: ReactNode }>;
  layout: ExperienceLayout;
}) {
  if (!data.experience?.length) return null;
  return (
    <section className="mb-4">
      <Heading>{labels.experience}</Heading>
      {data.experience.map((exp, i) => {
        const dateRange = [
          exp.startDate,
          exp.current ? labels.present : exp.endDate,
        ]
          .filter(Boolean)
          .join(" – ");

        return (
          <div key={i} className="resume-entry mb-3.5">
            {layout === "two-line" ? (
              <>
                {/* Executive PDF: Title then Company | Location | Dates */}
                <p className="text-[13px] font-bold text-black">{exp.title}</p>
                <p className="text-[13px] text-slate-800">
                  {[exp.company, exp.location, dateRange]
                    .filter(Boolean)
                    .join(" | ")}
                </p>
              </>
            ) : (
              /* HR Qatar PDF: Title — Company | Dates */
              <p className="text-[13px] font-bold text-black">
                {exp.title}
                {exp.company ? (
                  <span className="font-semibold">
                    {" — "}
                    {exp.company}
                  </span>
                ) : null}
                {dateRange ? (
                  <span className="font-normal text-slate-700">
                    {" | "}
                    {dateRange}
                  </span>
                ) : null}
              </p>
            )}
            {exp.bullets?.length > 0 && (
              <ul className="mt-1 list-disc space-y-0.5 ps-5 text-[13px] leading-[1.5] text-slate-800">
                {exp.bullets.map((b, j) => (
                  <li key={j}>{b}</li>
                ))}
              </ul>
            )}
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
}: {
  data: ResumeData;
  labels: Labels;
  Heading: ComponentType<{ children: ReactNode }>;
}) {
  if (!data.education?.length) return null;
  return (
    <section className="mb-4">
      <Heading>{labels.education}</Heading>
      {data.education.map((edu, i) => (
        <div key={i} className="resume-entry mb-2.5">
          {/* PDF: Degree on line 1; Institution | Year on line 2 */}
          <p className="text-[13px] font-bold text-black">{edu.degree}</p>
          <p className="text-[13px] text-slate-800">
            {[edu.institution, edu.graduationDate].filter(Boolean).join(" | ")}
            {edu.gpa ? ` | GPA: ${edu.gpa}` : ""}
          </p>
        </div>
      ))}
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
    <section className="mb-4">
      <Heading>{labels.projects}</Heading>
      {data.projects.map((project, i) => (
        <div key={i} className="resume-entry mb-3">
          <p className="text-[13px] font-bold text-black">
            {project.name}
            {project.url ? (
              <span className="font-normal text-slate-700">
                {" | "}
                {project.url}
              </span>
            ) : null}
          </p>
          {project.description && (
            <p className="text-[13px] text-slate-800">{project.description}</p>
          )}
          {project.technologies && project.technologies.length > 0 && (
            <p className="mt-0.5 text-[12px] text-slate-600">
              {project.technologies.join(" • ")}
            </p>
          )}
          {project.outcomes?.length > 0 && (
            <ul className="mt-1 list-disc space-y-0.5 ps-5 text-[13px] leading-[1.5] text-slate-800">
              {project.outcomes.map((outcome, j) => (
                <li key={j}>{outcome}</li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </section>
  );
}

function CertificationsSection({
  data,
  labels,
  Heading,
}: {
  data: ResumeData;
  labels: Labels;
  Heading: ComponentType<{ children: ReactNode }>;
}) {
  const certs = normalizeCertifications(data.certifications);
  const courses = data.courses ?? [];
  if (!certs.length && !courses.length) return null;

  return (
    <section className="mb-4">
      <Heading>{labels.certifications}</Heading>
      <ul className="list-disc space-y-0.5 ps-5 text-[13px] text-slate-800">
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
  return (
    <section className="mb-4">
      <Heading>{labels.languages}</Heading>
      <p className="text-[13px] text-slate-800">{data.languages.join(" • ")}</p>
    </section>
  );
}

function SkillsSection({
  data,
  labels,
  Heading,
  asCompetencies,
  asBullets,
}: {
  data: ResumeData;
  labels: Labels;
  Heading: ComponentType<{ children: ReactNode }>;
  asCompetencies?: boolean;
  asBullets?: boolean;
}) {
  const skills = normalizeResumeSkills(data.skills);
  if (!hasAnySkills(skills)) return null;

  const all = [...skills.technical, ...skills.soft].filter(Boolean);

  if (asCompetencies) {
    return (
      <section className="mb-4">
        <Heading>{labels.coreCompetencies}</Heading>
        {asBullets ? (
          <ul className="list-disc space-y-0.5 ps-5 text-[13px] leading-[1.5] text-slate-800">
            {all.map((skill, i) => (
              <li key={i}>{skill}</li>
            ))}
          </ul>
        ) : (
          /* HR Qatar style: flowing • separators */
          <p className="text-[13px] leading-[1.55] text-slate-800">
            {all.join(" • ")}
          </p>
        )}
      </section>
    );
  }

  return (
    <section className="mb-4">
      <Heading>{labels.skills}</Heading>
      {skills.technical.length > 0 && (
        <p className="mb-1 text-[13px] text-slate-800">
          <span className="font-semibold">{labels.technicalSkills}: </span>
          {skills.technical.join(" • ")}
        </p>
      )}
      {skills.soft.length > 0 && (
        <p className="text-[13px] text-slate-800">
          <span className="font-semibold">{labels.softSkills}: </span>
          {skills.soft.join(" • ")}
        </p>
      )}
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

/** Classic — closest to HR Qatar ATS sample (uppercase name, inline experience). */
export function ClassicTemplate({ data, locale = "en" }: TemplateProps) {
  const labels = getLabels(locale);
  return (
    <div className="resume-template mx-auto max-w-[800px] bg-white px-9 py-8 font-sans text-black">
      <AtsHeader contact={data.contact} nameUppercase />
      <ResumeBody
        data={data}
        labels={labels}
        Heading={ClassicHeading}
        skillsAsCompetencies
        experienceLayout="inline"
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
        skillsAsCompetencies
        experienceLayout="two-line"
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
        skillsAsCompetencies
        experienceLayout="inline"
      />
    </div>
  );
}

/** Executive — closest to Executive ATS sample (two-line jobs, bullet competencies). */
export function ExecutiveTemplate({ data, locale = "en" }: TemplateProps) {
  const labels = getLabels(locale);
  return (
    <div className="resume-template mx-auto max-w-[800px] bg-white px-9 py-8 font-sans text-black">
      <AtsHeader contact={data.contact} />
      <ResumeBody
        data={data}
        labels={labels}
        Heading={ExecutiveHeading}
        summaryLabel={labels.executiveSummary}
        skillsAsCompetencies
        competenciesAsBullets
        experienceLayout="two-line"
      />
    </div>
  );
}

/** Creative — ATS structure with cyan section rules only (no fill backgrounds). */
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
        skillsAsCompetencies
        experienceLayout="inline"
      />
    </div>
  );
}
