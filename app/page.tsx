import type { Metadata } from "next";
import PageShell from "../components/PageShell";
import { getReviews } from "../lib/google-reviews";
import { renderReviewsHtml } from "../lib/render-reviews-html";
import { BreadcrumbStructuredData } from "../components/StructuredData";
import { BUSINESS } from "../src/seo";

// Refetch Google Place Details at most once per day. The page is otherwise
// statically generated, so the Reviews component never blocks render.
export const revalidate = 86400;

export const metadata: Metadata = {
  title:
    "Be Cool Surf School Weligama – #1 Sri Lanka Surf School Since 2013",
  description:
    "Sri Lanka's top-rated surf school in Weligama Bay. ISA-certified instructors, beginner-friendly waves, surf camp packages, board rental, video coaching & surf photography. Book your surf lesson today.",
  keywords: [
    "Sri Lanka surf school",
    "Weligama surf school",
    "best surf school Sri Lanka",
    "surf lessons Weligama",
    "Be Cool Surf School Weligama",
    "Sri Lanka surfing",
    "Weligama Bay surf",
    "surf camp Sri Lanka",
    "ISA surf instructor Sri Lanka",
    "beginner surf lessons Weligama",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    url: "/",
    title: "Be Cool Surf School Weligama – #1 Sri Lanka Surf School",
    description:
      "Learn to surf at Sri Lanka's top-rated surf school in Weligama Bay. Beginner-friendly waves, ISA-certified instructors and all-inclusive surf camp packages since 2013.",
    images: [BUSINESS.ogImage],
  },
};

export default async function HomePage() {
  // Fetch reviews server-side and render them straight to an HTML string,
  // which PageShell splices into the page body. Avoids the react-dom/server
  // import that Next.js disallows from app components.
  const reviewsData = await getReviews();
  return (
    <>
      <BreadcrumbStructuredData trail={[{ name: "Home", href: "/" }]} />
      <PageShell
        slug="home"
        staticSlots={{ reviews: renderReviewsHtml(reviewsData) }}
      />
    </>
  );
}
