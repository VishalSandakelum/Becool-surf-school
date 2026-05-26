import type { MetadataRoute } from "next";
import { SITE_URL } from "../src/seo";

const ROUTES: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "/", priority: 1.0, changeFrequency: "weekly" },
  { path: "/about", priority: 0.8, changeFrequency: "monthly" },
  { path: "/package", priority: 0.9, changeFrequency: "weekly" },
  { path: "/services", priority: 0.9, changeFrequency: "weekly" },
  { path: "/book-now", priority: 0.95, changeFrequency: "monthly" },
  // Service detail pages — each links from a Services card.
  { path: "/beginner-surf-lessons", priority: 0.85, changeFrequency: "monthly" },
  { path: "/intermediate-surf-lesson", priority: 0.85, changeFrequency: "monthly" },
  { path: "/advanced-surf-lessons", priority: 0.85, changeFrequency: "monthly" },
  { path: "/private-surfing-lessons", priority: 0.85, changeFrequency: "monthly" },
  { path: "/group-surfing-packages", priority: 0.85, changeFrequency: "monthly" },
  { path: "/board-rent", priority: 0.85, changeFrequency: "monthly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return ROUTES.map(({ path, priority, changeFrequency }) => ({
    url: `${SITE_URL}${path}`,
    lastModified,
    changeFrequency,
    priority,
  }));
}
