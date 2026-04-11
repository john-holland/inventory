"""
LVM2.0 structured lifecycle events (client-side construction; append via Cave or direct API).
"""

from __future__ import annotations

from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from .cave_client import CaveClient


def _ts() -> str:
    return datetime.now(timezone.utc).isoformat()


@dataclass
class LvmEvent:
    """Single LVM2.0 event record."""

    event_type: str
    trace_id: str
    payload: Dict[str, Any]
    ts: str = ""

    def __post_init__(self) -> None:
        if not self.ts:
            self.ts = _ts()

    def as_dict(self) -> Dict[str, Any]:
        d = asdict(self)
        d["schema"] = "lvm2.0"
        return d


def tax_document_lifecycle_events(
    trace_id: str,
    phase: str,
    *,
    session_id: str,
    user_id: str,
    document_type: str,
    lvm_route: Optional[str] = None,
    extra: Optional[Dict[str, Any]] = None,
) -> List[Dict[str, Any]]:
    """
    Standard phases: JobQueued, JobRunning, JobCompleted, JobFailed (aligned with document pipeline).
    ``phase`` should be one of: queued, running, completed, failed.
    """
    p = phase.lower()
    type_map = {
        "queued": "TaxDocumentJobQueued",
        "running": "TaxDocumentJobRunning",
        "completed": "TaxDocumentJobCompleted",
        "failed": "TaxDocumentJobFailed",
    }
    et = type_map.get(p, "TaxDocumentLifecycle")
    body: Dict[str, Any] = {
        "session_id": session_id,
        "user_id": user_id,
        "document_type": document_type,
        "phase": p,
    }
    if lvm_route:
        body["lvm_route"] = lvm_route
    if extra:
        body.update(extra)
    if phase == "failed" and extra:
        body.setdefault("error", extra.get("error"))
    ev = LvmEvent(event_type=et, trace_id=trace_id, payload=body)
    return [ev.as_dict()]


def append_events_via_client(client: CaveClient, events: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Send events through Cave ``/lvm/append`` when configured."""
    if not events:
        return {"ok": True, "skipped": True}
    return client.append_lvm(events)

