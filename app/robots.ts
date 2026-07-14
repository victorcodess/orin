import type { MetadataRoute } from "next";

import { pageUrl } from "@/lib/seo/metadata";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/auth/", "/onboarding", "/c", "/c/"],
    },
    sitemap: pageUrl("/sitemap.xml"),
  };
}
