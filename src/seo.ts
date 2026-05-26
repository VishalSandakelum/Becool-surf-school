// Centralised SEO constants. Override SITE_URL with NEXT_PUBLIC_SITE_URL on deploy.

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://becoolsrilanka.com";

export const BUSINESS = {
  name: "Be Cool Surf School Weligama",
  // Exact name on the Google Business Profile (keyword-stuffed by the listing
  // owner — kept as alternateName so Google merges the entity correctly).
  alternateName:
    "Be Cool Surf School Weligama Sri Lanka | Surf Lessons · Surfboard Rental · Beginner Surf",
  legalName: "Be Cool Surf School",
  brand: "Be Cool",
  slogan: "Sri Lanka's #1 Surf School in Weligama since 2013",
  description:
    "Be Cool Surf School Weligama – Sri Lanka's top-rated surf school. ISA-certified instructors, beginner to advanced lessons, surf camp packages, board rental, video analysis and surf photography on Weligama Beach.",
  phone: "+94770790808",
  whatsapp: "https://wa.me/94770790808",
  email: "info@becoolsrilanka.com",
  priceRange: "$$",
  founded: "2013",
  address: {
    streetAddress: "Weligama Beach Road",
    addressLocality: "Weligama",
    addressRegion: "Southern Province",
    postalCode: "81700",
    addressCountry: "LK",
  },
  // Exact coordinates from the Google Business Profile pin.
  geo: { latitude: 5.9726384, longitude: 80.4345447 },
  // Plus Code from the Google Business Profile (helps Apple Maps + GBP match).
  plusCode: "XCFM+3R Weligama",
  openingHours: "Mo-Su 06:00-19:00",
  // Canonical Google Maps URL for this business (CID-based — stable, won't break).
  googleMapsUrl: "https://maps.google.com/?cid=4547837293060702900",
  social: [
    "https://maps.google.com/?cid=4547837293060702900",
    "https://www.instagram.com/surfweligamasrilanka",
    "https://www.tiktok.com/@becool.surf.camp",
    "https://www.facebook.com/becoolsurfschoolweligama",
  ],
  // Default OG image, properly sized 1200x630 for Twitter/Facebook cards.
  ogImage: "/og-image.jpg",
} as const;

export const KEYWORDS = {
  base: [
    "Sri Lanka surf school",
    "Weligama surf school",
    "surf school Sri Lanka",
    "surf lessons Weligama",
    "surfing in Sri Lanka",
    "Be Cool Surf School",
    "surf camp Weligama",
    "best surf school Sri Lanka",
    "ISA certified surf instructor Sri Lanka",
    "Weligama Bay surf",
    "beginner surf lessons Sri Lanka",
    "surf board rental Weligama",
  ],
};
