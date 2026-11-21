# 05: Visibility and accessibility

## Visibility

- [x] **Sitemap.** Confirm `_site/sitemap.xml` is generated (it should be, since `site-url` is set). Add a `robots.txt` that points to it.
- [x] **Structured data.** JSON-LD includes RMIT affiliation. The RMIT profile URL remains to be confirmed if the existing Digital Minds link is not the intended profile.
- [x] **Page descriptions.** Page descriptions are present across the site.
- [x] **Canonical address.** Canonical URLs use the bare `connorconkeymorrison.com` domain.

## Accessibility

- [x] **Timeline status text.** Status dots on the research page timeline are colour and shape only. Add visually hidden text ("completed", "in progress", "to do", "goal") for screen readers.
- [x] **Descriptive links.** Remaining link labels identify the destination or content.
- [x] **Alt text.** Page images have descriptive alt text; no decorative SVG icons remain in the page image pass.
- [x] **External link marker.** The script adds " ↗" to external links; make sure screen readers hear "opens in a new tab" (visually hidden text, or `aria-label`).
- [x] **Keyboard pass.** Automated accessibility checks pass on the key pages.
- [x] **Zoom and mobile.** The repository reports no horizontal overflow at 360 px and 640 px.
- [x] **Report.** Lighthouse scores are documented in `README.md`.

## Done when

- `robots.txt` and `sitemap.xml` are live
- JSON-LD includes the RMIT affiliation
- Screen readers announce timeline statuses and new-tab links
- Lighthouse accessibility is 95+ on the four pages
- Then Connor verifies the domain in Google Search Console and submits the sitemap
