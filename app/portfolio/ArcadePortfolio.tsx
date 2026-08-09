"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { portfolioData as data } from "../data/portfolio";

const decor = [
  ["HEART", "d-heart"], ["CROWN", "d-crown"], ["STAR", "d-star"], ["BOLT", "d-bolt"],
  ["COIN", "d-coin"], ["+", "d-plus"], ["GHOST", "d-wave"], ["INVADER", "d-club"],
] as const;

function ArcadeMachine({ countdown }: { countdown: string }) {
  return (
    <div className="cabinet" aria-label="Red illustrated arcade cabinet">
      <div className="cabinet-side cabinet-side-left" />
      <div className="marquee"><span className="marquee-invader">◆</span> PORTFOLIO <span className="marquee-invader">◆</span></div>
      <div className="cabinet-face">
        <div className="screen-bezel">
          <div className="crt-screen">
            <div className="crt-flash" />
            <div className="scanlines" />
            <div className="crt-content">
              {countdown ? (
                <div className={`countdown ${countdown === "GO!" ? "go" : ""}`}>{countdown}</div>
              ) : (
                <>
                  <div className="press-copy"><strong>PRESS<br />START</strong></div>
                  <div className="screen-menu"><span className="active">▶ START</span><span>OPTIONS</span></div>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="control-deck">
          <div className="joystick"><i /><b /></div>
          <div className="arcade-buttons"><i className="btn-yellow" /><i className="btn-blue" /><i className="btn-green" /><i className="btn-pink" /></div>
        </div>
        <div className="lower-panel">
          <div className="speaker">••••<br />••••</div>
          <div className="coin-slot"><i /><span>INSERT<br />COIN</span></div>
          <div className="player-sticker">P1</div>
        </div>
      </div>
      <div className="cabinet-feet"><i /><i /></div>
    </div>
  );
}

function AboutSection() {
  return (
    <main className="about-level" id="about" aria-labelledby="about-heading">
      <nav className="game-nav" aria-label="Portfolio sections">
        <a href="#about" className="brand"><span className="nav-dot" />{data.playerLabel}</a>
        <div className="nav-links">
          {data.navigation.map((item, index) => (
            <a key={item} className={index === 0 ? "active" : ""} href={`#${item.toLowerCase()}`}>{item}</a>
          ))}
        </div>
        <div className="lives" aria-label="Three lives remaining">♥ ♥ ♥ <span>♡</span></div>
      </nav>

      <section className="about-shell">
        <div className="level-kicker"><span>LEVEL 01</span><i /></div>
        <div className="about-grid">
          <div className="profile-wrap">
            <div className="profile-number">01</div>
            <div className="profile-frame">
              {data.profileImage ? (
                <img src={data.profileImage} alt="Pixel-art portrait of Player 01" />
              ) : (
                <div className="portrait-placeholder" role="img" aria-label="Portrait image placeholder">
                  <div className="portrait-pixels"><i /><i /><i /><i /><i /><i /><i /><i /><i /></div>
                  <strong>YOUR PIXEL<br />PORTRAIT</strong>
                  <small>READY TO DROP IN</small>
                </div>
              )}
            </div>
            <div className="profile-corners"><i /><i /><i /><i /></div>
          </div>

          <div className="about-copy">
            <p className="eyebrow">// PLAYER PROFILE</p>
            <h1 id="about-heading"><span>ABOUT</span> PLAYER 01</h1>
            <p className="bio">{data.about}</p>

            <div className="stats" aria-label="Portfolio statistics">
              {data.stats.map((stat) => (
                <div className="stat" key={stat.label}>
                  <span>{stat.icon}</span><div><small>{stat.label}</small><strong>{stat.value}</strong></div>
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

            <a className="pixel-button work-button" href="#work">VIEW MY WORK <span>▶</span></a>
          </div>
        </div>
      </section>

      <section className="future-levels" aria-label="Future portfolio levels">
        <div id="work"><span>LEVEL 02</span><strong>WORK</strong><small>COMING NEXT</small></div>
        <div id="motion"><span>LEVEL 03</span><strong>MOTION</strong><small>COMING NEXT</small></div>
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
      gsap.set(".cabinet", { y: reduced ? 20 : "105vh", scale: reduced ? 0.98 : 0.78 });
      gsap.set(".intro-player, .intro-role, .pixel-title, .intro-decor", { autoAlpha: 0 });
      gsap.set(".start-wrap", { autoAlpha: 0, y: 18 });
      gsap.set(".crt-content, .scanlines", { autoAlpha: 0 });
      gsap.set(".crt-flash", { scaleX: 0, autoAlpha: 0 });
      gsap.set(".about-level", { autoAlpha: 0, display: "none" });

      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.to(".intro-player", { autoAlpha: 1, y: 0, duration: reduced ? 0.1 : 0.38 }, 0.15)
        .fromTo(".pixel-title", { scale: 0.88, filter: "blur(8px)" }, { autoAlpha: 1, scale: 1, filter: "blur(0px)", duration: reduced ? 0.15 : 0.55 }, 0.28)
        .to(".intro-role", { autoAlpha: 1, duration: reduced ? 0.1 : 0.35 }, 0.68)
        .to(".intro-decor", { autoAlpha: 1, stagger: reduced ? 0 : 0.045, duration: 0.2 }, 0.75)
        .fromTo(".title-pixel", { autoAlpha: 0, scale: 0 }, { autoAlpha: 1, scale: 1, stagger: 0.018, duration: 0.18 }, 0.75)
        .to({}, { duration: reduced ? 0.2 : 1.05 })
        .to(".intro-player, .intro-role, .intro-decor", { y: reduced ? -10 : -90, autoAlpha: 0, stagger: 0.025, duration: reduced ? 0.18 : 0.62 }, ">")
        .to(".pixel-title", { y: reduced ? -15 : -150, autoAlpha: 0, filter: reduced ? "blur(0px)" : "blur(5px)", clipPath: "inset(0 0 100% 0)", duration: reduced ? 0.2 : 0.82 }, "<0.04")
        .to(".title-pixel", { x: () => gsap.utils.random(-110, 110), y: () => gsap.utils.random(-180, -40), rotation: () => gsap.utils.random(-180, 180), autoAlpha: 0, stagger: 0.008, duration: reduced ? 0.1 : 0.65 }, "<")
        .set(".intro-screen", { display: "none" })
        .to(".arcade-stage", { autoAlpha: 1, duration: 0.12 }, "<")
        .to(".cabinet", { y: 0, scale: 0.97, duration: reduced ? 0.25 : 1.06, ease: reduced ? "power2.out" : "back.out(1.35)" }, "<")
        .to(".cabinet", { scale: 1, duration: reduced ? 0.1 : 0.34, ease: "power2.out" })
        .to(".crt-flash", { autoAlpha: 1, scaleX: 1, duration: reduced ? 0.1 : 0.18, ease: "power4.out" })
        .to(".crt-flash", { scaleY: 38, backgroundColor: "#1d61ff", opacity: 0.4, duration: reduced ? 0.1 : 0.28 })
        .to(".crt-flash", { autoAlpha: 0, duration: 0.12 })
        .to(".crt-content, .scanlines", { autoAlpha: 1, duration: 0.22 })
        .to(".start-wrap", { autoAlpha: 1, y: 0, duration: 0.34, onComplete: () => setReady(true) });
    }, root);
    return () => { ctx.revert(); document.body.style.overflow = ""; };
  }, []);

  const playConfirm = () => {
    if (!soundOn) return;
    const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const audio = new AudioContextClass();
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = "square";
    oscillator.frequency.setValueAtTime(240, audio.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(620, audio.currentTime + 0.11);
    gain.gain.setValueAtTime(0.055, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.14);
    oscillator.connect(gain).connect(audio.destination);
    oscillator.start(); oscillator.stop(audio.currentTime + 0.14);
  };

  const startGame = () => {
    if (!ready || started) return;
    setStarted(true);
    playConfirm();
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const tl = gsap.timeline();
    tl.to(".start-button", { y: 5, scale: 0.97, duration: 0.08 })
      .to(".start-button", { y: 0, scale: 1, duration: 0.1 })
      .fromTo(".crt-screen", { filter: "brightness(3)" }, { filter: "brightness(1)", duration: 0.13 })
      .call(() => setCountdown("PLAYER 01\nREADY?"))
      .call(() => setCountdown("3"), [], "+=0.22")
      .call(() => setCountdown("2"), [], "+=0.15")
      .call(() => setCountdown("1"), [], "+=0.15")
      .call(() => setCountdown("GO!"), [], "+=0.15")
      .to(".cabinet", { scale: reduced ? 0.98 : 1.04, duration: 0.16 }, "<")
      .to(".arcade-stage", { y: reduced ? -15 : "-38vh", scale: reduced ? 1 : 0.88, autoAlpha: 0, duration: reduced ? 0.25 : 0.58, ease: "power3.in" }, "+=0.17")
      .set(".arcade-stage", { display: "none" })
      .set(".about-level", { display: "block" })
      .fromTo(".about-level", { autoAlpha: 0 }, { autoAlpha: 1, duration: reduced ? 0.2 : 0.5 })
      .fromTo(".about-shell > *, .about-grid > *", { y: reduced ? 8 : 32, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.09, duration: reduced ? 0.2 : 0.55, ease: "power3.out", onComplete: () => { document.body.style.overflow = "auto"; window.scrollTo(0, 0); } }, "<0.08");
  };

  return (
    <div className="portfolio-root" ref={root}>
      <section className="intro-screen" aria-label="Portfolio intro">
        <div className="intro-grid" />
        <div className="dot-field dot-field-left" aria-hidden="true" />
        <div className="dot-field dot-field-right" aria-hidden="true" />
        <div className="intro-copy">
          <p className="intro-player">{data.playerLabel}</p>
          <div className="pixel-invader intro-decor" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /><i /></div>
          <div className="title-wrap">
            <h1 className="pixel-title"><span className="hash">#</span>{data.title}</h1>
            <div className="title-pixels" aria-hidden="true">
              {Array.from({ length: 38 }).map((_, i) => <i key={i} className="title-pixel" style={{ "--i": i } as React.CSSProperties} />)}
            </div>
          </div>
          <p className="intro-role">{data.role}</p>
        </div>
        <span className="intro-decor pixel-ghost ghost-a"><i /><i /></span><span className="intro-decor pixel-ghost ghost-b"><i /><i /></span>
        <span className="intro-decor star">✦</span>
        <span className="intro-decor plus plus-a">+</span><span className="intro-decor plus plus-b">+</span>
        <span className="intro-decor tiny tiny-a">▪ ▪</span><span className="intro-decor tiny tiny-b">▪</span>
      </section>

      <section className="arcade-stage" aria-label="Press start scene">
        <div className="stage-stars" aria-hidden="true" />
        <div className="scene-decor" aria-hidden="true">
          {decor.map(([symbol, className]) => <span key={className} className={className}>{symbol}</span>)}
        </div>
        <ArcadeMachine countdown={countdown} />
        <div className="start-wrap">
          <button className="start-button pixel-button" onClick={startGame} disabled={!ready || started} aria-label="Start portfolio experience">
            START <span>▶</span>
          </button>
          <button className="sound-toggle" onClick={() => setSoundOn((value) => !value)} aria-pressed={soundOn}>SOUND: {soundOn ? "ON" : "OFF"}</button>
        </div>
      </section>

      <AboutSection />
    </div>
  );
}
