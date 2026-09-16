"use client";

import { type FormEvent, useState } from "react";
import { createClient } from "../lib/supabase/client";

export function LoginForm() {
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setStatus("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/admin`,
      },
    });
    if (error) {
      setStatus(error.message);
      setBusy(false);
      return;
    }
    setSent(true);
    setStatus("Check your inbox and open the secure sign-in link.");
    setBusy(false);
  }

  return (
    <form onSubmit={submit}>
      <label>Email<input name="email" type="email" autoComplete="email" required /></label>
      {status && <p className={`admin-status${sent ? "" : " error"}`} role="status">{status}</p>}
      <button type="submit" disabled={busy || sent}>{busy ? "Sending…" : sent ? "Link sent" : "Email me a sign-in link"}</button>
    </form>
  );
}
