/**
 * Remove the inline LiteSpeed LazyLoad `<script>` block from every
 * imported page body.
 *
 * The WordPress export shipped its own JS-based lazy loader: each page
 * carries a `<script data-no-optimize="1">…LazyLoad…</script>` block at
 * the end of the body that scans for `[data-lazyloaded]` images and
 * swaps their placeholder src with the real one.
 *
 * `extract.mjs` and `import-detail-pages.mjs` already convert every
 * lazy-loaded `<img>` to native `loading="lazy"` and strip the
 * `data-lazyloaded` / `data-src` attributes, so by the time the page
 * reaches the browser there's nothing for the LazyLoad library to do.
 * The only thing it produces is a "[LiteSpeed] Start Lazy Load" console
 * log — which fires twice in dev because of React StrictMode's
 * double-mount.
 *
 * This script removes those dead scripts from every page-content/*.html
 * file. The matching strip step is also baked into extract.mjs and
 * import-detail-pages.mjs so future re-imports stay clean.
 *
 * Run: node src/strip-lazyload-scripts.mjs
 */
import { promises as fs } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const CONTENT_DIR = join(__dirname, "..", "src", "page-content");

/**
 * Remove every `<script>…</script>` block whose body mentions any of the
 * LiteSpeed LazyLoader identifiers. We're deliberately lenient — there's
 * only one such block per page and we never want it.
 */
export function stripLazyLoadScripts(html) {
  return html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, (match) => {
    if (/lazyLoadOptions|LazyLoad|litespeed_lazyloaded/i.test(match)) {
      return "";
    }
    return match;
  });
}

const files = (await fs.readdir(CONTENT_DIR)).filter((f) => f.endsWith(".html"));
let total = 0;
for (const f of files) {
  const path = join(CONTENT_DIR, f);
  const before = await fs.readFile(path, "utf8");
  const after = stripLazyLoadScripts(before);
  if (after === before) continue;
  const removed = (before.length - after.length).toLocaleString();
  await fs.writeFile(path, after);
  console.log(`  ${f}: stripped LazyLoad script (${removed} bytes)`);
  total++;
}
console.log(`\nFiles modified: ${total}/${files.length}`);
