"""Power identity, flood intersection, and the EIA timeout."""

import httpx
import pytest

from resilionet_agents.invariants import (
    isochrone_band,
    power_balanced,
    power_residual_mw,
    route_hits_hazard,
    triage,
)
from resilionet_mcp.catalog import fetch_grid, load_county


def test_interchange_closes_the_ercot_identity() -> None:
    assert power_residual_mw(42000, 40000, 2000) == 0
    assert power_balanced(42000, 40000, 2000) is True


def test_dropping_interchange_is_not_balanced() -> None:
    assert power_balanced(42000, 40000, 0) is False


def test_short_route_hits_the_flood_and_the_detour_does_not() -> None:
    county = load_county()
    hazard = county["hazard"]
    assert route_hits_hazard(county["routes"]["short"], hazard) is True
    assert route_hits_hazard(county["routes"]["detour"], hazard) is False


def test_bands_and_triage() -> None:
    assert isochrone_band(12) == 20
    assert isochrone_band(28) == 30
    assert triage(28, 42) is True
    assert triage(12, 5) is False


@pytest.mark.asyncio
async def test_eia_timeout_marks_the_cache_degraded() -> None:
    class TimeoutTransport(httpx.AsyncBaseTransport):
        async def handle_async_request(self, request: httpx.Request) -> httpx.Response:
            raise httpx.TimeoutException("exceeded 1500ms")

    async with httpx.AsyncClient(transport=TimeoutTransport()) as http:
        county = await fetch_grid(live=True, timeout_ms=1500, client=http)
    assert county["data_source"] == "cache"
    assert county["confidence"] == 0.4
    assert county["fallback_reason"] == "eia_timeout_or_error"
    assert county["snapshot_date"] == "2024-07-08T18:00:00Z"
