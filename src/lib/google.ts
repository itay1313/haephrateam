import { prisma } from "./prisma";

const SCOPE = "https://www.googleapis.com/auth/photospicker.mediaitems.readonly";

type GoogleSession = {
  id: string;
  googleAccessToken: string | null;
  googleRefreshToken: string | null;
  googleTokenExpiry: Date | null;
};

export function googleConfigured() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function googleRedirectUri() {
  return process.env.GOOGLE_REDIRECT_URI ?? "http://127.0.0.1:3000/api/google/callback";
}

export function googleAuthUrl(state: string) {
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", process.env.GOOGLE_CLIENT_ID!);
  url.searchParams.set("redirect_uri", googleRedirectUri());
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", SCOPE);
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("state", state);
  return url.toString();
}

export async function exchangeGoogleCode(code: string) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: googleRedirectUri(),
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) throw new Error("Google token exchange failed");
  return res.json() as Promise<{
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  }>;
}

export async function refreshGoogleAccess(refreshToken: string) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) throw new Error("Google refresh failed");
  return res.json() as Promise<{ access_token: string; expires_in: number }>;
}

export async function googleFetch(accessToken: string, url: string, init?: RequestInit) {
  return fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(init?.headers ?? {}),
    },
  });
}

export async function ensureGoogleAccess(session: GoogleSession) {
  if (!session.googleAccessToken) return null;
  if (session.googleTokenExpiry && session.googleTokenExpiry > new Date()) {
    return session.googleAccessToken;
  }
  if (!session.googleRefreshToken) return session.googleAccessToken;
  const refreshed = await refreshGoogleAccess(session.googleRefreshToken);
  await prisma.session.update({
    where: { id: session.id },
    data: {
      googleAccessToken: refreshed.access_token,
      googleTokenExpiry: new Date(Date.now() + refreshed.expires_in * 1000),
    },
  });
  return refreshed.access_token;
}

export function pickerWebUri(pickerUri: string) {
  return `${String(pickerUri).replace(/\/$/, "")}/autoclose`;
}

export async function createPickerSession(accessToken: string) {
  const picker = await googleFetch(accessToken, "https://photospicker.googleapis.com/v1/sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  const picking = await picker.json();
  if (!picker.ok || !picking.id || !picking.pickerUri) return null;
  return {
    id: String(picking.id),
    pickerUri: pickerWebUri(String(picking.pickerUri)),
  };
}

export function pollDelayMs(pollInterval?: string) {
  if (!pollInterval) return 2500;
  const match = pollInterval.match(/(\d+(?:\.\d+)?)s/);
  if (!match) return 2500;
  return Math.max(1500, Number(match[1]) * 1000);
}
