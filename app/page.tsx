import { HomeLoginPage } from "@/features/home-login/components";
import { loginAction } from "@/features/auth/actions/login.action";

export default function HomePage() {
  return <HomeLoginPage onLogin={loginAction} />;
}
