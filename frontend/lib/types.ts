export type CalendarPeriod = "morning" | "afternoon" | "evening";

export interface CalendarSlot {
  date: string;
  period: CalendarPeriod;
}

export interface PlanRequest {
  location: string;
  budget: number;
  diet: string;
  activities: string;
  accessibility?: string;
  calendar_slots?: CalendarSlot[];
}

export interface ItineraryItem {
  time: string;
  activity: string;
  venue: string;
  cost: string;
  diet_access: string;
  source_url: string;
  source_index: number;
}

export interface FilterStats {
  candidates_in: number;
  candidates_out: number;
  filter_method: "sdk";
  concept_name: string;
}

export interface PlanResult {
  itinerary: ItineraryItem[];
  cited_path: string;
  trace_id?: string | null;
  filter_stats: FilterStats;
}

export type PlannerStatus = "idle" | "planning" | "done" | "error";

export interface DiscoverEvent {
  id: string;
  title: string;
  description: string;
  category: string;
  image_url: string;
  price_estimate: number | null;
  price_label: string;
  location: string;
  lat: number;
  lng: number;
  url: string;
  date_hint?: string | null;
  passed_rules?: string[];
  prometheux_verified?: boolean;
  filter_method?: "sdk" | null;
  match_score?: number | null;
}

export interface DiscoverResponse {
  location: string;
  events: DiscoverEvent[];
  source: "tavily" | "mock";
  center_lat?: number | null;
  center_lng?: number | null;
  filter_stats?: FilterStats | null;
}

export interface UserProfile {
  homeCity: string;
  budget: number;
  diet: string;
  activities: string;
  accessibility?: string;
  onboardingComplete: boolean;
  updatedAt: string;
}

export interface AuthUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

export interface DiscoverParams {
  location: string;
  profile?: UserProfile | null;
  calendarSlots?: CalendarSlot[];
}
