#!/usr/bin/env python3
"""Decimal-safe checks for Cave wallet / investment flows (stdin JSON → stdout JSON)."""
from __future__ import annotations

import json
import sys
from decimal import Decimal, InvalidOperation


def _dec(x) -> Decimal:
    try:
        return Decimal(str(x))
    except (InvalidOperation, TypeError, ValueError) as e:
        raise ValueError(f"invalid_decimal:{x}") from e


def investment_enable_check(data: dict) -> dict:
    shipping = _dec(data.get("shipping_hold_2x", 0))
    pct = _dec(data.get("risk_percentage", 0))
    boundary = _dec(data.get("risk_boundary_error", 0))
    anti = _dec(data.get("anti_collateral", 0))
    amount_at_risk = (shipping * pct) / Decimal("100")
    expected_anti = amount_at_risk * boundary
    tol = Decimal("0.02")
    if (anti - expected_anti).copy_abs() > tol:
        return {
            "ok": False,
            "error": "anti_collateral_mismatch",
            "expected": str(expected_anti),
            "amount_at_risk": str(amount_at_risk),
        }
    return {
        "ok": True,
        "expected": str(expected_anti),
        "amount_at_risk": str(amount_at_risk),
    }


def main() -> dict:
    raw = sys.stdin.read()
    if not raw.strip():
        return {"ok": False, "error": "empty_input"}
    try:
        data = json.loads(raw)
    except json.JSONDecodeError as e:
        return {"ok": False, "error": "invalid_json", "message": str(e)}
    op = data.get("op")
    if op == "investment_enable_check":
        try:
            return investment_enable_check(data)
        except ValueError as e:
            return {"ok": False, "error": "invalid_number", "message": str(e)}
    return {"ok": False, "error": "unknown_op", "op": op}


if __name__ == "__main__":
    json.dump(main(), sys.stdout)
