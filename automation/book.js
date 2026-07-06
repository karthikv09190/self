// Koto badminton court booker (hacomono) — Playwright automation.
//
//   node book.js                      # book using config.json (+ .env)
//   node book.js --dry                # dry run: stop before final confirm
//   node book.js --login-only         # just log in and save the session
//   node book.js --date=2026-07-18 --court="Court 3" --time="19:00"
//
// The booking site is login-gated, so the exact button text/DOM can vary.
// Everything the script clicks is configurable in config.json → "selectors",
// and the browser runs VISIBLE by default so you can watch and intervene.
// If any step can't find its target, the script pauses and tells you what it
// was looking for, so you can finish that one step by hand (or copy the real
// text into config.json and re-run).

import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUTH_FILE = path.join(__dirname, "auth.json");

// ---------------------------------------------------------------------------
// Tiny .env loader (no dependency) — reads KEY=VALUE lines into process.env.
// ---------------------------------------------------------------------------
function loadEnv() {
  const envPath = path.join(__dirname, ".env");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
}

// ---------------------------------------------------------------------------
// Config: config.json if present, else the committed example. CLI flags and
// env vars win over the file.
// ---------------------------------------------------------------------------
function loadConfig() {
  const custom = path.join(__dirname, "config.json");
  const example = path.join(__dirname, "config.example.json");
  const file = fs.existsSync(custom) ? custom : example;
  const cfg = JSON.parse(fs.readFileSync(file, "utf8"));

  const args = Object.fromEntries(
    process.argv
      .slice(2)
      .filter((a) => a.startsWith("--") && a.includes("="))
      .map((a) => a.slice(2).split(/=(.*)/s).slice(0, 2))
  );

  cfg.date = args.date || process.env.KOTO_DATE || cfg.date;
  cfg.court = args.court || process.env.KOTO_COURT || cfg.court;
  cfg.time = args.time || process.env.KOTO_TIME || cfg.time;

  if (process.env.HEADLESS) cfg.headless = process.env.HEADLESS === "true";
  if (process.env.DRY_RUN || process.argv.includes("--dry")) cfg.confirm = false;

  cfg.usedConfigFile = path.basename(file);
  return cfg;
}

const log = (...a) => console.log("•", ...a);
const warn = (...a) => console.warn("⚠ ", ...a);

// Try each candidate locator; return the first visible one, or null.
async function firstVisible(page, candidates, timeout = 4000) {
  for (const c of candidates) {
    try {
      const loc = typeof c === "string" ? page.locator(c) : c;
      await loc.first().waitFor({ state: "visible", timeout });
      return loc.first();
    } catch {
      /* try next */
    }
  }
  return null;
}

async function clickByText(page, texts, timeout = 6000) {
  const candidates = texts.flatMap((t) => [
    page.getByRole("button", { name: t, exact: false }),
    page.getByText(t, { exact: false }),
  ]);
  const loc = await firstVisible(page, candidates, timeout);
  if (loc) {
    await loc.click();
    return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
async function login(page, cfg) {
  const email = process.env.KOTO_EMAIL;
  const password = process.env.KOTO_PASSWORD;
  if (!email || !password) {
    throw new Error(
      "KOTO_EMAIL / KOTO_PASSWORD not set. Copy .env.example → .env and fill them in."
    );
  }

  log("Opening booking page to check login state…");
  await page.goto(cfg.bookingUrl, { waitUntil: "domcontentloaded" });

  // If there's a visible login entry point, click it.
  const loginEntry = cfg.selectors.loginButton
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const entry = await firstVisible(page, loginEntry, 3000);
  if (entry) await entry.click().catch(() => {});

  const emailField = await firstVisible(
    page,
    cfg.selectors.emailField.split(",").map((s) => s.trim()),
    5000
  );

  if (!emailField) {
    log("No login form appeared — assuming an existing session is active.");
    return;
  }

  log("Filling in credentials…");
  await emailField.fill(email);
  const pwField = await firstVisible(
    page,
    cfg.selectors.passwordField.split(",").map((s) => s.trim()),
    5000
  );
  if (!pwField) throw new Error("Found email field but no password field.");
  await pwField.fill(password);

  const submitted = await clickByText(page, ["Log in", "ログイン", "Sign in"], 4000);
  if (!submitted) {
    await page
      .locator(cfg.selectors.loginSubmit)
      .first()
      .click()
      .catch(() => {});
  }

  await page.waitForLoadState("networkidle").catch(() => {});
  log("Login submitted.");
}

// ---------------------------------------------------------------------------
async function selectSlot(page, cfg) {
  // Navigate to the target date. Many hacomono tenants accept ?date=YYYY-MM-DD;
  // if yours ignores it, the calendar-click fallback below handles it.
  const url = new URL(cfg.bookingUrl);
  if (cfg.date) url.searchParams.set("date", cfg.date);
  log(`Going to ${url.href}`);
  await page.goto(url.href, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle").catch(() => {});

  // If the date didn't take via URL, try clicking it in the calendar (day number).
  if (cfg.date) {
    const day = String(parseInt(cfg.date.split("-")[2], 10));
    const dayCell = await firstVisible(
      page,
      [
        page.getByRole("button", { name: new RegExp(`^${day}$`) }),
        page.getByText(new RegExp(`^${day}$`), { exact: true }),
      ],
      3000
    );
    if (dayCell) {
      await dayCell.click().catch(() => {});
      log(`Selected day ${day} from the calendar.`);
    }
  }

  // Pick the court, then the time (order varies by tenant — try both ways).
  log(`Looking for court "${cfg.court}" and time "${cfg.time}"…`);
  const pickedCourt = cfg.court ? await clickByText(page, [cfg.court], 5000) : true;
  const pickedTime = cfg.time ? await clickByText(page, [cfg.time], 5000) : true;

  if (!pickedCourt) warn(`Could not auto-click court "${cfg.court}".`);
  if (!pickedTime) warn(`Could not auto-click time "${cfg.time}".`);

  if (!pickedCourt || !pickedTime) {
    warn(
      "Finish selecting the slot in the visible browser, then press ENTER here to continue…"
    );
    await waitForEnter();
  }

  // Advance through any "next" steps.
  for (let i = 0; i < 3; i++) {
    const advanced = await clickByText(page, cfg.selectors.nextButtons, 2500);
    if (!advanced) break;
    await page.waitForLoadState("networkidle").catch(() => {});
  }
}

async function confirm(page, cfg) {
  if (!cfg.confirm) {
    log("DRY RUN — stopping before the final confirmation.");
    log("Review the browser. Nothing has been booked.");
    warn("Press ENTER to close the browser (or Ctrl-C to leave it open).");
    await waitForEnter();
    return;
  }
  log("Confirming the booking…");
  const done = await clickByText(page, cfg.selectors.confirmButtons, 8000);
  if (!done) {
    throw new Error(
      "Couldn't find the confirm button. Add its exact text to config.json → selectors.confirmButtons."
    );
  }
  await page.waitForLoadState("networkidle").catch(() => {});
  log("✅ Booking confirmed (verify in the browser / your email).");
}

function waitForEnter() {
  return new Promise((resolve) => {
    process.stdin.resume();
    process.stdin.once("data", () => {
      process.stdin.pause();
      resolve();
    });
  });
}

// ---------------------------------------------------------------------------
async function main() {
  loadEnv();
  const cfg = loadConfig();
  const loginOnly = process.argv.includes("--login-only");

  log(`Using ${cfg.usedConfigFile}`);
  log(
    `Target: ${cfg.date || "(default date)"} · ${cfg.court || "(any court)"} · ${
      cfg.time || "(any time)"
    } · confirm=${cfg.confirm}`
  );

  const browser = await chromium.launch({
    headless: !!cfg.headless,
    slowMo: cfg.slowMoMs || 0,
  });
  const context = await browser.newContext(
    fs.existsSync(AUTH_FILE) ? { storageState: AUTH_FILE } : {}
  );
  context.setDefaultTimeout(cfg.timeoutMs || 30000);
  const page = await context.newPage();

  try {
    await login(page, cfg);
    // Persist the session so future runs skip login (and survive OTP once done).
    await context.storageState({ path: AUTH_FILE });
    log(`Saved session to ${path.basename(AUTH_FILE)}.`);

    if (loginOnly) {
      log("Login-only run complete.");
      return;
    }

    await selectSlot(page, cfg);
    await confirm(page, cfg);
  } catch (err) {
    warn("Something went wrong:", err.message);
    warn("The browser is left open so you can finish or inspect. Ctrl-C to exit.");
    await new Promise(() => {}); // keep process alive
  } finally {
    if (cfg.confirm && !loginOnly) await browser.close().catch(() => {});
  }
}

main();
