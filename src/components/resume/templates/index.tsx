import type { ResumeData } from "@/lib/types";
import { ContactLinks } from "@/components/resume/ContactLinks";

interface TemplateProps {
  data: ResumeData;
  locale?: "en" | "ar";
}

const sectionLabels = {
  en: {
    summary: "Professional Summary",
    experience: "Experience",
    education: "Education",
    skills: "Skills",
    projects: "Projects",
    certifications: "Certifications & Courses",
    languages: "Languages",
    present: "Present",
  },
  ar: {
    summary: "الملخص المهني",
    experience: "الخبرة العملية",
    education: "التعليم",
    skills: "المهارات",
    projects: "المشاريع",
    certifications: "الشهادات والدورات",
    languages: "اللغات",
    present: "حتى الآن",
  },
};

function getLabels(locale: "en" | "ar") {
  return sectionLabels[locale];
}

function ExperienceSection({
  data,
  labels,
}: {
  data: ResumeData;
  labels: (typeof sectionLabels)["en"];
}) {
  if (!data.experience?.length) return null;
  return (
    <section className="mb-5">
      <h2 className="mb-2 border-b-2 border-slate-800 pb-1 text-sm font-bold uppercase tracking-wide">
        {labels.experience}
      </h2>
      {data.experience.map((exp, i) => (
        <div key={i} className="mb-3">
          <div className="flex justify-between items-baseline">
            <h3 className="font-semibold">{exp.title}</h3>
            <span className="text-sm text-slate-600">
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
}: {
  data: ResumeData;
  labels: (typeof sectionLabels)["en"];
}) {
  if (!data.education?.length) return null;
  return (
    <section className="mb-5">
      <h2 className="mb-2 border-b-2 border-slate-800 pb-1 text-sm font-bold uppercase tracking-wide">
        {labels.education}
      </h2>
      {data.education.map((edu, i) => (
        <div key={i} className="mb-2">
          <div className="flex justify-between">
            <h3 className="font-semibold">{edu.degree}</h3>
            <span className="text-sm text-slate-600">{edu.graduationDate}</span>
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
}: {
  data: ResumeData;
  labels: (typeof sectionLabels)["en"];
}) {
  if (!data.projects?.length) return null;
  return (
    <section className="mb-5">
      <h2 className="mb-2 border-b-2 border-slate-800 pb-1 text-sm font-bold uppercase tracking-wide">
        {labels.projects}
      </h2>
      {data.projects.map((project, i) => (
        <div key={i} className="mb-3">
          <div className="flex justify-between items-baseline">
            <h3 className="font-semibold">{project.name}</h3>
            {project.url && (
              <span className="text-sm text-slate-600">{project.url}</span>
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
}: {
  data: ResumeData;
  labels: (typeof sectionLabels)["en"];
}) {
  const certs = data.certifications ?? [];
  const courses = data.courses ?? [];
  if (!certs.length && !courses.length) return null;

  return (
    <section className="mb-5">
      <h2 className="mb-2 border-b-2 border-slate-800 pb-1 text-sm font-bold uppercase tracking-wide">
        {labels.certifications}
      </h2>
      <ul className="list-disc ps-5 text-sm text-slate-700 space-y-1">
        {certs.map((cert, i) => (
          <li key={`cert-${i}`}>{cert}</li>
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
}: {
  data: ResumeData;
  labels: (typeof sectionLabels)["en"];
}) {
  if (!data.languages?.length) return null;
  return (
    <section className="mb-5">
      <h2 className="mb-2 border-b-2 border-slate-800 pb-1 text-sm font-bold uppercase tracking-wide">
        {labels.languages}
      </h2>
      <p className="text-sm text-slate-700">{data.languages.join(" · ")}</p>
    </section>
  );
}

function SkillsSection({
  data,
  labels,
}: {
  data: ResumeData;
  labels: (typeof sectionLabels)["en"];
}) {
  if (!data.skills?.length) return null;
  return (
    <section className="mb-5">
      <h2 className="mb-2 border-b-2 border-slate-800 pb-1 text-sm font-bold uppercase tracking-wide">
        {labels.skills}
      </h2>
      <p className="text-sm text-slate-700">{data.skills.join(" • ")}</p>
    </section>
  );
}

export function ClassicTemplate({ data, locale = "en" }: TemplateProps) {
  const labels = getLabels(locale);
  return (
    <div className="resume-template bg-white p-8 text-slate-900 font-serif max-w-[800px] mx-auto">
      <div className="resume-header mb-6 text-center border-b border-slate-300 pb-4">
        <h1 className="text-2xl font-bold tracking-tight">{data.contact.fullName}</h1>
        <ContactLinks contact={data.contact} variant="light" className="mt-2" />
      </div>
      {data.summary && (
        <section className="mb-5">
          <h2 className="mb-2 border-b-2 border-slate-800 pb-1 text-sm font-bold uppercase tracking-wide">
            {labels.summary}
          </h2>
          <p className="text-sm leading-relaxed">{data.summary}</p>
        </section>
      )}
      <ExperienceSection data={data} labels={labels} />
      <ProjectsSection data={data} labels={labels} />
      <EducationSection data={data} labels={labels} />
      <SkillsSection data={data} labels={labels} />
      <CertificationsSection data={data} labels={labels} />
      <LanguagesSection data={data} labels={labels} />
    </div>
  );
}

export function ModernTemplate({ data, locale = "en" }: TemplateProps) {
  const labels = getLabels(locale);
  return (
    <div className="resume-template bg-white max-w-[800px] mx-auto overflow-hidden">
      <div className="resume-header bg-[#002b49] px-8 py-6 text-white">
        <h1 className="text-2xl font-bold">{data.contact.fullName}</h1>
        <ContactLinks
          contact={data.contact}
          variant="dark"
          className="mt-2"
        />
      </div>
      <div className="p-8 font-sans">
        {data.summary && (
          <section className="mb-6">
            <h2 className="mb-2 text-[#002b49] font-bold text-sm uppercase tracking-wider">
              {labels.summary}
            </h2>
            <p className="text-sm text-slate-700 leading-relaxed">{data.summary}</p>
          </section>
        )}
        <ExperienceSection data={data} labels={labels} />
        <ProjectsSection data={data} labels={labels} />
        <EducationSection data={data} labels={labels} />
        <SkillsSection data={data} labels={labels} />
        <CertificationsSection data={data} labels={labels} />
        <LanguagesSection data={data} labels={labels} />
      </div>
    </div>
  );
}

export function MinimalTemplate({ data, locale = "en" }: TemplateProps) {
  const labels = getLabels(locale);
  return (
    <div className="resume-template bg-white p-10 max-w-[800px] mx-auto font-sans">
      <div className="resume-header mb-8">
        <h1 className="text-3xl font-light text-slate-900">{data.contact.fullName}</h1>
        <ContactLinks contact={data.contact} variant="accent" className="mt-2" layout="stack" />
      </div>
      {data.summary && (
        <section className="mb-8">
          <p className="text-sm text-slate-600 leading-relaxed border-s-2 border-slate-200 ps-4">
            {data.summary}
          </p>
        </section>
      )}
      <ExperienceSection data={data} labels={labels} />
      <ProjectsSection data={data} labels={labels} />
      <EducationSection data={data} labels={labels} />
      <SkillsSection data={data} labels={labels} />
      <CertificationsSection data={data} labels={labels} />
      <LanguagesSection data={data} labels={labels} />
    </div>
  );
}

export function ExecutiveTemplate({ data, locale = "en" }: TemplateProps) {
  const labels = getLabels(locale);
  return (
    <div className="resume-template bg-white max-w-[800px] mx-auto flex font-sans">
      <aside className="w-1/3 bg-slate-900 text-white p-6">
        <h1 className="text-xl font-bold mb-4">{data.contact.fullName}</h1>
        <ContactLinks
          contact={data.contact}
          variant="dark"
          layout="stack"
        />
        {data.skills?.length > 0 && (
          <section className="mt-6">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#1db4ce] mb-2">
              {labels.skills}
            </h2>
            <ul className="text-sm space-y-1">
              {data.skills.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </section>
        )}
      </aside>
      <main className="w-2/3 p-6">
        {data.summary && (
          <section className="mb-5">
            <h2 className="text-sm font-bold uppercase text-slate-800 mb-2">
              {labels.summary}
            </h2>
            <p className="text-sm text-slate-700">{data.summary}</p>
          </section>
        )}
        <ExperienceSection data={data} labels={labels} />
        <ProjectsSection data={data} labels={labels} />
        <EducationSection data={data} labels={labels} />
        <CertificationsSection data={data} labels={labels} />
        <LanguagesSection data={data} labels={labels} />
      </main>
    </div>
  );
}

export function CreativeTemplate({ data, locale = "en" }: TemplateProps) {
  const labels = getLabels(locale);
  return (
    <div className="resume-template bg-white max-w-[800px] mx-auto font-sans">
      <div className="h-2 bg-gradient-to-r from-[#002b49] via-[#1db4ce] to-[#002b49]" />
      <div className="p-8">
        <div className="resume-header mb-6">
          <h1 className="text-2xl font-bold text-slate-900">{data.contact.fullName}</h1>
          <ContactLinks contact={data.contact} variant="accent" className="mt-2" />
        </div>
        {data.summary && (
          <section className="mb-6 rounded-lg bg-slate-50 p-4">
            <h2 className="text-xs font-bold uppercase text-[#002b49] mb-2">
              {labels.summary}
            </h2>
            <p className="text-sm text-slate-700">{data.summary}</p>
          </section>
        )}
        <ExperienceSection data={data} labels={labels} />
        <ProjectsSection data={data} labels={labels} />
        <EducationSection data={data} labels={labels} />
        <SkillsSection data={data} labels={labels} />
        <CertificationsSection data={data} labels={labels} />
        <LanguagesSection data={data} labels={labels} />
      </div>
    </div>
  );
}
