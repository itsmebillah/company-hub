import { Loader2 } from "lucide-react";

type LoadingScreenProps = {
  label?: string;
};

export function LoadingScreen({ label = "Loading" }: LoadingScreenProps) {
  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-6">
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <Loader2 className="size-5 animate-spin" aria-hidden="true" />
        <span>{label}</span>
      </div>
    </main>
  );
}
