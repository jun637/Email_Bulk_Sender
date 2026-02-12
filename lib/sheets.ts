import { google } from "googleapis";
import type { OAuth2Client } from "google-auth-library";
import type { SheetInfo, SheetData } from "./types";

/**
 * Extract spreadsheet ID from a Google Sheets URL.
 */
export function extractSpreadsheetId(url: string): string | null {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match?.[1] ?? null;
}

/**
 * List all sheet tabs in a spreadsheet.
 */
export async function listSheets(
  auth: OAuth2Client,
  spreadsheetId: string
): Promise<SheetInfo[]> {
  const sheets = google.sheets({ version: "v4", auth });
  const res = await sheets.spreadsheets.get({ spreadsheetId });
  return (res.data.sheets ?? []).map((s) => ({
    sheetId: s.properties!.sheetId!,
    title: s.properties!.title!,
  }));
}

/**
 * Get header row + data rows from a specific sheet tab.
 */
export async function getSheetData(
  auth: OAuth2Client,
  spreadsheetId: string,
  sheetTitle: string
): Promise<SheetData> {
  const sheets = google.sheets({ version: "v4", auth });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'${sheetTitle}'`,
  });
  const values = res.data.values ?? [];
  if (values.length === 0) return { headers: [], rows: [] };
  const headers = values[0].map(String);
  const rows = values.slice(1).map((row) =>
    headers.map((_, i) => (row[i] != null ? String(row[i]) : ""))
  );
  return { headers, rows };
}

// Background colors for MERGE_STATUS values
const STATUS_COLORS: Record<string, { red: number; green: number; blue: number }> = {
  EMAIL_SENT: { red: 0.85, green: 0.85, blue: 0.85 },       // 회색
  EMAIL_OPENED: { red: 0.72, green: 0.88, blue: 0.53 },     // 연두색
};

/**
 * Update a single cell in a sheet.
 */
export async function updateSheetCell(
  auth: OAuth2Client,
  spreadsheetId: string,
  sheetTitle: string,
  rowIndex: number, // 0-based data row index (not including header)
  colIndex: number,
  value: string
): Promise<void> {
  const sheets = google.sheets({ version: "v4", auth });
  const colLetter = columnToLetter(colIndex);
  const cellRow = rowIndex + 2; // +1 for header, +1 for 1-based
  const range = `'${sheetTitle}'!${colLetter}${cellRow}`;

  // Update cell value
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption: "RAW",
    requestBody: { values: [[value]] },
  });

  // Apply background color if status has a color defined
  const color = STATUS_COLORS[value];
  if (color) {
    const sheetInfo = await sheets.spreadsheets.get({ spreadsheetId });
    const sheet = sheetInfo.data.sheets?.find(
      (s) => s.properties?.title === sheetTitle
    );
    if (!sheet?.properties?.sheetId && sheet?.properties?.sheetId !== 0) return;

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            repeatCell: {
              range: {
                sheetId: sheet.properties.sheetId,
                startRowIndex: cellRow - 1,
                endRowIndex: cellRow,
                startColumnIndex: colIndex,
                endColumnIndex: colIndex + 1,
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: color,
                },
              },
              fields: "userEnteredFormat.backgroundColor",
            },
          },
        ],
      },
    });
  }
}

/**
 * Convert 0-based column index to column letter (A, B, ..., Z, AA, AB, ...).
 */
export function columnToLetter(colIndex: number): string {
  let letter = "";
  let num = colIndex;
  while (num >= 0) {
    letter = String.fromCharCode((num % 26) + 65) + letter;
    num = Math.floor(num / 26) - 1;
  }
  return letter;
}
