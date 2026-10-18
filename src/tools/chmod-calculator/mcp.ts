import { z } from "zod";
import { parseMode } from "@/tools/chmod-calculator/lib/chmod";
import type { BenchTool } from "@/lib/mcp/types";

export const inputSchema = z.object({
  mode: z.string().describe("Octal such as 755 or 4755, or symbolic such as rwxr-xr-x."),
  path: z.string().default("file"),
});

export const outputSchema = z.object({
  octal: z.string(),
  symbolic: z.string(),
  command: z.string(),
  setuid: z.boolean(),
  setgid: z.boolean(),
  sticky: z.boolean(),
});

async function run(input: unknown) {
  const parsed = inputSchema.parse(input);
  const result = parseMode(parsed.mode, parsed.path);
  if ("error" in result) throw new Error(result.error);
  return outputSchema.parse({
    octal: result.octal,
    symbolic: result.symbolic,
    command: result.command,
    setuid: result.mode.setuid,
    setgid: result.mode.setgid,
    sticky: result.mode.sticky,
  });
}

export const tool: BenchTool = {
  slug: "chmod-calculator",
  name: "explain_chmod",
  title: "Explain a chmod mode",
  description: "Convert an octal or symbolic file mode into octal, symbolic notation, and a chmod command, including setuid, setgid, and the sticky bit.",
  openWorld: false,
  inputSchema,
  outputSchema,
  run,
};
