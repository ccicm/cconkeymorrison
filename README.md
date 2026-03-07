# cconkeymorrison — Academic Website

A Quarto-based academic website deployed to GitHub Pages.

---

## What this is

A static website built with [Quarto](https://quarto.org), version-controlled with Git and automatically deployed to GitHub Pages on every push to `main`. There is no R execution required — all content is plain Quarto markdown.

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
├── _quarto.yml                # Site configuration (navbar, theme)
├── images/                    # Profile photo and other images
└── .github/workflows/         # GitHub Actions — handles automatic deployment
```

---

## How to make changes

1. Open the project in RStudio (`cconkeymorrison.Rproj` or File > Open Project)
2. Edit the relevant `.qmd` file in the `pages/` folder
3. Preview locally by clicking **Render** in RStudio, or running `quarto preview` in the Terminal
4. Commit everything and push — GitHub Actions deploys automatically

No R packages are needed. All pages render as plain Quarto markdown.

---

## Updating publications

Publications are listed as static markdown in `pages/research.qmd` under the `## Publications` heading. To add a new one:

1. Open `pages/research.qmd`
2. Add a new entry under the correct year block (or add a new year block if needed), following the existing format:

```
[Title of paper](https://doi.org/...)  \
*Journal Name*
```

3. Commit and push — GitHub Actions deploys automatically

---

## Deployment

Deployment is automatic via GitHub Actions (`.github/workflows/`). Every push to `main` triggers a build and deploy. No R installation is required in the workflow.

Build logs: `https://github.com/cconkeymorrison/cconkeymorrison/actions`
