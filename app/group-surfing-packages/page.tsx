import type { Metadata } from "next";
import PageShell from "../../components/PageShell";
import { BreadcrumbStructuredData } from "../../components/StructuredData";
import { BUSINESS } from "../../src/seo";

export const metadata: Metadata = {
  title: "Group Surfing Packages in Weligama – Be Cool Surf School",
  description:
    "Group surf lessons and packages for friends, families and tour groups in Weligama Bay. Discounted rates for 4+ surfers, all gear included.",
  keywords: [
    "group surf lessons Weligama",
    "group surfing package Sri Lanka",
    "family surf lesson Weligama",
    "group surf school Sri Lanka",
  ],
  alternates: { canonical: "/group-surfing-packages" },
  openGraph: {
    url: "/group-surfing-packages",
    title: "Group Surfing Packages in Weligama – Be Cool Surf School",
    description:
      "Group surf lessons and packages for friends, families and tour groups in Weligama Bay.",
    images: [BUSINESS.ogImage],
  },
};

export default function GroupSurfingPackagesPage() {
  return (
    <>
      <BreadcrumbStructuredData
        trail={[
          { name: "Home", href: "/" },
          { name: "Services", href: "/services" },
          { name: "Group Surfing Packages", href: "/group-surfing-packages" },
        ]}
      />
      <PageShell slug="group-surfing-packages" />
    </>
  );
}
