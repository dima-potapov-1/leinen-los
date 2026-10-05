import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getAuthOrigin } from "@/lib/auth-origin";

export async function GET(request: NextRequest) {
  const origin = getAuthOrigin(request);
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const callbackError = searchParams.get("error");
  const redirectUri = `${origin}/api/auth/google/callback`;

  if (callbackError || !code) {
    return NextResponse.redirect(`${origin}/login?error=google_auth_cancelled`);
  }

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return NextResponse.redirect(`${origin}/login?error=google_not_configured`);
  }

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  const tokens = await tokenRes.json();

  if (!tokens.id_token) {
    console.error("Google token exchange failed:", tokens);
    return NextResponse.redirect(`${origin}/login?error=token_exchange_failed`);
  }

  let response = NextResponse.redirect(`${origin}/`);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: {
            name: string;
            value: string;
            options?: Record<string, unknown>;
          }[]
        ) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.redirect(`${origin}/`);
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { error } = await supabase.auth.signInWithIdToken({
    provider: "google",
    token: tokens.id_token,
    access_token: tokens.access_token,
  });

  if (error) {
    console.error("Supabase signInWithIdToken error:", error);
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  return response;
}
