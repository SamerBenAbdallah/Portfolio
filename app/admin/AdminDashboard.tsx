"use client";

import { type ChangeEvent, type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../lib/supabase/client";
import type { PortfolioProject, ProjectInput } from "../lib/projects/types";
import { slugifyProjectTitle } from "../lib/projects/types";

type EditableProject = ProjectInput & { id?: string };

function blankProject(displayOrder: number): EditableProject {
  return {
    title: "",
    slug: "",
    short_description: "",
    full_description: "",
    category: "",
    project_type: "graphic",
    cover_image: "",
    gallery_images: [],
    video_url: null,
    video_items: [],
    behance_url: null,
    external_url: null,
    tools: [],
    deliverables: [],
    year: new Date().getFullYear(),
    client: null,
    featured: false,
    published: false,
    display_order: displayOrder,
    accent: "#1fe7ff",
    secondary: "#123cc5",
    longform: false,
  };
}

function editable(project: PortfolioProject): EditableProject {
  const result = { ...project } as Partial<PortfolioProject>;
  delete result.created_at;
  delete result.updated_at;
  return result as EditableProject;
}

function splitList(value: string) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

export function AdminDashboard({ initialProjects, email }: { initialProjects: PortfolioProject[]; email: string }) {
  const router = useRouter();
  const [projects, setProjects] = useState(initialProjects);
  const [draft, setDraft] = useState<EditableProject>(() => blankProject(initialProjects.length));
  const [status, setStatus] = useState("Select a project or create a new one.");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pendingCover, setPendingCover] = useState<File | null>(null);
  const [pendingCoverPreview, setPendingCoverPreview] = useState("");
  const [pendingGallery, setPendingGallery] = useState<File[]>([]);
  const [pendingGalleryPreviews, setPendingGalleryPreviews] = useState<string[]>([]);

  function clearPendingMedia() {
    if (pendingCoverPreview) URL.revokeObjectURL(pendingCoverPreview);
    pendingGalleryPreviews.forEach((url) => URL.revokeObjectURL(url));
    setPendingCover(null);
    setPendingCoverPreview("");
    setPendingGallery([]);
    setPendingGalleryPreviews([]);
  }

  function selectProject(project: PortfolioProject) {
    clearPendingMedia();
    setDraft(editable(project));
    setError(false);
    setStatus(`Editing “${project.title}”.`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function createNew() {
    clearPendingMedia();
    const order = projects.reduce((max, project) => Math.max(max, project.display_order), -1) + 1;
    setDraft(blankProject(order));
    setError(false);
    setStatus("New project draft ready.");
  }

  function update<K extends keyof EditableProject>(key: K, value: EditableProject[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function titleChanged(value: string) {
    setDraft((current) => ({ ...current, title: value, slug: current.id ? current.slug : slugifyProjectTitle(value) }));
  }

  function chooseCover(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (pendingCoverPreview) URL.revokeObjectURL(pendingCoverPreview);
    setPendingCover(file);
    setPendingCoverPreview(URL.createObjectURL(file));
  }

  function chooseGallery(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;
    pendingGalleryPreviews.forEach((url) => URL.revokeObjectURL(url));
    setPendingGallery(files);
    setPendingGalleryPreviews(files.map((file) => URL.createObjectURL(file)));
  }

  async function uploadFile(file: File) {
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) throw new Error("Your session expired. Sign in again.");
    const extension = file.name.split(".").pop()?.toLowerCase() || "bin";
    const safeBase = file.name.replace(/\.[^.]+$/, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "media";
    const path = `${auth.user.id}/${crypto.randomUUID()}-${safeBase}.${extension}`;
    const { error: uploadError } = await supabase.storage.from("project-media").upload(path, file, { cacheControl: "31536000", upsert: false });
    if (uploadError) throw uploadError;
    return supabase.storage.from("project-media").getPublicUrl(path).data.publicUrl;
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(false);
    setStatus("Saving project and uploading selected media…");
    try {
      let payload: EditableProject = { ...draft };
      if (pendingCover) payload = { ...payload, cover_image: await uploadFile(pendingCover) };
      if (pendingGallery.length) {
        const urls = await Promise.all(pendingGallery.map(uploadFile));
        payload = {
          ...payload,
          gallery_images: [
            ...payload.gallery_images,
            ...urls.map((src, index) => ({ src, alt: `${payload.title} gallery image ${payload.gallery_images.length + index + 1}` })),
          ],
        };
      }
      if (payload.project_type === "graphic" && !payload.gallery_images.length && payload.cover_image) {
        payload.gallery_images = [{ src: payload.cover_image, alt: `${payload.title} cover` }];
      }

      const response = await fetch("/api/admin/projects", {
        method: payload.id ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "The project could not be saved.");
      const saved = result.project as PortfolioProject;
      setProjects((current) => [...current.filter((project) => project.id !== saved.id), saved].sort((a, b) => a.display_order - b.display_order));
      clearPendingMedia();
      setDraft(editable(saved));
      setStatus(saved.published ? "Project saved and published." : "Draft saved.");
      router.refresh();
    } catch (saveError) {
      setError(true);
      setStatus(saveError instanceof Error ? saveError.message : "The project could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  async function removeProject() {
    if (!draft.id || !window.confirm(`Permanently delete “${draft.title}” and its Supabase-hosted media? This cannot be undone.`)) return;
    setBusy(true);
    setError(false);
    setStatus("Deleting project…");
    try {
      const response = await fetch(`/api/admin/projects?id=${encodeURIComponent(draft.id)}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "The project could not be deleted.");
      const remaining = projects.filter((project) => project.id !== draft.id);
      setProjects(remaining);
      setDraft(blankProject(remaining.length));
      setStatus("Project deleted.");
      router.refresh();
    } catch (deleteError) {
      setError(true);
      setStatus(deleteError instanceof Error ? deleteError.message : "The project could not be deleted.");
    } finally {
      setBusy(false);
    }
  }

  async function moveProject(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= projects.length) return;
    const next = [...projects];
    const first = { ...next[index], display_order: next[targetIndex].display_order };
    const second = { ...next[targetIndex], display_order: next[index].display_order };
    next[index] = second;
    next[targetIndex] = first;
    setProjects(next);
    setStatus("Updating project order…");
    try {
      const responses = await Promise.all([first, second].map((project) => fetch("/api/admin/projects", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(editable(project)),
      })));
      if (responses.some((response) => !response.ok)) throw new Error("The new order could not be saved.");
      setStatus("Project order updated.");
    } catch (orderError) {
      setError(true);
      setStatus(orderError instanceof Error ? orderError.message : "The new order could not be saved.");
      router.refresh();
    }
  }

  async function signOut() {
    await createClient().auth.signOut();
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <div className="admin-shell">
      <header className="admin-topbar">
        <div><strong>Player01 Portfolio CMS</strong><small>{email}</small></div>
        <div><a href="/" target="_blank">View portfolio ↗</a><button type="button" onClick={signOut}>Sign out</button></div>
      </header>
      <main className="admin-main">
        <aside className="admin-panel admin-list-panel">
          <div className="admin-panel-header"><h1>Projects ({projects.length})</h1><button className="admin-primary" type="button" onClick={createNew}>+ Add</button></div>
          <div className="admin-project-list">
            {projects.map((project, index) => (
              <div className={`admin-project-row ${draft.id === project.id ? "active" : ""}`} key={project.id} role="button" tabIndex={0} onClick={() => selectProject(project)} onKeyDown={(event) => { if (event.key === "Enter") selectProject(project); }}>
                {project.cover_image ? <img src={project.cover_image} alt="" /> : <span />}
                <div><strong>{project.title}</strong><small>{project.project_type} · {project.published ? "Published" : "Draft"}</small></div>
                <div><i className={project.published ? "live" : ""} title={project.published ? "Published" : "Draft"} /><div className="admin-row-order"><button type="button" aria-label={`Move ${project.title} up`} disabled={index === 0} onClick={(event) => { event.stopPropagation(); void moveProject(index, -1); }}>↑</button><button type="button" aria-label={`Move ${project.title} down`} disabled={index === projects.length - 1} onClick={(event) => { event.stopPropagation(); void moveProject(index, 1); }}>↓</button></div></div>
              </div>
            ))}
            {!projects.length && <p className="admin-help" style={{ padding: 20 }}>No projects yet. Add your first project.</p>}
          </div>
        </aside>

        <section className="admin-panel">
          <div className="admin-panel-header"><h2>{draft.id ? `Edit: ${draft.title}` : "Add project"}</h2><span className="admin-help">{draft.published ? "Published" : "Draft"}</span></div>
          <form className="admin-form" onSubmit={save}>
            <div className="admin-form-grid">
              <label className="admin-field"><span>Title *</span><input value={draft.title} onChange={(event) => titleChanged(event.target.value)} required /></label>
              <label className="admin-field"><span>Slug *</span><input value={draft.slug} onChange={(event) => update("slug", slugifyProjectTitle(event.target.value))} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" required /></label>
              <label className="admin-field"><span>Category *</span><input value={draft.category} onChange={(event) => update("category", event.target.value)} required /></label>
              <label className="admin-field"><span>Project type</span><select value={draft.project_type} onChange={(event) => update("project_type", event.target.value as "graphic" | "motion")}><option value="graphic">Graphic design</option><option value="motion">Motion design</option></select></label>
              <label className="admin-field wide"><span>Short description *</span><textarea value={draft.short_description} onChange={(event) => update("short_description", event.target.value)} required /></label>
              <label className="admin-field wide"><span>Full description</span><textarea value={draft.full_description} onChange={(event) => update("full_description", event.target.value)} /></label>
              <label className="admin-field"><span>Tools/software</span><input value={draft.tools.join(", ")} onChange={(event) => update("tools", splitList(event.target.value))} placeholder="Photoshop, Illustrator" /></label>
              <label className="admin-field"><span>Deliverables</span><input value={draft.deliverables.join(", ")} onChange={(event) => update("deliverables", splitList(event.target.value))} placeholder="Identity, Posters, Social assets" /></label>
              <label className="admin-field"><span>Year</span><input type="number" min="1990" max="2100" value={draft.year ?? ""} onChange={(event) => update("year", event.target.value ? Number(event.target.value) : null)} /></label>
              <label className="admin-field"><span>Client</span><input value={draft.client ?? ""} onChange={(event) => update("client", event.target.value || null)} /></label>
              <label className="admin-field"><span>Behance URL</span><input type="url" value={draft.behance_url ?? ""} onChange={(event) => update("behance_url", event.target.value || null)} placeholder="https://behance.net/..." /></label>
              <label className="admin-field"><span>External URL</span><input type="url" value={draft.external_url ?? ""} onChange={(event) => update("external_url", event.target.value || null)} placeholder="https://..." /></label>
              <label className="admin-field wide"><span>Video URL</span><input type="url" value={draft.video_url ?? ""} onChange={(event) => update("video_url", event.target.value || null)} placeholder="Supabase Storage or external MP4 URL" /><small className="admin-help">Existing imported motion playlists are preserved automatically.</small></label>

              <section className="admin-media-block">
                <header><strong>{draft.project_type === "graphic" ? "Cartridge sticker / project cover *" : "Video poster / project cover *"}</strong><label className="admin-upload-input">Upload image<input type="file" accept="image/*" onChange={chooseCover} /></label></header>
                <p className="admin-help">{draft.project_type === "graphic" ? "This image is stored with the project and appears as its editable arcade-cartridge sticker." : "This image is stored with the project and appears as its motion poster."}</p>
                <label className="admin-field"><span>Current URL</span><input value={draft.cover_image} onChange={(event) => update("cover_image", event.target.value)} required /></label>
                {(pendingCoverPreview || draft.cover_image) && <div className="admin-media-preview" style={{ marginTop: 12 }}><div className="admin-media-item"><img src={pendingCoverPreview || draft.cover_image} alt={draft.project_type === "graphic" ? "Cartridge sticker preview" : "Cover preview"} /></div></div>}
              </section>

              <section className="admin-media-block">
                <header><strong>Gallery images</strong><label className="admin-upload-input">Add images<input type="file" accept="image/*" multiple onChange={chooseGallery} /></label></header>
                <div className="admin-media-preview">
                  {draft.gallery_images.map((image, index) => <div className="admin-media-item" key={image.src}><img src={image.src} alt={image.alt} /><button type="button" aria-label={`Remove gallery image ${index + 1}`} onClick={() => update("gallery_images", draft.gallery_images.filter((_, itemIndex) => itemIndex !== index))}>×</button></div>)}
                  {pendingGalleryPreviews.map((src, index) => <div className="admin-media-item" key={src}><img src={src} alt={`Pending gallery upload ${index + 1}`} /></div>)}
                </div>
              </section>

              <label className="admin-field"><span>Display order</span><input type="number" min="0" value={draft.display_order} onChange={(event) => update("display_order", Number(event.target.value))} /></label>
              <div className="admin-field"><span>Card colors</span><div style={{ display: "flex", gap: 8 }}><input type="color" aria-label="Accent color" value={draft.accent} onChange={(event) => update("accent", event.target.value)} /><input type="color" aria-label="Secondary color" value={draft.secondary} onChange={(event) => update("secondary", event.target.value)} /></div></div>
              <div className="admin-checks"><label><input type="checkbox" checked={draft.featured} onChange={(event) => update("featured", event.target.checked)} /> Featured</label><label><input type="checkbox" checked={draft.published} onChange={(event) => update("published", event.target.checked)} /> Published</label><label><input type="checkbox" checked={draft.longform} onChange={(event) => update("longform", event.target.checked)} /> Long scrolling artwork</label></div>
            </div>
            <div className="admin-actions">
              <p className={`admin-action-feedback ${error ? "error" : ""}`} role="status" aria-live="polite">{status}</p>
              <div className="admin-action-controls"><button className="admin-danger" type="button" onClick={removeProject} disabled={!draft.id || busy}>Delete project</button><button className="admin-secondary" type="button" onClick={createNew} disabled={busy}>Cancel</button><button className="admin-primary" type="submit" disabled={busy}>{busy ? "Saving…" : draft.published ? "Save & publish" : "Save draft"}</button></div>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}
