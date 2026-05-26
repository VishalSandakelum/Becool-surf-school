import type { Metadata } from "next";
import PageShell from "../../components/PageShell";
import { BreadcrumbStructuredData } from "../../components/StructuredData";
import { BUSINESS } from "../../src/seo";

export const metadata: Metadata = {
  title: "Surf Lessons & Services in Weligama, Sri Lanka",
  description:
    "Beginner, group and private surf lessons, advanced coaching, surfboard rental, video analysis and professional surf photography on Weligama Bay – with ISA-certified instructors.",
  keywords: [
    "private surf lessons Sri Lanka",
    "group surf lessons Weligama",
    "advanced surf coaching Sri Lanka",
    "surfboard rental Weligama",
    "surf photography Sri Lanka",
    "surf video analysis Weligama",
    "beginner surf lessons Sri Lanka",
  ],
  alternates: { canonical: "/services" },
  openGraph: {
    url: "/services",
    title: "Surf Lessons & Services – Be Cool Surf School Weligama",
    description:
      "Beginner, group and private surf lessons, advanced coaching, board rental and surf photography on Weligama Bay, Sri Lanka.",
    images: [BUSINESS.ogImage],
  },
};

export default function ServicesPage() {
  return (
    <>
      <BreadcrumbStructuredData
        trail={[
          { name: "Home", href: "/" },
          { name: "Services", href: "/services" },
        ]}
      />
      <PageShell slug="services" />
    </>
  );
}
