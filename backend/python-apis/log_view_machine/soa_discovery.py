"""
Ec2SubnetConfigurationAdapter pattern: config-first registry + optional AWS Cloud Map.

Hybrid: ``ConfigSubnetRegistryAdapter`` loads JSON contexts; ``AwsCloudMapRegistryAdapter``
resolves instances when ``SOA_USE_AWS_DISCOVERY=1`` and boto3 is available; falls back to
config when discovery is empty or misconfigured.

``OpenShiftDnsRegistryAdapter`` applies ``SOA_OCP_URL_TEMPLATE`` + namespace from platform env.
"""

from __future__ import annotations

import json
import os
from dataclasses import dataclass
from typing import Dict, Mapping, MutableMapping, Optional, Protocol

from .service_registry import build_service_urls_from_env_and_file


@dataclass
class DiscoveryContext:
    """VPC/subnet/stage hints for choosing a row in the SOA registry file."""

    vpc_id: Optional[str] = None
    subnet_id: Optional[str] = None
    stage: Optional[str] = None
    region: Optional[str] = None

    @classmethod
    def from_environ(cls) -> "DiscoveryContext":
        return cls(
            vpc_id=os.environ.get("SOA_VPC_ID"),
            subnet_id=os.environ.get("SOA_SUBNET_ID"),
            stage=os.environ.get("SOA_STAGE"),
            region=os.environ.get("AWS_REGION") or os.environ.get("AWS_DEFAULT_REGION"),
        )

    def registry_context_key(self) -> str:
        if self.vpc_id and self.subnet_id:
            return f"{self.vpc_id}__{self.subnet_id}"
        if self.stage:
            return self.stage
        return os.environ.get("SOA_REGISTRY_CONTEXT") or "default"


class Ec2SubnetConfigurationAdapter(Protocol):
    """Resolve logical service names to Cave base URLs for the current deployment context."""

    def resolve_service_urls(self, ctx: DiscoveryContext) -> Mapping[str, str]:
        ...


class ConfigSubnetRegistryAdapter:
    """Load ``contexts`` from ``SOA_REGISTRY_PATH`` JSON and merge env overrides."""

    def __init__(self, registry_path: Optional[str] = None):
        self._registry_path = registry_path or os.environ.get("SOA_REGISTRY_PATH")

    def resolve_service_urls(self, ctx: DiscoveryContext) -> Dict[str, str]:
        return build_service_urls_from_env_and_file(
            context_key=ctx.registry_context_key(),
            registry_path=self._registry_path,
        )


def _cloudmap_instance_url(attrs: Mapping[str, str], scheme: str) -> Optional[str]:
    ip = attrs.get("AWS_INSTANCE_IPV4") or attrs.get("IP_ADDRESS")
    cname = attrs.get("AWS_INSTANCE_CNAME")
    port_s = str(attrs.get("AWS_INSTANCE_PORT") or attrs.get("PORT") or ("443" if scheme == "https" else "80"))
    if ip:
        default = "443" if scheme == "https" else "80"
        if port_s == default:
            return f"{scheme}://{ip}"
        return f"{scheme}://{ip}:{port_s}"
    if cname:
        host = cname.rstrip(".")
        default = "443" if scheme == "https" else "80"
        if port_s == default:
            return f"{scheme}://{host}"
        return f"{scheme}://{host}:{port_s}"
    return None


class AwsCloudMapRegistryAdapter:
    """
    Optional AWS Cloud Map overrides via ``servicediscovery:DiscoverInstances``.

    Env:
    - ``SOA_USE_AWS_DISCOVERY=1``
    - ``SOA_CLOUDMAP_NAMESPACE_ID`` — Cloud Map namespace id
    - ``SOA_CLOUDMAP_SERVICES_JSON`` — mapping ``{{"resaurce": "my-resaurce-sd", "saurce": "..."}}``
      where values are **Service names** (not ARNs) in that namespace.
    - ``SOA_CLOUDMAP_SCHEME`` — ``http`` or ``https`` (default ``http``)
    """

    def resolve_service_urls(self, ctx: DiscoveryContext) -> Dict[str, str]:
        if os.environ.get("SOA_USE_AWS_DISCOVERY") != "1":
            return {}
        try:
            import boto3  # type: ignore[import-not-found]
        except ImportError:
            return {}
        namespace_id = (os.environ.get("SOA_CLOUDMAP_NAMESPACE_ID") or "").strip()
        if not namespace_id:
            return {}
        raw = (os.environ.get("SOA_CLOUDMAP_SERVICES_JSON") or "{}").strip()
        try:
            mapping: Dict[str, str] = json.loads(raw) if raw else {}
        except json.JSONDecodeError:
            return {}
        if not mapping:
            return {}
        scheme = (os.environ.get("SOA_CLOUDMAP_SCHEME") or "http").strip().lower()
        if scheme not in ("http", "https"):
            scheme = "http"
        client = boto3.client("servicediscovery", region_name=ctx.region or None)
        out: Dict[str, str] = {}
        for logical, svc_name in mapping.items():
            if not logical or not svc_name:
                continue
            try:
                resp = client.discover_instances(
                    NamespaceId=namespace_id,
                    ServiceName=svc_name,
                    MaxResults=10,
                )
            except Exception:  # noqa: BLE001
                continue
            instances = resp.get("Instances") or []
            if not instances:
                continue
            attrs = instances[0].get("Attributes") or {}
            url = _cloudmap_instance_url(attrs, scheme)
            if url:
                out[logical] = url
        return out


class OpenShiftDnsRegistryAdapter:
    """
    OpenShift / K8s internal DNS style bases from a single URL template.

    Env:
    - ``SOA_OCP_URL_TEMPLATE`` — e.g. ``https://{service}-cave-{namespace}.apps.cluster.example.com``
      or ``http://{service}.{namespace}.svc.cluster.local:8080``
    - ``OCP_NAMESPACE`` or ``KUBERNETES_NAMESPACE`` or ``POD_NAMESPACE`` — substituted as ``{namespace}``
    """

    def resolve_service_urls(self, ctx: DiscoveryContext) -> Dict[str, str]:  # noqa: ARG002
        template = (os.environ.get("SOA_OCP_URL_TEMPLATE") or "").strip()
        ns = (
            os.environ.get("OCP_NAMESPACE")
            or os.environ.get("KUBERNETES_NAMESPACE")
            or os.environ.get("POD_NAMESPACE")
            or ""
        ).strip()
        if not template or not ns:
            return {}
        out: Dict[str, str] = {}
        for logical in ("resaurce", "saurce", "inventory"):
            url = (
                template.replace("{service}", logical)
                .replace("{namespace}", ns)
                .replace("{stage}", ctx.stage or "")
                .replace("{region}", ctx.region or "")
            ).strip()
            if url:
                out[logical] = url
        return out


def resolve_hybrid_service_urls(ctx: Optional[DiscoveryContext] = None) -> Dict[str, str]:
    """
    Merge Config then AWS then OpenShift non-empty keys (later adapters override earlier).
    Env vars inside config builder already apply last in ``build_service_urls_from_env_and_file``.
    """
    ctx = ctx or DiscoveryContext.from_environ()
    base: Dict[str, str] = dict(ConfigSubnetRegistryAdapter().resolve_service_urls(ctx))
    aws: Mapping[str, str] = AwsCloudMapRegistryAdapter().resolve_service_urls(ctx)
    merged: MutableMapping[str, str] = dict(base)
    for k, v in aws.items():
        if v:
            merged[k] = v
    ocp: Mapping[str, str] = OpenShiftDnsRegistryAdapter().resolve_service_urls(ctx)
    for k, v in ocp.items():
        if v:
            merged[k] = v
    return dict(merged)
