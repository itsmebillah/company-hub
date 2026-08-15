import type { ReactNode } from "react";

import { PageContainer } from "@/components/common/page-container";
import { PublicSiteLayout } from "@/features/public-site/components/public-site-layout";

type LegalSection = {
  title: string;
  content: ReactNode;
};

export function LegalPage({
  eyebrow,
  title,
  summary,
  effectiveDate,
  sections,
}: {
  eyebrow: string;
  title: string;
  summary: string;
  effectiveDate: string;
  sections: LegalSection[];
}) {
  return (
    <PublicSiteLayout>
      <main>
        <PageContainer className="py-10 sm:py-14">
          <article className="mx-auto max-w-4xl">
            <header className="app-page-header">
              <div>
                <p className="app-page-eyebrow">{eyebrow}</p>
                <h1 className="app-page-title mt-3">{title}</h1>
                <p className="app-page-description mt-3 max-w-3xl">{summary}</p>
                <p className="text-muted-foreground mt-4 text-xs font-medium">
                  Effective date: {effectiveDate}
                </p>
              </div>
            </header>

            <div className="app-card mt-6 divide-y">
              {sections.map((section) => (
                <section key={section.title} className="p-5 sm:p-7">
                  <h2 className="text-xl font-semibold">{section.title}</h2>
                  <div className="text-muted-foreground [&_strong]:text-foreground mt-3 space-y-3 text-sm leading-7 [&_li]:pl-1 [&_strong]:font-semibold [&_ul]:ml-5 [&_ul]:list-disc [&_ul]:space-y-2">
                    {section.content}
                  </div>
                </section>
              ))}
            </div>
          </article>
        </PageContainer>
      </main>
    </PublicSiteLayout>
  );
}
