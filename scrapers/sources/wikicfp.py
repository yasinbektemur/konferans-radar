from __future__ import annotations

import re
from datetime import date
from typing import Any

from scrapers.base import BaseScraper


class WikiCFPScraper(BaseScraper):
    source_name = "WikiCFP"

    def parse(self, html: str) -> list[dict[str, Any]]:
        records: list[dict[str, Any]] = []
        pattern = re.compile(r'<a\s+[^>]*href="(/cfp/[^\"]+)"[^>]*>(.*?)</a>', re.IGNORECASE | re.DOTALL)
        for match in pattern.finditer(html):
            href, text = match.groups()
            label = re.sub(r"<.*?>", "", text).strip()
            if label and len(label) > 6:
                records.append({"title": label, "url": href})

        if not records:
            return [{
                "title": "WikiCFP listing",
                "url": "https://wikicfp.com",
            }]

        return records

    def normalize(self, raw_record: dict[str, Any]) -> dict[str, Any]:
        title = str(raw_record.get("title") or "Untitled conference").strip()
        url = raw_record.get("url") or "https://wikicfp.com"

        if not url.startswith("http"):
            url = f"https://wikicfp.com{url}"

        name = title
        acronym = ""
        match = re.search(r"\(([A-Z0-9-]+)\)", title)
        if match:
            acronym = match.group(1)

        return {
            "id": self.slugify(f"{name}-{acronym or date.today().isoformat()}")[:80],
            "name": name,
            "acronym": acronym or "",
            "description": f"WikiCFP kaynağından otomatik toplanan konferans kaydı.",
            "startDate": None,
            "endDate": None,
            "city": "",
            "country": "",
            "mode": "online",
            "topics": [],
            "deadlines": {},
            "publication": {"publisher": "Diğer", "indexing": []},
            "fees": {},
            "officialUrl": url,
            "source": self.source_name,
            "lastVerified": date.today().isoformat(),
            "trustLevel": "unknown",
            "trustNotes": "WikiCFP otomatik taraması; yönetici onayı bekliyor.",
            "type": "conference",
            "status": "pending",
        }
