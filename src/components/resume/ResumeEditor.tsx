"use client";

import { useEffect, useRef, useState, type DragEvent, type ReactNode } from "react";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import { useLocale } from "@/contexts/LocaleContext";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input, Label, Textarea } from "@/components/ui/Input";
import { PhotoUpload } from "@/components/resume/PhotoUpload";
import type {
  BuiltinSectionId,
  CertificationItem,
  CustomSection,
  Education,
  Experience,
  Project,
  Reference,
  ResumeData,
} from "@/lib/types";
import {
  normalizeCertifications,
  normalizeReferences,
  normalizeResumeSkills,
} from "@/lib/types";
import {
  createCustomSectionId,
  customSectionIdFromKey,
  customSectionKey,
  getMissingBuiltinSections,
  isBuiltinSectionId,
  isCustomSectionKey,
  normalizeCustomSections,
  normalizeSectionOrder,
  seedBuiltinSection,
} from "@/lib/resume-sections";

interface ResumeEditorProps {
  data: ResumeData;
  onChange: (next: ResumeData) => void;
}

function emptyExperience(): Experience {
  return {
    title: "",
    company: "",
    location: "",
    startDate: "",
    endDate: "",
    current: false,
    bullets: [""],
  };
}

function emptyEducation(): Education {
  return {
    degree: "",
    institution: "",
    location: "",
    graduationDate: "",
    gpa: "",
  };
}

function emptyReference(): Reference {
  return {
    name: "",
    title: "",
    company: "",
    phone: "",
    email: "",
  };
}

function emptyProject(): Project {
  return {
    name: "",
    description: "",
    technologies: [],
    outcomes: [""],
  };
}

function builtinSectionLabelKey(
  id: BuiltinSectionId
):
  | "professionalSummary"
  | "coreCompetencies"
  | "workExperience"
  | "projects"
  | "education"
  | "certifications"
  | "technicalAdditional"
  | "languages"
  | "references"
  | "coursesSection" {
  switch (id) {
    case "summary":
      return "professionalSummary";
    case "competencies":
      return "coreCompetencies";
    case "experience":
      return "workExperience";
    case "projects":
      return "projects";
    case "education":
      return "education";
    case "certifications":
      return "certifications";
    case "technical":
      return "technicalAdditional";
    case "languages":
      return "languages";
    case "references":
      return "references";
    case "courses":
      return "coursesSection";
  }
}

export function ResumeEditor({
  data,
  onChange,
}: ResumeEditorProps) {
  const { t } = useLocale();
  const skills = normalizeResumeSkills(data.skills);
  const certs = normalizeCertifications(data.certifications);
  const experience = Array.isArray(data.experience) ? data.experience : [];
  const education = Array.isArray(data.education) ? data.education : [];
  const projects = Array.isArray(data.projects) ? data.projects : [];
  const languages = Array.isArray(data.languages) ? data.languages : [];
  const courses = Array.isArray(data.courses) ? data.courses : [];
  const references = normalizeReferences(data.references);
  const customSections = normalizeCustomSections(data.customSections);
  const sectionOrder = normalizeSectionOrder(data);
  const missingBuiltins = getMissingBuiltinSections({
    ...data,
    sectionOrder,
    customSections,
  });

  const [dragKey, setDragKey] = useState<string | null>(null);
  const [dropKey, setDropKey] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [pendingScrollKey, setPendingScrollKey] = useState<string | null>(null);
  const dragKeyRef = useRef<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const patch = (partial: Partial<ResumeData>) => {
    onChange({
      ...data,
      experience,
      education,
      projects,
      languages,
      courses,
      certifications: certs,
      skills,
      references,
      customSections,
      sectionOrder,
      ...partial,
    });
  };

  const setOrder = (next: string[]) => {
    patch({ sectionOrder: next });
  };

  const updateContact = <K extends keyof ResumeData["contact"]>(
    key: K,
    value: ResumeData["contact"][K]
  ) => {
    patch({ contact: { ...data.contact, [key]: value } });
  };

  const updateExperience = (index: number, next: Experience) => {
    const list = [...experience];
    list[index] = next;
    patch({ experience: list });
  };

  const updateEducation = (index: number, next: Education) => {
    const list = [...education];
    list[index] = next;
    patch({ education: list });
  };

  const updateProject = (index: number, next: Project) => {
    const list = [...projects];
    list[index] = next;
    patch({ projects: list });
  };

  const updateSkillList = (
    kind: "competencies" | "technical" | "soft",
    list: string[]
  ) => {
    patch({
      skills: {
        ...skills,
        [kind]: list,
      },
    });
  };

  const sectionTitle = (key: string): string => {
    if (isCustomSectionKey(key)) {
      const id = customSectionIdFromKey(key);
      const custom = customSections.find((c) => c.id === id);
      return custom?.heading?.trim() || t("customSection");
    }
    if (isBuiltinSectionId(key)) {
      return t(builtinSectionLabelKey(key));
    }
    return key;
  };

  const addBuiltin = (id: BuiltinSectionId) => {
    if (sectionOrder.includes(id)) {
      setAddOpen(false);
      setPendingScrollKey(id);
      return;
    }
    const seeded = seedBuiltinSection(data, id);
    patch({
      ...seeded,
      sectionOrder: [...sectionOrder, id],
    });
    setAddOpen(false);
    setPendingScrollKey(id);
  };

  const addCustom = () => {
    const id = createCustomSectionId();
    const key = customSectionKey(id);
    const next: CustomSection = { id, heading: "", content: "" };
    patch({
      customSections: [...customSections, next],
      sectionOrder: [...sectionOrder, key],
    });
    setAddOpen(false);
    setPendingScrollKey(key);
  };

  useEffect(() => {
    if (!pendingScrollKey) return;
    if (!sectionOrder.includes(pendingScrollKey)) return;

    const frame = requestAnimationFrame(() => {
      const el = scrollContainerRef.current?.querySelector(
        `[data-section-key="${CSS.escape(pendingScrollKey)}"]`
      );
      if (el instanceof HTMLElement) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        el.classList.add("ring-2", "ring-[#1db4ce]", "ring-offset-2");
        window.setTimeout(() => {
          el.classList.remove("ring-2", "ring-[#1db4ce]", "ring-offset-2");
        }, 1600);
      }
      setPendingScrollKey(null);
    });

    return () => cancelAnimationFrame(frame);
  }, [pendingScrollKey, sectionOrder]);

  const removeSection = (key: string) => {
    const nextOrder = sectionOrder.filter((k) => k !== key);
    if (isCustomSectionKey(key)) {
      const id = customSectionIdFromKey(key);
      patch({
        sectionOrder: nextOrder,
        customSections: customSections.filter((c) => c.id !== id),
      });
      return;
    }
    patch({ sectionOrder: nextOrder });
  };

  const updateCustom = (id: string, next: CustomSection) => {
    patch({
      customSections: customSections.map((c) => (c.id === id ? next : c)),
    });
  };

  const onDragStart = (key: string) => (e: DragEvent) => {
    dragKeyRef.current = key;
    setDragKey(key);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", key);
  };

  const onDragOver = (key: string) => (e: DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dropKey !== key) setDropKey(key);
  };

  const onDrop = (targetKey: string) => (e: DragEvent) => {
    e.preventDefault();
    const from = dragKeyRef.current || e.dataTransfer.getData("text/plain");
    setDragKey(null);
    setDropKey(null);
    dragKeyRef.current = null;
    if (!from || from === targetKey) return;
    const next = [...sectionOrder];
    const fromIdx = next.indexOf(from);
    const toIdx = next.indexOf(targetKey);
    if (fromIdx < 0 || toIdx < 0) return;
    next.splice(fromIdx, 1);
    next.splice(toIdx, 0, from);
    setOrder(next);
  };

  const onDragEnd = () => {
    setDragKey(null);
    setDropKey(null);
    dragKeyRef.current = null;
  };

  const renderBuiltinBody = (id: BuiltinSectionId): ReactNode => {
    switch (id) {
      case "summary":
        return (
          <Textarea
            className="mt-1 min-h-[100px]"
            value={data.summary}
            onChange={(e) => patch({ summary: e.target.value })}
          />
        );
      case "competencies":
        return (
          <SkillListEditor
            label={t("coreCompetencies")}
            skills={skills.competencies}
            onChange={(list) => updateSkillList("competencies", list)}
            addLabel={t("addSkill")}
            placeholder={t("skillPlaceholder")}
            removeLabel={t("remove")}
          />
        );
      case "technical":
        return (
          <div className="space-y-3">
            <SkillListEditor
              label={t("technicalSkills")}
              skills={skills.technical}
              onChange={(list) => updateSkillList("technical", list)}
              addLabel={t("addSkill")}
              placeholder={t("skillPlaceholder")}
              removeLabel={t("remove")}
            />
            <SkillListEditor
              label={t("softSkills")}
              skills={skills.soft}
              onChange={(list) => updateSkillList("soft", list)}
              addLabel={t("addSkill")}
              placeholder={t("skillPlaceholder")}
              removeLabel={t("remove")}
            />
          </div>
        );
      case "experience":
        return (
          <div className="space-y-3">
            <div className="flex justify-end">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  patch({ experience: [...experience, emptyExperience()] })
                }
              >
                <Plus className="h-4 w-4" />
                {t("add")}
              </Button>
            </div>
            {experience.map((exp, i) => (
              <div
                key={i}
                className="space-y-2 rounded-xl border border-[#e2e8f0] bg-[#f4f7fa]/40 p-3"
              >
                <div className="flex justify-end">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      patch({
                        experience: experience.filter((_, idx) => idx !== i),
                      })
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                    {t("remove")}
                  </Button>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  <div className="min-w-0">
                    <Label>{t("jobPosition")}</Label>
                    <Input
                      value={exp.title}
                      onChange={(e) =>
                        updateExperience(i, { ...exp, title: e.target.value })
                      }
                    />
                  </div>
                  <div className="min-w-0">
                    <Label>{t("company")}</Label>
                    <Input
                      value={exp.company}
                      onChange={(e) =>
                        updateExperience(i, {
                          ...exp,
                          company: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="min-w-0">
                    <Label>{t("location")}</Label>
                    <Input
                      value={exp.location || ""}
                      onChange={(e) =>
                        updateExperience(i, {
                          ...exp,
                          location: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="min-w-0">
                    <Label>{t("dateFrom")}</Label>
                    <Input
                      value={exp.startDate}
                      onChange={(e) =>
                        updateExperience(i, {
                          ...exp,
                          startDate: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="min-w-0">
                    <Label>{t("dateTo")}</Label>
                    <Input
                      value={exp.endDate}
                      disabled={!!exp.current}
                      onChange={(e) =>
                        updateExperience(i, {
                          ...exp,
                          endDate: e.target.value,
                        })
                      }
                    />
                  </div>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={!!exp.current}
                      onChange={(e) =>
                        updateExperience(i, {
                          ...exp,
                          current: e.target.checked,
                          endDate: e.target.checked ? "" : exp.endDate,
                        })
                      }
                    />
                    {t("currentlyWorking")}
                  </label>
                </div>
                <div className="space-y-2">
                  {(exp.bullets || []).map((bullet, j) => (
                    <div key={j} className="flex min-w-0 gap-2">
                      <Input
                        className="min-w-0 flex-1"
                        value={bullet}
                        onChange={(e) => {
                          const bullets = [...(exp.bullets || [])];
                          bullets[j] = e.target.value;
                          updateExperience(i, { ...exp, bullets });
                        }}
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="shrink-0"
                        onClick={() => {
                          const bullets = (exp.bullets || []).filter(
                            (_, idx) => idx !== j
                          );
                          updateExperience(i, {
                            ...exp,
                            bullets: bullets.length ? bullets : [""],
                          });
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      updateExperience(i, {
                        ...exp,
                        bullets: [...(exp.bullets || []), ""],
                      })
                    }
                  >
                    <Plus className="h-4 w-4" />
                    {t("addBullet")}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        );
      case "education":
        return (
          <div className="space-y-3">
            <div className="flex justify-end">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  patch({ education: [...education, emptyEducation()] })
                }
              >
                <Plus className="h-4 w-4" />
                {t("add")}
              </Button>
            </div>
            {education.map((edu, i) => (
              <div
                key={i}
                className="space-y-2 rounded-xl border border-[#e2e8f0] bg-[#f4f7fa]/40 p-3"
              >
                <div className="flex justify-end">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      patch({
                        education: education.filter((_, idx) => idx !== i),
                      })
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                    {t("remove")}
                  </Button>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  <div className="min-w-0">
                    <Label>{t("educationDegree")}</Label>
                    <Input
                      value={edu.degree}
                      onChange={(e) =>
                        updateEducation(i, { ...edu, degree: e.target.value })
                      }
                    />
                  </div>
                  <div className="min-w-0">
                    <Label>{t("educationInstitution")}</Label>
                    <Input
                      value={edu.institution}
                      onChange={(e) =>
                        updateEducation(i, {
                          ...edu,
                          institution: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="min-w-0">
                    <Label>{t("educationLocation")}</Label>
                    <Input
                      value={edu.location || ""}
                      onChange={(e) =>
                        updateEducation(i, {
                          ...edu,
                          location: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="min-w-0">
                    <Label>{t("educationGraduation")}</Label>
                    <Input
                      value={edu.graduationDate}
                      onChange={(e) =>
                        updateEducation(i, {
                          ...edu,
                          graduationDate: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="min-w-0">
                    <Label>{t("educationGpa")}</Label>
                    <Input
                      value={edu.gpa || ""}
                      onChange={(e) =>
                        updateEducation(i, { ...edu, gpa: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
      case "projects":
        return (
          <div className="space-y-3">
            <div className="flex justify-end">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  patch({ projects: [...projects, emptyProject()] })
                }
              >
                <Plus className="h-4 w-4" />
                {t("add")}
              </Button>
            </div>
            {projects.map((project, i) => (
              <div
                key={i}
                className="space-y-2 rounded-xl border border-[#e2e8f0] bg-[#f4f7fa]/40 p-3"
              >
                <div className="flex justify-end">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      patch({
                        projects: projects.filter((_, idx) => idx !== i),
                      })
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                    {t("remove")}
                  </Button>
                </div>
                <div>
                  <Label>{t("projectName")}</Label>
                  <Input
                    value={project.name}
                    onChange={(e) =>
                      updateProject(i, { ...project, name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>{t("projectDescription")}</Label>
                  <Textarea
                    value={project.description || ""}
                    onChange={(e) =>
                      updateProject(i, {
                        ...project,
                        description: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  {(project.outcomes || []).map((outcome, j) => (
                    <div key={j} className="flex min-w-0 gap-2">
                      <Input
                        className="min-w-0 flex-1"
                        value={outcome}
                        onChange={(e) => {
                          const outcomes = [...(project.outcomes || [])];
                          outcomes[j] = e.target.value;
                          updateProject(i, { ...project, outcomes });
                        }}
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="shrink-0"
                        onClick={() => {
                          const outcomes = (project.outcomes || []).filter(
                            (_, idx) => idx !== j
                          );
                          updateProject(i, {
                            ...project,
                            outcomes: outcomes.length ? outcomes : [""],
                          });
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      updateProject(i, {
                        ...project,
                        outcomes: [...(project.outcomes || []), ""],
                      })
                    }
                  >
                    <Plus className="h-4 w-4" />
                    {t("addBullet")}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        );
      case "certifications":
        return (
          <div className="space-y-3">
            <div className="flex justify-end">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  patch({
                    certifications: [
                      ...certs,
                      { name: "" } satisfies CertificationItem,
                    ],
                  })
                }
              >
                <Plus className="h-4 w-4" />
                {t("add")}
              </Button>
            </div>
            {certs.map((cert, i) => (
              <div key={i} className="flex min-w-0 gap-2">
                <Input
                  className="min-w-0 flex-1"
                  value={cert.name}
                  onChange={(e) => {
                    const next = [...certs];
                    next[i] = { ...cert, name: e.target.value };
                    patch({ certifications: next });
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="shrink-0"
                  onClick={() =>
                    patch({
                      certifications: certs.filter((_, idx) => idx !== i),
                    })
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        );
      case "courses":
        return (
          <div className="space-y-3">
            <div className="flex justify-end">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => patch({ courses: [...courses, ""] })}
              >
                <Plus className="h-4 w-4" />
                {t("add")}
              </Button>
            </div>
            {courses.map((course, i) => (
              <div key={i} className="flex min-w-0 gap-2">
                <Input
                  className="min-w-0 flex-1"
                  value={course}
                  onChange={(e) => {
                    const next = [...courses];
                    next[i] = e.target.value;
                    patch({ courses: next });
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="shrink-0"
                  onClick={() =>
                    patch({
                      courses: courses.filter((_, idx) => idx !== i),
                    })
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        );
      case "languages":
        return (
          <div className="space-y-3">
            <div className="flex justify-end">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => patch({ languages: [...languages, ""] })}
              >
                <Plus className="h-4 w-4" />
                {t("add")}
              </Button>
            </div>
            {languages.map((lang, i) => (
              <div key={i} className="flex min-w-0 gap-2">
                <Input
                  className="min-w-0 flex-1"
                  value={lang}
                  onChange={(e) => {
                    const next = [...languages];
                    next[i] = e.target.value;
                    patch({ languages: next });
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="shrink-0"
                  onClick={() =>
                    patch({
                      languages: languages.filter((_, idx) => idx !== i),
                    })
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        );
      case "references":
        return (
          <div className="space-y-3">
            <p className="text-xs text-[#6b7c93]">{t("referencesHint")}</p>
            <div className="flex justify-end">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  patch({ references: [...references, emptyReference()] })
                }
              >
                <Plus className="h-4 w-4" />
                {t("add")}
              </Button>
            </div>
            {references.map((ref, i) => (
              <div
                key={i}
                className="space-y-2 rounded-xl border border-[#e2e8f0] bg-[#f4f7fa]/40 p-3"
              >
                <div className="flex justify-end">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      patch({
                        references: references.filter((_, idx) => idx !== i),
                      })
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                    {t("remove")}
                  </Button>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div className="min-w-0">
                    <Label>{t("referenceName")}</Label>
                    <Input
                      value={ref.name}
                      onChange={(e) => {
                        const next = [...references];
                        next[i] = { ...ref, name: e.target.value };
                        patch({ references: next });
                      }}
                    />
                  </div>
                  <div className="min-w-0">
                    <Label>{t("referenceTitle")}</Label>
                    <Input
                      value={ref.title || ""}
                      onChange={(e) => {
                        const next = [...references];
                        next[i] = { ...ref, title: e.target.value };
                        patch({ references: next });
                      }}
                    />
                  </div>
                  <div className="min-w-0">
                    <Label>{t("referenceCompany")}</Label>
                    <Input
                      value={ref.company || ""}
                      onChange={(e) => {
                        const next = [...references];
                        next[i] = { ...ref, company: e.target.value };
                        patch({ references: next });
                      }}
                    />
                  </div>
                  <div className="min-w-0">
                    <Label>{t("phone")}</Label>
                    <Input
                      value={ref.phone || ""}
                      onChange={(e) => {
                        const next = [...references];
                        next[i] = { ...ref, phone: e.target.value };
                        patch({ references: next });
                      }}
                    />
                  </div>
                  <div className="min-w-0 sm:col-span-2">
                    <Label>{t("email")}</Label>
                    <Input
                      value={ref.email || ""}
                      onChange={(e) => {
                        const next = [...references];
                        next[i] = { ...ref, email: e.target.value };
                        patch({ references: next });
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="no-print min-w-0 overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle>{t("editResume")}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div
          ref={scrollContainerRef}
          className="max-h-[min(70vh,720px)] space-y-6 overflow-y-auto overflow-x-hidden p-6 pr-5"
        >
        <section className="space-y-3">
          <PhotoUpload
            value={data.contact.photoDataUrl}
            onChange={(url) => updateContact("photoDataUrl", url || undefined)}
            label={t("photoLabel")}
            hint={t("photoHint")}
            removeLabel={t("removePhoto")}
          />
          <div className="grid grid-cols-1 gap-3">
            <div className="min-w-0">
              <Label>{t("fullName")}</Label>
              <Input
                value={data.contact.fullName}
                onChange={(e) => updateContact("fullName", e.target.value)}
              />
            </div>
            <div className="min-w-0">
              <Label>{t("targetRole")}</Label>
              <Input
                value={data.contact.headline || ""}
                onChange={(e) => updateContact("headline", e.target.value)}
              />
            </div>
            <div className="min-w-0">
              <Label>{t("email")}</Label>
              <Input
                value={data.contact.email}
                onChange={(e) => updateContact("email", e.target.value)}
              />
            </div>
            <div className="min-w-0">
              <Label>{t("phone")}</Label>
              <Input
                value={data.contact.phone}
                onChange={(e) => updateContact("phone", e.target.value)}
              />
            </div>
            <div className="min-w-0">
              <Label>{t("location")}</Label>
              <Input
                value={data.contact.location}
                onChange={(e) => updateContact("location", e.target.value)}
              />
            </div>
            <div className="min-w-0">
              <Label>{t("linkedin")}</Label>
              <Input
                value={data.contact.linkedin || ""}
                onChange={(e) => updateContact("linkedin", e.target.value)}
              />
            </div>
            <div className="min-w-0">
              <Label>{t("github")}</Label>
              <Input
                value={data.contact.github || ""}
                onChange={(e) => updateContact("github", e.target.value)}
              />
            </div>
            <div className="min-w-0">
              <Label>{t("website")}</Label>
              <Input
                value={data.contact.website || ""}
                onChange={(e) => updateContact("website", e.target.value)}
              />
            </div>
          </div>
        </section>

        <div className="sticky top-0 z-10 -mx-1 space-y-2 border border-[#1db4ce]/35 bg-[#e8f8fb] p-3 shadow-sm backdrop-blur-sm sm:rounded-xl">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <Label className="text-base text-[#0b3a5b]">{t("cvSections")}</Label>
              <p className="mt-0.5 text-sm text-[#3d5a73]">{t("addSectionHint")}</p>
              <p className="mt-1 text-xs text-[#6b7c93]">{t("dragToReorder")}</p>
            </div>
            <div className="relative w-full shrink-0 sm:w-auto">
              <Button
                type="button"
                size="default"
                variant="secondary"
                className="w-full sm:w-auto"
                onClick={() => setAddOpen((o) => !o)}
                aria-expanded={addOpen}
              >
                <Plus className="h-5 w-5" />
                {t("addSection")}
              </Button>
              {addOpen && (
                <div className="absolute start-0 z-30 mt-2 max-h-64 w-full min-w-[14rem] overflow-y-auto rounded-xl border border-[#e2e8f0] bg-white p-1 shadow-lg sm:start-auto sm:end-0 sm:w-64">
                  <p className="px-3 py-1.5 text-xs font-medium uppercase tracking-wide text-[#6b7c93]">
                    {t("chooseSectionToAdd")}
                  </p>
                  {missingBuiltins.map((id) => (
                    <button
                      key={id}
                      type="button"
                      className="block w-full rounded-lg px-3 py-2.5 text-start text-sm hover:bg-[#f4f7fa]"
                      onClick={() => addBuiltin(id)}
                    >
                      {t(builtinSectionLabelKey(id))}
                    </button>
                  ))}
                  <button
                    type="button"
                    className="block w-full rounded-lg px-3 py-2.5 text-start text-sm font-medium text-[#0b3a5b] hover:bg-[#e8f8fb]"
                    onClick={addCustom}
                  >
                    + {t("customSection")}
                  </button>
                  {!missingBuiltins.length && (
                    <p className="px-3 py-2 text-xs text-[#6b7c93]">
                      {t("allSectionsAdded")}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {sectionOrder.map((key) => {
            const isDragging = dragKey === key;
            const isDropTarget = dropKey === key && dragKey !== key;
            return (
              <div
                key={key}
                data-section-key={key}
                onDragOver={onDragOver(key)}
                onDrop={onDrop(key)}
                className={`rounded-xl border bg-white p-3 transition-shadow ${
                  isDragging
                    ? "opacity-60 border-[#94a3b8]"
                    : isDropTarget
                      ? "border-[#0b3a5b] shadow-md"
                      : "border-[#e2e8f0]"
                }`}
              >
                <div className="mb-3 flex items-center gap-2">
                  <button
                    type="button"
                    draggable
                    onDragStart={onDragStart(key)}
                    onDragEnd={onDragEnd}
                    className="cursor-grab touch-none rounded p-1 text-[#94a3b8] hover:bg-[#f4f7fa] active:cursor-grabbing"
                    aria-label={t("dragToReorder")}
                  >
                    <GripVertical className="h-5 w-5" />
                  </button>
                  <Label className="min-w-0 flex-1 text-base">
                    {sectionTitle(key)}
                  </Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="shrink-0"
                    onClick={() => removeSection(key)}
                  >
                    <Trash2 className="h-4 w-4" />
                    {t("removeSection")}
                  </Button>
                </div>

                {isCustomSectionKey(key) ? (
                  (() => {
                    const id = customSectionIdFromKey(key);
                    const custom = customSections.find((c) => c.id === id);
                    if (!custom || !id) return null;
                    return (
                      <div className="space-y-2">
                        <div className="min-w-0">
                          <Label>{t("sectionHeading")}</Label>
                          <Input
                            value={custom.heading}
                            onChange={(e) =>
                              updateCustom(id, {
                                ...custom,
                                heading: e.target.value,
                              })
                            }
                            placeholder={t("sectionHeadingPlaceholder")}
                          />
                        </div>
                        <div className="min-w-0">
                          <Label>{t("sectionContent")}</Label>
                          <Textarea
                            className="min-h-[100px]"
                            value={custom.content}
                            onChange={(e) =>
                              updateCustom(id, {
                                ...custom,
                                content: e.target.value,
                              })
                            }
                            placeholder={t("sectionContentPlaceholder")}
                          />
                        </div>
                      </div>
                    );
                  })()
                ) : isBuiltinSectionId(key) ? (
                  renderBuiltinBody(key)
                ) : null}
              </div>
            );
          })}
        </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SkillListEditor({
  label,
  skills,
  onChange,
  addLabel,
  placeholder,
  removeLabel,
}: {
  label: string;
  skills: string[];
  onChange: (next: string[]) => void;
  addLabel: string;
  placeholder: string;
  removeLabel: string;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {skills.map((skill, i) => (
        <div key={i} className="flex min-w-0 gap-2">
          <Input
            className="min-w-0 flex-1"
            value={skill}
            placeholder={placeholder}
            onChange={(e) => {
              const next = [...skills];
              next[i] = e.target.value;
              onChange(next);
            }}
          />
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="shrink-0"
            aria-label={removeLabel}
            onClick={() => onChange(skills.filter((_, idx) => idx !== i))}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => onChange([...skills, ""])}
      >
        <Plus className="h-4 w-4" />
        {addLabel}
      </Button>
    </div>
  );
}
