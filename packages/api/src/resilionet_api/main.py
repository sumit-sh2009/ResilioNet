"""FastAPI lifespan and one county plan."""

from __future__ import annotations

import os
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from uuid import uuid4

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from resilionet_agents.checkpointer import close_checkpointer, open_checkpointer
from resilionet_agents.graph import build_graph


class PlanRequest(BaseModel):
    county: str = Field(default="Bastrop County, TX", min_length=3)
    stick_to_unsafe_plan: bool = False


class PlanResponse(BaseModel):
    thread_id: str
    status: str
    iteration: int
    confidence: float | None = None
    data_source: str | None = None
    rejection_vector: list[str]
    audit_trail: list[dict]
    docket: dict | None = None


def create_app() -> FastAPI:
    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncIterator[None]:
        saver, pool = await open_checkpointer(os.environ.get("DATABASE_URL") or None)
        app.state.graph = build_graph(saver)
        app.state.pool = pool
        yield
        await close_checkpointer(pool)

    app = FastAPI(title="ResilioNet", version="0.1.0", lifespan=lifespan)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://127.0.0.1:5205", "http://localhost:5205"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/health")
    async def health() -> dict[str, str]:
        return {"status": "ok", "service": "resilionet"}

    @app.post("/plans", response_model=PlanResponse)
    async def plan(body: PlanRequest) -> PlanResponse:
        thread_id = str(uuid4())
        result = await app.state.graph.ainvoke(
            {
                "county": body.county,
                "iteration": 0,
                "stick_to_unsafe_plan": body.stick_to_unsafe_plan,
                "status": "pending",
                "re_evaluation_directive": "",
                "rejection_vector": [],
                "audit_trail": [],
            },
            config={"configurable": {"thread_id": thread_id}, "recursion_limit": 30},
        )
        return PlanResponse(
            thread_id=thread_id,
            status=result["status"],
            iteration=int(result.get("iteration", 0)),
            confidence=result.get("confidence"),
            data_source=result.get("data_source"),
            rejection_vector=list(result.get("rejection_vector") or []),
            audit_trail=list(result.get("audit_trail") or []),
            docket=result.get("certified_docket"),
        )

    return app


app = create_app()
