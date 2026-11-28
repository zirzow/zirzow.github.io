# Seasonal homepage promotion — editing guide

The homepage contains a reusable, animated special-occasion block between the main STAY CURIOUS hero and the adventure cards. It loads one HTML insert at a time. **Do not edit index.html to switch seasons.**

## Do I need to change anything manually?

The site is currently in **auto** mode. Each visitor sees the occasion selected for their local date. The general-gifts block appears between campaigns. Leave the setting on auto for regular seasonal changes.

Edit the settings only to force a specific occasion, select a manual-only occasion, or hide the block. Edit a fragment only when changing that occasion’s copy or link.

## Quick switch in GitHub

1. Open [special-occasion-settings.json](special-occasion-settings.json) on the main branch.
2. Click the pencil icon (Edit this file).
3. Replace the contents with one of the examples below.
4. Click Commit changes and commit to main (or use your normal pull request workflow).
5. After GitHub Pages deploys, open https://zirzowlab.org/ and refresh. If needed, use Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac).

### Automatic mode (recommended)

```json
{
  "mode": "auto",
  "manual": "xmas"
}
```

The block selects an occasion using each visitor's local calendar when the page loads. The manual field is ignored. Outside the promotional windows, the general gift block appears. No scheduled job or annual file edit is required.

### Manual mode — choose any occasion

For Christmas:
```json
{
  "mode": "manual",
  "manual": "xmas"
}
```

For Black Friday:
```json
{
  "mode": "manual",
  "manual": "black-friday"
}
```

For Fourth of July:
```json
{
  "mode": "manual",
  "manual": "july4"
}
```

Use the exact ID from the table below, not the entire HTML filename. Manual mode stays on the selected occasion until you change it. To return to the automatic calendar, change mode to auto.

### General gifts all year

```json
{
  "mode": "manual",
  "manual": "general"
}
```

### Hide the block completely

```json
{
  "mode": "off",
  "manual": "general"
}
```

With JavaScript working, off hides the homepage promotion, but does not remove the gift guide page or navigation links. Without JavaScript, the static general-gift fallback remains visible.

## All available occasion IDs

| Occasion | Manual ID | HTML insert | Automatic? |
|---|---|---|---|
| General gifts | general | [special-occasion-general.html](special-occasion-general.html) | Fallback |
| Christmas | xmas | [special-occasion-xmas.html](special-occasion-xmas.html) | Yes |
| Black Friday | black-friday | [special-occasion-black-friday.html](special-occasion-black-friday.html) | Yes |
| Cyber Monday | cyber-monday | [special-occasion-cyber-monday.html](special-occasion-cyber-monday.html) | Yes |
| New Year | new-year | [special-occasion-new-year.html](special-occasion-new-year.html) | Yes |
| Valentine's Day | valentines | [special-occasion-valentines.html](special-occasion-valentines.html) | Yes |
| Easter | easter | [special-occasion-easter.html](special-occasion-easter.html) | Yes |
| Mother's Day | mothers-day | [special-occasion-mothers-day.html](special-occasion-mothers-day.html) | Yes |
| Father's Day | fathers-day | [special-occasion-fathers-day.html](special-occasion-fathers-day.html) | Yes |
| Graduation | graduation | [special-occasion-graduation.html](special-occasion-graduation.html) | Yes |
| Fourth of July | july4 | [special-occasion-july4.html](special-occasion-july4.html) | Yes |
| Back to school | back-to-school | [special-occasion-back-to-school.html](special-occasion-back-to-school.html) | Yes |
| Halloween | halloween | [special-occasion-halloween.html](special-occasion-halloween.html) | Yes |
| Thanksgiving | thanksgiving | [special-occasion-thanksgiving.html](special-occasion-thanksgiving.html) | Yes |
| Giving Tuesday | giving-tuesday | [special-occasion-giving-tuesday.html](special-occasion-giving-tuesday.html) | Yes |
| Small Business Saturday | small-business-saturday | [special-occasion-small-business-saturday.html](special-occasion-small-business-saturday.html) | Yes |
| Birthdays | birthdays | [special-occasion-birthdays.html](special-occasion-birthdays.html) | Manual only |
| Anniversary | anniversary | [special-occasion-anniversary.html](special-occasion-anniversary.html) | Manual only |
| Hanukkah | hanukkah | [special-occasion-hanukkah.html](special-occasion-hanukkah.html) | Manual only |
| Diwali | diwali | [special-occasion-diwali.html](special-occasion-diwali.html) | Manual only |
| Lunar New Year | lunar-new-year | [special-occasion-lunar-new-year.html](special-occasion-lunar-new-year.html) | Manual only |
| Teacher appreciation | teacher-appreciation | [special-occasion-teacher-appreciation.html](special-occasion-teacher-appreciation.html) | Manual only |

## Automatic promotional windows

The loader uses the following rules, in priority order when dates overlap. These are shopping campaign windows, not a comprehensive holiday calendar.

- Giving Tuesday, Cyber Monday and Small Business Saturday: their respective days.
- Black Friday: three days before through two days after Black Friday, except Thanksgiving and Small Business Saturday; higher-priority rules win.
- Thanksgiving: Thanksgiving Day and 10–4 days before it.
- Christmas: November 1 through 11 days before Thanksgiving, and the day after Giving Tuesday through December 25.
- New Year: December 26–31 and January 1–7.
- Valentine's Day: February 1–14.
- Easter: 14 days before through Easter Sunday (Western Gregorian Easter).
- Mother's Day and Father's Day: 14 days before through each U.S. holiday.
- Graduation: May 12–June 30, except higher-priority campaigns.
- Fourth of July: July 1–4.
- Back to school: July 20–August 31.
- Halloween: October 10–31.
- General gifts: all remaining dates.

## Which file to edit?

| Goal | File |
|---|---|
| Switch, force or hide the block | [special-occasion-settings.json](special-occasion-settings.json) |
| Change one block's headline, icon, text or link | Its special-occasion-ID.html file |
| Change the shared blue/navy styling or animations | [special-occasions.css](special-occasions.css) |
| Change the automatic calendar, allowed IDs, or gift-guide occasion-specific headline and initial category | [special-occasions.js](special-occasions.js) |
| Change the gift recommendations themselves | [gift-guide.html](../gift-guide.html) |
| Change the location of the block on the homepage | [index.html](../index.html) |
| Change the global footer | [footer.html](../footer.html) |

The individual HTML inserts are fragments, not full web pages. Preserve the section's data-occasion attribute, .so-card, .so-icon (and its inner span), .so-copy, and accessible heading ID so loading and animation continue to work. All 22 share the same rotating rings, orbiting lights, floating icon and sparkles. Visitors can pause or resume decorative animations using the single control in the top navigation next to the light/dark toggle; reduced-motion preferences are respected.

To edit an occasion's gift-guide title or description as well as its homepage banner, also update its metadata in special-occasions.js. The two sets of copy are currently stored separately.

## Troubleshooting

- Wrong occasion: check mode and manual in settings. Use valid JSON with double quotes, no trailing commas, and an exact ID from the table. Invalid IDs or unavailable settings fall back to automatic selection.
- Old appearance: confirm the latest commit is on the deployed branch, then hard-refresh. The settings and insert requests use cache revalidation. If changing CSS or JS, update their version query strings in index.html (and in gift-guide.html for special-occasions.js).
- General gift block appears instead: the requested insert may have failed to load; verify the filename and the section's data-occasion attribute. The loader falls back to the general insert or the homepage's static fallback.
- No animation: check browser/system reduced-motion preferences and the top navigation Pause/Resume animations control. If JavaScript cannot load, the fallback is static.
- Preview a destination without changing the homepage: [Christmas](https://zirzowlab.org/gift-guide.html?occasion=xmas), [Black Friday](https://zirzowlab.org/gift-guide.html?occasion=black-friday), [Fourth of July](https://zirzowlab.org/gift-guide.html?occasion=july4), [General](https://zirzowlab.org/gift-guide.html?occasion=general). These links preview the gift guide, not the homepage insert.

No external scheduler or server is necessary. Gift links do not imply verified sales or discounts. The seasonal system does not alter the water map, games, homepage hero, or other topic pages.
