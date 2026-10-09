"""AsyncPostgresSaver when DATABASE_URL is set; memory saver otherwise."""

from __future__ import annotations

from langgraph.checkpoint.base import BaseCheckpointSaver
from langgraph.checkpoint.memory import MemorySaver


async def open_checkpointer(
    database_url: str | None,
) -> tuple[BaseCheckpointSaver, object | None]:
    if not database_url:
        return MemorySaver(), None

    from psycopg.rows import dict_row
    from psycopg_pool import AsyncConnectionPool
    from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver

    pool = AsyncConnectionPool(
        conninfo=database_url,
        kwargs={
            "autocommit": True,
            "prepare_threshold": 0,
            "row_factory": dict_row,
        },
        open=False,
        max_size=10,
    )
    await pool.open()
    saver = AsyncPostgresSaver(pool)
    await saver.setup()
    return saver, pool


async def close_checkpointer(pool: object | None) -> None:
    if pool is not None:
        await pool.close()
