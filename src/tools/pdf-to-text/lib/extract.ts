import { assertByteSize } from "@/lib/format";
import { pdfFailure } from "@/lib/pdf-error";
import { withNodePdf } from "@/lib/pdf-node";
import { assemblePdfText, pageFromItems } from "@/tools/pdf-to-text/lib/text";

export async function extractPdfText(data: Uint8Array) {
  assertByteSize(data, "This PDF");
  try {
    return await withNodePdf(data, async (pdf) => {
      const pages = [];
      for (let page = 1; page <= pdf.numPages; page += 1) {
        const sheet = await pdf.getPage(page);
        const content = await sheet.getTextContent();
        pages.push({ page, ...pageFromItems(content.items) });
      }
      return assemblePdfText(pages);
    });
  } catch (error) {
    throw new Error(pdfFailure(error));
  }
}
