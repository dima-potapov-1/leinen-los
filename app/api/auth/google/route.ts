import { NextResponse } from "next/server";
import { getAuthOrigin } from "@/lib/auth-origin";

export async function GET(request: Request) {
  const origin = getAuthOrigin(request);

  if (!process.env.GOOGLE_CLIENT_ID) {
    return NextResponse.redirect(`${origin}/login?error=google_not_configured`);
  }

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: `${origin}/api/auth/google/callback`,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "select_account",
  });

  return NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params}`
  );
}
