import { isSupabaseConfigured } from "../supabase/config";
import { createClient } from "../supabase/server";
import { defaultSiteSettings, normalizeSiteSettings, type SiteSettings } from "./types";

export async function getSiteSettings(): Promise<SiteSettings> {
  if (!isSupabaseConfigured()) return normalizeSiteSettings(defaultSiteSettings);
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("site_settings").select("content").eq("id", "main").maybeSingle();
    if (error) throw error;
    return normalizeSiteSettings(data?.content);
  } catch (error) {
    console.error("Supabase site settings fetch failed; serving safe defaults.", error);
    return normalizeSiteSettings(defaultSiteSettings);
  }
}

export async function getAdminSiteSettings() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("site_settings").select("content").eq("id", "main").maybeSingle();
  if (error) throw error;
  return normalizeSiteSettings(data?.content);
}
