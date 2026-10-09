"""Health check and one certified county plan."""

import pytest
from fastapi.testclient import TestClient

from resilionet_api.main import create_app


@pytest.fixture
def client(monkeypatch: pytest.MonkeyPatch) -> TestClient:
    monkeypatch.delenv("DATABASE_URL", raising=False)
    with TestClient(create_app()) as test_client:
        yield test_client


def test_health(client: TestClient) -> None:
    assert client.get("/health").json() == {"status": "ok", "service": "resilionet"}


def test_plan_certifies_the_detour(client: TestClient) -> None:
    response = client.post("/plans", json={"county": "Bastrop County, TX"})
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "certified"
    assert body["confidence"] == 1.0
    assert body["docket"]["routing"]["name"] == "detour"
    assert body["docket"]["grid"]["residual_mw"] == 0


def test_blank_county_is_422(client: TestClient) -> None:
    response = client.post("/plans", json={"county": "TX"})
    assert response.status_code == 422
