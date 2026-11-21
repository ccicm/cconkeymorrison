# 04: Automation and checks

Goal: nothing on the site needs hand-editing, and broken links or accessibility regressions fail the build. **Needs Connor first:** the GoatCounter site code (see `00-start-here.md`).

## Checklist

- [x] **GoatCounter.** The script is in `_quarto.yml` and tracks DOI, profile and contact-form events.
- [x] **Crossref enrichment.** `_scripts/fetch_metrics.py` enriches publications and keeps previous values on failure.
- [x] **Zenodo records.** Zenodo records feed `data/software.json` and the Projects/Publications pages.
- [x] **Link checker.** Pull-request checks run Lychee on the rendered site.
- [x] **Accessibility check.** Pull-request checks run pa11y-ci against WCAG 2.2 AA.
- [x] **Dependabot.** `.github/dependabot.yml` checks GitHub Actions weekly.
- [x] **Review reminders.** A scheduled workflow creates quarterly analytics issues and a 2027 job-search review issue.
- [x] **README.** The README documents data pulls, sources, checks and metrics.

## Done when

- GoatCounter shows visits (check the dashboard the day after merge)
- `data/publications.json` entries include volume and issue where Crossref has them
- The Projects page DOIs come from `data/software.json`
- A pull request with a deliberately broken link fails the link check
- The accessibility check runs on every pull request
- `dependabot.yml` and the reminders workflow exist
