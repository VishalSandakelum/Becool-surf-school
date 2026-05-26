/**
 * One-shot fix for the LiteSpeed-combined CSS bundles imported by
 * `import-detail-pages.mjs`. The bundles ship with absolute `/wp-content/...`
 * URLs because that's where WordPress serves its plugin assets from. We
 * keep the same files locally under `/assets/...` (no `/wp-content/` prefix),
 * so the original URLs 404 silently — which is why Font Awesome icons and
 * the Inavii social-feed icon font stop rendering on the detail pages.
 *
 * The matching transform has been added to `import-detail-pages.mjs` itself,
 * so future re-imports won't need this script. Re-run it any time the
 * existing CSS files end up with a fresh batch of `/wp-content/` URLs.
 */
import { promises as fs } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const CSS_DIR = join(__dirname, "..", "public", "css");

const SLUGS = [
  "beginner-surf-lessons",
  "intermediate-surf-lesson",
  "advanced-surf-lessons",
  "private-surfing-lessons",
  "group-surfing-packages",
  "board-rent",
];

let total = 0;
for (const slug of SLUGS) {
  const path = join(CSS_DIR, `${slug}.css`);
  let css;
  try {
    css = await fs.readFile(path, "utf8");
  } catch {
    console.warn(`  skip: ${slug}.css not found`);
    continue;
  }
  const before = css.length;
  const matches = (css.match(/\/wp-content\/(plugins|themes|uploads)\//g) || []).length;
  // Strip the `/wp-content/` prefix on plugin and theme assets so they map
  // to our local /assets/ tree. Leave /wp-content/uploads/ alone — those are
  // image URLs that the import-external-images.mjs pipeline already handles.
  css = css.replace(/\/wp-content\/(plugins|themes)\//g, "/assets/$1/");
  if (matches === 0 && css.length === before) continue;
  await fs.writeFile(path, css);
  console.log(`  ${slug}.css: rewrote ${matches} URL(s)`);
  total += matches;
}
console.log(`\nTotal rewrites: ${total}`);
