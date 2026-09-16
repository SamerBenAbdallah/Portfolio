"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setStatus("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setStatus(error.message);
      setBusy(false);
      return;
    }
    router.replace("/admin");
    router.refresh();
  }

  return (
    <form onSubmit={submit}>
      <label>Email<input name="email" type="email" autoComplete="email" required /></label>
      <label>Password<input name="password" type="password" autoComplete="current-password" required /></label>
      {status && <p className="admin-status error" role="alert">{status}</p>}
      <button type="submit" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
    </form>
  );
}
