#!/usr/bin/env python3
"""
Minimal mock Cave server for local dev / adapter tests.

  export CAVE_LISTEN_PORT=8765
  python3 scripts/mock_cave_server.py

Endpoints: POST /cave/route, POST /lvm/append, GET /cave/poll?handle=
"""

from __future__ import annotations

import json
import os
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs


class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt: str, *args) -> None:  # noqa: A003
        print(fmt % args)

    def _send(self, code: int, body: dict) -> None:
        data = json.dumps(body).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_POST(self) -> None:  # noqa: N802
        parsed = urlparse(self.path)
        length = int(self.headers.get("Content-Length", "0"))
        raw = self.rfile.read(length) if length else b"{}"
        try:
            body = json.loads(raw.decode("utf-8"))
        except json.JSONDecodeError:
            self._send(400, {"ok": False, "error": "invalid json"})
            return

        if parsed.path == "/cave/route":
            self._send(
                200,
                {
                    "ok": True,
                    "echo_route": body.get("route"),
                    "trace_id": body.get("trace_id"),
                },
            )
        elif parsed.path == "/lvm/append":
            n = len(body.get("events") or [])
            self._send(200, {"ok": True, "appended": n})
        else:
            self._send(404, {"ok": False, "error": "not found"})

    def do_GET(self) -> None:  # noqa: N802
        parsed = urlparse(self.path)
        if parsed.path == "/cave/poll":
            qs = parse_qs(parsed.query)
            h = (qs.get("handle") or [""])[0]
            self._send(200, {"ok": True, "handle": h, "status": "pending"})
        else:
            self._send(404, {"ok": False})


def main() -> None:
    port = int(os.environ.get("CAVE_LISTEN_PORT", "8765"))
    httpd = HTTPServer(("127.0.0.1", port), Handler)
    print(f"mock Cave listening on http://127.0.0.1:{port}")
    httpd.serve_forever()


if __name__ == "__main__":
    main()

