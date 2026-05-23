import {
  isProtectedAssetPath,
  verifySessionToken,
  getCookieValue,
} from "./lib/session-token.js";

export default async function middleware(request) {
  const { pathname } = new URL(request.url);
  if (!isProtectedAssetPath(pathname)) {
    return;
  }

  const token = getCookieValue(request.headers.get("cookie") || "");
  if (await verifySessionToken(token)) {
    return;
  }

  const accept = request.headers.get("accept") || "";
  const isHtml = accept.includes("text/html");

  if (isHtml) {
    const loginUrl = new URL("/contact/index.html", request.url);
    loginUrl.searchParams.set("auth", "required");
    return Response.redirect(loginUrl.toString(), 302);
  }

  return new Response(
    "この資料の閲覧には関係者認証が必要です。お問い合わせページからログインしてください。",
    {
      status: 403,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    }
  );
}

export const config = {
  matcher: ["/assets/pdf/:path*", "/assets/time-capsule-:year.pdf"],
};
