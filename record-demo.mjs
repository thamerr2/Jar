/**
 * Jar Demo Video Recorder
 * Records a walkthrough of the landing page in Arabic using Playwright + ffmpeg.
 *
 * Usage: node record-demo.mjs
 * Output: demo-video.mp4 in this folder
 */

import { chromium } from "playwright";
import { execSync } from "child_process";
import { existsSync, mkdirSync, rmSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dir  = dirname(fileURLToPath(import.meta.url));
const FRAMES = join(__dir, ".demo-frames");
const OUTPUT = join(__dir, "demo-video.mp4");
const URL    = "http://localhost:5173";
const FPS    = 30;
const W      = 1440;
const H      = 900;

// ── Helpers ───────────────────────────────────────────────────────────────────
let frameIdx = 0;
async function shot(page) {
  const name = join(FRAMES, `frame-${String(frameIdx++).padStart(5, "0")}.png`);
  await page.screenshot({ path: name });
}

async function holdFrames(page, seconds) {
  const count = Math.round(seconds * FPS);
  for (let i = 0; i < count; i++) await shot(page);
}

async function scrollTo(page, y, seconds = 1.2) {
  const start = await page.evaluate(() => window.scrollY);
  const steps = Math.round(seconds * FPS);
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    // ease-out cubic
    const ease = 1 - Math.pow(1 - t, 3);
    const cur  = Math.round(start + (y - start) * ease);
    await page.evaluate((sy) => window.scrollTo(0, sy), cur);
    await shot(page);
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
if (existsSync(FRAMES)) rmSync(FRAMES, { recursive: true });
mkdirSync(FRAMES);

const browser = await chromium.launch({ channel: "chrome", headless: true });
const ctx     = await browser.newContext({
  viewport: { width: W, height: H },
  locale:   "ar-SA",
  deviceScaleFactor: 2,
});
const page = await ctx.newPage();

// ── Load in Arabic ─────────────────────────────────────────────────────────
console.log("🌐  Loading page in Arabic…");
await page.goto(URL, { waitUntil: "networkidle" });

// Force Arabic language
await page.evaluate(() => {
  const key = Object.keys(localStorage).find(k => k.includes("i18n"));
  if (key) localStorage.setItem(key, "ar");
});
await page.evaluate(() => {
  const btn = document.querySelector('button[aria-label*="nglish"], button[aria-label*="Arabic"]');
  if (btn) btn.click();
});
// Click the EN/AR language toggle (it shows "EN" when Arabic is active, "عر" when English)
// We need Arabic so click the button showing "عر"
await page.evaluate(() => {
  const btns = [...document.querySelectorAll("button")];
  const arBtn = btns.find(b => b.textContent?.trim() === "عر");
  if (arBtn) arBtn.click();
});
await page.waitForTimeout(600);

// ── Scene 1 — Hero ────────────────────────────────────────────────────────
console.log("🎬  Scene 1: Hero…");
await holdFrames(page, 2.5);          // pause on hero

// ── Scene 2 — Scroll into Sticky Dashboard reveal ─────────────────────────
console.log("🎬  Scene 2: Dashboard reveal…");
const pageH = await page.evaluate(() => document.body.scrollHeight);
// sticky section is 300vh; scroll through it slowly
const vh     = H;
const third  = vh * 3;          // 300vh
await scrollTo(page, third * 0.18, 0.8);   // start dashboard appearing
await holdFrames(page, 0.5);
await scrollTo(page, third * 0.45, 1.8);   // mid reveal
await holdFrames(page, 0.5);
await scrollTo(page, third * 0.78, 1.8);   // cards filling in
await holdFrames(page, 0.8);
await scrollTo(page, third * 0.98, 1.2);   // end of sticky

// ── Scene 3 — Features section ────────────────────────────────────────────
console.log("🎬  Scene 3: Features…");
await scrollTo(page, third + vh * 0.5, 1.4);
await holdFrames(page, 2.0);

// ── Scene 4 — Contact section ─────────────────────────────────────────────
console.log("🎬  Scene 4: Contact…");
await scrollTo(page, pageH - vh * 1.2, 1.8);
await holdFrames(page, 2.0);

// ── Scene 5 — Footer + hold ───────────────────────────────────────────────
console.log("🎬  Scene 5: Footer…");
await scrollTo(page, pageH, 1.0);
await holdFrames(page, 2.0);

// ── Scene 6 — Scroll back to top ─────────────────────────────────────────
console.log("🎬  Scene 6: Back to top…");
await scrollTo(page, 0, 2.0);
await holdFrames(page, 2.0);

await browser.close();

// ── Encode with ffmpeg ────────────────────────────────────────────────────
console.log(`\n🎞  Encoding ${frameIdx} frames → ${OUTPUT} …`);
execSync(
  `ffmpeg -y -framerate ${FPS} -i "${FRAMES}/frame-%05d.png" ` +
  `-vf "scale=${W}:${H}:flags=lanczos,format=yuv420p" ` +
  `-c:v libx264 -preset slow -crf 18 -movflags +faststart ` +
  `"${OUTPUT}"`,
  { stdio: "inherit" }
);

rmSync(FRAMES, { recursive: true });
console.log(`\n✅  Saved: ${OUTPUT}`);
