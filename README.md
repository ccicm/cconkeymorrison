# cconkeymorrison — Academic Website

A Quarto-based academic website deployed to GitHub Pages at [connorconkeymorrison.com](https://connorconkeymorrison.com).

---

## What this is

A static website built with [Quarto](https://quarto.org), version-controlled with Git, and automatically deployed to GitHub Pages on every push to `main`. No R execution required — all content is plain Quarto markdown with raw HTML/JS blocks handling live data fetching. A custom domain (`connorconkeymorrison.com`) is configured via Namecheap DNS.

---

## File structure

```
cconkeymorrison/
├── index.qmd                  # Home page (hero, stats, current focus, recent reading)
├── _quarto.yml                # Site configuration (navbar, theme, fonts, resources)
├── styles.css                 # All visual styling (CSS variables at top)
├── contact.qmd                # Contact form (Web3Forms)
├── template.qmd               # Public setup guide for the academic website template
├── research/
│   ├── index.qmd              # Research overview + interactive PhD timeline
│   ├── publications.qmd       # Publications (ORCID + Crossref API)
│   ├── reading-list.qmd       # Reading list (from data/reading.json)
│   └── projects.qmd           # Research projects
├── posts/
│   ├── index.qmd              # Writing index
│   └── *.qmd                  # Individual posts
├── cv/
│   └── index.qmd              # Curriculum vitae
├── data/
│   ├── timeline.json          # PhD timeline data (read by research/index.qmd)
│   └── reading.json           # Reading list entries (synced from Google Sheet)
├── _scripts/
│   └── readinglist_appscript.gs  # Google Apps Script for reading list → GitHub sync
├── images/                    # Profile photo and other images
├── favicon.*                  # Favicon files
├── CNAME                      # Custom domain — do not delete
└── .github/workflows/         # GitHub Actions — handles automatic deployment
```

---

## How to make changes

1. Edit the relevant `.qmd` file
2. Preview locally: run `quarto preview` in the Terminal
3. Commit and push — GitHub Actions deploys automatically within ~2 minutes

No R packages are needed. All pages use `engine: markdown`.

> **Note:** Do not delete the `CNAME` file. It tells GitHub Pages to serve the site at `connorconkeymorrison.com`. Deleting it will break the custom domain.

---

## Changing colours

Open `styles.css` and edit the two variables at the top:

```css
--navy:   #1a2e4a;   /* headings, buttons, navbar */
--accent: #c8922a;   /* highlights, labels, hover states */
```

Everything else updates automatically — including the publications block and reading list, which read these values at runtime via `window.CCM_COLORS`.

---

## Publications (ORCID + Crossref)

Publications load automatically from two APIs on page load:

- **ORCID** (`pub.orcid.org`) — works summary list, then full per-paper records for author data
- **Crossref** (`api.crossref.org`) — journal-level URLs derived from each DOI

The research page shows the 6 most recent publications, each with a journal favicon, APA 7 citation copy button, and RIS download.

**To update:** Add the paper to your ORCID profile and set it to public. It appears automatically on the next page load.

**Key constants** in `research/publications.qmd`:

```js
const ORCID_ID    = '0009-0000-1020-2333';
const SCHOLAR_URL = 'https://scholar.google.com/citations?user=ZEvUL_kAAAAJ&hl=en';
const MAX_PUBS    = 6;
```

---

## Reading list

Reading list entries live in `data/reading.json`, synced automatically from a Google Sheet via the Apps Script in `_scripts/readinglist_appscript.gs`. Each entry stores full metadata:

```json
[
  {
    "doi": "10.1000/xyz123",
    "title": "Paper title",
    "authors": "Last, F., et al.",
    "year": "2024",
    "journal": "Journal Name",
    "abstract": "...",
    "note": "Why this paper is worth reading.",
    "tags": ["EBSA", "Intervention"]
  }
]
```

The homepage shows the first 3 entries; the reading list page shows all with tag filtering and search. To add entries, paste a DOI, PMID, or APA citation into the APA Input sheet — metadata is fetched automatically from Crossref. Run **Sync to website now** from the Reading List menu to push to GitHub.

---

## PhD timeline

The interactive Gantt timeline on `research/index.qmd` reads from `data/timeline.json`. Update `currentQuarter` and activity statuses (`done`, `wip`, `todo`, `goal`) there.

---

## Contact form (Web3Forms)

The contact page uses [Web3Forms](https://web3forms.com) — no backend needed. Access key is in `contact.qmd` in the hidden input field. Submissions go to `connorconkeymorrison@gmail.com`.

---

## Deployment

Automatic via GitHub Actions (`.github/workflows/`). Every push to `main` triggers a build and deploy.

Common failure causes:
- Unclosed `:::` fenced div in a `.qmd` file
- Malformed YAML front matter

---

## Custom domain

Served at `connorconkeymorrison.com` via:
- A `CNAME` file in the repo root containing `connorconkeymorrison.com`
- Four A records and one CNAME record in Namecheap Advanced DNS
- "Enforce HTTPS" enabled in GitHub Pages settings

Do not change the `CNAME` file or the GitHub Pages custom domain setting without also updating the DNS records in Namecheap.
