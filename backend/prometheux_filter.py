from __future__ import annotations

import logging
import os
import re
from dataclasses import dataclass
from typing import Any, Literal

from models import CandidateItem, PlanRequest

logger = logging.getLogger(__name__)

FilterMethod = Literal["sdk"]
CONCEPT_NAME = "weekend_planner_matches"
OUTPUT_PREDICATE = "matches"

# Vadalog ontology: Tavily facts + constraint facts → deterministic `matches` rows.
# Gemini NEVER sees candidates that fail these rules (see agent.build_itinerary).
VADALOG_TEMPLATE = """
{facts}

max_budget({budget}).
target_location("{location}").
{constraint_flags}
{diet_facts}
{activity_facts}
{accessibility_facts}

% --- Budget ceiling ---
budget_ok(Price) :- max_budget(B), Price =< B.

% --- Location: city/area token in location field OR title ---
loc_ok(Loc, Title) :- target_location(L), string_contains(Loc, L).
loc_ok(Loc, Title) :- target_location(L), string_contains(Title, L).

% --- Diet keywords (restaurants/events): at least one token when constraints exist ---
diet_match(Tags, Title, Snippet) :- required_diet_token(D), string_contains(Tags, D).
diet_match(Tags, Title, Snippet) :- required_diet_token(D), string_contains(Title, D).
diet_match(Tags, Title, Snippet) :- required_diet_token(D), string_contains(Snippet, D).
diet_ok(Tags, Title, Snippet) :- not has_diet_constraints.
diet_ok(Tags, Title, Snippet) :- has_diet_constraints, diet_match(Tags, Title, Snippet).

% --- Activity tags: at least one token when constraints exist ---
activity_match(Tags, Title, Snippet) :- required_activity_token(A), string_contains(Tags, A).
activity_match(Tags, Title, Snippet) :- required_activity_token(A), string_contains(Title, A).
activity_match(Tags, Title, Snippet) :- required_activity_token(A), string_contains(Snippet, A).
activity_ok(Tags, Title, Snippet) :- not has_activity_constraints.
activity_ok(Tags, Title, Snippet) :- has_activity_constraints, activity_match(Tags, Title, Snippet).

% --- Accessibility keywords: at least one token when constraints exist ---
access_match(Tags, Title, Snippet) :- required_access_token(A), string_contains(Tags, A).
access_match(Tags, Title, Snippet) :- required_access_token(A), string_contains(Title, A).
access_match(Tags, Title, Snippet) :- required_access_token(A), string_contains(Snippet, A).
access_ok(Tags, Title, Snippet) :- not has_access_constraints.
access_ok(Tags, Title, Snippet) :- has_access_constraints, access_match(Tags, Title, Snippet).

% --- Final gate: all constraint dimensions must pass ---
matches(Id, Type, Title, Url, Price, Loc, Tags) :-
  candidate(Id, Type, Title, Url, Price, Loc, Tags, Snippet),
  budget_ok(Price),
  loc_ok(Loc, Title),
  diet_ok(Tags, Title, Snippet),
  activity_ok(Tags, Title, Snippet),
  access_ok(Tags, Title, Snippet).

@output("matches").
"""


class PrometheuxConfigError(Exception):
    """Raised when Prometheux environment variables are missing or invalid."""


class PrometheuxSDKError(Exception):
    """Raised when the prometheux_chain SDK call fails."""


@dataclass(frozen=True)
class FilterResult:
    candidates: list[CandidateItem]
    candidates_in: int
    candidates_out: int
    filter_method: FilterMethod
    concept_name: str = CONCEPT_NAME


def _escape_vadalog(value: str) -> str:
    return value.replace("\\", "\\\\").replace('"', '\\"')


def _tokenize_constraints(value: str) -> list[str]:
    return [part.strip().lower() for part in re.split(r"[,;/|]+", value) if part.strip()]


def _location_token(location: str) -> str:
    """Use the primary city token for substring matching."""
    primary = location.split(",")[0].strip().lower()
    return primary or location.strip().lower()


def _build_candidate_facts(candidates: list[CandidateItem]) -> str:
    lines: list[str] = []
    for item in candidates:
        lines.append(
            f'candidate("{_escape_vadalog(item.id)}", "{item.type}", '
            f'"{_escape_vadalog(item.title)}", "{_escape_vadalog(item.url)}", '
            f"{item.price_estimate}, "
            f'"{_escape_vadalog(item.location)}", "{_escape_vadalog(item.tags)}", '
            f'"{_escape_vadalog(item.snippet)}").'
        )
    return "\n".join(lines)


def _build_token_facts(predicate: str, tokens: list[str]) -> str:
    return "\n".join(f'{predicate}("{_escape_vadalog(token)}").' for token in tokens)


def build_vadalog_program(candidates: list[CandidateItem], request: PlanRequest) -> str:
    diet_tokens = _tokenize_constraints(request.diet)
    activity_tokens = _tokenize_constraints(request.activities)
    accessibility_tokens = (
        _tokenize_constraints(request.accessibility) if request.accessibility else []
    )

    constraint_flags: list[str] = []
    if diet_tokens:
        constraint_flags.append("has_diet_constraints.")
    if activity_tokens:
        constraint_flags.append("has_activity_constraints.")
    if accessibility_tokens:
        constraint_flags.append("has_access_constraints.")

    return VADALOG_TEMPLATE.format(
        facts=_build_candidate_facts(candidates),
        budget=int(request.budget),
        location=_escape_vadalog(_location_token(request.location)),
        constraint_flags="\n".join(constraint_flags),
        diet_facts=_build_token_facts("required_diet_token", diet_tokens),
        activity_facts=_build_token_facts("required_activity_token", activity_tokens),
        accessibility_facts=_build_token_facts(
            "required_access_token", accessibility_tokens
        ),
    )


def _parse_matches_rows(payload: Any) -> list[dict[str, Any]]:
    if payload is None:
        return []

    if isinstance(payload, list):
        rows = payload
    elif isinstance(payload, dict):
        for key in ("matches", "results", "data", "output"):
            if key in payload and isinstance(payload[key], list):
                rows = payload[key]
                break
        else:
            rows = [payload]
    else:
        return []

    parsed: list[dict[str, Any]] = []
    for row in rows:
        if isinstance(row, dict):
            parsed.append(row)
        elif isinstance(row, (list, tuple)) and len(row) >= 7:
            parsed.append(
                {
                    "id": row[0],
                    "type": row[1],
                    "title": row[2],
                    "url": row[3],
                    "price_estimate": row[4],
                    "location": row[5],
                    "tags": row[6],
                }
            )
    return parsed


def _row_to_candidate(row: dict[str, Any]) -> CandidateItem | None:
    mapping = {
        "id": row.get("Id") or row.get("id"),
        "type": row.get("Type") or row.get("type"),
        "title": row.get("Title") or row.get("title"),
        "url": row.get("Url") or row.get("url"),
        "price_estimate": row.get("Price") or row.get("price_estimate") or row.get("price"),
        "location": row.get("Loc") or row.get("location"),
        "tags": row.get("Tags") or row.get("tags"),
    }
    if not mapping["id"] or not mapping["title"]:
        return None
    try:
        return CandidateItem(
            id=str(mapping["id"]),
            type=str(mapping["type"] or "event"),  # type: ignore[arg-type]
            title=str(mapping["title"]),
            url=str(mapping["url"] or ""),
            snippet="",
            price_estimate=float(mapping["price_estimate"] or 0),
            location=str(mapping["location"] or ""),
            tags=str(mapping["tags"] or ""),
        )
    except (TypeError, ValueError):
        return None


def _load_prometheux_sdk() -> Any:
    try:
        import prometheux_chain as px
    except ImportError as exc:
        raise PrometheuxSDKError(
            "prometheux_chain SDK is not installed. "
            "Run: pip install prometheux-chain"
        ) from exc

    token = os.environ.get("PMTX_TOKEN", "").strip()
    if not token:
        raise PrometheuxConfigError(
            "PMTX_TOKEN is not set. Sign up at https://platform.prometheux.ai, "
            "copy your API token, and add PMTX_TOKEN=... to .env.local"
        )

    px.config.set("PMTX_TOKEN", token)
    jarvis_url = os.environ.get("JARVISPY_URL", "").strip()
    if jarvis_url:
        px.config.set("JARVISPY_URL", jarvis_url)

    return px


def _filter_with_sdk(program: str) -> list[CandidateItem]:
    px = _load_prometheux_sdk()
    project_id = os.environ.get("PMTX_PROJECT_ID", "weekend-planner").strip() or "weekend-planner"

    logger.info(
        "Prometheux SDK: save_concept + run_concept concept=%s project=%s",
        CONCEPT_NAME,
        project_id,
    )

    try:
        px.save_concept(project_id=project_id, code=program)
        result = px.run_concept(project_id=project_id, concept_name=OUTPUT_PREDICATE)
    except Exception as exc:
        raise PrometheuxSDKError(
            "Prometheux SDK failed. Verify PMTX_TOKEN at https://platform.prometheux.ai, "
            "set JARVISPY_URL=https://platform.prometheux.ai/jarvispy/{org}/{username} "
            "if required by the SDK, and keep PMTX_PROJECT_ID=weekend-planner (default). "
            f"Error: {exc}"
        ) from exc

    rows = _parse_matches_rows(result)
    logger.info("Prometheux SDK returned %d matching rows (deterministic Vadalog)", len(rows))
    return [item for row in rows if (item := _row_to_candidate(row)) is not None]


def filter_candidates(
    candidates: list[CandidateItem], request: PlanRequest
) -> FilterResult:
    candidates_in = len(candidates)
    if not candidates:
        return FilterResult(
            candidates=[],
            candidates_in=0,
            candidates_out=0,
            filter_method="sdk",
        )

    program = build_vadalog_program(candidates, request)
    logger.debug("Vadalog program:\n%s", program)

    filtered = _filter_with_sdk(program)

    return FilterResult(
        candidates=filtered,
        candidates_in=candidates_in,
        candidates_out=len(filtered),
        filter_method="sdk",
    )
