from __future__ import annotations

import pytest
from pydantic import ValidationError

from models import (
    CalendarSlot,
    CandidateItem,
    DiscoverEvent,
    DiscoverResponse,
    FilterStats,
    ItineraryItem,
    PlanRequest,
    UserConstraintContext,
)


class TestCalendarSlot:
    def test_valid_slot(self) -> None:
        slot = CalendarSlot(date="saturday", period="morning")
        assert slot.date == "saturday"
        assert slot.period == "morning"

    @pytest.mark.parametrize("period", ["morning", "afternoon", "evening"])
    def test_valid_periods(self, period: str) -> None:
        slot = CalendarSlot(date="2026-06-28", period=period)  # type: ignore[arg-type]
        assert slot.period == period

    def test_rejects_empty_date(self) -> None:
        with pytest.raises(ValidationError):
            CalendarSlot(date="", period="morning")

    def test_rejects_invalid_period(self) -> None:
        with pytest.raises(ValidationError):
            CalendarSlot(date="saturday", period="midnight")  # type: ignore[arg-type]


class TestUserConstraintContext:
    def test_valid_context(self, sample_calendar_slots: list[CalendarSlot]) -> None:
        ctx = UserConstraintContext(
            budget=50.0,
            diet="vegan",
            activities="art",
            home_location="Boston",
            calendar_slots=sample_calendar_slots,
        )
        assert ctx.budget == 50.0
        assert len(ctx.calendar_slots) == 2

    def test_rejects_non_positive_budget(self) -> None:
        with pytest.raises(ValidationError):
            UserConstraintContext(budget=0, home_location="Boston")

    def test_rejects_empty_home_location(self) -> None:
        with pytest.raises(ValidationError):
            UserConstraintContext(budget=10, home_location="")


class TestPlanRequest:
    def test_valid_request(self) -> None:
        req = PlanRequest(
            location="Austin",
            budget=75.0,
            diet="vegetarian",
            activities="music",
        )
        assert req.location == "Austin"
        assert req.calendar_slots == []

    def test_rejects_empty_location(self) -> None:
        with pytest.raises(ValidationError):
            PlanRequest(
                location="",
                budget=50,
                diet="vegan",
                activities="hiking",
            )

    def test_rejects_empty_diet(self) -> None:
        with pytest.raises(ValidationError):
            PlanRequest(
                location="Austin",
                budget=50,
                diet="",
                activities="music",
            )

    def test_rejects_empty_activities(self) -> None:
        with pytest.raises(ValidationError):
            PlanRequest(
                location="Austin",
                budget=50,
                diet="vegan",
                activities="",
            )


class TestCandidateItem:
    def test_valid_candidate(self) -> None:
        item = CandidateItem(
            id="evt_1",
            type="event",
            title="Concert",
            url="https://example.com",
            snippet="Live show",
            price_estimate=20.0,
            location="Austin",
            tags="music",
        )
        assert item.type == "event"
        assert item.date_hint == ""

    def test_rejects_invalid_type(self) -> None:
        with pytest.raises(ValidationError):
            CandidateItem(
                id="x",
                type="hotel",  # type: ignore[arg-type]
                title="T",
                url="u",
                snippet="s",
                price_estimate=1,
                location="l",
                tags="t",
            )


class TestItineraryItem:
    def test_valid_item(self) -> None:
        item = ItineraryItem(
            time="Saturday 10:00",
            activity="Brunch",
            venue="Cafe",
            cost="$20",
            diet_access="vegan",
            source_url="https://example.com",
            source_index=1,
        )
        assert item.source_index == 1

    def test_rejects_zero_source_index(self) -> None:
        with pytest.raises(ValidationError):
            ItineraryItem(
                time="Sat",
                activity="A",
                venue="V",
                cost="$1",
                diet_access="—",
                source_url="u",
                source_index=0,
            )


class TestFilterStats:
    def test_valid_stats(self) -> None:
        stats = FilterStats(candidates_in=10, candidates_out=4, filter_method="sdk")
        assert stats.concept_name == "weekend_planner_matches"


class TestDiscoverModels:
    def test_discover_event_defaults(self) -> None:
        event = DiscoverEvent(
            id="e1",
            title="Festival",
            description="Fun",
            category="Festival",
            image_url="https://img.example/1.jpg",
            location="Austin",
            lat=30.0,
            lng=-97.0,
            url="https://example.com",
        )
        assert event.prometheux_verified is False
        assert event.passed_rules == []

    def test_discover_response(self) -> None:
        resp = DiscoverResponse(location="Austin", events=[])
        assert resp.source == "tavily"
