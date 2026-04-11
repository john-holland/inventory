"""
HTTP client adapter to Cave server — does not host Cave/Tome/RobotCopy.
"""

from __future__ import annotations

import json
import os
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import replace
from typing import Any, Dict, Optional

from .envelope import MessageEnvelope


class CaveClient:
    """
    Minimal Cave wire client: POST JSON envelope to ``{CAVE_BASE_URL}/cave/route``.

    Mock Cave: see ``scripts/mock_cave_server.py`` in inventory repo.
    """

    def __init__(self, base_url: Optional[str] = None, timeout_s: float = 30.0):
        self.base_url = (base_url or os.environ.get("CAVE_BASE_URL") or "").rstrip("/")
        self.timeout_s = timeout_s

    def configured(self) -> bool:
        return bool(self.base_url)

    def send_route(self, envelope: MessageEnvelope) -> Dict[str, Any]:
        if not self.configured():
            return {"ok": False, "skipped": True, "reason": "CAVE_BASE_URL unset"}

        url = f"{self.base_url}/cave/route"
        data = envelope.to_json().encode("utf-8")
        req = urllib.request.Request(
            url,
            data=data,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=self.timeout_s) as resp:
                body = resp.read().decode("utf-8")
                return json.loads(body) if body else {"ok": True}
        except urllib.error.HTTPError as e:
            return {"ok": False, "status": e.code, "error": e.read().decode("utf-8", errors="replace")}
        except Exception as e:  # noqa: BLE001
            return {"ok": False, "error": str(e)}

    def append_lvm(self, events: list) -> Dict[str, Any]:
        """POST structured events to ``/lvm/append`` when Cave exposes it."""
        if not self.configured():
            return {"ok": False, "skipped": True, "reason": "CAVE_BASE_URL unset"}

        url = f"{self.base_url}/lvm/append"
        body = json.dumps({"trace_id": events[0].get("trace_id") if events else "", "events": events})
        req = urllib.request.Request(
            url,
            data=body.encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=self.timeout_s) as resp:
                out = resp.read().decode("utf-8")
                return json.loads(out) if out else {"ok": True}
        except Exception as e:  # noqa: BLE001
            return {"ok": False, "error": str(e)}

    def poll_async(self, handle: str) -> Dict[str, Any]:
        if not self.configured():
            return {"ok": False, "skipped": True}
        url = f"{self.base_url}/cave/poll?handle={urllib.parse.quote(handle)}"
        try:
            with urllib.request.urlopen(url, timeout=self.timeout_s) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except Exception as e:  # noqa: BLE001
            return {"ok": False, "error": str(e)}


class PresenceAwareCaveClient(CaveClient):
    """Wraps CaveClient; injects presence token on each envelope copy."""

    def __init__(self, presence_token: Optional[str], **kwargs: Any):
        super().__init__(**kwargs)
        self._presence = presence_token

    def send_route(self, envelope: MessageEnvelope) -> Dict[str, Any]:
        merged = replace(envelope, presence=self._presence or envelope.presence)
        return super().send_route(merged)
