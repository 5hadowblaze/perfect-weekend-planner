import type { CalendarSlot, DiscoverParams, DiscoverResponse, UserProfile } from "./types";

export function discoverQueryFromProfile(
  profile: UserProfile,
  calendarSlots: CalendarSlot[] = [],
): DiscoverParams {
  return {
    location: profile.homeCity,
    profile,
    calendarSlots,
  };
}

export async function fetchDiscoverEvents(
  params: DiscoverParams,
): Promise<DiscoverResponse> {
  const searchParams = new URLSearchParams({
    location: params.location,
  });

  if (params.profile) {
    searchParams.set("budget", String(params.profile.budget));
    searchParams.set("diet", params.profile.diet);
    searchParams.set("activities", params.profile.activities);
    if (params.profile.accessibility?.trim()) {
      searchParams.set("accessibility", params.profile.accessibility.trim());
    }
  }

  if (params.calendarSlots?.length) {
    searchParams.set("calendar_slots", JSON.stringify(params.calendarSlots));
  }

  const response = await fetch(`/api/discover?${searchParams.toString()}`);

  const payload = (await response.json().catch(() => ({}))) as
    | DiscoverResponse
    | { detail?: string; message?: string };

  if (!response.ok) {
    const message =
      (payload as { detail?: string }).detail ??
      (payload as { message?: string }).message ??
      `Discover failed (${response.status})`;
    throw new Error(message);
  }

  return payload as DiscoverResponse;
}
