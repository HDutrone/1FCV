import "server-only";
import type { cookies } from "next/headers";
import { ACCESS_TOKEN_COOKIE } from "./api";

type CookieStore = Awaited<ReturnType<typeof cookies>>;

const THIRTY_MINUTES = 60 * 30;
const SEVEN_DAYS = 60 * 60 * 24 * 7;

/** Persists the API's JWT as an httpOnly cookie, scoped to match the token's own lifetime. */
export function setAccessTokenCookie(
  cookieStore: CookieStore,
  token: string,
  status: "PENDING" | "ACTIVE" | "SUSPENDED",
) {
  cookieStore.set(ACCESS_TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: status === "PENDING" ? THIRTY_MINUTES : SEVEN_DAYS,
  });
}
