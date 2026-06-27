"use client";

import { getFirebaseAuth, isFirebaseConfigured } from "./firebase";

export async function getAuthHeaders(
  forceRefresh = false,
): Promise<Record<string, string>> {
  if (!isFirebaseConfigured()) {
    return {};
  }

  const user = getFirebaseAuth().currentUser;
  if (!user) {
    return {};
  }

  const token = await user.getIdToken(forceRefresh);
  return { Authorization: `Bearer ${token}` };
}

/**
 * fetch wrapper that attaches a Firebase ID token and retries once on 401.
 */
export async function fetchWithAuth(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const buildHeaders = async (forceRefresh: boolean) => {
    const headers = new Headers(init?.headers);
    const authHeaders = await getAuthHeaders(forceRefresh);
    for (const [key, value] of Object.entries(authHeaders)) {
      headers.set(key, value);
    }
    return headers;
  };

  let response = await fetch(input, {
    ...init,
    headers: await buildHeaders(false),
  });

  if (response.status === 401 && isFirebaseConfigured()) {
    response = await fetch(input, {
      ...init,
      headers: await buildHeaders(true),
    });
  }

  return response;
}
