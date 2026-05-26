/**
 * Locates the byte ranges of Elementor widgets that need to be replaced by
 * React components at render time.
 *
 * The static WordPress export contains widget blocks like:
 *
 *   <div class="elementor-element ... elementor-widget-form" …>
 *     <form class="elementor-form" …>…</form>
 *   </div>
 *
 *   <div class="elementor-element ... elementor-widget-shortcode" …>
 *     <pre class="ti-widget" …>… trustindex template …</pre>
 *   </div>
 *
 * `extractWidgetSlots()` walks the HTML, finds the outer widget wrapper for
 * each match, and returns its `[start, end)` byte range plus a stable slot
 * name. PageShell then splices these ranges out of the body and renders the
 * matching React component in their place.
 */

export type Slot = {
  name: string;
  start: number;
  end: number;
};

const RULES: Array<{ name: string; needle: string; openClassFragment: string }> = [
  // Book Now: replace the MetForm contact widget with our React form. The
  // page also contains a small `form.default` widget (a newsletter signup
  // tucked in the footer area) — we leave that alone since it's tiny and
  // not the form visitors expect to see.
  //
  // Why this matters: MetForm renders as a Handlebars-style template inside
  // a `<script type="text/x-template">` block, with no static fallback HTML.
  // Without WordPress + jQuery + the MetForm plugin JS to expand the
  // template, the widget produces zero visible markup — which is what
  // shows up as an empty space on the page.
  {
    name: "contactForm",
    needle: 'data-widget_type="metform.default"',
    openClassFragment: "elementor-widget-metform",
  },
  // Home: replace the Trustindex shortcode widget with our Google Reviews.
  {
    name: "reviews",
    needle: "trustindex-google-widget-html",
    openClassFragment: "elementor-widget-shortcode",
  },
  // Book Now: replace the Elementor Google Maps widget with a clean static
  // iframe + business contact info. The original ships an iframe whose
  // src="about:blank" — it relied on LiteSpeed's lazyloader to swap in the
  // real URL after page load, and that script is gone now.
  {
    name: "businessLocation",
    needle: 'data-widget_type="google_maps.default"',
    openClassFragment: "elementor-widget-google_maps",
  },
];

export function extractWidgetSlots(html: string): Slot[] {
  const out: Slot[] = [];
  for (const rule of RULES) {
    const range = findEnclosingWidget(html, rule.needle, rule.openClassFragment);
    if (range) out.push({ name: rule.name, ...range });
  }
  return out;
}

/**
 * Find the nearest Elementor widget div that encloses `needle` and whose
 * class list contains `openClassFragment`. Returns the `[start, end)` byte
 * range of that outermost div (inclusive of its closing `</div>`).
 */
function findEnclosingWidget(
  html: string,
  needle: string,
  openClassFragment: string
): { start: number; end: number } | null {
  const needleAt = html.indexOf(needle);
  if (needleAt < 0) return null;

  // Walk backwards from the needle, scanning for `<div class="elementor-element …">`
  // openings until we find one whose tag also contains openClassFragment.
  const openRe = /<div\s+class="[^"]*elementor-element[^"]*"[^>]*>/gi;
  let match: RegExpExecArray | null;
  let candidate: { start: number; end: number } | null = null;
  while ((match = openRe.exec(html))) {
    if (match.index >= needleAt) break;
    if (!match[0].includes(openClassFragment)) continue;
    candidate = { start: match.index, end: match.index + match[0].length };
  }
  if (!candidate) return null;

  // Now walk forwards from the opening div, balancing <div…> against </div>.
  const tagRe = /<(\/?)div\b[^>]*>/gi;
  tagRe.lastIndex = candidate.start;
  let depth = 0;
  let m: RegExpExecArray | null;
  while ((m = tagRe.exec(html))) {
    if (m[1] === "/") depth--;
    else depth++;
    if (depth === 0) {
      return { start: candidate.start, end: m.index + m[0].length };
    }
  }
  return null;
}
