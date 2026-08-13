import "server-only";
import { cookies } from "next/headers";
import { API_URL, ACCESS_TOKEN_COOKIE } from "./api";
import type { SafeUser } from "./types";

/** Reads the httpOnly access-token cookie and resolves the current user from the API, if any. */
export async function getSession(): Promise<SafeUser | null> {
  const token = (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value;
  if (!token) return null;

  try {
    const res = await fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as SafeUser;
  } catch {
    return null;
  }
}
