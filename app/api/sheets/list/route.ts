import { NextRequest, NextResponse } from "next/server";
import { getAuthClient } from "@/lib/auth";
import { extractSpreadsheetId, listSheets } from "@/lib/sheets";

export async function POST(req: NextRequest) {
  const auth = await getAuthClient();
  if (!auth) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { url } = await req.json();
  const spreadsheetId = extractSpreadsheetId(url);
  if (!spreadsheetId) {
    return NextResponse.json(
      { error: "Invalid Google Sheets URL" },
      { status: 400 }
    );
  }

  try {
    const sheets = await listSheets(auth, spreadsheetId);
    return NextResponse.json({ spreadsheetId, sheets });
  } catch (error) {
    console.error("Failed to list sheets:", error);
    return NextResponse.json(
      { error: "Failed to access spreadsheet" },
      { status: 500 }
    );
  }
}
