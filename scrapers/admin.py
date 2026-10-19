from __future__ import annotations

import argparse
import json

from scrapers.pending_store import approve_pending_record, load_pending_records


def show_pending() -> None:
    records = load_pending_records()
    if not records:
        print("No pending records.")
        return
    print(json.dumps(records, ensure_ascii=False, indent=2))


def approve(record_id: str) -> None:
    result = approve_pending_record(record_id)
    print(json.dumps(result, ensure_ascii=False, indent=2))


def main() -> None:
    parser = argparse.ArgumentParser(description="Admin moderation for scraped conference records")
    subparsers = parser.add_subparsers(dest="command", required=True)

    subparsers.add_parser("review", help="List pending records waiting for approval")
    approve_parser = subparsers.add_parser("approve", help="Approve a pending record")
    approve_parser.add_argument("record_id")

    args = parser.parse_args()
    if args.command == "review":
        show_pending()
    elif args.command == "approve":
        approve(args.record_id)


if __name__ == "__main__":
    main()
