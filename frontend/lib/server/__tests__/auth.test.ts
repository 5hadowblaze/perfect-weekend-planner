import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const verifyIdTokenMock = vi.fn();

vi.mock("firebase-admin/app", () => ({
  applicationDefault: vi.fn(() => ({})),
  getApps: vi.fn(() => []),
  initializeApp: vi.fn(() => ({ name: "test-app" })),
}));

vi.mock("firebase-admin/auth", () => ({
  getAuth: vi.fn(() => ({
    verifyIdToken: verifyIdTokenMock,
  })),
}));

import { verifyRequestAuth } from "../auth";

function makeRequest(authHeader?: string): NextRequest {
  return new NextRequest("http://localhost:3000/api/discover?location=Austin", {
    headers: authHeader ? { Authorization: authHeader } : undefined,
  });
}

describe("verifyRequestAuth", () => {
  beforeEach(() => {
    verifyIdTokenMock.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when Authorization header is missing", async () => {
    const result = await verifyRequestAuth(makeRequest());

    expect(result).toBeInstanceOf(Response);
    await expect((result as Response).json()).resolves.toEqual({
      detail: "Authentication required",
    });
    expect((result as Response).status).toBe(401);
  });

  it("returns verified user for a valid Bearer token", async () => {
    verifyIdTokenMock.mockResolvedValue({
      uid: "abc123",
      email: "user@example.com",
    });

    const result = await verifyRequestAuth(makeRequest("Bearer valid-token"));

    expect(result).toEqual({
      uid: "abc123",
      email: "user@example.com",
    });
    expect(verifyIdTokenMock).toHaveBeenCalledWith("valid-token");
  });

  it("returns 401 when token verification fails", async () => {
    verifyIdTokenMock.mockRejectedValue(new Error("expired"));

    const result = await verifyRequestAuth(makeRequest("Bearer bad-token"));

    expect(result).toBeInstanceOf(Response);
    expect((result as Response).status).toBe(401);
    await expect((result as Response).json()).resolves.toEqual({
      detail: "Invalid or expired token",
    });
  });
});
