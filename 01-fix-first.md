# 01: Fix first

Things on the live site that are wrong or risky. Small, but do them before anything else.

## Checklist

- [ ] **Provisional psychologist.** `_quarto.yml` and `index.qmd` both have a description saying "Connor Conkey-Morrison is a psychologist". Change to "is a provisional psychologist". Search every `.qmd`, `_quarto.yml` and the JSON-LD block for any other "psychologist" without "provisional" and fix it.
- [ ] **KiTeS card (`research/resources.qmd`).** It credits Lester & Michelson (2024), *BMJ Mental Health*, DOI 10.1136/bmjment-2023-300944. That's wrong. KiTeS is Melvin et al. (2019), "The Kids and Teens at School (KiTeS) Framework: An inclusive bioecological systems approach to understanding school absenteeism and school attendance problems", *Frontiers in Education*, https://doi.org/10.3389/feduc.2019.00061. Fetch the full author list from `https://api.crossref.org/works/10.3389/feduc.2019.00061` and fix the card and its Copy APA 7 text.
- [ ] **Other resource cards.** Check the remaining three cards (authors, year, title, journal) against Crossref by DOI. The Elliott & Place year looks wrong. Fix anything that doesn't match.
- [ ] **Emergency numbers (`research/resources.qmd`).** Under the opening paragraph, add: "In an emergency, call 000. Lifeline: 13 11 14 (24/7). Kids Helpline: 1800 55 1800 (ages 5–25, 24/7)."
- [ ] **Remove the CV page.** Delete `cv/index.qmd` and the CV entry in the navbar's More menu. Add `aliases: [/cv/index.html, /cv/]` to the front matter of `index.qmd` so old links to the CV land on the home page. Search every page, `_quarto.yml`, the README and the JSON-LD for links to `cv/` and remove them.
- [ ] **Publications page.** Check it renders all 7 papers from `data/publications.json` with full titles and full author lists in APA style (surname, initials), and that the *AJGP* paper shows as published, not "Accepted".
- [ ] **Public under-review count.** Remove the `under_review` field from `data/metrics.json` and from the defaults and output in `_scripts/fetch_metrics.py`. Check no page reads it.
- [ ] **Stray file.** Delete `review.patch` from the repo root.

## Done when

- `grep -ri "is a psychologist"` finds nothing
- The KiTeS card shows Melvin et al. (2019), *Frontiers in Education*
- Resources shows the three emergency numbers
- `/cv/` no longer exists as a page, old CV links redirect to the home page, and nothing links to it
- The Publications page shows 7 papers with full titles and full author lists, and no "Accepted"
- `data/metrics.json` has no `under_review`
- `review.patch` is gone and `quarto render` succeeds
