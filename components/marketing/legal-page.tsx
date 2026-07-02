import { LegalArticle } from "@/components/marketing/legal-article";
import { LegalFooter } from "@/components/marketing/legal-footer";
import { HomeNav } from "@/components/marketing/home-nav";
import type { MarketingLegalPage } from "@/components/marketing/marketing-links";
import { MarketingInsetLayout } from "@/components/marketing/marketing-inset-layout";
import { Badge } from "@/components/ui/badge";

export const LEGAL_LAST_UPDATED = "July 1, 2026";

type LegalPageProps = {
  title: string;
  description: string;
  lastUpdated?: string;
  activePage: MarketingLegalPage;
  children: React.ReactNode;
};

export function LegalPage({
  title,
  description,
  lastUpdated,
  activePage,
  children,
}: LegalPageProps) {
  return (
    <MarketingInsetLayout
      nav={<HomeNav />}
      scrollable
      footer={<LegalFooter activePage={activePage} />}
    >
      <div className="mx-auto w-full max-w-6xl px-6 py-8 md:px-8 md:py-10 lg:px-10">
        <LegalArticle
          header={
            <>
              {lastUpdated ? (
                <Badge
                  variant="secondary"
                  className="border-border/20 bg-secondary/50 mb-4 rounded-full px-3 py-1 text-[11px] font-[550] tracking-wide"
                >
                  Last updated {lastUpdated}
                </Badge>
              ) : null}

              <div className="space-y-3">
                <h1 className="font-heading text-4xl font-semibold tracking-tight md:text-5xl">
                  {title}
                </h1>
                <p className="text-muted-foreground max-w-3xl text-base leading-relaxed font-[450] md:text-lg">
                  {description}
                </p>
              </div>
            </>
          }
        >
          {children}
        </LegalArticle>
      </div>
    </MarketingInsetLayout>
  );
}
