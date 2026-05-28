/**
 * Minify public/js/site-runtime.js in place.
 *
 * Uses Next.js's bundled SWC (already on disk because Next.js depends on it),
 * so we don't add a new devDependency. PageSpeed reported ~2.6 KB savings
 * vs the un-minified file.
 *
 * Run: `node src/minify-runtime.mjs`
 *
 * The source file is the editable copy. We write the minified output to
 * public/js/site-runtime.min.js and bump app/layout.tsx's <Script src=...>
 * to point at it. The `?v=N` cache buster in layout.tsx still applies; bump
 * it whenever the runtime changes.
 */
import { promises as fs } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { minify } from "next/dist/build/swc/index.js";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const ROOT = join(__dirname, "..");
const SRC = join(ROOT, "public", "js", "site-runtime.js");
const OUT = join(ROOT, "public", "js", "site-runtime.min.js");

const source = await fs.readFile(SRC, "utf8");
const beforeBytes = Buffer.byteLength(source, "utf8");

const { code } = await minify(source, {
  compress: true,
  mangle: true,
  format: { comments: false },
  sourceMap: false,
});

if (!code) {
  console.error("SWC returned empty output — aborting");
  process.exit(1);
}

await fs.writeFile(OUT, code, "utf8");
const afterBytes = Buffer.byteLength(code, "utf8");
const savings = ((1 - afterBytes / beforeBytes) * 100).toFixed(1);
console.log(
  `site-runtime.js: ${(beforeBytes / 1024).toFixed(1)} KB -> ${(
    afterBytes / 1024
  ).toFixed(1)} KB (-${savings}%)`,
);
