export function pdfFailure(error: unknown, label = "This PDF") {
  const message = error instanceof Error ? error.message : "";
  if (/password|encrypted/i.test(message)) return `${label} is encrypted. Unlock it with the password first.`;
  if (/header|invalid pdf|not a pdf/i.test(message)) return `${label} is not a PDF.`;
  if (message) return message;
  return `${label} could not be read.`;
}
