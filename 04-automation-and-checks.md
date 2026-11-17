# 04: Automation and checks

Goal: nothing on the site needs hand-editing, and broken links or accessibility regressions fail the build. **Needs Connor first:** the GoatCounter site code (see `00-start-here.md`).

## Checklist

- [ ] **GoatCounter.** Add the GoatCounter script to `include-after-body` in `_quarto.yml` with Connor's site code. Count events for: DOI link clicks, external profile links (ORCID, Google Scholar, LinkedIn) and contact form submissions.
- [ ] **Crossref enrichment.** In `_scripts/fetch_metrics.py`, for each DOI in the ORCID pull, fetch `https://api.crossref.org/works/<doi>` and fill `volume`, `issue`, `pages` and `container-title` where ORCID left them blank. Keep the previous value if Crossref fails. Send a polite `User-Agent` with a contact address (ask Connor which).
- [ ] **Zenodo records.** Fetch Connor's Zenodo records through `https://zenodo.org/api/records?q=creators.orcid:0009-0000-1020-2333` into `data/software.json`, and render the Projects page's LSAC Explorer DOIs (and a Software and data list on the Publications page) from it.
- [ ] **Link checker.** Add a GitHub Actions job (lychee) that checks the rendered `_site` on every pull request and fails on broken links. Allow known slow sites to retry.
- [ ] **Accessibility check.** Add pa11y-ci (or axe) on the rendered pages for every pull request, WCAG2AA standard, failing on errors.
- [ ] **Dependabot.** Add `.github/dependabot.yml` for GitHub Actions versions, weekly.
- [ ] **Review reminders.** Add a scheduled workflow that opens a GitHub issue on set dates: the first of each quarter ("Review analytics"), and 1 February 2027 ("Review the site before the 2027 job search").
- [ ] **README.** Update it to describe the weekly data pull, the checks, and where each number comes from.

## Done when

- GoatCounter shows visits (check the dashboard the day after merge)
- `data/publications.json` entries include volume and issue where Crossref has them
- The Projects page DOIs come from `data/software.json`
- A pull request with a deliberately broken link fails the link check
- The accessibility check runs on every pull request
- `dependabot.yml` and the reminders workflow exist
