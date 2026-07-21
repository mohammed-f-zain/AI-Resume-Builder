"use client";

import { Plus, Trash2 } from "lucide-react";
import { useLocale } from "@/contexts/LocaleContext";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input, Label, Textarea } from "@/components/ui/Input";
import { PhotoUpload } from "@/components/resume/PhotoUpload";
import type {
  CertificationItem,
  Education,
  Experience,
  Project,
  ResumeData,
} from "@/lib/types";
import { normalizeCertifications, normalizeResumeSkills } from "@/lib/types";

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
    graduationDate: "",
    gpa: "",
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

export function ResumeEditor({ data, onChange }: ResumeEditorProps) {
  const { t } = useLocale();
  const skills = normalizeResumeSkills(data.skills);
  const certs = normalizeCertifications(data.certifications);

  const patch = (partial: Partial<ResumeData>) => {
    onChange({ ...data, ...partial });
  };

  const updateContact = <K extends keyof ResumeData["contact"]>(
    key: K,
    value: ResumeData["contact"][K]
  ) => {
    patch({ contact: { ...data.contact, [key]: value } });
  };

  const updateExperience = (index: number, next: Experience) => {
    const experience = [...(data.experience || [])];
    experience[index] = next;
    patch({ experience });
  };

  const updateEducation = (index: number, next: Education) => {
    const education = [...(data.education || [])];
    education[index] = next;
    patch({ education });
  };

  const updateProject = (index: number, next: Project) => {
    const projects = [...(data.projects || [])];
    projects[index] = next;
    patch({ projects });
  };

  const updateSkillList = (kind: "technical" | "soft", list: string[]) => {
    patch({
      skills: {
        ...skills,
        [kind]: list,
      },
    });
  };

  return (
    <Card className="no-print min-w-0 overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle>{t("editResume")}</CardTitle>
      </CardHeader>
      <CardContent className="max-h-[min(70vh,720px)] space-y-6 overflow-y-auto overflow-x-hidden pr-1">
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

        <section>
          <Label>{t("professionalSummary")}</Label>
          <Textarea
            className="mt-1 min-h-[100px]"
            value={data.summary}
            onChange={(e) => patch({ summary: e.target.value })}
          />
        </section>

        <section className="space-y-3">
          <Label className="text-base">{t("skills")}</Label>
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
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-base">{t("workExperience")}</Label>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() =>
                patch({ experience: [...(data.experience || []), emptyExperience()] })
              }
            >
              <Plus className="h-4 w-4" />
              {t("add")}
            </Button>
          </div>
          {(data.experience || []).map((exp, i) => (
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
                      experience: data.experience.filter((_, idx) => idx !== i),
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
                      updateExperience(i, { ...exp, company: e.target.value })
                    }
                  />
                </div>
                <div className="min-w-0">
                  <Label>{t("location")}</Label>
                  <Input
                    value={exp.location || ""}
                    onChange={(e) =>
                      updateExperience(i, { ...exp, location: e.target.value })
                    }
                  />
                </div>
                <div className="min-w-0">
                  <Label>{t("dateFrom")}</Label>
                  <Input
                    value={exp.startDate}
                    onChange={(e) =>
                      updateExperience(i, { ...exp, startDate: e.target.value })
                    }
                  />
                </div>
                <div className="min-w-0">
                  <Label>{t("dateTo")}</Label>
                  <Input
                    value={exp.endDate}
                    disabled={!!exp.current}
                    onChange={(e) =>
                      updateExperience(i, { ...exp, endDate: e.target.value })
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
                        const bullets = [...exp.bullets];
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
                        const bullets = exp.bullets.filter((_, idx) => idx !== j);
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
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-base">{t("education")}</Label>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() =>
                patch({ education: [...(data.education || []), emptyEducation()] })
              }
            >
              <Plus className="h-4 w-4" />
              {t("add")}
            </Button>
          </div>
          {(data.education || []).map((edu, i) => (
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
                      education: data.education.filter((_, idx) => idx !== i),
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
                      updateEducation(i, { ...edu, institution: e.target.value })
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
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-base">{t("projects")}</Label>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() =>
                patch({ projects: [...(data.projects || []), emptyProject()] })
              }
            >
              <Plus className="h-4 w-4" />
              {t("add")}
            </Button>
          </div>
          {(data.projects || []).map((project, i) => (
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
                      projects: (data.projects || []).filter((_, idx) => idx !== i),
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
                    updateProject(i, { ...project, description: e.target.value })
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
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-base">{t("certifications")}</Label>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() =>
                patch({
                  certifications: [...certs, { name: "" } satisfies CertificationItem],
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
                  patch({ certifications: certs.filter((_, idx) => idx !== i) })
                }
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <Label className="text-base">{t("languages")}</Label>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="shrink-0"
              onClick={() =>
                patch({ languages: [...(data.languages || []), ""] })
              }
            >
              <Plus className="h-4 w-4" />
              {t("add")}
            </Button>
          </div>
          {(data.languages || []).map((lang, i) => (
            <div key={i} className="flex min-w-0 gap-2">
              <Input
                className="min-w-0 flex-1"
                value={lang}
                onChange={(e) => {
                  const languages = [...(data.languages || [])];
                  languages[i] = e.target.value;
                  patch({ languages });
                }}
              />
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="shrink-0"
                onClick={() =>
                  patch({
                    languages: (data.languages || []).filter((_, idx) => idx !== i),
                  })
                }
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </section>
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
