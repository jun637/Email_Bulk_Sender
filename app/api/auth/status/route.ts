import { NextResponse } from "next/server";
import { getAuthClient } from "@/lib/auth";
import { google } from "googleapis";

export async function GET() {
  const auth = await getAuthClient();
  if (!auth) {
    return NextResponse.json({ authenticated: false });
  }

  try {
    const gmail = google.gmail({ version: "v1", auth });
    const profile = await gmail.users.getProfile({ userId: "me" });
    return NextResponse.json({
      authenticated: true,
      email: profile.data.emailAddress,
    });
  } catch {
    return NextResponse.json({ authenticated: false });
  }
}
