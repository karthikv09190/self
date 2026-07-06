# Koto Badminton Auto-Booker (Playwright)

Automates the full booking on the Koto hacomono site: **log in → pick the
date → pick the court → pick the time → confirm**. Runs a real browser on
your Mac so you can watch it, and you trigger it from an Apple Shortcut
(or the terminal).

> **Why not a pure Apple Shortcut?** iOS Shortcuts can only *open* a URL —
> they can't drive a multi-page login-and-booking flow. So the actual work
> happens in this script; the Apple Shortcut just kicks it off. See
> [`../docs/APPLE_SHORTCUT.md`](../docs/APPLE_SHORTCUT.md) for the
> "just open the page" shortcut if that's all you need.

---

## Setup (once, ~5 minutes)

Requires [Node.js](https://nodejs.org) 18+ on your Mac.

```bash
cd automation
npm install                       # installs Playwright + a Chromium build
cp .env.example .env              # then edit .env with your hacomono login
cp config.example.json config.json
```

Edit **`.env`** with your email + password (this file is gitignored — it
never gets committed). Edit **`config.json`** with the court/time you
usually book.

---

## First run — save your login, safely (dry run)

```bash
npm run login      # logs in once and saves the session to auth.json
npm run dry        # full flow with a VISIBLE browser, stops before confirming
```

`npm run dry` books nothing — it walks the flow so you can confirm the
script clicks the right things. If it can't find your court/time/confirm
button, it says exactly what it looked for and pauses so you can either
finish by hand or copy the real button text into `config.json`.

Once a dry run looks right, book for real:

```bash
npm run book
# or override the target inline:
node book.js --date=2026-07-18 --court="Court 3" --time="19:00"
```

Set `"confirm": true` in `config.json` (or use `npm run book`, which
already implies confirm unless `DRY_RUN` is set) to actually reserve.

---

## Tuning the selectors

The site is behind a login, so the committed selectors are best-guess
defaults (with Japanese fallbacks like `予約する` for confirm). If a step
misfires, open the visible browser during a dry run, note the **exact
text** on the button/court/time you need, and edit
`config.json → "selectors"`. Text-based matching is intentional — it
survives most layout changes.

If login uses an SMS code or Google/LINE, run `npm run login` once, complete
that step by hand in the visible browser, and the saved `auth.json` session
is reused on later runs so you won't have to log in every time.

---

## Trigger it from an Apple Shortcut

Two easy ways to fire this from your phone:

### A. "Run script over SSH" (recommended)

1. On your Mac: System Settings → General → Sharing → enable **Remote Login**.
2. In the **Shortcuts** app on your iPhone, new shortcut → add action
   **Run Script Over SSH**.
3. Fill in your Mac's host/user/password (or SSH key), and set the script:
   ```bash
   cd ~/path/to/koto-badminton-shortcut/automation && /usr/local/bin/node book.js
   ```
   (Use `which node` on your Mac to get the correct node path.)
4. Name it **"Book Koto Court"**, add to Home Screen / Back Tap / Siri.

Now one tap on your phone runs the booker on your Mac.

### B. macOS Shortcut with "Run Shell Script"

On a Mac Shortcut, add **Run Shell Script** with the same `cd … && node
book.js` line. Trigger it with Siri or a menu-bar/Dock icon. You can even
add it to a **scheduled Automation** if you later want to auto-grab slots.

---

## Safety & notes

- Your password stays in `.env` on your machine; it's never committed.
- Start with dry runs. Only flip `confirm` to `true` once you trust it.
- Automated booking may be against the site's terms — use responsibly, and
  don't hammer it (no rapid retries).
- Booking a slot that requires payment will proceed to the site's payment
  step; the script stops at the confirm button — review before paying.
