import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = request.nextUrl;
  const code = requestUrl.searchParams.get("code");
  const errorCode = requestUrl.searchParams.get("error_code");

  if (errorCode) {
    return NextResponse.redirect(
      new URL(
        `/forgot-password?error=${encodeURIComponent(errorCode)}`,
        requestUrl.origin,
      ),
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL(
        "/forgot-password?error=invalid-link",
        requestUrl.origin,
      ),
    );
  }

  const supabase = await createClient();

  const { error } =
    await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error(
      "Password recovery code exchange failed:",
      error.message,
    );

    return NextResponse.redirect(
      new URL(
        "/forgot-password?error=invalid-link",
        requestUrl.origin,
      ),
    );
  }

  return NextResponse.redirect(
    new URL("/reset-password", requestUrl.origin),
  );
}