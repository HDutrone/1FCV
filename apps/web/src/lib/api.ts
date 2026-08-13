// Server-only: base URL of the NestJS API. Never expose this to the browser —
// the browser only ever talks to our own Next.js route handlers, which proxy
// to the API and translate its JWT into an httpOnly cookie.
export const API_URL = process.env.API_URL ?? "http://localhost:3001/api";

export const ACCESS_TOKEN_COOKIE = "accessToken";
