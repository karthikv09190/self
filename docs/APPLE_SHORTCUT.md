# Building the "Book Koto Badminton" Apple Shortcut

This walks through building the shortcut by hand. Apple Shortcuts are
signed binary files that can't be generated outside of Apple's apps, so
this recipe is the source of truth — it takes about a minute.

Booking URL used throughout:

```
https://koto-hsc.hacomono.jp/reserve/space/MYQQRVYL
```

---

## Basic version — "just open the booking page"

**Actions (in order):**

| # | Action      | Configuration                                              |
|---|-------------|------------------------------------------------------------|
| 1 | **URL**     | `https://koto-hsc.hacomono.jp/reserve/space/MYQQRVYL`      |
| 2 | **Open URLs** | Input = the URL from step 1 (auto-filled)                |

**Steps:**

1. Open the **Shortcuts** app.
2. Tap **+** to create a new shortcut.
3. Tap **Add Action**, search for **URL**, and select it. Paste the
   booking URL into the field.
4. Tap **Add Action** again, search for **Open URLs**, and select it. It
   picks up the URL from the previous step automatically.
5. Tap the shortcut's title → **Rename** to `Book Koto Badminton`.
6. Tap **Choose Icon** → set a color and glyph (🏸 racket/ball).
7. Tap **Done**.

Run it once to confirm it opens the reservation page in Safari. Because
hacomono keeps you signed in, you'll land on the court calendar ready to
pick a slot.

---

## Advanced version — "ask me for a date first"

Some hacomono sites accept a `?date=YYYY-MM-DD` parameter that opens the
calendar on a specific day. This isn't guaranteed for every venue, so
**test it once**: manually visit

```
https://koto-hsc.hacomono.jp/reserve/space/MYQQRVYL?date=2026-07-11
```

If it opens on that date, build the version below. If the site ignores
the parameter, just use the basic version above.

**Actions (in order):**

| # | Action                 | Configuration                                                                 |
|---|------------------------|-------------------------------------------------------------------------------|
| 1 | **Date**               | Ask each time — prompt: "Which day do you want to play?"                       |
| 2 | **Format Date**        | Format = Custom, format string `yyyy-MM-dd`, input = the Date from step 1     |
| 3 | **Text**               | `https://koto-hsc.hacomono.jp/reserve/space/MYQQRVYL?date=` + Formatted Date  |
| 4 | **URL**                | Input = the Text from step 3                                                   |
| 5 | **Open URLs**          | Input = the URL from step 4                                                    |

**Steps:**

1. New shortcut → **Add Action** → **Date**. Tap the action's options and
   set it to **Ask Each Time** (so it prompts you when run).
2. **Add Action** → **Format Date**. Set **Format** to **Custom** and
   enter `yyyy-MM-dd`. Set its input to the **Date** variable from step 1.
3. **Add Action** → **Text**. Type the base URL and a `?date=`, then tap
   the variable inserter and add the **Formatted Date**:
   ```
   https://koto-hsc.hacomono.jp/reserve/space/MYQQRVYL?date=[Formatted Date]
   ```
4. **Add Action** → **URL**, set its input to the **Text** from step 3.
5. **Add Action** → **Open URLs**, input = the **URL** from step 4.
6. Rename to `Book Koto Badminton`, choose an icon, tap **Done**.

Now running the shortcut asks for a day and opens the calendar on it.

---

## Triggers (make it one tap)

- **Home Screen:** open shortcut → Share → **Add to Home Screen**.
- **Back Tap:** Settings → Accessibility → Touch → **Back Tap** →
  Double/Triple Tap → select the shortcut. Fastest option.
- **Siri:** say the shortcut's name — "Book Koto Badminton."
- **Widget / Lock Screen:** add the Shortcuts widget and pick this one.
- **Focus / Automation:** Shortcuts → Automation can even run it on a
  schedule (e.g., a reminder every Monday when new slots open).

---

## Troubleshooting

- **Opens a login page instead of the calendar:** log into hacomono once
  in Safari (not a private tab). The Shortcut opens Safari, which keeps
  the session.
- **`?date=` is ignored:** the venue doesn't support the parameter — use
  the basic version.
- **Nothing happens on run:** make sure the last action is **Open URLs**
  (not "Get Contents of URL", which fetches silently in the background).
