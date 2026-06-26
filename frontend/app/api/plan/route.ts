import { NextRequest } from "next/server";

import { mppx } from "@/lib/mppx";

/** MPP is scaffolded only — skipped by default for hackathon demos. Set SKIP_MPP=false to enable. */
function isMppEnabled(): boolean {
  return process.env.SKIP_MPP === "false";
}

async function proxyToBackend(request: NextRequest): Promise<Response> {
  const backendUrl = process.env.BACKEND_URL ?? "http://localhost:8000";
  const body = await request.text();

  let backendResponse: Response;
  try {
    backendResponse = await fetch(`${backendUrl}/plan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Backend unreachable";
    return Response.json(
      { detail: `Backend error: ${message}` },
      { status: 502 },
    );
  }

  const data = await backendResponse.json().catch(() => ({
    detail: "Invalid JSON from backend",
  }));

  if (!backendResponse.ok) {
    return Response.json(data, { status: backendResponse.status });
  }

  return Response.json(data);
}

export async function POST(request: NextRequest) {
  if (!isMppEnabled()) {
    return proxyToBackend(request);
  }

  const paidPost = mppx.charge({ amount: "0.01" })((req: Request) =>
    proxyToBackend(req as NextRequest),
  );

  return paidPost(request);
}
