import type { ComponentType, ReactNode } from "react";
import type { ResumeData } from "@/lib/types";
import {
  hasAnySkills,
  normalizeCertifications,
  normalizeResumeSkills,
} from "@/lib/types";
import { ContactLinks } from "@/components/resume/ContactLinks";

interface TemplateProps {
  data: ResumeData;
  locale?: "en" | "ar";
}

const sectionLabels = {
  en: {
    summary: "Professional Summary",
    experience: "Professional Experience",
    education: "Education",
    skills: "Professional Skills",
    technicalSkills: "Technical Skills",
    softSkills: "Soft Skills",
    projects: "Projects",
    certifications: "Certifications & Courses",
    languages: "Languages",
    present: "Present",
  },
  ar: {
    summary: "الملخص المهني",
    experience: "الخبرة المهنية",
    education: "التعليم",
    skills: "المهارات المهنية",
    technicalSkills: "المهارات التقنية",
    softSkills: "المهارات الشخصية",
    projects: "المشاريع",
    certifications: "الشهادات والدورات",
    languages: "اللغات",
    present: "حتى الآن",
  },
};

type Labels = (typeof sectionLabels)["en"];

function getLabels(locale: "en" | "ar") {
  return sectionLabels[locale];
}

/** Shared ATS section body — Summary → Skills → Experience → Projects → Education → Certs → Languages */
function ResumeBody({
  data,
  labels,
  Heading,
  summaryClassName,
}: {
  data: ResumeData;
  labels: Labels;
  Heading: ComponentType<{ children: ReactNode }>;
  summaryClassName?: string;
}) {
  return (
    <>
      {data.summary && (
        <section className="mb-5">
          <Heading>{labels.summary}</Heading>
          <p className={summaryClassName ?? "text-sm leading-relaxed text-slate-700"}>
            {data.summary}
          </p>
        </section>
      )}
      <SkillsSection data={data} labels={labels} Heading={Heading} />
      <ExperienceSection data={data} labels={labels} Heading={Heading} />
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
}: {
  data: ResumeData;
  labels: Labels;
  Heading: ComponentType<{ children: ReactNode }>;
}) {
  if (!data.experience?.length) return null;
  return (
    <section className="mb-5">
      <Heading>{labels.experience}</Heading>
      {data.experience.map((exp, i) => (
        <div key={i} className="resume-entry mb-3">
          <div className="flex justify-between items-baseline gap-2">
            <h3 className="font-semibold">{exp.title}</h3>
            <span className="shrink-0 text-sm text-slate-600">
              {exp.startDate} – {exp.current ? labels.present : exp.endDate}
            </span>
          </div>
          <p className="text-sm text-slate-700">
            {exp.company}
            {exp.location ? `, ${exp.location}` : ""}
          </p>
          <ul className="mt-1 list-disc ps-5 text-sm text-slate-700">
            {exp.bullets.map((b, j) => (
              <li key={j}>{b}</li>
            ))}
          </ul>
        </div>
      ))}
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
    <section className="mb-5">
      <Heading>{labels.education}</Heading>
      {data.education.map((edu, i) => (
        <div key={i} className="resume-entry mb-2">
          <div className="flex justify-between gap-2">
            <h3 className="font-semibold">{edu.degree}</h3>
            <span className="shrink-0 text-sm text-slate-600">{edu.graduationDate}</span>
          </div>
          <p className="text-sm text-slate-700">
            {edu.institution}
            {edu.gpa ? ` — GPA: ${edu.gpa}` : ""}
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
    <section className="mb-5">
      <Heading>{labels.projects}</Heading>
      {data.projects.map((project, i) => (
        <div key={i} className="resume-entry mb-3">
          <div className="flex justify-between items-baseline gap-2">
            <h3 className="font-semibold">{project.name}</h3>
            {project.url && (
              <span className="shrink-0 text-sm text-slate-600">{project.url}</span>
            )}
          </div>
          {project.description && (
            <p className="text-sm text-slate-700">{project.description}</p>
          )}
          {project.technologies && project.technologies.length > 0 && (
            <p className="mt-0.5 text-xs text-slate-500">
              {project.technologies.join(" · ")}
            </p>
          )}
          {project.outcomes?.length > 0 && (
            <ul className="mt-1 list-disc ps-5 text-sm text-slate-700">
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
    <section className="mb-5">
      <Heading>{labels.certifications}</Heading>
      <ul className="list-disc space-y-1 ps-5 text-sm text-slate-700">
        {certs.map((cert, i) => (
          <li key={`cert-${i}`}>
            {cert.url ? (
              <a
                href={cert.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#002b49] underline underline-offset-2 hover:text-[#1db4ce]"
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
    <section className="mb-5">
      <Heading>{labels.languages}</Heading>
      <p className="text-sm text-slate-700">{data.languages.join(" · ")}</p>
    </section>
  );
}

function SkillsSection({
  data,
  labels,
  Heading,
}: {
  data: ResumeData;
  labels: Labels;
  Heading: ComponentType<{ children: ReactNode }>;
}) {
  const skills = normalizeResumeSkills(data.skills);
  if (!hasAnySkills(skills)) return null;

  return (
    <section className="mb-5">
      <Heading>{labels.skills}</Heading>
      {skills.technical.length > 0 && (
        <p className="mb-1 text-sm text-slate-700">
          <span className="font-semibold">{labels.technicalSkills}: </span>
          {skills.technical.join(" • ")}
        </p>
      )}
      {skills.soft.length > 0 && (
        <p className="text-sm text-slate-700">
          <span className="font-semibold">{labels.softSkills}: </span>
          {skills.soft.join(" • ")}
        </p>
      )}
    </section>
  );
}

function ClassicHeading({ children }: { children: ReactNode }) {
  return (
    <h2 className="resume-section-heading mb-2 border-b-2 border-slate-800 pb-1 text-sm font-bold uppercase tracking-wide">
      {children}
    </h2>
  );
}

function ModernHeading({ children }: { children: ReactNode }) {
  return (
    <h2 className="resume-section-heading mb-2 border-b-2 border-[#1db4ce] pb-1 font-sans text-xs font-bold uppercase tracking-[0.18em] text-[#002b49]">
      {children}
    </h2>
  );
}

function MinimalHeading({ children }: { children: ReactNode }) {
  return (
    <h2 className="resume-section-heading mb-2 border-b border-slate-200 pb-1 text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
      {children}
    </h2>
  );
}

function ExecutiveHeading({ children }: { children: ReactNode }) {
  return (
    <h2 className="resume-section-heading mb-2 border-b-2 border-[#002b49] pb-1 text-sm font-bold uppercase tracking-wide text-slate-900">
      {children}
    </h2>
  );
}

function CreativeHeading({ children }: { children: ReactNode }) {
  return (
    <h2 className="resume-section-heading mb-2 border-b-2 border-[#1db4ce] pb-1 text-sm font-bold uppercase tracking-wide text-[#002b49]">
      {children}
    </h2>
  );
}

export function ClassicTemplate({ data, locale = "en" }: TemplateProps) {
  const labels = getLabels(locale);
  return (
    <div className="resume-template mx-auto max-w-[800px] bg-white p-8 font-serif text-slate-900">
      <div className="resume-header mb-6 border-b border-slate-300 pb-4 text-center">
        <h1 className="text-2xl font-bold tracking-tight">{data.contact.fullName}</h1>
        <ContactLinks contact={data.contact} variant="light" className="mt-2" />
      </div>
      <ResumeBody data={data} labels={labels} Heading={ClassicHeading} />
    </div>
  );
}

/** Modern: no fill backgrounds — navy/cyan lines + sans typography only (ATS-readable). */
export function ModernTemplate({ data, locale = "en" }: TemplateProps) {
  const labels = getLabels(locale);
  return (
    <div className="resume-template mx-auto max-w-[800px] bg-white p-8 font-sans text-slate-900">
      <div className="resume-header mb-6 border-b-2 border-[#002b49] pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-[#002b49]">
          {data.contact.fullName}
        </h1>
        <ContactLinks contact={data.contact} variant="accent" className="mt-2" />
        <div className="mt-3 w-16 border-t-2 border-[#1db4ce]" aria-hidden />
      </div>
      <ResumeBody data={data} labels={labels} Heading={ModernHeading} />
    </div>
  );
}

export function MinimalTemplate({ data, locale = "en" }: TemplateProps) {
  const labels = getLabels(locale);
  return (
    <div className="resume-template mx-auto max-w-[800px] bg-white p-10 font-sans">
      <div className="resume-header mb-8">
        <h1 className="text-3xl font-light text-slate-900">{data.contact.fullName}</h1>
        <ContactLinks
          contact={data.contact}
          variant="accent"
          className="mt-2"
          layout="stack"
        />
      </div>
      <ResumeBody
        data={data}
        labels={labels}
        Heading={MinimalHeading}
        summaryClassName="border-s-2 border-slate-200 ps-4 text-sm leading-relaxed text-slate-600"
      />
    </div>
  );
}

/** ATS single-column executive look — navy accent line + bold headings (no sidebar). */
export function ExecutiveTemplate({ data, locale = "en" }: TemplateProps) {
  const labels = getLabels(locale);
  return (
    <div className="resume-template mx-auto max-w-[800px] bg-white font-sans">
      <div className="h-1.5 bg-[#002b49]" />
      <div className="p-8">
        <div className="resume-header mb-6 border-b-2 border-[#002b49] pb-4">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {data.contact.fullName}
          </h1>
          <ContactLinks contact={data.contact} variant="light" className="mt-2" />
        </div>
        <ResumeBody data={data} labels={labels} Heading={ExecutiveHeading} />
      </div>
    </div>
  );
}

export function CreativeTemplate({ data, locale = "en" }: TemplateProps) {
  const labels = getLabels(locale);
  return (
    <div className="resume-template mx-auto max-w-[800px] bg-white font-sans">
      <div className="h-2 bg-gradient-to-r from-[#002b49] via-[#1db4ce] to-[#002b49]" />
      <div className="p-8">
        <div className="resume-header mb-6">
          <h1 className="text-2xl font-bold text-slate-900">{data.contact.fullName}</h1>
          <ContactLinks contact={data.contact} variant="accent" className="mt-2" />
        </div>
        <ResumeBody data={data} labels={labels} Heading={CreativeHeading} />
      </div>
    </div>
  );
}
