import { AuthFooter } from "@/components/auth/auth-footer";
import { AuthNav } from "@/components/auth/auth-nav";
import { MarketingInsetLayout } from "@/components/marketing/marketing-inset-layout";
import { createNoIndexMetadata } from "@/lib/seo/metadata";

export const metadata = createNoIndexMetadata();

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MarketingInsetLayout
      nav={<AuthNav />}
      footer={<AuthFooter />}
      centered
      scrollable
      edgeGradients={false}
      panelClassName="items-center justify-center px-6 py-10 md:px-10"
    >
      {children}
    </MarketingInsetLayout>
  );
}
