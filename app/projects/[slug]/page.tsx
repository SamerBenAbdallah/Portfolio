import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getPublishedProjectBySlug } from "../../lib/projects/repository";
import { ProjectToolIcons } from "../../lib/projects/ProjectToolIcons";
import { ProjectMedia } from "./ProjectMedia";

export const dynamic = "force-dynamic";

type ProjectPageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = await getPublishedProjectBySlug(slug);
  if (!project) return { title: "Project not found — Samer Ben Abdallah" };

  return {
    title: `${project.title} — Samer Ben Abdallah`,
    description: project.short_description,
    openGraph: project.cover_image ? { images: [{ url: project.cover_image }] } : undefined,
  };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const project = await getPublishedProjectBySlug(slug);
  if (!project) notFound();

  return (
    <main
      className="project-route"
      style={{ "--project-accent": project.accent, "--project-secondary": project.secondary } as CSSProperties}
    >
      <nav className="project-route-nav">
        <Link href="/#work">← BACK TO ARCADE</Link>
        <span>{`CASE FILE // ${String(project.display_order + 1).padStart(2, "0")}`}</span>
      </nav>
      <article className="project-route-shell">
        <header className="project-route-header">
          <p>{`${project.project_type === "motion" ? "MOTION FEED" : "DESIGN ARCHIVE"} // ONLINE`}</p>
          <h1>{project.title}</h1>
          <div><span>{project.category}</span>{project.year && <span>{project.year}</span>}{project.featured && <strong>FEATURED</strong>}</div>
        </header>
        <ProjectMedia project={project} />
        <section className="project-route-details">
          <div>
            <p>{project.full_description || project.short_description}</p>
            <div className="project-route-links">
              {project.behance_url && <a href={project.behance_url} target="_blank" rel="noreferrer">VIEW ON BEHANCE ↗</a>}
              {project.external_url && <a href={project.external_url} target="_blank" rel="noreferrer">VISIT PROJECT ↗</a>}
            </div>
          </div>
          <dl>
            {project.client && <div><dt>CLIENT</dt><dd>{project.client}</dd></div>}
            {project.year && <div><dt>YEAR</dt><dd>{project.year}</dd></div>}
            <div><dt>TOOLS</dt><dd>{project.tools.length ? <ProjectToolIcons tools={project.tools} /> : "—"}</dd></div>
            <div><dt>OUTPUT</dt><dd>{project.deliverables.join(" / ") || "—"}</dd></div>
          </dl>
        </section>
      </article>
    </main>
  );
}
