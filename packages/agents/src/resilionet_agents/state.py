"""Graph channels."""

from __future__ import annotations

import operator
from typing import Annotated, Any, TypedDict


def replace(_left: Any, right: Any) -> Any:
    return right


class PlanState(TypedDict, total=False):
    county: str
    iteration: int
    stick_to_unsafe_plan: bool
    grid: Annotated[dict[str, Any], replace]
    routing: Annotated[dict[str, Any], replace]
    population: Annotated[dict[str, Any], replace]
    data_source: str
    confidence: float
    snapshot_date: str
    rejection_vector: Annotated[list[str], operator.add]
    audit_trail: Annotated[list[dict[str, Any]], operator.add]
    re_evaluation_directive: str
    certified_docket: dict[str, Any] | None
    status: str
