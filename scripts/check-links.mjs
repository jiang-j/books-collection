// Static link check for the docs: extracts every Markdown link and reports
// counts plus any that are not syntactically valid URLs or local paths.
// Does not hit the network, so it stays fast and deterministic in CI.
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const target = process.argv[2] || "README.md";

const source = await readFile(resolve(ROOT, target), "utf8");
const linkRe = /\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;

const links = [];
let m;
while ((m = linkRe.exec(source)) !== null) links.push(m[1]);

const invalid = [];
for (const link of links) {
  if (/^(https?:)?\/\//.test(link)) {
    try {
      new URL(link.startsWith("//") ? `https:${link}` : link);
    } catch {
      invalid.push(link);
    }
  } else if (/^(mailto:|#|\/|\.{0,2}\/)/.test(link)) {
    // relative path, anchor, or mailto — accepted
  } else {
    invalid.push(link);
  }
}

console.log(`Scanned ${target}`);
console.log(`Total links found: ${links.length}`);
if (invalid.length) {
  console.error(`Invalid links (${invalid.length}):`);
  for (const l of invalid) console.error(`  - ${l}`);
  process.exit(1);
}
console.log("All links are syntactically valid.");
