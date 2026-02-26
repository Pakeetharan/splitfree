import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { PUBLIC_PATHS, LOGIN_PATH, AUTH_REDIRECT_PATH } from "@/lib/constants";

/**
 * Next.js 16 Proxy (replaces middleware.ts).
 * Runs before every matched route to handle auth session refresh and protection.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths through without auth
  const isPublicPath = PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(path + "/")
  );

  // Always allow static assets and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/icons") ||
    pathname === "/favicon.ico" ||
    pathname === "/manifest.json" ||
    pathname === "/sw.js" ||
    pathname.endsWith(".svg") ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".ico")
  ) {
    return NextResponse.next();
  }

  // Refresh the Supabase session (handles token auto-refresh)
  const { user, supabaseResponse } = await updateSession(request);

  // If user is authenticated and trying to access login, redirect to dashboard
  if (user && pathname === LOGIN_PATH) {
    const url = request.nextUrl.clone();
    url.pathname = AUTH_REDIRECT_PATH;
    return NextResponse.redirect(url);
  }

  // If path is public, allow through regardless of auth status
  if (isPublicPath) {
    return supabaseResponse;
  }

  // Protected route: redirect to login if no session
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = LOGIN_PATH;
    url.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(url);
  }

  // Set user info headers for API route handlers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-user-id", user.id);
  requestHeaders.set("x-user-email", user.email ?? "");
  requestHeaders.set("x-user-name", user.user_metadata?.full_name ?? "");
  requestHeaders.set(
    "x-user-avatar",
    user.user_metadata?.avatar_url ?? ""
  );

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Copy over any cookies that supabase middleware set (token refresh)
  supabaseResponse.headers.forEach((value, key) => {
    if (key.toLowerCase() === "set-cookie") {
      response.headers.append("set-cookie", value);
    }
  });

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, sitemap.xml, robots.txt
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
