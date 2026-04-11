"""
Structural routing: optional servicename:path/to/LVM/message

See docs/cave-tome-lvm/SPEC.md for normative grammar.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Optional


class RoutingError(Exception):
    """Typed routing failure (UNKNOWN_ROUTE, SERVICE_NOT_REGISTERED, etc.)."""

    def __init__(self, code: str, message: str):
        super().__init__(message)
        self.code = code


_SEGMENT = re.compile(r"^[a-z0-9_]+$")


@dataclass(frozen=True)
class ParsedRoute:
    """Result of parse_routed_subject."""

    explicit_service: Optional[str]  # e.g. "resaurce" when prefix present
    structural_path: str  # path without service prefix, e.g. "hr/help/session/create"
    message_name: Optional[str]  # reserved for explicit message suffix; often None


def parse_routed_subject(subject: str) -> ParsedRoute:
    """
    Parse ``servicename:domain/resource/...`` or path-only ``domain/resource/...``.

    - If ``:`` appears, first segment (before colon) is explicit_service; remainder is path.
    - structural_path is the full slug path (all segments); message_name left None unless extended later.
    """
    if not subject or not subject.strip():
        raise RoutingError("UNKNOWN_ROUTE", "empty route")

    s = subject.strip()
    explicit_service: Optional[str] = None
    path_part = s

    if ":" in s:
        svc, rest = s.split(":", 1)
        svc = svc.strip()
        rest = rest.strip().lstrip("/")
        if not svc or not rest:
            raise RoutingError("UNKNOWN_ROUTE", "invalid service:path split")
        explicit_service = svc
        path_part = rest
    else:
        path_part = s.lstrip("/")

    segments = [p for p in path_part.split("/") if p]
    if not segments:
        raise RoutingError("UNKNOWN_ROUTE", "no path segments")

    for seg in segments:
        if not _SEGMENT.match(seg):
            raise RoutingError(
                "UNKNOWN_ROUTE",
                f"invalid segment {seg!r}: use lowercase slug tokens [a-z0-9_]",
            )

    message_name: Optional[str] = None
    structural_path = "/".join(segments)
    return ParsedRoute(
        explicit_service=explicit_service,
        structural_path=structural_path,
        message_name=message_name,
    )


def default_registry_entry(service_name: str) -> Optional[str]:
    """Placeholder: map service name to base URL from env in CaveClient."""
    return None  # CaveClient reads os.environ instead
