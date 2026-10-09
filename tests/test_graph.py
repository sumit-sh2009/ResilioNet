"""An omitted interchange and a flooded shortcut are rejected, then replaced."""

import pytest

from resilionet_agents.graph import build_graph


def _request(**overrides: object) -> dict:
    payload = {
        "county": "Bastrop County, TX",
        "iteration": 0,
        "stick_to_unsafe_plan": False,
        "status": "pending",
        "re_evaluation_directive": "",
        "rejection_vector": [],
        "audit_trail": [],
    }
    payload.update(overrides)
    return payload


@pytest.mark.asyncio
async def test_evaluator_requires_interchange_and_a_dry_route() -> None:
    result = await build_graph().ainvoke(_request())
    assert result["status"] == "certified"
    assert result["iteration"] == 1
    assert result["grid"]["residual_mw"] == 0
    assert result["grid"]["used_interchange"] is True
    assert result["routing"]["name"] == "detour"
    assert result["routing"]["hits_hazard"] is False
    triage = [place["zip"] for place in result["population"]["places"] if place["triage"]]
    assert triage == ["78602"]
    assert result["certified_docket"]["degraded"] is False
    assert any("interchange" in item for item in result["rejection_vector"])


@pytest.mark.asyncio
async def test_stuck_shortcut_exits_to_human_review() -> None:
    result = await build_graph().ainvoke(_request(stick_to_unsafe_plan=True))
    assert result["status"] == "human_review"
    assert result["iteration"] == 3
    assert result["certified_docket"] is None
