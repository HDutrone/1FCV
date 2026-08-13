import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { API_URL } from "@/lib/api";
import { setAccessTokenCookie } from "@/lib/cookies";
import type { AuthResponse } from "@/lib/types";

export async function POST(request: Request) {
  const body = await request.json();

  const apiRes = await fetch(`${API_URL}/auth/register/step1`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await apiRes.json();
  if (!apiRes.ok) {
    return NextResponse.json(data, { status: apiRes.status });
  }

  const { accessToken, user } = data as AuthResponse;
  setAccessTokenCookie(await cookies(), accessToken, user.status);

  return NextResponse.json({ user });
}
