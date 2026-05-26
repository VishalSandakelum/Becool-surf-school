/**
 * Convert legacy `.html` navigation links to Next.js route paths.
 *
 * The pristine WordPress static export under /static-site uses plain HTML
 * file URLs in every header / footer / button:
 *
 *     <a href="about.html">     ← was a real file in the static site
 *     <a href="services.html">  ← same
 *
 * Our Next.js app exposes those pages at clean routes (`/about`,
 * `/services`, …) with NO `.html` suffix, so every one of those links
 * 404s in dev and breaks LiteSpeed instant-click prefetches.
 *
 * This script rewrites them once across all five imported page bodies.
 * The same transform is also baked into extract.mjs so future re-imports
 * don't reintroduce the old URLs.
 *
 * Run: node src/fix-html-nav-links.mjs
 */
import { promises as fs } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const CONTENT_DIR = join(__dirname, "..", "src", "page-content");

const NAV_LINK_MAP = {
  "index.html": "/",
  "about.html": "/about",
  "package.html": "/package",
  "services.html": "/services",
  "book-now.html": "/book-now",
};

export function rewriteNavLinks(html) {
  let out = html;
  for (const [file, route] of Object.entries(NAV_LINK_MAP)) {
    // Matches `href="<file>"` and `href="./<file>"` and `href="<file>?qs"`.
    const escaped = file.replace(/\./g, "\\.");
    const re = new RegExp(`href="(?:\\./)?${escaped}(\\?[^"]*)?"`, "g");
    out = out.replace(re, `href="${route}$1"`);
  }
  return out;
}

async function main() {
  const files = (await fs.readdir(CONTENT_DIR)).filter((f) =>
    f.endsWith(".html")
  );
  let total = 0;
  for (const f of files) {
    const path = join(CONTENT_DIR, f);
    const before = await fs.readFile(path, "utf8");
    const after = rewriteNavLinks(before);
    if (after === before) continue;
    const beforeCount = (before.match(/href="(index|about|package|services|book-now)\.html"/g) || []).length;
    await fs.writeFile(path, after);
    console.log(`  ${f}: rewrote ${beforeCount} link(s)`);
    total += beforeCount;
  }
  console.log(`\nTotal nav-link rewrites: ${total}`);
}

// Always run when invoked directly — the import.meta.url vs argv[1]
// guard is unreliable on Windows because of the `file:///` triple-slash.
main();
