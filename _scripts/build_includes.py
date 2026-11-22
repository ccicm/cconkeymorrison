#!/usr/bin/env python3
"""
Pre-render script: generate _includes/*.html from data/*.json and data/*.yml.
Runs as a Quarto pre-render step before each site build.

talks.yml  description field: plain text — will be HTML-escaped.
featured.yml blurb field:     raw HTML — output as-is (never escape).
"""
from __future__ import annotations

import html
import json
import re
import subprocess
from datetime import datetime, timezone
from pathlib import Path

import yaml  # pip install pyyaml

ROOT = Path(__file__).resolve().parents[1]
INCLUDES_DIR = ROOT / "_includes"
DATA_DIR = ROOT / "data"

TOTAL_QS = 16
PAPER_COLORS: dict[int, str] = {
    1: "#2d7a4f",
    2: "var(--accent-text)",
    3: "var(--navy)",
    0: "var(--text-muted)",
}
STATUS_COLORS = {"done": "#2d7a4f", "wip": "#767372", "todo": "#6b6560", "goal": "#c8922a"}

DOI_DOMAINS = {
    "10.1016": "sciencedirect.com", "10.1007": "springer.com",  "10.1038": "nature.com",
    "10.1186": "biomedcentral.com", "10.1002": "wiley.com",     "10.1111": "wiley.com",
    "10.1080": "tandfonline.com",   "10.4324": "routledge.com", "10.1037": "apa.org",
    "10.1027": "hogrefe.com",       "10.1177": "sagepub.com",   "10.1093": "oup.com",
    "10.1017": "cambridge.org",     "10.1371": "plos.org",      "10.1136": "bmj.com",
    "10.3389": "frontiersin.org",   "10.3390": "mdpi.com",      "10.1521": "guilford.com",
    "10.1159": "karger.com",        "10.1515": "degruyter.com", "10.1108": "emerald.com",
    "10.31128": "racgp.org.au",
}

TAG_GROUPS: dict[str, dict] = {
    "School attendance": {
        "color": "#2d6a4f",
        "tags": {
            "EBSA", "Chronic absenteeism", "Re-engagement", "Transition",
            "Systems model", "Systems framework", "Systems theory", "Education system",
            "Education outcomes", "Student voice", "School staff", "Developmental",
            "Definitions", "Framework", "Differentiation",
        },
    },
    "Interventions": {
        "color": "#b04e3f",
        "tags": {
            "Intervention", "CBT", "DBT", "Mindfulness", "VR", "Pharmacology",
            "Multifamily therapy", "Family coaching", "RCT", "Feasibility",
            "Treatment outcomes", "Rehabilitation", "Intervention development",
            "Intervention outcomes", "CBT play therapy", "CBT programme",
            "School-based CBT", "Parent program",
        },
    },
    "Population & context": {
        "color": "#7b4f9e",
        "tags": {
            "Autism", "Neurodiversity", "Parent", "Anxiety", "Mental health",
            "Psychopathology", "Comorbidity", "ACEs", "Gender", "Bullying",
            "Individual differences", "Parent experience", "Inclusion",
            "Parent factors", "Personality", "Behavioural addiction",
        },
    },
    "Study design": {
        "color": "#2c6e8a",
        "tags": {
            "Systematic review", "Scoping review", "Meta-analysis", "Qualitative",
            "RCT", "Methods", "Risk of bias", "Measurement", "Network analysis",
            "Measurement tool", "Clinical review", "Practitioner review", "Review",
            "Foundational", "Editorial", "Clinical synthesis", "Conceptual",
        },
    },
    "Digital & AI": {
        "color": "#8a5c1a",
        "tags": {"Digital", "AI", "Machine learning", "Creativity", "Digital feasibility"},
    },
}


# ── helpers ───────────────────────────────────────────────────────────────────

def e(text: object) -> str:
    """HTML-escape a value for use in element text or attribute values."""
    return html.escape(str(text)) if text is not None else ""


def read_json(path: Path) -> object:
    return json.loads(path.read_text(encoding="utf-8"))


def read_yaml(path: Path) -> object:
    with path.open(encoding="utf-8") as f:
        return yaml.safe_load(f)


def format_date_au(dt: datetime) -> str:
    return f"{dt.day} {dt.strftime('%B %Y')}"


def tag_color(tag: str) -> str:
    for g in TAG_GROUPS.values():
        if tag in g["tags"]:
            return g["color"]
    return "#1a2e4a"


def book_svg() -> str:
    return (
        '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="18" height="18"'
        ' viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"'
        ' stroke-linecap="round" stroke-linejoin="round">'
        '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>'
        '<path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>'
        '</svg>'
    )


def pub_icon_html(doi: str | None) -> str:
    if doi:
        prefix = doi.split("/")[0]
        domain = DOI_DOMAINS.get(prefix)
        if domain:
            return (
                f'<img class="pub-favicon"'
                f' src="https://www.google.com/s2/favicons?domain={domain}&sz=64"'
                f' alt=""'
                f" onerror=\"this.style.display='none';this.nextElementSibling.style.display='flex';\">"
                f'<div class="pub-favicon-fallback" style="display:none;">{book_svg()}</div>'
            )
    return f'<div class="pub-favicon-fallback">{book_svg()}</div>'


def bold_connor(authors_html: str) -> str:
    return re.sub(
        r"(Connor Conkey-Morrison|Conkey-Morrison,\s*(?:C\.|Connor))",
        r'<span class="pub-author-name">\1</span>',
        authors_html,
    )


def build_apa(w: dict) -> str:
    authors = w.get("authors") or "Conkey-Morrison, C."
    year = w.get("year") or "n.d."
    title = w.get("title") or ""
    journal = w.get("journal") or ""
    volume = w.get("volume") or ""
    issue = w.get("issue") or ""
    pages = w.get("pages") or ""
    doi = w.get("doi") or ""
    vol_part = f", {volume}" if volume else ""
    issue_part = f"({issue})" if issue else ""
    pages_part = f", {pages}" if pages else ""
    doi_part = f" https://doi.org/{doi}" if doi else ""
    journal_part = f" {journal}{vol_part}{issue_part}{pages_part}." if journal else ""
    return f"{authors} ({year}). {title}.{journal_part}{doi_part}"


def build_ris(w: dict) -> str:
    lines = ["TY  - JOUR"]
    for a in (w.get("authors") or "Conkey-Morrison, Connor").split(", "):
        a = a.strip()
        if a:
            lines.append(f"AU  - {a}")
    lines.append(f"TI  - {w.get('title') or ''}")
    if w.get("journal"):
        lines.append(f"JO  - {w['journal']}")
    if w.get("year"):
        lines.append(f"PY  - {w['year']}")
    if w.get("volume"):
        lines.append(f"VL  - {w['volume']}")
    if w.get("issue"):
        lines.append(f"IS  - {w['issue']}")
    if w.get("pages"):
        lines.append(f"SP  - {w['pages']}")
    if w.get("doi"):
        lines.append(f"DO  - {w['doi']}")
        lines.append(f"UR  - https://doi.org/{w['doi']}")
    lines.append("ER  - ")
    return "\r\n".join(lines)


def dot_svg(status: str, size: int = 7) -> str:
    c = STATUS_COLORS.get(status, STATUS_COLORS["todo"])
    s4 = size + 4
    if status == "done":
        return (
            f'<span class="sr-only">completed</span>'
            f'<svg aria-hidden="true" width="{s4}" height="{s4}" viewBox="0 0 14 14">'
            f'<circle cx="7" cy="7" r="6" fill="{c}" opacity="0.15"/>'
            f'<path d="M4 7.2L6.2 9.4L10 4.6" stroke="{c}" stroke-width="1.8"'
            f' fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>'
        )
    if status == "wip":
        return (
            f'<span class="sr-only">in progress</span>'
            f'<span aria-hidden="true" style="width:{size}px;height:{size}px;'
            f'border-radius:50%;background:{c};display:inline-block;'
            f'box-shadow:0 0 0 3px {c}20;"></span>'
        )
    if status == "goal":
        return (
            f'<span class="sr-only">goal</span>'
            f'<span aria-hidden="true" style="width:{size}px;height:{size}px;'
            f'border-radius:50%;border:1.5px dashed {c};display:inline-block;"></span>'
        )
    return (  # todo
        f'<span class="sr-only">to do</span>'
        f'<span aria-hidden="true" style="width:{size}px;height:{size}px;'
        f'border-radius:50%;border:1.5px solid {c};display:inline-block;opacity:0.5;"></span>'
    )


def render_bar_html(activity: dict, paper_color: str) -> str:
    statuses = sorted(
        [(int(q), s) for q, s in activity["statuses"].items()],
        key=lambda x: x[0],
    )
    min_q, max_q = statuses[0][0], statuses[-1][0]
    left = (min_q - 1) / TOTAL_QS * 100
    width = (max_q - min_q + 1) / TOTAL_QS * 100
    parts = [
        f'<div class="tl-bar-track" style="left:{left:.3f}%;width:{width:.3f}%;'
        f'background:color-mix(in srgb, {paper_color} 15%, transparent);"></div>'
    ]
    for q, sym in statuses:
        if max_q == min_q:
            dot_left = left + width / 2
        else:
            dot_left = left + ((q - min_q) / (max_q - min_q)) * width
        parts.append(
            f'<div class="tl-bar-dot" style="left:{dot_left:.3f}%;">'
            f"{dot_svg(sym, 8)}</div>"
        )
    return "".join(parts)


def overall_status(statuses: dict) -> str:
    vals = list(statuses.values())
    if all(v == "done" for v in vals):
        return "done"
    if "wip" in vals:
        return "wip"
    if "todo" in vals:
        return "todo"
    return "goal"


def current_quarter(start_date_str: str) -> int:
    start = datetime(
        int(start_date_str[:4]), int(start_date_str[5:7]), 1, tzinfo=timezone.utc
    )
    now = datetime.now(timezone.utc)
    months = (now.year - start.year) * 12 + now.month - start.month
    return max(1, min(TOTAL_QS, months // 3 + 1))


# ── include generators ────────────────────────────────────────────────────────

_COPY_DOWNLOAD_JS = """\
<script>
function _buildAPA(w) {
  var authors = w.authors || 'Conkey-Morrison, C.';
  var journal = w.journal || '';
  var vol = w.volume ? ', ' + w.volume : '';
  var issue = w.issue ? '(' + w.issue + ')' : '';
  var pages = w.pages ? ', ' + w.pages : '';
  var doi = w.doi ? ' https://doi.org/' + w.doi : '';
  return authors + ' (' + (w.year || 'n.d.') + '). ' + w.title + '.' +
    (journal ? ' ' + journal + vol + issue + pages + '.' : '') + doi;
}
function _buildRIS(w) {
  var lines = ['TY  - JOUR'];
  (w.authors || 'Conkey-Morrison, Connor').split(', ').filter(Boolean)
    .forEach(function(a) { lines.push('AU  - ' + a); });
  lines.push('TI  - ' + (w.title || ''));
  if (w.journal) lines.push('JO  - ' + w.journal);
  if (w.year) lines.push('PY  - ' + w.year);
  if (w.volume) lines.push('VL  - ' + w.volume);
  if (w.issue) lines.push('IS  - ' + w.issue);
  if (w.pages) lines.push('SP  - ' + w.pages);
  if (w.doi) { lines.push('DO  - ' + w.doi); lines.push('UR  - https://doi.org/' + w.doi); }
  lines.push('ER  - ');
  return lines.join('\\r\\n');
}
document.querySelectorAll('.pub-cite-btn[data-idx]').forEach(function(btn) {
  btn.addEventListener('click', function() {
    var idx = parseInt(btn.dataset.idx, 10);
    navigator.clipboard.writeText(_buildAPA(PUB_WORKS[idx])).then(function() {
      btn.textContent = 'Copied!'; btn.classList.add('copied');
      setTimeout(function() { btn.textContent = 'Copy APA 7'; btn.classList.remove('copied'); }, 2000);
    });
  });
});
document.querySelectorAll('.pub-cite-btn[data-ris-idx]').forEach(function(btn) {
  btn.addEventListener('click', function() {
    var w = PUB_WORKS[parseInt(btn.dataset.risIdx, 10)];
    var blob = new Blob([_buildRIS(w)], {type: 'application/x-research-info-systems'});
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = (w.title || 'reference').slice(0, 40).replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.ris';
    a.click(); URL.revokeObjectURL(url);
  });
});
</script>"""


def gen_publications(works: list, updated_str: str = "") -> str:
    pub_works_data = [
        {
            "title": w.get("title"),
            "year": w.get("year"),
            "journal": w.get("journal"),
            "doi": w.get("doi"),
            "authors": w.get("authors"),
            "volume": w.get("volume"),
            "issue": w.get("issue"),
            "pages": w.get("pages"),
        }
        for w in works
    ]

    by_year: dict = {}
    for w in works:
        y = w.get("year") or "n.d."
        by_year.setdefault(y, []).append(w)

    rows: list[str] = []
    idx = 0
    for year in sorted(by_year.keys(), key=lambda y: -(int(y) if str(y).isdigit() else 0)):
        rows.append(f'<span class="pub-year-head">{e(year)}</span>')
        for w in by_year[year]:
            i = idx
            idx += 1
            doi = w.get("doi")
            article_href = f"https://doi.org/{doi}" if doi else "#"
            authors_raw = w.get("authors") or ""
            authors_line = ""
            if authors_raw:
                bolded = bold_connor(e(authors_raw))
                authors_line = (
                    f'<div style="font-size:0.82rem;color:var(--text-muted);margin-top:0.15rem;">'
                    f"{bolded}</div>"
                )
            journal_raw = w.get("journal") or ""
            journal_line = (
                f'<div style="margin-top:0.15rem;">'
                f'<a href="{e(article_href)}" target="_blank" rel="noopener noreferrer"'
                f' class="pub-journal-link">{e(journal_raw)}</a></div>'
                if journal_raw
                else ""
            )
            view_btn = (
                f'<a href="{e(article_href)}" target="_blank" rel="noopener noreferrer"'
                f' class="pub-cite-btn">View at journal website</a>'
                if doi
                else ""
            )
            rows.append(
                f'<div class="pub-entry-block">\n'
                f"  {pub_icon_html(doi)}\n"
                f'  <div class="pub-entry-text">\n'
                f'    <a href="{e(article_href)}" target="_blank" rel="noopener noreferrer"'
                f' class="pub-title-link">{e(w.get("title", "Untitled"))}</a>\n'
                f"    {authors_line}\n"
                f"    {journal_line}\n"
                f'    <div class="pub-actions"'
                f' style="display:flex;gap:0.4rem;margin-top:0.45rem;flex-wrap:wrap;">\n'
                f"      {view_btn}\n"
                f'      <button id="cite-btn-{i}" class="pub-cite-btn"'
                f' data-idx="{i}">Copy APA 7</button>\n'
                f'      <button class="pub-cite-btn"'
                f' data-ris-idx="{i}">Download RIS</button>\n'
                f"    </div>\n"
                f"  </div>\n"
                f"</div>"
            )

    footer = ""
    if updated_str:
        footer = (
            '\n<div class="pub-footer-row">\n'
            '<span class="pub-synced-note">Synced from '
            '<a href="https://orcid.org/0009-0000-1020-2333"'
            ' target="_blank" rel="noopener noreferrer">ORCID</a>'
            f" · {e(updated_str)}</span>\n"
            '<a href="https://scholar.google.com/citations?user=ZEvUL_kAAAAJ&amp;hl=en"'
            ' target="_blank" rel="noopener noreferrer" class="pub-scholar-link">'
            "View all on Google Scholar</a>\n"
            "</div>"
        )
    pub_works_json = json.dumps(pub_works_data, ensure_ascii=False)
    return (
        f"<script>const PUB_WORKS = {pub_works_json};</script>\n"
        + "\n".join(rows)
        + "\n"
        + _COPY_DOWNLOAD_JS
        + footer
    )


def gen_metrics(metrics: dict) -> str:
    pubs = metrics.get("publications", 0)
    citations = metrics.get("citations", 0)
    h_idx = metrics.get("h_index", 0)
    i10 = metrics.get("i10_index", 0)
    reviews = metrics.get("peer_reviews", 0)
    updated_raw = metrics.get("updated", "")
    updated_str = ""
    if updated_raw:
        try:
            dt = datetime.fromisoformat(updated_raw)
            updated_str = format_date_au(dt)
        except ValueError:
            updated_str = updated_raw

    def _fmt(raw: str) -> str:
        try:
            return format_date_au(datetime.fromisoformat(raw))
        except (TypeError, ValueError):
            return ""

    # Each source has its own "last synced" date, recorded only when that
    # source actually returned data. Older data files only have "updated";
    # ORCID falls back to it, Scholar shows no date until it is confirmed.
    orcid_str = _fmt(metrics.get("orcid_updated") or updated_raw)
    scholar_str = _fmt(metrics.get("scholar_updated", ""))
    orcid_part = (
        'Publications and peer reviews from '
        '<a href="https://orcid.org/0009-0000-1020-2333"'
        ' target="_blank" rel="noopener noreferrer">ORCID</a>'
        + (f", last synced {e(orcid_str)}" if orcid_str else "")
    )
    sync_line = orcid_part
    if scholar_str:
        sync_line += f" · Citations from Google Scholar, last synced {e(scholar_str)}"

    def _tile_link(url: str, label: str) -> str:
        return (
            '<span class="pub-stat-note">'
            f'<a href="{url}" target="_blank" rel="noopener noreferrer"'
            ' style="color:inherit;text-decoration:underline dotted;">'
            f"{label}</a></span>\n"
        )

    orcid_url = "https://orcid.org/0009-0000-1020-2333"
    scholar_url = "https://scholar.google.com/citations?user=ZEvUL_kAAAAJ&amp;hl=en"

    return (
        '<div class="pub-stats-grid">\n'
        '<div class="pub-stat-card pub-stat-publications">\n'
        '<span class="pub-stat-heading">Research output</span>\n'
        f'<div class="pub-stat-pair"><strong>{pubs}</strong><span>Publications</span></div>\n'
        + _tile_link(orcid_url, "View on ORCID")
        + "</div>\n"
        '<div class="pub-stat-card pub-stat-profile">\n'
        '<span class="pub-stat-heading">Scholar profile</span>\n'
        f'<div class="pub-stat-pair"><strong>{citations}</strong><span>Citations</span></div>\n'
        f'<div class="pub-stat-pair"><strong>{h_idx}</strong><span>h-index</span></div>\n'
        f'<div class="pub-stat-pair"><strong>{i10}</strong><span>i10-index</span></div>\n'
        + _tile_link(scholar_url, "View on Google Scholar")
        + "</div>\n"
        '<div class="pub-stat-card pub-stat-service">\n'
        '<span class="pub-stat-heading">Peer review</span>\n'
        f'<div class="pub-stat-pair"><strong>{reviews}</strong><span>Verified reviews</span></div>\n'
        + _tile_link(orcid_url, "Verify on ORCID")
        + "</div>\n"
        "</div>\n"
        '<div class="pub-footer-row">\n'
        f'<span class="pub-synced-note">{sync_line}</span>\n'
        "</div>"
    )


def gen_software(records: list) -> str:
    items: list[str] = []
    for r in records:
        doi = r.get("doi")
        url = r.get("record_url") or (f"https://doi.org/{doi}" if doi else None)
        title = r.get("title") or doi or ""
        if url:
            items.append(
                f'<li><a href="{e(url)}" target="_blank"'
                f' rel="noopener noreferrer">{e(title)}</a></li>'
            )
        else:
            items.append(f"<li>{e(title)}</li>")
    return "<ul>\n" + "\n".join(items) + "\n</ul>"


def gen_talk_card(talks: list) -> str:
    if not talks:
        return ""
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    # Only upcoming events are shown. Once an event's date has passed it
    # disappears from the site; with no upcoming events, no card is shown.
    upcoming = sorted(
        [t for t in talks if t.get("date") and str(t["date"]) >= today_str],
        key=lambda t: str(t["date"]),
    )
    if not upcoming:
        return ""
    talk = upcoming[0]
    label = "Upcoming event"
    cta_text = "Event details and registration →"
    link = talk.get("link") or "#"
    title = talk.get("title") or ""
    image = talk.get("image")
    image_alt = talk.get("image_alt") or title
    description = talk.get("description") or (
        f"{talk.get('role', '')} at {talk.get('event', '')}."
    )
    image_html = ""
    if image:
        image_html = (
            f'<a href="{e(link)}" class="homepage-feature-image">'
            f'<img src="{e(image)}" alt="{e(image_alt)}" loading="lazy"></a>\n'
        )
    cta_html = (
        f'<a href="{e(link)}" class="about-link">{e(cta_text)}</a>'
        if link != "#"
        else ""
    )
    return (
        f'<div class="homepage-feature homepage-feature-event" data-event-date="{e(str(talk.get("date")))}">\n'
        f"{image_html}"
        '<div class="homepage-feature-content">\n'
        f'<span class="feature-label">{e(label)}</span>\n'
        f"<h3>{e(title)}</h3>\n"
        f"<p>{e(description)}</p>\n"
        f"{cta_html}\n"
        "</div>\n"
        "</div>\n"
        # The site only rebuilds weekly, so also remove the card in the
        # browser once the event date has passed between rebuilds.
        "<script>(function(){var c=document.querySelector('[data-event-date]');"
        "if(!c)return;var d=new Date();var t=d.getFullYear()+'-'+"
        "String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');"
        "if(c.dataset.eventDate<t){c.remove();var h=document.querySelector('.featured-heading');"
        "if(h)h.textContent='Featured';}})();</script>"
    )


def gen_featured_heading(talks: list) -> str:
    """Home section heading: 'Featured & upcoming' only while an event is coming up."""
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    has_upcoming = any(t.get("date") and str(t["date"]) >= today_str for t in talks)
    text = "Featured &amp; upcoming" if has_upcoming else "Featured"
    return f'<h2 id="featured" class="featured-heading">{text}</h2>'


def gen_latest_writing() -> str:
    """Home card for the newest post in posts/ (read from each post's front matter)."""
    posts = []
    for p in (ROOT / "posts").glob("*.qmd"):
        if p.name.startswith("_") or p.name == "index.qmd":
            continue
        m = re.match(r"^---\s*\n(.*?)\n---", p.read_text(encoding="utf-8"), re.S)
        if not m:
            continue
        meta = yaml.safe_load(m.group(1)) or {}
        if meta.get("draft") or not meta.get("date"):
            continue
        posts.append((str(meta["date"]), p.stem, meta))
    if not posts:
        return ""
    _, stem, meta = max(posts)
    title = meta.get("title") or ""
    description = meta.get("description") or ""
    return (
        '<div class="homepage-feature homepage-feature-writing">\n'
        '<div class="homepage-feature-content">\n'
        '<span class="feature-label">Latest writing</span>\n'
        f"<h3>{e(title)}</h3>\n"
        f"<p>{e(description)}</p>\n"
        f'<a href="posts/{e(stem)}.html" class="about-link">Read the article →</a>\n'
        "</div>\n"
        "</div>"
    )


def gen_latest_pub(works: list, featured: list) -> str:
    if not works:
        return ""
    latest = works[0]
    doi = latest.get("doi")
    feat = None
    if doi and featured:
        feat = next((f for f in featured if (f.get("doi") or "").lower() == doi.lower()), None)
    article_url = f"https://doi.org/{doi}" if doi else "#"
    if feat:
        display_title = e(feat.get("title") or latest.get("title", ""))
        blurb = feat.get("blurb") or ""  # raw HTML — not escaped
        cta = feat.get("cta") or "View publication →"
    else:
        display_title = e(latest.get("title", ""))
        journal = latest.get("journal", "")
        authors = latest.get("authors", "")
        year = latest.get("year", "")
        blurb = (
            f"<em>{e(authors)} ({e(str(year))}).</em> <em>{e(journal)}</em>."
            if journal
            else ""
        )
        cta = "View publication →"
    return (
        '<div class="homepage-feature homepage-feature-paper">\n'
        '<span class="feature-label">Latest publication</span>\n'
        f"<h3>{display_title}</h3>\n"
        f"<p>{blurb}</p>\n"
        f'<a href="{e(article_url)}" target="_blank" rel="noopener noreferrer"'
        f' class="about-link">{e(cta)}</a>\n'
        '<a href="/research/publications.html" class="about-link">'
        "View all publications →</a>\n"
        "</div>"
    )


def gen_timeline(data: dict) -> str:
    start_date_str = data.get("startDate", "2025-01-01")
    est_completion = data.get("estimatedCompletion", "")
    milestones = data.get("milestones") or []
    papers = data.get("papers") or []
    cur_q = current_quarter(start_date_str)
    cur_pct = (cur_q - 0.5) / TOTAL_QS * 100
    milestone_map = {m["quarter"]: m for m in milestones}

    # Header row
    q_cells: list[str] = []
    for q in range(1, TOTAL_QS + 1):
        ms = milestone_map.get(q)
        is_cur = q == cur_q
        cls = " is-current" if is_cur else ""
        ms_span = f'<span class="tl-q-milestone">{e(ms["label"])}</span>' if ms else ""
        marker = '<div class="tl-q-marker"></div>' if is_cur else ""
        q_cells.append(
            f'<div class="tl-q{cls}">{ms_span}Q{q}{marker}</div>'
        )

    header = (
        '<div class="tl-header">'
        '<div class="tl-header-label">Activity</div>'
        '<div class="tl-quarters">' + "".join(q_cells) + "</div>"
        "</div>"
    )

    # Paper sections
    sections: list[str] = []
    for paper in papers:
        paper_id = paper.get("id", 0)
        color = PAPER_COLORS.get(paper_id, "var(--text-muted)")
        activities = paper.get("activities") or []
        completed = sum(1 for a in activities if overall_status(a["statuses"]) == "done")
        total = len(activities)
        pct = round(completed / total * 100) if total else 0

        # Mini summary bars
        mini_rows: list[str] = []
        for act in activities:
            mini_rows.append(
                f'<div class="tl-mini-row" style="position:relative;">'
                + render_bar_html(act, color)
                + "</div>"
            )

        summary_inner = (
            f'<div class="tl-paper-info">'
            f'<div class="tl-paper-bar" style="background:{color};"></div>'
            f'<div class="tl-paper-meta">'
            f'<div class="tl-paper-label" style="color:{color};">{e(paper.get("label", ""))}</div>'
            f'<div class="tl-paper-title">{e(paper.get("title", ""))}</div>'
            f"</div>"
            f'<div class="tl-paper-right">'
            f'<span class="tl-paper-frac">{completed}/{total}</span>'
            f'<div class="tl-paper-progress"'
            f' style="background:color-mix(in srgb, {color} 15%, transparent);">'
            f'<div class="tl-paper-progress-fill" style="width:{pct}%;background:{color};"></div>'
            f"</div>"
            f'<svg aria-hidden="true" class="tl-chevron" width="14" height="14"'
            f' viewBox="0 0 16 16" fill="none">'
            f'<path d="M4 6l4 4 4-4" stroke="var(--navy)" stroke-width="1.5"'
            f' stroke-linecap="round"/></svg>'
            f"</div>"
            f"</div>"
            f'<div class="tl-gantt-summary">'
            f'<div class="tl-current-line" style="left:{cur_pct:.3f}%;"></div>'
            + "".join(mini_rows)
            + "</div>"
        )

        # Activity rows
        act_rows: list[str] = []
        for act in activities:
            os = overall_status(act["statuses"])
            label_cls = " is-done" if os == "done" else ""
            # Grid lines
            gridlines = "".join(
                f'<div class="tl-gridline" style="left:{(g / TOTAL_QS) * 100:.3f}%;"></div>'
                for g in range(1, TOTAL_QS)
            )
            act_rows.append(
                f'<div class="tl-activity">'
                f'<div class="tl-activity-label{label_cls}">'
                f"{dot_svg(os, 7)} {e(act.get('desc', ''))}"
                f"</div>"
                f'<div class="tl-gantt-cell">'
                f"{gridlines}"
                f'<div class="tl-current-line" style="left:{cur_pct:.3f}%;"></div>'
                + render_bar_html(act, color)
                + "</div>"
                f"</div>"
            )

        sections.append(
            f'<details class="tl-paper">'
            f"<summary class=\"tl-paper-header\">{summary_inner}</summary>"
            f'<div class="tl-activities">' + "".join(act_rows) + "</div>"
            f"</details>"
        )

    # Milestone footer
    footer_items = "".join(
        f'<div class="tl-milestone-foot">'
        f'<div class="tl-milestone-foot-label">{e(m["label"])}</div>'
        f'<div class="tl-milestone-foot-full">{e(m["full"])}</div>'
        f"</div>"
        for m in milestones
    )

    # Small script: update current-Q lines to real browser time
    update_script = """\
<script>
(function() {
  var start = new Date('2025-01-01T00:00:00Z');
  var now = new Date();
  var months = (now.getUTCFullYear() - start.getUTCFullYear()) * 12
    + now.getUTCMonth() - start.getUTCMonth();
  var q = Math.max(1, Math.min(16, Math.floor(months / 3) + 1));
  var pct = (q - 0.5) / 16 * 100;
  document.querySelectorAll('.tl-current-line').forEach(function(el) {
    el.style.left = pct + '%';
  });
  document.querySelectorAll('.tl-q.is-current').forEach(function(el) {
    el.classList.remove('is-current');
  });
  var qs = document.querySelectorAll('.tl-q');
  if (qs[q - 1]) qs[q - 1].classList.add('is-current');
})();
</script>"""

    details_css = """\
<style>
summary.tl-paper-header { list-style: none; cursor: pointer; }
summary.tl-paper-header::-webkit-details-marker { display: none; }
summary.tl-paper-header::marker { display: none; }
details[open] > summary.tl-paper-header .tl-chevron { transform: rotate(180deg); }
.tl-chevron { transition: transform 0.2s; }
</style>"""

    est_badge = (
        '<div class="tl-est-badge">'
        '<svg aria-hidden="true" width="13" height="13" viewBox="0 0 16 16" fill="none">'
        '<circle cx="8" cy="8" r="5.5" stroke="currentColor" stroke-width="1.5"/>'
        '<path d="M8 4.5v4l2.5 1.5" stroke="currentColor" stroke-width="1.4"'
        ' stroke-linecap="round"/></svg>'
        f"<span>Est. {e(est_completion)}</span>"
        "</div>"
    ) if est_completion else ""

    return (
        details_css
        + f'\n<div class="phd-timeline" id="phd-timeline">\n'
        + header
        + "\n".join(sections)
        + "\n</div>\n"
        + f'<div class="tl-milestones-footer">{footer_items}</div>\n'
        + est_badge
        + "\n"
        + update_script
    )


def gen_reading_entries(entries: list) -> str:
    rows: list[str] = []
    for entry in entries:
        doi = entry.get("doi") or ""
        title = entry.get("title") or doi
        authors = entry.get("authors") or ""
        year = entry.get("year") or ""
        journal = entry.get("journal") or ""
        note = entry.get("note") or ""
        abstract = entry.get("abstract") or ""
        tags: list[str] = entry.get("tags") or []

        url = f"https://doi.org/{doi}" if doi else "#"
        byline_parts = [p for p in [authors, str(year) if year else "", journal] if p]
        byline = " · ".join(byline_parts)

        # data-search: lowercased title + authors + journal + note (no abstract)
        search_text = " ".join(
            p for p in [title, authors, journal, note] if p
        ).lower()
        data_search = e(search_text)
        data_tags = json.dumps(tags).replace("'", "&#39;")

        tag_pills = ""
        if tags:
            pills = []
            for tag in tags:
                c = tag_color(tag)
                pills.append(
                    f'<span style="display:inline-block;font-size:0.72rem;font-weight:600;'
                    f"color:{c};background:color-mix(in srgb,{c} 12%,transparent);"
                    f'border-radius:999px;padding:0.1rem 0.55rem;margin-right:0.3rem;'
                    f'margin-top:0.35rem;">{e(tag)}</span>'
                )
            tag_pills = (
                f'<div style="margin-top:0.1rem;">{"".join(pills)}</div>'
            )

        note_html = ""
        if note:
            abstract_tip = (
                f' <span title="{e(abstract)}" style="cursor:help;opacity:0.45;'
                f'font-size:0.8rem;"> ···</span>'
                if abstract
                else ""
            )
            note_html = (
                f'<div style="font-size:0.88rem;color:var(--text-muted);'
                f"margin-top:0.4rem;line-height:1.6;\">"
                f"{e(note)}{abstract_tip}</div>"
            )

        byline_html = (
            f'<div style="font-size:0.82rem;color:var(--text-muted);'
            f'margin-top:0.2rem;font-style:italic;">{e(byline)}</div>'
            if byline
            else ""
        )

        rows.append(
            f'<div class="pub-entry-block reading-entry"'
            f" data-tags='{data_tags}'"
            f' data-search="{data_search}">'
            f'<div class="pub-favicon-fallback">{book_svg()}</div>'
            f'<div class="pub-entry-text">'
            f'<a href="{e(url)}" target="_blank" rel="noopener noreferrer"'
            f' class="pub-title-link">{e(title)}</a>'
            f"{byline_html}"
            f"{tag_pills}"
            f"{note_html}"
            f"</div>"
            f"</div>"
        )

    rows.append(
        '<div id="reading-no-results" style="display:none;'
        'color:var(--text-muted);font-size:0.9rem;">No entries for this filter.</div>'
    )
    return "\n".join(rows)


def gen_last_updated() -> str:
    try:
        result = subprocess.run(
            [
                "git", "log", "-1", "--format=%cI",
                "--invert-grep", "--grep=Update profile metrics",
                "--", ".",
            ],
            capture_output=True,
            text=True,
            cwd=ROOT,
            timeout=15,
        )
        date_str = result.stdout.strip()
        if date_str:
            dt = datetime.fromisoformat(date_str)
            readable = format_date_au(dt)
            iso = dt.strftime("%Y-%m-%d")
            return (
                f'<div class="site-last-updated">Last updated'
                f' <time datetime="{iso}">{readable}</time></div>'
            )
    except Exception:
        pass
    return '<div class="site-last-updated">Last updated <time>November 2026</time></div>'


# ── main ──────────────────────────────────────────────────────────────────────

def main() -> None:
    INCLUDES_DIR.mkdir(exist_ok=True)

    works = read_json(DATA_DIR / "publications.json") or []
    # Papers missing from ORCID can be listed by hand in manual-publications.json.
    # Each one is skipped automatically once ORCID has the same DOI.
    manual_path = DATA_DIR / "manual-publications.json"
    if manual_path.exists():
        orcid_dois = {(w.get("doi") or "").lower() for w in works}
        extra = [m for m in read_json(manual_path) if (m.get("doi") or "").lower() not in orcid_dois]
        works = sorted(extra + works, key=lambda w: -(w.get("year") or 0))
    metrics = read_json(DATA_DIR / "metrics.json")
    software = read_json(DATA_DIR / "software.json")
    talks_raw = read_yaml(DATA_DIR / "talks.yml")
    talks = talks_raw if isinstance(talks_raw, list) else ([talks_raw] if talks_raw else [])
    featured_path = DATA_DIR / "featured.yml"
    featured_raw = read_yaml(featured_path) if featured_path.exists() else []
    featured = featured_raw if isinstance(featured_raw, list) else ([featured_raw] if featured_raw else [])
    timeline = read_json(DATA_DIR / "timeline.json")
    entries = read_json(DATA_DIR / "reading.json")

    metrics_updated_raw = (metrics or {}).get("orcid_updated") or (metrics or {}).get("updated", "")
    metrics_updated_str = ""
    if metrics_updated_raw:
        try:
            metrics_updated_str = format_date_au(datetime.fromisoformat(metrics_updated_raw))
        except ValueError:
            metrics_updated_str = metrics_updated_raw

    writes = {
        "publications.html": gen_publications(works, metrics_updated_str),
        "pub-metrics.html": gen_metrics({**(metrics or {}), "publications": len(works)}),
        "software.html": gen_software(software),
        "talk-card.html": gen_talk_card(talks),
        "featured-heading.html": gen_featured_heading(talks),
        "latest-pub.html": gen_latest_pub(works, featured),
        "latest-writing.html": gen_latest_writing(),
        "timeline.html": gen_timeline(timeline),
        "reading-entries.html": gen_reading_entries(entries),
        "last-updated.html": gen_last_updated(),
    }

    for name, content in writes.items():
        path = INCLUDES_DIR / name
        path.write_text(content, encoding="utf-8")
        print(f"[build_includes] wrote _includes/{name} ({len(content)} bytes)")


if __name__ == "__main__":
    main()
