import {
  validateGraduateCredentials,
  createSessionToken,
  buildSessionCookieHeader,
} from "../../lib/session-token.js";

function isSecureRequest(request) {
  const proto = request.headers.get("x-forwarded-proto");
  if (proto) return proto === "https";
  return new URL(request.url).protocol === "https:";
}

export default async function handler(request) {
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  let body = {};
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const name = (body.name || body.user || "").trim();
  const birth = body.birth || body.password || body.pass || "";

  if (!validateGraduateCredentials(name, birth)) {
    return Response.json({ ok: false, error: "auth_failed" }, { status: 401 });
  }

  try {
    const token = await createSessionToken();
    const secure = isSecureRequest(request);
    return Response.json(
      { ok: true },
      {
        status: 200,
        headers: {
          "Set-Cookie": buildSessionCookieHeader(token, { secure }),
          "Cache-Control": "no-store",
        },
      }
    );
  } catch {
    return Response.json({ ok: false, error: "server_config" }, { status: 503 });
  }
}
