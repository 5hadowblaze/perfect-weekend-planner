export interface PlanRequest {
  location: string;
  budget: number;
  diet: string;
  activities: string;
  accessibility?: string;
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
