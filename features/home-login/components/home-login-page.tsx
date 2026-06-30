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
    <main className="min-h-svh bg-background lg:flex">
      <BrandPanel />
      <section className="flex min-h-svh items-center justify-center px-4 py-8 sm:px-6 lg:basis-[55%] lg:px-10">
        <LoginCard onLogin={onLogin} />
      </section>
    </main>
  );
}
