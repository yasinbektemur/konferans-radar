from __future__ import annotations

import re
import time
from abc import ABC, abstractmethod
from datetime import date, datetime
from typing import Any, Iterable
from urllib.parse import urlparse
from urllib.request import Request, urlopen
from urllib.robotparser import RobotFileParser

DEFAULT_USER_AGENT = "ConferenceTrackerBot/0.1 (+https://example.com; research and monitoring only)"


class BaseScraper(ABC):
    """Shared interface for all conference sources."""

    source_name = "base"
    request_delay = 1.0

    def __init__(self, user_agent: str | None = None, request_delay: float | None = None) -> None:
        self.user_agent = user_agent or DEFAULT_USER_AGENT
        self.request_delay = request_delay if request_delay is not None else self.request_delay

    def fetch(self, url: str) -> str:
        """Fetch a URL while respecting robots.txt and request spacing."""
        if not self.is_allowed(url):
            raise PermissionError(f"Robots.txt blocks access to: {url}")

        time.sleep(self.request_delay)
        request = Request(url, headers={
            "User-Agent": self.user_agent,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
        })

        with urlopen(request, timeout=20) as response:
            charset = response.headers.get_content_charset() or "utf-8"
            return response.read().decode(charset, errors="replace")

    def is_allowed(self, url: str) -> bool:
        parsed = urlparse(url)
        robots_url = f"{parsed.scheme}://{parsed.netloc}/robots.txt"
        parser = RobotFileParser()
        parser.set_url(robots_url)
        try:
            parser.read()
        except Exception:
            return True
        return parser.can_fetch(self.user_agent, url)

    @staticmethod
    def normalize_date(value: Any) -> str | None:
        if value in (None, ""):
            return None

        if isinstance(value, str):
            clean = value.strip()
            if len(clean) == 0:
                return None
            for fmt in ("%Y-%m-%d", "%Y/%m/%d", "%d %B %Y", "%d %b %Y"):
                try:
                    return datetime.strptime(clean, fmt).date().isoformat()
                except ValueError:
                    continue
            return clean

        if isinstance(value, date):
            return value.isoformat()

        return str(value)

    @staticmethod
    def slugify(value: str) -> str:
        normalized = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
        return normalized or "conference"

    @staticmethod
    def normalize_topics(value: Iterable[str] | str | None) -> list[str]:
        if value is None:
            return []
        if isinstance(value, str):
            return [part.strip() for part in value.split(",") if part.strip()]
        return [str(part).strip() for part in value if str(part).strip()]

    @abstractmethod
    def parse(self, html: str) -> list[dict[str, Any]]:
        """Parse raw HTML into raw conference dictionaries."""

    @abstractmethod
    def normalize(self, raw_record: dict[str, Any]) -> dict[str, Any]:
        """Normalize record to the Conference schema used in the app."""
