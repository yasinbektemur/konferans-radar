# Conference scraper pipeline

This folder contains the Python-based collection layer for conference records.

## Responsibilities

- Source-specific modules (starting with WikiCFP)
- Shared fetch/parse/normalize flow
- Pending moderation before publication
- Merge logic for updates vs. newly discovered items
- Daily scheduled execution through GitHub Actions

## Usage

```bash
python3 -m scrapers.runner
python3 -m scrapers.admin review
python3 -m scrapers.admin approve <record_id>
```

## Rules followed

- Respect robots.txt before crawling
- Use a descriptive User-Agent
- Include a short delay between requests
- Scraped records are stored in pending state until an admin approves them
- `lastVerified` and `source` are set automatically for every fetched record
