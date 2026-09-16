"use client";

import { useState } from "react";
import type { PortfolioProject, ProjectImage, ProjectVideo } from "../../lib/projects/types";

export function ProjectMedia({ project }: { project: PortfolioProject }) {
  const [active, setActive] = useState(0);
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
        <div className="project-route-selector" aria-label={`${project.title} media selector`}>
          {media.map((item, index) => (
            <button key={"src" in item ? item.src : index} className={active === index ? "active" : ""} type="button" onClick={() => setActive(index)}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{"title" in item ? item.title : `Artwork ${index + 1}`}</strong>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
