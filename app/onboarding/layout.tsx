import { AuthNav } from "@/components/auth/auth-nav";
import { MarketingInsetLayout } from "@/components/marketing/marketing-inset-layout";
import { ThemeFooter } from "@/components/marketing/theme-footer";
import { ThemeSwitcher } from "@/components/shared/theme-switcher";
import { createNoIndexMetadata } from "@/lib/seo/metadata";

export const metadata = createNoIndexMetadata("Onboarding");

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MarketingInsetLayout
      nav={<AuthNav />}
      footer={<ThemeFooter className="max-md:hidden" />}
      scrollable
      edgeGradients={false}
    >
        <div className="mx-auto flex w-full max-w-xl flex-col px-6 py-20 md:min-h-full md:px-10 md:py-10">
          <div aria-hidden className="hidden md:block md:flex-1" />
          <div className="w-full">{children}</div>
          <div aria-hidden className="hidden md:block md:flex-1" />
        </div>
        <footer className="relative mx-auto flex w-full max-w-xl items-center justify-center px-6 py-5 md:hidden md:px-10">
          <ThemeSwitcher className="w-fit" />
        </footer>
      </MarketingInsetLayout>
  );
}
