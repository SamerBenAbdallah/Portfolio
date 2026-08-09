"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { portfolioData as data } from "../data/portfolio";

function ArcadeStage({
  countdown,
  ready,
  started,
  soundOn,
  onStart,
  onSound,
}: {
  countdown: string;
  ready: boolean;
  started: boolean;
  soundOn: boolean;
  onStart: () => void;
  onSound: () => void;
}) {
  return (
    <section className="arcade-stage" aria-label="Press start scene">
      <div className="arcade-artboard">
        <img
          className="arcade-room-art"
          src="/assets/arcade/v2/arcade-room-v2.png"
          alt="A large red arcade cabinet glowing in a dark neon game room"
        />

        <div className="arcade-marquee" aria-hidden="true">
          <span>▦</span>
          <strong>PORTFOLIO</strong>
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
              <small>PLAYER 01 // READY</small>
              <strong>PRESS<br />START</strong>
              <span className="screen-choice"><i /> START</span>
              <span className="screen-option">OPTIONS</span>
            </span>
          )}
        </button>
      </div>

      <button className="sound-toggle" onClick={onSound} aria-pressed={soundOn}>
        <span aria-hidden="true">{soundOn ? "♫" : "♪"}</span> SOUND {soundOn ? "ON" : "OFF"}
      </button>
      <p className="start-hint">CLICK THE CRT TO BEGIN</p>
    </section>
  );
}

function AboutSection() {
  const portrait = data.profileImage || "/assets/arcade/v2/player-avatar-v2.png";

  return (
    <main className="about-level" id="about" aria-labelledby="about-heading">
      <nav className="game-nav" aria-label="Portfolio sections">
        <a href="#about" className="brand"><span className="brand-invader">▦</span>{data.playerLabel}</a>
        <div className="nav-links">
          {data.navigation.map((item, index) => (
            <a key={item} className={index === 0 ? "active" : ""} href={`#${item.toLowerCase()}`}>{item}</a>
          ))}
        </div>
        <div className="lives" aria-label="Three lives remaining">♥ ♥ ♥ <span>♡</span></div>
      </nav>

      <section className="about-shell">
        <div className="level-kicker"><span>LEVEL 01</span><i /><small>PLAYER PROFILE</small></div>

        <div className="about-grid">
          <figure className="profile-panel">
            <img src={portrait} alt={data.profileImage ? "Portrait of Player 01" : "Fictional Player 01 arcade avatar"} />
            <figcaption>{data.profileImage ? "PLAYER 01" : "PLACEHOLDER AVATAR // ADD YOUR PORTRAIT"}</figcaption>
          </figure>

          <div className="about-copy">
            <div className="about-title-row">
              <img src="/assets/arcade/icons/invader.png" alt="" />
              <div>
                <p>CHARACTER SELECTED</p>
                <h1 id="about-heading"><span>ABOUT</span> PLAYER 01</h1>
              </div>
            </div>
            <div className="health" aria-label="Four out of five energy points">♥ ♥ ♥ ♥ <span>♡</span></div>
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
                    <span className={skill.color}>{skill.short}</span><small>{skill.name}</small>
                  </div>
                ))}
              </div>
            </div>

            <a className="work-button" href="#work">VIEW MY WORK <span>▶</span></a>
          </div>
        </div>
      </section>

      <section className="future-levels" aria-label="Future portfolio levels">
        <div id="work"><span>LEVEL 02</span><strong>SELECTED WORK</strong><small>COMING NEXT</small></div>
        <div id="motion"><span>LEVEL 03</span><strong>MOTION LAB</strong><small>COMING NEXT</small></div>
        <div id="contact"><span>LEVEL 04</span><strong>CONTACT</strong><small>COMING NEXT</small></div>
      </section>
    </main>
  );
}

export function ArcadePortfolio() {
  const root = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [started, setStarted] = useState(false);
  const [countdown, setCountdown] = useState("");
  const [soundOn, setSoundOn] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.body.style.overflow = "hidden";

    const ctx = gsap.context(() => {
      gsap.set(".arcade-stage", { autoAlpha: 0 });
      gsap.set(".arcade-artboard", { y: reduced ? 15 : "105vh", scale: reduced ? 1 : 0.9 });
      gsap.set(".intro-player, .intro-role, .title-art, .intro-prompt", { autoAlpha: 0 });
      gsap.set(".about-level", { autoAlpha: 0, display: "none" });

      gsap.timeline({ defaults: { ease: "power3.out" } })
        .to(".intro-player", { autoAlpha: 1, y: 0, duration: reduced ? 0.1 : 0.35 }, 0.15)
        .fromTo(".title-art", { scale: 0.82, filter: "blur(10px) brightness(1.7)" }, { autoAlpha: 1, scale: 1, filter: "blur(0px) brightness(1)", duration: reduced ? 0.18 : 0.72 }, 0.28)
        .to(".intro-role", { autoAlpha: 1, duration: reduced ? 0.1 : 0.34 }, 0.72)
        .to(".intro-prompt", { autoAlpha: 1, duration: 0.25 }, 0.92)
        .to({}, { duration: reduced ? 0.15 : 1.15 })
        .to(".intro-content", { y: reduced ? -12 : -80, autoAlpha: 0, duration: reduced ? 0.2 : 0.62, ease: "power3.in" })
        .to(".intro-screen", { autoAlpha: 0, duration: reduced ? 0.15 : 0.35 }, "<0.18")
        .set(".intro-screen", { display: "none" })
        .to(".arcade-stage", { autoAlpha: 1, duration: 0.18 })
        .to(".arcade-artboard", { y: 0, scale: 1, duration: reduced ? 0.3 : 1.05, ease: reduced ? "power2.out" : "back.out(1.25)" }, "<")
        .fromTo(".arcade-marquee, .machine-screen", { filter: "brightness(2.6)", autoAlpha: 0 }, { filter: "brightness(1)", autoAlpha: 1, duration: 0.4 }, "-=0.2")
        .fromTo(".start-hint, .sound-toggle", { y: 12, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.28, onComplete: () => setReady(true) }, "-=0.1");
    }, root);

    return () => {
      ctx.revert();
      document.body.style.overflow = "";
    };
  }, []);

  const playConfirm = () => {
    if (!soundOn) return;
    const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const audio = new AudioContextClass();
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
    playConfirm();
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    gsap.timeline()
      .to(".machine-screen", { scale: 0.985, duration: 0.08 })
      .to(".machine-screen", { scale: 1, duration: 0.1 })
      .call(() => setCountdown("PLAYER 01\nREADY?"))
      .call(() => setCountdown("3"), [], "+=0.28")
      .call(() => setCountdown("2"), [], "+=0.18")
      .call(() => setCountdown("1"), [], "+=0.18")
      .call(() => setCountdown("GO!"), [], "+=0.18")
      .to(".arcade-stage", { scale: reduced ? 1 : 1.08, autoAlpha: 0, duration: reduced ? 0.25 : 0.58, ease: "power3.in" }, "+=0.18")
      .set(".arcade-stage", { display: "none" })
      .set(".about-level", { display: "block" })
      .fromTo(".about-level", { autoAlpha: 0 }, { autoAlpha: 1, duration: reduced ? 0.2 : 0.5 })
      .fromTo(".about-grid > *", { y: reduced ? 8 : 38, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.12, duration: reduced ? 0.2 : 0.65, ease: "power3.out", onComplete: () => { document.body.style.overflow = "auto"; window.scrollTo(0, 0); } }, "<0.06");
  };

  return (
    <div className="portfolio-root" ref={root}>
      <section className="intro-screen" aria-label="Portfolio intro">
        <img className="intro-background" src="/assets/arcade/v2/hero-scene-v2.png" alt="" />
        <div className="intro-content">
          <p className="intro-player"><span />{data.playerLabel}<span /></p>
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
        soundOn={soundOn}
        onStart={startGame}
        onSound={() => setSoundOn((value) => !value)}
      />

      <AboutSection />
    </div>
  );
}
