import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { API_URL, ACCESS_TOKEN_COOKIE } from "@/lib/api";
import { setAccessTokenCookie } from "@/lib/cookies";
import type { AuthResponse } from "@/lib/types";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ message: "Step 1 must be completed first" }, { status: 401 });
  }

  const body = await request.json();

  const apiRes = await fetch(`${API_URL}/auth/register/step2`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  const data = await apiRes.json();
  if (!apiRes.ok) {
    return NextResponse.json(data, { status: apiRes.status });
  }

  const { accessToken, user } = data as AuthResponse;
  setAccessTokenCookie(cookieStore, accessToken, user.status);

  return NextResponse.json({ user });
}
