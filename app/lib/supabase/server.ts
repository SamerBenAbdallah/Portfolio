import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseAnonKey, supabaseUrl } from "./config";

export async function createClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase is not configured. Add the public URL and anon key to the environment.");
  }

  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components cannot always mutate cookies. Route handlers and
          // client-side auth flows will refresh them when mutation is available.
        }
      },
    },
  });
}
