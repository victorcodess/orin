import { MarketingInsetLayout } from "@/components/marketing/marketing-inset-layout";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MarketingInsetLayout centered scrollable panelClassName="px-6 md:px-10">
      {children}
    </MarketingInsetLayout>
  );
}
