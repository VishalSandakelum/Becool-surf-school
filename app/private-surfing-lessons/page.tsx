import type { Metadata } from "next";
import PageShell from "../../components/PageShell";
import { BreadcrumbStructuredData } from "../../components/StructuredData";
import { BUSINESS } from "../../src/seo";

export const metadata: Metadata = {
  title: "Private Surfing Lessons in Weligama – Be Cool Surf School",
  description:
    "One-on-one surf coaching at Weligama Bay. Personalised feedback, flexible scheduling and faster progression with an ISA-certified instructor.",
  keywords: [
    "private surf lessons Weligama",
    "1 on 1 surf coaching Sri Lanka",
    "personal surf instructor Weligama",
    "one to one surf lesson Sri Lanka",
  ],
  alternates: { canonical: "/private-surfing-lessons" },
  openGraph: {
    url: "/private-surfing-lessons",
    title: "Private Surfing Lessons in Weligama – Be Cool Surf School",
    description:
      "One-on-one surf coaching at Weligama Bay with an ISA-certified instructor.",
    images: [BUSINESS.ogImage],
  },
};

export default function PrivateSurfingLessonsPage() {
  return (
    <>
      <BreadcrumbStructuredData
        trail={[
          { name: "Home", href: "/" },
          { name: "Services", href: "/services" },
          { name: "Private Surfing Lessons", href: "/private-surfing-lessons" },
        ]}
      />
      <PageShell slug="private-surfing-lessons" />
    </>
  );
}
