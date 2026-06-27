import { Mppx, tempo } from "mppx/client";
import { privateKeyToAccount } from "viem/accounts";

import { fetchWithAuth } from "./api-auth";
import type { PlanRequest, PlanResult } from "./types";

/** MPP is scaffolded only — skipped by default. Set SKIP_MPP=false + wallet keys to enable. */
function isMppEnabled(): boolean {
  return process.env.NEXT_PUBLIC_SKIP_MPP === "false";
}

let paidFetch: typeof fetch | null = null;

function getPaidFetch(): typeof fetch {
  if (paidFetch) {
    return paidFetch;
  }

  const privateKey = process.env.NEXT_PUBLIC_MPP_CLIENT_KEY as
    | `0x${string}`
    | undefined;

  if (!privateKey) {
    return fetch;
  }

  const account = privateKeyToAccount(privateKey);
  const client = Mppx.create({
    methods: [tempo.charge({ account })],
    polyfill: false,
  });

  paidFetch = client.fetch.bind(client);
  return paidFetch;
}

export async function planWeekend(
  request: PlanRequest,
  onStatus?: (status: "planning") => void,
): Promise<PlanResult> {
  onStatus?.("planning");

  const fetchFn = isMppEnabled() ? getPaidFetch() : fetchWithAuth;
  const response = await fetchFn("/api/plan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  const payload = (await response.json().catch(() => ({}))) as
    | PlanResult
    | { detail?: string; message?: string; error?: string };

  if (!response.ok) {
    const message =
      (payload as { detail?: string }).detail ??
      (payload as { message?: string }).message ??
      (payload as { error?: string }).error ??
      `Request failed (${response.status})`;
    throw new Error(message);
  }

  return payload as PlanResult;
}
