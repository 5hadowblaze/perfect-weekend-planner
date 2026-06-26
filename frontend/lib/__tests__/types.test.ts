import { describe, expect, it } from "vitest";

import type {
  AuthUser,
  CalendarPeriod,
  CalendarSlot,
  DiscoverEvent,
  DiscoverParams,
  DiscoverResponse,
  FilterStats,
  ItineraryItem,
  PlanRequest,
  PlanResult,
  PlannerStatus,
  UserProfile,
} from "../types";

describe("lib/types exports", () => {
  it("CalendarPeriod accepts expected literals", () => {
    const periods: CalendarPeriod[] = ["morning", "afternoon", "evening"];
    expect(periods).toHaveLength(3);
  });

  it("CalendarSlot shape", () => {
    const slot: CalendarSlot = { date: "2026-06-28", period: "morning" };
    expect(slot.date).toBeTruthy();
    expect(slot.period).toBe("morning");
  });

  it("PlanRequest and PlanResult shapes", () => {
    const request: PlanRequest = {
      location: "Austin, TX",
      budget: 150,
      diet: "vegan",
      activities: "music",
    };

    const item: ItineraryItem = {
      time: "10:00",
      activity: "Brunch",
      venue: "Cafe",
      cost: "$20",
      diet_access: "vegan",
      source_url: "https://example.com",
      source_index: 0,
    };

    const filterStats: FilterStats = {
      candidates_in: 10,
      candidates_out: 3,
      filter_method: "sdk",
      concept_name: "weekend_plan",
    };

    const result: PlanResult = {
      itinerary: [item],
      cited_path: "/path",
      filter_stats: filterStats,
    };

    expect(request.location).toBe("Austin, TX");
    expect(result.itinerary[0].activity).toBe("Brunch");
    expect(result.filter_stats.filter_method).toBe("sdk");
  });

  it("PlannerStatus union", () => {
    const statuses: PlannerStatus[] = ["idle", "planning", "done", "error"];
    expect(statuses).toContain("planning");
  });

  it("DiscoverEvent and DiscoverResponse shapes", () => {
    const event: DiscoverEvent = {
      id: "evt-1",
      title: "Jazz Night",
      description: "Live jazz downtown",
      category: "Music",
      image_url: "https://example.com/img.jpg",
      price_estimate: 25,
      price_label: "$25",
      location: "Austin, TX",
      lat: 30.27,
      lng: -97.74,
      url: "https://example.com/event",
      passed_rules: ["budget_ok", "diet_match"],
      prometheux_verified: true,
    };

    const response: DiscoverResponse = {
      location: "Austin, TX",
      events: [event],
      source: "mock",
    };

    expect(response.events[0].prometheux_verified).toBe(true);
    expect(response.source).toBe("mock");
  });

  it("UserProfile and AuthUser shapes", () => {
    const profile: UserProfile = {
      homeCity: "Austin, TX",
      budget: 150,
      diet: "vegan",
      activities: "music",
      onboardingComplete: true,
      updatedAt: new Date().toISOString(),
    };

    const user: AuthUser = {
      uid: "user-123",
      displayName: "Alex",
      email: "alex@example.com",
      photoURL: null,
    };

    const params: DiscoverParams = {
      location: profile.homeCity,
      profile,
    };

    expect(params.profile?.homeCity).toBe("Austin, TX");
    expect(user.uid).toBe("user-123");
  });
});
