import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { HAS_APPS_COOKIE } from "@/lib/applications";
import { ONBOARDING_COOKIE } from "@/lib/onboarding";

function defaultAppHome(request: NextRequest): string {
  return request.cookies.get(HAS_APPS_COOKIE)?.value === "1"
    ? "/app/applications"
    : "/app/jobs";
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return supabaseResponse;
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isAuthRoute =
    path.startsWith("/sign-in") ||
    path.startsWith("/sign-up") ||
    path.startsWith("/forgot-password");
  const isApp = path.startsWith("/app");
  const isOnboarding = path.startsWith("/onboarding");
  const onboarded =
    request.cookies.get(ONBOARDING_COOKIE)?.value === "1";

  if (!user && (isApp || isOnboarding)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/sign-in";
    redirectUrl.searchParams.set("next", path);
    return NextResponse.redirect(redirectUrl);
  }

  if (user && isAuthRoute) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = onboarded ? defaultAppHome(request) : "/onboarding";
    return NextResponse.redirect(redirectUrl);
  }

  if (user && isApp && !onboarded) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/onboarding";
    return NextResponse.redirect(redirectUrl);
  }

  if (user && isOnboarding && onboarded) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = defaultAppHome(request);
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}
