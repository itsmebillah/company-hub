import { PageContainer } from "@/components/common/page-container";

export function AppFooter() {
  return (
    <footer className="border-t">
      <PageContainer className="flex min-h-14 items-center justify-between gap-4 py-4 text-sm text-muted-foreground">
        <span>Company Hub</span>
        <span>Foundation</span>
      </PageContainer>
    </footer>
  );
}
