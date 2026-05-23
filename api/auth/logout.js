import { buildClearCookieHeader } from "../../lib/session-token.js";

function isSecureRequest(request) {
  const proto = request.headers.get("x-forwarded-proto");
  if (proto) return proto === "https";
  return new URL(request.url).protocol === "https:";
}

export default async function handler(request) {
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const secure = isSecureRequest(request);
  return Response.json(
    { ok: true },
    {
      headers: {
        "Set-Cookie": buildClearCookieHeader({ secure }),
        "Cache-Control": "no-store",
      },
    }
  );
}
