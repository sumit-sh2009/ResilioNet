"""Local ERCOT / NWS / emPOWER snapshot and the 1500 ms EIA fallback."""

from __future__ import annotations

import json
from copy import deepcopy
from pathlib import Path

import httpx

FIXTURE_PATH = Path(__file__).with_name("fixtures") / "bastrop.json"
EIA_URL = "https://api.eia.gov/v2/electricity/rto/region-data/data/"
DEFAULT_TIMEOUT_MS = 1500


def load_county() -> dict:
    county = json.loads(FIXTURE_PATH.read_text(encoding="utf-8"))
    county = deepcopy(county)
    county["data_source"] = "cache"
    county["confidence"] = 1.0
    return county


async def fetch_grid(
    *,
    live: bool = False,
    timeout_ms: int = DEFAULT_TIMEOUT_MS,
    client: httpx.AsyncClient | None = None,
) -> dict:
    if not live:
        return load_county()
    owns_client = client is None
    http = client or httpx.AsyncClient(timeout=timeout_ms / 1000)
    try:
        response = await http.get(EIA_URL)
        response.raise_for_status()
        county = load_county()
        county["data_source"] = "live"
        county["confidence"] = 1.0
        county["live_status"] = response.status_code
        return county
    except (httpx.TimeoutException, httpx.HTTPError, json.JSONDecodeError):
        county = load_county()
        county["data_source"] = "cache"
        county["confidence"] = 0.4
        county["fallback_reason"] = "eia_timeout_or_error"
        return county
    finally:
        if owns_client:
            await http.aclose()
