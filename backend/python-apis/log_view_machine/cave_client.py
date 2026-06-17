"""
HTTP client adapter to Cave server — does not host Cave/Tome/RobotCopy.
"""

from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import asdict, replace
from pathlib import Path
from typing import Any, Dict, Optional

from .envelope import MessageEnvelope
from .routing import RoutingError, parse_routed_subject
from .soa_discovery import DiscoveryContext, resolve_hybrid_service_urls


def _ensure_cave_adapter_path() -> None:
    """Allow ``pip install -e`` or monorepo ``packages/cave-adapter-py`` without extra PYTHONPATH."""
    root = Path(__file__).resolve().parents[3]
    pkg = root / "packages" / "cave-adapter-py"
    if pkg.is_dir():
        p = str(pkg)
        if p not in sys.path:
            sys.path.insert(0, p)


class CaveClient:
    """
    Minimal Cave wire client: POST JSON envelope to ``{base}/cave/route``.

    Resolves ``base`` per route: ``explicit_service:path`` uses the SOA registry
    (``SOA_REGISTRY_PATH``, ``SOA_*_URL``, ``CAVE_BASE_URL`` for legacy resaurce);
    path-only routes use ``CAVE_BASE_URL`` / constructor ``base_url``.

    Mock Cave: see ``scripts/mock_cave_server.py`` in inventory repo.
    """

    def __init__(
        self,
        base_url: Optional[str] = None,
        timeout_s: float = 30.0,
        service_urls: Optional[Dict[str, str]] = None,
        discovery_context: Optional[DiscoveryContext] = None,
    ):
        self._legacy_base = (base_url or os.environ.get("CAVE_BASE_URL") or "").rstrip("/")
        self._service_urls_override = service_urls
        self._discovery_context = discovery_context
        self.timeout_s = timeout_s
        self._http_transport: Any = None

    def _merged_urls(self) -> Dict[str, str]:
        if self._service_urls_override is not None:
            return dict(self._service_urls_override)
        return resolve_hybrid_service_urls(self._discovery_context or DiscoveryContext.from_environ())

    def base_for_route(self, route: str) -> str:
        try:
            parsed = parse_routed_subject(route)
        except RoutingError:
            return self._legacy_base
        urls = self._merged_urls()
        if parsed.explicit_service:
            u = urls.get(parsed.explicit_service)
            if u:
                return u.rstrip("/")
        return self._legacy_base

    def configured(self, route: Optional[str] = None) -> bool:
        if route:
            return bool(self.base_for_route(route))
        urls = self._merged_urls()
        return bool(self._legacy_base or urls.get("resaurce") or urls.get("saurce") or urls.get("inventory"))

    def send_route(self, envelope: MessageEnvelope) -> Dict[str, Any]:
        base = self.base_for_route(envelope.route)
        if not base:
            return {"ok": False, "skipped": True, "reason": "no Cave base URL for route"}

        if os.environ.get("CAVE_ADAPTER_LEGACY") == "1":
            return self._send_route_legacy(base, envelope)

        _ensure_cave_adapter_path()
        try:
            from cave_adapter import HttpCaveTransport  # type: ignore[import-not-found]

            if self._http_transport is None:
                self._http_transport = HttpCaveTransport(timeout_s=self.timeout_s)
            return self._http_transport.post_cave_route(base, asdict(envelope))
        except ImportError:
            return self._send_route_legacy(base, envelope)

    def send_message(
        self,
        message: str,
        payload: Optional[Dict[str, Any]] = None,
        *,
        service: str = "resaurce",
        trace_id: Optional[str] = None,
        presence: Optional[str] = None,
        tenant: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Message-first POST; serving Cave resolves route from manifest."""
        from .envelope import build_message_envelope

        envelope = build_message_envelope(
            message,
            payload,
            service=service,
            trace_id=trace_id,
            presence=presence,
            tenant=tenant,
        )
        urls = self._merged_urls()
        base = (urls.get(service) or self._legacy_base).rstrip("/")
        if not base:
            return {"ok": False, "skipped": True, "reason": f"no Cave base URL for service {service}"}

        if os.environ.get("CAVE_ADAPTER_LEGACY") == "1":
            return self._send_route_legacy(base, envelope)

        _ensure_cave_adapter_path()
        try:
            from cave_adapter import HttpCaveTransport  # type: ignore[import-not-found]

            if self._http_transport is None:
                self._http_transport = HttpCaveTransport(timeout_s=self.timeout_s)
            return self._http_transport.post_cave_route(base, asdict(envelope))
        except ImportError:
            return self._send_route_legacy(base, envelope)

    def _send_route_legacy(self, base: str, envelope: MessageEnvelope) -> Dict[str, Any]:
        url = f"{base}/cave/route"
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

    def append_lvm(self, events: list, *, route_hint: str = "") -> Dict[str, Any]:
        """POST structured events to ``/lvm/append`` when Cave exposes it."""
        hint = route_hint
        if not hint and events and isinstance(events[0], dict) and events[0].get("route"):
            hint = str(events[0]["route"])
        if hint:
            base = self.base_for_route(hint)
        else:
            urls = self._merged_urls()
            base = (
                self._legacy_base
                or urls.get("inventory")
                or urls.get("resaurce")
                or urls.get("saurce")
                or ""
            ).rstrip("/")
        if not base:
            return {"ok": False, "skipped": True, "reason": "no Cave base URL for LVM append"}

        url = f"{base}/lvm/append"
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

    def poll_async(self, handle: str, *, route_hint: str = "") -> Dict[str, Any]:
        base = self.base_for_route(route_hint) if route_hint else self._legacy_base
        if not base:
            return {"ok": False, "skipped": True}
        url = f"{base}/cave/poll?handle={urllib.parse.quote(handle)}"
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

