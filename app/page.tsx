import type { Metadata } from "next";

import { HomeContent } from "@/components/marketing/home-content";
import { HomeFooter } from "@/components/marketing/home-footer";
import { HomeNav } from "@/components/marketing/home-nav";
import { MarketingInsetLayout } from "@/components/marketing/marketing-inset-layout";
import { getHomeJsonLd, pageUrl } from "@/lib/seo/metadata";

const canonical = pageUrl("/");

export const metadata: Metadata = {
  alternates: { canonical },
  openGraph: { url: canonical },
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(getHomeJsonLd()) }}
      />
      <MarketingInsetLayout
        nav={<HomeNav />}
        footer={<HomeFooter />}
        panelClassName="items-center justify-center px-8"
      >
        <HomeContent />
      </MarketingInsetLayout>
    </>
  );
}
