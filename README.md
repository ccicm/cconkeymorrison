# cconkeymorrison — Academic Website

A Quarto-based academic website deployed to GitHub Pages at [connorconkeymorrison.com](https://connorconkeymorrison.com).

---

## What this is

A static website built with [Quarto](https://quarto.org), version-controlled with Git, and automatically deployed to GitHub Pages on every push to `main`. There is no R execution required — all content is plain Quarto markdown. A custom domain (`connorconkeymorrison.com`) is configured via Namecheap DNS.

---

## File structure

```
cconkeymorrison/
├── index.qmd                  # Home page
├── pages/
│   ├── research.qmd           # Research & publications
│   ├── history.qmd            # Education & experience
│   └── contact.qmd            # Contact & appointments
├── styles.css                 # All visual styling
├── _quarto.yml                # Site configuration (navbar, theme, fonts)
├── images/                    # Profile photo and other images
├── CNAME                      # Custom domain — do not delete
└── .github/workflows/         # GitHub Actions — handles automatic deployment
```

---

## How to make changes

1. Open the project in RStudio (`cconkeymorrison.Rproj` or **File > Open Project**)
2. Edit the relevant `.qmd` file in `pages/` (or `index.qmd` for the home page)
3. Preview locally: click **Render** in RStudio, or run `quarto preview` in the Terminal
4. Commit everything and push — GitHub Actions deploys automatically within ~2 minutes

No R packages are needed. All pages render as plain Quarto markdown.

> **Note:** Do not delete the `CNAME` file in the repo root. It tells GitHub Pages to serve the site at `connorconkeymorrison.com`. Deleting it will break the custom domain.

---

## Updating publications

Publications are listed as static markdown in `pages/research.qmd` under the `## Publications` heading. To add a new one:

1. Open `pages/research.qmd`
2. Find the correct year block (or add a new one if needed)
3. Add a new entry following this format:

```markdown
::: pub-entry
[Title of paper](https://doi.org/...){.pub-title}\
[Journal Name]{.pub-journal}
:::
```

4. Commit and push — GitHub Actions deploys automatically

---

## Updating the PhD status strip

The status strip on the Research page is in `pages/research.qmd` inside the `::: phd-status-strip` block. Each item has a `.status-label` and a `.status-value`. Colour variants are:

| Class | Colour | Use for |
|---|---|---|
| `.status-good` | Green | Completed milestones (Ethics approved, data granted) |
| `.status-WIP` | Gold | Work in progress |
| `.status-goal` | Blue | Future targets (estimated completion year) |
| *(none)* | Navy | Neutral status |

---

## Deployment

Deployment is automatic via GitHub Actions (`.github/workflows/`). Every push to `main` triggers a build and deploy. No R installation is required in the workflow — the site renders as plain markdown.

Build logs: `https://github.com/ccicm/cconkeymorrison/actions`

If a build fails, check the Actions log. The most common cause is a malformed `.qmd` file (unclosed fenced div `:::` blocks are the usual culprit).

---

## Custom domain

The site is served at `connorconkeymorrison.com` via:
- A `CNAME` file in the repo root containing `connorconkeymorrison.com`
- Four A records and one CNAME record set in Namecheap's Advanced DNS
- "Enforce HTTPS" enabled in GitHub Pages settings

Do not change the `CNAME` file or the GitHub Pages custom domain setting without also updating the DNS records (Namecheap).
