import { NextRequest } from "next/server";
import { after } from "next/server";
import { google } from "googleapis";
import { getOAuthClient } from "@/lib/auth";
import { getTrackingData, markOpened } from "@/lib/tracking";
import { updateSheetCell } from "@/lib/sheets";

// 1x1 transparent PNG
const PIXEL = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64"
);

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");

  if (id) {
    after(async () => {
      try {
        await handleTracking(id);
      } catch (err) {
        console.error("Tracking error:", err);
      }
    });
  }

  return new Response(PIXEL, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}

async function handleTracking(id: string) {
  const data = await getTrackingData(id);
  if (!data) return;
  if (data.openedAt) return; // Already tracked

  // Mark as opened in KV
  await markOpened(id);

  // Update sheet using the stored refresh token
  if (data.refreshToken && data.mergeStatusColumn) {
    try {
      const oauth2 = getOAuthClient();
      oauth2.setCredentials({ refresh_token: data.refreshToken });

      // Force token refresh
      await oauth2.getAccessToken();

      const headers = await getSheetHeaders(
        oauth2,
        data.spreadsheetId,
        data.sheetTitle
      );
      const mergeStatusColIdx = headers.indexOf(data.mergeStatusColumn);
      if (mergeStatusColIdx !== -1) {
        await updateSheetCell(
          oauth2,
          data.spreadsheetId,
          data.sheetTitle,
          data.rowIndex,
          mergeStatusColIdx,
          "EMAIL_OPENED"
        );
      }
    } catch (err) {
      console.error("Failed to update sheet for tracking:", err);
    }
  }
}

async function getSheetHeaders(
  auth: ReturnType<typeof getOAuthClient>,
  spreadsheetId: string,
  sheetTitle: string
): Promise<string[]> {
  const sheets = google.sheets({ version: "v4", auth });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'${sheetTitle}'!1:1`,
  });
  return (res.data.values?.[0] ?? []).map(String);
}
