import { afterEach, describe, expect, it, vi } from "vitest";

const getIdTokenMock = vi.fn();

vi.mock("../firebase", () => ({
  isFirebaseConfigured: vi.fn(() => true),
  getFirebaseAuth: vi.fn(() => ({
    currentUser: { getIdToken: getIdTokenMock },
  })),
}));

import { fetchWithAuth, getAuthHeaders } from "../api-auth";
import { isFirebaseConfigured } from "../firebase";

describe("getAuthHeaders", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns Authorization header when user is signed in", async () => {
    getIdTokenMock.mockResolvedValue("firebase-id-token");

    await expect(getAuthHeaders()).resolves.toEqual({
      Authorization: "Bearer firebase-id-token",
    });
    expect(getIdTokenMock).toHaveBeenCalledWith(false);
  });

  it("requests a refreshed token when forceRefresh is true", async () => {
    getIdTokenMock.mockResolvedValue("refreshed-token");

    await expect(getAuthHeaders(true)).resolves.toEqual({
      Authorization: "Bearer refreshed-token",
    });
    expect(getIdTokenMock).toHaveBeenCalledWith(true);
  });

  it("returns empty headers when Firebase is not configured", async () => {
    vi.mocked(isFirebaseConfigured).mockReturnValueOnce(false);

    await expect(getAuthHeaders()).resolves.toEqual({});
  });
});

describe("fetchWithAuth", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("retries once with a refreshed token on 401", async () => {
    getIdTokenMock
      .mockResolvedValueOnce("stale-token")
      .mockResolvedValueOnce("fresh-token");

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        status: 401,
        ok: false,
      })
      .mockResolvedValueOnce({
        status: 200,
        ok: true,
      });
    vi.stubGlobal("fetch", fetchMock);

    const response = await fetchWithAuth("/api/plan", { method: "POST" });

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0]?.[1]?.headers?.get("Authorization")).toBe(
      "Bearer stale-token",
    );
    expect(fetchMock.mock.calls[1]?.[1]?.headers?.get("Authorization")).toBe(
      "Bearer fresh-token",
    );
  });
});
