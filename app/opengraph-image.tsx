import { createOpenGraphImageResponse } from "@/lib/og/create-opengraph-image-response";

export const alt = "Orin — AI companion";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return createOpenGraphImageResponse();
}
