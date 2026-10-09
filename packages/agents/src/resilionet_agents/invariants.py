"""Power identity, hazard intersection, and response bands."""

from __future__ import annotations

BALANCE_TOLERANCE_MW = 1.0


def power_residual_mw(demand_mw: float, generation_mw: float, net_interchange_mw: float) -> float:
    return generation_mw + net_interchange_mw - demand_mw


def power_balanced(demand_mw: float, generation_mw: float, net_interchange_mw: float) -> bool:
    return abs(power_residual_mw(demand_mw, generation_mw, net_interchange_mw)) <= BALANCE_TOLERANCE_MW


def point_in_hazard(lat: float, lon: float, hazard: dict) -> bool:
    return hazard["min_lat"] <= lat <= hazard["max_lat"] and hazard["min_lon"] <= lon <= hazard["max_lon"]


def route_hits_hazard(route: list[list[float]], hazard: dict) -> bool:
    return any(point_in_hazard(lat, lon, hazard) for lat, lon in route)


def isochrone_band(minutes: float) -> int:
    if minutes <= 10:
        return 10
    if minutes <= 20:
        return 20
    return 30


def triage(minutes: float, empower: int) -> bool:
    return empower > 0 and minutes > 20
