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
├── pages/
│   ├── research.qmd           # Research & publications (ORCID + Crossref, recent reading)
│   ├── history.qmd            # Education & experience
│   ├── contact.qmd            # Contact form (Web3Forms)
│   ├── npe-knowledgebase.qmd   # Public NPE KnowledgeBase landing page and access request form
│   ├── projects.qmd           # Side projects and tools
│   └── template.qmd           # Public template setup guide
├── styles.css                 # All visual styling (CSS variables at top)
├── _quarto.yml                # Site configuration (navbar, theme, fonts, resources)
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

## Changing colours

Open `styles.css` and edit the two variables at the top:

```css
--dark:   #1e3a2a;   /* headings, buttons, navbar */
--accent: #c05a4a;   /* highlights, labels, hover states */
```

Any hex colour works. Everything else updates automatically — including the publications block and reading list, which read these values at runtime via `window.CCM_COLORS`.

---

## Publications (ORCID + Crossref)

Publications load automatically — no manual list to maintain. The research page fetches live from two APIs on page load:

- **ORCID** (`pub.orcid.org`) — works summary list, then full per-paper records for contributor/author data
- **Crossref** (`api.crossref.org`) — journal-level URLs derived from each DOI

The page shows the 6 most recent publications, each with a journal favicon, linked journal name, Copy APA 7 button, Download RIS button, and a "Synced from ORCID" footer.

**To update:** Add the new paper to your ORCID profile and set it to public. It appears automatically on the next page load.

**Key constants** in the `<script>` block at the bottom of `pages/research.qmd`:

```js
const ORCID_ID = '0009-0000-1020-2333';
const SCHOLAR_URL = 'https://scholar.google.com/citations?user=ZEvUL_kAAAAJ&hl=en';
const MAX_PUBS = 6;
```

**Fallback:** If the ORCID API is unreachable, the page falls back to a hardcoded static list. Update this fallback when adding significant new papers.

---

## Recent reading

A curated list of papers shown on the homepage (3 entries) and research page (up to 5). The list is inlined directly in each page's script block — no external file needed.

**To update:** In both `index.qmd` and `pages/research.qmd`, find the `READING` array near the top of the script block:

```js
const READING = [
  { doi: '10.1000/xyz123', note: 'Why this paper is worth reading.' },
  ...
];
```

Add, remove, or edit entries. Keep both files in sync — the homepage shows the first 3, the research page shows up to 5.

---

## Updating the PhD status strip

In `pages/research.qmd` inside the `::: phd-status-strip` block. Colour variants:

| Class | Colour | Use for |
|---|---|---|
| `.status-good` | Green | Completed milestones |
| `.status-WIP` | Gold | Work in progress |
| `.status-goal` | Blue | Future targets |
| *(none)* | Dark | Neutral status |

---

## Contact form (Web3Forms)

The contact page uses [Web3Forms](https://web3forms.com) — no backend needed. Access key is in `pages/contact.qmd` in the hidden input field. Submissions go to `connorconkeymorrison@gmail.com`. Three inquiry types: Research & collaboration, General, Report a website bug.

If the key ever needs replacing: get a new one free at web3forms.com and swap it in the `value` attribute of `<input type="hidden" name="access_key">`.

---

## Deployment

Automatic via GitHub Actions (`.github/workflows/`). Every push to `main` triggers a build and deploy.

Build logs: `https://github.com/ccicm/cconkeymorrison/actions`

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
