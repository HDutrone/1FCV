import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ACCESS_TOKEN_COOKIE } from "@/lib/api";

export async function POST() {
  (await cookies()).delete(ACCESS_TOKEN_COOKIE);
  return NextResponse.json({ ok: true });
}
