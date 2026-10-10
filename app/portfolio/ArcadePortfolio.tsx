"use client";

import { type CSSProperties, type FormEvent, type WheelEvent, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import type { ArcadeProject } from "../lib/projects/types";
import { ProjectToolIcons } from "../lib/projects/ProjectToolIcons";
import type { SiteSettings } from "../lib/settings/types";

type UiSfx = "click" | "exit";

const defaultArcadeImage = "/assets/arcade/v2/arcade-room-v2.png";

function optimizedLocalAsset(src: string) {
  if (src === "/assets/arcade/v3/samer-profile.png") return "/assets/arcade/v3/samer-profile.webp";
  if (src === "/assets/arcade/v3/samer-mark-transparent.png") return "/assets/arcade/v3/samer-mark-transparent.webp";
  return src;
}

function displayTitle(value: string) {
  return value.split(/(I)/g).map((part, index) => part === "I" ? <span className="readable-title-i" key={`i-${index}`}>I</span> : part);
}

function playArcadeSfx(context: AudioContext, kind: UiSfx, siteVolume: number) {
  const now = context.currentTime;
  const master = context.createGain();
  const filter = context.createBiquadFilter();
  const volume = Math.min(0.085, Math.max(0.025, siteVolume * 0.16));
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(kind === "click" ? 2600 : 1800, now);
  master.gain.setValueAtTime(volume, now);
  master.gain.exponentialRampToValueAtTime(0.0001, now + (kind === "click" ? 0.09 : 0.18));
  master.connect(filter).connect(context.destination);

  const primary = context.createOscillator();
  primary.type = "square";
  primary.frequency.setValueAtTime(kind === "click" ? 920 : 560, now);
  primary.frequency.exponentialRampToValueAtTime(kind === "click" ? 660 : 210, now + (kind === "click" ? 0.075 : 0.16));
  primary.connect(master);
  primary.start(now);
  primary.stop(now + (kind === "click" ? 0.1 : 0.19));

  if (kind === "exit") {
    const echo = context.createOscillator();
    const echoGain = context.createGain();
    echo.type = "triangle";
    echo.frequency.setValueAtTime(280, now + 0.045);
    echo.frequency.exponentialRampToValueAtTime(130, now + 0.18);
    echoGain.gain.setValueAtTime(volume * 0.7, now + 0.045);
    echoGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.19);
    echo.connect(echoGain).connect(filter);
    echo.start(now + 0.045);
    echo.stop(now + 0.2);
  }
}

function midiToHz(note: number) {
  return 440 * 2 ** ((note - 69) / 12);
}

function startIntroJingle(context: AudioContext, siteVolume: number) {
  const now = context.currentTime;
  const master = context.createGain();
  const compressor = context.createDynamicsCompressor();
  const notes = [64, 67, 71, 76, 71, 79, 76, 83, 79, 76, 71, 74, 76, 79, 83, 88, 83, 79, 76, 71, 74, 79, 76, 83];
  const level = Math.min(.16, Math.max(.065, siteVolume * .34));
  master.gain.setValueAtTime(.0001, now);
  master.gain.exponentialRampToValueAtTime(level, now + .08);
  compressor.threshold.setValueAtTime(-18, now);
  compressor.ratio.setValueAtTime(4, now);
  master.connect(compressor).connect(context.destination);

  notes.forEach((note, index) => {
    const start = now + index * .17;
    const oscillator = context.createOscillator();
    const filter = context.createBiquadFilter();
    const envelope = context.createGain();
    oscillator.type = index % 4 === 3 ? "triangle" : "square";
    oscillator.frequency.setValueAtTime(midiToHz(note), start);
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(2200, start);
    envelope.gain.setValueAtTime(.0001, start);
    envelope.gain.exponentialRampToValueAtTime(index % 4 === 0 ? .23 : .15, start + .015);
    envelope.gain.exponentialRampToValueAtTime(.0001, start + .145);
    oscillator.connect(filter).connect(envelope).connect(master);
    oscillator.start(start);
    oscillator.stop(start + .16);

    if (index % 4 === 0) {
      const bass = context.createOscillator();
      const bassGain = context.createGain();
      bass.type = "triangle";
      bass.frequency.setValueAtTime(midiToHz(note - 24), start);
      bassGain.gain.setValueAtTime(.18, start);
      bassGain.gain.exponentialRampToValueAtTime(.0001, start + .55);
      bass.connect(bassGain).connect(master);
      bass.start(start);
      bass.stop(start + .58);
    }
  });

  return master;
}

function playWhooshSfx(context: AudioContext, siteVolume: number) {
  const now = context.currentTime;
  const duration = 1.05;
  const volume = Math.min(.12, Math.max(.045, siteVolume * .25));
  const output = context.createGain();
  output.gain.setValueAtTime(.0001, now);
  output.gain.linearRampToValueAtTime(volume, now + .12);
  output.gain.linearRampToValueAtTime(volume * .72, now + .4);
  output.gain.exponentialRampToValueAtTime(.0001, now + duration);
  output.connect(context.destination);

  const oscillator = context.createOscillator();
  const oscillatorGain = context.createGain();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(135, now);
  oscillator.frequency.exponentialRampToValueAtTime(220, now + .24);
  oscillator.frequency.exponentialRampToValueAtTime(62, now + duration);
  oscillatorGain.gain.setValueAtTime(.0001, now);
  oscillatorGain.gain.linearRampToValueAtTime(.19, now + .14);
  oscillatorGain.gain.exponentialRampToValueAtTime(.0001, now + duration);
  oscillator.connect(oscillatorGain).connect(output);
  oscillator.start(now);
  oscillator.stop(now + duration);

  const buffer = context.createBuffer(1, Math.floor(context.sampleRate * duration), context.sampleRate);
  const channel = buffer.getChannelData(0);
  for (let index = 0; index < channel.length; index += 1) {
    const progress = index / channel.length;
    const envelope = Math.sin(Math.PI * progress) ** 1.7;
    channel[index] = (Math.random() * 2 - 1) * envelope;
  }
  const noise = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const noiseGain = context.createGain();
  noise.buffer = buffer;
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(420, now);
  filter.frequency.exponentialRampToValueAtTime(2800, now + .32);
  filter.frequency.exponentialRampToValueAtTime(240, now + duration);
  filter.Q.setValueAtTime(.35, now);
  noiseGain.gain.setValueAtTime(.0001, now);
  noiseGain.gain.linearRampToValueAtTime(.62, now + .18);
  noiseGain.gain.exponentialRampToValueAtTime(.0001, now + duration);
  noise.connect(filter).connect(noiseGain).connect(output);
  noise.start(now);
}

function ArcadeStage({
  countdown,
  ready,
  started,
  onStart,
  settings,
}: {
  countdown: string;
  ready: boolean;
  started: boolean;
  onStart: () => void;
  settings: SiteSettings["homepage"];
}) {
  return (
    <section className="arcade-stage" aria-label="Press start scene">
      <div className="arcade-artboard">
        <picture>
          <source media="(max-width: 720px)" type="image/webp" srcSet="/assets/arcade/v2/arcade-room-v2-mobile.webp" />
          <source media="(max-width: 720px)" srcSet="/assets/arcade/v2/arcade-room-v2-mobile.png" />
          {settings.arcadeImage === defaultArcadeImage && <source type="image/webp" srcSet="/assets/arcade/v2/arcade-room-v2.webp" />}
          <img
            className="arcade-room-art"
            src={settings.arcadeImage}
            alt={settings.arcadeImageAlt}
            fetchPriority="high"
            decoding="async"
            draggable={false}
          />
        </picture>

        <div className="removed-marquee" aria-hidden="true" hidden>
          <span>▦</span>
          <span>▦</span>
        </div>

        <button
          className={`machine-screen ${ready && !started ? "is-ready" : ""}`}
          onClick={onStart}
          disabled={!ready || started}
          aria-label="Press start to enter the portfolio"
        >
          <span className="screen-scanlines" aria-hidden="true" />
          {countdown ? (
            <span className={`countdown ${countdown === "GO" ? "go" : ""}`}>{countdown}</span>
          ) : (
            <span className="screen-display">
              <span className="screen-score" aria-hidden="true">
                <i>1UP</i>
                <i>HIGH SCORE</i>
                <i>{settings.screenPlayerLabel}</i>
              </span>
              <span className="screen-pac-dots" aria-hidden="true">
                {Array.from({ length: 9 }, (_, index) => <i key={index} />)}
              </span>
              <small>{settings.systemLabel}</small>
              <strong>
                <span>{settings.pressText}</span>
                <span className="start-line"><i className="start-cursor" />{settings.startText}</span>
              </strong>
              <em>{settings.screenCta}</em>
            </span>
          )}
        </button>
      </div>

      <p className="start-hint"><span aria-hidden="true">●</span> {settings.startHint}</p>
    </section>
  );
}

/* Legacy AboutSection markup retained in version history.
  const [activeSection, setActiveSection] = useState(0);
  const [highestSection, setHighestSection] = useState(0);
  const heartCount = Math.min(5, highestSection + 1);

  const visitSection = (index: number) => {
    setActiveSection(index);
    setHighestSection((current) => Math.max(current, index));
  };

  useEffect(() => {
    const syncSectionFromHash = () => {
      const hash = window.location.hash.slice(1);
      const index = data.navigation.findIndex((item) => item.toLowerCase() === hash);
      if (index >= 0) visitSection(index);
    };

    syncSectionFromHash();
    window.addEventListener("hashchange", syncSectionFromHash);
    return () => window.removeEventListener("hashchange", syncSectionFromHash);
  }, []);

  return (
    <main className="about-level" aria-labelledby="about-heading">
      <nav className="game-nav" aria-label="Portfolio sections">
        <a href="#about" className="brand" aria-label="Samer Ben Abdallah — About"><img className="brand-mark" src={data.brandMark} alt="" /><span className="sr-only">{data.playerLabel}</span></a>
        <div className="nav-links">
          {data.navigation.map((item, index) => (
            <a
              key={item}
              className={index === activeSection ? "active" : ""}
              href={`#${item.toLowerCase()}`}
              onClick={() => visitSection(index)}
            >
              {item}
            </a>
          ))}
        </div>
        <div className="lives" aria-label={`${heartCount} of 5 hearts unlocked`}>
          {Array.from({ length: 5 }, (_, index) => {
            const filled = index < heartCount;
            return (
              <span
                key={`${index}-${filled}`}
                className={`heart ${filled ? "filled" : "empty"}`}
                aria-hidden="true"
              >
                {filled ? "♥" : "♡"}
              </span>
            );
          })}
        </div>
      </nav>

      <section className="about-shell" id="about">
        <div className="level-kicker"><span>LEVEL 01</span><i /><small>PLAYER PROFILE</small></div>

        <div className="about-grid">
          <figure className="profile-panel">
            <img src={data.profileImage} alt="Pixel-art portrait of Samer Ben Abdallah" />
            <figcaption>SAMER BEN ABDALLAH // GRAPHIC &amp; MOTION DESIGNER</figcaption>
          </figure>

          <div className="about-copy">
            <div className="about-title-row">
              <img src={data.brandMark} alt="" />
              <div>
                <p>CHARACTER SELECTED</p>
                <h1 id="about-heading"><strong>SAMER BEN ABDALLAH</strong></h1>
              </div>
            </div>
            <p className="bio">{data.about}</p>

            <div className="stats" aria-label="Portfolio statistics">
              {data.stats.map((stat) => (
                <div className="stat" key={stat.label}>
                  <img src={stat.icon} alt="" />
                  <div><strong>{stat.value}</strong><small>{stat.label}</small></div>
                </div>
              ))}
            </div>

            <div className="inventory">
              <div className="section-label"><span>SKILLS &amp; TOOLS</span><i /></div>
              <div className="skill-list">
                {data.skills.map((skill) => (
                  <div className="skill" key={skill.name} title={skill.name}>
                    <img src={skill.icon} alt="" /><small>{skill.name}</small>
                  </div>
                ))}
              </div>
            </div>

            <a className="work-button" href="#work" onClick={() => visitSection(1)}>VIEW MY WORK <span>▶</span></a>
          </div>
        </div>
      </section>

      <section className="future-levels" aria-label="Future portfolio levels">
        <div id="work"><span>LEVEL 02</span><strong>SELECTED WORK</strong></div>
        <div id="motion"><span>LEVEL 03</span><strong>MOTION LAB</strong></div>
        <div id="contact"><span>LEVEL 04</span><strong>CONTACT</strong></div>
      </section>
    </main>
  );
*/

function ProjectModal({ project, onClose }: { project: ArcadeProject; onClose: () => void }) {
  const closeButton = useRef<HTMLButtonElement>(null);
  const galleryRail = useRef<HTMLDivElement>(null);
  const wheelNavigationAt = useRef(0);
  const [activeMedia, setActiveMedia] = useState(0);
  const selectedImage = project.images?.[activeMedia];
  const selectedVideo = project.videos?.[activeMedia];
  const imageCount = project.images?.length ?? 0;
  const mediaCount = project.kind === "motion" ? project.videos?.length ?? 0 : imageCount;

  const showMedia = (index: number) => {
    if (!mediaCount) return;
    const next = (index + mediaCount) % mediaCount;
    setActiveMedia(next);
    window.requestAnimationFrame(() => galleryRail.current?.querySelector<HTMLButtonElement>(`button[data-index="${next}"]`)?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" }));
  };

  const scrollPreview = (event: WheelEvent<HTMLDivElement>) => {
    if (Math.abs(event.deltaY) < 8 && Math.abs(event.deltaX) < 8) return;
    event.preventDefault();
    event.stopPropagation();
    const now = Date.now();
    if (now - wheelNavigationAt.current < 380) return;
    wheelNavigationAt.current = now;
    showMedia(activeMedia + (event.deltaY + event.deltaX > 0 ? 1 : -1));
  };

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButton.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return (
    <div className="case-overlay">
      <button className="case-backdrop" type="button" onClick={onClose} tabIndex={-1} aria-hidden="true" />
      <article
        className="case-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="case-title"
        style={{ "--project-accent": project.accent, "--project-secondary": project.secondary } as CSSProperties}
      >
        <button ref={closeButton} className="case-close" type="button" onClick={onClose} aria-label="Close project case file"><span aria-hidden="true">×</span></button>
        <div className={`case-preview ${project.kind} ${project.longform ? "longform" : ""}`}>
          <span className="case-status">{`${project.kind === "motion" ? "MOTION FEED" : "DESIGN FILE"} // ONLINE`}</span>
          <div
            className={`case-preview-stage ${!project.longform && mediaCount > 1 ? "wheel-browse" : ""}`}
            onWheel={!project.longform && mediaCount > 1 ? scrollPreview : undefined}
          >
            {project.kind === "graphic" && selectedImage && (
              <img className="case-media-image" src={selectedImage.src} alt={selectedImage.alt} decoding="async" />
            )}
            {project.kind === "motion" && selectedVideo && (
              // The portfolio media may be visual-only and no caption file is stored for legacy clips.
              // eslint-disable-next-line jsx-a11y/media-has-caption
              <video className="case-media-video" key={selectedVideo.src} controls playsInline preload="metadata" poster={selectedVideo.poster}>
                <source src={selectedVideo.src} type="video/mp4" />
                Your browser does not support embedded video.
              </video>
            )}
          </div>
          {project.images && project.images.length > 1 && (
            <div className="case-gallery-shell">
              <div className="case-gallery-nav">
                <button className="case-gallery-arrow" type="button" onClick={() => showMedia(activeMedia - 1)} aria-label="Previous project image">‹</button>
                <div className="case-gallery" ref={galleryRail} onWheel={scrollPreview} aria-label={`${project.title} scrollable gallery`}>
                  {project.images.map((image, index) => (
                    <button data-index={index} className={index === activeMedia ? "active" : ""} type="button" key={image.src} onClick={() => showMedia(index)} aria-label={`View image ${index + 1} of ${project.images?.length}`}>
                      <img src={image.src} alt="" loading="lazy" decoding="async" /><span>{String(index + 1).padStart(2, "0")}</span>
                    </button>
                  ))}
                </div>
                <button className="case-gallery-arrow" type="button" onClick={() => showMedia(activeMedia + 1)} aria-label="Next project image">›</button>
              </div>
              <div className="case-gallery-meta"><strong>{String(activeMedia + 1).padStart(2, "0")} / {String(project.images.length).padStart(2, "0")}</strong><span>SCROLL · DRAG · CLICK TO EXPLORE</span></div>
            </div>
          )}
          {project.videos && (
            <div className="case-playlist" aria-label={`${project.title} video playlist`}>
              {project.videos.map((video, index) => (
                <button className={index === activeMedia ? "active" : ""} type="button" key={video.src} onClick={() => showMedia(index)}>
                  <img src={video.poster} alt="" loading="lazy" decoding="async" /><span><strong>{video.title}</strong><small>{video.duration}</small></span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="case-details">
          <p className="case-eyebrow">CASE FILE // {project.category}</p>
          <h2 id="case-title">{project.title}</h2>
          <p>{project.description}</p>
          <div className="case-data-grid">
            <div><span>TOOLS</span><ProjectToolIcons tools={project.tools} /></div>
            <div><span>OUTPUT</span><strong>{project.deliverables.join(" / ")}</strong></div>
          </div>
          <a className="case-page-link" href={`/projects/${project.slug}`}>OPEN FULL CASE FILE <span>↗</span></a>
          <div className="case-complete"><span>✓</span> REAL PROJECT MEDIA LOADED</div>
        </div>
      </article>
    </div>
  );
}

function MotionLivePreview({ src, poster }: { src: string; poster?: string }) {
  const previewRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const preview = previewRef.current;
    if (!preview) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) void preview.play().catch(() => undefined);
      else preview.pause();
    }, { rootMargin: "120px 0px", threshold: 0.12 });

    observer.observe(preview);
    return () => {
      observer.disconnect();
      preview.pause();
    };
  }, [src]);

  return <video ref={previewRef} className="motion-poster motion-live-preview" src={src} poster={poster} muted loop playsInline preload="none" onMouseEnter={(event) => void event.currentTarget.play().catch(() => undefined)} />;
}

function AboutSection({ projects, settings }: { projects: ArcadeProject[]; settings: SiteSettings }) {
  const data = {
    playerLabel: settings.profile.name,
    role: settings.profile.role,
    about: settings.profile.about,
    profileImage: optimizedLocalAsset(settings.profile.profileImage),
    brandMark: optimizedLocalAsset(settings.profile.brandMark),
    stats: settings.profile.stats,
    skills: settings.profile.skills,
    contactEmail: settings.contact.email,
    navigation: settings.sections.navigation,
  };
  const [activeSection, setActiveSection] = useState(0);
  const [heartLevel, setHeartLevel] = useState(0);
  const [breakingHeart, setBreakingHeart] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ArcadeProject | null>(null);
  const [contactStatus, setContactStatus] = useState("");
  const [contactBusy, setContactBusy] = useState(false);
  const contactOpenedAt = useRef(0);
  const lastProjectTrigger = useRef<HTMLElement | null>(null);
  const activeSectionRef = useRef(0);
  const heartLevelRef = useRef(0);
  const heartTargetRef = useRef(0);
  const heartAnimationActive = useRef(false);
  const heartBreakTimer = useRef<number | null>(null);
  const heartCount = Math.min(4, heartLevel + 1);
  const graphicProjects = projects.filter((project) => project.kind === "graphic");
  const motionProjects = projects.filter((project) => project.kind === "motion");

  function animateHeartLevel() {
    const current = heartLevelRef.current;
    const target = heartTargetRef.current;

    if (current === target) {
      heartAnimationActive.current = false;
      heartBreakTimer.current = null;
      setBreakingHeart(null);
      return;
    }

    heartAnimationActive.current = true;
    if (current < target) {
      const next = current + 1;
      heartLevelRef.current = next;
      setHeartLevel(next);
      setBreakingHeart(null);
      heartBreakTimer.current = window.setTimeout(animateHeartLevel, 760);
      return;
    }

    setBreakingHeart(current);
    heartBreakTimer.current = window.setTimeout(() => {
      const next = Math.max(0, heartLevelRef.current - 1);
      heartLevelRef.current = next;
      setHeartLevel(next);
      setBreakingHeart(null);
      heartBreakTimer.current = window.setTimeout(animateHeartLevel, 120);
    }, 820);
  }

  const queueHeartLevel = (target: number) => {
    heartTargetRef.current = Math.min(3, target);
    if (!heartAnimationActive.current) animateHeartLevel();
  };

  const visitSection = (index: number) => {
    if (index !== activeSectionRef.current) {
      activeSectionRef.current = index;
      setActiveSection(index);
      queueHeartLevel(index);
    }
    setMobileMenuOpen(false);
  };

  const openProject = (project: ArcadeProject, trigger: HTMLElement) => {
    lastProjectTrigger.current = trigger;
    setSelectedProject(project);
  };

  const closeProject = () => {
    setSelectedProject(null);
    window.setTimeout(() => lastProjectTrigger.current?.focus(), 0);
  };

  useEffect(() => {
    contactOpenedAt.current = Date.now();
    const sectionIds = ["about", "work", "motion", "contact", "finish"];
    let scrollFrame = 0;
    const syncSectionFromHash = () => {
      const index = sectionIds.indexOf(window.location.hash.slice(1));
      if (index >= 0) visitSection(index);
    };
    const syncSectionFromScroll = () => {
      if (scrollFrame) return;
      scrollFrame = window.requestAnimationFrame(() => {
        scrollFrame = 0;
        const anchor = window.innerHeight * 0.38;
        let nextSection = 0;
        sectionIds.forEach((id, index) => {
          const section = document.getElementById(id);
          if (section && section.getBoundingClientRect().top <= anchor) nextSection = index;
        });
        if (window.scrollY <= 8) nextSection = 0;
        visitSection(nextSection);
      });
    };

    syncSectionFromHash();
    syncSectionFromScroll();
    window.addEventListener("hashchange", syncSectionFromHash);
    window.addEventListener("scroll", syncSectionFromScroll, { passive: true });
    window.addEventListener("resize", syncSectionFromScroll);
    return () => {
      if (scrollFrame) window.cancelAnimationFrame(scrollFrame);
      if (heartBreakTimer.current !== null) window.clearTimeout(heartBreakTimer.current);
      window.removeEventListener("hashchange", syncSectionFromHash);
      window.removeEventListener("scroll", syncSectionFromScroll);
      window.removeEventListener("resize", syncSectionFromScroll);
    };
  }, []);

  const submitContact = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const projectType = String(formData.get("projectType") ?? "").trim();
    const message = String(formData.get("message") ?? "").trim();
    const companyWebsite = String(formData.get("companyWebsite") ?? "").trim();

    if (!name || !email || !projectType || !message || !/^\S+@\S+\.\S+$/.test(email)) {
      setContactStatus("CHECK INPUT // COMPLETE EVERY FIELD WITH A VALID EMAIL");
      return;
    }

    setContactBusy(true);
    setContactStatus("TRANSMITTING // SENDING YOUR MISSION BRIEF");
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, email, projectType, message, companyWebsite, openedAt: contactOpenedAt.current }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "The message could not be sent.");
      setContactStatus("MESSAGE RECEIVED // THANK YOU, I WILL REPLY SOON");
      form.reset();
      contactOpenedAt.current = Date.now();
    } catch (error) {
      setContactStatus(`TRANSMISSION FAILED // ${error instanceof Error ? error.message : "PLEASE TRY AGAIN"}`);
    } finally {
      setContactBusy(false);
    }
  };

  return (
    <main className="about-level" aria-labelledby="about-heading">
      <nav className="game-nav" aria-label="Portfolio sections">
        <a href="#about" className="brand" aria-label="Samer Ben Abdallah — About" onClick={() => visitSection(0)}><img className="brand-mark" src={data.brandMark} alt="" /><span className="sr-only">{data.playerLabel}</span></a>
        <div className={`nav-links ${mobileMenuOpen ? "is-open" : ""}`}>
          {data.navigation.map((item, index) => (
            <a key={`${index}-${item}`} className={index === activeSection ? "active" : ""} href={`#${["about", "work", "motion", "contact"][index]}`} onClick={() => visitSection(index)}>{item}</a>
          ))}
        </div>
        <button className="mobile-nav-toggle" type="button" aria-expanded={mobileMenuOpen} onClick={() => setMobileMenuOpen((current) => !current)}>
          <i /><i /><i /><span className="sr-only">Toggle section navigation</span>
        </button>
        <div className="lives" aria-label={`${heartCount} of 4 hearts unlocked`}>
          {Array.from({ length: 4 }, (_, index) => {
            const filled = index < heartCount;
            const breaking = breakingHeart === index;
            return (
              <span key={`${index}-${filled}-${breaking}`} className={`heart ${breaking ? "breaking" : filled ? "filled" : "empty"}`} aria-hidden="true">
                {filled || breaking ? "♥" : "♡"}
                {breaking && <span className="heart-shards"><i /><i /><i /><i /></span>}
              </span>
            );
          })}
        </div>
      </nav>

      <section className="about-shell" id="about">
        <div className="level-kicker"><span>{settings.sections.profileLevelLabel}</span><i /><small>{settings.sections.profileArchiveLabel}</small></div>
        <div className="about-grid">
          <figure className="profile-panel"><img src={data.profileImage} alt={`Pixel-art portrait of ${data.playerLabel}`} decoding="async" /><figcaption>{settings.profile.profileCaption}</figcaption></figure>
          <div className="about-copy">
            <div className="about-title-row"><img src={data.brandMark} alt="" decoding="async" /><div><p>{settings.profile.selectedLabel}</p><h1 id="about-heading"><strong>{data.playerLabel}</strong></h1></div></div>
            <p className="bio">{data.about}</p>
            <div className="stats" aria-label="Portfolio statistics">{data.stats.map((stat) => <div className="stat" key={stat.label}><img src={stat.icon} alt="" /><div><strong>{stat.value}</strong><small>{stat.label}</small></div></div>)}</div>
            <div className="inventory"><div className="section-label"><span>SKILLS &amp; TOOLS</span><i /></div><div className="skill-list">{data.skills.map((skill) => <div className="skill" key={skill.name} title={skill.name}><img src={skill.icon} alt="" /><small>{skill.name}</small></div>)}</div></div>
            <a className="work-button" href="#work" onClick={() => visitSection(1)}>{settings.profile.workButtonLabel} <span>▶</span></a>
          </div>
        </div>
      </section>

      <section className="portfolio-level work-level" id="work" aria-labelledby="work-heading">
        <div className="level-shell">
          <div className="level-kicker"><span>{settings.sections.graphicLevelLabel}</span><i /><small>{settings.sections.graphicArchiveLabel}</small></div>
          <header className="level-heading"><p>{settings.sections.graphicEyebrow}</p><h2 id="work-heading"><span>{displayTitle(settings.sections.graphicHeadingAccent)}</span> {displayTitle(settings.sections.graphicHeadingRest)}</h2><p className="level-intro">{settings.sections.graphicIntro}</p></header>
          <div className="library-status" aria-label={`${graphicProjects.length} graphic design projects`}><span>GAME LIBRARY</span><i /><strong>{String(graphicProjects.length).padStart(2, "0")} CASE FILES</strong></div>
          <div className="project-grid">
            {graphicProjects.map((project, index) => (
              <div className={`project-card card-${(index % 3) + 1} ${index === 0 ? "featured-project" : ""}`} key={project.id} style={{ "--project-accent": project.accent, "--project-secondary": project.secondary } as CSSProperties} role="button" tabIndex={0} aria-label={`View ${project.title} project`} onClick={(event) => openProject(project, event.currentTarget)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openProject(project, event.currentTarget); } }}>
                <span className="cartridge-vents" aria-hidden="true" />
                <div className="project-art" aria-hidden="true"><span className="project-number">0{index + 1}</span><img className="project-thumbnail" src={project.thumbnail} alt="" loading="lazy" /><strong>{project.category}</strong></div>
                <div className="project-copy"><p>{project.category}</p><h3>{project.title}</h3><span>{project.description}</span><div className="project-tools"><ProjectToolIcons tools={project.tools} /></div></div>
                <span className="cartridge-contacts" aria-hidden="true" />
              </div>
            ))}
            {!graphicProjects.length && <p className="arcade-empty-state">NO GRAPHIC CASE FILES PUBLISHED // CHECK BACK SOON</p>}
          </div>
        </div>
      </section>

      <section className="portfolio-level motion-level" id="motion" aria-labelledby="motion-heading">
        <div className="level-shell">
          <div className="level-kicker"><span>{settings.sections.motionLevelLabel}</span><i /><small>{settings.sections.motionArchiveLabel}</small></div>
          <header className="level-heading"><p>{settings.sections.motionEyebrow}</p><h2 id="motion-heading"><span>{displayTitle(settings.sections.motionHeadingAccent)}</span> {displayTitle(settings.sections.motionHeadingRest)}</h2><p className="level-intro">{settings.sections.motionIntro}</p></header>
          <div className="library-status motion-library-status" aria-label={`${motionProjects.length} motion design projects`}><span>NOW PLAYING</span><i /><strong>{String(motionProjects.length).padStart(2, "0")} MOTION FILES</strong></div>
          <div className="motion-grid">
            {motionProjects.map((project, index) => (
              <div className={`motion-card ${project.featured || index === 0 ? "featured" : ""}`} key={project.id} style={{ "--project-accent": project.accent, "--project-secondary": project.secondary } as CSSProperties} role="button" tabIndex={0} aria-label={`Watch ${project.title} project`} onClick={(event) => openProject(project, event.currentTarget)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openProject(project, event.currentTarget); } }}>
                <span className="cartridge-vents" aria-hidden="true" />
                <div className="motion-screen" aria-hidden="true"><span className="rec-light">● LIVE</span><span className="timecode">{project.duration}</span>{project.videos?.[0]?.src ? <MotionLivePreview src={project.videos[0].src} poster={project.videos[0].poster || project.poster} /> : <img className="motion-poster" src={project.poster} alt="" loading="lazy" />}<strong>{project.featured || index === 0 ? "FEATURED" : `${project.videos?.length ?? 0} PROJECTS`}</strong><div className="motion-transport"><span>▶</span><i /><small>{String(index + 1).padStart(2, "0")}</small></div></div>
                <div className="motion-copy"><p>{project.category}</p><h3>{project.title}</h3><span>{project.description}</span><div className="project-tools"><ProjectToolIcons tools={project.tools} /></div></div>
                <span className="cartridge-contacts" aria-hidden="true" />
              </div>
            ))}
            {!motionProjects.length && <p className="arcade-empty-state">NO MOTION CASE FILES PUBLISHED // CHECK BACK SOON</p>}
          </div>
        </div>
      </section>

      <section className="portfolio-level contact-level" id="contact" aria-labelledby="contact-heading">
        <div className="level-shell">
          <div className="level-kicker"><span>{settings.sections.contactLevelLabel}</span><i /><small>{settings.sections.contactArchiveLabel}</small></div>
          <header className="level-heading"><p>{settings.sections.contactEyebrow}</p><h2 id="contact-heading"><span>{displayTitle(settings.sections.contactHeadingAccent)}</span> {displayTitle(settings.sections.contactHeadingRest)}</h2><p className="level-intro">{settings.sections.contactIntro}</p></header>
          <div className="contact-grid">
            <aside className="contact-brief"><span className="contact-sticker" aria-hidden="true">CO-OP<br />READY!</span><div className="contact-avatar"><img src={data.brandMark} alt="" /><i /></div><p>{settings.contact.statusLabel}</p><h3>{settings.contact.availabilityHeading}</h3><span className="contact-email">{data.contactEmail}</span><ul>{settings.contact.services.map((service, index) => <li key={service}><span>{String(index + 1).padStart(2, "0")}</span> {service}</li>)}</ul><div className="response-time"><small>{settings.contact.responseLabel}</small><strong>{settings.contact.responseValue}</strong></div></aside>
            <form className="contact-form" onSubmit={submitContact} noValidate>
              <label className="contact-honeypot" aria-hidden="true"><span>WEBSITE</span><input name="companyWebsite" type="text" tabIndex={-1} autoComplete="off" /></label>
              <div className="form-row"><label><span>PLAYER NAME</span><input name="name" type="text" autoComplete="name" placeholder="Your name" /></label><label><span>EMAIL ADDRESS</span><input name="email" type="email" autoComplete="email" placeholder="you@example.com" /></label></div>
              <label><span>MISSION TYPE</span><select name="projectType" defaultValue=""><option value="" disabled>Select a project type</option><option>Graphic Design</option><option>Motion Design</option><option>Brand Identity</option><option>Social Campaign</option><option>Something Else</option></select></label>
              <label><span>MISSION BRIEF</span><textarea name="message" rows={6} placeholder="Tell me what you want to create..." /></label>
              <button className="send-button" type="submit" disabled={contactBusy}>{contactBusy ? "SENDING..." : settings.contact.sendButtonLabel} <span>▶</span></button>
              <p className={`form-status ${contactStatus ? "is-visible" : ""}`} role="status">{contactStatus || "READY // WAITING FOR INPUT"}</p>
            </form>
          </div>
        </div>
      </section>

      <footer className="game-footer" id="finish"><div><strong>{displayTitle(settings.footer.heading)}</strong><span>{settings.footer.subheading}</span><small>© {new Date().getFullYear()} {settings.footer.copyright}</small></div></footer>
      <button className="back-to-top" type="button" onClick={() => { visitSection(0); window.history.replaceState(null, "", "#about"); document.getElementById("about")?.scrollIntoView({ behavior: "smooth" }); }} aria-label="Back to top">
        <span aria-hidden="true">↑</span>
      </button>
      {selectedProject && <ProjectModal project={selectedProject} onClose={closeProject} />}
    </main>
  );
}

export function ArcadePortfolio({ projects, settings }: { projects: ArcadeProject[]; settings: SiteSettings }) {
  const root = useRef<HTMLDivElement>(null);
  const cursor = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [started, setStarted] = useState(false);
  const [countdown, setCountdown] = useState("");
  const [sfxOn, setSfxOn] = useState(false);
  const confirmContextRef = useRef<AudioContext | null>(null);
  const introMusicGainRef = useRef<GainNode | null>(null);
  const introTrackRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const cursorElement = cursor.current;
    const finePointer = window.matchMedia("(pointer: fine)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!cursorElement || !finePointer.matches || reducedMotion.matches) return;

    const moveCursor = (event: PointerEvent) => {
      const cursorWidth = 36;
      const cursorHeight = 40;
      const x = Math.min(window.innerWidth - cursorWidth, Math.max(0, event.clientX - 3));
      const y = Math.min(window.innerHeight - cursorHeight, Math.max(0, event.clientY - 3));
      cursorElement.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      cursorElement.classList.add("is-visible");
      const target = event.target;
      cursorElement.classList.toggle(
        "is-targeting",
        target instanceof Element && Boolean(target.closest("a, button, input, textarea, select, [role='button']")),
      );
    };
    const pressCursor = () => cursorElement.classList.add("is-clicking");
    const releaseCursor = () => cursorElement.classList.remove("is-clicking");
    const hideCursor = () => cursorElement.classList.remove("is-visible", "is-targeting", "is-clicking");

    window.addEventListener("pointermove", moveCursor, { passive: true });
    window.addEventListener("pointerdown", pressCursor);
    window.addEventListener("pointerup", releaseCursor);
    document.documentElement.addEventListener("mouseleave", hideCursor);

    return () => {
      window.removeEventListener("pointermove", moveCursor);
      window.removeEventListener("pointerdown", pressCursor);
      window.removeEventListener("pointerup", releaseCursor);
      document.documentElement.removeEventListener("mouseleave", hideCursor);
    };
  }, []);

  useEffect(() => {
    if (!sfxOn) return;

    const playSfx = (kind: UiSfx) => {
      const audio = confirmContextRef.current;
      if (!audio || audio.state === "closed") return;
      void audio.resume();
      playArcadeSfx(audio, kind, settings.audio.volume);
    };
    const handleUiClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const interactive = target.closest("a, button, select, [role='button']");
      if (!interactive || interactive.matches(".machine-screen, .audio-control")) return;
      playSfx(interactive.matches(".case-close, .back-to-top, [data-sfx='exit']") ? "exit" : "click");
    };
    const handleUiKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && document.querySelector(".case-overlay")) playSfx("exit");
    };

    document.addEventListener("click", handleUiClick, true);
    window.addEventListener("keydown", handleUiKey, true);
    return () => {
      document.removeEventListener("click", handleUiClick, true);
      window.removeEventListener("keydown", handleUiKey, true);
    };
  }, [settings.audio.volume, sfxOn]);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.body.style.overflow = "hidden";

    const ctx = gsap.context(() => {
      gsap.set(".arcade-artboard", {
        y: reduced ? 15 : "105vh",
        scale: reduced ? 1 : 0.9,
        filter: reduced ? "blur(0px)" : "blur(18px)",
      });
      gsap.set(".arcade-stage", { autoAlpha: 1 });
      gsap.set(".about-level", { autoAlpha: 0, display: "none" });

      gsap.timeline({ defaults: { ease: "power3.out" } })
        .to(".arcade-artboard", { y: 0, scale: 1, filter: "blur(0px)", duration: reduced ? 0.3 : 1.05, ease: reduced ? "power2.out" : "back.out(1.25)" }, reduced ? 0 : 0.12)
        .fromTo(".machine-screen", { filter: "brightness(2.6)", autoAlpha: 0 }, { filter: "brightness(1)", autoAlpha: 1, duration: 0.4 }, "-=0.2")
        .fromTo(".start-hint, .audio-controls", { y: 12, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.28, onComplete: () => setReady(true) }, "-=0.1");
    }, root);

    return () => {
      ctx.revert();
      const audio = confirmContextRef.current;
      if (introTrackRef.current) {
        introTrackRef.current.pause();
        introTrackRef.current = null;
      }
      if (introMusicGainRef.current && audio && audio.state !== "closed") {
        introMusicGainRef.current.gain.cancelScheduledValues(audio.currentTime);
        introMusicGainRef.current.gain.setValueAtTime(.0001, audio.currentTime);
        introMusicGainRef.current = null;
      }
      if (audio) {
        void audio.close();
        confirmContextRef.current = null;
      }
      document.body.style.overflow = "";
    };
  }, []);

  const playConfirm = (audio: AudioContext) => {
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = "square";
    oscillator.frequency.setValueAtTime(220, audio.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(760, audio.currentTime + 0.13);
    gain.gain.setValueAtTime(0.05, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.16);
    oscillator.connect(gain).connect(audio.destination);
    oscillator.start();
    oscillator.stop(audio.currentTime + 0.16);
  };

  const startIntroAudio = (audio: AudioContext) => {
    if (settings.audio.audioUrl) {
      const track = new Audio(settings.audio.audioUrl);
      track.preload = "auto";
      track.loop = false;
      track.volume = settings.audio.volume;
      introTrackRef.current = track;
      void track.play().catch(() => {
        introTrackRef.current = null;
        introMusicGainRef.current = startIntroJingle(audio, settings.audio.volume);
      });
      return;
    }

    introMusicGainRef.current = startIntroJingle(audio, settings.audio.volume);
  };

  const fadeOutIntroAudio = () => {
    const track = introTrackRef.current;
    if (track) {
      gsap.killTweensOf(track);
      gsap.to(track, {
        volume: 0,
        duration: .62,
        ease: "power2.in",
        onComplete: () => {
          track.pause();
          track.currentTime = 0;
          if (introTrackRef.current === track) introTrackRef.current = null;
        },
      });
    }

    const audio = confirmContextRef.current;
    const gain = introMusicGainRef.current;
    if (audio && gain && audio.state !== "closed") {
      const now = audio.currentTime;
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(Math.max(.0001, gain.gain.value), now);
      gain.gain.exponentialRampToValueAtTime(.0001, now + .62);
      introMusicGainRef.current = null;
    }
  };

  const startGame = () => {
    if (!ready || started) return;
    setStarted(true);
    if (settings.audio.enabled) {
      const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audio = confirmContextRef.current ?? new AudioContextClass();
      confirmContextRef.current = audio;
      void audio.resume();
      setSfxOn(true);
      playConfirm(audio);
      startIntroAudio(audio);
    }
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    gsap.timeline()
      .to(".machine-screen", { scale: 0.985, duration: 0.08 })
      .to(".machine-screen", { scale: 1, duration: 0.1 })
      .call(() => setCountdown("READY?"))
      .call(() => setCountdown("3"), [], "+=0.65")
      .call(() => setCountdown("2"), [], "+=0.65")
      .call(() => setCountdown("1"), [], "+=0.65")
      .call(() => {
        setCountdown("GO");
        fadeOutIntroAudio();
        const audio = confirmContextRef.current;
        if (audio && audio.state !== "closed") playWhooshSfx(audio, settings.audio.volume);
      }, [], "+=0.65")
      .to(".arcade-stage", { scale: reduced ? 1 : 1.08, autoAlpha: 0, duration: reduced ? 0.25 : 0.58, ease: "power3.in" }, "+=0.52")
      .set(".arcade-stage", { display: "none" })
      .set(".about-level", { display: "block" })
      .fromTo(".about-level", { autoAlpha: 0 }, { autoAlpha: 1, duration: reduced ? 0.2 : 0.5 })
      .fromTo(".about-grid > *", { y: reduced ? 8 : 38, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.12, duration: reduced ? 0.2 : 0.65, ease: "power3.out", onComplete: () => { document.body.style.overflow = "auto"; window.scrollTo(0, 0); } }, "<0.06");
  };

  const toggleSfx = () => {
    const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const audio = confirmContextRef.current ?? new AudioContextClass();
    if (!confirmContextRef.current) confirmContextRef.current = audio;
    void audio.resume();
    playArcadeSfx(audio, sfxOn ? "exit" : "click", settings.audio.volume);
    setSfxOn((current) => !current);
  };

  return (
    <div className="portfolio-root" ref={root} style={{ "--ink": settings.theme.ink, "--blue": settings.theme.blue, "--cyan": settings.theme.cyan, "--pink": settings.theme.pink, "--yellow": settings.theme.yellow, "--shell-yellow": settings.theme.shellYellow, "--shell-pink": settings.theme.shellPink, "--shell-blue": settings.theme.shellBlue } as CSSProperties}>
      <div className="arcade-cursor" ref={cursor} aria-hidden="true">
        <span className="arcade-cursor-ping" />
        <img className="arcade-pointer" src="/assets/arcade/icons/pixel-arrow-cursor-bw.png" alt="" />
      </div>
      <ArcadeStage
        countdown={countdown}
        ready={ready}
        started={started}
        onStart={startGame}
        settings={settings.homepage}
      />

      <AboutSection projects={projects} settings={settings} />

      {settings.audio.enabled && <div className="audio-controls" aria-label="Website audio controls">
        <button className={`audio-control sfx-toggle ${sfxOn ? "is-on" : ""}`} onClick={toggleSfx} aria-pressed={sfxOn} aria-label={`Interface sound effects ${sfxOn ? "on" : "off"}`} title={`Sound effects ${sfxOn ? "on" : "off"}`}>
          <span className="sfx-icon" aria-hidden="true">✦</span>
        </button>
      </div>}
    </div>
  );
}
