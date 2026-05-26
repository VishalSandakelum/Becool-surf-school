import type { Metadata } from "next";
import PageShell from "../../components/PageShell";
import { BreadcrumbStructuredData } from "../../components/StructuredData";
import { BUSINESS } from "../../src/seo";

export const metadata: Metadata = {
  title: "Intermediate Surf Lessons in Weligama – Be Cool Surf School",
  description:
    "Move past whitewater into green-wave riding with Weligama's intermediate-level surf coaching. Personal feedback, video review and small groups.",
  keywords: [
    "intermediate surf lessons Weligama",
    "green wave surf coaching Sri Lanka",
    "improve surfing Weligama",
    "intermediate level surf school Sri Lanka",
  ],
  alternates: { canonical: "/intermediate-surf-lesson" },
  openGraph: {
    url: "/intermediate-surf-lesson",
    title: "Intermediate Surf Lessons in Weligama – Be Cool Surf School",
    description:
      "Move past whitewater into green-wave riding with Weligama's intermediate-level surf coaching.",
    images: [BUSINESS.ogImage],
  },
};

export default function IntermediateSurfLessonPage() {
  return (
    <>
      <BreadcrumbStructuredData
        trail={[
          { name: "Home", href: "/" },
          { name: "Services", href: "/services" },
          { name: "Intermediate Surf Lessons", href: "/intermediate-surf-lesson" },
        ]}
      />
      <PageShell slug="intermediate-surf-lesson" />
    </>
  );
}
