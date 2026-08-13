import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ACCESS_TOKEN_COOKIE } from "@/lib/api";

// Hands the current session's JWT to same-origin client code so it can
// authenticate the Socket.IO handshake, without ever storing the token itself
// in client-readable storage (it lives only in the httpOnly cookie).
export async function GET() {
  const token = (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }
  return NextResponse.json({ token });
}
