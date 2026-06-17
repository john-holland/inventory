"""Tests for SOA registry merge and hybrid resolver."""

from __future__ import annotations

import json
import os
import sys
import tempfile
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from log_view_machine.cave_client import CaveClient
from log_view_machine.service_registry import (
    build_service_endpoint_registry,
    build_service_urls_from_env_and_file,
    load_registry_file,
)
from log_view_machine.soa_discovery import DiscoveryContext, resolve_hybrid_service_urls


class TestServiceRegistry(unittest.TestCase):
    def test_flat_json_file(self) -> None:
        with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False) as f:
            json.dump({"resaurce": "http://a.example", "saurce": "http://b.example"}, f)
            path = f.name
        try:
            reg = load_registry_file(path)
            self.assertEqual(reg["default"]["resaurce"], "http://a.example")
        finally:
            os.unlink(path)

    def test_flat_yaml_file(self) -> None:
        yml = "contexts:\n  default:\n    resaurce: http://yaml-res.example\n"
        with tempfile.NamedTemporaryFile("w", suffix=".yaml", delete=False) as f:
            f.write(yml)
            path = f.name
        try:
            reg = load_registry_file(path)
            self.assertEqual(reg["default"]["resaurce"], "http://yaml-res.example")
        finally:
            os.unlink(path)

    def test_build_service_endpoint_registry(self) -> None:
        os.environ["SOA_SAURCE_URL"] = "http://s-endpoint"
        try:
            reg = build_service_endpoint_registry()
            self.assertIn("saurce", reg)
            self.assertEqual(reg["saurce"].base_url, "http://s-endpoint")
            self.assertEqual(reg["saurce"].connect_timeout_ms, 5000)
        finally:
            del os.environ["SOA_SAURCE_URL"]

    def test_contexts_json(self) -> None:
        with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False) as f:
            json.dump(
                {
                    "contexts": {
                        "default": {"resaurce": "http://d1", "saurce": "http://s1"},
                        "staging": {"resaurce": "http://d2"},
                    }
                },
                f,
            )
            path = f.name
        try:
            merged = build_service_urls_from_env_and_file(
                context_key="staging",
                registry_path=path,
            )
            self.assertEqual(merged["resaurce"], "http://d2")
            self.assertNotIn("saurce", merged)
        finally:
            os.unlink(path)

    def test_env_overrides_file(self) -> None:
        with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False) as f:
            json.dump({"contexts": {"default": {"resaurce": "http://from-file"}}}, f)
            path = f.name
        try:
            os.environ["SOA_RES_AURCE_URL"] = "http://from-env"
            merged = build_service_urls_from_env_and_file(registry_path=path)
            self.assertEqual(merged["resaurce"], "http://from-env")
        finally:
            os.unlink(path)
            del os.environ["SOA_RES_AURCE_URL"]

    def test_cave_base_fallback(self) -> None:
        os.environ["CAVE_BASE_URL"] = "http://legacy-cave"
        try:
            merged = build_service_urls_from_env_and_file(registry_path="__missing__")
            self.assertEqual(merged["resaurce"], "http://legacy-cave")
        finally:
            del os.environ["CAVE_BASE_URL"]

    def test_resolve_hybrid_smoke(self) -> None:
        ctx = DiscoveryContext(stage="default")
        urls = resolve_hybrid_service_urls(ctx)
        self.assertIsInstance(urls, dict)

    def test_cave_client_base_for_route_per_service(self) -> None:
        os.environ["SOA_SAURCE_URL"] = "http://saurce-test"
        os.environ["SOA_RES_AURCE_URL"] = "http://resaurce-test"
        try:
            c = CaveClient(base_url="")
            self.assertEqual(c.base_for_route("saurce:crypto/x/y"), "http://saurce-test")
            self.assertEqual(c.base_for_route("resaurce:hr/x"), "http://resaurce-test")
        finally:
            del os.environ["SOA_SAURCE_URL"]
            del os.environ["SOA_RES_AURCE_URL"]
