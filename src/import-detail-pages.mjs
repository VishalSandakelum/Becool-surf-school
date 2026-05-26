/**
 * Import the six service-detail pages that originally lived on
 * becoolsrilanka.com (the WordPress site). Each card on /services links to
 * one of these slugs; without local copies the cards either go nowhere (the
 * Element Pack click wrapper requires WP runtime JS) or bounce the visitor
 * back to the live WordPress site.
 *
 * For each slug we:
 *   1. Fetch the rendered HTML over HTTPS.
 *   2. Pull the body class, <title>, meta description.
 *   3. Identify the LiteSpeed-combined stylesheet linked from <head> and
 *      save it to public/css/<slug>.css so PageShell's per-page CSS pattern
 *      keeps working with no extra wiring.
 *   4. Apply the same body transforms used by `extract.mjs`:
 *        - replace LiteSpeed's lazy-loader (`data-src=`) with native
 *          `loading="lazy"`,
 *        - flag the first <img> as `loading="eager" fetchpriority="high"`,
 *        - fill empty alt="" with derived text,
 *        - rewrite cross-origin font URLs to /fonts/,
 *        - patch the MetForm `minDate:"yes"` config bug,
 *        - drop <script type="speculationrules"> and external <script src=…>
 *          tags (PageShell adds them back via <Script> if we ever want to),
 *        - rewrite relative asset paths (`assets/...`, `images/...`, etc.)
 *          to absolute so the route works at any depth.
 *   5. Write src/page-content/<slug>.html and <slug>.meta.json.
 *
 * Run: node src/import-detail-pages.mjs
 */
import { promises as fs } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const ROOT = join(__dirname, "..");
const CONTENT_DIR = join(ROOT, "src", "page-content");
const CSS_DIR = join(ROOT, "public", "css");

const SLUGS = [
  "beginner-surf-lessons",
  "intermediate-surf-lesson",
  "advanced-surf-lessons",
  "private-surfing-lessons",
  "group-surfing-packages",
  "board-rent",
];

const BASE = "https://becoolsrilanka.com";
const ROOT_DIRS = ["images", "fonts", "css", "js", "assets"];
const ALT_SUFFIX = " | Be Cool Surf School Weligama, Sri Lanka";

function fmt(b) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(2)} MB`;
}

function filenameToAlt(src) {
  if (!src) return "";
  const base = src.split("/").pop() || "";
  let stem = base.replace(/\.[a-z0-9]+$/i, "");
  stem = stem.replace(/-\d+x\d+$/i, "");
  stem = stem.replace(/-scaled$/i, "");
  stem = stem.replace(/[-_]+/g, " ").trim();
  if (!stem) return "";
  stem = stem.replace(/\b([a-z])/g, (m) => m.toUpperCase());
  return stem + ALT_SUFFIX;
}

function transformBody(bodyInner, slug) {
  let imgIndex = 0;
  bodyInner = bodyInner.replace(/<img\b([^>]*)>/gi, (_full, attrs) => {
    let a = attrs.replace(/\s*\/\s*$/, "");
    const dataSrc = /\bdata-src="([^"]+)"/.exec(a);
    if (dataSrc) {
      const real = dataSrc[1];
      a = a.replace(/\bsrc="[^"]*"/, `src="${real}"`);
      if (!/\bsrc=/.test(a)) a = ` src="${real}"` + a;
      a = a.replace(/\s*data-src="[^"]*"/, "");
    }
    a = a.replace(/\s*data-lazyloaded="[^"]*"/, "");
    a = a.replace(/\s*loading="[^"]*"/, "");
    a = a.replace(/\s*fetchpriority="[^"]*"/, "");
    a = a.replace(/\s*decoding="[^"]*"/, "");
    const hint =
      imgIndex === 0
        ? ' loading="eager" fetchpriority="high" decoding="async"'
        : ' loading="lazy" decoding="async"';
    imgIndex++;
    return `<img${a}${hint}>`;
  });

  bodyInner = bodyInner.replace(
    /<img\b([^>]*?)\balt=""([^>]*)>/gi,
    (match, before, after) => {
      const srcMatch =
        /\bsrc="([^"]+)"/.exec(match) || /\bdata-src="([^"]+)"/.exec(match);
      if (!srcMatch) return match;
      const alt = filenameToAlt(srcMatch[1]);
      if (!alt) return match;
      return `<img${before}alt="${alt}"${after}>`;
    }
  );

  bodyInner = bodyInner.replace(
    /https:\/\/becoolsrilanka\.com\/fonts\//g,
    "/fonts/"
  );

  bodyInner = bodyInner.replace(/"minDate":"yes"/g, '"minDate":"today"');
  bodyInner = bodyInner.replace(/"maxDate":"yes"/g, '"maxDate":"today"');

  bodyInner = bodyInner.replace(
    /<script\b[^>]*\btype=["']speculationrules["'][^>]*>[\s\S]*?<\/script>/gi,
    ""
  );

  // Drop the inline LiteSpeed LazyLoad library — it's dead code once we've
  // converted images to native lazy loading, and it produces a "[LiteSpeed]
  // Start Lazy Load" console log on every mount (doubled in StrictMode dev).
  bodyInner = bodyInner.replace(
    /<script\b[^>]*>[\s\S]*?<\/script>/gi,
    (m) => (/lazyLoadOptions|LazyLoad|litespeed_lazyloaded/i.test(m) ? "" : m)
  );

  const externalScripts = [];
  bodyInner = bodyInner.replace(
    /<script\b([^>]*)\bsrc=("[^"]+"|'[^']+')([^>]*)><\/script>/gi,
    (_m, _pre, srcAttr) => {
      let src = srcAttr.slice(1, -1);
      if (new RegExp(`(^|/)js/${slug}\\.js(\\?|$)`).test(src)) return "";
      if (!/^([a-z]+:)?\/\//i.test(src) && !src.startsWith("/")) {
        src = "/" + src;
      }
      externalScripts.push(src);
      return "";
    }
  );

  for (const dir of ROOT_DIRS) {
    bodyInner = bodyInner.replace(new RegExp(`="${dir}/`, "g"), `="/${dir}/`);
    bodyInner = bodyInner.replace(
      new RegExp(`(,\\s*)${dir}/`, "g"),
      `$1/${dir}/`
    );
  }

  return { body: bodyInner, externalScripts };
}

async function importOne(slug) {
  const url = `${BASE}/${slug}/`;
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const html = await res.text();

  const bodyOpen = html.match(/<body\b([^>]*)>/i);
  const bodyClose = html.lastIndexOf("</body>");
  if (!bodyOpen || bodyClose === -1) throw new Error(`No <body> in ${slug}`);
  const bodyAttrs = bodyOpen[1];
  const bodyClass = bodyAttrs.match(/\bclass\s*=\s*"([^"]*)"/i)?.[1] ?? "";
  const bodyInner = html.slice(bodyOpen.index + bodyOpen[0].length, bodyClose);

  const title = html.match(/<title>([^<]*)<\/title>/i)?.[1] ?? "";
  const description =
    html.match(
      /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i
    )?.[1] ?? "";

  // Pick the largest LiteSpeed-combined CSS bundle. Each WP page links one
  // hashed bundle that contains every theme + plugin + page-specific style.
  const stylesheetUrls = [
    ...html.matchAll(/<link\b[^>]*rel=["']stylesheet["'][^>]*>/gi),
  ]
    .map((m) => m[0].match(/href=["']([^"']+)["']/)?.[1])
    .filter((href) => href && /litespeed\/css\/[a-f0-9]+\.css/.test(href));
  const cssUrl = stylesheetUrls[0];
  if (!cssUrl) throw new Error(`No LiteSpeed CSS bundle linked from ${slug}`);

  const cssRes = await fetch(cssUrl, { redirect: "follow" });
  if (!cssRes.ok) throw new Error(`HTTP ${cssRes.status} for ${cssUrl}`);
  // The LiteSpeed bundle ships absolute `/wp-content/plugins|themes/...`
  // URLs because that's where WP serves its plugin assets. We keep the
  // same files locally under `/assets/plugins|themes/...` (no /wp-content/
  // prefix), so the bundle's URLs would 404 silently and break Font Awesome
  // icons + the Inavii social-feed icon font. Strip the prefix here so the
  // URLs resolve against our public/assets/ tree.
  const cssText = (await cssRes.text()).replace(
    /\/wp-content\/(plugins|themes)\//g,
    "/assets/$1/"
  );
  await fs.writeFile(join(CSS_DIR, `${slug}.css`), cssText);

  const { body, externalScripts } = transformBody(bodyInner, slug);
  await fs.writeFile(join(CONTENT_DIR, `${slug}.html`), body);
  await fs.writeFile(
    join(CONTENT_DIR, `${slug}.meta.json`),
    JSON.stringify({ title, description, bodyClass, externalScripts }, null, 2)
  );

  return {
    slug,
    htmlBytes: body.length,
    cssBytes: cssText.length,
    title,
    externalScripts: externalScripts.length,
  };
}

async function main() {
  const results = [];
  for (const slug of SLUGS) {
    try {
      const r = await importOne(slug);
      results.push(r);
      console.log(
        `✓ ${r.slug}  html=${fmt(r.htmlBytes)}  css=${fmt(r.cssBytes)}  scripts=${r.externalScripts}`
      );
    } catch (err) {
      console.error(`✗ ${slug}  ${err.message}`);
      process.exitCode = 1;
    }
  }
  console.log(`\nImported ${results.length}/${SLUGS.length} detail pages.`);
}

main();
