import { PageContainer } from "@/components/common/page-container";

export function AppFooter() {
  return (
    <footer className="pb-[calc(env(safe-area-inset-bottom)+5.75rem)] pt-4 md:pb-6">
      <PageContainer>
        <div className="app-card app-card-subtle flex min-h-16 items-center justify-between gap-4 px-4 py-3 text-sm text-muted-foreground sm:px-5">
          <span className="font-medium text-foreground">Company Hub</span>
          <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground/90">
            One Workspace
          </span>
        </div>
      </PageContainer>
    </footer>
  );
}
