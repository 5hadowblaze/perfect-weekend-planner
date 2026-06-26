from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from agent import run_weekend_planner
from models import PlanRequest, PlanResult
from prometheux_filter import PrometheuxConfigError, PrometheuxSDKError

ROOT_DIR = Path(__file__).resolve().parent.parent
load_dotenv(ROOT_DIR / ".env.local")
load_dotenv(ROOT_DIR / ".env")
load_dotenv(Path(__file__).resolve().parent / ".env")

app = FastAPI(title="Perfect Weekend Planner", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, bool]:
    return {"ok": True}


@app.post("/plan", response_model=PlanResult)
def plan(request: PlanRequest) -> PlanResult:
    missing = [
        key
        for key in ("GEMINI_API_KEY", "TAVILY_API_KEY", "PMTX_TOKEN")
        if not os.environ.get(key)
    ]
    if missing:
        raise HTTPException(
            status_code=503,
            detail=f"Missing required environment variables: {', '.join(missing)}",
        )

    try:
        return run_weekend_planner(request)
    except PrometheuxConfigError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except PrometheuxSDKError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    except KeyError as exc:
        raise HTTPException(status_code=503, detail=f"Missing configuration: {exc}") from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
