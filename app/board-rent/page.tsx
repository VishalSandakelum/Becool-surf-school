import type { Metadata } from "next";
import PageShell from "../../components/PageShell";
import { BreadcrumbStructuredData } from "../../components/StructuredData";
import { BUSINESS } from "../../src/seo";

export const metadata: Metadata = {
  title: "Surfboard Rental in Weligama – Be Cool Surf School",
  description:
    "Hourly and daily surfboard rentals in Weligama Bay. Foamies, longboards, funboards and shortboards for every level. Walk-up rates and weekly discounts.",
  keywords: [
    "surfboard rental Weligama",
    "rent surfboard Sri Lanka",
    "longboard rental Weligama",
    "foamie rental Sri Lanka",
    "Weligama Bay surfboard hire",
  ],
  alternates: { canonical: "/board-rent" },
  openGraph: {
    url: "/board-rent",
    title: "Surfboard Rental in Weligama – Be Cool Surf School",
    description:
      "Hourly and daily surfboard rentals in Weligama Bay. Foamies, longboards, funboards and shortboards.",
    images: [BUSINESS.ogImage],
  },
};

export default function BoardRentPage() {
  return (
    <>
      <BreadcrumbStructuredData
        trail={[
          { name: "Home", href: "/" },
          { name: "Services", href: "/services" },
          { name: "Surfboard Rental", href: "/board-rent" },
        ]}
      />
      <PageShell slug="board-rent" />
    </>
  );
}
