/**
 * Batch-optimise every JPG/PNG/WebP under public/images and public/assets.
 *
 * - Same path, same format, smaller bytes (no URL or markup change).
 * - JPGs: mozjpeg, quality 82, progressive.
 * - PNGs: zlib level 9, palette where possible.
 * - WebPs: quality 82, near-lossless on alpha.
 * - Skips files where the optimised version is not smaller (keeps original).
 * - Skips files inside node_modules and assets/plugins/litespeed-cache (cached
 *   bundles where any change risks breaking the LiteSpeed bundle hash).
 *
 * Run: node src/optimize-images.mjs
 */
import { promises as fs } from "node:fs";
import { join, extname, relative } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const PROJECT_ROOT = join(__dirname, "..");
const ROOTS = [
  join(PROJECT_ROOT, "public", "images"),
  join(PROJECT_ROOT, "public", "assets"),
];

const SKIP_PATH_FRAGMENTS = ["litespeed-cache", "node_modules"];

async function* walk(dir) {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    const full = join(dir, e.name);
    if (SKIP_PATH_FRAGMENTS.some((s) => full.includes(s))) continue;
    if (e.isDirectory()) {
      yield* walk(full);
    } else {
      yield full;
    }
  }
}

async function optimiseOne(file) {
  const ext = extname(file).toLowerCase();
  const original = await fs.readFile(file);
  const originalSize = original.length;

  let pipeline;
  try {
    pipeline = sharp(original, { failOn: "none" });
  } catch {
    return { file, skipped: "sharp-init-failed", originalSize };
  }

  const meta = await pipeline.metadata().catch(() => null);
  if (!meta) return { file, skipped: "no-metadata", originalSize };

  let out;
  try {
    if (ext === ".jpg" || ext === ".jpeg") {
      out = await pipeline.jpeg({ quality: 82, progressive: true, mozjpeg: true }).toBuffer();
    } else if (ext === ".png") {
      out = await pipeline.png({ compressionLevel: 9, palette: true, quality: 90 }).toBuffer();
    } else if (ext === ".webp") {
      out = await pipeline.webp({ quality: 82, effort: 5, alphaQuality: 90 }).toBuffer();
    } else {
      return { file, skipped: ext, originalSize };
    }
  } catch (err) {
    return { file, skipped: `encode-failed: ${err.message}`, originalSize };
  }

  if (out.length >= originalSize) {
    return { file, kept: true, originalSize, newSize: out.length };
  }
  await fs.writeFile(file, out);
  return { file, optimised: true, originalSize, newSize: out.length };
}

function fmt(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

async function main() {
  const files = [];
  for (const root of ROOTS) {
    for await (const f of walk(root)) {
      if (/\.(jpe?g|png|webp)$/i.test(f)) files.push(f);
    }
  }
  console.log(`Found ${files.length} image files to inspect.\n`);

  let savedBytes = 0;
  let optimisedCount = 0;
  let keptCount = 0;
  let skippedCount = 0;

  for (const f of files) {
    const r = await optimiseOne(f);
    const rel = relative(PROJECT_ROOT, f);
    if (r.optimised) {
      const saved = r.originalSize - r.newSize;
      savedBytes += saved;
      optimisedCount++;
      const pct = ((saved / r.originalSize) * 100).toFixed(0);
      console.log(`✓ ${rel}  ${fmt(r.originalSize)} → ${fmt(r.newSize)}  (-${pct}%)`);
    } else if (r.kept) {
      keptCount++;
    } else {
      skippedCount++;
    }
  }

  console.log("");
  console.log(`Optimised: ${optimisedCount}   Already-optimal: ${keptCount}   Skipped: ${skippedCount}`);
  console.log(`Total bytes saved: ${fmt(savedBytes)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
