import { applicationDefault, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import type { NextRequest } from "next/server";

export type VerifiedUser = {
  uid: string;
  email?: string;
};

function getAdminApp(): App {
  if (getApps().length > 0) {
    return getApps()[0]!;
  }

  const projectId =
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ??
    process.env.GCLOUD_PROJECT ??
    process.env.GOOGLE_CLOUD_PROJECT;

  return initializeApp({
    ...(projectId ? { projectId } : {}),
    credential: applicationDefault(),
  });
}

/**
 * Verifies the Firebase ID token on an incoming API request.
 * Returns the verified user, or a 401 Response when auth fails.
 */
export async function verifyRequestAuth(
  request: NextRequest,
): Promise<VerifiedUser | Response> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return Response.json({ detail: "Authentication required" }, { status: 401 });
  }

  const token = authHeader.slice("Bearer ".length).trim();
  if (!token) {
    return Response.json({ detail: "Authentication required" }, { status: 401 });
  }

  try {
    const decoded = await getAuth(getAdminApp()).verifyIdToken(token);
    return {
      uid: decoded.uid,
      email: decoded.email,
    };
  } catch {
    return Response.json(
      { detail: "Invalid or expired token" },
      { status: 401 },
    );
  }
}
