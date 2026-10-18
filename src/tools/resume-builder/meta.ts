import type { ToolMeta } from "@/registry/schema";

export const meta = {
  slug: "resume-builder",
  name: "Resume Builder",
  tagline: "Build a polished resume in the browser: profile, experience, education, and skills, exported as a clean PDF.",
  description:
    "Free resume builder. Fill in your profile, experience, education, and skills, preview three layouts, and download a PDF resume. Everything runs in this browser; nothing is uploaded.",
  category: "pdf",
  tags: ["resume", "cv"],
  keywords: ["resume builder", "cv maker", "free resume pdf", "resume template"],
  status: "new",
  createdAt: "2026-10-18",
  updatedAt: "2026-10-18",
  icon: "FileUser",
  related: ["pdf-merge", "image-to-pdf", "word-counter"],
  faqs: [
    { q: "Is my resume uploaded anywhere?", a: "No. The form data and the generated PDF stay in this browser. Nothing is sent to a server." },
    { q: "What templates are available?", a: "Three: Clean (left-aligned, classic), Modern (centered header, larger name), and Compact (tighter type and spacing for more content per page)." },
    { q: "What do I need to fill in?", a: "Your name, plus at least one entry under experience, education, or skills. Everything else is optional." },
    { q: "How do I add bullet points to a job?", a: "Add an experience entry, then type one bullet per line in the bullets box. They are laid out as a hanging-indent list in the PDF." },
  ],
  seo: {
    title: "Resume Builder",
    description: "Build a resume in your browser with three clean templates and download it as a PDF. Free, and your data never leaves this device.",
  },
  howTo: [
    { name: "Fill in your details", text: "Add your profile, experience, education, and skills. A name plus one section is the minimum." },
    { name: "Pick a template", text: "Switch between Clean, Modern, and Compact. The preview updates as you type." },
    { name: "Download the PDF", text: "Export an A4 resume PDF built in this browser." },
  ],
  inputs: "Your name plus experience, education, and skills entries, and a template choice.",
  outputs: "An A4 PDF resume in the chosen template.",
  runsLocally: true,
  badges: ["In this browser"],
} satisfies ToolMeta;
