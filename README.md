# Koto Badminton Booking Shortcut

A one-tap **Apple Shortcut** that jumps straight to the Koto badminton
reservation page, so you can grab a court in seconds from your iPhone,
iPad, or Mac.

**Booking page:**
<https://koto-hsc.hacomono.jp/reserve/space/MYQQRVYL>

This repo has **two levels** depending on how much you want automated:

| Level | What it does | Where |
|-------|--------------|-------|
| **Open the page** | One-tap Apple Shortcut that jumps to the booking page; you tap through login/date/court yourself. | this README + [`docs/APPLE_SHORTCUT.md`](docs/APPLE_SHORTCUT.md) |
| **Full auto-book** | A script that logs in, picks the date, court and time, and confirms — triggered from an Apple Shortcut. | [`automation/`](automation/README.md) |

iOS Shortcuts can only *open* a URL — they can't drive a multi-page
login-and-booking flow. So the "open the page" shortcut is pure Shortcuts,
while full auto-booking runs a small Playwright browser script on your Mac
that the Shortcut kicks off. Start below for the simple version, or jump to
[`automation/`](automation/README.md) for the full one.

---

## Quick start (build the Shortcut — ~1 minute)

Apple Shortcut files (`.shortcut`) are signed binaries and can't be
committed to git, so here's the exact recipe to build it yourself. It's
just two actions.

1. Open the **Shortcuts** app on your iPhone/iPad/Mac.
2. Tap **+** (New Shortcut).
3. Add action → search **"URL"** → choose **URL**. Paste:
   ```
   https://koto-hsc.hacomono.jp/reserve/space/MYQQRVYL
   ```
4. Add action → search **"Open URLs"** → choose **Open URLs**. It will
   automatically use the URL from step 3.
5. Tap the shortcut name at the top → rename to **"Book Koto Badminton"**
   and pick an icon/color (a badminton 🏸 or racket looks nice).
6. Done. Tap the shortcut to test — it should open the booking page in
   Safari.

That's the whole thing. See [`docs/APPLE_SHORTCUT.md`](docs/APPLE_SHORTCUT.md)
for screenshots-style detail and an **advanced version** that asks you for
a date first.

---

## Put it one tap away

Pick whichever trigger you like — you can use several at once:

- **Home Screen icon:** In Shortcuts, open the shortcut → Share →
  **Add to Home Screen**. Now it's an app icon.
- **Back Tap** (fastest): Settings → Accessibility → Touch → **Back Tap**
  → Double Tap (or Triple Tap) → choose **Book Koto Badminton**. Now a
  couple taps on the back of your phone opens the booking page.
- **Siri:** "Hey Siri, Book Koto Badminton."
- **Widget / Lock Screen:** Add the Shortcuts widget and select this one.

---

## Bonus: hosted redirect link

[`index.html`](index.html) is a tiny page that auto-redirects to the
booking URL, with a big **Book Now** button as a fallback. Handy if you'd
rather share a short link or a QR code instead of a Shortcut. You can host
it free with GitHub Pages (Settings → Pages → deploy from branch) and then
bookmark or QR-code that page.

---

## Changing the booking URL

The booking URL lives in exactly two places:

- The **URL** action of the Apple Shortcut (rebuild step 3 above).
- The `BOOKING_URL` constant near the top of [`index.html`](index.html).

Update both if Koto ever changes the reservation link.
