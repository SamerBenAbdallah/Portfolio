import { localProjects } from "../../data/local-projects";
import { isSupabaseConfigured } from "../supabase/config";
import { createClient } from "../supabase/server";
import type { PortfolioProject } from "./types";

export type ProjectResult = {
  projects: PortfolioProject[];
  source: "supabase" | "local";
  error?: string;
};

function normalizeProject(row: Record<string, unknown>): PortfolioProject {
  return {
    id: String(row.id ?? ""),
    title: String(row.title ?? "Untitled project"),
    slug: String(row.slug ?? ""),
    short_description: String(row.short_description ?? ""),
    full_description: String(row.full_description ?? row.short_description ?? ""),
    category: String(row.category ?? "Uncategorized"),
    project_type: row.project_type === "motion" ? "motion" : "graphic",
    cover_image: String(row.cover_image ?? ""),
    gallery_images: Array.isArray(row.gallery_images) ? (row.gallery_images as PortfolioProject["gallery_images"]) : [],
    video_url: typeof row.video_url === "string" && row.video_url ? row.video_url : null,
    video_items: Array.isArray(row.video_items) ? (row.video_items as PortfolioProject["video_items"]) : [],
    behance_url: typeof row.behance_url === "string" && row.behance_url ? row.behance_url : null,
    external_url: typeof row.external_url === "string" && row.external_url ? row.external_url : null,
    tools: Array.isArray(row.tools) ? row.tools.map(String) : [],
    deliverables: Array.isArray(row.deliverables) ? row.deliverables.map(String) : [],
    year: typeof row.year === "number" ? row.year : null,
    client: typeof row.client === "string" && row.client ? row.client : null,
    featured: Boolean(row.featured),
    published: Boolean(row.published),
    display_order: Number(row.display_order ?? 0),
    accent: String(row.accent ?? "#1fe7ff"),
    secondary: String(row.secondary ?? "#123cc5"),
    longform: Boolean(row.longform),
    created_at: String(row.created_at ?? ""),
    updated_at: String(row.updated_at ?? ""),
  };
}

export async function getPublishedProjects(): Promise<ProjectResult> {
  if (!isSupabaseConfigured()) {
    return { projects: localProjects, source: "local" };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("published", true)
      .order("display_order", { ascending: true });

    if (error) throw error;
    return { projects: (data ?? []).map(normalizeProject), source: "supabase" };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load projects from Supabase.";
    console.error("Supabase project fetch failed; serving the preserved local portfolio.", error);
    return { projects: localProjects, source: "local", error: message };
  }
}

export async function getPublishedProjectBySlug(slug: string) {
  if (!isSupabaseConfigured()) {
    return localProjects.find((project) => project.slug === slug && project.published) ?? null;
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("slug", slug)
      .eq("published", true)
      .maybeSingle();

    if (error) throw error;
    return data ? normalizeProject(data) : null;
  } catch (error) {
    console.error("Supabase project lookup failed; checking the preserved local portfolio.", error);
    return localProjects.find((project) => project.slug === slug && project.published) ?? null;
  }
}

export async function getAdminProjects() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("projects").select("*").order("display_order", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(normalizeProject);
}

export async function requirePortfolioAdmin() {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) return { supabase, user: null, isAdmin: false };

  const { data: admin, error: adminError } = await supabase.rpc("is_portfolio_admin");

  return { supabase, user: authData.user, isAdmin: !adminError && admin === true };
}
