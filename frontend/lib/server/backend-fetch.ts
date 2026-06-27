import { GoogleAuth } from "google-auth-library";

type BackendFetchInit = RequestInit & {
  firebaseAuthHeader?: string | null;
};

function isCloudRunBackend(backendUrl: string): boolean {
  try {
    return new URL(backendUrl).hostname.endsWith(".run.app");
  } catch {
    return false;
  }
}

/**
 * Server-side fetch to the FastAPI backend.
 * For Cloud Run (`*.run.app`), attaches a Google OIDC token for IAM and forwards
 * the user's Firebase token via `X-Firebase-Authorization`.
 */
export async function fetchBackend(
  path: string,
  init: BackendFetchInit = {},
): Promise<Response> {
  const backendUrl = process.env.BACKEND_URL ?? "http://localhost:8000";
  const url = `${backendUrl.replace(/\/$/, "")}${path}`;
  const headers = new Headers(init.headers);

  if (init.firebaseAuthHeader) {
    if (isCloudRunBackend(backendUrl)) {
      headers.set("X-Firebase-Authorization", init.firebaseAuthHeader);
    } else {
      headers.set("Authorization", init.firebaseAuthHeader);
    }
  }

  if (isCloudRunBackend(backendUrl)) {
    const auth = new GoogleAuth();
    const client = await auth.getIdTokenClient(backendUrl);
    const authedHeaders = await client.getRequestHeaders(url);
    for (const [key, value] of Object.entries(authedHeaders)) {
      if (value) {
        headers.set(key, value);
      }
    }
  }

  const { firebaseAuthHeader: _firebaseAuthHeader, ...fetchInit } = init;
  return fetch(url, { ...fetchInit, headers });
}
