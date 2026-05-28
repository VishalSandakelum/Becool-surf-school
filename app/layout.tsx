import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { BUSINESS, KEYWORDS, SITE_URL } from "../src/seo";
import { SiteStructuredData } from "../components/StructuredData";
import ClientNavInterceptor from "../components/ClientNavInterceptor";
import NavUnderline from "../components/NavUnderline";
import "./globals.css";

// Every per-page stylesheet we ship under public/css/. The order doesn't
// matter — browsers fetch prefetch hints in parallel at low priority and
// they all land in the HTTP cache before the user can click a nav link.
const PREFETCH_ROUTES = [
  "home",
  "about",
  "package",
  "services",
  "book-now",
  "advanced-surf-lessons",
  "beginner-surf-lessons",
  "intermediate-surf-lesson",
  "private-surfing-lessons",
  "group-surfing-packages",
  "board-rent",
];

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default:
      "Be Cool Surf School Weligama – #1 Sri Lanka Surf School Since 2013",
    template: "%s | Be Cool Surf School Weligama – Sri Lanka",
  },
  description: BUSINESS.description,
  keywords: KEYWORDS.base,
  applicationName: BUSINESS.name,
  authors: [{ name: BUSINESS.name, url: SITE_URL }],
  creator: BUSINESS.name,
  publisher: BUSINESS.name,
  category: "Sports & Recreation",
  alternates: {
    canonical: "/",
    languages: { "en-LK": "/", "en": "/" },
  },
  openGraph: {
    type: "website",
    locale: "en_LK",
    siteName: BUSINESS.name,
    url: SITE_URL,
    title: "Be Cool Surf School Weligama – #1 Sri Lanka Surf School",
    description: BUSINESS.description,
    images: [
      {
        url: BUSINESS.ogImage,
        width: 1200,
        height: 630,
        alt: "Surf lessons at Be Cool Surf School, Weligama, Sri Lanka",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Be Cool Surf School Weligama – #1 Sri Lanka Surf School",
    description: BUSINESS.description,
    images: [BUSINESS.ogImage],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  formatDetection: { telephone: true, email: true, address: true },
  // Icons are auto-discovered from app/icon.svg and app/apple-icon.png (Next.js convention).
  manifest: "/site.webmanifest",
  other: {
    // Geo tags help local search engines (Bing, Yandex, regional crawlers).
    "geo.region": "LK-2",
    "geo.placename": "Weligama, Southern Province, Sri Lanka",
    "geo.position": `${BUSINESS.geo.latitude};${BUSINESS.geo.longitude}`,
    ICBM: `${BUSINESS.geo.latitude}, ${BUSINESS.geo.longitude}`,
    "DC.title": BUSINESS.name,
    "business:contact_data:street_address": BUSINESS.address.streetAddress,
    "business:contact_data:locality": BUSINESS.address.addressLocality,
    "business:contact_data:region": BUSINESS.address.addressRegion,
    "business:contact_data:postal_code": BUSINESS.address.postalCode,
    "business:contact_data:country_name": "Sri Lanka",
    "og:phone_number": BUSINESS.phone,
  },
};

export const viewport: Viewport = {
  themeColor: "#0a3d62",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    /* suppressHydrationWarning on <html> silences the warning React emits
       when browser extensions (QuillBot, MetaMask, Honey, etc.) inject
       attributes on the document element before hydration runs. Scoped to
       this one node so genuine hydration mismatches elsewhere still surface. */
    <html lang="en-LK" suppressHydrationWarning>
      <head>
        <link rel="profile" href="https://gmpg.org/xfn/11" />
        <meta name="generator" content={BUSINESS.name} />
        {/* PageSpeed flagged the becoolsrilanka.com preconnect as "unused"
            on the Amplify deploy — the actual assets live at the Amplify
            origin, not becoolsrilanka.com. Dropped. The trustindex DNS
            prefetch is kept because the reviews widget calls it. */}
        <link rel="dns-prefetch" href="https://cdn.trustindex.io" />
        {/* Preload brand fonts that paint above the fold (the JOLLY JINGLE
            logo and the FUTURA MEDIUM hero text). Without these the browser
            doesn't discover the @font-face URLs until home.css finishes
            parsing — PageSpeed measured 533 ms wait for the first font
            request. Preload pulls them onto the network during the initial
            HTML parse so they arrive in parallel with the CSS itself. */}
        <link
          rel="preload"
          href="/fonts/JollyJingle.ttf"
          as="font"
          type="font/ttf"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/FuturaCyrillicMedium.ttf"
          as="font"
          type="font/ttf"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/FuturaCyrillicLight-1.ttf"
          as="font"
          type="font/ttf"
          crossOrigin="anonymous"
        />
        {/* Prefetch every per-page stylesheet from the SSR <head>. Browsers
            start fetching prefetch hints as soon as they parse them — far
            earlier than any client-side requestIdleCallback. By the time a
            user can click a nav link, every route's CSS is in HTTP cache,
            so the destination page's blocking <link> resolves with zero RTT.
            This eliminates the first-nav nav-bar FOUC where Elementor's
            menu briefly stacked vertically before its layout CSS arrived. */}
        {PREFETCH_ROUTES.map((slug) => (
          <link
            key={slug}
            rel="prefetch"
            as="style"
            href={`/css/${slug}.css`}
          />
        ))}
        <SiteStructuredData />
        {/* Tiny native runtime that replaces the WordPress + Elementor + jQuery
            + Swiper bundle the original site shipped. Handles mobile menu,
            background slideshow, the .elementor-invisible reveal, and the
            data-ep-wrapper-link clickable-card behaviour.
            The `?v=` query string busts the long-lived browser cache (30-day
            max-age on /js/*.js); bump it whenever the runtime changes. */}
        <Script src="/js/site-runtime.min.js?v=10" strategy="afterInteractive" />
      </head>
      <body>
        <ClientNavInterceptor />
        <NavUnderline />
        {children}
      </body>
    </html>
  );
}
