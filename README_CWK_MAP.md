# Calusa Waterkeeper monitoring map — maintainer's guide

## Files

- **`calusa-waterkeeper-map-annotated.html`** is the complete deployable webpage. Rename it to `water-map.html` for your existing GitHub Pages site. You do **not** need to upload `cwk_app.js` or this README for the page to function; the JavaScript is embedded in the HTML.
- This README explains how to deploy, maintain, and verify the page.

## External dependencies (loaded on demand)

1. Leaflet CSS and JavaScript: `https://unpkg.com/leaflet@1.9.4/...`
2. Esri Street, Satellite, and Ocean map tiles: `https://server.arcgisonline.com/...`
3. Water-quality CSV: see `CONFIG.DATA_URL` in the script.
4. Fonts: Google Fonts.

All dependencies require internet access. The ArcGIS endpoint **has not been independently verified** to provide a publicly accessible CSV with the required headers, or to permit browser cross-origin (CORS) access. The page deliberately does not fabricate records if loading fails.

## Required CSV columns

`StationID`, `Latitude`, `Longitude`, `SampleDate`, `Characteristic`, `ResultValue`

Optional fields: `WaterbodyName`, `ResultUnit`, `ActivityDepth`, `ActivityDepthUnit`, `SiteWaterTemp_C`.

Supported sample dates are `YYYY-MM-DD` or `MM/DD/YYYY`. Target characteristic fields must describe Enterococcus or E. coli, not total coliform. Values may be exact numbers or qualified with `<` or `>`; other values are rejected and reported. Data are assumed to be per 100 mL. Verify that actual incoming units and assay types are comparable before public release.

## Data logic

- **Recent / historic:** A monitoring location is recent when it has a sample within the last 45 UTC dates, including today, for the indicator selected in the map filter. In **Both** mode, either indicator qualifies. Historical markers are gray and hidden by default.
- **Both filter:** Shows one station marker, with the latest reading for each indicator in the popup. The marker color uses the newest recent indicator available, or most recent overall when historic is shown. A single marker color must not be interpreted as the combined site's risk.
- **Thresholds:** Comparison with EPA 2012 Beach Action Values: enterococci 70 and E. coli 235 per 100 mL. This is **not** an assessment of compliance, an official swimming advisory, or a declaration of safety. Formal RWQC also use statistical criteria with specified periods and frequencies.
- **Trends:** One indicator at a time. The descriptive geometric mean uses historical positive, unqualified results for that indicator; qualified results are not treated as exact. If any exact result is zero, the displayed geometric mean is zero. This descriptive all-time summary is **not** an EPA regulatory geometric-mean assessment.
- **Download all:** Every valid target-indicator sample.
- **Download last 45 days:** All valid records whose dates fall within the rolling window (not one summary per station).
- **Download site:** Every sample for the chosen station **and** indicator.

## Publish

1. Back up the existing `water-map.html` in your GitHub repository.
2. Upload the annotated HTML as `water-map.html` to the GitHub Pages publication folder.
3. Open the published URL with browser Developer Tools → **Console** and **Network** tabs.
4. Confirm the ArcGIS request returns `200`, valid CSV and an `Access-Control-Allow-Origin` response compatible with the page's domain.
5. Check the total sample count and newest sample date against the authoritative ArcGIS portal; validate a handful of actual station results with your raw dataset.
6. Test Both/Entero/E. coli toggles, historic toggle, popup, trend picker, linear/log chart, and all three CSV exports.
7. Test on Chrome, Edge, and a phone browser. If one browser fails, inspect its Console and Network requests; the error text should identify data format or network problems.

## Operational and scientific caution

Before publication, confirm the intended waterbody type, methods and reference criteria with Calusa Waterkeeper scientists. The EPA BAV reference values are guidance for beach notification programs, not a legal compliance classification or a substitute for Florida Department of Health advisories. E. coli and enterococci may be reported by different methods and units (MPN vs CFU); do not assume that a BAV comparison is directly method-equivalent without documented validation. Consider a future `SampleID` field to distinguish repeated samples collected on the same date, and add laboratory-qualified flags or detection limits if the actual schema includes them.

## Diagnosing a blank map

- **Leaflet unavailable:** Leaflet CDN inaccessible.
- **HTTP status error:** ArcGIS item URL may be private, moved, or inaccessible.
- **JSON/HTML returned:** Endpoint does not point directly to a CSV file.
- **Missing headers:** CSV schema differs from the expected columns.
- **CORS:** Browser may block the request even if visiting the URL directly succeeds.
- **No valid samples:** Inspect indicator labels, date formats, coordinates, and result values.
