from __future__ import annotations

import json
import os
import urllib.error
import urllib.request
from typing import Any, Dict, Optional

from .resilience import CircuitBreaker, TokenBucketLimiter, retry_call


class HttpCaveTransport:
    """
    POST JSON to ``{base}/cave/route`` with optional retries, breaker, and limiter.
    """

    def __init__(
        self,
        timeout_s: float = 30.0,
        *,
        breaker: Optional[CircuitBreaker] = None,
        limiter: Optional[TokenBucketLimiter] = None,
        enable_retry: Optional[bool] = None,
    ) -> None:
        self.timeout_s = timeout_s
        thr = int(os.environ.get("CAVE_ADAPTER_BREAKER_THRESHOLD", "5"))
        self._breaker = breaker or CircuitBreaker(failure_threshold=thr, cooldown_s=15.0, half_open_max=1)
        rps = float(os.environ.get("CAVE_ADAPTER_RPS", "50"))
        self._limiter = limiter if limiter is not None else TokenBucketLimiter(capacity=rps, refill_per_sec=rps)
        if enable_retry is None:
            enable_retry = os.environ.get("CAVE_ADAPTER_RETRY", "1") != "0"
        self._enable_retry = enable_retry
        self._limiters_by_key: Dict[str, TokenBucketLimiter] = {}

    def _limiter_for(self, route_key: str) -> TokenBucketLimiter:
        if route_key not in self._limiters_by_key:
            rps = float(os.environ.get("CAVE_ADAPTER_RPS", "50"))
            self._limiters_by_key[route_key] = TokenBucketLimiter(capacity=rps, refill_per_sec=rps)
        return self._limiters_by_key[route_key]

    def post_cave_route(self, base_url: str, body: Dict[str, Any]) -> Dict[str, Any]:
        base = base_url.rstrip("/")
        route = str(body.get("route") or "")
        key = route.split(":", 1)[0] if ":" in route else route or "default"
        lim = self._limiter_for(key)
        if not lim.try_consume():
            return {"ok": False, "skipped": True, "reason": "usage_limited", "key": key}
        try:
            self._breaker.before_call()
        except RuntimeError as e:
            if str(e) == "circuit_open":
                return {"ok": False, "skipped": True, "reason": "circuit_open", "breaker_state": self._breaker.state}
            raise

        url = f"{base}/cave/route"
        data = json.dumps(body).encode("utf-8")

        def once() -> Dict[str, Any]:
            req = urllib.request.Request(
                url,
                data=data,
                headers={"Content-Type": "application/json"},
                method="POST",
            )
            try:
                with urllib.request.urlopen(req, timeout=self.timeout_s) as resp:
                    raw = resp.read().decode("utf-8")
                    return json.loads(raw) if raw else {"ok": True}
            except urllib.error.HTTPError as e:
                raw = e.read().decode("utf-8", errors="replace")
                if e.code >= 500 or e.code in (408, 429):
                    err = RuntimeError("http_error")
                    setattr(err, "code", e.code)
                    raise err from e
                return {"ok": False, "status": e.code, "error": raw}
            except urllib.error.URLError as e:
                raise ConnectionError(str(e.reason or e)) from e

        def is_retriable(e: BaseException) -> bool:
            code = getattr(e, "code", None)
            if isinstance(code, int) and (code >= 500 or code in (408, 429)):
                return True
            return isinstance(e, (ConnectionError, TimeoutError, OSError))

        try:
            if self._enable_retry:
                out = retry_call(once, max_attempts=3, is_retriable=is_retriable)
            else:
                out = once()
            self._breaker.on_success()
            return out
        except BaseException as e:  # noqa: BLE001
            self._breaker.on_failure()
            code = getattr(e, "code", None)
            err: Dict[str, Any] = {"ok": False, "error": str(e)}
            if isinstance(code, int):
                err["status"] = code
            return err
