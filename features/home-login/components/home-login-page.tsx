import { BrandPanel } from "@/features/home-login/components/brand-panel";
import { LoginCard } from "@/features/home-login/components/login-card";

export function HomeLoginPage() {
  return (
    <main className="min-h-svh bg-background lg:flex">
      <BrandPanel />
      <section className="flex min-h-svh items-center justify-center px-4 py-8 sm:px-6 lg:basis-[55%] lg:px-10">
        <LoginCard />
      </section>
    </main>
  );
}
