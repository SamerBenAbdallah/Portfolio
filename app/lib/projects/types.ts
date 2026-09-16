export type ProjectKind = "graphic" | "motion";

export type ProjectImage = {
  src: string;
  alt: string;
};

export type ProjectVideo = {
  title: string;
  src: string;
  poster: string;
  duration: string;
};

export type PortfolioProject = {
  id: string;
  title: string;
  slug: string;
  short_description: string;
  full_description: string;
  category: string;
  project_type: ProjectKind;
  cover_image: string;
  gallery_images: ProjectImage[];
  video_url: string | null;
  video_items: ProjectVideo[];
  behance_url: string | null;
  external_url: string | null;
  tools: string[];
  deliverables: string[];
  year: number | null;
  client: string | null;
  featured: boolean;
  published: boolean;
  display_order: number;
  accent: string;
  secondary: string;
  longform: boolean;
  created_at: string;
  updated_at: string;
};

export type ProjectInput = Omit<PortfolioProject, "id" | "created_at" | "updated_at">;

export type ArcadeProject = {
  id: string;
  slug: string;
  kind: ProjectKind;
  title: string;
  category: string;
  description: string;
  fullDescription: string;
  tools: string[];
  deliverables: string[];
  accent: string;
  secondary: string;
  duration?: string;
  thumbnail?: string;
  poster?: string;
  longform?: boolean;
  images?: ProjectImage[];
  videos?: ProjectVideo[];
  featured: boolean;
  year?: number | null;
  client?: string | null;
  behanceUrl?: string | null;
  externalUrl?: string | null;
};

export function toArcadeProject(project: PortfolioProject): ArcadeProject {
  const videos = project.video_items.length
    ? project.video_items
    : project.video_url
      ? [{ title: project.title, src: project.video_url, poster: project.cover_image, duration: "VIDEO" }]
      : [];

  return {
    id: project.id,
    slug: project.slug,
    kind: project.project_type,
    title: project.title,
    category: project.category,
    description: project.short_description,
    fullDescription: project.full_description || project.short_description,
    tools: project.tools,
    deliverables: project.deliverables,
    accent: project.accent,
    secondary: project.secondary,
    duration: project.project_type === "motion" ? `${videos.length} ${videos.length === 1 ? "CLIP" : "CLIPS"}` : undefined,
    thumbnail: project.project_type === "graphic" ? project.cover_image : undefined,
    poster: project.project_type === "motion" ? project.cover_image : undefined,
    longform: project.longform,
    images: project.project_type === "graphic" ? project.gallery_images : undefined,
    videos: project.project_type === "motion" ? videos : undefined,
    featured: project.featured,
    year: project.year,
    client: project.client,
    behanceUrl: project.behance_url,
    externalUrl: project.external_url,
  };
}

export function slugifyProjectTitle(value: string) {
  return value
    .toLowerCase()
    .trim()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
