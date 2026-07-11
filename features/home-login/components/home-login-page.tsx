import { BrandPanel } from "@/features/home-login/components/brand-panel";
import { LoginCard } from "@/features/home-login/components/login-card";
import type { LoginActionState } from "@/features/auth/actions/login.action";

type HomeLoginPageProps = {
  onLogin: (input: {
    employeeId: string;
    password: string;
    rememberMe: boolean;
  }) => Promise<LoginActionState>;
};

export function HomeLoginPage({ onLogin }: HomeLoginPageProps) {
  return (
    <main className="app-shell min-h-svh lg:flex">
      <BrandPanel />
      <section className="relative flex min-h-svh items-center justify-center overflow-hidden px-4 py-8 sm:px-6 lg:basis-[55%] lg:px-10">
        <div className="pointer-events-none absolute inset-x-6 top-8 h-40 rounded-full bg-primary/10 blur-3xl" />
        <LoginCard onLogin={onLogin} />
      </section>
    </main>
  );
}
