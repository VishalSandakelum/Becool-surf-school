import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
// Static-site source is a sibling of the nextjs/ folder (after the project split).
const ROOT = join(__dirname, "..", "..", "static-site");
const OUT = join(__dirname, "page-content");

const PAGES = [
  { src: "index.html",     out: "home" },
  { src: "about.html",     out: "about" },
  { src: "package.html",   out: "package" },
  { src: "services.html",  out: "services" },
  { src: "book-now.html",  out: "book-now" }
];

for (const { src, out } of PAGES) {
  const html = readFileSync(join(ROOT, src), "utf8");

  const bodyOpen  = html.match(/<body\b([^>]*)>/i);
  const bodyClose = html.lastIndexOf("</body>");
  if (!bodyOpen || bodyClose === -1) throw new Error(`Body not found in ${src}`);

  const bodyAttrs = bodyOpen[1];
  const bodyClassMatch  = bodyAttrs.match(/\bclass\s*=\s*"([^"]*)"/i);
  const bodyClass = bodyClassMatch ? bodyClassMatch[1] : "";

  let bodyInner = html.slice(bodyOpen.index + bodyOpen[0].length, bodyClose);

  // -4) Fast image loading. The WP export uses LiteSpeed's JS-based lazy loader
  //     (src="data:image/svg+xml;…" + data-src="real.jpg") — every image waits
  //     for /js/<page>.js (1.2 MB) to download/parse/execute before rendering.
  //     Switch to native browser lazy loading:
  //       - copy data-src into src (so placeholder data: URIs are gone)
  //       - drop data-src + data-lazyloaded
  //       - add loading="lazy" decoding="async" if missing
  //     The first <img> in document order — almost always the LCP/hero — gets
  //     loading="eager" + fetchpriority="high" so it starts downloading from
  //     the initial HTML response, no JS required.
  let imgIndex = 0;
  bodyInner = bodyInner.replace(/<img\b([^>]*)>/gi, (full, attrs) => {
    // Drop XHTML self-closing slash (e.g. `<img ... />`) before appending attrs
    let a = attrs.replace(/\s*\/\s*$/, "");
    // Pull data-src and replace src= placeholder with it
    const dataSrcMatch = /\bdata-src="([^"]+)"/.exec(a);
    if (dataSrcMatch) {
      const realSrc = dataSrcMatch[1];
      a = a.replace(/\bsrc="[^"]*"/, `src="${realSrc}"`);
      // If somehow there was no src attr at all, append one
      if (!/\bsrc=/.test(a)) a = ` src="${realSrc}"` + a;
      a = a.replace(/\s*data-src="[^"]*"/, "");
    }
    // Drop LiteSpeed's lazy-load marker
    a = a.replace(/\s*data-lazyloaded="[^"]*"/, "");

    // Eager + high priority for the first image, native lazy for the rest
    const isFirst = imgIndex === 0;
    imgIndex++;

    // Strip any existing loading=, fetchpriority=, decoding= so we can rewrite them cleanly
    a = a.replace(/\s*loading="[^"]*"/, "");
    a = a.replace(/\s*fetchpriority="[^"]*"/, "");
    a = a.replace(/\s*decoding="[^"]*"/, "");

    const loadingHint = isFirst
      ? ' loading="eager" fetchpriority="high" decoding="async"'
      : ' loading="lazy" decoding="async"';

    return `<img${a}${loadingHint}>`;
  });

  // -3) Fill empty <img alt=""> with descriptive text derived from the filename.
  //     Empty alt attributes are an SEO miss; Google Image Search and overall
  //     accessibility both reward descriptive alt text. We derive the alt from
  //     the file's basename, strip the WordPress size suffix (-1024x768), turn
  //     dashes into spaces, title-case it, and append a brand/location anchor.
  const altSuffix = " | Be Cool Surf School Weligama, Sri Lanka";
  const filenameToAlt = (src) => {
    if (!src) return "";
    const base = src.split("/").pop() || "";
    let stem = base.replace(/\.[a-z0-9]+$/i, ""); // drop extension
    stem = stem.replace(/-\d+x\d+$/i, ""); // drop -1024x768 size suffix
    stem = stem.replace(/-scaled$/i, "");
    stem = stem.replace(/[-_]+/g, " ").trim();
    if (!stem) return "";
    // Title-case
    stem = stem.replace(/\b([a-z])/g, (m) => m.toUpperCase());
    return stem + altSuffix;
  };
  bodyInner = bodyInner.replace(
    /<img\b([^>]*?)\balt=""([^>]*)>/gi,
    (match, before, after) => {
      const srcMatch =
        /\bsrc="([^"]+)"/.exec(match) ||
        /\bdata-src="([^"]+)"/.exec(match);
      if (!srcMatch) return match;
      const alt = filenameToAlt(srcMatch[1]);
      if (!alt) return match;
      return `<img${before}alt="${alt}"${after}>`;
    }
  );

  // -2) Rewrite absolute font URLs that point back to the live WordPress site —
  //     they fail with CORS in dev. We have local copies at /fonts/.
  bodyInner = bodyInner.replace(
    /https:\/\/becoolsrilanka\.com\/fonts\//g,
    "/fonts/"
  );

  // -1) Fix MetForm date-picker config bug from the WP export. The "Disable past
  //     dates" toggle was saved as "yes" instead of the Flatpickr-valid "today",
  //     which throws "Invalid date provided: yes" at runtime.
  bodyInner = bodyInner.replace(/"minDate":"yes"/g, '"minDate":"today"');
  bodyInner = bodyInner.replace(/"maxDate":"yes"/g, '"maxDate":"today"');

  // 0) Strip <script type="speculationrules">…</script> — these prefetch hints
  //    are a no-op when inserted via dangerouslySetInnerHTML and trigger a noisy
  //    React warning. Browsers only honour them in the original document parse.
  bodyInner = bodyInner.replace(
    /<script\b[^>]*\btype=["']speculationrules["'][^>]*>[\s\S]*?<\/script>/gi,
    ""
  );

  // 0.5) Strip the inline LiteSpeed LazyLoad script block. The WP export embeds
  //      a ~8 KB self-init LazyLoad library at the end of every page body. We
  //      already convert every `data-src` placeholder to native lazy loading
  //      earlier in this pipeline, so the library has nothing to do at runtime
  //      — it just logs "[LiteSpeed] Start Lazy Load" to the console (twice
  //      in dev because of React StrictMode's double-mount).
  bodyInner = bodyInner.replace(
    /<script\b[^>]*>[\s\S]*?<\/script>/gi,
    (m) => (/lazyLoadOptions|LazyLoad|litespeed_lazyloaded/i.test(m) ? "" : m)
  );

  // 1) Strip ALL external <script src="..."></script> tags. PageShell + layout
  //    re-add them via Next.js <Script> components so React StrictMode's double-
  //    mount in dev does not double-execute scripts that declare top-level
  //    `let`/`const` globals (e.g. instant_click.min.js).
  //    Capture the srcs first so they can be replayed via <Script>.
  const externalScripts = [];
  bodyInner = bodyInner.replace(
    /<script\b([^>]*)\bsrc=("[^"]+"|'[^']+')([^>]*)><\/script>/gi,
    (_match, _pre, srcAttr, _post) => {
      let src = srcAttr.slice(1, -1);
      // Drop the page-specific bundle here — PageShell loads /js/<slug>.js explicitly.
      if (new RegExp(`(^|/)js/${out}\\.js(\\?|$)`).test(src)) return "";
      // Convert relative paths to absolute so they work on /about, /package, etc.
      if (!/^([a-z]+:)?\/\//i.test(src) && !src.startsWith("/")) {
        src = "/" + src;
      }
      externalScripts.push(src);
      return "";
    }
  );

  // 2) Rewrite relative asset paths to absolute (so they work on /about, /package, etc.)
  //    Match any HTML attribute value that starts with one of our top-level dirs,
  //    including data-src=, data-srcset=, srcset=, poster=, etc. JSON-encoded
  //    data-settings values use &quot; entities so won't be touched by the `="` pattern.
  const ROOT_DIRS = ["images", "fonts", "css", "js", "assets"];
  for (const dir of ROOT_DIRS) {
    bodyInner = bodyInner.replace(
      new RegExp(`="${dir}/`, "g"),
      `="/${dir}/`
    );
    // Inside srcset / data-srcset comma-separated lists (subsequent entries)
    bodyInner = bodyInner.replace(
      new RegExp(`(,\\s*)${dir}/`, "g"),
      `$1/${dir}/`
    );
  }

  // 2.5) Rewrite legacy `.html` navigation links to Next.js route paths.
  //     The static-site WordPress export was built to be served as plain
  //     HTML files (`href="about.html"`, `href="services.html"`, etc.), but
  //     our Next.js routes have no `.html` suffix. Without this rewrite,
  //     every header/footer/nav link 404s after a fresh extract.
  const NAV_LINK_MAP = {
    "index.html": "/",
    "about.html": "/about",
    "package.html": "/package",
    "services.html": "/services",
    "book-now.html": "/book-now",
  };
  for (const [file, route] of Object.entries(NAV_LINK_MAP)) {
    const escaped = file.replace(/\./g, "\\.");
    const re = new RegExp(`href="(?:\\./)?${escaped}(\\?[^"]*)?"`, "g");
    bodyInner = bodyInner.replace(re, `href="${route}$1"`);
  }

  const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
  const title = titleMatch ? titleMatch[1] : "";

  const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i);
  const description = descMatch ? descMatch[1] : "";

  writeFileSync(join(OUT, `${out}.html`), bodyInner);
  writeFileSync(
    join(OUT, `${out}.meta.json`),
    JSON.stringify({ title, description, bodyClass, externalScripts }, null, 2)
  );
  console.log(`✓ ${src} -> ${out}.html  (body class: "${bodyClass.slice(0,60)}...")`);
}
