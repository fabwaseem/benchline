export const MAX_FILE_BYTES = 40 * 1024 * 1024;

export function assertByteSize(bytes: Uint8Array, label: string) {
  if (bytes.byteLength === 0) throw new Error(`${label} is empty.`);
  if (bytes.byteLength > MAX_FILE_BYTES) throw new Error(`${label} is larger than 40 MB.`);
}
