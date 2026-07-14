import { Analytics } from "@vercel/analytics/next"
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { AppToaster } from "@/components/shell/app-toaster";
import { QueryProvider } from "@/components/shell/query-provider";
import { ThemeKeyboardShortcut } from "@/components/shell/theme-keyboard-shortcut";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getSiteOrigin } from "@/lib/auth/site-url";
import {
  getHeadingFontFamilyVariable,
  getHeadingFontStylesheetUrl,
} from "@/lib/fonts/heading-font";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TITLE } from "@/lib/seo/metadata";
import { cn } from "@/lib/utils";
import "./globals.css";

const siteOrigin = getSiteOrigin();

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin),
  title: {
    default: SITE_TITLE,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    type: "website",
    siteName: SITE_NAME,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
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
