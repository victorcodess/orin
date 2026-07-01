import { StoreInit } from "@/components/shell/store-init";
import { MarketingInsetLayout } from "@/components/marketing/marketing-inset-layout";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <StoreInit />
      <MarketingInsetLayout centered scrollable panelClassName="px-4 py-10">
        {children}
      </MarketingInsetLayout>
    </>
  );
}
