# 06: Template repo (separate session)

Do this in the **ccicm/academic-website-template** repo, not the website repo. Open a separate Codespace for it.

**Status: not started/verified in this workspace.** This checklist remains to be performed in the separate repository.

## Fix now

- [ ] Add `LICENSE` (MIT) for the code, and state in the README that the guide text is CC BY 4.0
- [ ] Delete `CNAME.txt` (it contains connorconkeymorrison.com)
- [ ] Replace `data/reading.json` with two or three neutral example entries (it currently ships Connor's EBSA reading notes)
- [ ] Delete `rpackages.R` (it wrongly says publications are maintained as static markdown)
- [ ] Move `readinglist_appscript.gs` into `_scripts/`
- [ ] In `template.qmd`, remove the "select the `.Rproj` file" step (there is no `.Rproj`) and make sure every ID is a placeholder (`YOUR-ORCID-ID`, `YOUR-ACCESS-KEY`)

## One guide

- [ ] Make this repo's `template.qmd` the only copy of the setup guide (Connor's site now links here)
- [ ] Add GitHub issue templates (bug report, question) and point all support there

## Live demo and visibility

- [ ] Publish a live demo through this repo's GitHub Pages with the placeholder content; add the demo link and a screenshot to the README
- [ ] Add a repo description and topics: `quarto`, `academic-website`, `github-pages`, `orcid`
- [ ] Prepare a submission to awesome-quarto (Connor submits it)
- [ ] Tag a release (v1.0.0) with a short `CHANGELOG.md`

## Bring improvements over from Connor's site

- [ ] The accessible colour approach (separate text accent), focus outlines and reduced-motion rules
- [ ] Real page titles and descriptions, `site-url`, `lang`, Open Graph and Twitter cards, with placeholders
- [ ] The weekly metrics workflow and `fetch_metrics.py`, as an optional step with placeholder IDs and clear instructions
- [ ] The timeline `startDate` calculation in place of `currentQuarter`
- [ ] The contact form honeypot and accessible status message

## Done when

- The repo has a licence, no personal data, one guide and a working demo site
- A new user can follow the guide without meeting Connor's ORCID ID, domain or reading notes
