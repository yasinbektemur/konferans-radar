from __future__ import annotations

import json
from copy import deepcopy
from datetime import date
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data"
PENDING_PATH = DATA_DIR / "pending_conferences.json"
MAIN_PATH = DATA_DIR / "conferences.json"


def _load_json(path: Path, default: Any) -> Any:
    if not path.exists():
        return default
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return default


def load_pending_records() -> list[dict[str, Any]]:
    return _load_json(PENDING_PATH, [])


def save_pending_records(records: list[dict[str, Any]]) -> None:
    DATA_DIR.mkdir(exist_ok=True)
    PENDING_PATH.write_text(json.dumps(records, ensure_ascii=False, indent=2), encoding="utf-8")


def _normalize_status(record: dict[str, Any]) -> dict[str, Any]:
    normalized = deepcopy(record)
    normalized.setdefault("status", "pending")
    normalized.setdefault("source", "unknown")
    normalized.setdefault("lastVerified", date.today().isoformat())
    normalized.setdefault("trustLevel", "unknown")
    normalized.setdefault("type", "conference")
    normalized.setdefault("publication", {"publisher": "Diğer", "indexing": []})
    normalized.setdefault("fees", {})
    normalized.setdefault("deadlines", {})
    normalized.setdefault("topics", [])
    return normalized


def _match_key(record: dict[str, Any]) -> str:
    record_id = str(record.get("id") or "").strip()
    if record_id:
        return record_id

    name = str(record.get("name") or "").strip()
    acronym = str(record.get("acronym") or "").strip()
    return f"{name}:{acronym}".strip(":")


def merge_pending_record(existing_records: list[dict[str, Any]], pending_record: dict[str, Any]) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    normalized_pending = _normalize_status(pending_record)
    updated_records = deepcopy(existing_records)
    logs: list[dict[str, Any]] = []

    match_index = None
    match_key = _match_key(normalized_pending)
    for index, candidate in enumerate(updated_records):
        if _match_key(candidate) == match_key:
            match_index = index
            break

    if match_index is None:
        updated_records.append(normalized_pending)
        return updated_records, logs

    original = deepcopy(updated_records[match_index])
    merged = deepcopy(original)
    for key, value in normalized_pending.items():
        if key in {"status", "createdAt"}:
            continue
        if key not in merged or merged.get(key) != value:
            merged[key] = value
            logs.append({
                "field": key,
                "oldValue": original.get(key),
                "newValue": value,
                "changedAt": date.today().isoformat(),
            })

    updated_records[match_index] = merged
    return updated_records, logs


def approve_pending_record(record_id: str) -> dict[str, Any]:
    pending_records = load_pending_records()
    selected = next((item for item in pending_records if str(item.get("id")) == record_id), None)
    if selected is None:
        raise KeyError(f"Pending record not found: {record_id}")

    existing_records = _load_json(MAIN_PATH, [])
    merged, _ = merge_pending_record(existing_records, selected)
    MAIN_PATH.write_text(json.dumps(merged, ensure_ascii=False, indent=2), encoding="utf-8")

    remaining = [item for item in pending_records if str(item.get("id")) != record_id]
    save_pending_records(remaining)

    return {"approved": record_id, "record": selected}
