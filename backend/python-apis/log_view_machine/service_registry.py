"""
SOA service name → Cave base URL registry (config + env merge).

See docs/cave-tome-lvm/SPEC.md and docs/soa-registry.example.json.
"""

from __future__ import annotations

import json
import os
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Mapping, MutableMapping, Optional

try:
    import yaml  # type: ignore[import-untyped]
except ImportError:  # pragma: no cover
    yaml = None  # type: ignore[assignment]


@dataclass(frozen=True)
class ServiceEndpoint:
    """Resolved HTTP origin for a logical Cave host."""

    base_url: str
    connect_timeout_ms: int = 5_000
    read_timeout_ms: int = 30_000


def _norm_base(url: str) -> str:
    return (url or "").strip().rstrip("/")


def _merge_nonempty(target: MutableMapping[str, str], src: Mapping[str, str]) -> None:
    for k, v in src.items():
        if v:
            target[k] = v


def load_registry_file(path: str) -> Dict[str, Dict[str, str]]:
    """Load JSON or YAML registry (``.yaml`` / ``.yml`` requires PyYAML)."""
    p = Path(path)
    suffix = p.suffix.lower()
    with open(path, encoding="utf-8") as f:
        raw = f.read()
    if suffix in (".yaml", ".yml"):
        if yaml is None:
            raise RuntimeError("PyYAML is required to load SOA registry YAML files")
        data = yaml.safe_load(raw)
    else:
        data = json.loads(raw)
    return _normalize_registry_data(data)


def _normalize_registry_data(data: object) -> Dict[str, Dict[str, str]]:
    """Normalize parsed JSON/YAML into ``{ context_key: { service: url } }``."""
    if not isinstance(data, dict):
        return {}
    ctx = data.get("contexts")
    if isinstance(ctx, dict):
        out: Dict[str, Dict[str, str]] = {}
        for name, services in ctx.items():
            if isinstance(services, dict):
                out[str(name)] = {str(k): _norm_base(str(v)) for k, v in services.items() if v}
        return out
    flat = {str(k): _norm_base(str(v)) for k, v in data.items() if v and k != "contexts"}
    return {"default": flat} if flat else {}


def load_registry_json_file(path: str) -> Dict[str, Dict[str, str]]:
    """Backward-compatible alias: supports ``.json`` and other extensions via :func:`load_registry_file`."""
    return load_registry_file(path)


def urls_for_context(registry: Mapping[str, Mapping[str, str]], context_key: str) -> Dict[str, str]:
    if context_key in registry:
        return dict(registry[context_key])
    if "default" in registry:
        return dict(registry["default"])
    return {}


def build_service_urls_from_env_and_file(
    *,
    context_key: Optional[str] = None,
    registry_path: Optional[str] = None,
) -> Dict[str, str]:
    """
    Merge sources (later wins where non-empty):

    1. JSON file ``SOA_REGISTRY_PATH`` (or ``registry_path``) contexts[context_key]
    2. Per-service env: ``SOA_RES_AURCE_URL``, ``SOA_SAURCE_URL``, ``SOA_INVENTORY_URL``
    3. Legacy ``CAVE_BASE_URL`` → applies to ``resaurce`` only if ``SOA_RES_AURCE_URL`` unset
    """
    ctx = context_key or os.environ.get("SOA_REGISTRY_CONTEXT") or "default"
    path = registry_path or os.environ.get("SOA_REGISTRY_PATH")
    merged: Dict[str, str] = {}

    if path and os.path.isfile(path):
        reg = load_registry_file(path)
        _merge_nonempty(merged, urls_for_context(reg, ctx))

    env_map = {
        "resaurce": os.environ.get("SOA_RES_AURCE_URL") or os.environ.get("CAVE_BASE_URL"),
        "saurce": os.environ.get("SOA_SAURCE_URL"),
        "inventory": os.environ.get("SOA_INVENTORY_URL"),
    }
    _merge_nonempty(merged, {k: _norm_base(v) for k, v in env_map.items() if v})
    return merged


def build_service_endpoint_registry(
    *,
    context_key: Optional[str] = None,
    registry_path: Optional[str] = None,
    default_connect_ms: int = 5_000,
    default_read_ms: int = 30_000,
) -> Dict[str, ServiceEndpoint]:
    """Typed registry (``ServiceEndpoint`` per logical service name)."""
    urls = build_service_urls_from_env_and_file(context_key=context_key, registry_path=registry_path)
    return {
        name: ServiceEndpoint(base_url=url, connect_timeout_ms=default_connect_ms, read_timeout_ms=default_read_ms)
        for name, url in urls.items()
        if url
    }
