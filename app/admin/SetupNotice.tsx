import Link from "next/link";

export function SetupNotice() {
  return (
    <main className="admin-auth">
      <section className="admin-auth-card admin-setup">
        <h1>Connect Supabase</h1>
        <p>The CMS is installed, but this environment does not have Supabase credentials yet. The public portfolio is safely using its preserved local project data.</p>
        <pre>NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co{"\n"}NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY</pre>
        <p>Run the migration and seed files in <code>supabase/</code>, create your Auth user, add it to <code>admin_users</code>, then set these variables in local development and Vercel.</p>
        <Link href="/">Return to portfolio</Link>
      </section>
    </main>
  );
}
