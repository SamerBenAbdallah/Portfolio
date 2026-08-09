import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
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
  assert.match(html, /hero-scene-v2\.png/i);
  assert.match(html, /arcade-room-v2\.png/i);
  assert.match(html, /portfolio-title-v2\.png/i);
  assert.match(html, /Press start to enter the portfolio/i);
  assert.match(html, /SYSTEM ONLINE/i);
  assert.doesNotMatch(html, />OPTIONS</i);
  assert.match(html, /ABOUT/);
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
  assert.match(component, /NEON RUN/);
  assert.match(component, /prefers-reduced-motion/);
  assert.match(component, /aria-label="Press start to enter the portfolio"/);
  assert.match(styles, /@media \(max-width: 720px\)/);
  assert.match(styles, /prefers-reduced-motion: reduce/);
  assert.match(layout, /og-v3\.png/);

  await Promise.all([
    access(new URL("../public/assets/arcade/v2/hero-scene-v2.png", import.meta.url)),
    access(new URL("../public/assets/arcade/v2/arcade-room-v2.png", import.meta.url)),
    access(new URL("../public/assets/arcade/v2/player-avatar-v2.png", import.meta.url)),
    access(new URL("../public/assets/arcade/v2/portfolio-title-v2.png", import.meta.url)),
    access(new URL("../public/og-v3.png", import.meta.url)),
  ]);
});
