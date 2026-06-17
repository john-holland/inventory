import os
import sys
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from log_view_machine.soa_discovery import (  # noqa: E402
    AwsCloudMapRegistryAdapter,
    DiscoveryContext,
    OpenShiftDnsRegistryAdapter,
    resolve_hybrid_service_urls,
)


class TestSoaDiscovery(unittest.TestCase):
    def test_openshift_template_merge(self):
        os.environ["SOA_OCP_URL_TEMPLATE"] = "http://{service}.{namespace}.svc"
        os.environ["OCP_NAMESPACE"] = "app1"
        os.environ.pop("SOA_USE_AWS_DISCOVERY", None)
        try:
            ctx = DiscoveryContext.from_environ()
            o = OpenShiftDnsRegistryAdapter().resolve_service_urls(ctx)
            self.assertEqual(o.get("resaurce"), "http://resaurce.app1.svc")
        finally:
            os.environ.pop("SOA_OCP_URL_TEMPLATE", None)
            os.environ.pop("OCP_NAMESPACE", None)

    def test_aws_adapter_empty_without_flag(self):
        os.environ.pop("SOA_USE_AWS_DISCOVERY", None)
        self.assertEqual(AwsCloudMapRegistryAdapter().resolve_service_urls(DiscoveryContext()), {})

    def test_resolve_hybrid_prefers_ocp_override(self):
        os.environ["SOA_RES_AURCE_URL"] = "http://config-res.example"
        os.environ["SOA_OCP_URL_TEMPLATE"] = "http://{service}.{namespace}.svc"
        os.environ["OCP_NAMESPACE"] = "ns"
        os.environ.pop("SOA_REGISTRY_PATH", None)
        os.environ.pop("SOA_USE_AWS_DISCOVERY", None)
        try:
            m = resolve_hybrid_service_urls(DiscoveryContext())
            self.assertEqual(m.get("resaurce"), "http://resaurce.ns.svc")
        finally:
            os.environ.pop("SOA_RES_AURCE_URL", None)
            os.environ.pop("SOA_OCP_URL_TEMPLATE", None)
            os.environ.pop("OCP_NAMESPACE", None)
