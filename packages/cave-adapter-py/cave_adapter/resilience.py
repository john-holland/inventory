from __future__ import annotations

import random
import time
from dataclasses import dataclass
from typing import Callable, TypeVar

T = TypeVar("T")


@dataclass
class TokenBucketLimiter:
    capacity: float
    refill_per_sec: float
    _tokens: float = 0.0
    _last: float = 0.0

    def __post_init__(self) -> None:
        self._tokens = float(self.capacity)
        self._last = time.monotonic()

    def _refill(self) -> None:
        now = time.monotonic()
        delta = now - self._last
        self._last = now
        self._tokens = min(self.capacity, self._tokens + delta * self.refill_per_sec)

    def try_consume(self, n: float = 1.0) -> bool:
        self._refill()
        if self._tokens >= n:
            self._tokens -= n
            return True
        return False


@dataclass
class CircuitBreaker:
    failure_threshold: int
    cooldown_s: float
    half_open_max: int
    failures: int = 0
    opened_at: float = 0.0
    state: str = "closed"
    half_attempts: int = 0

    def before_call(self) -> None:
        if self.state == "open":
            if time.monotonic() - self.opened_at >= self.cooldown_s:
                self.state = "half_open"
                self.half_attempts = 0
            else:
                raise RuntimeError("circuit_open")
        if self.state == "half_open" and self.half_attempts >= self.half_open_max:
            raise RuntimeError("circuit_open")
        if self.state == "half_open":
            self.half_attempts += 1

    def on_success(self) -> None:
        self.failures = 0
        self.state = "closed"
        self.half_attempts = 0

    def on_failure(self) -> None:
        self.failures += 1
        if self.state == "half_open":
            self.state = "open"
            self.opened_at = time.monotonic()
            return
        if self.failures >= self.failure_threshold:
            self.state = "open"
            self.opened_at = time.monotonic()


def _jitter_ms(base: float) -> float:
    return base * (0.5 + random.random())


def retry_call(
    fn: Callable[[], T],
    *,
    max_attempts: int = 3,
    base_delay_s: float = 0.1,
    max_delay_s: float = 2.0,
    is_retriable: Callable[[BaseException], bool],
) -> T:
    attempt = 0
    delay = base_delay_s
    while True:
        try:
            return fn()
        except BaseException as e:  # noqa: BLE001
            attempt += 1
            if attempt >= max_attempts:
                raise
            if not is_retriable(e):
                raise
            time.sleep(_jitter_ms(min(delay, max_delay_s)))
            delay = min(delay * 2, max_delay_s)
