import type { ToolMeta } from "@/registry/schema";

export const meta = {
  slug: "zip-tools",
  name: "ZIP Tools",
  tagline: "Create ZIP archives and extract them, entirely in your browser.",
  description:
    "Free ZIP creator and extractor with no uploads. Drop files to bundle them into a ZIP, or drop a ZIP to list and download its contents one by one. Path traversal is blocked and everything runs on this device.",
  category: "encoding",
  tags: ["zip", "archive", "files"],
  keywords: ["zip files online", "create zip", "unzip online", "extract zip", "zip archive"],
  status: "new",
  createdAt: "2026-10-18",
  updatedAt: "2026-10-18",
  icon: "Box",
  related: ["pdf-merge", "image-compress", "base64-codec"],
  faqs: [
    { q: "Are my files uploaded?", a: "No. Files are read into the page and zipped or unzipped with fflate right here in the browser. Nothing leaves your device." },
    { q: "Is there a size limit?", a: "Yes: 200 files and 100 MB total per archive, in either direction. That keeps the tab responsive." },
    { q: "Is it safe to open an untrusted ZIP?", a: "Entry names are sanitized — absolute paths and .. segments are rejected — and extraction happens in memory, never touching your filesystem beyond the files you choose to download." },
    { q: "Can I unzip password-protected archives?", a: "No. Encrypted ZIPs are not supported; the tool will tell you the archive is invalid." },
  ],
  seo: {
    title: "ZIP Tools — Create & Extract ZIP Online, Free",
    description: "Zip files into an archive or extract a ZIP in your browser. No uploads, no sign-up, 200-file / 100 MB cap.",
  },
  howTo: [
    { name: "Create a ZIP", text: "Switch to Create ZIP, drop up to 200 files, then download the archive." },
    { name: "Extract a ZIP", text: "Switch to Extract, drop a .zip file, and browse its contents." },
    { name: "Download what you need", text: "Each extracted file has its own download button — take one file or all of them." },
  ],
  inputs: "Files to archive, or a ZIP archive to extract.",
  outputs: "A downloadable ZIP file, or the archive's file list with per-file downloads.",
  runsLocally: true,
  badges: ["In this browser"],
} satisfies ToolMeta;
