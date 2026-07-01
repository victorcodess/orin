import { HomeContent } from "@/components/marketing/home-content";
import { HomeFooter } from "@/components/marketing/home-footer";
import { HomeNav } from "@/components/marketing/home-nav";
import { MarketingInsetLayout } from "@/components/marketing/marketing-inset-layout";

export default function Home() {
  return (
    <MarketingInsetLayout
      nav={<HomeNav />}
      footer={<HomeFooter />}
      panelClassName="items-center justify-center px-8"
    >
      <HomeContent />
    </MarketingInsetLayout>
  );
}
