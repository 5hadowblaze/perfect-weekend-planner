from __future__ import annotations

import logging
import os
from typing import Annotated, Any

import firebase_admin
from firebase_admin import auth as firebase_auth
from fastapi import Depends, Header, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

logger = logging.getLogger(__name__)

_bearer = HTTPBearer(auto_error=False)


def _init_firebase_admin() -> None:
    if firebase_admin._apps:
        return

    project_id = (
        os.environ.get("FIREBASE_PROJECT_ID")
        or os.environ.get("GCLOUD_PROJECT")
        or os.environ.get("GOOGLE_CLOUD_PROJECT")
    )
    options = {"projectId": project_id} if project_id else None
    firebase_admin.initialize_app(options=options)


def _extract_bearer_token(value: str | None) -> str | None:
    if not value:
        return None
    prefix = "Bearer "
    if value.startswith(prefix):
        token = value[len(prefix) :].strip()
        return token or None
    return None


async def require_firebase_user(
    credentials: Annotated[
        HTTPAuthorizationCredentials | None,
        Depends(_bearer),
    ],
    x_firebase_authorization: Annotated[str | None, Header()] = None,
) -> dict[str, Any]:
    _init_firebase_admin()

    token = _extract_bearer_token(x_firebase_authorization)
    if token is None and credentials is not None:
        token = credentials.credentials

    if token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
        )

    try:
        return firebase_auth.verify_id_token(token)
    except Exception as exc:
        logger.warning("Firebase token verification failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        ) from exc
