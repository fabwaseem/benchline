import { PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";
import {
  RESUME_TEMPLATES,
  renderResumePdf,
  validateResume,
  type ResumeData,
  type ResumeTemplate,
} from "@/tools/resume-builder/lib/resume";

const profile = {
  name: "Ada Lovelace",
  title: "Software Engineer",
  email: "ada@example.com",
  phone: "+92 300 1234567",
  location: "Lahore, Pakistan",
  website: "adalovelace.dev",
  summary: "Engineer with a decade of experience building analytical tools.",
};

const experience = [
  {
    title: "Senior Engineer",
    company: "Analytical Engines",
    location: "London",
    start: "2019",
    end: "",
    current: true,
    bullets: ["Led a team of five.", "Shipped the Difference Engine dashboard."],
  },
];

const education = [{ degree: "BSc Mathematics", school: "University of London", location: "", year: "2015" }];

function sampleResume(): ResumeData {
  return {
    profile: { ...profile },
    experience: experience.map((entry) => ({ ...entry, bullets: [...entry.bullets] })),
    education: education.map((entry) => ({ ...entry })),
    skills: ["TypeScript", "React", "Node.js"],
  };
}

describe("validateResume", () => {
  it("rejects a missing or blank name", () => {
    const missing = validateResume({ profile: { ...profile, name: "" }, skills: ["TypeScript"] });
    expect(missing.ok).toBe(false);
    if (!missing.ok) expect(missing.errors.join(" ")).toMatch(/name/i);

    const absent = validateResume({ profile: { title: "Dev" }, skills: ["TypeScript"] });
    expect(absent.ok).toBe(false);
    if (!absent.ok) expect(absent.errors.join(" ")).toMatch(/name/i);
  });

  it("rejects a resume with no experience, education, or skills", () => {
    const result = validateResume({ profile, experience: [], education: [], skills: [] });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.join(" ")).toMatch(/experience|education|skills/i);
  });

  it("rejects non-object input", () => {
    expect(validateResume(null).ok).toBe(false);
    expect(validateResume("nope").ok).toBe(false);
  });

  it("accepts a valid resume and trims strings", () => {
    const result = validateResume({ ...sampleResume(), profile: { ...profile, name: "  Ada  " } });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.resume.profile.name).toBe("Ada");
  });
});

describe("renderResumePdf", () => {
  for (const template of RESUME_TEMPLATES satisfies ResumeTemplate[]) {
    it(`renders a one-page PDF with template "${template}"`, async () => {
      const bytes = await renderResumePdf(sampleResume(), template);
      expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe("%PDF-");
      const doc = await PDFDocument.load(bytes);
      expect(doc.getPageCount()).toBe(1);
      expect(doc.getTitle()).toContain("Ada Lovelace");
    });
  }

  it("paginates long text instead of throwing", async () => {
    const resume = sampleResume();
    resume.profile.summary = "Long summary. ".repeat(200);
    resume.experience = Array.from({ length: 12 }, (_, index) => ({
      title: `Engineer ${index + 1}`,
      company: "Big Corp",
      location: "",
      start: "2020",
      end: "2021",
      current: false,
      bullets: Array.from({ length: 8 }, (_, bullet) => `Did important thing number ${bullet + 1} with a very long description that keeps going and going. `.repeat(3)),
    }));
    const bytes = await renderResumePdf(resume, "clean");
    expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe("%PDF-");
    const doc = await PDFDocument.load(bytes);
    expect(doc.getPageCount()).toBeGreaterThan(1);
  });

  it("handles a word longer than the line width", async () => {
    const resume = sampleResume();
    resume.skills = [`supercalifragilisticexpialidocious`.repeat(10)];
    const bytes = await renderResumePdf(resume, "compact");
    expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe("%PDF-");
    const doc = await PDFDocument.load(bytes);
    expect(doc.getPageCount()).toBeGreaterThanOrEqual(1);
  });
});
