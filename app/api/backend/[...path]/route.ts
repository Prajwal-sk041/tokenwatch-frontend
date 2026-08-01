import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const REQUEST_HEADERS = [
  "accept",
  "authorization",
  "content-type",
  "cookie",
  "idempotency-key",
  "origin",
  "user-agent",
  "x-tokenwatch-key",
] as const;

const RESPONSE_HEADERS = [
  "content-disposition",
  "content-type",
  "retry-after",
  "x-request-id",
] as const;

function backendBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (!configured) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is required");
  }
  const url = new URL(configured);
  if (
    url.protocol !== "https:" &&
    url.hostname !== "localhost" &&
    url.hostname !== "127.0.0.1"
  ) {
    throw new Error("Backend API URL must use HTTPS outside local development");
  }
  return url.toString().replace(/\/$/, "");
}

async function forward(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
): Promise<Response> {
  try {
    const { path } = await context.params;
    const target = new URL(
      `${backendBaseUrl()}/${path.map(encodeURIComponent).join("/")}`,
    );
    target.search = request.nextUrl.search;

    const headers = new Headers();
    for (const name of REQUEST_HEADERS) {
      const value = request.headers.get(name);
      if (value) headers.set(name, value);
    }
    headers.set("x-forwarded-host", request.nextUrl.host);
    headers.set("x-forwarded-proto", request.nextUrl.protocol.replace(":", ""));

    const upstream = await fetch(target, {
      method: request.method,
      headers,
      body: request.method === "GET" || request.method === "HEAD"
        ? undefined
        : await request.arrayBuffer(),
      cache: "no-store",
      redirect: "manual",
    });

    const responseHeaders = new Headers({ "cache-control": "no-store" });
    for (const name of RESPONSE_HEADERS) {
      const value = upstream.headers.get(name);
      if (value) responseHeaders.set(name, value);
    }

    const setCookies = (
      upstream.headers as Headers & { getSetCookie?: () => string[] }
    ).getSetCookie?.() ?? [];
    if (setCookies.length) {
      for (const cookie of setCookies) responseHeaders.append("set-cookie", cookie);
    } else {
      const cookie = upstream.headers.get("set-cookie");
      if (cookie) responseHeaders.append("set-cookie", cookie);
    }

    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders,
    });
  } catch {
    return Response.json(
      { detail: "TokenWatch API is temporarily unavailable" },
      { status: 502, headers: { "cache-control": "no-store" } },
    );
  }
}

export const GET = forward;
export const HEAD = forward;
export const POST = forward;
export const PUT = forward;
export const PATCH = forward;
export const DELETE = forward;
