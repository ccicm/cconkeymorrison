# cconkeymorrison — Academic Website

A Quarto-based academic website deployed to GitHub Pages at [connorconkeymorrison.com](https://connorconkeymorrison.com).

---

## What this is

A static website built with [Quarto](https://quarto.org), version-controlled with Git, and automatically deployed to GitHub Pages on every push to `main`. No R execution required — all content is plain Quarto markdown with a raw HTML/JS block on the research page handling live data fetching. A custom domain (`connorconkeymorrison.com`) is configured via Namecheap DNS.

---

## File structure

```
cconkeymorrison/
├── index.qmd                  # Home page
├── pages/
│   ├── research.qmd           # Research & publications (ORCID + Crossref live fetch)
│   ├── history.qmd            # Education & experience
│   ├── contact.qmd            # Contact form (Web3Forms)
│   ├── projects.qmd           # Side projects and tools
│   └── template.qmd           # Public template setup guide
├── styles.css                 # All visual styling
├── _quarto.yml                # Site configuration (navbar, theme, fonts)
├── images/                    # Profile photo and other images
├── favicon.svg                # Favicon source
├── favicon.ico                # Favicon (compiled)
├── CNAME                      # Custom domain — do not delete
└── .github/workflows/         # GitHub Actions — handles automatic deployment
```

---

## How to make changes

1. Open the project in RStudio (`cconkeymorrison.Rproj` or **File > Open Project**)
2. Edit the relevant `.qmd` file in `pages/` (or `index.qmd` for the home page)
3. Preview locally: run `quarto preview` in the Terminal
4. Commit everything and push — GitHub Actions deploys automatically within ~2 minutes

No R packages are needed. All pages render as plain Quarto markdown.

> **Note:** Do not delete the `CNAME` file in the repo root. It tells GitHub Pages to serve the site at `connorconkeymorrison.com`. Deleting it will break the custom domain.

---

## Publications (ORCID + Crossref)

Publications load automatically — no manual list to maintain. The research page fetches live from two APIs on page load:

- **ORCID** (`pub.orcid.org`) — works summary list, then full per-paper records for contributor/author data
- **Crossref** (`api.crossref.org`) — journal-level URLs derived from each DOI

All fetches run in parallel. The page shows the 6 most recent publications, each with:
- Journal favicon (Google favicon service via publisher domain)
- Linked journal name (Crossref-derived URL)
- Copy APA 7 button (full author list from ORCID)
- Download RIS button
- "Synced from ORCID · date" footer + "View all on Google Scholar" link

**To update:** Add the new paper to your ORCID profile and make sure it's set to public. It will appear on the site automatically on the next page load.

**Key constants** in the `<script>` block at the bottom of `pages/research.qmd`:

```js
const ORCID_ID = '0009-0000-1020-2333';
const SCHOLAR_URL = 'https://scholar.google.com/citations?user=ZEvUL_kAAAAJ&hl=en';
const MAX_PUBS = 6;
```

**Fallback:** If the ORCID API is unreachable, the page falls back to a hardcoded static list of the four current publications with known author strings and journal URLs. Update this fallback when adding significant new papers.

---

## Updating the PhD status strip

The status strip on the Research page is in `pages/research.qmd` inside the `::: phd-status-strip` block. Each item has a `.status-label` and a `.status-value`. Colour variants are:

| Class | Colour | Use for |
|---|---|---|
| `.status-good` | Green | Completed milestones |
| `.status-WIP` | Gold | Work in progress |
| `.status-goal` | Blue | Future targets |
| *(none)* | Navy | Neutral status |

---

## Contact form (Web3Forms)

The contact page uses [Web3Forms](https://web3forms.com) for form submissions — no backend needed. The access key is embedded in `pages/contact.qmd` in the hidden input field. Submissions go to `connorconkeymorrison@gmail.com`. The form has four inquiry types (Research, Teaching, Clinical, General) that scaffold different fields.

If the key ever needs replacing: get a new one free at web3forms.com and swap it in the `value` attribute of the `<input type="hidden" name="access_key">` field.

---

## Deployment

Automatic via GitHub Actions (`.github/workflows/`). Every push to `main` triggers a build and deploy. No R installation is required — the site renders as plain markdown.

Build logs: `https://github.com/ccicm/cconkeymorrison/actions`

If a build fails, check the Actions log. Most common causes:
- Unclosed `:::` fenced div in a `.qmd` file
- Malformed YAML front matter

---

## Custom domain

The site is served at `connorconkeymorrison.com` via:
- A `CNAME` file in the repo root containing `connorconkeymorrison.com`
- Four A records and one CNAME record set in Namecheap's Advanced DNS
- "Enforce HTTPS" enabled in GitHub Pages settings

Do not change the `CNAME` file or the GitHub Pages custom domain setting without also updating the DNS records in Namecheap.
