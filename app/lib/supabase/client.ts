"use client";

import { createBrowserClient } from "@supabase/ssr";
import { supabaseAnonKey, supabaseUrl } from "./config";

export function createClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase is not configured. Add the public URL and anon key to the environment.");
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
