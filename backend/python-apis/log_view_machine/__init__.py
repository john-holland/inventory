"""
Log View Machine (LVM) — Python client library for Cave interop.

Cave / Tome / RobotCopy run on the Cave server (e.g. resaurce). This package provides:
route parsing, envelopes, HTTP cave adapters, and LVM2.0 lifecycle event helpers.
"""

from .routing import ParsedRoute, parse_routed_subject, RoutingError
from .envelope import MessageEnvelope, ReplyMode, build_envelope
from .cave_client import CaveClient, PresenceAwareCaveClient
from .lvm_events import LvmEvent, tax_document_lifecycle_events, append_events_via_client

__all__ = [
    "ParsedRoute",
    "parse_routed_subject",
    "RoutingError",
    "MessageEnvelope",
    "ReplyMode",
    "build_envelope",
    "CaveClient",
    "PresenceAwareCaveClient",
    "LvmEvent",
    "tax_document_lifecycle_events",
    "append_events_via_client",
]
