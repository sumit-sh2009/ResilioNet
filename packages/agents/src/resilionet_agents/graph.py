"""Cyclic StateGraph for a county resilience plan."""

from __future__ import annotations

from langgraph.checkpoint.base import BaseCheckpointSaver
from langgraph.graph import END, START, StateGraph
from langgraph.types import Send

from resilionet_agents.evaluator import evaluator_node, human_review_node
from resilionet_agents.state import PlanState
from resilionet_agents.workers import grid_worker, population_worker, routing_worker


def dispatch(_state: PlanState) -> dict:
    return {}


def fan_out(state: PlanState) -> list[Send]:
    return [
        Send("grid_worker", state),
        Send("routing_worker", state),
        Send("population_worker", state),
    ]


def route_after_eval(state: PlanState) -> str:
    status = state.get("status")
    if status == "certified":
        return "certified"
    if status == "human_review":
        return "human_review"
    return "dispatch"


def build_graph(checkpointer: BaseCheckpointSaver | None = None):
    graph = StateGraph(PlanState)
    graph.add_node("dispatch", dispatch)
    graph.add_node("grid_worker", grid_worker)
    graph.add_node("routing_worker", routing_worker)
    graph.add_node("population_worker", population_worker)
    graph.add_node("evaluator", evaluator_node)
    graph.add_node("human_review", human_review_node)
    graph.add_edge(START, "dispatch")
    graph.add_conditional_edges("dispatch", fan_out)
    graph.add_edge("grid_worker", "evaluator")
    graph.add_edge("routing_worker", "evaluator")
    graph.add_edge("population_worker", "evaluator")
    graph.add_conditional_edges(
        "evaluator",
        route_after_eval,
        {"certified": END, "human_review": "human_review", "dispatch": "dispatch"},
    )
    graph.add_edge("human_review", END)
    return graph.compile(checkpointer=checkpointer)
