"use client";

import { useState, type ChangeEvent, type ReactNode } from "react";
import { Download, FileUser, Plus, Trash2 } from "lucide-react";
import { ActionButton, IconButton, TextArea, TextInput, Toggle } from "@/components/kit/controls";
import { downloadBytes } from "@/components/kit/download-button";
import { EmptyState } from "@/components/kit/empty-state";
import { FieldRow } from "@/components/kit/field-row";
import { Notice } from "@/components/kit/notice";
import { Segmented } from "@/components/kit/segmented";
import { Pane, StatusStrip, ToolCard, ToolPanes, ToolToolbar } from "@/components/kit/shell";
import {
  RESUME_TEMPLATES,
  renderResumePdf,
  validateResume,
  type ResumeData,
  type ResumeTemplate,
} from "@/tools/resume-builder/lib/resume";

type ExperienceForm = {
  id: string;
  title: string;
  company: string;
  location: string;
  start: string;
  end: string;
  current: boolean;
  bullets: string;
};

type EducationForm = {
  id: string;
  degree: string;
  school: string;
  location: string;
  year: string;
};

const TEMPLATE_LABELS: Record<ResumeTemplate, string> = {
  clean: "Clean",
  modern: "Modern",
  compact: "Compact",
};

function newId() {
  return crypto.randomUUID();
}

const blankExperience = (): ExperienceForm => ({
  id: newId(), title: "", company: "", location: "", start: "", end: "", current: false, bullets: "",
});

const blankEducation = (): EducationForm => ({
  id: newId(), degree: "", school: "", location: "", year: "",
});

export default function ResumeBuilderTool() {
  const [profile, setProfile] = useState({ name: "", title: "", email: "", phone: "", location: "", website: "", summary: "" });
  const [experience, setExperience] = useState<ExperienceForm[]>([blankExperience()]);
  const [education, setEducation] = useState<EducationForm[]>([]);
  const [skillsText, setSkillsText] = useState("");
  const [template, setTemplate] = useState<ResumeTemplate>("clean");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function setProfileField(field: keyof typeof profile) {
    return (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setProfile((current) => ({ ...current, [field]: event.target.value }));
  }

  function buildResume(): ResumeData {
    return {
      profile: { ...profile },
      experience: experience.map((entry) => ({
        title: entry.title,
        company: entry.company,
        location: entry.location,
        start: entry.start,
        end: entry.end,
        current: entry.current,
        bullets: entry.bullets.split("\n").map((line) => line.trim()).filter(Boolean),
      })),
      education: education.map((entry) => ({
        degree: entry.degree,
        school: entry.school,
        location: entry.location,
        year: entry.year,
      })),
      skills: skillsText.split("\n").map((line) => line.trim()).filter(Boolean),
    };
  }

  const resume = buildResume();
  const validation = validateResume(resume);

  async function download() {
    const check = validateResume(buildResume());
    if (!check.ok) {
      setError(check.errors.join(" "));
      return;
    }
    setBusy(true);
    setError("");
    try {
      const bytes = await renderResumePdf(check.resume, template);
      downloadBytes("resume.pdf", bytes, "application/pdf");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not build the PDF.");
    } finally {
      setBusy(false);
    }
  }

  const sectionCount =
    (resume.experience.length > 0 ? 1 : 0) + (resume.education.length > 0 ? 1 : 0) + (resume.skills.length > 0 ? 1 : 0);

  return (
    <ToolCard>
      <ToolToolbar
        actions={
          <ActionButton className="btn btn-ink" onClick={() => void download()} disabled={busy}>
            <Download size={15} />
            {busy ? "Building" : "Download PDF"}
          </ActionButton>
        }
      />
      <ToolPanes ratio="60/40">
        <Pane label="Details">
          <div className="flex flex-col gap-4">
            <section aria-label="Profile" className="flex flex-col gap-3">
              <h3 className="text-[13px] font-semibold">Profile</h3>
              <FieldRow label="Full name" htmlFor="resume-name">
                <TextInput id="resume-name" value={profile.name} onChange={setProfileField("name")} placeholder="Ada Lovelace" autoComplete="name" />
              </FieldRow>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <FieldRow label="Job title" htmlFor="resume-title">
                  <TextInput id="resume-title" value={profile.title} onChange={setProfileField("title")} placeholder="Software Engineer" />
                </FieldRow>
                <FieldRow label="Email" htmlFor="resume-email">
                  <TextInput id="resume-email" type="email" value={profile.email} onChange={setProfileField("email")} placeholder="ada@example.com" autoComplete="email" />
                </FieldRow>
                <FieldRow label="Phone" htmlFor="resume-phone">
                  <TextInput id="resume-phone" type="tel" value={profile.phone} onChange={setProfileField("phone")} placeholder="+92 300 1234567" autoComplete="tel" />
                </FieldRow>
                <FieldRow label="Location" htmlFor="resume-location">
                  <TextInput id="resume-location" value={profile.location} onChange={setProfileField("location")} placeholder="Lahore, Pakistan" />
                </FieldRow>
                <FieldRow label="Website" htmlFor="resume-website">
                  <TextInput id="resume-website" value={profile.website} onChange={setProfileField("website")} placeholder="adalovelace.dev" />
                </FieldRow>
              </div>
              <FieldRow label="Summary" htmlFor="resume-summary">
                <TextArea id="resume-summary" rows={3} value={profile.summary} onChange={setProfileField("summary")} placeholder="Two or three sentences about what you do best." />
              </FieldRow>
            </section>

            <section aria-label="Experience" className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="text-[13px] font-semibold">Experience</h3>
                <ActionButton size="xs" variant="outline" onClick={() => setExperience((current) => [...current, blankExperience()])}>
                  <Plus size={13} />Add job
                </ActionButton>
              </div>
              {experience.map((entry, index) => (
                <div key={entry.id} className="flex flex-col gap-3 rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-medium text-fg2">Job {index + 1}</span>
                    <IconButton label={`Remove job ${index + 1}`} onClick={() => setExperience((current) => current.filter((row) => row.id !== entry.id))}>
                      <Trash2 size={14} />
                    </IconButton>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <FieldRow label="Job title" htmlFor={`exp-title-${entry.id}`}>
                      <TextInput id={`exp-title-${entry.id}`} value={entry.title} onChange={(event) => setExperience((current) => current.map((row) => row.id === entry.id ? { ...row, title: event.target.value } : row))} placeholder="Senior Engineer" />
                    </FieldRow>
                    <FieldRow label="Company" htmlFor={`exp-company-${entry.id}`}>
                      <TextInput id={`exp-company-${entry.id}`} value={entry.company} onChange={(event) => setExperience((current) => current.map((row) => row.id === entry.id ? { ...row, company: event.target.value } : row))} placeholder="Analytical Engines" />
                    </FieldRow>
                    <FieldRow label="Location" htmlFor={`exp-location-${entry.id}`}>
                      <TextInput id={`exp-location-${entry.id}`} value={entry.location} onChange={(event) => setExperience((current) => current.map((row) => row.id === entry.id ? { ...row, location: event.target.value } : row))} placeholder="London" />
                    </FieldRow>
                    <div className="grid grid-cols-2 gap-3">
                      <FieldRow label="Start" htmlFor={`exp-start-${entry.id}`}>
                        <TextInput id={`exp-start-${entry.id}`} value={entry.start} onChange={(event) => setExperience((current) => current.map((row) => row.id === entry.id ? { ...row, start: event.target.value } : row))} placeholder="2019" />
                      </FieldRow>
                      <FieldRow label="End" htmlFor={`exp-end-${entry.id}`}>
                        <TextInput id={`exp-end-${entry.id}`} value={entry.end} disabled={entry.current} onChange={(event) => setExperience((current) => current.map((row) => row.id === entry.id ? { ...row, end: event.target.value } : row))} placeholder="2023" />
                      </FieldRow>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3 text-[13px]">
                    <span className="text-fg2">I currently work here</span>
                    <Toggle checked={entry.current} onCheckedChange={(checked) => setExperience((current) => current.map((row) => row.id === entry.id ? { ...row, current: checked } : row))} aria-label={`Currently employed at job ${index + 1}`} />
                  </div>
                  <FieldRow label="Bullets" htmlFor={`exp-bullets-${entry.id}`} help="One bullet per line.">
                    <TextArea id={`exp-bullets-${entry.id}`} rows={3} value={entry.bullets} onChange={(event) => setExperience((current) => current.map((row) => row.id === entry.id ? { ...row, bullets: event.target.value } : row))} placeholder={"Led a team of five.\nShipped the dashboard on time."} />
                  </FieldRow>
                </div>
              ))}
            </section>

            <section aria-label="Education" className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="text-[13px] font-semibold">Education</h3>
                <ActionButton size="xs" variant="outline" onClick={() => setEducation((current) => [...current, blankEducation()])}>
                  <Plus size={13} />Add school
                </ActionButton>
              </div>
              {education.map((entry, index) => (
                <div key={entry.id} className="flex flex-col gap-3 rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-medium text-fg2">School {index + 1}</span>
                    <IconButton label={`Remove school ${index + 1}`} onClick={() => setEducation((current) => current.filter((row) => row.id !== entry.id))}>
                      <Trash2 size={14} />
                    </IconButton>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <FieldRow label="Degree" htmlFor={`edu-degree-${entry.id}`}>
                      <TextInput id={`edu-degree-${entry.id}`} value={entry.degree} onChange={(event) => setEducation((current) => current.map((row) => row.id === entry.id ? { ...row, degree: event.target.value } : row))} placeholder="BSc Mathematics" />
                    </FieldRow>
                    <FieldRow label="School" htmlFor={`edu-school-${entry.id}`}>
                      <TextInput id={`edu-school-${entry.id}`} value={entry.school} onChange={(event) => setEducation((current) => current.map((row) => row.id === entry.id ? { ...row, school: event.target.value } : row))} placeholder="University of London" />
                    </FieldRow>
                    <FieldRow label="Location" htmlFor={`edu-location-${entry.id}`}>
                      <TextInput id={`edu-location-${entry.id}`} value={entry.location} onChange={(event) => setEducation((current) => current.map((row) => row.id === entry.id ? { ...row, location: event.target.value } : row))} placeholder="London" />
                    </FieldRow>
                    <FieldRow label="Year" htmlFor={`edu-year-${entry.id}`}>
                      <TextInput id={`edu-year-${entry.id}`} value={entry.year} onChange={(event) => setEducation((current) => current.map((row) => row.id === entry.id ? { ...row, year: event.target.value } : row))} placeholder="2015" />
                    </FieldRow>
                  </div>
                </div>
              ))}
            </section>

            <section aria-label="Skills" className="flex flex-col gap-3">
              <h3 className="text-[13px] font-semibold">Skills</h3>
              <FieldRow label="Skills" htmlFor="resume-skills" help="One skill per line.">
                <TextArea id="resume-skills" rows={3} value={skillsText} onChange={(event) => setSkillsText(event.target.value)} placeholder={"TypeScript\nReact\nNode.js"} />
              </FieldRow>
            </section>

            <section aria-label="Template" className="flex flex-col gap-3">
              <h3 className="text-[13px] font-semibold">Template</h3>
              <Segmented<ResumeTemplate>
                label="Resume template"
                value={template}
                onChange={setTemplate}
                options={RESUME_TEMPLATES.map((value) => ({ value, label: TEMPLATE_LABELS[value] }))}
              />
            </section>
          </div>
        </Pane>
        <Pane label="Preview">
          <div className="flex flex-col gap-3">
            {error ? <Notice tone="bad" role="alert" title="Cannot build the PDF yet" body={error} /> : null}
            {validation.ok ? (
              <ResumePreview resume={resume} template={template} />
            ) : (
              <EmptyState
                title="Start with your name"
                hint="Add your name and at least one experience, education, or skills entry. The preview appears as you type."
                art={<FileUser size={28} />}
              />
            )}
            <ActionButton onClick={() => void download()} disabled={busy}>
              <Download size={15} />
              {busy ? "Building PDF" : "Download PDF"}
            </ActionButton>
            <Notice tone="neutral" title="Nothing is uploaded." body="The preview and the PDF are built in this browser from what you typed." />
          </div>
        </Pane>
      </ToolPanes>
      <StatusStrip
        note={error || "Everything stays in this browser"}
        tone={error ? "warn" : "pass"}
        items={[
          { level: "info", label: "Sections", detail: sectionCount ? `${sectionCount} of 3` : "None yet" },
          { level: "info", label: "Template", detail: TEMPLATE_LABELS[template] },
        ]}
      />
    </ToolCard>
  );
}

function dateRange(start: string, end: string, current: boolean): string {
  if (start && end) return `${start} – ${end}`;
  if (start) return current ? `${start} – Present` : start;
  return end;
}

function ResumePreview({ resume, template }: { resume: ResumeData; template: ResumeTemplate }) {
  const centered = template === "modern";
  const compact = template === "compact";
  const contact = [resume.profile.email, resume.profile.phone, resume.profile.location, resume.profile.website].filter(Boolean).join(" · ");

  return (
    <div className={`rounded-lg border border-border bg-surface p-5 text-foreground ${compact ? "text-[12px]" : "text-[13px]"}`}>
      <div className={centered ? "text-center" : "text-left"}>
        <p className={`font-bold tracking-tight ${compact ? "text-xl" : centered ? "text-3xl" : "text-2xl"}`}>{resume.profile.name}</p>
        {resume.profile.title ? <p className={`mt-0.5 text-fg2 ${compact ? "text-[12px]" : "text-sm"}`}>{resume.profile.title}</p> : null}
        {contact ? <p className="mt-1 text-[12px] text-faint">{contact}</p> : null}
      </div>
      <hr className="my-3 border-border-strong" />

      {resume.profile.summary ? (
        <PreviewSection title="Summary" compact={compact}>
          <p className="leading-relaxed text-fg2">{resume.profile.summary}</p>
        </PreviewSection>
      ) : null}

      {resume.experience.length > 0 ? (
        <PreviewSection title="Experience" compact={compact}>
          <div className={`flex flex-col ${compact ? "gap-2" : "gap-3"}`}>
            {resume.experience.map((entry, index) => (
              <div key={index}>
                <div className="flex items-baseline justify-between gap-2">
                  <p className="font-semibold">{[entry.title, entry.company].filter(Boolean).join(", ") || "Role"}</p>
                  <p className="shrink-0 text-[11.5px] text-faint">{dateRange(entry.start, entry.end, entry.current)}</p>
                </div>
                {entry.location ? <p className="text-[11.5px] text-faint italic">{entry.location}</p> : null}
                {entry.bullets.length > 0 ? (
                  <ul className="mt-1 list-disc space-y-0.5 pl-5 text-fg2">
                    {entry.bullets.map((bullet, bulletIndex) => <li key={bulletIndex}>{bullet}</li>)}
                  </ul>
                ) : null}
              </div>
            ))}
          </div>
        </PreviewSection>
      ) : null}

      {resume.education.length > 0 ? (
        <PreviewSection title="Education" compact={compact}>
          <div className={`flex flex-col ${compact ? "gap-2" : "gap-3"}`}>
            {resume.education.map((entry, index) => (
              <div key={index}>
                <div className="flex items-baseline justify-between gap-2">
                  <p className="font-semibold">{[entry.degree, entry.school].filter(Boolean).join(", ") || "Education"}</p>
                  <p className="shrink-0 text-[11.5px] text-faint">{entry.year}</p>
                </div>
                {entry.location ? <p className="text-[11.5px] text-faint italic">{entry.location}</p> : null}
              </div>
            ))}
          </div>
        </PreviewSection>
      ) : null}

      {resume.skills.length > 0 ? (
        <PreviewSection title="Skills" compact={compact}>
          <p className="leading-relaxed text-fg2">{resume.skills.join(" · ")}</p>
        </PreviewSection>
      ) : null}
    </div>
  );
}

function PreviewSection({ title, compact, children }: { title: string; compact: boolean; children: ReactNode }) {
  return (
    <div className={compact ? "mt-3" : "mt-4"}>
      <p className={`font-semibold tracking-wide uppercase ${compact ? "text-[11px]" : "text-xs"}`}>{title}</p>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}
