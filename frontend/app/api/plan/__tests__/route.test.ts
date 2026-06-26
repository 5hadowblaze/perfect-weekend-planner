import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const chargeMock = vi.fn();

vi.mock("@/lib/mppx", () => ({
  mppx: {
    get charge() {
      return chargeMock;
    },
  },
}));

import { POST } from "../route";

function makePlanRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost:3000/api/plan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/plan", () => {
  beforeEach(() => {
    vi.stubEnv("BACKEND_URL", "http://backend.test");
    vi.stubEnv("SKIP_MPP", "true");
    chargeMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("proxies directly to backend when SKIP_MPP is not false", async () => {
    const backendPayload = {
      itinerary: [],
      cited_path: "/plans/demo",
      filter_stats: {
        candidates_in: 1,
        candidates_out: 1,
        filter_method: "sdk",
        concept_name: "weekend_plan",
      },
    };

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => backendPayload,
      }),
    );

    const response = await POST(
      makePlanRequest({
        location: "Austin, TX",
        budget: 150,
        diet: "vegan",
        activities: "music",
      }),
    );

    expect(chargeMock).not.toHaveBeenCalled();
    expect(fetch).toHaveBeenCalledWith("http://backend.test/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: "Austin, TX",
        budget: 150,
        diet: "vegan",
        activities: "music",
      }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(backendPayload);
  });

  it("uses mppx.charge wrapper when SKIP_MPP is false", async () => {
    vi.stubEnv("SKIP_MPP", "false");

    const backendPayload = {
      itinerary: [],
      cited_path: "/paid",
      filter_stats: {
        candidates_in: 1,
        candidates_out: 1,
        filter_method: "sdk",
        concept_name: "weekend_plan",
      },
    };

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => backendPayload,
      }),
    );

    chargeMock.mockImplementation(() => (handler: (req: Request) => Response | Promise<Response>) =>
      handler,
    );

    const request = makePlanRequest({ location: "Denver, CO" });
    const response = await POST(request);

    expect(chargeMock).toHaveBeenCalledWith({ amount: "0.01" });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(backendPayload);
  });

  it("returns 502 when backend is unreachable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("ECONNREFUSED")),
    );

    const response = await POST(makePlanRequest({ location: "Austin, TX" }));
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body.detail).toContain("Backend error");
    expect(body.detail).toContain("ECONNREFUSED");
  });

  it("forwards backend error status and payload", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 422,
        json: async () => ({ detail: "Invalid plan request" }),
      }),
    );

    const response = await POST(makePlanRequest({ location: "Austin, TX" }));

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({
      detail: "Invalid plan request",
    });
  });
});
