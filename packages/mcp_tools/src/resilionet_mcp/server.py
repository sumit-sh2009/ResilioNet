"""FastMCP tools for the Bastrop County snapshot."""

from __future__ import annotations

from fastmcp import FastMCP

from resilionet_mcp.catalog import load_county

mcp = FastMCP("ResilioNet")


@mcp.tool
def get_grid_snapshot() -> dict:
    """Cached ERCOT demand, generation, and interchange for the MVP county."""
    return load_county()["grid"]


@mcp.tool
def get_travel_bands() -> list[dict]:
    """Minutes from the station to fixture ZIP centroids, plus emPOWER counts."""
    return load_county()["travel"]


def main() -> None:
    mcp.run(transport="stdio")
