"""Fetch public profile metrics and publications for the Quarto build."""
from __future__ import annotations

import json
import logging
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import requests

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
METRICS_PATH = DATA_DIR / "metrics.json"
PUBLICATIONS_PATH = DATA_DIR / "publications.json"
ORCID_ID = "0009-0000-1020-2333"
SCHOLAR_ID = "ZEvUL_kAAAAJ"
TIMEOUT = 30

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")


def read_json(path: Path, default: Any) -> Any:
    if not path.exists():
        return default
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        logging.warning("Could not read %s: %s", path, exc)
        return default


def write_json(path: Path, value: Any) -> None:
    path.write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def get_json(url: str, **kwargs: Any) -> dict[str, Any]:
    response = requests.get(url, timeout=TIMEOUT, **kwargs)
    response.raise_for_status()
    return response.json()


def fetch_metrics(previous: dict[str, Any]) -> dict[str, Any]:
    metrics = dict(previous)
    metrics.pop("under_review", None)
    metrics["updated"] = datetime.now(timezone.utc).isoformat(timespec="seconds")

    scholar_key = os.environ.get("SERPAPI_KEY")
    if scholar_key:
        try:
            data = get_json(
                "https://serpapi.com/search.json",
                params={"engine": "google_scholar_author", "author_id": SCHOLAR_ID, "api_key": scholar_key},
            )
            table = data["cited_by"]["table"]
            metrics.update({
                "citations": table[0]["citations"]["all"],
                "h_index": table[1]["h_index"]["all"],
                "i10_index": table[2]["i10_index"]["all"],
            })
        except (KeyError, requests.RequestException, ValueError) as exc:
            logging.warning("Google Scholar metrics unavailable; keeping previous values: %s", exc)
    else:
        logging.warning("SERPAPI_KEY is not set; keeping previous Scholar metrics")

    try:
        data = get_json(f"https://pub.orcid.org/v3.0/{ORCID_ID}/peer-reviews", headers={"Accept": "application/json"})
        metrics["peer_reviews"] = sum(
            len(group.get("peer-review-summary", []))
            for item in data.get("group", [])
            for group in item.get("peer-review-group", [])
        )
    except (requests.RequestException, ValueError) as exc:
        logging.warning("ORCID peer-review metrics unavailable; keeping previous value: %s", exc)

    return metrics


def format_authors(contributors: list[dict[str, Any]]) -> str | None:
    names = []
    for contributor in contributors:
        name = contributor.get("credit-name", {}).get("value")
        if name:
            parts = name.strip().split()
            if len(parts) == 1:
                names.append(parts[0])
                continue
            family = parts[-1]
            initials = " ".join(f"{part[0].upper()}." for part in parts[:-1] if part)
            names.append(f"{family}, {initials}")
    unique_names = list(dict.fromkeys(names))
    if not unique_names:
        return None
    if len(unique_names) == 1:
        return unique_names[0]
    return ", ".join(unique_names[:-1]) + f", & {unique_names[-1]}"


def fetch_publications(previous: list[dict[str, Any]]) -> list[dict[str, Any]]:
    try:
        data = get_json(f"https://pub.orcid.org/v3.0/{ORCID_ID}/works", headers={"Accept": "application/json"})
        works = []
        for group in data.get("group", []):
            summary = group.get("work-summary", [{}])[0]
            if summary.get("type") != "journal-article":
                continue
            external_ids = summary.get("external-ids", {}).get("external-id", [])
            doi = next((item.get("external-id-value") for item in external_ids if item.get("external-id-type") == "doi"), None)
            if doi:
                doi = doi.removeprefix("https://doi.org/").removeprefix("http://doi.org/")
            work = {
                "title": summary.get("title", {}).get("title", {}).get("value", "Untitled"),
                "year": int(summary.get("publication-date", {}).get("year", {}).get("value") or 0),
                "journal": summary.get("journal-title", {}).get("value", ""),
                "doi": doi,
                "putCode": summary.get("put-code"),
            }
            if work["putCode"]:
                detail = get_json(
                    f"https://pub.orcid.org/v3.0/{ORCID_ID}/work/{work['putCode']}",
                    headers={"Accept": "application/json"},
                )
                work["authors"] = format_authors(detail.get("contributors", {}).get("contributor", []))
                work["volume"] = detail.get("volume", {}).get("value")
                work["issue"] = detail.get("journal-issue", {}).get("issue-number", {}).get("value")
                work["pages"] = detail.get("pages", {}).get("start", {}).get("value")
            works.append(work)
        existing_by_doi = {item.get("doi"): item for item in previous if item.get("doi")}
        fetched_dois = {item.get("doi") for item in works if item.get("doi")}
        works.extend(item for doi, item in existing_by_doi.items() if doi not in fetched_dois)
        if not works:
            raise ValueError("ORCID returned no journal articles")
        return sorted(works, key=lambda item: item.get("year", 0), reverse=True)
    except (KeyError, requests.RequestException, ValueError) as exc:
        logging.warning("ORCID publications unavailable; keeping previous list: %s", exc)
        return previous


def main() -> None:
    DATA_DIR.mkdir(exist_ok=True)
    previous_metrics = read_json(
        METRICS_PATH,
        {"publications": 7, "citations": 36, "h_index": 3, "i10_index": 2, "peer_reviews": 18},
    )
    previous_publications = read_json(PUBLICATIONS_PATH, [])
    publications = fetch_publications(previous_publications)
    metrics = fetch_metrics(previous_metrics)
    metrics["publications"] = len(publications)
    write_json(METRICS_PATH, metrics)
    write_json(PUBLICATIONS_PATH, publications)
    logging.info("Wrote %s and %s", METRICS_PATH, PUBLICATIONS_PATH)


if __name__ == "__main__":
    main()
