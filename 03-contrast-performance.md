# 03: Contrast and performance

## Checklist

- [x] **Text contrast (`styles.css`).** The accent `#c05a4a` is about 4.4:1 on white, just under the WCAG AA 4.5:1 for small text. Add a text variable (for example `--accent-text: #b04e3f`, about 5.2:1) and use it for labels, tags, status badges, small links and any small text currently in `--accent`. Keep `#c05a4a` for decorative bars, borders and large headings. Check every text pairing with a contrast checker.
- [x] **Home poster.** `images/Symposium Poster Horizontal.png` is 2.8 MB. Resize to the largest width it displays at (about 1200 px) and convert to WebP (target under 200 KB). Update the reference in `index.qmd`. Rename it without spaces.
- [x] **Unused images.** Delete images no page references: `ATN Symposium Event Details.png`, `ATN Symposium Poster - Vertical.png`, `Symposium program - horizontal.png`, `Symposium program - vertical.png`, and `1794450360492.jpeg` if nothing uses it. Search the repo before deleting.
- [x] **Headshot.** `images/crop_27A5334.jpg` is 558 KB. Resize to about 600 px wide, convert to WebP, keep descriptive alt text, and update every reference.
- [x] **Fonts.** The Google Fonts link in `_quarto.yml` loads only the Plus Jakarta Sans weights used by the site: 400, 500, 600, 700, 800, plus italic 400.
- [x] **Lazy loading.** Add `loading="lazy"` to images below the fold.

## Done when

- No small text uses a colour under 4.5:1 on its background
- The home page loads no image over 200 KB
- `images/` holds only files that pages use
- The fonts request lists only used weights
