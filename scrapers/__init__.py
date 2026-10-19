"""Conference collection and moderation package."""

from .base import BaseScraper
from .pending_store import approve_pending_record, load_pending_records, merge_pending_record, save_pending_records

__all__ = [
    "BaseScraper",
    "approve_pending_record",
    "load_pending_records",
    "merge_pending_record",
    "save_pending_records",
]
