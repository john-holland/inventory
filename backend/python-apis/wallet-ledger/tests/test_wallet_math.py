"""Tests for wallet_math CLI (stdin JSON → stdout JSON)."""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

import pytest

SCRIPT = Path(__file__).resolve().parent.parent / "wallet_math.py"


def _run(stdin_obj: dict) -> dict:
    proc = subprocess.run(
        [sys.executable, str(SCRIPT)],
        input=json.dumps(stdin_obj),
        text=True,
        capture_output=True,
        check=False,
    )
    assert proc.returncode == 0, (proc.stderr, proc.stdout)
    return json.loads(proc.stdout)


def test_investment_enable_check_aligned():
    out = _run(
        {
            "op": "investment_enable_check",
            "shipping_hold_2x": "100",
            "risk_percentage": "50",
            "risk_boundary_error": "0.15",
            "anti_collateral": "7.5",
        }
    )
    assert out["ok"] is True
    assert out["expected"] in ("7.5", "7.50")
    assert out["amount_at_risk"] in ("50", "50.0", "50.00")


def test_investment_enable_check_mismatch():
    out = _run(
        {
            "op": "investment_enable_check",
            "shipping_hold_2x": "100",
            "risk_percentage": "50",
            "risk_boundary_error": "0.15",
            "anti_collateral": "1",
        }
    )
    assert out["ok"] is False
    assert out["error"] == "anti_collateral_mismatch"
    assert "expected" in out


def test_tolerance_boundary_just_inside():
    # expected = 7.5, tol 0.02 → 7.48 ok, 7.52 ok
    out = _run(
        {
            "op": "investment_enable_check",
            "shipping_hold_2x": "100",
            "risk_percentage": "50",
            "risk_boundary_error": "0.15",
            "anti_collateral": "7.48",
        }
    )
    assert out["ok"] is True


def test_unknown_op():
    out = _run({"op": "nope"})
    assert out["ok"] is False
    assert out["error"] == "unknown_op"


def test_empty_input():
    proc = subprocess.run(
        [sys.executable, str(SCRIPT)],
        input="",
        text=True,
        capture_output=True,
        check=False,
    )
    assert proc.returncode == 0
    out = json.loads(proc.stdout)
    assert out["ok"] is False
    assert out["error"] == "empty_input"
