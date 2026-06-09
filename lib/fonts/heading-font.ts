/** Change this string to try any Google Font — e.g. "Playfair Display", "Fraunces", "Syne" */
export const HEADING_FONT_NAME =
  process.env.NEXT_PUBLIC_HEADING_FONT ?? "Fraunces";

export function getHeadingFontStylesheetUrl(): string {
  const family = HEADING_FONT_NAME.trim().replace(/\s+/g, "+");
  return `https://fonts.googleapis.com/css2?family=${family}:wght@400;500;600;700&display=swap`;
}

/** Value for the --heading-font-family CSS variable (quoted family name only). */
export function getHeadingFontFamilyVariable(): string {
  return `"${HEADING_FONT_NAME}"`;
}
