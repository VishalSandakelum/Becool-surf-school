import type { Metadata } from "next";
import PageShell from "../../components/PageShell";
import { BreadcrumbStructuredData } from "../../components/StructuredData";
import { BUSINESS } from "../../src/seo";

export const metadata: Metadata = {
  title: "Beginner Surf Lessons in Weligama – Be Cool Surf School",
  description:
    "First-timer surf lessons on Weligama Bay's gentle, sandy-bottomed waves. ISA-certified instructors, all gear included, small group ratios since 2013.",
  keywords: [
    "beginner surf lessons Weligama",
    "first time surfing Sri Lanka",
    "learn to surf Weligama",
    "Weligama Bay beginner surf",
    "Sri Lanka surf lesson for beginners",
  ],
  alternates: { canonical: "/beginner-surf-lessons" },
  openGraph: {
    url: "/beginner-surf-lessons",
    title: "Beginner Surf Lessons in Weligama – Be Cool Surf School",
    description:
      "First-timer surf lessons on Weligama Bay's gentle, sandy-bottomed waves. ISA-certified instructors, all gear included.",
    images: [BUSINESS.ogImage],
  },
};

export default function BeginnerSurfLessonsPage() {
  return (
    <>
      <BreadcrumbStructuredData
        trail={[
          { name: "Home", href: "/" },
          { name: "Services", href: "/services" },
          { name: "Beginner Surf Lessons", href: "/beginner-surf-lessons" },
        ]}
      />
      <PageShell slug="beginner-surf-lessons" />
    </>
  );
}
