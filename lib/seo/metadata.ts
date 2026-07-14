import type { Metadata } from "next";

import { getSiteOrigin } from "@/lib/auth/site-url";

export const SITE_NAME = "Orin";
export const SITE_DESCRIPTION =
  "A voice-enabled AI companion you can text and call. Warm, thoughtful, and yours to customize.";
export const SITE_TITLE = `${SITE_NAME} — AI companion you can text and call`;

export const NO_INDEX_ROBOTS: Metadata["robots"] = {
  index: false,
  follow: false,
};

export function pageUrl(path: string): string {
  const origin = getSiteOrigin();
  return path === "/" ? origin : `${origin}${path}`;
}

export function createPageMetadata({
  title,
  description = SITE_DESCRIPTION,
  path,
}: {
  title: string;
  description?: string;
  path: string;
}): Metadata {
  const url = pageUrl(path);

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      type: "website",
      url,
      siteName: SITE_NAME,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export function createNoIndexMetadata(title?: string): Metadata {
  return {
    ...(title ? { title } : {}),
    robots: NO_INDEX_ROBOTS,
  };
}

export function getHomeJsonLd() {
  const url = getSiteOrigin();

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        name: SITE_NAME,
        url,
        description: SITE_DESCRIPTION,
      },
      {
        "@type": "SoftwareApplication",
        name: SITE_NAME,
        applicationCategory: "UtilitiesApplication",
        operatingSystem: "Web",
        description: SITE_DESCRIPTION,
        url,
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
      },
    ],
  };
}
