import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { BUSINESS, KEYWORDS, SITE_URL } from "../src/seo";
import { SiteStructuredData } from "../components/StructuredData";
import ClientNavInterceptor from "../components/ClientNavInterceptor";
import "./globals.css";

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
    <html lang="en-LK">
      <head>
        <link rel="profile" href="https://gmpg.org/xfn/11" />
        <meta name="generator" content={BUSINESS.name} />
        {/* Preconnect to own origin so the slideshow / hero background image
            socket is warm when Elementor's inline `data-settings` JSON kicks
            off the request. Fonts are self-hosted from /public/fonts, so no
            preconnect to fonts.gstatic.com — PageSpeed flagged it as unused. */}
        <link rel="preconnect" href="https://becoolsrilanka.com" />
        <link rel="dns-prefetch" href="https://cdn.trustindex.io" />
        <SiteStructuredData />
        {/* Tiny native runtime that replaces the WordPress + Elementor + jQuery
            + Swiper bundle the original site shipped. Handles mobile menu,
            background slideshow, the .elementor-invisible reveal, and the
            data-ep-wrapper-link clickable-card behaviour.
            The `?v=` query string busts the long-lived browser cache (30-day
            max-age on /js/*.js); bump it whenever the runtime changes. */}
        <Script src="/js/site-runtime.js?v=8" strategy="afterInteractive" />
      </head>
      <body>
        <ClientNavInterceptor />
        {children}
      </body>
    </html>
  );
}
