import { verifySessionToken, getCookieValue } from "../../lib/session-token.js";

export default async function handler(request) {
  if (request.method !== "GET") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const token = getCookieValue(request.headers.get("cookie") || "");
  const ok = await verifySessionToken(token);

  return Response.json(
    { ok },
    {
      headers: { "Cache-Control": "no-store" },
    }
  );
}
