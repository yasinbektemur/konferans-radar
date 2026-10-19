from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from scrapers.pending_store import load_pending_records, save_pending_records
from scrapers.sources.wikicfp import WikiCFPScraper

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data"


def run_scrapers() -> dict[str, Any]:
    scraper = WikiCFPScraper()
    source_url = "https://wikicfp.com"

    try:
        html = scraper.fetch(source_url)
        raw_items = scraper.parse(html)
    except Exception as exc:  # pragma: no cover - network failure path
        return {"success": False, "source": scraper.source_name, "error": str(exc), "records": []}

    normalized_records = [scraper.normalize(item) for item in raw_items]
    pending_records = load_pending_records()

    for record in normalized_records:
        pending_records.append(record)

    save_pending_records(pending_records)
    return {"success": True, "source": scraper.source_name, "records": normalized_records}


def main() -> None:
    DATA_DIR.mkdir(exist_ok=True)
    result = run_scrapers()
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
