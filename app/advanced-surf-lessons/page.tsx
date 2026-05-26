import type { Metadata } from "next";
import PageShell from "../../components/PageShell";
import { BreadcrumbStructuredData } from "../../components/StructuredData";
import { BUSINESS } from "../../src/seo";

export const metadata: Metadata = {
  title: "Advanced Surf Lessons & Surf Guiding in Weligama – Be Cool Surf School",
  description:
    "Advanced surf coaching and surf guiding for experienced riders on Sri Lanka's south coast. Reef breaks, point breaks and frame-by-frame video analysis.",
  keywords: [
    "advanced surf lessons Sri Lanka",
    "surf guiding Weligama",
    "advanced surf coaching Sri Lanka",
    "south coast surf guide Sri Lanka",
  ],
  alternates: { canonical: "/advanced-surf-lessons" },
  openGraph: {
    url: "/advanced-surf-lessons",
    title: "Advanced Surf Lessons & Surf Guiding in Weligama",
    description:
      "Advanced surf coaching and surf guiding for experienced riders on Sri Lanka's south coast.",
    images: [BUSINESS.ogImage],
  },
};

export default function AdvancedSurfLessonsPage() {
  return (
    <>
      <BreadcrumbStructuredData
        trail={[
          { name: "Home", href: "/" },
          { name: "Services", href: "/services" },
          { name: "Advanced Surf Lessons", href: "/advanced-surf-lessons" },
        ]}
      />
      <PageShell slug="advanced-surf-lessons" />
    </>
  );
}
