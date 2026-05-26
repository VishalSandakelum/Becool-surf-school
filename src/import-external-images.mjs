/**
 * Pull every becoolsrilanka.com image referenced by the saved page bodies,
 * resize-cap it at 1920 px wide, encode JPG (mozjpeg) + WebP + AVIF, and
 * leave it under public/images/ so the static export is fully self-hosted.
 *
 *   - Slideshow / hero images live in `data-settings` JSON inside each
 *     page's HTML and currently load over an extra TLS connection to the
 *     WordPress CDN, which delays LCP on every cold page load.
 *   - After this runs, `import-external-images.mjs --rewrite` re-points the
 *     HTML at the local copies. The two phases are split so the download
 *     can be re-run without rewriting markup, and vice versa.
 *
 * Run:
 *   node src/import-external-images.mjs            # download + encode only
 *   node src/import-external-images.mjs --rewrite  # download + rewrite HTML
 */
import { promises as fs, existsSync } from "node:fs";
import { join, basename, extname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const ROOT = join(__dirname, "..");
const CONTENT_DIR = join(ROOT, "src", "page-content");
const IMAGES_DIR = join(ROOT, "public", "images");
const MAX_WIDTH = 1920;

// Capture the full URL including the `https:\/\/` (or `https://`) prefix.
// Elementor's data-settings JSON escapes slashes as `\/`; plain HTML uses `/`.
// Capturing the protocol means our replacement string fully replaces the URL
// rather than leaving an orphan prefix behind it.
const EXTERNAL_HOST_RE = /https?:\\?\/\\?\/becoolsrilanka\.com\\?\/wp-content\\?\/uploads\\?\/[A-Za-z0-9._/\\-]+\.(?:webp|jpg|jpeg|png|gif)/gi;

function fmt(b) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(2)} MB`;
}

/** Decode a URL captured from HTML (Elementor escapes slashes as `\/`). */
function decode(rawMatch) {
  let s = rawMatch.replace(/\\\//g, "/");
  if (!s.startsWith("http")) s = "https://" + s;
  return s;
}

async function collectUrls() {
  const urls = new Set();
  for (const f of await fs.readdir(CONTENT_DIR)) {
    if (!f.endsWith(".html")) continue;
    const html = await fs.readFile(join(CONTENT_DIR, f), "utf8");
    for (const m of html.match(EXTERNAL_HOST_RE) ?? []) {
      urls.add(decode(m));
    }
  }
  return Array.from(urls).sort();
}

async function downloadAndEncode(url) {
  const name = basename(new URL(url).pathname);
  const ext = extname(name).toLowerCase();
  const baseName = name.slice(0, name.length - ext.length);
  // Cap the source filename to a sensible length and keep the extension.
  const localBase = baseName + ext;
  const localPath = join(IMAGES_DIR, localBase);

  if (existsSync(localPath) && existsSync(localPath + ".webp") && existsSync(localPath + ".avif")) {
    return { url, localBase, status: "already-local" };
  }

  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());

  let pipeline = sharp(buf, { failOn: "none" });
  const meta = await pipeline.metadata();
  if (meta.width && meta.width > MAX_WIDTH) {
    pipeline = pipeline.resize({ width: MAX_WIDTH, withoutEnlargement: true });
  }

  // 1. Re-encode the original format.
  let primaryBuf;
  if (ext === ".jpg" || ext === ".jpeg") {
    primaryBuf = await pipeline.jpeg({ quality: 82, progressive: true, mozjpeg: true }).toBuffer();
  } else if (ext === ".png") {
    primaryBuf = await pipeline.png({ compressionLevel: 9, palette: true, quality: 90 }).toBuffer();
  } else if (ext === ".webp") {
    primaryBuf = await pipeline.webp({ quality: 82, effort: 5 }).toBuffer();
  } else {
    primaryBuf = buf;
  }
  await fs.writeFile(localPath, primaryBuf);

  // 2. Always produce a `<name>.webp` companion (even when the primary is
  //    already webp — re-encoding from the resized source is smaller).
  const webpBuf = await sharp(primaryBuf, { failOn: "none" })
    .webp({ quality: 80, effort: 5 })
    .toBuffer();
  await fs.writeFile(localPath + ".webp", webpBuf);

  // 3. AVIF — markedly smaller again, supported by all evergreen browsers.
  const avifBuf = await sharp(primaryBuf, { failOn: "none" })
    .avif({ quality: 55, effort: 4, chromaSubsampling: "4:2:0" })
    .toBuffer();
  await fs.writeFile(localPath + ".avif", avifBuf);

  return {
    url,
    localBase,
    status: "imported",
    bytes: { remote: buf.length, primary: primaryBuf.length, webp: webpBuf.length, avif: avifBuf.length },
  };
}

async function rewriteHtmlFiles(map) {
  let totalRewrites = 0;
  for (const f of await fs.readdir(CONTENT_DIR)) {
    if (!f.endsWith(".html")) continue;
    const path = join(CONTENT_DIR, f);
    let html = await fs.readFile(path, "utf8");
    let count = 0;
    html = html.replace(EXTERNAL_HOST_RE, (m) => {
      const decoded = decode(m);
      const local = map.get(decoded);
      if (!local) return m;
      count++;
      // Re-encode slashes the same way Elementor's data-settings JSON does
      // so the markup stays byte-identical apart from the URL.
      return `\\/images\\/${local}`.replace(/\\\//g, m.includes("\\/") ? "\\/" : "/");
    });
    if (count > 0) {
      await fs.writeFile(path, html);
      console.log(`  ${f}: rewrote ${count} URL(s)`);
      totalRewrites += count;
    }
  }
  return totalRewrites;
}

async function main() {
  const wantRewrite = process.argv.includes("--rewrite");
  const urls = await collectUrls();
  console.log(`Found ${urls.length} external image URLs.\n`);

  const map = new Map();
  let imported = 0;
  let savedRemote = 0;
  let savedAvif = 0;
  for (const url of urls) {
    try {
      const r = await downloadAndEncode(url);
      map.set(url, r.localBase);
      if (r.status === "imported") {
        imported++;
        savedRemote += r.bytes.remote;
        savedAvif += r.bytes.avif;
        console.log(
          `${r.localBase}  remote ${fmt(r.bytes.remote)} → primary ${fmt(r.bytes.primary)} · webp ${fmt(r.bytes.webp)} · avif ${fmt(r.bytes.avif)}`
        );
      } else {
        console.log(`${r.localBase}  (already imported, skipped)`);
      }
    } catch (err) {
      console.error(`✗ ${url}  ${err.message}`);
    }
  }

  console.log(
    `\nImported ${imported}/${urls.length}. Remote payload was ${fmt(savedRemote)}; AVIF total ${fmt(savedAvif)}.`
  );

  if (wantRewrite) {
    console.log("\nRewriting page-content HTML to local paths…");
    const n = await rewriteHtmlFiles(map);
    console.log(`Total URL rewrites: ${n}`);
  } else {
    console.log("\n(Re-run with --rewrite to also update src/page-content/*.html.)");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
