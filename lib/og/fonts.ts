const FONT_USER_AGENT =
  "Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.1; Trident/6.0)";

async function loadGoogleFont(
  family: string,
  weight: number,
): Promise<ArrayBuffer> {
  const css = await fetch(
    `https://fonts.googleapis.com/css2?family=${family.replace(/\s+/g, "+")}:wght@${weight}&display=swap`,
    {
      headers: {
        "User-Agent": FONT_USER_AGENT,
      },
    },
  ).then((response) => response.text());

  const resource = css.match(
    /src: url\((.+?)\) format\('(?:opentype|truetype|woff2?|woff)'\)/,
  )?.[1];

  if (!resource) {
    throw new Error(`Failed to load font: ${family}`);
  }

  return fetch(resource).then((response) => response.arrayBuffer());
}

export async function getOgFonts() {
  const [heading, body] = await Promise.all([
    loadGoogleFont("Crimson Text", 600),
    loadGoogleFont("Geist", 400),
  ]);

  return [
    {
      name: "Crimson Text",
      data: heading,
      style: "normal" as const,
      weight: 600 as const,
    },
    {
      name: "Geist",
      data: body,
      style: "normal" as const,
      weight: 400 as const,
    },
  ];
}
