import { NextRequest, NextResponse } from "next/server";
import { getAuthClient } from "@/lib/auth";
import { getSheetData } from "@/lib/sheets";

export async function POST(req: NextRequest) {
  const auth = await getAuthClient();
  if (!auth) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { spreadsheetId, sheetTitle } = await req.json();
  if (!spreadsheetId || !sheetTitle) {
    return NextResponse.json(
      { error: "spreadsheetId and sheetTitle are required" },
      { status: 400 }
    );
  }

  try {
    const data = await getSheetData(auth, spreadsheetId, sheetTitle);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to get sheet data:", error);
    return NextResponse.json(
      { error: "Failed to read sheet data" },
      { status: 500 }
    );
  }
}
