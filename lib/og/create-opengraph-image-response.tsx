import { readFileSync } from "fs";
import { join } from "path";

import { ImageResponse } from "next/og";

import {
  OpenGraphImage,
  type OpenGraphImageProps,
} from "@/components/og/opengraph-image";
import { getOgFonts } from "@/lib/og/fonts";

export const ogImageSize = {
  width: 1200,
  height: 630,
} as const;

function getOgGradient(): string {
  const buffer = readFileSync(join(process.cwd(), "public/og-gradient.png"));
  return `data:image/png;base64,${buffer.toString("base64")}`;
}

export async function createOpenGraphImageResponse(
  props?: OpenGraphImageProps,
) {
  const fonts = await getOgFonts();
  const backgroundImage = getOgGradient();

  return new ImageResponse(
    <OpenGraphImage {...props} backgroundImage={backgroundImage} />,
    { ...ogImageSize, fonts },
  );
}
