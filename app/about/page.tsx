import type { Metadata } from "next";
import PageShell from "../../components/PageShell";
import { BreadcrumbStructuredData } from "../../components/StructuredData";
import { BUSINESS } from "../../src/seo";

export const metadata: Metadata = {
  title: "About Us – Sri Lanka's Top-Rated Surf School in Weligama",
  description:
    "Meet the team behind Be Cool Surf School Weligama. Local ISA-certified surf instructors, 10+ years of teaching, and a community-driven surf camp on Sri Lanka's south coast.",
  keywords: [
    "about Be Cool Surf School",
    "Sri Lanka surf school history",
    "Weligama surf instructors",
    "ISA certified surf coach Sri Lanka",
    "best surf instructors Weligama",
    "surf school team Sri Lanka",
  ],
  alternates: { canonical: "/about" },
  openGraph: {
    url: "/about",
    title: "About Be Cool Surf School Weligama – Sri Lanka",
    description:
      "Local ISA-certified surf instructors, 10+ years of teaching, and a community-driven surf camp on Sri Lanka's south coast.",
    images: [BUSINESS.ogImage],
  },
};

export default function AboutPage() {
  return (
    <>
      <BreadcrumbStructuredData
        trail={[
          { name: "Home", href: "/" },
          { name: "About", href: "/about" },
        ]}
      />
      <PageShell slug="about" />
    </>
  );
}
