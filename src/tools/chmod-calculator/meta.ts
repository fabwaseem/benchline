import type { ToolMeta } from "@/registry/schema";

export const meta = {
  slug: "chmod-calculator",
  name: "Chmod calculator",
  tagline: "Turn a permission grid into octal and symbolic chmod, and back.",
  description:
    "Free chmod calculator. Check read, write, and execute for owner, group, and others, including setuid, setgid, and the sticky bit. See the octal mode, the symbolic mode, and the chmod command.",
  category: "developer",
  tags: ["chmod", "linux"],
  keywords: ["chmod calculator", "file permission calculator", "octal permissions"],
  status: "new",
  createdAt: "2026-10-18",
  updatedAt: "2026-10-18",
  icon: "Binary",
  related: ["unix-timestamp", "hash-generator", "cron-expression-builder", "nextjs-dockerfile-generator"],
  faqs: [
    { q: "What does 755 mean?", a: "Owner read, write, and execute (7), group read and execute (5), others read and execute (5). The command is chmod 755 file." },
    { q: "What is the leading digit in 4755?", a: "The thousands digit is the special bits: 4 setuid, 2 setgid, 1 sticky. 4755 is setuid plus 755. Symbolic form shows s or t in place of x." },
    { q: "What is the difference between s and S?", a: "Lowercase s means the special bit and execute are both set. Uppercase S means the special bit is set and execute is not." },
    { q: "Does this change a file on my computer?", a: "No. It only writes the command. Run that command yourself in a terminal if you want to change a file." },
  ],
  seo: {
    title: "Chmod calculator",
    description: "Convert Linux file permissions between a checkbox grid, octal chmod, and symbolic rwx notation.",
  },
  howTo: [
    { name: "Check the boxes or type a mode", text: "Each row is owner, group, or others. You can also paste 755 or rwxr-xr-x." },
    { name: "Read the octal and symbolic forms", text: "They stay in sync. Special bits add a leading octal digit and replace x with s or t." },
    { name: "Copy the command", text: "The chmod line uses the path you type, or file when the path is empty." },
  ],
  inputs: "Permission checkboxes, an octal or symbolic mode, and an optional path.",
  outputs: "Octal mode, symbolic mode, and a chmod command.",
  runsLocally: true,
  badges: ["Octal · Symbolic"],
} satisfies ToolMeta;
