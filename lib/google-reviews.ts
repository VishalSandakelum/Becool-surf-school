import fallbackReviews from "../data/reviews-fallback.json";

export type Review = {
  authorName: string;
  authorPhotoUrl: string | null;
  rating: number;
  relativeTime: string;
  text: string;
  source: "google" | "fallback";
};

export type ReviewSummary = {
  reviews: Review[];
  averageRating: number | null;
  totalRatings: number | null;
  source: "google" | "fallback";
};

type PlacesApiResponse = {
  status: string;
  error_message?: string;
  result?: {
    rating?: number;
    user_ratings_total?: number;
    reviews?: Array<{
      author_name: string;
      profile_photo_url?: string;
      rating: number;
      relative_time_description: string;
      text: string;
      time: number;
    }>;
  };
};

/**
 * Fetch the latest Google reviews for the configured Place. Cached at the
 * server side so we don't hammer the Places API on every request: the route
 * embedding `getReviews()` should pin its own ISR `revalidate` window (24 h
 * is a sensible default — Google's `reviews` array only ever returns the 5
 * most recent anyway).
 *
 * If the API key or Place ID are missing, or the request fails, returns
 * `data/reviews-fallback.json` so the page never breaks.
 */
export async function getReviews(): Promise<ReviewSummary> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  const placeId = process.env.GOOGLE_PLACE_ID;

  if (!apiKey || !placeId) return fallback("missing-env");

  const url = new URL("https://maps.googleapis.com/maps/api/place/details/json");
  url.searchParams.set("place_id", placeId);
  url.searchParams.set(
    "fields",
    "rating,user_ratings_total,reviews"
  );
  // `most_relevant` is the default but be explicit so future API changes don't
  // surprise us. `language=en` keeps non-English reviews readable.
  url.searchParams.set("reviews_sort", "most_relevant");
  url.searchParams.set("language", "en");
  url.searchParams.set("key", apiKey);

  let json: PlacesApiResponse;
  try {
    const res = await fetch(url, {
      next: { revalidate: 86400 },
    });
    if (!res.ok) return fallback(`http-${res.status}`);
    json = (await res.json()) as PlacesApiResponse;
  } catch (err) {
    console.warn("[reviews] Places API fetch failed:", err);
    return fallback("network-error");
  }

  if (json.status !== "OK" || !json.result) {
    console.warn("[reviews] Places API status:", json.status, json.error_message);
    return fallback(`status-${json.status}`);
  }

  const reviews: Review[] = (json.result.reviews ?? []).map((r) => ({
    authorName: r.author_name,
    authorPhotoUrl: r.profile_photo_url ?? null,
    rating: r.rating,
    relativeTime: r.relative_time_description,
    text: r.text,
    source: "google",
  }));

  if (reviews.length === 0) return fallback("no-reviews");

  return {
    reviews,
    averageRating: json.result.rating ?? null,
    totalRatings: json.result.user_ratings_total ?? null,
    source: "google",
  };
}

function fallback(reason: string): ReviewSummary {
  if (process.env.NODE_ENV !== "production") {
    console.warn(`[reviews] using fallback (${reason})`);
  }
  const reviews: Review[] = (fallbackReviews as Review[]).map((r) => ({
    ...r,
    source: "fallback",
  }));
  return {
    reviews,
    averageRating: null,
    totalRatings: null,
    source: "fallback",
  };
}
