import { redirect } from "next/navigation";
import { getAdminProjects, requirePortfolioAdmin } from "../lib/projects/repository";
import { isSupabaseConfigured } from "../lib/supabase/config";
import { AdminDashboard } from "./AdminDashboard";
import { SetupNotice } from "./SetupNotice";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!isSupabaseConfigured()) return <SetupNotice />;
  const { user, isAdmin } = await requirePortfolioAdmin();
  if (!user) redirect("/admin/login");
  if (!isAdmin) {
    return (
      <main className="admin-auth">
        <section className="admin-auth-card admin-setup">
          <h1>Access not enabled</h1>
          <p>Your sign-in worked, but <strong>{user.email}</strong> is not on the portfolio administrator allowlist.</p>
          <a href="/admin/login">Return to sign in</a>
        </section>
      </main>
    );
  }

  const projects = await getAdminProjects();
  return <AdminDashboard initialProjects={projects} email={user.email ?? "Admin"} />;
}
