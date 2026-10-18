export type FileRejection = {
  code: "type" | "size" | "count";
  message: string;
  file?: File;
};

export type FileRules = {
  accept?: string;
  maxSize?: number;
  maxFiles?: number;
};

export function matchAccept(file: File, accept: string | undefined) {
  if (!accept || accept.trim() === "" || accept.trim() === "*") return true;
  const rules = accept.split(",").map((item) => item.trim().toLowerCase()).filter(Boolean);
  const name = file.name.toLowerCase();
  const type = (file.type || "").toLowerCase();
  return rules.some((rule) => {
    if (rule.startsWith(".")) return name.endsWith(rule);
    if (rule.endsWith("/*")) return type.startsWith(rule.slice(0, -1));
    return type === rule;
  });
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function validateFiles(files: readonly File[], rules: FileRules) {
  const accepted: File[] = [];
  const errors: FileRejection[] = [];
  const cap = rules.maxFiles ?? files.length;
  for (const file of files) {
    if (!matchAccept(file, rules.accept)) {
      errors.push({ code: "type", message: `${file.name} is not an accepted file type.`, file });
      continue;
    }
    if (rules.maxSize !== undefined && file.size > rules.maxSize) {
      errors.push({ code: "size", message: `${file.name} is larger than ${formatBytes(rules.maxSize)}.`, file });
      continue;
    }
    if (accepted.length >= cap) {
      errors.push({ code: "count", message: `Only ${cap} file${cap === 1 ? "" : "s"} can be added.`, file });
      continue;
    }
    accepted.push(file);
  }
  return { accepted, errors };
}

export function parseDroppedUrl(text: string) {
  const value = text.trim().split(/\s+/)[0] ?? "";
  if (!/^https?:\/\//i.test(value)) return null;
  try {
    return new URL(value).toString();
  } catch {
    return null;
  }
}
