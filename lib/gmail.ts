import { google, type gmail_v1 } from "googleapis";
import type { OAuth2Client } from "google-auth-library";
import type { Draft, InlineImage } from "./types";

export async function listDrafts(auth: OAuth2Client): Promise<Draft[]> {
  const gmail = google.gmail({ version: "v1", auth });
  const res = await gmail.users.drafts.list({ userId: "me", maxResults: 50 });
  const drafts = res.data.drafts ?? [];

  const details = await Promise.all(
    drafts.map((d) =>
      gmail.users.drafts.get({
        userId: "me",
        id: d.id!,
        format: "full",
      })
    )
  );

  return Promise.all(details.map((d) => parseDraft(gmail, d.data)));
}

export async function getDraft(
  auth: OAuth2Client,
  draftId: string
): Promise<Draft> {
  const gmail = google.gmail({ version: "v1", auth });
  const res = await gmail.users.drafts.get({
    userId: "me",
    id: draftId,
    format: "full",
  });
  return parseDraft(gmail, res.data);
}

async function parseDraft(
  gmail: gmail_v1.Gmail,
  draft: gmail_v1.Schema$Draft
): Promise<Draft> {
  const msg = draft.message!;
  const headers = msg.payload?.headers ?? [];

  const getHeader = (name: string) =>
    headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value ??
    "";

  const htmlBody = extractBody(msg.payload!, "text/html");
  const plainBody = extractBody(msg.payload!, "text/plain");

  // Extract inline images
  const inlineImages = await extractInlineImages(gmail, msg.id!, msg.payload!);

  return {
    id: draft.id!,
    messageId: msg.id!,
    subject: getHeader("Subject"),
    snippet: msg.snippet ?? "",
    htmlBody,
    plainBody,
    to: getHeader("To"),
    cc: getHeader("Cc"),
    bcc: getHeader("Bcc"),
    from: getHeader("From"),
    inlineImages,
  };
}

function extractBody(
  payload: gmail_v1.Schema$MessagePart,
  mimeType: string
): string {
  if (payload.mimeType === mimeType && payload.body?.data) {
    return Buffer.from(payload.body.data, "base64url").toString("utf-8");
  }
  if (payload.parts) {
    for (const part of payload.parts) {
      const result = extractBody(part, mimeType);
      if (result) return result;
    }
  }
  return "";
}

/**
 * Extract inline image parts (with Content-ID) from MIME structure.
 * Fetches attachment data if needed.
 */
async function extractInlineImages(
  gmail: gmail_v1.Gmail,
  messageId: string,
  payload: gmail_v1.Schema$MessagePart
): Promise<InlineImage[]> {
  const images: InlineImage[] = [];
  await collectInlineImages(gmail, messageId, payload, images);
  return images;
}

async function collectInlineImages(
  gmail: gmail_v1.Gmail,
  messageId: string,
  part: gmail_v1.Schema$MessagePart,
  images: InlineImage[]
): Promise<void> {
  const partHeaders = part.headers ?? [];
  const contentId = partHeaders.find(
    (h) => h.name?.toLowerCase() === "content-id"
  )?.value;

  if (contentId && part.mimeType?.startsWith("image/")) {
    // Strip angle brackets from Content-ID: <xxx> -> xxx
    const cid = contentId.replace(/^<|>$/g, "");
    let data = "";

    if (part.body?.data) {
      // Data is inline in the response
      data = part.body.data.replace(/-/g, "+").replace(/_/g, "/");
    } else if (part.body?.attachmentId) {
      // Need to fetch attachment separately
      const att = await gmail.users.messages.attachments.get({
        userId: "me",
        messageId,
        id: part.body.attachmentId,
      });
      data = (att.data.data ?? "").replace(/-/g, "+").replace(/_/g, "/");
    }

    if (data) {
      images.push({ contentId: cid, mimeType: part.mimeType, data });
    }
  }

  if (part.parts) {
    for (const child of part.parts) {
      await collectInlineImages(gmail, messageId, child, images);
    }
  }
}

interface SendEmailParams {
  auth: OAuth2Client;
  to: string;
  subject: string;
  htmlBody: string;
  fromName?: string;
  cc?: string;
  bcc?: string;
  inlineImages?: InlineImage[];
}

export async function sendEmail(params: SendEmailParams): Promise<void> {
  const { auth, to, subject, htmlBody, fromName, cc, bcc, inlineImages } =
    params;
  const gmail = google.gmail({ version: "v1", auth });

  // Get user's email for From header
  const profile = await gmail.users.getProfile({ userId: "me" });
  const email = profile.data.emailAddress!;

  const fromHeader = fromName
    ? `=?UTF-8?B?${Buffer.from(fromName).toString("base64")}?= <${email}>`
    : email;

  const commonHeaders = [
    `From: ${fromHeader}`,
    `To: ${to}`,
    ...(cc ? [`Cc: ${cc}`] : []),
    ...(bcc ? [`Bcc: ${bcc}`] : []),
    `Subject: =?UTF-8?B?${Buffer.from(subject).toString("base64")}?=`,
    "MIME-Version: 1.0",
  ];

  let rawMessage: string;

  if (inlineImages && inlineImages.length > 0) {
    // Multipart/related for HTML + inline images
    const boundary = `boundary_${crypto.randomUUID().replace(/-/g, "")}`;

    const lines = [
      ...commonHeaders,
      `Content-Type: multipart/related; boundary="${boundary}"`,
      "",
      `--${boundary}`,
      'Content-Type: text/html; charset="UTF-8"',
      "Content-Transfer-Encoding: base64",
      "",
      Buffer.from(htmlBody).toString("base64"),
    ];

    for (const img of inlineImages) {
      lines.push(
        `--${boundary}`,
        `Content-Type: ${img.mimeType}`,
        "Content-Transfer-Encoding: base64",
        `Content-ID: <${img.contentId}>`,
        "Content-Disposition: inline",
        "",
        img.data
      );
    }

    lines.push(`--${boundary}--`);
    rawMessage = lines.join("\r\n");
  } else {
    // Simple HTML email
    rawMessage = [
      ...commonHeaders,
      'Content-Type: text/html; charset="UTF-8"',
      "Content-Transfer-Encoding: base64",
      "",
      Buffer.from(htmlBody).toString("base64"),
    ].join("\r\n");
  }

  const raw = Buffer.from(rawMessage).toString("base64url");

  await gmail.users.messages.send({
    userId: "me",
    requestBody: { raw },
  });
}
