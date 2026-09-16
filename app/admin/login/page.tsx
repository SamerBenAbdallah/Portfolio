import { redirect } from "next/navigation";
import Link from "next/link";
import { isSupabaseConfigured } from "../../lib/supabase/config";
import { createClient } from "../../lib/supabase/server";
import { LoginForm } from "../LoginForm";
import { SetupNotice } from "../SetupNotice";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  if (!isSupabaseConfigured()) return <SetupNotice />;
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (data.user) redirect("/admin");

  return (
    <main className="admin-auth">
      <section className="admin-auth-card">
        <h1>Portfolio CMS</h1>
        <p>Sign in with the private Supabase account registered as a portfolio administrator.</p>
        <LoginForm />
        <Link href="/">← Return to portfolio</Link>
      </section>
    </main>
  );
}
