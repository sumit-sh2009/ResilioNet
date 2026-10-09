"""Physical gate: interchange identity and no route through an active hazard."""

from __future__ import annotations

from resilionet_agents.invariants import (
    isochrone_band,
    power_balanced,
    power_residual_mw,
    triage,
)
from resilionet_agents.state import PlanState

MAX_ATTEMPTS = 3
DIRECTIVE = (
    "Residual MW is generation plus net interchange minus demand, within 1 MW. "
    "Do not drop interchange. "
    "The recommended route must stay outside the active hazard polygon. "
    "Triage a ZIP only when emPOWER count is positive and travel exceeds 20 minutes."
)


def evaluate_state(state: PlanState) -> list[str]:
    errors: list[str] = []
    grid = state.get("grid") or {}
    expected_residual = power_residual_mw(
        grid["demand_mw"], grid["generation_mw"], grid["net_interchange_mw"]
    )
    expected_balanced = power_balanced(
        grid["demand_mw"], grid["generation_mw"], grid["net_interchange_mw"]
    )
    if not grid.get("used_interchange"):
        errors.append("grid residual omitted net interchange")
    if abs(float(grid.get("residual_mw", 9999)) - expected_residual) > 1e-6:
        errors.append(f"residual {grid.get('residual_mw')} != {expected_residual}")
    if grid.get("balanced") != expected_balanced:
        errors.append(f"balanced flag {grid.get('balanced')} != {expected_balanced}")
    routing = state.get("routing") or {}
    if routing.get("hits_hazard"):
        errors.append(f"route {routing.get('name')} intersects {routing.get('hazard')}")
    for place in (state.get("population") or {}).get("places") or []:
        if place["band"] != isochrone_band(place["minutes"]):
            errors.append(f"{place['zip']} band {place['band']} is wrong")
        if place["triage"] != triage(place["minutes"], place["empower"]):
            errors.append(f"{place['zip']} triage flag does not match the 20-minute rule")
    return errors


def _plan(state: PlanState) -> str:
    grid = state["grid"]
    routing = state["routing"]
    places = state["population"]["places"]
    triage_zips = [place["zip"] for place in places if place["triage"]]
    lines = [
        f"Resilience plan for {state.get('county')}",
        f"Snapshot {state.get('snapshot_date')} ({state.get('data_source')}), confidence {state.get('confidence')}.",
        f"ERCOT residual {grid['residual_mw']} MW. Balanced: {grid['balanced']}.",
        f"Route {routing['name']} avoids hazard: {not routing['hits_hazard']}.",
        f"Priority ZIPs (emPOWER and travel over 20 minutes): {', '.join(triage_zips) or 'none'}.",
    ]
    if float(state.get("confidence") or 1) < 0.8:
        lines.append("Degraded: live EIA telemetry missed the 1500 ms budget. This plan uses the cache.")
    return "\n".join(lines)


def evaluator_node(state: PlanState) -> dict:
    errors = evaluate_state(state)
    attempt = int(state.get("iteration", 0))
    if not errors:
        return {
            "status": "certified",
            "re_evaluation_directive": "",
            "certified_docket": {
                "county": state.get("county"),
                "snapshot_date": state.get("snapshot_date"),
                "data_source": state.get("data_source"),
                "confidence": state.get("confidence"),
                "degraded": float(state.get("confidence") or 1) < 0.8,
                "grid": state.get("grid"),
                "routing": state.get("routing"),
                "population": state.get("population"),
                "plan": _plan(state),
            },
            "audit_trail": [{"iteration": attempt, "result": "certified"}],
        }
    payload = {
        "certified_docket": None,
        "re_evaluation_directive": DIRECTIVE,
        "rejection_vector": errors,
    }
    if attempt + 1 >= MAX_ATTEMPTS:
        return {
            **payload,
            "status": "human_review",
            "iteration": attempt + 1,
            "audit_trail": [{"iteration": attempt, "result": "human_review", "errors": errors}],
        }
    return {
        **payload,
        "status": "pending",
        "iteration": attempt + 1,
        "audit_trail": [{"iteration": attempt, "result": "rejected", "errors": errors}],
    }


def human_review_node(state: PlanState) -> dict:
    return {
        "status": "human_review",
        "certified_docket": None,
        "audit_trail": [{"iteration": state.get("iteration", 0), "result": "queued_for_human_review"}],
    }
