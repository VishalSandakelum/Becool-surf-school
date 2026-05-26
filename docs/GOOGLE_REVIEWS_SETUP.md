# Auto-updating Google reviews — setup guide

The site fetches reviews directly from the Google Places API and renders them
as static HTML at build/ISR time. **No third-party JS is loaded in the
browser**, so the reviews section stays fast and is always indexed by search
engines.

You need two things to enable live reviews:

1. **`GOOGLE_MAPS_API_KEY`** — a Google Cloud API key with the Places API
   enabled.
2. **`GOOGLE_PLACE_ID`** — the unique ID for the Be Cool Surf School Google
   Business Profile.

Until both are set, the page falls back to the hardcoded list in
`data/reviews-fallback.json` so it always renders something.

---

## Step 1 — Create a Google Cloud project

1. Open the [Google Cloud Console](https://console.cloud.google.com/).
2. Sign in with the same Google account that owns the Be Cool Google
   Business Profile.
3. In the top bar, click the project picker → **New project**.
4. Project name: `be-cool-website` (anything is fine). Click **Create**.

---

## Step 2 — Enable the Places API

1. Project picker → confirm `be-cool-website` is selected.
2. Open <https://console.cloud.google.com/apis/library>.
3. Search for **"Places API"** (the classic one — *not* "Places API (New)").
4. Click it → **Enable**.

> The free tier covers 100,000 Place Details requests per month. We make at
> most 1 request per 24 hours per build, so you'll never come close.

---

## Step 3 — Create an API key

1. Open <https://console.cloud.google.com/apis/credentials>.
2. Click **Create credentials → API key**.
3. Copy the key that appears (looks like `AIzaSy…`).
4. Click **Edit API key** → **Set application restrictions**:
   - **HTTP referrers** is *not* what you want here (this is a server-side
     key, not a browser key).
   - Choose **None** for now. We'll lock it to the API instead.
5. Under **API restrictions**, choose **Restrict key** → tick only
   **Places API**.
6. **Save**.

> If you want extra protection, set an **IP address restriction** to your
> AWS Amplify build environment's egress IPs. AWS publishes them at
> <https://docs.aws.amazon.com/general/latest/gr/aws-ip-ranges.html>.

---

## Step 4 — Find your Place ID

1. Open Google's [Place ID Finder](https://developers.google.com/maps/documentation/javascript/examples/places-placeid-finder).
2. In the search box, type `Be Cool Surf School Weligama` and pick the
   correct result on the map.
3. The Place ID appears in an info window — it's a string starting with
   `ChIJ…`. Copy it.

Confirm it's the right place by visiting:

```
https://www.google.com/maps/place/?q=place_id:YOUR_PLACE_ID
```

You should land on the Be Cool Surf School Weligama listing.

---

## Step 5 — Add both values to `.env.local`

Open the `.env.local` file you created during SMTP setup and fill in:

```env
GOOGLE_MAPS_API_KEY=AIzaSy……………………………………………………
GOOGLE_PLACE_ID=ChIJ……………………………………………………
```

Save the file.

---

## Step 6 — Test locally

```bash
npm run dev
```

Visit <http://localhost:3000>. The reviews section should now show real
Google reviews with avatar photos and "X months ago" labels. The
`source: "google"` flag is set internally so you can confirm it's not the
fallback (look at the Network tab → `localhost` → check the response —
you'll see Google's CDN URLs in `bcss-review__avatar` `src`).

If the reviews still show the fallback content:

- Re-check `npm run dev` console for `[reviews] using fallback (…)` — it
  prints the reason (`missing-env`, `status-REQUEST_DENIED`, etc.).
- `REQUEST_DENIED` usually means the API key isn't restricted to Places API
  yet, or the Places API isn't enabled on the project.
- `INVALID_REQUEST` means the Place ID is wrong.

---

## Step 7 — Set the same vars on AWS Amplify

Same as SMTP: Amplify Console → Hosting → **Environment variables** → add
`GOOGLE_MAPS_API_KEY` and `GOOGLE_PLACE_ID`. Redeploy.

---

## How fresh are the reviews?

The page has `export const revalidate = 86400`, which means Next.js
re-fetches reviews **at most once every 24 hours**, the first time someone
visits after the window expires. Visitors never wait for the API call —
they always get the cached snapshot, and the next snapshot is built in the
background.

Google's API itself only ever returns the **5 most recent / most relevant**
reviews (this is a Places API limit), so even with hourly polling you
wouldn't see more than 5.
