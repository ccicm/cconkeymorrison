# cconkeymorrison — Academic Website

A Quarto-based academic website deployed to GitHub Pages.

---

## What this is

This is a static website built with [Quarto](https://quarto.org), a document publishing system that runs inside RStudio. The site is version-controlled with Git and automatically deployed to GitHub Pages whenever you push changes to the `main` branch.

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
├── _quarto.yml                # Site configuration (navbar, theme, freeze setting)
├── images/                    # Profile photo and other images
├── _freeze/                   # Cached R output (committed to Git — do not delete)
└── .github/workflows/         # GitHub Actions — handles automatic deployment
```

---

## How to make changes

1. Open the project in RStudio (`cconkeymorrison.Rproj` or File > Open Project)
2. Edit the relevant `.qmd` file in the `pages/` folder
3. Preview locally by clicking **Render** in RStudio, or running `quarto preview` in the Terminal
4. When happy, run `quarto render` in the Terminal to rebuild the site and update `_freeze/`
5. Commit everything and push — GitHub Actions deploys automatically

---

## The R code in research.qmd

The publications list on the Research page is generated automatically by fetching your ORCID record at render time. This uses the `rorcid` R package.

**You only need to run this locally when you want to refresh your publications.** After running `quarto render`, commit the updated `_freeze/` folder and push — GitHub Actions will use the cached output and does not need R installed.

Your ORCID token is stored in your local `.Renviron` file (not committed to Git). If you need to re-authenticate, run `orcid_auth()` in the R console.

---

## Updating publications

1. Add the publication to your ORCID profile at [orcid.org](https://orcid.org)
2. In RStudio Terminal, delete the freeze cache and re-render:
   ```
   Remove-Item -Recurse -Force _freeze
   quarto render
   ```
3. Commit and push:
   ```
   git add _freeze/
   git commit -m "refresh publications"
   git push
   ```

---

## Deployment

Deployment is automatic via GitHub Actions (`.github/workflows/Deploy Quarto site to GitHub Pages.yml`). Every push to `main` triggers a build and deploy. The workflow does not require R — it uses the frozen chunk output in `_freeze/`.

Build logs are visible at: `https://github.com/cconkeymorrison/cconkeymorrison/actions`
