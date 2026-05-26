/**
 * Generate WebP and AVIF companions of every JPG/PNG/WebP under public/images
 * and public/assets, then emit src/image-variants.json so the middleware can
 * tell at request time whether a given path has each format on disk.
 *
 *   path/foo.jpg          (the original)
 *   path/foo.jpg.webp     (~25–35% smaller than mozjpeg quality-82 JPG)
 *   path/foo.jpg.avif     (~25–35% smaller again than the WebP)
 *
 * The browser advertises support via the Accept header. Middleware picks
 * AVIF first, falls back to WebP, and finally serves the original — see
 * middleware.ts. If a re-encode would be larger than the source, we delete
 * it so we never serve a regression.
 *
 * Run: node src/generate-webp.mjs
 */
import { promises as fs, existsSync, statSync } from "node:fs";
import { join, extname, relative } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const PROJECT_ROOT = join(__dirname, "..");
const ROOTS = [
  join(PROJECT_ROOT, "public", "images"),
  join(PROJECT_ROOT, "public", "assets"),
];
const SKIP = ["litespeed-cache", "node_modules"];

const ENCODERS = [
  {
    ext: ".webp",
    encode: (p) => p.webp({ quality: 80, effort: 5, alphaQuality: 90 }),
  },
  {
    ext: ".avif",
    encode: (p) => p.avif({ quality: 55, effort: 4, chromaSubsampling: "4:2:0" }),
  },
];

async function* walk(dir) {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    const full = join(dir, e.name);
    if (SKIP.some((s) => full.includes(s))) continue;
    if (e.isDirectory()) yield* walk(full);
    else yield full;
  }
}

function fmt(b) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(2)} MB`;
}

async function isUpToDate(source, target) {
  if (!existsSync(target)) return false;
  return statSync(target).mtimeMs >= statSync(source).mtimeMs;
}

async function convertOne(file, encoderEntry) {
  const target = file + encoderEntry.ext;
  if (await isUpToDate(file, target)) return { file, target, status: "skip" };

  const sourceSize = (await fs.stat(file)).size;
  try {
    await encoderEntry
      .encode(sharp(file, { failOn: "none" }))
      .toFile(target);
  } catch (err) {
    return { file, target, status: "error", error: err.message };
  }
  const targetSize = (await fs.stat(target)).size;
  if (targetSize >= sourceSize) {
    await fs.unlink(target);
    return { file, target, status: "kept-source", sourceSize, targetSize };
  }
  return { file, target, status: "ok", sourceSize, targetSize };
}

async function main() {
  const files = [];
  for (const root of ROOTS) {
    for await (const f of walk(root)) {
      if (/\.(jpe?g|png|webp)$/i.test(f)) files.push(f);
    }
  }

  const counters = { ok: 0, skip: 0, "kept-source": 0, error: 0 };
  const saved = { webp: 0, avif: 0 };

  for (const f of files) {
    const ext = extname(f).toLowerCase();
    for (const enc of ENCODERS) {
      // Don't re-encode a webp source as webp — it already IS the webp.
      if (ext === ".webp" && enc.ext === ".webp") continue;
      const r = await convertOne(f, enc);
      counters[r.status]++;
      if (r.status === "ok") {
        const key = enc.ext.replace(".", "");
        saved[key] += r.sourceSize - r.targetSize;
        const pct = (((r.sourceSize - r.targetSize) / r.sourceSize) * 100).toFixed(0);
        console.log(
          `${enc.ext}  ${relative(PROJECT_ROOT, f)}  ${fmt(r.sourceSize)} → ${fmt(r.targetSize)}  (-${pct}%)`
        );
      } else if (r.status === "error") {
        console.log(`✗ ${relative(PROJECT_ROOT, r.target)}  ${r.error}`);
      }
    }
  }

  await writeManifest();
  console.log("");
  console.log(
    `OK: ${counters.ok}   Up-to-date: ${counters.skip}   Skipped (larger than source): ${counters["kept-source"]}   Errors: ${counters.error}`
  );
  console.log(`Saved by WebP: ${fmt(saved.webp)}   Saved by AVIF: ${fmt(saved.avif)}`);
}

/**
 * Emit src/image-variants.json — for every source path under public/, list
 * which companion formats exist on disk. Middleware reads this once at boot
 * and uses it to pick the best format the requesting browser advertises.
 */
async function writeManifest() {
  const variants = {};
  for (const root of ROOTS) {
    for await (const f of walk(root)) {
      if (!/\.(jpe?g|png|webp)$/i.test(f)) continue;
      const sourceExt = extname(f).toLowerCase();
      const rel = "/" + relative(join(PROJECT_ROOT, "public"), f).replace(/\\/g, "/");
      const entry = { webp: false, avif: false };
      // A `.webp` source counts as "has webp" without needing a companion.
      if (sourceExt === ".webp") entry.webp = true;
      else if (existsSync(f + ".webp")) entry.webp = true;
      if (existsSync(f + ".avif")) entry.avif = true;
      if (entry.webp || entry.avif) variants[rel] = entry;
    }
  }
  const out = join(PROJECT_ROOT, "src", "image-variants.json");
  await fs.writeFile(out, JSON.stringify(variants, null, 0));
  console.log(`Wrote ${Object.keys(variants).length} entries to src/image-variants.json`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
