"use client";

import { type CSSProperties, type FormEvent, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { portfolioData as data } from "../data/portfolio";

type MusicEngine = {
  context: AudioContext;
  master: GainNode;
  timer: number;
  nextNoteTime: number;
  step: number;
  active: boolean;
};

type SelectedProject = {
  kind: "graphic" | "motion";
  title: string;
  category: string;
  description: string;
  tools: readonly string[];
  deliverables: readonly string[];
  accent: string;
  secondary: string;
  duration?: string;
  thumbnail?: string;
  poster?: string;
  longform?: boolean;
  images?: readonly { src: string; alt: string }[];
  videos?: readonly { title: string; src: string; poster: string; duration: string }[];
};

const melodyBars = [
  [76, null, 79, 83, null, 81, 79, null, 76, null, 74, 76, 79, null, 81, null],
  [83, null, 81, 79, 76, null, 74, null, 71, null, 74, 76, null, 79, 76, null],
  [76, 79, null, 83, 86, null, 83, null, 81, 79, null, 76, 74, null, 71, null],
  [79, null, 83, null, 86, 83, 81, null, 79, null, 76, 79, 81, null, 83, null],
  [88, null, 86, 83, null, 81, 79, null, 83, null, 81, 79, 76, null, 74, null],
  [76, null, null, 79, 81, null, 83, null, 86, null, 83, 81, null, 79, 76, null],
  [79, 81, 83, null, 81, 79, 76, null, 74, 76, 79, null, 76, null, null, null],
] as const;
const melodyOrder = [0, 1, 2, 0, 3, 1, 4, 0, 5, 2, 6, 3, 1, 6] as const;
const bassRoots = [40, 36, 43, 38, 40, 36, 43, 38, 40, 43, 36, 38, 43, 40] as const;
const chordProgression = [
  [52, 55, 59, 64], [48, 52, 55, 59], [55, 59, 62, 67], [50, 54, 57, 62],
  [52, 55, 59, 64], [48, 52, 55, 60], [55, 59, 62, 67], [50, 54, 57, 62],
  [52, 55, 59, 64], [55, 59, 62, 67], [48, 52, 55, 60], [50, 54, 57, 62],
  [55, 59, 62, 67], [52, 55, 59, 64],
] as const;
const loopSteps = 224;

function midiToHz(note: number) {
  return 440 * 2 ** ((note - 69) / 12);
}

function scheduleTone(context: AudioContext, destination: AudioNode, note: number, time: number, duration: number, volume: number, type: OscillatorType) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const filter = context.createBiquadFilter();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(midiToHz(note), time);
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(type === "square" ? 2400 : 950, time);
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.exponentialRampToValueAtTime(volume, time + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
  oscillator.connect(filter).connect(gain).connect(destination);
  oscillator.start(time);
  oscillator.stop(time + duration + 0.03);
}

function scheduleKick(context: AudioContext, destination: AudioNode, time: number) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(135, time);
  oscillator.frequency.exponentialRampToValueAtTime(46, time + 0.11);
  gain.gain.setValueAtTime(0.12, time);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.13);
  oscillator.connect(gain).connect(destination);
  oscillator.start(time);
  oscillator.stop(time + 0.14);
}

function scheduleHat(context: AudioContext, destination: AudioNode, time: number) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = "square";
  oscillator.frequency.setValueAtTime(3900, time);
  gain.gain.setValueAtTime(0.011, time);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.028);
  oscillator.connect(gain).connect(destination);
  oscillator.start(time);
  oscillator.stop(time + 0.03);
}

function scheduleSnare(context: AudioContext, destination: AudioNode, time: number) {
  const buffer = context.createBuffer(1, Math.floor(context.sampleRate * 0.12), context.sampleRate);
  const samples = buffer.getChannelData(0);
  for (let index = 0; index < samples.length; index += 1) samples[index] = Math.random() * 2 - 1;
  const source = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();
  source.buffer = buffer;
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(1450, time);
  gain.gain.setValueAtTime(0.018, time);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.1);
  source.connect(filter).connect(gain).connect(destination);
  source.start(time);
}

function createArcadeMusic(): MusicEngine {
  const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const context = new AudioContextClass();
  const master = context.createGain();
  const compressor = context.createDynamicsCompressor();
  master.gain.setValueAtTime(0.16, context.currentTime);
  compressor.threshold.setValueAtTime(-18, context.currentTime);
  compressor.ratio.setValueAtTime(4, context.currentTime);
  master.connect(compressor).connect(context.destination);

  const engine: MusicEngine = {
    context,
    master,
    timer: 0,
    nextNoteTime: context.currentTime + 0.05,
    step: 0,
    active: true,
  };
  // Fourteen 16-step bars at 112 BPM make one varied, seamless 30-second loop.
  const stepDuration = 60 / 112 / 4;

  const scheduler = () => {
    while (engine.active && engine.nextNoteTime < context.currentTime + 0.14) {
      const phraseStep = engine.step % loopSteps;
      const bar = Math.floor(phraseStep / 16);
      const barStep = phraseStep % 16;
      const melodyNote = melodyBars[melodyOrder[bar]][barStep];
      const chord = chordProgression[bar];
      const arpNote = chord[(barStep / 2) % chord.length];
      if (melodyNote !== null) scheduleTone(context, master, melodyNote, engine.nextNoteTime, stepDuration * 1.42, 0.027, "square");
      if (barStep % 2 === 0 && !(bar === 0 && barStep < 8)) scheduleTone(context, master, arpNote, engine.nextNoteTime, stepDuration * 1.72, 0.009, "triangle");
      if (barStep % 8 === 0) scheduleTone(context, master, bassRoots[bar], engine.nextNoteTime, stepDuration * 6.5, 0.033, "triangle");
      if (barStep === 0 || barStep === 10) scheduleKick(context, master, engine.nextNoteTime);
      if (barStep === 4 || barStep === 12) scheduleSnare(context, master, engine.nextNoteTime);
      if (barStep % 2 === 0 && bar !== 13) scheduleHat(context, master, engine.nextNoteTime);
      engine.nextNoteTime += stepDuration;
      engine.step += 1;
    }
  };

  scheduler();
  engine.timer = window.setInterval(scheduler, 50);
  void context.resume();
  return engine;
}

function ArcadeStage({
  countdown,
  ready,
  started,
  onStart,
}: {
  countdown: string;
  ready: boolean;
  started: boolean;
  onStart: () => void;
}) {
  return (
    <section className="arcade-stage" aria-label="Press start scene">
      <div className="arcade-artboard">
        <img
          className="arcade-room-art"
          src="/assets/arcade/v2/arcade-room-v2.png"
          alt="A large red arcade cabinet glowing in a dark neon game room"
        />

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
            <span className={`countdown ${countdown === "GO!" ? "go" : ""}`}>{countdown}</span>
          ) : (
            <span className="screen-display">
              <small>SYSTEM ONLINE</small>
              <strong>
                <span>PRESS</span>
                <span className="start-line"><i className="start-cursor" />START</span>
              </strong>
            </span>
          )}
        </button>
      </div>

      <p className="start-hint">CLICK THE CRT TO BEGIN</p>
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
    <main className="about-level" id="about" aria-labelledby="about-heading">
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

      <section className="about-shell">
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

function ProjectModal({ project, onClose }: { project: SelectedProject; onClose: () => void }) {
  const closeButton = useRef<HTMLButtonElement>(null);
  const [activeMedia, setActiveMedia] = useState(0);
  const selectedImage = project.images?.[activeMedia];
  const selectedVideo = project.videos?.[activeMedia];

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
      <article
        className="case-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="case-title"
        style={{ "--project-accent": project.accent, "--project-secondary": project.secondary } as CSSProperties}
      >
        <button ref={closeButton} className="case-close" type="button" onClick={onClose} aria-label="Close project case file">×</button>
        <div className={`case-preview ${project.kind} ${project.longform ? "longform" : ""}`}>
          <span className="case-status">{`${project.kind === "motion" ? "MOTION FEED" : "DESIGN FILE"} // ONLINE`}</span>
          <div className="case-preview-stage">
            {project.kind === "graphic" && selectedImage && (
              <img className="case-media-image" src={selectedImage.src} alt={selectedImage.alt} />
            )}
            {project.kind === "motion" && selectedVideo && (
              <video className="case-media-video" key={selectedVideo.src} controls playsInline preload="metadata" poster={selectedVideo.poster}>
                <source src={selectedVideo.src} type="video/mp4" />
                Your browser does not support embedded video.
              </video>
            )}
          </div>
          {project.images && project.images.length > 1 && (
            <div className="case-gallery" aria-label={`${project.title} gallery`}>
              {project.images.map((image, index) => (
                <button className={index === activeMedia ? "active" : ""} type="button" key={image.src} onClick={() => setActiveMedia(index)} aria-label={`View image ${index + 1} of ${project.images?.length}`}>
                  <img src={image.src} alt="" loading="lazy" /><span>{String(index + 1).padStart(2, "0")}</span>
                </button>
              ))}
            </div>
          )}
          {project.videos && (
            <div className="case-playlist" aria-label={`${project.title} video playlist`}>
              {project.videos.map((video, index) => (
                <button className={index === activeMedia ? "active" : ""} type="button" key={video.src} onClick={() => setActiveMedia(index)}>
                  <img src={video.poster} alt="" loading="lazy" /><span><strong>{video.title}</strong><small>{video.duration}</small></span>
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
            <div><span>TOOLS</span><strong>{project.tools.join(" + ")}</strong></div>
            {project.duration && <div><span>DURATION</span><strong>{project.duration}</strong></div>}
            <div><span>OUTPUT</span><strong>{project.deliverables.join(" / ")}</strong></div>
          </div>
          <div className="case-complete"><span>✓</span> REAL PROJECT MEDIA LOADED</div>
        </div>
      </article>
    </div>
  );
}

function AboutSection() {
  const [activeSection, setActiveSection] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<SelectedProject | null>(null);
  const [contactStatus, setContactStatus] = useState("");
  const lastProjectTrigger = useRef<HTMLButtonElement | null>(null);
  const heartCount = Math.min(5, activeSection + 1);

  const visitSection = (index: number) => {
    setActiveSection(index);
    setMobileMenuOpen(false);
  };

  const openProject = (project: SelectedProject, trigger: HTMLButtonElement) => {
    lastProjectTrigger.current = trigger;
    setSelectedProject(project);
  };

  const closeProject = () => {
    setSelectedProject(null);
    window.setTimeout(() => lastProjectTrigger.current?.focus(), 0);
  };

  useEffect(() => {
    const sectionIds = ["about", "work", "motion", "contact", "finish"];
    const syncSectionFromHash = () => {
      const index = sectionIds.indexOf(window.location.hash.slice(1));
      if (index >= 0) visitSection(index);
    };
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const index = sectionIds.indexOf(entry.target.id);
        if (index >= 0) visitSection(index);
      });
    }, { rootMargin: "-20% 0px -20% 0px", threshold: 0.01 });
    const unlockGameComplete = () => {
      const footer = document.getElementById("finish");
      if (!footer) return;
      const bounds = footer.getBoundingClientRect();
      if (bounds.top < window.innerHeight * 0.92 && bounds.bottom > 0) visitSection(4);
    };

    sectionIds.forEach((id) => {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    });
    syncSectionFromHash();
    window.addEventListener("hashchange", syncSectionFromHash);
    window.addEventListener("scroll", unlockGameComplete, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("hashchange", syncSectionFromHash);
      window.removeEventListener("scroll", unlockGameComplete);
    };
  }, []);

  const submitContact = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const projectType = String(formData.get("projectType") ?? "").trim();
    const message = String(formData.get("message") ?? "").trim();

    if (!name || !email || !projectType || !message || !/^\S+@\S+\.\S+$/.test(email)) {
      setContactStatus("CHECK INPUT // COMPLETE EVERY FIELD WITH A VALID EMAIL");
      return;
    }

    const subject = encodeURIComponent(`${projectType} project inquiry from ${name}`);
    const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\nProject type: ${projectType}\n\n${message}`);
    setContactStatus("MESSAGE READY // OPENING YOUR EMAIL APP");
    window.location.href = `mailto:${data.contactEmail}?subject=${subject}&body=${body}`;
    form.reset();
  };

  return (
    <main className="about-level" id="about" aria-labelledby="about-heading">
      <nav className="game-nav" aria-label="Portfolio sections">
        <a href="#about" className="brand" aria-label="Samer Ben Abdallah — About" onClick={() => visitSection(0)}><img className="brand-mark" src={data.brandMark} alt="" /><span className="sr-only">{data.playerLabel}</span></a>
        <div className={`nav-links ${mobileMenuOpen ? "is-open" : ""}`}>
          {data.navigation.map((item, index) => (
            <a key={item} className={index === activeSection ? "active" : ""} href={`#${item.toLowerCase()}`} onClick={() => visitSection(index)}>{item}</a>
          ))}
        </div>
        <button className="mobile-nav-toggle" type="button" aria-expanded={mobileMenuOpen} onClick={() => setMobileMenuOpen((current) => !current)}>
          <i /><i /><i /><span className="sr-only">Toggle section navigation</span>
        </button>
        <div className="lives" aria-label={`${heartCount} of 5 hearts unlocked`}>
          {Array.from({ length: 5 }, (_, index) => {
            const filled = index < heartCount;
            return <span key={`${index}-${filled}`} className={`heart ${filled ? "filled" : "empty"}`} aria-hidden="true">{filled ? "♥" : "♡"}</span>;
          })}
        </div>
      </nav>

      <section className="about-shell">
        <div className="level-kicker"><span>LEVEL 01</span><i /><small>PLAYER PROFILE</small></div>
        <div className="about-grid">
          <figure className="profile-panel"><img src={data.profileImage} alt="Pixel-art portrait of Samer Ben Abdallah" /><figcaption>SAMER BEN ABDALLAH // GRAPHIC &amp; MOTION DESIGNER</figcaption></figure>
          <div className="about-copy">
            <div className="about-title-row"><img src={data.brandMark} alt="" /><div><p>CHARACTER SELECTED</p><h1 id="about-heading"><strong>SAMER BEN ABDALLAH</strong></h1></div></div>
            <p className="bio">{data.about}</p>
            <div className="stats" aria-label="Portfolio statistics">{data.stats.map((stat) => <div className="stat" key={stat.label}><img src={stat.icon} alt="" /><div><strong>{stat.value}</strong><small>{stat.label}</small></div></div>)}</div>
            <div className="inventory"><div className="section-label"><span>SKILLS &amp; TOOLS</span><i /></div><div className="skill-list">{data.skills.map((skill) => <div className="skill" key={skill.name} title={skill.name}><img src={skill.icon} alt="" /><small>{skill.name}</small></div>)}</div></div>
            <a className="work-button" href="#work" onClick={() => visitSection(1)}>VIEW MY WORK <span>▶</span></a>
          </div>
        </div>
      </section>

      <section className="portfolio-level work-level" id="work" aria-labelledby="work-heading">
        <div className="level-shell">
          <div className="level-kicker"><span>LEVEL 02</span><i /><small>DESIGN ARCHIVE</small></div>
          <header className="level-heading"><p>SELECT A CASE FILE</p><h2 id="work-heading"><span>GRAPHIC</span> DESIGN</h2><p className="level-intro">Identity systems, campaigns, and visual tools built to make ideas recognizable at every size.</p></header>
          <div className="project-grid">
            {data.graphicProjects.map((project, index) => (
              <article className={`project-card card-${(index % 3) + 1}`} key={project.title} style={{ "--project-accent": project.accent, "--project-secondary": project.secondary } as CSSProperties}>
                <div className="project-art" aria-hidden="true"><span className="project-number">0{index + 1}</span><img className="project-thumbnail" src={project.thumbnail} alt="" loading="lazy" /><strong>{project.category}</strong></div>
                <div className="project-copy"><p>{project.category}</p><h3>{project.title}</h3><span>{project.description}</span><div className="project-tools">{project.tools.map((tool) => <small key={tool}>{tool}</small>)}</div><button type="button" onClick={(event) => openProject(project, event.currentTarget)}>VIEW PROJECT <b>↗</b></button></div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="portfolio-level motion-level" id="motion" aria-labelledby="motion-heading">
        <div className="level-shell">
          <div className="level-kicker"><span>LEVEL 03</span><i /><small>MOTION LAB</small></div>
          <header className="level-heading"><p>PRESS PLAY</p><h2 id="motion-heading"><span>MOTION</span> DESIGN</h2><p className="level-intro">Motion systems where timing, type, sound, and transitions turn static ideas into memorable stories.</p></header>
          <div className="motion-grid">
            {data.motionProjects.map((project) => (
              <article className={`motion-card ${project.featured ? "featured" : ""}`} key={project.title} style={{ "--project-accent": project.accent, "--project-secondary": project.secondary } as CSSProperties}>
                <div className="motion-screen" aria-hidden="true"><span className="rec-light">● REC</span><span className="timecode">{project.duration}</span><img className="motion-poster" src={project.poster} alt="" loading="lazy" /><strong>{project.featured ? "FEATURED" : `${project.videos.length} PROJECTS`}</strong></div>
                <div className="motion-copy"><p>{project.category}</p><h3>{project.title}</h3><span>{project.description}</span><div className="project-tools">{project.tools.map((tool) => <small key={tool}>{tool}</small>)}</div><button type="button" onClick={(event) => openProject(project, event.currentTarget)}>WATCH PROJECT <b>▶</b></button></div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="portfolio-level contact-level" id="contact" aria-labelledby="contact-heading">
        <div className="level-shell">
          <div className="level-kicker"><span>LEVEL 04</span><i /><small>PLAYER TWO WANTED</small></div>
          <header className="level-heading"><p>NEW MISSION AVAILABLE</p><h2 id="contact-heading"><span>LET&apos;S CREATE</span> SOMETHING</h2><p className="level-intro">Have a brand, campaign, or motion idea in mind? Send the mission brief and let&apos;s build the next level together.</p></header>
          <div className="contact-grid">
            <aside className="contact-brief"><div className="contact-avatar"><img src={data.brandMark} alt="" /><i /></div><p>PLAYER 01 STATUS</p><h3>AVAILABLE FOR SELECT FREELANCE PROJECTS</h3><a href={`mailto:${data.contactEmail}`}>{data.contactEmail}</a><ul><li><span>01</span> Brand identity &amp; campaigns</li><li><span>02</span> Motion graphics &amp; editing</li><li><span>03</span> Social content systems</li></ul><div className="response-time"><small>TYPICAL RESPONSE</small><strong>WITHIN 1–2 DAYS</strong></div></aside>
            <form className="contact-form" onSubmit={submitContact} noValidate>
              <div className="form-row"><label><span>PLAYER NAME</span><input name="name" type="text" autoComplete="name" placeholder="Your name" /></label><label><span>EMAIL ADDRESS</span><input name="email" type="email" autoComplete="email" placeholder="you@example.com" /></label></div>
              <label><span>MISSION TYPE</span><select name="projectType" defaultValue=""><option value="" disabled>Select a project type</option><option>Graphic Design</option><option>Motion Design</option><option>Brand Identity</option><option>Social Campaign</option><option>Something Else</option></select></label>
              <label><span>MISSION BRIEF</span><textarea name="message" rows={6} placeholder="Tell me what you want to create..." /></label>
              <button className="send-button" type="submit">SEND MESSAGE <span>▶</span></button>
              <p className={`form-status ${contactStatus ? "is-visible" : ""}`} role="status">{contactStatus || "READY // WAITING FOR INPUT"}</p>
            </form>
          </div>
        </div>
      </section>

      <footer className="game-footer" id="finish"><div><strong>THANKS FOR PLAYING</strong><span>INSERT COIN TO CONTINUE</span><small>© {new Date().getFullYear()} SAMER BEN ABDALLAH</small></div></footer>
      <button className="back-to-top" type="button" onClick={() => document.getElementById("about")?.scrollIntoView({ behavior: "smooth" })} aria-label="Back to top">
        <span aria-hidden="true">↑</span><small>TOP</small>
      </button>
      {selectedProject && <ProjectModal project={selectedProject} onClose={closeProject} />}
    </main>
  );
}

export function ArcadePortfolio() {
  const root = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [started, setStarted] = useState(false);
  const [countdown, setCountdown] = useState("");
  const [soundOn, setSoundOn] = useState(true);
  const musicRef = useRef<MusicEngine | null>(null);

  const startMusic = () => {
    if (musicRef.current?.active) {
      void musicRef.current.context.resume();
      return musicRef.current.context;
    }
    const engine = createArcadeMusic();
    musicRef.current = engine;
    return engine.context;
  };

  const stopMusic = () => {
    const engine = musicRef.current;
    if (!engine) return;
    engine.active = false;
    window.clearInterval(engine.timer);
    engine.master.gain.cancelScheduledValues(engine.context.currentTime);
    engine.master.gain.setTargetAtTime(0.0001, engine.context.currentTime, 0.035);
    window.setTimeout(() => void engine.context.close(), 220);
    musicRef.current = null;
  };

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.body.style.overflow = "hidden";

    const ctx = gsap.context(() => {
      gsap.set(".arcade-stage", { autoAlpha: 0 });
      gsap.set(".arcade-artboard", { y: reduced ? 15 : "105vh", scale: reduced ? 1 : 0.9 });
      gsap.set(".intro-role, .title-art, .intro-prompt", { autoAlpha: 0 });
      gsap.set(".about-level", { autoAlpha: 0, display: "none" });

      gsap.timeline({ defaults: { ease: "power3.out" } })
        .fromTo(".title-art", { scale: 0.82, filter: "blur(10px) brightness(1.7)" }, { autoAlpha: 1, scale: 1, filter: "blur(0px) brightness(1)", duration: reduced ? 0.18 : 0.72 }, 0.28)
        .to(".intro-role", { autoAlpha: 1, duration: reduced ? 0.1 : 0.34 }, 0.72)
        .to(".intro-prompt", { autoAlpha: 1, duration: 0.25 }, 0.92)
        .to({}, { duration: reduced ? 0.15 : 1.15 })
        .to(".intro-content", { y: reduced ? -12 : -80, autoAlpha: 0, duration: reduced ? 0.2 : 0.62, ease: "power3.in" })
        .to(".intro-screen", { autoAlpha: 0, duration: reduced ? 0.15 : 0.35 }, "<0.18")
        .set(".intro-screen", { display: "none" })
        .to(".arcade-stage", { autoAlpha: 1, duration: 0.18 })
        .to(".arcade-artboard", { y: 0, scale: 1, duration: reduced ? 0.3 : 1.05, ease: reduced ? "power2.out" : "back.out(1.25)" }, "<")
        .fromTo(".machine-screen", { filter: "brightness(2.6)", autoAlpha: 0 }, { filter: "brightness(1)", autoAlpha: 1, duration: 0.4 }, "-=0.2")
        .fromTo(".start-hint, .sound-toggle", { y: 12, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.28, onComplete: () => setReady(true) }, "-=0.1");
    }, root);

    return () => {
      ctx.revert();
      const engine = musicRef.current;
      if (engine) {
        engine.active = false;
        window.clearInterval(engine.timer);
        void engine.context.close();
        musicRef.current = null;
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

  const startGame = () => {
    if (!ready || started) return;
    setStarted(true);
    if (soundOn) playConfirm(startMusic());
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    gsap.timeline()
      .to(".machine-screen", { scale: 0.985, duration: 0.08 })
      .to(".machine-screen", { scale: 1, duration: 0.1 })
      .call(() => setCountdown("READY?"))
      .call(() => setCountdown("3"), [], "+=0.65")
      .call(() => setCountdown("2"), [], "+=0.65")
      .call(() => setCountdown("1"), [], "+=0.65")
      .call(() => setCountdown("GO!"), [], "+=0.65")
      .to(".arcade-stage", { scale: reduced ? 1 : 1.08, autoAlpha: 0, duration: reduced ? 0.25 : 0.58, ease: "power3.in" }, "+=0.52")
      .set(".arcade-stage", { display: "none" })
      .set(".about-level", { display: "block" })
      .fromTo(".about-level", { autoAlpha: 0 }, { autoAlpha: 1, duration: reduced ? 0.2 : 0.5 })
      .fromTo(".about-grid > *", { y: reduced ? 8 : 38, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.12, duration: reduced ? 0.2 : 0.65, ease: "power3.out", onComplete: () => { document.body.style.overflow = "auto"; window.scrollTo(0, 0); } }, "<0.06");
  };

  const toggleMusic = () => {
    if (soundOn) {
      stopMusic();
      setSoundOn(false);
    } else {
      setSoundOn(true);
      startMusic();
    }
  };

  return (
    <div className="portfolio-root" ref={root}>
      <section className="intro-screen" aria-label="Portfolio intro">
        <img className="intro-background" src="/assets/arcade/v2/hero-scene-v2.png" alt="" />
        <div className="intro-content">
          <h1 className="sr-only">{data.title}</h1>
          <img className="title-art" src="/assets/arcade/v2/portfolio-title-v2.png" alt="PORTFOLIO" />
          <p className="intro-role">{data.role}</p>
          <p className="intro-prompt">LOADING ARCADE EXPERIENCE...</p>
        </div>
      </section>

      <ArcadeStage
        countdown={countdown}
        ready={ready}
        started={started}
        onStart={startGame}
      />

      <AboutSection />

      <button className={`music-toggle ${soundOn ? "is-on" : ""}`} onClick={toggleMusic} aria-pressed={soundOn}>
        <span className="music-bars" aria-hidden="true"><i /><i /><i /><i /></span>
        <span><small>ARCADE RUN</small><strong>MUSIC {soundOn ? "ON" : "OFF"}</strong></span>
      </button>
    </div>
  );
}
