import type { ReactNode } from "react";
import HtmlContent from "./HtmlContent";
import BodyClass from "./BodyClass";
import SlotPortal from "./SlotPortal";
import { readPage } from "../src/readContent";
import { extractWidgetSlots } from "../src/extractSlots";
import variants from "../src/image-variants.json";
import responsive from "../src/image-responsive.json";

type Variant = { webp: boolean; avif: boolean };
const VARIANTS = variants as Record<string, Variant | undefined>;
const RESPONSIVE = responsive as Record<string, number[]>;

type Props = {
  slug: string;
  /**
   * HTML strings spliced directly into the WordPress page body in place of
   * matching widget blocks. Use this for SSR-friendly content (e.g. the
   * server-rendered Google reviews — see `lib/render-reviews-html.ts`).
   * The whole page body is still rendered as one dangerouslySetInnerHTML
   * so React hydration sees a balanced DOM tree.
   */
  staticSlots?: Record<string, string>;
  /**
   * Client React components mounted into placeholder divs after hydration.
   * The placeholder is empty in the initial HTML, so don't use this for
   * SEO-critical content (use a static slot instead). Good for interactive
   * widgets like the contact form.
   */
  clientSlots?: Record<string, ReactNode>;
};

/**
 * Renders an imported WordPress page with optional slots.
 *
 * Why we render the whole page through ONE dangerouslySetInnerHTML rather
 * than splitting the HTML into chunks around React siblings:
 *
 *   The page body is a deeply nested tree of Elementor `<div>`s. If we split
 *   the HTML mid-tree, each chunk has unbalanced open/close `<div>`s. The
 *   browser's HTML parser then auto-closes them at chunk boundaries, which
 *   leaves the constructed DOM out of sync with React's virtual tree and
 *   triggers a hydration mismatch (the visible "Expected server HTML to
 *   contain a matching <section>" error).
 *
 *   Splicing pre-rendered HTML strings into the body keeps the resulting
 *   markup balanced and lets React see exactly one HtmlContent boundary.
 */
export default function PageShell({
  slug,
  staticSlots = {},
  clientSlots = {},
}: Props) {
  const { html, meta } = readPage(slug);
  const heroImage = findFirstHeroImage(html);

  // Apply slot replacements from end to start so each splice keeps earlier
  // byte offsets stable.
  const ranges = extractWidgetSlots(html)
    .filter((r) => r.name in staticSlots || r.name in clientSlots)
    .sort((a, b) => b.start - a.start);

  let finalHtml = html;
  for (const range of ranges) {
    let replacement: string;
    if (range.name in staticSlots) {
      replacement = staticSlots[range.name];
    } else {
      // Empty placeholder — SlotPortal will mount the React component into
      // it after hydration.
      replacement = `<div data-bcss-slot="${range.name}"></div>`;
    }
    finalHtml =
      finalHtml.slice(0, range.start) + replacement + finalHtml.slice(range.end);
  }

  // Ensure copyright year is dynamically set to the current year
  finalHtml = finalHtml.replace(
    /<span class="bcss-current-year">\d{4}<\/span>/g,
    `<span class="bcss-current-year">${new Date().getFullYear()}</span>`
  );

  // Build a responsive preload for the hero. When we have pre-generated width
  // variants we hand the browser an imageSrcSet so it picks the smallest one
  // that covers the viewport (mobile gets ~75 KB AVIF instead of the original
  // 466 KB WebP). Falls back to a single-URL preload pointing at the AVIF
  // companion when only one size exists.
  const heroPreload = heroImage ? buildHeroPreload(heroImage) : null;

  return (
    <>
      {/* LCP boost: tell the browser to fetch the hero image and CSS in
          parallel. The hero is consumed via CSS background-image, which is
          a no-CORS request, so the preload must NOT carry crossOrigin —
          otherwise the credential modes don't match and the browser
          discards the preload. */}
      {heroPreload && (
        <link
          rel="preload"
          as="image"
          href={heroPreload.href}
          imageSrcSet={heroPreload.imageSrcSet}
          imageSizes={heroPreload.imageSrcSet ? "100vw" : undefined}
          fetchPriority="high"
          type={heroPreload.type}
        />
      )}
      {/* Expose the responsive variant map to site-runtime.js so applySlide()
          can pick a viewport-appropriate width. Inlined (not async-loaded) so
          it's ready before the runtime script runs. */}
      {Object.keys(RESPONSIVE).length > 0 && (
        <script
          dangerouslySetInnerHTML={{
            __html: `window.__BCSS_RESPONSIVE__=${JSON.stringify(RESPONSIVE)};`,
          }}
        />
      )}
      {/* Per-page CSS, blocking. We tried the `media="print"` + JS-swap
          pattern to dodge PageSpeed's render-block warning, but on SPA
          navigation React inserts the swap <script> via DOM mutation and
          browsers refuse to execute scripts created that way — so the new
          page painted unstyled for ~300 ms until the load event eventually
          fired in useEffect. The blocking <link> brings predictable styling
          back; nav-target CSS is prefetched on idle and on hover (see
          ClientNavInterceptor), so by the time a user clicks a nav link the
          file is already in the HTTP cache and the "blocking" cost is zero
          bytes over the wire. The <link rel="preload"> below kicks off
          the parallel download on the very first page load. */}
      <link
        rel="preload"
        href={`/css/${slug}.css`}
        as="style"
        fetchPriority="high"
      />
      <link rel="stylesheet" href={`/css/${slug}.css`} />
      <BodyClass className={meta.bodyClass} />
      <HtmlContent html={finalHtml} />
      {Object.entries(clientSlots).map(([name, node]) => (
        <SlotPortal key={name} target={`[data-bcss-slot="${name}"]`}>
          {node}
        </SlotPortal>
      ))}
    </>
  );
}

/**
 * Pulls the first slideshow background URL out of the saved Elementor markup.
 * Elementor stores gallery entries as a JSON blob inside a single-quoted
 * `data-settings='{...}'` attribute, so the inner quotes are literal `"`
 * characters and the URL escapes its slashes as `\/`. We decode the slashes
 * after matching.
 */
function findFirstHeroImage(html: string): string | null {
  const m = html.match(
    /background_slideshow_gallery"\s*:\s*\[\s*\{[^}]*"url"\s*:\s*"([^"]+)"/
  );
  if (!m) return null;
  return m[1].replace(/\\\//g, "/");
}

type HeroPreload = {
  href: string;
  imageSrcSet?: string;
  type?: string;
};

/**
 * Decide what to preload for the hero. Prefers responsive AVIF if we have
 * pre-generated width variants on disk, falls back to a single .avif
 * companion, then to the original URL. The "smallest format the browser
 * accepts" decision is left to middleware.ts for the actual hero fetch;
 * here we just want the preload to point at the bytes that will paint.
 */
function buildHeroPreload(url: string): HeroPreload | null {
  if (!url.startsWith("/")) return { href: url };

  const widths = RESPONSIVE[url];
  if (widths && widths.length > 0) {
    // The runtime requests `${base}-${w}${ext}` (e.g. .../scaled-768.webp).
    // Middleware rewrites the *response* to .webp.avif when the browser
    // accepts AVIF, but keeps the request URL identical. So the preload URL
    // must also be the .webp form, otherwise the preload cache key won't
    // match the runtime fetch and PageSpeed will flag the preload as unused.
    const m = url.match(/^(.+)(\.[^.]+)$/);
    if (m) {
      const [, base, ext] = m;
      const srcset = widths
        .map((w) => `${base}-${w}${ext} ${w}w`)
        .join(", ");
      const largest = widths[widths.length - 1];
      return {
        href: `${base}-${largest}${ext}`,
        imageSrcSet: srcset,
      };
    }
  }

  const v = VARIANTS[url];
  if (v?.avif) return { href: url + ".avif", type: "image/avif" };
  if (v?.webp && !url.endsWith(".webp")) return { href: url + ".webp" };
  return { href: url };
}
