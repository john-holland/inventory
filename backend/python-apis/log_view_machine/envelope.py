"""
Versioned message envelope for Cave / LVM2.0 (client-side construction only).
"""

from __future__ import annotations

from dataclasses import dataclass, field, asdict
from enum import Enum
from typing import Any, Dict, Optional
import json
import uuid


class ReplyMode(str, Enum):
    sync_http = "sync_http"
    async_queue = "async_queue"
    async_poll_token = "async_poll_token"


@dataclass
class MessageEnvelope:
    """LVM envelope v2 (fields aligned with plan SPEC)."""

    schema_version: str = "2.0"
    route: str = ""
    payload: Dict[str, Any] = field(default_factory=dict)
    trace_id: str = ""
    causation_id: Optional[str] = None
    presence: Optional[str] = None
    reply_mode: str = ReplyMode.sync_http.value
    reply_to: Optional[str] = None
    tome_semver: Optional[str] = None
    tenant: Optional[str] = None

    def to_json(self) -> str:
        d = asdict(self)
        return json.dumps(d, separators=(",", ":"))


def build_envelope(
    route: str,
    payload: Optional[Dict[str, Any]] = None,
    *,
    trace_id: Optional[str] = None,
    presence: Optional[str] = None,
    reply_mode: ReplyMode = ReplyMode.sync_http,
    reply_to: Optional[str] = None,
    tenant: Optional[str] = None,
    tome_semver: Optional[str] = None,
) -> MessageEnvelope:
    return MessageEnvelope(
        route=route,
        payload=payload or {},
        trace_id=trace_id or str(uuid.uuid4()),
        presence=presence,
        reply_mode=reply_mode.value,
        reply_to=reply_to,
        tenant=tenant,
        tome_semver=tome_semver,
    )
