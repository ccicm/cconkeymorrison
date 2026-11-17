# 05: Visibility and accessibility

## Visibility

- [ ] **Sitemap.** Confirm `_site/sitemap.xml` is generated (it should be, since `site-url` is set). Add a `robots.txt` that points to it.
- [ ] **Structured data.** In the JSON-LD block in `_quarto.yml`, add `"affiliation": {"@type": "CollegeOrUniversity", "name": "RMIT University"}` and Connor's RMIT profile URL to `sameAs` (needs Connor: the URL).
- [ ] **Page descriptions.** Check every page has a specific `description` (most do) and that none breaks Guardrails 1–6.
- [ ] **Canonical address.** Confirm the site is served at one address (www or bare domain) and the other redirects; if Quarto needs it, set the canonical URL to match `site-url`.

## Accessibility

- [ ] **Timeline status text.** Status dots on the research page timeline are colour and shape only. Add visually hidden text ("completed", "in progress", "to do", "goal") for screen readers.
- [ ] **Descriptive links.** Replace bare "Read more →", "View all →" and similar with descriptive text or an `aria-label`.
- [ ] **Alt text.** Check every image has alt text that describes it; give decorative SVG icons `aria-hidden="true"`.
- [ ] **External link marker.** The script adds " ↗" to external links; make sure screen readers hear "opens in a new tab" (visually hidden text, or `aria-label`).
- [ ] **Keyboard pass.** Tab through every page: every control reachable, visible focus, nothing trapped. Fix what fails.
- [ ] **Zoom and mobile.** Check pages at 200% zoom and at 360 px wide; fix any overlap or horizontal scroll.
- [ ] **Report.** Run Lighthouse (accessibility, SEO, performance) on the home, research, publications and resources pages and paste the scores into the pull request.

## Done when

- `robots.txt` and `sitemap.xml` are live
- JSON-LD includes the RMIT affiliation
- Screen readers announce timeline statuses and new-tab links
- Lighthouse accessibility is 95+ on the four pages
- Then Connor verifies the domain in Google Search Console and submits the sitemap
