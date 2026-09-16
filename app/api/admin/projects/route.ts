import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { requirePortfolioAdmin } from "../../../lib/projects/repository";
import { slugifyProjectTitle } from "../../../lib/projects/types";

export const dynamic = "force-dynamic";

type UnknownRecord = Record<string, unknown>;

function stringValue(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function nullableUrl(value: unknown) {
  const result = stringValue(value);
  return result || null;
}

function arrayOfStrings(value: unknown) {
  return Array.isArray(value) ? value.map(String).map((item) => item.trim()).filter(Boolean) : [];
}

function sanitizeProject(input: UnknownRecord) {
  const title = stringValue(input.title);
  const slug = slugifyProjectTitle(stringValue(input.slug, title));
  const category = stringValue(input.category);
  const shortDescription = stringValue(input.short_description);
  const coverImage = stringValue(input.cover_image);
  if (!title || !slug || !category || !shortDescription || !coverImage) {
    throw new Error("Title, slug, category, short description, and cover image are required.");
  }

  const galleryImages = Array.isArray(input.gallery_images)
    ? input.gallery_images
        .filter((item): item is UnknownRecord => Boolean(item) && typeof item === "object")
        .map((item) => ({ src: stringValue(item.src), alt: stringValue(item.alt, `${title} artwork`) }))
        .filter((item) => item.src)
    : [];
  const videoItems = Array.isArray(input.video_items)
    ? input.video_items
        .filter((item): item is UnknownRecord => Boolean(item) && typeof item === "object")
        .map((item) => ({
          title: stringValue(item.title, title),
          src: stringValue(item.src),
          poster: stringValue(item.poster, coverImage),
          duration: stringValue(item.duration, "VIDEO"),
        }))
        .filter((item) => item.src)
    : [];
  const parsedYear = Number(input.year);

  return {
    title,
    slug,
    short_description: shortDescription,
    full_description: stringValue(input.full_description, shortDescription),
    category,
    project_type: input.project_type === "motion" ? "motion" : "graphic",
    cover_image: coverImage,
    gallery_images: galleryImages,
    video_url: nullableUrl(input.video_url),
    video_items: videoItems,
    behance_url: nullableUrl(input.behance_url),
    external_url: nullableUrl(input.external_url),
    tools: arrayOfStrings(input.tools),
    deliverables: arrayOfStrings(input.deliverables),
    year: Number.isInteger(parsedYear) && parsedYear >= 1990 && parsedYear <= 2100 ? parsedYear : null,
    client: stringValue(input.client) || null,
    featured: Boolean(input.featured),
    published: Boolean(input.published),
    display_order: Math.max(0, Number.isFinite(Number(input.display_order)) ? Math.trunc(Number(input.display_order)) : 0),
    accent: /^#[0-9a-f]{6}$/i.test(stringValue(input.accent)) ? stringValue(input.accent) : "#1fe7ff",
    secondary: /^#[0-9a-f]{6}$/i.test(stringValue(input.secondary)) ? stringValue(input.secondary) : "#123cc5",
    longform: Boolean(input.longform),
  };
}

function mediaUrls(project: UnknownRecord | null) {
  if (!project) return [];
  const urls = new Set<string>();
  if (typeof project.cover_image === "string") urls.add(project.cover_image);
  if (typeof project.video_url === "string") urls.add(project.video_url);
  if (Array.isArray(project.gallery_images)) project.gallery_images.forEach((item) => { if (item && typeof item === "object" && typeof (item as UnknownRecord).src === "string") urls.add((item as UnknownRecord).src as string); });
  if (Array.isArray(project.video_items)) project.video_items.forEach((item) => {
    if (!item || typeof item !== "object") return;
    const video = item as UnknownRecord;
    if (typeof video.src === "string") urls.add(video.src);
    if (typeof video.poster === "string") urls.add(video.poster);
  });
  return [...urls];
}

function storagePath(url: string) {
  const marker = "/storage/v1/object/public/project-media/";
  const index = url.indexOf(marker);
  return index >= 0 ? decodeURIComponent(url.slice(index + marker.length).split("?")[0]) : null;
}

async function authorize() {
  try {
    const auth = await requirePortfolioAdmin();
    if (!auth.user) return { error: NextResponse.json({ error: "Authentication required." }, { status: 401 }) };
    if (!auth.isAdmin) return { error: NextResponse.json({ error: "Administrator access required." }, { status: 403 }) };
    return { supabase: auth.supabase };
  } catch {
    return { error: NextResponse.json({ error: "Supabase is not configured for this deployment." }, { status: 503 }) };
  }
}

function refreshPublicPages(slug?: string) {
  revalidatePath("/");
  if (slug) revalidatePath(`/projects/${slug}`);
}

export async function POST(request: Request) {
  const auth = await authorize();
  if (auth.error) return auth.error;
  try {
    const input = await request.json() as UnknownRecord;
    const project = sanitizeProject(input);
    const { data, error } = await auth.supabase.from("projects").insert(project).select("*").single();
    if (error) throw error;
    refreshPublicPages(data.slug);
    return NextResponse.json({ project: data }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create project." }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  const auth = await authorize();
  if (auth.error) return auth.error;
  try {
    const input = await request.json() as UnknownRecord;
    const id = stringValue(input.id);
    if (!id) throw new Error("Project id is required.");
    const { data: previous, error: previousError } = await auth.supabase.from("projects").select("*").eq("id", id).single();
    if (previousError) throw previousError;
    const project = sanitizeProject(input);
    const { data, error } = await auth.supabase.from("projects").update(project).eq("id", id).select("*").single();
    if (error) throw error;

    const retained = new Set(mediaUrls(data));
    const removedPaths = mediaUrls(previous).filter((url) => !retained.has(url)).map(storagePath).filter((path): path is string => Boolean(path));
    if (removedPaths.length) await auth.supabase.storage.from("project-media").remove(removedPaths);
    refreshPublicPages(previous.slug);
    refreshPublicPages(data.slug);
    return NextResponse.json({ project: data });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to update project." }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const auth = await authorize();
  if (auth.error) return auth.error;
  try {
    const id = new URL(request.url).searchParams.get("id")?.trim();
    if (!id) throw new Error("Project id is required.");
    const { data: project, error: findError } = await auth.supabase.from("projects").select("*").eq("id", id).single();
    if (findError) throw findError;
    const { error } = await auth.supabase.from("projects").delete().eq("id", id);
    if (error) throw error;
    const paths = mediaUrls(project).map(storagePath).filter((path): path is string => Boolean(path));
    if (paths.length) await auth.supabase.storage.from("project-media").remove(paths);
    refreshPublicPages(project.slug);
    return NextResponse.json({ deleted: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to delete project." }, { status: 400 });
  }
}
