/**
 * Rewrite the absolute becoolsrilanka.com URLs that point at the six
 * service-detail pages so they target our local Next.js routes instead.
 * The URLs appear in two places per card: the `data-ep-wrapper-link` JSON
 * attribute (escaped JSON inside an HTML attribute, with `\/` separators)
 * and the inner `<a href="…">` tag.
 *
 * Run once after `import-detail-pages.mjs` succeeds:
 *   node src/rewrite-detail-links.mjs
 */
import { promises as fs } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const CONTENT_DIR = join(__dirname, "..", "src", "page-content");

const SLUGS = [
  "beginner-surf-lessons",
  "intermediate-surf-lesson",
  "advanced-surf-lessons",
  "private-surfing-lessons",
  "group-surfing-packages",
  "board-rent",
];

const files = (await fs.readdir(CONTENT_DIR)).filter((f) => f.endsWith(".html"));

let total = 0;
for (const f of files) {
  const path = join(CONTENT_DIR, f);
  let html = await fs.readFile(path, "utf8");
  let countForThisFile = 0;

  for (const slug of SLUGS) {
    // 1. data-ep-wrapper-link uses escaped JSON: https:\/\/becoolsrilanka.com\/<slug>\/
    const jsonForm = new RegExp(
      `https:\\\\\\/\\\\\\/becoolsrilanka\\.com\\\\\\/${escapeRegex(slug)}\\\\\\/`,
      "g"
    );
    const jsonHits = (html.match(jsonForm) || []).length;
    html = html.replace(jsonForm, `\\/${slug}`);

    // 2. Plain href URLs: https://becoolsrilanka.com/<slug>/
    const plainForm = new RegExp(
      `https:\\/\\/becoolsrilanka\\.com\\/${escapeRegex(slug)}\\/`,
      "g"
    );
    const plainHits = (html.match(plainForm) || []).length;
    html = html.replace(plainForm, `/${slug}`);

    if (jsonHits + plainHits > 0) {
      console.log(
        `  ${f}: ${slug}  json=${jsonHits}  plain=${plainHits}`
      );
      countForThisFile += jsonHits + plainHits;
    }
  }

  if (countForThisFile > 0) {
    await fs.writeFile(path, html);
    total += countForThisFile;
  }
}
console.log(`\nTotal rewrites: ${total}`);

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
