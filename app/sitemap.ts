import type { MetadataRoute } from "next";

import { MARKETING_PUBLIC_PATHS } from "@/components/marketing/marketing-links";
import { pageUrl } from "@/lib/seo/metadata";

const SITEMAP_PATHS = [...MARKETING_PUBLIC_PATHS, "/new"];

export default function sitemap(): MetadataRoute.Sitemap {
  return SITEMAP_PATHS.map((path) => ({ url: pageUrl(path) }));
}
