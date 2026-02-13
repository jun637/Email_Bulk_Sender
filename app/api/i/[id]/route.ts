import { NextRequest } from "next/server";
import { after } from "next/server";
import { google } from "googleapis";
import { getOAuthClient } from "@/lib/auth";
import { getTrackingData, markOpened } from "@/lib/tracking";
import { updateSheetCell } from "@/lib/sheets";

// Fallback 1x1 transparent PNG (used when no image data stored)
const FALLBACK_PIXEL = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64"
);

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Get tracking data to determine what image to serve
  const data = id ? await getTrackingData(id) : null;

  // Schedule tracking update in background (non-blocking)
  if (id) {
    after(async () => {
      try {
        await handleTracking(id);
      } catch (err) {
        console.error("Tracking error:", err);
      }
    });
  }

  // Serve the actual image (logo) or fallback pixel
  if (data?.imageData && data?.imageMimeType) {
    const imageBuffer = Buffer.from(data.imageData, "base64");
    return new Response(imageBuffer, {
      headers: {
        "Content-Type": data.imageMimeType,
        "Cache-Control": "public, max-age=86400",
      },
    });
  }

  // Fallback: 1x1 transparent PNG
  return new Response(FALLBACK_PIXEL, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
    },
  });
}

async function handleTracking(id: string) {
  const data = await getTrackingData(id);
  if (!data) return;
  if (data.openedAt) return;

  await markOpened(id);

  if (data.refreshToken && data.mergeStatusColumn) {
    try {
      const oauth2 = getOAuthClient();
      oauth2.setCredentials({ refresh_token: data.refreshToken });
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
