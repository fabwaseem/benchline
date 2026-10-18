import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { categories, parents } from "../src/registry/categories";
import { tools } from "../src/registry";
import { SITE_URL } from "../src/lib/site";

const readmePath = resolve(process.cwd(), "README.md");

function replaceMarked(source: string, name: string, body: string) {
  const start = `<!-- ${name}:start -->`;
  const end = `<!-- ${name}:end -->`;
  const pattern = new RegExp(`${start}[\\s\\S]*?${end}`);
  if (!pattern.test(source)) throw new Error(`README.md is missing ${start} … ${end}`);
  return source.replace(pattern, `${start}\n\n${body.trim()}\n\n${end}`);
}

function toolLink(slug: string, name: string) {
  return `[${name}](${SITE_URL}/t/${slug})`;
}

function toolsSection() {
  const lines = [
    `${tools.length} tools, in \`toolOrder\`. Run \`pnpm gen:readme-tools\` after adding one.`,
    "",
  ];
  for (const parent of parents) {
    const groups = categories
      .filter((category) => category.parent === parent.slug)
      .map((category) => ({
        category,
        items: tools.filter((tool) => tool.category === category.slug),
      }))
      .filter((group) => group.items.length > 0);
    if (groups.length === 0) continue;
    lines.push(`### ${parent.name}`, "", parent.description, "");
    for (const group of groups) {
      if (groups.length > 1) {
        lines.push(`**${group.category.name}.** ${group.category.description}`, "");
      }
      for (const tool of group.items) {
        lines.push(`- ${toolLink(tool.slug, tool.name)} — ${tool.tagline}`);
      }
      lines.push("");
    }
  }
  return lines.join("\n").trim();
}

function privacySection() {
  const local = tools.filter((tool) => tool.runsLocally);
  const remote = tools.filter((tool) => !tool.runsLocally);
  const lines = [
    `${local.length} tools run entirely in the browser. Text, files, and results stay on the device.`,
    "",
    `${remote.length} tools can fetch a public URL through this site. The page posts the URL or hostname you submit, the route fetches that address and does not write it anywhere, and private addresses are refused. Those routes allow 8 requests from one address every 10 minutes.`,
    "",
  ];
  for (const tool of remote) {
    lines.push(`- ${toolLink(tool.slug, tool.name)} — ${tool.tagline}`);
  }
  return lines.join("\n").trim();
}

const readme = readFileSync(readmePath, "utf8");
const next = replaceMarked(replaceMarked(readme, "tools", toolsSection()), "privacy", privacySection());
writeFileSync(readmePath, next);
console.log(`readme: ${tools.length} tools`);
