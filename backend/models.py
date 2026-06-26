from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, Field


class PlanRequest(BaseModel):
    location: str = Field(..., min_length=1)
    budget: float = Field(..., gt=0)
    diet: str = Field(..., min_length=1)
    activities: str = Field(..., min_length=1)
    accessibility: Optional[str] = None


class CandidateItem(BaseModel):
    id: str
    type: Literal["event", "restaurant"]
    title: str
    url: str
    snippet: str
    price_estimate: float
    location: str
    tags: str


class ItineraryItem(BaseModel):
    time: str
    activity: str
    venue: str
    cost: str
    diet_access: str
    source_url: str
    source_index: int = Field(..., ge=1)


class FilterStats(BaseModel):
    candidates_in: int
    candidates_out: int
    filter_method: Literal["sdk"]
    concept_name: str = "weekend_planner_matches"


class PlanResult(BaseModel):
    itinerary: list[ItineraryItem]
    cited_path: str
    trace_id: Optional[str] = None
    filter_stats: FilterStats
