// Narrows the blank render_pdf_pages output: vector shapes vs standard-font text vs embedded-font text.
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import sharp from "sharp";
const c = new Client({ name: "probe", version: "1" });
await c.connect(new StreamableHTTPClientTransport(new URL(process.argv[2] ?? "https://benchline.fabwaseem.com/mcp")));
async function probe(label, draw) {
  const doc = await PDFDocument.create();
  const page = doc.addPage([600, 200]);
  await draw(doc, page);
  const data = Buffer.from(await doc.save()).toString("base64");
  const r = await c.callTool({ name: "render_pdf_pages", arguments: { data, format: "png", dpi: 72 } });
  const png = Buffer.from(r.structuredContent.images[0].data, "base64");
  const s = await sharp(png).stats();
  console.log(label.padEnd(28), "min", s.channels[0].min, "mean", s.channels[0].mean.toFixed(1), s.channels[0].min < 128 ? "DRAWN" : "BLANK");
  await new Promise((r) => setTimeout(r, 1100));
}
await probe("rectangle only", (d, p) => p.drawRectangle({ x: 20, y: 20, width: 200, height: 100, color: rgb(0, 0, 0) }));
await probe("Helvetica (standard 14)", async (d, p) => p.drawText("BENCHLINE", { x: 40, y: 80, size: 56, font: await d.embedFont(StandardFonts.Helvetica) }));
await probe("Times (standard 14)", async (d, p) => p.drawText("BENCHLINE", { x: 40, y: 80, size: 56, font: await d.embedFont(StandardFonts.TimesRoman) }));
const w3 = Buffer.from(await (await fetch("https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf")).arrayBuffer());
{
  const r = await c.callTool({ name: "render_pdf_pages", arguments: { data: w3.toString("base64"), format: "png", dpi: 72 } });
  const s = await sharp(Buffer.from(r.structuredContent.images[0].data, "base64")).stats();
  console.log("w3 dummy.pdf (embedded font)".padEnd(28), "min", s.channels[0].min, "mean", s.channels[0].mean.toFixed(1), s.channels[0].min < 128 ? "DRAWN" : "BLANK");
}
await c.close();
