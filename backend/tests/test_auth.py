from __future__ import annotations

from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient


def test_discover_requires_auth(client: TestClient) -> None:
    from auth import require_firebase_user
    from main import app

    app.dependency_overrides.pop(require_firebase_user, None)
    try:
        response = client.get("/discover", params={"location": "Austin"})
        assert response.status_code == 401
        assert response.json()["detail"] == "Authentication required"
    finally:
        async def mock_firebase_user() -> dict[str, str]:
            return {"uid": "test-user", "email": "test@example.com"}

        app.dependency_overrides[require_firebase_user] = mock_firebase_user


def test_plan_requires_auth(client: TestClient, api_env: None) -> None:
    from auth import require_firebase_user
    from main import app

    app.dependency_overrides.pop(require_firebase_user, None)
    try:
        response = client.post(
            "/plan",
            json={
                "location": "Austin",
                "budget": 100,
                "diet": "vegetarian",
                "activities": "music",
            },
        )
        assert response.status_code == 401
        assert response.json()["detail"] == "Authentication required"
    finally:
        async def mock_firebase_user() -> dict[str, str]:
            return {"uid": "test-user", "email": "test@example.com"}

        app.dependency_overrides[require_firebase_user] = mock_firebase_user


@patch("auth.firebase_auth.verify_id_token", return_value={"uid": "via-header"})
def test_discover_accepts_x_firebase_authorization(
    mock_verify: object,
    client: TestClient,
) -> None:
    from auth import require_firebase_user
    from main import app

    app.dependency_overrides.pop(require_firebase_user, None)
    try:
        response = client.get(
            "/discover",
            params={"location": "Austin"},
            headers={"X-Firebase-Authorization": "Bearer firebase-token"},
        )
        assert response.status_code == 200
        mock_verify.assert_called_once_with("firebase-token")
    finally:
        async def mock_firebase_user() -> dict[str, str]:
            return {"uid": "test-user", "email": "test@example.com"}

        app.dependency_overrides[require_firebase_user] = mock_firebase_user


@patch("auth.firebase_auth.verify_id_token", side_effect=ValueError("bad token"))
def test_discover_rejects_invalid_token(
    _mock_verify: object,
    client: TestClient,
) -> None:
    from auth import require_firebase_user
    from main import app

    app.dependency_overrides.pop(require_firebase_user, None)
    try:
        response = client.get(
            "/discover",
            params={"location": "Austin"},
            headers={"Authorization": "Bearer invalid-token"},
        )
        assert response.status_code == 401
        assert response.json()["detail"] == "Invalid or expired token"
    finally:
        async def mock_firebase_user() -> dict[str, str]:
            return {"uid": "test-user", "email": "test@example.com"}

        app.dependency_overrides[require_firebase_user] = mock_firebase_user


def test_health_does_not_require_auth(client: TestClient) -> None:
    from auth import require_firebase_user
    from main import app

    app.dependency_overrides.pop(require_firebase_user, None)
    try:
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json() == {"ok": True}
    finally:
        async def mock_firebase_user() -> dict[str, str]:
            return {"uid": "test-user", "email": "test@example.com"}

        app.dependency_overrides[require_firebase_user] = mock_firebase_user
