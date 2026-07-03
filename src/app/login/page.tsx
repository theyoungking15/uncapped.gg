import { LoginForm } from "@/components/action-forms";
import { EnvNotice } from "@/components/status";
import { hasSupabaseEnv } from "@/lib/supabase";

export default function LoginPage() {
  if (!hasSupabaseEnv()) return <EnvNotice />;

  return (
    <main className="authPage">
      <section className="authCard">
        <h1>Owner login</h1>
        <p className="muted">Use email magic links for the first MVP. After signing in, create or manage your shop.</p>
        <LoginForm />
      </section>
    </main>
  );
}

