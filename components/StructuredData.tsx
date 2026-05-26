import { BUSINESS, SITE_URL } from "../src/seo";

/**
 * Site-wide JSON-LD: a SportsActivityLocation/LocalBusiness entity for the surf
 * school plus a WebSite node with SearchAction. Rendered once in the root layout.
 */
export function SiteStructuredData() {
  const business = {
    "@context": "https://schema.org",
    "@type": ["LocalBusiness", "SportsActivityLocation"],
    "@id": `${SITE_URL}/#business`,
    name: BUSINESS.name,
    alternateName: BUSINESS.alternateName,
    legalName: BUSINESS.legalName,
    description: BUSINESS.description,
    slogan: BUSINESS.slogan,
    url: SITE_URL,
    telephone: BUSINESS.phone,
    email: BUSINESS.email,
    priceRange: BUSINESS.priceRange,
    foundingDate: BUSINESS.founded,
    image: [`${SITE_URL}${BUSINESS.ogImage}`],
    logo: `${SITE_URL}/images/be-cool-logo.png`,
    hasMap: BUSINESS.googleMapsUrl,
    address: {
      "@type": "PostalAddress",
      streetAddress: BUSINESS.address.streetAddress,
      addressLocality: BUSINESS.address.addressLocality,
      addressRegion: BUSINESS.address.addressRegion,
      postalCode: BUSINESS.address.postalCode,
      addressCountry: BUSINESS.address.addressCountry,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: BUSINESS.geo.latitude,
      longitude: BUSINESS.geo.longitude,
    },
    // Open Location Code — bonus signal for entity matching against Google.
    additionalProperty: [
      {
        "@type": "PropertyValue",
        name: "Plus Code",
        value: BUSINESS.plusCode,
      },
    ],
    areaServed: [
      { "@type": "Place", name: "Weligama, Sri Lanka" },
      { "@type": "Place", name: "Mirissa, Sri Lanka" },
      { "@type": "Place", name: "Matara, Sri Lanka" },
      { "@type": "Country", name: "Sri Lanka" },
    ],
    sport: "Surfing",
    openingHours: BUSINESS.openingHours,
    sameAs: BUSINESS.social,
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Surf lessons and camp packages in Weligama",
      itemListElement: [
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Beginner Surf Lesson",
            serviceType: "Surf instruction",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Advanced Surf Lesson",
            serviceType: "Surf coaching with video analysis",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Private Surf Lesson",
            serviceType: "1-on-1 surf instruction",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Group Surf Lesson",
            serviceType: "Small-group surf instruction",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Surfboard Rental",
            serviceType: "Surfboard rental in Weligama",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Surf Camp Package",
            serviceType: "All-inclusive surf camp with accommodation",
          },
        },
      ],
    },
  };

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: SITE_URL,
    name: BUSINESS.name,
    description: BUSINESS.description,
    inLanguage: "en",
    publisher: { "@id": `${SITE_URL}/#business` },
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/?s={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(business) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(website) }}
      />
    </>
  );
}

/** Per-page breadcrumb. `trail` is ordered root→current. */
export function BreadcrumbStructuredData({
  trail,
}: {
  trail: { name: string; href: string }[];
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.href}`,
    })),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
