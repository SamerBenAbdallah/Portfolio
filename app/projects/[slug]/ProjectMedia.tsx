"use client";

import { type WheelEvent, useRef, useState } from "react";
import type { PortfolioProject, ProjectImage, ProjectVideo } from "../../lib/projects/types";

export function ProjectMedia({ project }: { project: PortfolioProject }) {
  const [active, setActive] = useState(0);
  const selectorRef = useRef<HTMLDivElement>(null);
  const wheelNavigationAt = useRef(0);
  const images: ProjectImage[] = project.gallery_images.length
    ? project.gallery_images
    : project.cover_image
      ? [{ src: project.cover_image, alt: `${project.title} cover` }]
      : [];
  const videos: ProjectVideo[] = project.video_items.length
    ? project.video_items
    : project.video_url
      ? [{ title: project.title, src: project.video_url, poster: project.cover_image, duration: "VIDEO" }]
      : [];
  const media = project.project_type === "motion" ? videos : images;
  const selectedImage = project.project_type === "graphic" ? images[active] : null;
  const selectedVideo = project.project_type === "motion" ? videos[active] : null;

  function showMedia(index: number) {
    const next = (index + media.length) % media.length;
    setActive(next);
    window.requestAnimationFrame(() => selectorRef.current?.querySelector<HTMLButtonElement>(`button[data-index="${next}"]`)?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" }));
  }

  function scrollMedia(event: WheelEvent<HTMLDivElement>) {
    if (Math.abs(event.deltaY) < 8 && Math.abs(event.deltaX) < 8) return;
    event.preventDefault();
    const now = Date.now();
    if (now - wheelNavigationAt.current < 380) return;
    wheelNavigationAt.current = now;
    showMedia(active + (event.deltaY + event.deltaX > 0 ? 1 : -1));
  }

  if (!media.length) {
    return <div className="project-route-empty">MEDIA OFFLINE // CHECK BACK SOON</div>;
  }

  return (
    <div className="project-route-media">
      <div className={`project-route-stage ${project.longform ? "longform" : ""}`}>
        {selectedImage && <img key={selectedImage.src} src={selectedImage.src} alt={selectedImage.alt} />}
        {selectedVideo && (
          // The CMS accepts legacy visual-only motion clips without a caption sidecar.
          // eslint-disable-next-line jsx-a11y/media-has-caption
          <video key={selectedVideo.src} controls playsInline preload="metadata" poster={selectedVideo.poster}>
            <source src={selectedVideo.src} type="video/mp4" />
            Your browser does not support embedded video.
          </video>
        )}
      </div>
      {media.length > 1 && (
        <div className="project-route-gallery">
          <div className="project-route-selector-wrap">
            <button className="project-route-arrow" type="button" onClick={() => showMedia(active - 1)} aria-label="Previous project media">‹</button>
            <div className="project-route-selector" ref={selectorRef} onWheel={scrollMedia} aria-label={`${project.title} scrollable media selector`}>
              {media.map((item, index) => (
                <button data-index={index} key={item.src} className={active === index ? "active" : ""} type="button" onClick={() => showMedia(index)}>
                  <img src={"title" in item ? item.poster : item.src} alt="" loading="lazy" />
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <strong>{"title" in item ? item.title : `Artwork ${index + 1}`}</strong>
                </button>
              ))}
            </div>
            <button className="project-route-arrow" type="button" onClick={() => showMedia(active + 1)} aria-label="Next project media">›</button>
          </div>
          <div className="project-route-gallery-meta"><strong>{String(active + 1).padStart(2, "0")} / {String(media.length).padStart(2, "0")}</strong><span>SCROLL · DRAG · CLICK TO EXPLORE</span></div>
        </div>
      )}
    </div>
  );
}
