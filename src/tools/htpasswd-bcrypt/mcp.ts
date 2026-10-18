import { z } from "zod";
import type { BenchTool } from "@/lib/mcp/types";
import { hashAlgorithms, hashPassword } from "@/tools/htpasswd-bcrypt/lib/hash";

export const inputSchema = z.object({
  password: z.string().describe("Password to hash or verify. It is used only for this call and is not stored."),
  algorithm: z.enum(hashAlgorithms).default("bcrypt"),
  cost: z.number().int().min(4).max(12).default(10).describe("Bcrypt cost factor, from 4 to 12."),
  iterations: z.number().int().min(1).max(4).default(2),
  memory: z.number().int().min(8).max(19456).default(8192).describe("Argon2id memory in KiB."),
  parallelism: z.number().int().min(1).max(2).default(1),
  username: z.string().default("").describe("Optional htpasswd username. A colon is not allowed."),
  hash: z.string().optional().describe("Existing bcrypt or argon2id hash. When set, the password is verified instead of hashed."),
});

export const outputSchema = z.object({
  algorithm: z.enum(hashAlgorithms),
  hash: z.string(),
  htpasswd: z.string(),
  verified: z.boolean().nullable(),
});

async function run(input: unknown) {
  const parsed = inputSchema.parse(input);
  const result = await hashPassword(parsed);
  if ("error" in result) throw new Error(result.error);
  return outputSchema.parse(result);
}

export const tool: BenchTool = {
  slug: "htpasswd-bcrypt",
  name: "hash_password",
  title: "Hash or verify a password",
  description: "Hash a password with bcrypt or argon2id, or verify a hash. Returns an htpasswd line when a username is set. The password is not stored or logged. The page in the browser never sends the password; this call only hashes the arguments you send.",
  openWorld: false,
  inputSchema,
  outputSchema,
  run,
};
