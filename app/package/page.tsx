import type { Metadata } from "next";
import PageShell from "../../components/PageShell";
import { BreadcrumbStructuredData } from "../../components/StructuredData";
import { BUSINESS } from "../../src/seo";

export const metadata: Metadata = {
  title:
    "Surf Packages & Surf-and-Stay Camps in Weligama, Sri Lanka – Be Cool Surf School",
  description:
    "Day-lesson surf packages for beginner, intermediate and advanced surfers, plus 7-night surf-and-stay camps in Weligama. ISA-certified coaching, video analysis, accommodation and yoga options at Be Cool Surf School, Sri Lanka.",
  keywords: [
    "Sri Lanka surf packages",
    "Weligama surf packages",
    "surf lesson packages Weligama",
    "beginner surf package Sri Lanka",
    "intermediate surf package Weligama",
    "advanced surf package Sri Lanka",
    "surf and stay Sri Lanka",
    "Weligama surf camp",
    "7 day surf camp Weligama",
    "surf and yoga camp Sri Lanka",
    "all inclusive surf camp Sri Lanka",
    "Sri Lanka surf retreat",
  ],
  alternates: { canonical: "/package" },
  openGraph: {
    url: "/package",
    title:
      "Surf Packages & Surf-and-Stay Camps in Weligama – Be Cool Surf School Sri Lanka",
    description:
      "Pick from day-lesson surf packages (Beginner, Intermediate, Advanced) or 7-night surf-and-stay camps with accommodation, breakfasts, video analysis and yoga in Weligama, Sri Lanka.",
    images: [BUSINESS.ogImage],
  },
};

export default function PackagePage() {
  return (
    <>
      <BreadcrumbStructuredData
        trail={[
          { name: "Home", href: "/" },
          { name: "Packages", href: "/package" },
        ]}
      />
      <PageShell slug="package" />
    </>
  );
}
