export const MARKETING_SOCIAL_LINKS = [
  { href: "https://x.com/orin__chat", label: "Twitter" },
  { href: "https://github.com/victorcodess/orin", label: "GitHub" },
] as const;

export const MARKETING_LEGAL_LINKS = [
  { href: "/terms", label: "Terms of Service", page: "terms" as const },
  { href: "/privacy", label: "Privacy Policy", page: "privacy" as const },
] as const;

export type MarketingLegalPage = (typeof MARKETING_LEGAL_LINKS)[number]["page"];
