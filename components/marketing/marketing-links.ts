export const MARKETING_SOCIAL_LINKS = [
  { href: "https://x.com/orin__chat", label: "Twitter" },
  { href: "https://github.com/victorcodess/orin", label: "GitHub" },
] as const;

export const MARKETING_LEGAL_LINKS = [
  { href: "/about", label: "About", page: "about" as const },
  { href: "/terms", label: "Terms of Service", page: "terms" as const },
  { href: "/privacy", label: "Privacy Policy", page: "privacy" as const },
] as const;

export type MarketingLegalPage = (typeof MARKETING_LEGAL_LINKS)[number]["page"];

export const MARKETING_PUBLIC_PATHS = new Set([
  "/",
  ...MARKETING_LEGAL_LINKS.map(({ href }) => href),
]);
