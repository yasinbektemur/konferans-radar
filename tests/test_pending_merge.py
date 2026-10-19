import unittest

from scrapers.pending_store import merge_pending_record


class PendingMergeTest(unittest.TestCase):
    def test_updates_matching_record_and_records_date_change(self):
        existing = [{
            "id": "miccai-2026",
            "name": "Medical Image Computing and Computer Assisted Intervention",
            "acronym": "MICCAI 2026",
            "source": "Resmî konferans web sitesi",
            "lastVerified": "2026-01-12",
            "startDate": "2026-09-20",
            "endDate": "2026-09-24",
            "country": "Almanya",
            "city": "München",
            "mode": "onsite",
            "topics": ["biyomedikal görüntüleme"],
            "deadlines": {"abstract": "2026-03-15"},
            "publication": {"publisher": "Springer", "indexing": ["Scopus"]},
            "fees": {"amount": 1200, "currency": "EUR"},
            "officialUrl": "https://miccai2026.org",
            "trustLevel": "verified",
            "type": "conference",
        }]

        pending = {
            "id": "miccai-2026",
            "name": "Medical Image Computing and Computer Assisted Intervention",
            "acronym": "MICCAI 2026",
            "source": "WikiCFP",
            "lastVerified": "2026-10-19",
            "startDate": "2026-09-21",
            "endDate": "2026-09-25",
            "country": "Almanya",
            "city": "München",
            "mode": "onsite",
            "topics": ["biyomedikal görüntüleme"],
            "deadlines": {"abstract": "2026-03-15", "notification": "2026-05-04"},
            "publication": {"publisher": "Springer", "indexing": ["Scopus"]},
            "fees": {"amount": 1200, "currency": "EUR"},
            "officialUrl": "https://miccai2026.org",
            "trustLevel": "unknown",
            "type": "conference",
        }

        updated, logs = merge_pending_record(existing, pending)

        self.assertEqual(updated[0]["startDate"], "2026-09-21")
        self.assertEqual(updated[0]["source"], "WikiCFP")
        self.assertTrue(any(log["field"] == "startDate" for log in logs))

    def test_adds_new_record_when_no_match_exists(self):
        existing = [{
            "id": "existing-conf",
            "name": "Existing Conference",
            "acronym": "EXC",
            "source": "manual",
            "lastVerified": "2026-01-01",
            "country": "Turkey",
            "city": "Istanbul",
            "mode": "online",
            "topics": ["ai"],
            "deadlines": {},
            "publication": {"publisher": "Diğer", "indexing": []},
            "fees": {},
            "officialUrl": "https://example.com", 
            "trustLevel": "unknown",
            "type": "conference",
        }]

        pending = {
            "id": "new-annual-ai",
            "name": "New Annual AI Summit",
            "acronym": "NAAIS",
            "source": "WikiCFP",
            "lastVerified": "2026-10-19",
            "country": "Turkey",
            "city": "Ankara",
            "mode": "hybrid",
            "topics": ["ai"],
            "deadlines": {"abstract": "2026-11-05"},
            "publication": {"publisher": "Diğer", "indexing": []},
            "fees": {},
            "officialUrl": "https://new-ai.example",
            "trustLevel": "unknown",
            "type": "conference",
        }

        updated, logs = merge_pending_record(existing, pending)

        self.assertTrue(any(item["id"] == "new-annual-ai" for item in updated))
        self.assertTrue(len(logs) >= 0)


if __name__ == "__main__":
    unittest.main()
