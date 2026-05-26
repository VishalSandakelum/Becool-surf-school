/**
 * Inject the redesigned SURF PACKAGES (4 cards) and SURF & STAY PACKAGES
 * (2 cards) sections into /package — replacing both the original 3-card
 * Elementor row and any prior versions of this script's output.
 *
 * Design notes:
 *   - The new sections use a bespoke `bcss-pkg-*` CSS namespace and don't
 *     clone Elementor classes, so the look is fully under our control.
 *   - The original LEVEL 1/2/3 Elementor cards (`elementor-element-41ff9ba`
 *     row) get stripped out before the new SURF PACKAGES section is
 *     inserted in their place.
 *   - The Surf & Stay section sits inside the `<div data-elementor-type=
 *     "wp-page" class="elementor elementor-51">` wrapper so any global
 *     descendant rules still match.
 *   - Re-running is safe: every injected block carries a
 *     `data-bcss-injected="1"` marker so the strip step removes it cleanly.
 *
 * Run: node src/add-stay-packages.mjs
 */
import { promises as fs } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const PAGE_PATH = join(__dirname, "..", "src", "page-content", "package.html");

/* ── Section copy ────────────────────────────────────────────────────────── */

const SURF_SECTION = {
  eyebrow: "Lessons & Coaching",
  title: "Our Surf Packages",
  subtitle:
    "Pick the level that suits you. Every package includes ISA-certified coaching, theory sessions, and small group ratios for the fastest progression on Weligama Bay.",
  anchor: "surf-packages",
  cards: [
    {
      eyebrow: "Level 1",
      title: "Beginner Package",
      price: "2 Days · €35",
      blurb:
        "For first-time surfers — get your feet wet and learn the basics in a fun, supportive environment.",
      bullets: [
        "75 minute surf lesson",
        "Waterproof face zinc",
        "Rash guard provided",
        "Sun beds to relax",
        "Theory lesson",
        "Small groups (max 3)",
      ],
    },
    {
      eyebrow: "Level 2",
      title: "Intermediate Package",
      price: "2 Days · €40",
      blurb:
        "Sri Lanka's gentle waves are perfect for progressing from white water to green waves — ride the open face with confidence.",
      bullets: [
        "75 minute surf lesson",
        "Waterproof face zinc",
        "Rash guard provided",
        "Sun beds to relax",
        "Theory lesson",
        "Small groups (max 3)",
        "One video analysis",
      ],
    },
    {
      eyebrow: "Level 3",
      title: "Advanced Package 1",
      price: "5 Days · €200",
      blurb:
        "Refine techniques and build performance in more challenging conditions. Designed for surfers who already paddle out back.",
      bullets: [
        "120 minute surf lesson",
        "Waterproof face zinc",
        "Rash guard provided",
        "Theory lesson",
        "Small groups (max 3)",
        "One video analysis",
        "King coconut",
        "Tuktuk shuttle",
      ],
    },
    {
      eyebrow: "Level 3",
      title: "Advanced Package 2",
      price: "7 Days · €260",
      blurb:
        "Our deepest coaching package — refine technique, lock in performance and surf more breaks across the week.",
      bullets: [
        "120 minute surf lesson",
        "Waterproof face zinc",
        "Rash guard provided",
        "Theory lesson",
        "Small groups (max 3)",
        "One video analysis",
        "King coconut",
        "Tuktuk shuttle",
      ],
    },
  ],
  cta: "Book Package",
};

const STAY_SECTION = {
  eyebrow: "All-Inclusive Surf Camps",
  title: "Surf & Stay Packages",
  subtitle:
    "Spend a full week with us — accommodation, daily lessons, breakfast, transport, and Wi-Fi all included. Sunday to Sunday.",
  anchor: "surf-stay-packages",
  cards: [
    {
      eyebrow: "7 Nights · Sun to Sun",
      title: "Fully Surf Package",
      price: "€450 / Pax",
      featured: true,
      badge: "Most Popular",
      blurb:
        "A full week of surf-focused coaching with twice-daily lessons, video analysis and a surf-skate session — designed for surfers who want maximum water time.",
      bullets: [
        "7 nights accommodation (Sunday to Sunday)",
        "10 surf lessons included",
        "5 morning sessions + 5 afternoon sessions",
        "Surf theory & training workshops",
        "Personalized coaching with small group ratios (3 students per coach)",
        "2 video analysis & performance evaluation",
        "1 surf skate lesson",
        "Transport to and from surf spots",
        "Free use of surfboards during lessons",
        "6 delicious breakfasts included",
        "Unlimited drinking water",
        "High-speed unlimited Wi-Fi",
      ],
    },
    {
      eyebrow: "7 Nights · Sun to Sun",
      title: "Surf & Yoga Package",
      price: "€420 / Pax",
      blurb:
        "Balance morning surf sessions with daily yoga to improve mobility, breath control and recovery — ideal for a healthier, restorative surf week.",
      bullets: [
        "7 nights accommodation (Sunday to Sunday)",
        "5 morning surf lessons",
        "5 yoga lessons",
        "Surf theory & training workshops",
        "Personalized coaching with small group ratios (3 students per coach)",
        "1 video analysis & performance evaluation",
        "1 surf skate lesson",
        "Transport to and from surf spots",
        "Free use of surfboards during lessons",
        "6 delicious breakfasts included",
        "Unlimited drinking water",
        "High-speed unlimited Wi-Fi",
      ],
    },
  ],
  cta: "Book This Package",
};

/* ── Comparison block (kept from earlier — guides visitors before the
 *    detailed sections below). ─────────────────────────────────────────── */

const COMPARE_LEFT = {
  href: "#surf-packages",
  title: "Surf Packages",
  lead: "Day lessons. Drop-in friendly. Pay per session.",
  bullets: [
    "Single 75-minute lessons from €20 — no commitment",
    "Three skill tiers: Beginner, Intermediate, Advanced",
    "3 students per coach with ISA-certified Sri Lankan instructors",
    "All gear included — board, rash guard, waterproof zinc",
    "Sunbeds before and after every session",
    "Best if you already have accommodation in Weligama",
  ],
  cta: "View Surf Packages",
};

const COMPARE_RIGHT = {
  href: "#surf-stay-packages",
  title: "Surf & Stay Packages",
  lead: "7-night surf camp. All-inclusive. Sunday to Sunday.",
  bullets: [
    "7 nights beachside accommodation included",
    "Up to 10 surf lessons across the week (morning + afternoon)",
    "Theory workshops, video analysis & surf-skate session",
    "6 breakfasts, transport to surf spots, unlimited Wi-Fi",
    "Choose Fully Surf for max water time, or Surf & Yoga for balance",
    "Best if you want a full Sri Lanka surf-camp experience",
  ],
  cta: "View Surf & Stay",
};

/* ── HTML builders ───────────────────────────────────────────────────────── */

function escape(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function bullets(items, cssClass = "bcss-pkg-card__list") {
  return (
    `<ul class="${cssClass}">` +
    items.map((b) => `<li>${escape(b)}</li>`).join("") +
    "</ul>"
  );
}

function pkgCard(card, ctaLabel) {
  const featured = card.featured ? " bcss-pkg-card--featured" : "";
  const badgeHtml = card.badge
    ? `<span class="bcss-pkg-card__badge">${escape(card.badge)}</span>`
    : "";
  return `<article class="bcss-pkg-card${featured}">
  ${badgeHtml}
  <header class="bcss-pkg-card__header">
    <p class="bcss-pkg-card__eyebrow">${escape(card.eyebrow)}</p>
    <h3 class="bcss-pkg-card__title">${escape(card.title)}</h3>
    <span class="bcss-pkg-card__price">${escape(card.price)}</span>
  </header>
  <div class="bcss-pkg-card__body">
    <p class="bcss-pkg-card__blurb">${escape(card.blurb)}</p>
    ${bullets(card.bullets)}
    <a class="bcss-pkg-card__cta" href="/book-now">${escape(ctaLabel)}</a>
  </div>
</article>`;
}

function pkgSection(section, gridModifier) {
  const cardsHtml = section.cards.map((c) => pkgCard(c, section.cta)).join("");
  return `<div data-bcss-injected="1" id="${section.anchor}" class="bcss-pkg-wrap">
  <header class="bcss-pkg-section__head">
    <p class="bcss-pkg-eyebrow">${escape(section.eyebrow)}</p>
    <h2 class="bcss-pkg-title">${escape(section.title)}</h2>
    <p class="bcss-pkg-subtitle">${escape(section.subtitle)}</p>
  </header>
  <div class="bcss-pkg-grid ${gridModifier}">${cardsHtml}</div>
</div>`;
}

function compareCol(c) {
  const items = c.bullets.map((b) => `<li>${escape(b)}</li>`).join("");
  return `<article class="bcss-compare__col">
    <h3 class="bcss-compare__title">${escape(c.title)}</h3>
    <p class="bcss-compare__lead">${escape(c.lead)}</p>
    <ul class="bcss-compare__points">${items}</ul>
    <a class="bcss-compare__cta" href="${c.href}">${escape(c.cta)} ↓</a>
  </article>`;
}

function comparisonBlock() {
  return `<div data-bcss-injected="1" class="bcss-compare-wrap">
    <div class="bcss-compare">${compareCol(COMPARE_LEFT)}${compareCol(COMPARE_RIGHT)}</div>
  </div>`;
}

/* ── Strip helpers ───────────────────────────────────────────────────────── */

function stripBalancedDivByOpener(input, openerRe) {
  let out = "";
  let i = 0;
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

/* ── Main ────────────────────────────────────────────────────────────────── */

let html = await fs.readFile(PAGE_PATH, "utf8");

// 1. Drop every previously-injected wrapper (any data-bcss-* marker).
html = stripBalancedDivByOpener(html, /<div\s+data-bcss-[\w-]+="1"/);

// 2. Drop the original Elementor 3-card e-parent row — being replaced
//    by the redesigned 4-card SURF PACKAGES grid.
html = stripBalancedDivByOpener(
  html,
  /<div\s+class="[^"]*elementor-element-41ff9ba[^"]*"/
);

// 3. Insert comparison block + redesigned SURF PACKAGES section at the
//    spot where the original 3-card row used to live. We anchor on the
//    OUR PACKAGES e-parent (`elementor-element-a4f87da`) closing — i.e.
//    just after the umbrella intro paragraph.
const ourPackagesRowMatch = html.match(
  /<div\s+class="[^"]*elementor-element-a4f87da[^"]*"/
);
if (!ourPackagesRowMatch) {
  throw new Error(
    "Could not locate the OUR PACKAGES e-parent row in package.html"
  );
}
const ourRowStart = ourPackagesRowMatch.index;
const tagRe = /<(\/?)div\b[^>]*>/gi;
tagRe.lastIndex = ourRowStart;
let ourDepth = 0;
let ourMatch;
let ourRowEnd = ourRowStart;
while ((ourMatch = tagRe.exec(html))) {
  ourDepth += ourMatch[1] === "/" ? -1 : 1;
  if (ourDepth === 0) {
    ourRowEnd = ourMatch.index + ourMatch[0].length;
    break;
  }
}

const surfBlock =
  comparisonBlock() + pkgSection(SURF_SECTION, "bcss-pkg-grid--4");
html = html.slice(0, ourRowEnd) + surfBlock + html.slice(ourRowEnd);

// 4. Insert SURF & STAY section just inside the closing </div> of the
//    elementor-51 wrapper (so global descendant rules still match).
const wrapperOpen = html.match(
  /<div\s+[^>]*data-elementor-type="wp-page"[^>]*>/
);
if (!wrapperOpen) {
  throw new Error(
    'Could not locate <div data-elementor-type="wp-page"> in package.html'
  );
}
const wrapperEnd = (() => {
  const re = /<(\/?)div\b[^>]*>/gi;
  re.lastIndex = wrapperOpen.index;
  let depth = 0,
    t;
  while ((t = re.exec(html))) {
    depth += t[1] === "/" ? -1 : 1;
    if (depth === 0) return t.index;
  }
  return -1;
})();
if (wrapperEnd < 0) {
  throw new Error("Unbalanced div nesting inside elementor-51 wrapper");
}

const stayBlock = pkgSection(STAY_SECTION, "bcss-pkg-grid--2");
html = html.slice(0, wrapperEnd) + stayBlock + html.slice(wrapperEnd);

await fs.writeFile(PAGE_PATH, html);
console.log(
  `Stripped prior insertions + original 3-card row, then:\n` +
    `  • Inserted comparison block + SURF PACKAGES (4 cards) at byte ${ourRowEnd}\n` +
    `  • Inserted SURF & STAY PACKAGES (2 cards) at byte ${wrapperEnd}`
);
