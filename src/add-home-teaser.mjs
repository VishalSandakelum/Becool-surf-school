/**
 * Inject a "Choose Your Surf Experience" teaser block on the home page,
 * sitting between the welcome intro paragraphs and the LEVEL 1/2/3 cards.
 * It briefly previews the two product lines visitors can pick from on the
 * Packages page (Surf Packages — day lessons; Surf & Stay Packages —
 * 7-night camps) without listing the full package contents.
 *
 * Visual approach:
 *   - Dark-navy cards matching the LEVEL 1/2/3 cards below for site
 *     consistency, but with a wider, calmer feel (more padding, looser
 *     copy) so the eye reads them as "categories" rather than "products".
 *   - Whole card is the click target → /package#surf-packages or
 *     /package#surf-stay-packages — those anchors already exist on the
 *     Packages page from the earlier work, with `scroll-margin-top` set
 *     so the section title clears the sticky header on land.
 *   - The Surf & Stay card is highlighted as "Most Popular" with an
 *     amber border + badge, mirroring the same treatment used inside
 *     the Packages page.
 *
 * Re-runnable: every injected wrapper carries a `data-bcss-injected="1"`
 * marker, which the strip step removes before fresh markup is written.
 *
 * Run: node src/add-home-teaser.mjs
 */
import { promises as fs } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const PAGE_PATH = join(__dirname, "..", "src", "page-content", "home.html");

const SECTION = {
  eyebrow: "Be Cool Provides",
  title: "Choose Your Surf Experience",
  subtitle:
    "From a single drop-in lesson to a full 7-night surf-and-stay camp — we have something for every kind of surfer visiting Weligama.",
  cards: [
    {
      eyebrow: "Day Lessons",
      title: "Surf Packages",
      blurb:
        "Drop-in friendly lessons across three skill tiers — Beginner, Intermediate, Advanced. Pay per session, all gear included. Best if you already have a place to stay in Weligama.",
      cta: "Explore Surf Packages",
      href: "/package#surf-packages",
    },
    {
      eyebrow: "All-Inclusive Camps",
      title: "Surf & Stay Packages",
      blurb:
        "Seven nights of beachside accommodation, daily ISA-certified coaching, video analysis, breakfasts and more — Sunday to Sunday. Choose Fully Surf or Surf & Yoga.",
      cta: "View Surf & Stay",
      href: "/package#surf-stay-packages",
      featured: true,
      badge: "Most Popular",
    },
  ],
};

function escape(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function teaserCard(c) {
  const featured = c.featured ? " bcss-home-teaser__card--featured" : "";
  const badge = c.badge
    ? `<span class="bcss-home-teaser__badge">${escape(c.badge)}</span>`
    : "";
  return `<a class="bcss-home-teaser__card${featured}" href="${c.href}">
    ${badge}
    <p class="bcss-home-teaser__card-eyebrow">${escape(c.eyebrow)}</p>
    <h3 class="bcss-home-teaser__card-title">${escape(c.title)}</h3>
    <p class="bcss-home-teaser__card-blurb">${escape(c.blurb)}</p>
    <span class="bcss-home-teaser__cta">${escape(c.cta)} <span aria-hidden="true">→</span></span>
  </a>`;
}

function teaserSection() {
  const cards = SECTION.cards.map(teaserCard).join("");
  return `<div data-bcss-injected="1" class="bcss-home-teaser">
  <header class="bcss-home-teaser__head">
    <p class="bcss-home-teaser__eyebrow">${escape(SECTION.eyebrow)}</p>
    <h2 class="bcss-home-teaser__title">${escape(SECTION.title)}</h2>
    <p class="bcss-home-teaser__subtitle">${escape(SECTION.subtitle)}</p>
  </header>
  <div class="bcss-home-teaser__grid">${cards}</div>
</div>`;
}

/** Walk balanced div from each `<div data-bcss-*="1"…>` opener and remove
 *  the enclosed subtree. Identical to the strip used by other inserter
 *  scripts in this folder, kept independent so each script remains
 *  self-contained. */
function stripInjected(input) {
  let out = "";
  let i = 0;
  const openerRe = /<div\s+data-bcss-[\w-]+="1"/;
  while (i < input.length) {
    const slice = input.slice(i);
    const m = slice.search(openerRe);
    if (m < 0) {
      out += slice;
      break;
    }
    out += slice.slice(0, m);
    const start = i + m;
    const tagRe = /<(\/?)div\b[^>]*>/gi;
    tagRe.lastIndex = start;
    let depth = 0;
    let t,
      end = start;
    while ((t = tagRe.exec(input))) {
      depth += t[1] === "/" ? -1 : 1;
      if (depth === 0) {
        end = t.index + t[0].length;
        break;
      }
    }
    i = end;
  }
  return out;
}

/** Find the byte position right after the welcome-intro e-parent row
 *  closes — that's where the teaser slots in. */
function findInsertionPoint(html) {
  const introIdx = html.indexOf("Learn to Surf in Paradise");
  if (introIdx < 0) {
    throw new Error('Could not find the "Learn to Surf in Paradise" intro');
  }
  // Nearest e-parent row opener before the intro headline = the row that
  // wraps the welcome heading + paragraphs.
  const re = /<div\s+class="[^"]*e-parent[^"]*"[^>]*>/gi;
  let m,
    last = null;
  while ((m = re.exec(html))) {
    if (m.index >= introIdx) break;
    last = { start: m.index };
  }
  if (!last) throw new Error("intro e-parent row not located");

  // Walk balanced <div>/</div> from the row open to find its close.
  const tagRe = /<(\/?)div\b[^>]*>/gi;
  tagRe.lastIndex = last.start;
  let depth = 0,
    t,
    end = last.start;
  while ((t = tagRe.exec(html))) {
    depth += t[1] === "/" ? -1 : 1;
    if (depth === 0) {
      end = t.index + t[0].length;
      break;
    }
  }
  return end;
}

let html = await fs.readFile(PAGE_PATH, "utf8");
html = stripInjected(html);
const insertAt = findInsertionPoint(html);
const block = teaserSection();
html = html.slice(0, insertAt) + block + html.slice(insertAt);
await fs.writeFile(PAGE_PATH, html);
console.log(
  `Inserted home teaser section (${block.length} bytes) at byte ${insertAt}.`
);
