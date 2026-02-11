// === Gmail Types ===
export interface InlineImage {
  contentId: string; // e.g. "image001.png@01D..."
  mimeType: string;  // e.g. "image/png"
  data: string;      // base64 encoded
}

export interface Draft {
  id: string;
  messageId: string;
  subject: string;
  snippet: string;
  htmlBody: string;
  plainBody: string;
  to: string;
  cc: string;
  bcc: string;
  from: string;
  inlineImages: InlineImage[];
}

// === Sheets Types ===
export interface SheetInfo {
  sheetId: number;
  title: string;
}

export interface SheetData {
  headers: string[];
  rows: string[][];
}

// === Recipient Types ===
export interface Recipient {
  email: string;
  rowIndex: number; // 0-based index within data rows (not header)
  values: Record<string, string>;
}

// === Send Types ===
export type MergeStatus = "EMAIL_SENT" | "EMAIL_FAILED" | "EMAIL_OPENED";

export interface SendOptions {
  draftId: string;
  spreadsheetId: string;
  sheetTitle: string;
  emailColumn: string;
  variableMap: Record<string, string>; // templateVar -> columnHeader
  fromName?: string;
  cc?: string;
  bcc?: string;
  mergeStatusColumn: string;
  trackOpens: boolean;
}

export interface SendProgress {
  total: number;
  sent: number;
  failed: number;
  currentEmail: string;
  status: "sending" | "done" | "error";
  errors: { email: string; error: string }[];
}

// === Tracking Types ===
export interface TrackingMetadata {
  id: string;
  email: string;
  spreadsheetId: string;
  sheetTitle: string;
  rowIndex: number;
  mergeStatusColumn: string;
  refreshToken: string;
  openedAt?: string;
}

// === Auth Types ===
export interface AuthTokens {
  access_token: string;
  refresh_token?: string;
  expiry_date?: number;
}
