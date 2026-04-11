import unittest
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from log_view_machine.routing import parse_routed_subject, RoutingError
from log_view_machine.envelope import build_envelope, ReplyMode
from log_view_machine.cave_client import CaveClient


class TestRouting(unittest.TestCase):
    def test_explicit_service(self):
        p = parse_routed_subject("resaurce:hr/hire/new")
        self.assertEqual(p.explicit_service, "resaurce")
        self.assertEqual(p.structural_path, "hr/hire/new")

    def test_path_only(self):
        p = parse_routed_subject("documents/tax/generate")
        self.assertIsNone(p.explicit_service)
        self.assertEqual(p.structural_path, "documents/tax/generate")

    def test_invalid_segment(self):
        with self.assertRaises(RoutingError):
            parse_routed_subject("resaurce:HR/Bad")

    def test_envelope(self):
        e = build_envelope(
            "inventory:documents/tax/generate",
            {"user_id": "u1"},
            trace_id="t-1",
            reply_mode=ReplyMode.async_poll_token,
        )
        self.assertIn("inventory:documents/tax/generate", e.to_json())
        self.assertEqual(e.trace_id, "t-1")

    def test_cave_client_skipped_without_url(self):
        c = CaveClient(base_url="")
        self.assertFalse(c.configured())
        r = c.send_route(build_envelope("x:y/z", {}))
        self.assertFalse(r.get("ok"))


if __name__ == "__main__":
    unittest.main()
