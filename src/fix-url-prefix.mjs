/**
 * One-shot fix: when import-external-images.mjs first ran, its regex began
 * at `becoolsrilanka.com` instead of at the protocol, so replacing the
 * captured chunk with `\/images\/...` left an orphan `https:\/\/` prefix —
 * the rewritten URL ended up looking like `https:\/\/\/images\/foo.webp`.
 *
 * This script strips that orphan prefix everywhere in src/page-content/*.
 * Once it has run successfully, the regex inside import-external-images.mjs
 * has been widened to match the full `https:\/\/becoolsrilanka.com\/...`
 * URL, so future re-imports won't reintroduce the bug.
 */
import { promises as fs } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const CONTENT_DIR = join(__dirname, "..", "src", "page-content");

// Match either escaped or unescaped slashes — Elementor data-settings JSON
// uses `\/`, while plain href attributes use `/`.
const PATTERNS = [
  { from: /https:\\\/\\\/\\\/images\\\//g, to: "\\/images\\/" },
  { from: /https:\/\/\/images\//g, to: "/images/" },
];

const files = (await fs.readdir(CONTENT_DIR)).filter((f) => f.endsWith(".html"));

let total = 0;
for (const f of files) {
  const path = join(CONTENT_DIR, f);
  let html = await fs.readFile(path, "utf8");
  let count = 0;
  for (const { from, to } of PATTERNS) {
    const before = (html.match(from) ?? []).length;
    html = html.replace(from, to);
    count += before;
  }
  if (count > 0) {
    await fs.writeFile(path, html);
    console.log(`${f}  fixed ${count} URL(s)`);
    total += count;
  }
}
console.log(`\nTotal: ${total}`);
