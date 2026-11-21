# 02: Finish content

Loose ends from the plan. Keep the "Settled on purpose" list in `00-start-here.md` untouched.

## Checklist

- [x] **Paper 3 wording.** Change "population-level" to "system-level" for Paper 3 on the research page card (`research/index.qmd`) and in the timeline title (`data/timeline.json`). Paper 2 stays "population level".
- [x] **Timeline quarter.** In `data/timeline.json`, replace `"currentQuarter": 8` with `"startDate": "2025-01-01"`. In the page script in `research/index.qmd`, calculate the current quarter: whole months since the start date ÷ 3, rounded down, plus 1 (November 2026 = Q8). Update the README section that tells Connor to edit `currentQuarter`.
- [x] **Template page (`template.qmd`).** Replace the full setup guide with a short landing page: two sentences on what the template is, a link to the guide in the template repo (https://github.com/ccicm/academic-website-template), and a link to its live demo once step 6 creates it. This removes Connor's ORCID ID and the `.Rproj` step from the old guide.
- [x] **Contact page (`contact.qmd`).** No public email address is required: Connor chose to keep the contact form as the only contact method.
- [x] **Teaching page (`teaching.qmd`).** Add "BESC1403 Personal Identity and Community" to the RMIT list. The page is currently hidden from the navbar at Connor's request.
- [x] **Zenodo concept DOIs.** Query `https://zenodo.org/api/records/22707559` and `.../22707557`, read the `conceptdoi` field, and use the concept DOIs on `research/projects.qmd` and the Publications page.
- [x] **Talks data.** Create `data/talks.yml` with the two talks from Reference facts (date, title, event, role, link). On the home page, make the feature card read it: before an event's date it says "Upcoming event"; after, "Recent talk". (There is no CV page, so the home card is the only place talks appear.)

## Done when

- No page calls Paper 3 "population-level"
- The timeline shows Q8 for November 2026 with no hand-set quarter in the JSON
- `/template` is a short landing page with no ORCID ID or `.Rproj` instructions
- Contact shows an email address (once Connor confirms which)
- Teaching lists BESC1403
- Projects uses the concept DOIs
- After 19 November the home card says "Recent talk" without anyone editing it
