import json
import os
import sys
import threading
import unittest
from http.server import BaseHTTPRequestHandler, HTTPServer

_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".."))
sys.path.insert(0, os.path.join(_root, "packages", "cave-adapter-py"))

from cave_adapter import HttpCaveTransport  # noqa: E402


class _Handler(BaseHTTPRequestHandler):
    def do_POST(self):
        if self.path != "/cave/route":
            self.send_error(404)
            return
        ln = int(self.headers.get("Content-Length", "0"))
        body = self.rfile.read(ln)
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps({"ok": True, "echo": json.loads(body.decode())}).encode())

    def log_message(self, *args):
        pass


class TestHttpCaveComponent(unittest.TestCase):
    def test_post_cave_route_local_server(self):
        srv = HTTPServer(("127.0.0.1", 0), _Handler)
        port = srv.server_port
        t = threading.Thread(target=srv.serve_forever, daemon=True)
        t.start()
        try:
            os.environ["CAVE_ADAPTER_RETRY"] = "0"
            tr = HttpCaveTransport(timeout_s=5.0, enable_retry=False)
            out = tr.post_cave_route(
                f"http://127.0.0.1:{port}",
                {"schema_version": "2.0", "route": "inventory:x", "payload": {}, "trace_id": "t", "reply_mode": "sync_http"},
            )
            self.assertTrue(out.get("ok"))
            self.assertEqual(out.get("echo", {}).get("route"), "inventory:x")
        finally:
            srv.shutdown()
            srv.server_close()
            os.environ.pop("CAVE_ADAPTER_RETRY", None)
