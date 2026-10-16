import type { z } from "zod";

export type BenchTool = {
  slug: string;
  name: string;
  title: string;
  description: string;
  openWorld: boolean;
  inputSchema: z.ZodType;
  outputSchema: z.ZodType;
  run: (input: unknown) => Promise<unknown>;
};
