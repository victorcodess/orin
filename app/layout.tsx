import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { AppToaster } from "@/components/shell/app-toaster";
import { ThemeKeyboardShortcut } from "@/components/shell/theme-keyboard-shortcut";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  getHeadingFontFamilyVariable,
  getHeadingFontStylesheetUrl,
} from "@/lib/fonts/heading-font";
import "./globals.css";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Orin",
  description:
    "A voice-enabled AI companion you can text and call. Warm, thoughtful, and yours to customize.",
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={geistSans.variable}
      style={
        {
          "--heading-font-family": getHeadingFontFamilyVariable(),
        } as React.CSSProperties
      }
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link rel="stylesheet" href={getHeadingFontStylesheetUrl()} />
      </head>
      <body className={`${geistSans.className} antialiased`} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider>
            {children}
            <ThemeKeyboardShortcut />
            <AppToaster />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
