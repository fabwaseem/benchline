import { timingSafeEqual } from "node:crypto";

export function statsAuthorized(authorization: string | null, token = process.env.STATS_TOKEN): boolean {
  if (!token) return false;
  if (!authorization) return false;
  const match = /^Bearer\s+(\S+)$/i.exec(authorization.trim());
  const presented = match?.[1];
  if (!presented) return false;
  const left = Buffer.from(presented);
  const right = Buffer.from(token);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}
