from __future__ import annotations

import json
from unittest.mock import MagicMock, patch

import pytest

from agent import (
    _estimate_price,
    _extract_tags,
    _fallback_itinerary,
    _normalize_tavily_results,
    _parse_gemini_json,
    build_itinerary,
    run_weekend_planner,
    search_weekend_options,
)
from models import CandidateItem, PlanRequest
from prometheux_filter import FilterResult


def test_estimate_price_from_dollar_sign() -> None:
    assert _estimate_price("Tickets from $42.50") == 42.5


def test_estimate_price_free() -> None:
    assert _estimate_price("Free admission all day") == 0.0


def test_estimate_price_default() -> None:
    assert _estimate_price("no price here", default=30.0) == 30.0


def test_extract_tags_matches_request_tokens(sample_plan_request: PlanRequest) -> None:
    tags = _extract_tags("outdoor music festival vegan options", sample_plan_request, "event")
    assert "music" in tags or "outdoor" in tags


def test_normalize_tavily_results(sample_plan_request: PlanRequest) -> None:
    results = [
        {"title": "Jazz Night", "content": "Saturday jazz $20", "url": "https://example.com/j"},
    ]
    items = _normalize_tavily_results(results, "event", sample_plan_request, "evt")
    assert len(items) == 1
    assert items[0].id == "evt_1"
    assert items[0].type == "event"
    assert items[0].price_estimate == 20.0


def test_parse_gemini_json_list() -> None:
    payload = json.dumps([{"time": "Sat 10", "activity": "A", "venue": "V", "cost": "$1", "diet_access": "—", "source_url": "u", "source_index": 1}])
    items = _parse_gemini_json(payload)
    assert len(items) == 1


def test_parse_gemini_json_wrapped_object() -> None:
    payload = json.dumps({"itinerary": [{"time": "Sat", "activity": "A", "venue": "V", "cost": "$1", "diet_access": "—", "source_url": "u", "source_index": 1}]})
    items = _parse_gemini_json(payload)
    assert len(items) == 1


def test_parse_gemini_json_strips_code_fence() -> None:
    inner = json.dumps({"itinerary": []})
    items = _parse_gemini_json(f"```json\n{inner}\n```")
    assert items == []


def test_fallback_itinerary(sample_plan_request: PlanRequest) -> None:
    candidates = [
        CandidateItem(
            id="r1",
            type="restaurant",
            title="Cafe",
            url="u",
            snippet="s",
            price_estimate=15,
            location="Austin",
            tags="vegan",
        )
    ]
    items = _fallback_itinerary(candidates, sample_plan_request)
    assert len(items) == 1
    assert items[0].venue == "Cafe"
    assert items[0].activity == "Dining"


@patch("agent.TavilyClient")
def test_search_weekend_options(
    mock_tavily_cls: MagicMock,
    sample_plan_request: PlanRequest,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("TAVILY_API_KEY", "test-key")
    mock_client = MagicMock()
    mock_client.search.side_effect = [
        {"results": [{"title": "Event A", "content": "fun", "url": "https://e.com"}]},
        {"results": [{"title": "Rest B", "content": "food", "url": "https://r.com"}]},
    ]
    mock_tavily_cls.return_value = mock_client

    candidates = search_weekend_options(sample_plan_request)
    assert len(candidates) == 2
    assert {c.type for c in candidates} == {"event", "restaurant"}
    assert mock_client.search.call_count == 2


@patch("agent.genai.Client")
def test_build_itinerary_with_gemini_mock(
    mock_genai_cls: MagicMock,
    sample_plan_request: PlanRequest,
    sample_candidates,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("GEMINI_API_KEY", "test-key")
    itinerary_json = json.dumps(
        {
            "itinerary": [
                {
                    "time": "Saturday 10:00",
                    "activity": "Music",
                    "venue": sample_candidates[0].title,
                    "cost": "$25",
                    "diet_access": "—",
                    "source_url": sample_candidates[0].url,
                    "source_index": 1,
                }
            ]
        }
    )
    mock_client = MagicMock()
    mock_response = MagicMock()
    mock_response.text = itinerary_json
    mock_client.models.generate_content.return_value = mock_response
    mock_genai_cls.return_value = mock_client

    items = build_itinerary(sample_candidates[:1], sample_plan_request)
    assert len(items) == 1
    assert items[0].venue == sample_candidates[0].title


@patch("agent.genai.Client")
def test_build_itinerary_falls_back_on_bad_json(
    mock_genai_cls: MagicMock,
    sample_plan_request: PlanRequest,
    sample_candidates,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("GEMINI_API_KEY", "test-key")
    mock_client = MagicMock()
    mock_response = MagicMock()
    mock_response.text = "not json"
    mock_client.models.generate_content.return_value = mock_response
    mock_genai_cls.return_value = mock_client

    items = build_itinerary(sample_candidates[:1], sample_plan_request)
    assert len(items) == 1
    assert items[0].venue == sample_candidates[0].title


@patch("agent.write_cited_md")
@patch("agent.build_itinerary")
@patch("agent.filter_with_prometheux")
@patch("agent.search_weekend_options")
def test_run_weekend_planner_orchestration(
    mock_search: MagicMock,
    mock_filter: MagicMock,
    mock_build: MagicMock,
    mock_write_md: MagicMock,
    sample_plan_request: PlanRequest,
    sample_candidates,
    sample_itinerary,
) -> None:
    mock_search.return_value = sample_candidates
    mock_filter.return_value = FilterResult(
        candidates=sample_candidates[:2],
        candidates_in=3,
        candidates_out=2,
        filter_method="sdk",
    )
    mock_build.return_value = sample_itinerary
    mock_write_md.return_value = "/tmp/cited.md"

    result = run_weekend_planner(sample_plan_request)

    mock_search.assert_called_once_with(sample_plan_request)
    mock_filter.assert_called_once()
    mock_build.assert_called_once()
    mock_write_md.assert_called_once()

    assert len(result.itinerary) == 2
    assert result.cited_path == "/tmp/cited.md"
    assert result.filter_stats.candidates_in == 3
    assert result.filter_stats.candidates_out == 2
