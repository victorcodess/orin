import { Analytics } from "@vercel/analytics/next"
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { AppToaster } from "@/components/shell/app-toaster";
import { QueryProvider } from "@/components/shell/query-provider";
import { ThemeKeyboardShortcut } from "@/components/shell/theme-keyboard-shortcut";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  getHeadingFontFamilyVariable,
  getHeadingFontStylesheetUrl,
} from "@/lib/fonts/heading-font";
import { cn } from "@/lib/utils";
import "./globals.css";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

const siteTitle = "Orin";
const siteDescription =
  "A voice-enabled AI companion you can text and call. Warm, thoughtful, and yours to customize.";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: siteTitle,
  description: siteDescription,
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    type: "website",
    siteName: siteTitle,
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
  },
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  display: "swap",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
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
      className={cn(geistSans.variable, geistMono.variable)}
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
          <QueryProvider>
            <TooltipProvider>
              {children}
              <ThemeKeyboardShortcut />
              <AppToaster />
            </TooltipProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
      <Analytics />
    </html>
  );
}
