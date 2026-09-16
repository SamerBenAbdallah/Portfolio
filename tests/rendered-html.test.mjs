import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the arcade portfolio experience", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /Samer Ben Abdallah — Graphic &amp; Motion Designer/i);
  assert.match(html, /samer-profile\.png/i);
  assert.match(html, /after-effects\.svg/i);
  assert.doesNotMatch(html, /Figma/i);
  assert.match(html, /arcade-room-v2\.png/i);
  assert.doesNotMatch(html, /hero-scene-v2\.png|portfolio-title-v2\.png/i);
  assert.match(html, /Press start to enter the portfolio/i);
  assert.match(html, /PLAYER 1 \/\/ INSERT COIN/i);
  assert.doesNotMatch(html, />OPTIONS</i);
  assert.match(html, /ABOUT/);
  assert.match(html, /GRAPHIC/);
  assert.match(html, /MOTION/);
  assert.match(html, /Khanfes Danfes/i);
  assert.match(html, /B2B Lounge Campaigns/i);
  assert.match(html, /Nifty Campaign/i);
  assert.match(html, /Pharmacy Presentations/i);
  assert.doesNotMatch(html, /Neon Identity System|2026 Motion Reel/i);
  assert.match(html, /SEND MESSAGE/);
  assert.match(html, /THANKS FOR PLAYING/);
  assert.doesNotMatch(html, /COMING NEXT/i);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/i);
});

test("ships the complete production artwork and interaction source", async () => {
  const [component, styles, layout] = await Promise.all([
    readFile(new URL("../app/portfolio/ArcadePortfolio.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(component, /startGame/);
  assert.match(component, /createArcadeMusic/);
  assert.match(component, /ARCADE RUN/);
  assert.match(component, /useState\(false\).*musicRef/s);
  assert.match(component, /master\.gain\.setValueAtTime\(0\.38/);
  assert.match(component, /const chordProgression/);
  assert.match(component, /scheduleSnare/);
  assert.match(component, /prefers-reduced-motion/);
  assert.match(component, /aria-label="Press start to enter the portfolio"/);
  assert.doesNotMatch(component, /className="intro-screen"/);
  assert.doesNotMatch(component, /hero-scene-v2\.png|portfolio-title-v2\.png/);
  assert.doesNotMatch(component, /className="intro-player"/);
  assert.match(component, /className="start-line"/);
  assert.match(component, /screen-pac-dots/);
  assert.match(component, /cartridge-vents/);
  assert.match(component, /cartridge-contacts/);
  assert.match(component, /PLAYER 1 \/\/ INSERT COIN/);
  assert.match(component, /Pac-Man-inspired arcade cabinet/);
  assert.doesNotMatch(component, /className="press-line"/);
  assert.match(component, /Array\.from\(\{ length: 4 \}/);
  assert.match(component, /heartTargetRef\.current = Math\.min\(3, target\)/);
  assert.match(component, /className="heart-shards"/);
  assert.match(styles, /@keyframes heart-break/);
  assert.match(component, /const loopSteps = 224/);
  assert.match(component, /className="back-to-top"/);
  assert.match(component, /addEventListener\("scroll"/);
  assert.match(component, /role="dialog"/);
  assert.match(component, /className="case-media-video"/);
  assert.match(component, /className="case-playlist"/);
  assert.match(component, /controls playsInline preload="metadata"/);
  assert.match(component, /mailto:/);
  assert.match(component, /mobile-nav-toggle/);
  assert.match(component, /id="finish"/);
  assert.doesNotMatch(component, /official-site-icon\.png/);
  assert.doesNotMatch(component, /<span>ABOUT<\/span>/);
  assert.doesNotMatch(component, /className="arcade-marquee"/);
  assert.doesNotMatch(component, /<strong>PORTFOLIO<\/strong>/);
  assert.doesNotMatch(component, /className="health"/);
  assert.match(styles, /@media \(max-width: 720px\)/);
  assert.match(styles, /prefers-reduced-motion: reduce/);
  assert.match(styles, /@keyframes heart-gain/);
  assert.match(styles, /@keyframes heart-ring/);
  assert.match(styles, /\.project-grid/);
  assert.match(styles, /@keyframes cartridge-float/);
  assert.match(styles, /\.arcade-stage[^}]+opacity: 0[^}]+visibility: hidden/s);
  assert.match(styles, /\.about-level[^}]+display: none[^}]+visibility: hidden[^}]+opacity: 0/s);
  assert.match(styles, /\.music-toggle[^}]+opacity: 0[^}]+visibility: hidden/s);
  assert.match(styles, /\.motion-grid/);
  assert.match(styles, /\.contact-grid/);
  assert.match(styles, /\.case-overlay/);
  assert.match(styles, /\.machine-screen[^}]+left: 31\.55%[^}]+top: 35\.85%/s);
  assert.match(styles, /\.screen-pac-dots/);
  assert.match(styles, /img\.motion-poster[^}]+object-fit: contain/s);
  assert.match(styles, /\.case-playlist img[^}]+object-fit: contain/s);
  assert.match(styles, /\.level-heading h2[^}]+font-weight: 900/s);
  assert.match(styles, /\.project-copy h3, \.motion-copy h3[^}]+font-weight: 600/s);
  assert.doesNotMatch(styles, /\.arcade-marquee/);
  assert.match(styles, /\.lives[^}]+font-size: clamp\(1\.05rem, 1\.35vw, 1\.28rem\)/s);
  assert.match(layout, /og-v3\.png/);

  const [migration, repository, admin, projectPage] = await Promise.all([
    readFile(new URL("../supabase/migrations/202609160001_portfolio_cms.sql", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/projects/repository.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/admin/AdminDashboard.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/projects/[slug]/page.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(migration, /enable row level security/i);
  assert.match(migration, /Public can read published projects/);
  assert.match(migration, /project-media/);
  assert.match(repository, /\.eq\("published", true\)/);
  assert.match(repository, /\.order\("display_order"/);
  assert.match(admin, /Permanently delete/);
  assert.match(admin, /admin-action-feedback/);
  assert.match(admin, /Cartridge sticker \/ project cover/);
  assert.match(admin, /editable arcade-cartridge sticker/);
  assert.match(projectPage, /getPublishedProjectBySlug/);

  await Promise.all([
    access(new URL("../public/assets/arcade/v2/hero-scene-v2.png", import.meta.url)),
    access(new URL("../public/assets/arcade/v2/arcade-room-v2.png", import.meta.url)),
    access(new URL("../public/assets/arcade/v2/player-avatar-v2.png", import.meta.url)),
    access(new URL("../public/assets/arcade/v2/portfolio-title-v2.png", import.meta.url)),
    access(new URL("../public/og-v3.png", import.meta.url)),
    access(new URL("../public/assets/projects/graphic/khanfes-logo-thumbnail.webp", import.meta.url)),
    access(new URL("../public/assets/projects/graphic/khanfes-full-project.webp", import.meta.url)),
    access(new URL("../public/assets/projects/graphic/oenobiol-retail.webp", import.meta.url)),
    access(new URL("../public/assets/projects/motion/nifty-landscape.mp4", import.meta.url)),
    access(new URL("../public/assets/projects/motion/nifty-landscape.jpg", import.meta.url)),
  ]);

  const motionAssets = await readdir(new URL("../public/assets/projects/motion/", import.meta.url));
  assert.equal(motionAssets.filter((file) => file.endsWith(".mp4")).length, 25);
  assert.equal(motionAssets.filter((file) => file.endsWith(".jpg")).length, 25);
});
