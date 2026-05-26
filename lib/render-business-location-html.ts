import { BUSINESS } from "../src/seo";

/**
 * Renders a "find us" block for the Book Now page: an OpenStreetMap iframe
 * pointed at the surf school plus the address, hours, phone, WhatsApp and
 * email pulled from `src/seo.ts`.
 *
 * Returned as an HTML string so it can be spliced into the WordPress page
 * body via the staticSlots channel — no React, no react-dom/server.
 *
 * Why OpenStreetMap, not Google Maps:
 *   The Google Maps embed sets multiple tracking cookies and localStorage
 *   keys on every map tile request, which Microsoft Edge (and Brave, and
 *   Safari with ITP) block by default. The block doesn't break the map,
 *   but it floods the dev/prod console with "Tracking Prevention blocked
 *   access to storage" warnings — dozens of them per page load.
 *
 *   OpenStreetMap's `/export/embed.html` endpoint serves a static-style
 *   map with no cookies, no storage access, and no API key — so the
 *   console stays clean. We keep the "Get directions" CTA pointing at
 *   Google Maps so visitors who want turn-by-turn navigation still get
 *   the familiar Google experience in a fresh tab.
 */
export function renderBusinessLocationHtml(): string {
  const { latitude, longitude } = BUSINESS.geo;

  // Bounding box: ~500 m on each side of the pin at this latitude. Smaller
  // values zoom in tighter; larger values zoom out. 0.005 ° ≈ 555 m.
  const delta = 0.005;
  const bbox = [
    longitude - delta, // left (min longitude)
    latitude - delta, // bottom (min latitude)
    longitude + delta, // right (max longitude)
    latitude + delta, // top (max latitude)
  ].join("%2C");
  const mapSrc =
    `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}` +
    `&layer=mapnik&marker=${latitude}%2C${longitude}`;
  const osmLargeMap =
    `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}` +
    `#map=16/${latitude}/${longitude}`;

  const phoneHref = `tel:${BUSINESS.phone.replace(/\s+/g, "")}`;
  const emailHref = `mailto:${BUSINESS.email}`;
  const directionsHref = BUSINESS.googleMapsUrl;

  return `<section class="bcss-location" aria-label="Find us">
  <div class="bcss-location__map">
    <iframe
      src="${mapSrc}"
      title="Map showing the location of ${escape(BUSINESS.name)} in Weligama, Sri Lanka"
      width="100%"
      height="100%"
      loading="lazy"
      referrerpolicy="no-referrer-when-downgrade"
      style="border:0"
    ></iframe>
    <a class="bcss-location__map-link" href="${osmLargeMap}" rel="noopener" target="_blank">
      View larger map ↗
    </a>
  </div>
  <div class="bcss-location__info">
    <h3 class="bcss-location__title">Visit us in Weligama</h3>
    <address class="bcss-location__address">
      ${escape(BUSINESS.address.streetAddress)}<br />
      ${escape(BUSINESS.address.addressLocality)} ${escape(BUSINESS.address.postalCode)}<br />
      ${escape(BUSINESS.address.addressRegion)}, Sri Lanka
    </address>
    <dl class="bcss-location__list">
      <div class="bcss-location__row">
        <dt>Open</dt>
        <dd>${escape(BUSINESS.openingHours.replace("Mo-Su", "Every day,"))}</dd>
      </div>
      <div class="bcss-location__row">
        <dt>Phone</dt>
        <dd><a href="${phoneHref}">${escape(BUSINESS.phone)}</a></dd>
      </div>
      <div class="bcss-location__row">
        <dt>Email</dt>
        <dd><a href="${emailHref}">${escape(BUSINESS.email)}</a></dd>
      </div>
    </dl>
    <div class="bcss-location__cta">
      <a class="bcss-location__btn bcss-location__btn--primary" href="${BUSINESS.whatsapp}" rel="noopener" target="_blank">Chat on WhatsApp</a>
      <a class="bcss-location__btn" href="${directionsHref}" rel="noopener" target="_blank">Get directions</a>
    </div>
  </div>
</section>`;
}

function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
