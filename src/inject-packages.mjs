// One-shot script to splice the surf-package + surf-&-stay showcase into the
// static home.html, right before the <footer> wrapper. Idempotent — re-running
// removes the previous block (matched by the BEGIN/END markers) before inserting
// the fresh one.
//
// Run from the nextjs/ project root:  node src/inject-packages.mjs

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const FILE = resolve(__dirname, "page-content/home.html");

const BEGIN = "<!-- BEGIN: bcss-packages-showcase -->";
const END = "<!-- END: bcss-packages-showcase -->";

const block = `${BEGIN}
<style>
/* Be Cool — surf packages + surf & stay showcase. Self-contained CSS, prefixed
   classes (.bcss-…) so it won't collide with Elementor or Tailwind utilities. */
.bcss-pkg-wrap{font-family:"Maven Pro","Roboto",sans-serif;color:#0f172a;}
.bcss-pkg-section{padding:64px 20px;}
.bcss-pkg-section--accent{background:linear-gradient(180deg,#f8fafc 0%, #ffffff 100%);}
.bcss-pkg-inner{max-width:1200px;margin:0 auto;}
.bcss-pkg-eyebrow{font-family:"Oswald",sans-serif;font-size:12px;letter-spacing:.3em;text-transform:uppercase;color:#14b8a6;margin:0 0 10px;text-align:center;font-weight:600;}
.bcss-pkg-title{font-family:"Oswald",sans-serif;font-size:clamp(28px,4vw,46px);font-weight:700;letter-spacing:-.01em;line-height:1.05;margin:0 0 14px;text-align:center;color:#0f172a;text-transform:uppercase;}
.bcss-pkg-sub{font-size:15px;color:#64748b;margin:0 auto 44px;max-width:680px;text-align:center;line-height:1.55;}
.bcss-pkg-grid{display:grid;gap:20px;}
@media (min-width:640px){.bcss-pkg-grid--4{grid-template-columns:repeat(2,1fr);}}
@media (min-width:860px){.bcss-pkg-grid--3{grid-template-columns:repeat(3,1fr);}}
@media (min-width:1024px){.bcss-pkg-grid--4{grid-template-columns:repeat(4,1fr);}}
@media (min-width:768px){.bcss-pkg-grid--2{grid-template-columns:repeat(2,1fr);}}
.bcss-pkg-card{background:#fff;border-radius:20px;box-shadow:0 10px 30px rgba(15,23,42,.08);overflow:hidden;display:flex;flex-direction:column;transition:transform .3s ease,box-shadow .3s ease,border-color .3s ease;border:2px solid transparent;}
.bcss-pkg-card:hover{transform:translateY(-4px);box-shadow:0 22px 44px rgba(15,23,42,.14);border-color:#0f172a;}
.bcss-pkg-card--featured{border-color:#fbbf24;}
.bcss-pkg-card__head{background:#0f172a;color:#fff;padding:24px;position:relative;}
.bcss-pkg-card__badge{position:absolute;top:12px;right:12px;background:#fbbf24;color:#0f172a;font-family:"Oswald",sans-serif;font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;padding:4px 8px;border-radius:4px;box-shadow:0 4px 12px rgba(251,191,36,.4);}
.bcss-pkg-card__level{font-family:"Oswald",sans-serif;font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:#fbbf24;display:block;margin:0 0 6px;font-weight:600;}
.bcss-pkg-card__name{font-family:"Oswald",sans-serif;font-size:20px;font-weight:700;text-transform:uppercase;line-height:1.15;margin:0 0 12px;letter-spacing:-.005em;}
.bcss-pkg-card__chip{display:inline-block;background:#fbbf24;color:#0f172a;padding:5px 12px;border-radius:6px;font-family:"Oswald",sans-serif;font-size:12px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;}
.bcss-pkg-card__body{padding:20px 24px 24px;flex:1;display:flex;flex-direction:column;}
.bcss-pkg-card__desc{font-size:13px;color:#475569;font-style:italic;line-height:1.55;border-left:3px solid #fbbf24;padding-left:12px;margin:0 0 18px;}
.bcss-pkg-card__list{list-style:none;padding:0;margin:0 0 22px;flex:1;display:flex;flex-direction:column;gap:8px;}
.bcss-pkg-card__list li{display:flex;align-items:flex-start;gap:10px;font-size:13px;color:#334155;font-weight:500;line-height:1.45;}
.bcss-pkg-card__list li::before{content:"";flex:none;width:16px;height:16px;border-radius:50%;background:#fbbf24 url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 14 14' fill='none'%3E%3Cpath d='M3 7l3 3 5-6' stroke='%230f172a' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") no-repeat center;background-size:11px;margin-top:1px;}
.bcss-pkg-card__cta{display:block;text-align:center;background:#0f172a;color:#fff !important;text-decoration:none;padding:14px;border-radius:999px;font-family:"Oswald",sans-serif;font-size:12px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;transition:background .25s ease,color .25s ease,transform .15s ease;border:none;cursor:pointer;}
.bcss-pkg-card__cta:hover{background:#fbbf24;color:#0f172a !important;}
.bcss-pkg-card__cta:active{transform:scale(.97);}
</style>

<section class="bcss-pkg-wrap bcss-pkg-section">
  <div class="bcss-pkg-inner">
    <p class="bcss-pkg-eyebrow">Lessons &amp; Coaching</p>
    <h2 class="bcss-pkg-title">Our Surf Packages</h2>
    <p class="bcss-pkg-sub">Pick the level that suits you. Every package includes ISA-certified coaching, theory sessions, and small group ratios for the fastest progression on Weligama Bay.</p>
    <div class="bcss-pkg-grid bcss-pkg-grid--3">
      <article class="bcss-pkg-card">
        <div class="bcss-pkg-card__head">
          <span class="bcss-pkg-card__level">Level 1</span>
          <h3 class="bcss-pkg-card__name">Beginner Package</h3>
          <span class="bcss-pkg-card__chip">3 Days · &euro;35</span>
        </div>
        <div class="bcss-pkg-card__body">
          <p class="bcss-pkg-card__desc">For first-time surfers — get your feet wet and learn the basics in a fun, supportive environment.</p>
          <ul class="bcss-pkg-card__list">
            <li>75 minute surf lesson</li>
            <li>Waterproof face zinc</li>
            <li>Rash guard provided</li>
            <li>Sun beds to relax</li>
            <li>Theory lesson</li>
            <li>Small groups (max 3)</li>
          </ul>
          <a href="https://bookings.becoolsrilanka.com" class="bcss-pkg-card__cta">Book Package</a>
        </div>
      </article>
      <article class="bcss-pkg-card">
        <div class="bcss-pkg-card__head">
          <span class="bcss-pkg-card__level">Level 2</span>
          <h3 class="bcss-pkg-card__name">Intermediate Package</h3>
          <span class="bcss-pkg-card__chip">3 Days · &euro;40</span>
        </div>
        <div class="bcss-pkg-card__body">
          <p class="bcss-pkg-card__desc">Sri Lanka&apos;s gentle waves are perfect for progressing from white water to green waves — ride the open face with confidence.</p>
          <ul class="bcss-pkg-card__list">
            <li>75 minute surf lesson</li>
            <li>Waterproof face zinc</li>
            <li>Rash guard provided</li>
            <li>Sun beds to relax</li>
            <li>Theory lesson</li>
            <li>Small groups (max 3)</li>
            <li>One video analysis</li>
          </ul>
          <a href="https://bookings.becoolsrilanka.com" class="bcss-pkg-card__cta">Book Package</a>
        </div>
      </article>
      <article class="bcss-pkg-card">
        <div class="bcss-pkg-card__head">
          <span class="bcss-pkg-card__level">Level 3</span>
          <h3 class="bcss-pkg-card__name">Advanced Package 1</h3>
          <span class="bcss-pkg-card__chip">5 Days · &euro;200</span>
        </div>
        <div class="bcss-pkg-card__body">
          <p class="bcss-pkg-card__desc">Refine techniques and build performance in more challenging conditions. Designed for surfers who already paddle out back.</p>
          <ul class="bcss-pkg-card__list">
            <li>120 minute surf lesson</li>
            <li>Waterproof face zinc</li>
            <li>Rash guard provided</li>
            <li>Theory lesson</li>
            <li>Small groups (max 3)</li>
            <li>One video analysis</li>
            <li>King coconut</li>
            <li>Tuktuk shuttle</li>
          </ul>
          <a href="https://bookings.becoolsrilanka.com" class="bcss-pkg-card__cta">Book Package</a>
        </div>
      </article>

    </div>
  </div>
</section>

<section class="bcss-pkg-wrap bcss-pkg-section bcss-pkg-section--accent">
  <div class="bcss-pkg-inner">
    <p class="bcss-pkg-eyebrow">All-Inclusive Surf Camps</p>
    <h2 class="bcss-pkg-title">Surf &amp; Stay Packages</h2>
    <p class="bcss-pkg-sub">Spend a full week with us — accommodation, daily lessons, breakfast, transport, and Wi-Fi all included. Sunday to Sunday.</p>
    <div class="bcss-pkg-grid bcss-pkg-grid--2">
      <article class="bcss-pkg-card bcss-pkg-card--featured">
        <div class="bcss-pkg-card__head">
          <span class="bcss-pkg-card__badge">Most Popular</span>
          <span class="bcss-pkg-card__level">7 Nights · Sun to Sun</span>
          <h3 class="bcss-pkg-card__name">Fully Surf Package</h3>
          <span class="bcss-pkg-card__chip">&euro;450 / pax</span>
        </div>
        <div class="bcss-pkg-card__body">
          <p class="bcss-pkg-card__desc">A full week of surf-focused coaching with twice-daily lessons, video analysis and a surf-skate session — designed for surfers who want maximum water time.</p>
          <ul class="bcss-pkg-card__list">
            <li>7 nights accommodation (Sunday to Sunday)</li>
            <li>10 surf lessons included (5 morning sessions + 5 afternoon sessions)</li>
            <li>Surf theory &amp; training workshops</li>
            <li>Personalized coaching with small group ratios (3 students per coach)</li>
            <li>2 video analysis &amp; performance evaluation</li>
            <li>1 surf skate lesson</li>
            <li>Transport to and from surf spots</li>
            <li>Free use of surfboards during lessons</li>
            <li>6 delicious breakfasts included</li>
            <li>Unlimited drinking water</li>
            <li>High-speed unlimited Wi-Fi</li>
          </ul>
          <a href="https://bookings.becoolsrilanka.com" class="bcss-pkg-card__cta">Book This Package</a>
        </div>
      </article>
      <article class="bcss-pkg-card">
        <div class="bcss-pkg-card__head">
          <span class="bcss-pkg-card__level">7 Nights · Sun to Sun</span>
          <h3 class="bcss-pkg-card__name">Surf &amp; Yoga Package</h3>
          <span class="bcss-pkg-card__chip">&euro;420 / pax</span>
        </div>
        <div class="bcss-pkg-card__body">
          <p class="bcss-pkg-card__desc">Balance morning surf sessions with daily yoga to improve mobility, breath control and recovery — ideal for a healthier, restorative surf week.</p>
          <ul class="bcss-pkg-card__list">
            <li>7 nights accommodation (Sunday to Sunday)</li>
            <li>5 morning surf lessons</li>
            <li>5 yoga lessons</li>
            <li>Surf theory &amp; training workshops</li>
            <li>Personalized coaching with small group ratios (3 students per coach)</li>
            <li>1 video analysis &amp; performance evaluation</li>
            <li>1 surf skate lesson</li>
            <li>Transport to and from surf spots</li>
            <li>Free use of surfboards during lessons</li>
            <li>6 delicious breakfasts included</li>
            <li>Unlimited drinking water</li>
            <li>High-speed unlimited Wi-Fi</li>
          </ul>
          <a href="https://bookings.becoolsrilanka.com" class="bcss-pkg-card__cta">Book This Package</a>
        </div>
      </article>
    </div>
  </div>
</section>
${END}`;

const html = readFileSync(FILE, "utf8");

// Strip any previous version of the block so re-running is safe.
const stripped = html.replace(
  new RegExp(`${BEGIN}[\\s\\S]*?${END}`, "g"),
  ""
);

// Find the footer wrapper and insert just before it.
const footerIdx = stripped.indexOf('<div id="cmplz-manage-consent"');
if (footerIdx === -1) {
  console.error("Could not find insertion point in home.html — aborting.");
  process.exit(1);
}

const next = stripped.slice(0, footerIdx) + block + stripped.slice(footerIdx);
writeFileSync(FILE, next, "utf8");
console.log(
  `Inserted package showcase at byte ${footerIdx}. ` +
    `File size: ${html.length} -> ${next.length}.`
);
