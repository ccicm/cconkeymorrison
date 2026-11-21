# Website hand-over: start here

These files are a chain. Work through them in order, one per Copilot session (or one pull request each). Don't start the next file until the previous pull request is merged and the site builds.

| Step | File | Who | Rough size |
|---|---|---|---|
| 0 | This file: your own account steps | Connor | 20 min |
| 1 | `01-fix-first.md` | Agent | Small |
| 2 | `02-finish-content.md` | Agent | Medium |
| 3 | `03-contrast-performance.md` | Agent | Small |
| 4 | `04-automation-and-checks.md` | Agent | Medium |
| 5 | `05-visibility-accessibility.md` | Agent | Medium |
| 6 | `06-template-repo.md` | Agent, in the template repo | Medium |

## Current status

Steps 1–5 are implemented in this repository and have passed `quarto render` where applicable. The remaining work is limited to account verification, manual Google Search Console setup, and the separate template-repository task in step 6.

Step 2's contact decision is settled: **do not show a public email address**. The contact form remains the only contact method.

Step 6 is outside this workspace and has not been started or verified here.

## How to hand each file to the agent

Paste this, changing the file name each time:

> Read `_handover/00-start-here.md` (Guardrails and Reference facts) and `_handover/0X-....md`. Before changing anything, list every checklist item in 0X back to me. Then do them one at a time. When finished, show the list again with each item marked **done**, **skipped (reason)** or **needs Connor**. Run `quarto render` and fix any errors before opening the pull request. Don't change anything listed under "Settled on purpose".

Then check the agent's list against the file's "Done when" section before you merge.

## Your own steps (the agent can't do these)

- [ ] **Needs Connor — SerpApi:** confirm a repository secret named `SERPAPI_KEY` exists and that the latest Actions run reports a live citation count.
- [ ] **Needs Connor — ORCID:** switch on Crossref auto-update in your ORCID account.
- [ ] **Needs Connor — Google Search Console:** verify `connorconkeymorrison.com` and submit the sitemap after step 5 is complete.
- [ ] **Needs Connor — Web3Forms:** restrict the access key to your domain.
- [ ] **Needs Connor — Reading list:** check and diarise renewal of the GitHub token used by the Apps Script.
- [ ] **Needs Connor — RMIT profile:** confirm the RMIT profile URL to use in JSON-LD `sameAs`, if a different URL is required.

## Settled on purpose (no agent changes these)

- The hero is a general bio with no aside
- No stats strip on the home page
- Policy is a section on the research page, not its own page
- Resources is its own page in the More menu
- **No CV page at all** (removed in step 1), no Practice page, no downloadable CV or resume, and nothing added from Connor's resume
- No Writing link in the menu until there are three or more posts

## Guardrails (apply to every file)

1. **Never publish anything about manuscripts under review:** no titles, journals, submission dates or counts, in pages or in `data/` files (the `data/` folder is public). A plain "under review" status on a PhD paper card, with no journal, is the limit.
2. **No unpublished findings:** no numbers or specific results from Paper 2 or Paper 3. Policy lines that imply a finding are fine.
3. **AHPRA:** Connor is a **provisional psychologist**. Never "psychologist" alone, no testimonials and no outcome claims.
4. **CatholicCare Victoria** doesn't appear anywhere on the site.
5. **No internal names or acronyms:** never "Work Stream 1", "HIPI", "AISAB", "GAILE" or "Digital Minds Lab"; say "the Digital Minds team" and describe roles in plain terms.
6. **Leave off:** any paper that isn't published or accepted (other than the three PhD paper cards), any role or application that isn't confirmed, and any home address.
7. **LSAC Variable Explorer:** link only the public Zenodo records. Never link the private working build.
8. **Don't touch:** `CNAME`, the GitHub Pages domain setting, or the Web3Forms access key.
9. **Facts only from Reference facts below.** If something isn't there, mark it **needs Connor**; don't guess.
10. Refer to Connor by name, never with gendered pronouns. Keep Connor's own wording where a page already has it.

## Reference facts

**Identifiers**

| Item | Value |
|---|---|
| ORCID | 0009-0000-1020-2333 |
| Google Scholar ID | ZEvUL_kAAAAJ |
| PROSPERO (Paper 1) | CRD420251089918 |
| PhD | RMIT University, School of Health and Biomedical Sciences; started February 2025; completion 2027 |
| Thesis title | School Attendance Problems: Definitions, Patterns, and System-Level Implications |
| Framework | KiTeS: Melvin et al. (2019), *Frontiers in Education*, https://doi.org/10.3389/feduc.2019.00061 |
| Supervisors | A/Prof Vasileios Stavropoulos, Dr Daniel Zarate, Dr Taylor Brown |
| Milestones | Confirmation Q5 (passed April 2026), Milestone 2 Q8 (October 2026), Milestone 3 Q12 (about October 2027). Quarters are calendar quarters from January 2025. |
| PhD papers | Paper 1: systematic review (evidence level), under review. Paper 2: LSAC emotional symptoms and absence (population level), preparing for submission. Paper 3: ACARA and LSAC school-level data (system level), data preparation. |

**Publications (published order, from the journals).** The site should render these from `data/publications.json` (the ORCID pull), not from this list. Use it only to check.

1. Gomez, R., Hein, K., Conkey-Morrison, C., Stavropoulos, V., & Zarate, D. (2026). The CBCL DSM-oriented somatic problems scale: Measurement invariance across sex, informant, ethnicity, and time. *BMC Psychology*. https://doi.org/10.1186/s40359-026-05842-2
2. Brown, T., Hunt, B., Conkey-Morrison, C., Burleigh, T. L., Stavropoulos, V., & Lubman, D. I. (2026). Beyond screen time: Evidence-based assessment and early intervention for problematic digital use in young people. *Australian Journal of General Practice, 55*(11). https://doi.org/10.31128/AJGP-11-25-7903
3. Zarate, D., Jarrad, J., Stavropoulos, V., Conkey-Morrison, C., & Hunt, B. (2026). Mental health, personality, and cross-addictions as predictors of social media addiction: A machine learning longitudinal study. *Addictive Behaviors Reports*. https://doi.org/10.1016/j.abrep.2026.100718
4. Gomez, R., Hunt, B., & Conkey-Morrison, C. (2025). Incremental validity of cognitive impulsivity, emotional impulsivity, and sensation seeking in the predictions of ADHD inattention and hyperactivity/impulsivity symptoms in adults. *Journal of Psychopathology and Behavioral Assessment*. https://doi.org/10.1007/s10862-025-10252-6
5. Conkey-Morrison, C., Zarate, D., March, E., Hunt, B., & Stavropoulos, V. (2025). Stress-coping mechanisms and problematic social media use: A network analysis and differences across men and women. *Computers in Human Behavior Reports*. https://doi.org/10.1016/j.chbr.2025.100848
6. Burleigh, T. L., Footitt, T., Carras, M. C., Conkey-Morrison, C., Poulus, D. R., & Stavropoulos, V. (2025). Flowing in the net of disordered gaming: A network analysis approach. *Addictive Behaviors Reports*. https://doi.org/10.1016/j.abrep.2025.100606
7. Hein, K., Conkey-Morrison, C., Burleigh, T. L., Poulus, D., & Stavropoulos, V. (2024). Examining how gamers connect with their avatars to assess their anxiety: A novel artificial intelligence approach. *Acta Psychologica*. https://doi.org/10.1016/j.actpsy.2024.104298

**Software and data (Zenodo).** Two DOI pairs are in circulation: 10.5281/zenodo.22707558 / 22707556 and 10.5281/zenodo.22707559 / 22707557. Use the **concept** DOIs (they always point to the latest version); step 2 confirms which pair that is.

- LSAC Variable Explorer (Version 1.0.0) [Computer software]. Conkey-Morrison, C., Prokofieva, M., Zarate, D., Hein, K., Brown, T., & Stavropoulos, V. (2026).
- LSAC variable index (Release 10.0), reshaped for the LSAC Variable Explorer (Version 1.0.0) [Dataset]. Same authors (2026).

**Talks**

| Date | Event | Role |
|---|---|---|
| 19 November 2026 | ATN Universities 2026 Symposium, "The stubborn art of being human", RMIT Storey Hall. Panel: "[Re]claiming the art of learning in an AI-enabled world" | Student panellist |
| 17 November 2026 | RMIT roundtable on the role of AI in preventing and responding to loneliness | Needs Connor (role wording) |
