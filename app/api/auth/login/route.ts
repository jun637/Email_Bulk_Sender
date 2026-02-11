import { NextResponse } from "next/server";
import { getOAuthClient } from "@/lib/auth";

export async function GET() {
  const oauth2 = getOAuthClient();
  const url = oauth2.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/gmail.compose",
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/spreadsheets",
    ],
  });
  return NextResponse.redirect(url);
}
