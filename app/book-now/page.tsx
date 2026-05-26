import type { Metadata } from "next";
import PageShell from "../../components/PageShell";
import ContactForm from "../../components/ContactForm";
import { BreadcrumbStructuredData } from "../../components/StructuredData";
import { renderBusinessLocationHtml } from "../../lib/render-business-location-html";
import { BUSINESS } from "../../src/seo";

export const metadata: Metadata = {
  title: "Book Now & Contact – Be Cool Surf School Weligama, Sri Lanka",
  description:
    "Book your surf lesson or surf camp at Be Cool Surf School Weligama. Call or WhatsApp +94 77 079 0808 – Sri Lanka's #1 surf school on Weligama Bay since 2013.",
  keywords: [
    "book surf lessons Weligama",
    "contact Be Cool Surf School",
    "Sri Lanka surf school booking",
    "Weligama surf school WhatsApp",
    "surf camp booking Sri Lanka",
    "surf lesson reservation Weligama",
  ],
  alternates: { canonical: "/book-now" },
  openGraph: {
    url: "/book-now",
    title: "Book Now – Be Cool Surf School Weligama, Sri Lanka",
    description:
      "Book your surf lesson or surf camp at Be Cool Surf School Weligama. Call or WhatsApp +94 77 079 0808.",
    images: [BUSINESS.ogImage],
  },
};

export default function BookNowPage() {
  return (
    <>
      <BreadcrumbStructuredData
        trail={[
          { name: "Home", href: "/" },
          { name: "Book Now", href: "/book-now" },
        ]}
      />
      <PageShell
        slug="book-now"
        staticSlots={{ businessLocation: renderBusinessLocationHtml() }}
        clientSlots={{ contactForm: <ContactForm /> }}
      />
    </>
  );
}
