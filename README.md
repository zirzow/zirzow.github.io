# AmandaZirzow.com

Personal website hosted on GitHub Pages: https://amandazirzow.com/

## Quick maintenance

### Switch the homepage occasion block

Edit [special-occasion-settings.json](special-occasion-settings.json) on main, commit, and refresh the website after deployment. You do not need to edit index.html.

**Automatic seasonal rotation**
```json
{"mode": "auto", "manual": "xmas"}
```

**Force an occasion** (example: Fourth of July)
```json
{"mode": "manual", "manual": "july4"}
```

Use xmas for Christmas, black-friday for Black Friday, or general for year-round gifts. Set mode to off to hide the block when JavaScript is available.

**[Complete seasonal editing guide — all 22 IDs, dates, examples and troubleshooting](SPECIAL-OCCASIONS.md)**

### Other common edits

| Task | File |
|---|---|
| Shared footer | [footer.html](footer.html) |
| Shared colors and styling | [site.css](site.css) |
| Theme and footer loading | [site.js](site.js) |
| Homepage animated hero | [index.html](index.html) |
| Gift recommendations | [gift-guide.html](gift-guide.html) |
| Seasonal styling and animation | [special-occasions.css](special-occasions.css) |
| Seasonal calendar and loading | [special-occasions.js](special-occasions.js) |
| Cycling and race links | [cycling.html](cycling.html) |

## Additional documentation

- [Seasonal promotion system](SPECIAL-OCCASIONS.md)
- [Website redesign notes](REDESIGN.md)
- [Calusa Waterkeeper water-map documentation](README_CWK_MAP.md)

The water-map documentation is maintained separately from general website instructions.

## Animation preferences
The single Pause animations control next to the light/dark toggle manages the homepage hero, seasonal insert and gift-guide decorations. The preference persists across editorial pages; system reduced motion is respected. Games retain their own gameplay controls.
