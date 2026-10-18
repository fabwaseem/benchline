import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { z } from "zod";

const profileSchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  title: z.string().trim().default(""),
  email: z.string().trim().default(""),
  phone: z.string().trim().default(""),
  location: z.string().trim().default(""),
  website: z.string().trim().default(""),
  summary: z.string().trim().default(""),
});

const experienceSchema = z.object({
  title: z.string().trim().default(""),
  company: z.string().trim().default(""),
  location: z.string().trim().default(""),
  start: z.string().trim().default(""),
  end: z.string().trim().default(""),
  current: z.boolean().default(false),
  bullets: z.array(z.string().trim().min(1)).default([]),
});

const educationSchema = z.object({
  degree: z.string().trim().default(""),
  school: z.string().trim().default(""),
  location: z.string().trim().default(""),
  year: z.string().trim().default(""),
});

export const resumeSchema = z.object({
  profile: profileSchema,
  experience: z.array(experienceSchema).default([]),
  education: z.array(educationSchema).default([]),
  skills: z.array(z.string().trim().min(1)).default([]),
});

export type ResumeProfile = z.infer<typeof profileSchema>;
export type ResumeExperience = z.infer<typeof experienceSchema>;
export type ResumeEducation = z.infer<typeof educationSchema>;
export type ResumeData = z.infer<typeof resumeSchema>;
export type ResumeTemplate = "clean" | "modern" | "compact";

export const RESUME_TEMPLATES: ResumeTemplate[] = ["clean", "modern", "compact"];

export type ValidateSuccess = { ok: true; resume: ResumeData };
export type ValidateFailure = { ok: false; errors: string[] };

export function validateResume(data: unknown): ValidateSuccess | ValidateFailure {
  const parsed = resumeSchema.safeParse(data);
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.issues.map(humanizeIssue) };
  }
  const resume = parsed.data;
  if (resume.experience.length === 0 && resume.education.length === 0 && resume.skills.length === 0) {
    return { ok: false, errors: ["Add at least one entry: experience, education, or skills."] };
  }
  return { ok: true, resume };
}

function humanizeIssue(issue: z.ZodIssue): string {
  const path = issue.path.join(".");
  if (path === "profile.name") return "Name is required.";
  if (path === "profile") return "Profile information is required.";
  if (path === "resume" || path === "") return "Resume data is required.";
  const label = path
    .split(".")
    .map((part) => (/^\d+$/.test(part) ? `#${Number(part) + 1}` : part))
    .join(" ");
  return `${label[0]?.toUpperCase() ?? ""}${label.slice(1)}: ${issue.message.toLowerCase()}`;
}

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 46;

const INK = rgb(0.16, 0.16, 0.16);
const MUTED = rgb(0.42, 0.42, 0.42);
const RULE = rgb(0.72, 0.72, 0.72);

type TemplateStyle = {
  nameSize: number;
  titleSize: number;
  contactSize: number;
  headingSize: number;
  bodySize: number;
  smallSize: number;
  leading: number;
  sectionGap: number;
  headingGap: number;
  itemGap: number;
  bulletIndent: number;
  centered: boolean;
};

const STYLES: Record<ResumeTemplate, TemplateStyle> = {
  clean: {
    nameSize: 24, titleSize: 12, contactSize: 9.5, headingSize: 11.5,
    bodySize: 10.5, smallSize: 9, leading: 3.5,
    sectionGap: 13, headingGap: 7, itemGap: 9, bulletIndent: 14, centered: false,
  },
  modern: {
    nameSize: 30, titleSize: 12.5, contactSize: 10, headingSize: 11,
    bodySize: 10.5, smallSize: 9, leading: 3.5,
    sectionGap: 14, headingGap: 8, itemGap: 10, bulletIndent: 14, centered: true,
  },
  compact: {
    nameSize: 19, titleSize: 10.5, contactSize: 8.5, headingSize: 10,
    bodySize: 9.5, smallSize: 8.5, leading: 2.5,
    sectionGap: 9, headingGap: 5, itemGap: 6, bulletIndent: 12, centered: false,
  },
};

type Fonts = { regular: PDFFont; bold: PDFFont; italic: PDFFont };

type DrawOptions = {
  font: PDFFont;
  size: number;
  x: number;
  align?: "left" | "center" | "right";
  color?: ReturnType<typeof rgb>;
};

class ResumeWriter {
  private doc: PDFDocument;
  private fonts: Fonts;
  private style: TemplateStyle;
  private page: PDFPage;
  private y = PAGE_HEIGHT - MARGIN;

  constructor(doc: PDFDocument, fonts: Fonts, style: TemplateStyle) {
    this.doc = doc;
    this.fonts = fonts;
    this.style = style;
    this.page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  }

  pageCount(): number {
    return this.doc.getPageCount();
  }

  widthOf(text: string, font: PDFFont, size: number): number {
    return font.widthOfTextAtSize(text, size);
  }

  private newPage() {
    this.page = this.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    this.y = PAGE_HEIGHT - MARGIN;
  }

  private ensureSpace(height: number) {
    if (this.y - height < MARGIN) this.newPage();
  }

  spacer(amount: number) {
    this.ensureSpace(amount);
    this.y -= amount;
  }

  private lineHeight(size: number): number {
    return size + this.style.leading;
  }

  private drawLine(text: string, options: DrawOptions) {
    const { font, size, align = "left", color = INK } = options;
    const width = this.widthOf(text, font, size);
    let x = options.x;
    if (align === "center") x = PAGE_WIDTH / 2 - width / 2;
    if (align === "right") x = PAGE_WIDTH - MARGIN - width;
    this.page.drawText(text, { x, y: this.y - size, font, size, color });
    this.y -= this.lineHeight(size);
  }

  rule() {
    this.ensureSpace(6);
    const y = this.y - 2;
    this.page.drawLine({
      start: { x: MARGIN, y },
      end: { x: PAGE_WIDTH - MARGIN, y },
      thickness: 0.75,
      color: RULE,
    });
    this.y -= 6;
  }

  section(title: string) {
    this.spacer(this.style.sectionGap);
    this.ensureSpace(this.style.headingSize * 2);
    this.page.drawText(title, {
      x: MARGIN,
      y: this.y - this.style.headingSize,
      font: this.fonts.bold,
      size: this.style.headingSize,
      color: INK,
    });
    this.y -= this.style.headingSize + 3;
    this.rule();
    this.spacer(this.style.headingGap);
  }

  paragraph(text: string, opts?: { size?: number; color?: ReturnType<typeof rgb>; italic?: boolean }) {
    const size = opts?.size ?? this.style.bodySize;
    const font = opts?.italic ? this.fonts.italic : this.fonts.regular;
    const lines = this.wrap(text, font, size, PAGE_WIDTH - MARGIN * 2);
    this.ensureSpace(lines.length * this.lineHeight(size));
    for (const line of lines) {
      this.page.drawText(line, { x: MARGIN, y: this.y - size, font, size, color: opts?.color ?? INK });
      this.y -= this.lineHeight(size);
    }
  }

  bullet(text: string) {
    const size = this.style.bodySize;
    const font = this.fonts.regular;
    const prefix = "\u2022 ";
    const prefixWidth = this.widthOf(prefix, font, size);
    const maxWidth = PAGE_WIDTH - MARGIN * 2 - this.style.bulletIndent - prefixWidth;
    const lines = this.wrap(text, font, size, maxWidth);
    this.ensureSpace(lines.length * this.lineHeight(size));
    lines.forEach((line, index) => {
      const x = index === 0 ? MARGIN + this.style.bulletIndent : MARGIN + this.style.bulletIndent + prefixWidth;
      this.page.drawText(index === 0 ? `${prefix}${line}` : line, {
        x, y: this.y - size, font, size, color: INK,
      });
      this.y -= this.lineHeight(size);
    });
  }

  header(profile: ResumeProfile) {
    const centered = this.style.centered;
    const align = centered ? "center" : "left";
    this.drawLine(profile.name, { font: this.fonts.bold, size: this.style.nameSize, x: MARGIN, align });
    if (profile.title) {
      this.drawLine(profile.title, {
        font: centered ? this.fonts.italic : this.fonts.regular,
        size: this.style.titleSize, x: MARGIN, align, color: MUTED,
      });
    }
    const contact = [profile.email, profile.phone, profile.location, profile.website].filter(Boolean).join(" \u00B7 ");
    if (contact) {
      this.drawLine(contact, { font: this.fonts.regular, size: this.style.contactSize, x: MARGIN, align, color: MUTED });
    }
    this.spacer(4);
    this.rule();
    this.spacer(4);
  }

  twoColumn(left: string, right: string, opts?: { leftFont?: PDFFont; rightSize?: number }) {
    const size = this.style.bodySize;
    const leftFont = opts?.leftFont ?? this.fonts.bold;
    const rightSize = opts?.rightSize ?? this.style.smallSize;
    const lines = this.wrap(left, leftFont, size, PAGE_WIDTH - MARGIN * 2 - (right ? 170 : 0));
    const height = Math.max(lines.length, 1) * this.lineHeight(size);
    this.ensureSpace(height);
    if (right) {
      this.page.drawText(right, {
        x: PAGE_WIDTH - MARGIN - this.widthOf(right, this.fonts.regular, rightSize),
        y: this.y - rightSize,
        font: this.fonts.regular,
        size: rightSize,
        color: MUTED,
      });
    }
    for (const line of lines) {
      this.page.drawText(line, { x: MARGIN, y: this.y - size, font: leftFont, size, color: INK });
      this.y -= this.lineHeight(size);
    }
  }

  private splitWord(word: string, font: PDFFont, size: number, maxWidth: number): string[] {
    const parts: string[] = [];
    let rest = word;
    while (rest.length > 0) {
      let len = rest.length;
      if (this.widthOf(rest, font, size) > maxWidth) {
        let lo = 1;
        let hi = rest.length;
        while (lo < hi) {
          const mid = Math.floor((lo + hi + 1) / 2);
          if (this.widthOf(rest.slice(0, mid), font, size) <= maxWidth) lo = mid;
          else hi = mid - 1;
        }
        len = Math.max(lo, 1);
      }
      parts.push(rest.slice(0, len));
      rest = rest.slice(len);
    }
    return parts;
  }

  private wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
    const lines: string[] = [];
    let line = "";
    for (const raw of text.split(/\s+/)) {
      if (!raw) continue;
      const chunks = this.widthOf(raw, font, size) > maxWidth ? this.splitWord(raw, font, size, maxWidth) : [raw];
      for (const chunk of chunks) {
        const candidate = line ? `${line} ${chunk}` : chunk;
        if (this.widthOf(candidate, font, size) <= maxWidth) {
          line = candidate;
        } else {
          if (line) lines.push(line);
          line = chunk;
        }
      }
    }
    if (line) lines.push(line);
    return lines.length > 0 ? lines : [""];
  }
}

function dateRange(experience: ResumeExperience): string {
  if (experience.start && experience.end) return `${experience.start} \u2013 ${experience.end}`;
  if (experience.start) return experience.current ? `${experience.start} \u2013 Present` : experience.start;
  if (experience.end) return experience.end;
  return "";
}

export async function renderResumePdf(resume: ResumeData, template: ResumeTemplate = "clean"): Promise<Uint8Array> {
  const data = resumeSchema.parse(resume);
  const doc = await PDFDocument.create();
  const [regular, bold, italic] = await Promise.all([
    doc.embedFont(StandardFonts.Helvetica),
    doc.embedFont(StandardFonts.HelveticaBold),
    doc.embedFont(StandardFonts.HelveticaOblique),
  ]);
  doc.setTitle(`${data.profile.name} \u2014 Resume`);
  doc.setAuthor(data.profile.name);

  const style = STYLES[template];
  const writer = new ResumeWriter(doc, { regular, bold, italic }, style);
  writer.header(data.profile);

  if (data.profile.summary) {
    writer.section("Summary");
    writer.paragraph(data.profile.summary);
  }

  if (data.experience.length > 0) {
    writer.section("Experience");
    for (const entry of data.experience) {
      const left = [entry.title, entry.company].filter(Boolean).join(", ");
      writer.twoColumn(left || "Role", dateRange(entry));
      if (entry.location) {
        writer.paragraph(entry.location, { size: style.smallSize, italic: true, color: MUTED });
      }
      for (const bullet of entry.bullets) writer.bullet(bullet);
      writer.spacer(style.itemGap);
    }
  }

  if (data.education.length > 0) {
    writer.section("Education");
    for (const entry of data.education) {
      const left = [entry.degree, entry.school].filter(Boolean).join(", ");
      writer.twoColumn(left || "Education", entry.year);
      if (entry.location) {
        writer.paragraph(entry.location, { size: style.smallSize, italic: true, color: MUTED });
      }
      writer.spacer(style.itemGap);
    }
  }

  if (data.skills.length > 0) {
    writer.section("Skills");
    writer.paragraph(data.skills.join(" \u00B7 "));
  }

  return doc.save();
}
