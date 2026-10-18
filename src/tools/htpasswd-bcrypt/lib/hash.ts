export const hashAlgorithms = ["bcrypt", "argon2id"] as const;
export type HashAlgorithm = (typeof hashAlgorithms)[number];

export const hashLimits = {
  bcryptCost: { min: 4, max: 12 },
  iterations: { min: 1, max: 4 },
  memory: { min: 8, max: 19456 },
  parallelism: { min: 1, max: 2 },
  password: 256,
} as const;

export type HashRequest = {
  password: string;
  algorithm: HashAlgorithm;
  cost?: number;
  iterations?: number;
  memory?: number;
  parallelism?: number;
  username?: string;
  hash?: string;
};

export type HashResult = {
  algorithm: HashAlgorithm;
  hash: string;
  htpasswd: string;
  verified: boolean | null;
};

const USER = /^[A-Za-z0-9._@-]{1,64}$/;

export function htpasswdLine(username: string, hash: string) {
  const user = username.trim();
  return user ? `${user}:${hash}` : hash;
}

export function algorithmOf(hash: string): HashAlgorithm | null {
  if (/^\$2[aby]\$/.test(hash)) return "bcrypt";
  if (hash.startsWith("$argon2id$")) return "argon2id";
  return null;
}

export async function hashPassword(input: HashRequest): Promise<HashResult | { error: string }> {
  const password = input.password;
  if (!password) return { error: "Enter a password." };
  if (password.length > hashLimits.password) return { error: "Password is longer than 256 characters." };
  const username = input.username?.trim() ?? "";
  if (username && !USER.test(username)) return { error: "Username can use letters, digits, and . _ @ -." };
  const existing = input.hash?.trim() ?? "";
  if (existing) return verifyPassword(password, existing, username);
  if (input.algorithm === "argon2id") return hashArgon(password, input, username);
  return hashBcrypt(password, input, username);
}

async function hashBcrypt(password: string, input: HashRequest, username: string): Promise<HashResult | { error: string }> {
  const cost = input.cost ?? 10;
  if (!Number.isInteger(cost) || cost < hashLimits.bcryptCost.min || cost > hashLimits.bcryptCost.max) {
    return { error: `Bcrypt cost has to be from ${hashLimits.bcryptCost.min} to ${hashLimits.bcryptCost.max}.` };
  }
  const { bcrypt } = await import("hash-wasm");
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await bcrypt({ password, salt, costFactor: cost, outputType: "encoded" });
  return { algorithm: "bcrypt", hash, htpasswd: htpasswdLine(username, hash), verified: null };
}

async function hashArgon(password: string, input: HashRequest, username: string): Promise<HashResult | { error: string }> {
  const iterations = input.iterations ?? 2;
  const memory = input.memory ?? 8192;
  const parallelism = input.parallelism ?? 1;
  if (!Number.isInteger(iterations) || iterations < hashLimits.iterations.min || iterations > hashLimits.iterations.max) {
    return { error: `Argon2 iterations have to be from ${hashLimits.iterations.min} to ${hashLimits.iterations.max}.` };
  }
  if (!Number.isInteger(memory) || memory < hashLimits.memory.min || memory > hashLimits.memory.max) {
    return { error: `Argon2 memory has to be from ${hashLimits.memory.min} to ${hashLimits.memory.max} KiB.` };
  }
  if (!Number.isInteger(parallelism) || parallelism < hashLimits.parallelism.min || parallelism > hashLimits.parallelism.max) {
    return { error: `Argon2 parallelism has to be from ${hashLimits.parallelism.min} to ${hashLimits.parallelism.max}.` };
  }
  const { argon2id } = await import("hash-wasm");
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await argon2id({
    password,
    salt,
    iterations,
    parallelism,
    memorySize: memory,
    hashLength: 32,
    outputType: "encoded",
  });
  return { algorithm: "argon2id", hash, htpasswd: htpasswdLine(username, hash), verified: null };
}

async function verifyPassword(password: string, hash: string, username: string): Promise<HashResult | { error: string }> {
  const algorithm = algorithmOf(hash);
  if (!algorithm) return { error: "Paste a bcrypt ($2a$, $2b$, $2y$) or argon2id hash." };
  const { bcryptVerify, argon2Verify } = await import("hash-wasm");
  const verified = algorithm === "bcrypt" ? await bcryptVerify({ password, hash }) : await argon2Verify({ password, hash });
  return { algorithm, hash, htpasswd: htpasswdLine(username, hash), verified };
}
