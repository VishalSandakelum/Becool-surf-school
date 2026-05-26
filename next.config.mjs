/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: { unoptimized: true },
  // Strip "Powered-By: Next.js" — saves a few bytes per response and removes
  // a fingerprint header that crawlers and security scanners read.
  poweredByHeader: false,
  // Compress all text responses (HTML / CSS / JS) at the Next.js layer for
  // platforms that don't add brotli/gzip in front (local dev, custom hosts).
  // CloudFront in front of Amplify will still re-compress at the edge.
  compress: true,
  async headers() {
    return [
      {
        // Static assets (images, fonts, plugin assets) — immutable cache for 1 year.
        // Repeat visits and second-page navigation become instant.
        // Uses the `/:all*(ext1|ext2|...)` form recommended by Next.js; the
        // `/:path*\\.(...)` variant we used before silently fails to match on
        // some path-to-regexp versions, so PageSpeed reported a 5s TTL on
        // every static asset.
        source: "/:all*(jpg|jpeg|png|webp|avif|gif|svg|ico|woff|woff2|ttf|eot)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        // CSS / JS bundles — cache for 30 days. Edit-and-redeploy will get a
        // new path via cache-buster query strings already in our markup.
        source: "/:all*(css|js)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=2592000" },
        ],
      },
      {
        // HTML pages — let the browser revalidate on navigation but cache at
        // the CDN/edge for a day, with stale-while-revalidate so a redeploy
        // doesn't cause a thundering-herd against the origin. Without this
        // header CloudFront treats HTML as effectively uncacheable, so every
        // first hit pays full origin latency.
        source: "/((?!_next/|api/|.*\\.[a-zA-Z0-9]+$).*)",
        headers: [
          {
            key: "Cache-Control",
            value:
              "public, max-age=0, s-maxage=86400, stale-while-revalidate=604800",
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        // Chrome DevTools (v129+) probes this URL on every site to discover an
        // optional workspace-folders manifest. Route it to our handler, which
        // returns the JSON only in dev and 404s in production.
        source: "/.well-known/appspecific/com.chrome.devtools.json",
        destination: "/api/chrome-devtools-workspace",
      },
    ];
  },
};

export default nextConfig;
