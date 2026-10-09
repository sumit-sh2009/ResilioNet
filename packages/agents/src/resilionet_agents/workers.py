"""Grid, route, and population workers. The short route is not allowed through a flood."""

from __future__ import annotations

from resilionet_agents.invariants import (
    isochrone_band,
    power_balanced,
    power_residual_mw,
    route_hits_hazard,
    triage,
)
from resilionet_agents.state import PlanState
from resilionet_mcp.catalog import load_county


def _unsafe(state: PlanState) -> bool:
    return bool(state.get("stick_to_unsafe_plan")) or (
        state.get("iteration", 0) == 0 and not state.get("re_evaluation_directive")
    )


def grid_worker(state: PlanState) -> dict:
    county = load_county()
    grid = county["grid"]
    if _unsafe(state):
        residual = grid["generation_mw"] - grid["demand_mw"]
        balanced = abs(residual) <= 5000
        used_interchange = False
    else:
        residual = power_residual_mw(grid["demand_mw"], grid["generation_mw"], grid["net_interchange_mw"])
        balanced = power_balanced(grid["demand_mw"], grid["generation_mw"], grid["net_interchange_mw"])
        used_interchange = True
    return {
        "grid": {
            **grid,
            "residual_mw": residual,
            "balanced": balanced,
            "used_interchange": used_interchange,
        },
        "data_source": county["data_source"],
        "confidence": county["confidence"],
        "snapshot_date": county["snapshot_date"],
        "county": state.get("county") or county["county"],
    }


def routing_worker(state: PlanState) -> dict:
    county = load_county()
    name = "short" if _unsafe(state) else "detour"
    points = county["routes"][name]
    return {
        "routing": {
            "name": name,
            "points": points,
            "hits_hazard": route_hits_hazard(points, county["hazard"]),
            "hazard": county["hazard"]["name"],
        }
    }


def population_worker(_state: PlanState) -> dict:
    county = load_county()
    places = []
    for place in county["travel"]:
        places.append(
            {
                **place,
                "band": isochrone_band(place["minutes"]),
                "triage": triage(place["minutes"], place["empower"]),
            }
        )
    return {"population": {"places": places}}
