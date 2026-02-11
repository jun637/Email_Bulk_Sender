import { google } from "googleapis";
import { cookies } from "next/headers";
import type { AuthTokens } from "./types";

export function getOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/callback`
  );
}

export async function getTokensFromCookies(): Promise<AuthTokens | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get("gmail_tokens")?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthTokens;
  } catch {
    return null;
  }
}

export async function getAuthClient() {
  const tokens = await getTokensFromCookies();
  if (!tokens) return null;
  const oauth2 = getOAuthClient();
  oauth2.setCredentials(tokens);
  return oauth2;
}
