import type { ReviewSummary } from "./google-reviews";

/**
 * Render a ReviewSummary directly to an HTML string. This sits next to (and
 * is kept in sync with) `components/Reviews.tsx`, but emits a string so
 * PageShell can splice it into the WordPress page body without going through
 * `react-dom/server` — Next.js disallows that import from app/server
 * components.
 *
 * The output uses the same `bcss-*` class names as Reviews.tsx so it picks
 * up the styles in `app/globals.css` and stays visually identical.
 */
export function renderReviewsHtml(data: ReviewSummary): string {
  const { reviews, averageRating, totalRatings } = data;

  const summary =
    averageRating !== null || totalRatings !== null
      ? `<header class="bcss-reviews__summary">${
          averageRating !== null
            ? `<span class="bcss-reviews__rating"><span class="bcss-reviews__rating-value">${averageRating.toFixed(
                1
              )}</span>${stars(averageRating)}</span>`
            : ""
        }${
          totalRatings !== null
            ? `<span class="bcss-reviews__count">based on ${totalRatings.toLocaleString()} Google reviews</span>`
            : ""
        }</header>`
      : "";

  const items = reviews
    .map((r) => {
      const avatar = r.authorPhotoUrl
        ? `<img src="${escape(r.authorPhotoUrl)}" alt="" width="40" height="40" class="bcss-review__avatar" loading="lazy" referrerpolicy="no-referrer" />`
        : `<div class="bcss-review__avatar bcss-review__avatar--initial" aria-hidden="true">${escape(
            r.authorName.charAt(0).toUpperCase()
          )}</div>`;
      return `<li class="bcss-review">
  <div class="bcss-review__head">
    ${avatar}
    <div class="bcss-review__meta">
      <div class="bcss-review__name">${escape(r.authorName)}</div>
      <div class="bcss-review__time">${escape(r.relativeTime)}</div>
    </div>
    ${stars(r.rating)}
  </div>
  <p class="bcss-review__text">${escape(r.text)}</p>
</li>`;
    })
    .join("\n");

  return `<section class="bcss-reviews" aria-label="Customer reviews">${summary}<ul class="bcss-reviews__list">${items}</ul></section>`;
}

function stars(value: number): string {
  const filled = Math.round(value);
  const cells: string[] = [];
  for (let i = 0; i < 5; i++) {
    const cls = i < filled ? "bcss-star bcss-star--on" : "bcss-star bcss-star--off";
    cells.push(`<span class="${cls}" aria-hidden="true">★</span>`);
  }
  return `<span class="bcss-stars" role="img" aria-label="${value} out of 5">${cells.join(
    ""
  )}</span>`;
}

function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
