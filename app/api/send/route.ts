import { NextRequest } from "next/server";
import { getAuthClient, getTokensFromCookies } from "@/lib/auth";
import { getDraft, sendEmail } from "@/lib/gmail";
import { getSheetData, updateSheetCell } from "@/lib/sheets";
import { extractVariables, replaceVariables } from "@/lib/template";
import { createTrackingPixel } from "@/lib/tracking";
import type { SendOptions, SendProgress } from "@/lib/types";

export async function POST(req: NextRequest) {
  const auth = await getAuthClient();
  if (!auth) {
    return new Response("Not authenticated", { status: 401 });
  }

  const options: SendOptions = await req.json();
  const {
    draftId,
    spreadsheetId,
    sheetTitle,
    emailColumn,
    variableMap,
    fromName,
    cc,
    bcc,
    mergeStatusColumn,
    trackOpens,
    batchSize,
    emailDelay,
  } = options;

  const BATCH_SIZE = batchSize || 50;
  const EMAIL_DELAY = (emailDelay || 2) * 1000; // to ms
  const BATCH_PAUSE = 30_000; // 30 seconds between batches

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      function send(data: SendProgress) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
        );
      }

      try {
        // 1. Get draft template
        const draft = await getDraft(auth, draftId);
        const templateHtml = draft.htmlBody || draft.plainBody;
        const templateSubject = draft.subject;
        const inlineImages = draft.inlineImages;

        // 2. Get sheet data
        const sheetData = await getSheetData(auth, spreadsheetId, sheetTitle);
        const { headers, rows } = sheetData;

        const emailColIdx = headers.indexOf(emailColumn);
        const mergeStatusColIdx = headers.indexOf(mergeStatusColumn);

        if (emailColIdx === -1) {
          send({
            total: 0,
            sent: 0,
            failed: 0,
            currentEmail: "",
            status: "error",
            errors: [{ email: "", error: `Email column "${emailColumn}" not found` }],
          });
          controller.close();
          return;
        }

        // Extract template variables to know what we need
        const templateVars = extractVariables(templateHtml + templateSubject);

        // Get tokens for tracking pixel storage
        const tokens = await getTokensFromCookies();
        const refreshToken = tokens?.refresh_token ?? "";

        const total = rows.length;
        const errors: { email: string; error: string }[] = [];
        let sent = 0;
        let failed = 0;

        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          const email = row[emailColIdx]?.trim();

          if (!email) {
            failed++;
            errors.push({ email: `Row ${i + 2}`, error: "Empty email" });
            send({
              total,
              sent,
              failed,
              currentEmail: `Row ${i + 2}`,
              status: "sending",
              errors,
            });
            continue;
          }

          // Skip rows already marked as sent
          if (mergeStatusColIdx !== -1) {
            const currentStatus = row[mergeStatusColIdx]?.trim();
            if (currentStatus === "EMAIL_SENT" || currentStatus === "EMAIL_OPENED") {
              sent++;
              send({
                total,
                sent,
                failed,
                currentEmail: email,
                status: "sending",
                errors,
              });
              continue;
            }
          }

          // Build values map from variableMap
          const values: Record<string, string> = {};
          for (const [templateVar, colHeader] of Object.entries(variableMap)) {
            const colIdx = headers.indexOf(colHeader);
            if (colIdx !== -1) {
              values[templateVar] = row[colIdx] ?? "";
            }
          }

          // Also map any template variable that directly matches a header
          for (const v of templateVars) {
            if (!(v in values)) {
              const colIdx = headers.indexOf(v);
              if (colIdx !== -1) {
                values[v] = row[colIdx] ?? "";
              }
            }
          }

          let finalHtml = replaceVariables(templateHtml, values);
          const finalSubject = replaceVariables(templateSubject, values);

          // Open tracking: replace an existing image src with tracking URL
          let emailInlineImages = inlineImages;
          if (trackOpens) {
            try {
              const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

              // Find the last CID image in the HTML (typically the signature logo)
              const cidPattern = /src=["']cid:([^"']+)["']/gi;
              let lastCidMatch: RegExpExecArray | null = null;
              let m: RegExpExecArray | null;
              while ((m = cidPattern.exec(finalHtml)) !== null) {
                lastCidMatch = m;
              }

              if (lastCidMatch && inlineImages) {
                // Use existing image for tracking
                const cid = lastCidMatch[1];
                const targetImage = inlineImages.find(
                  (img) => img.contentId === cid
                );

                const trackId = await createTrackingPixel({
                  email,
                  spreadsheetId,
                  sheetTitle,
                  rowIndex: i,
                  mergeStatusColumn,
                  refreshToken,
                  imageData: targetImage?.data,
                  imageMimeType: targetImage?.mimeType,
                });

                const trackUrl = `${baseUrl}/api/i/${trackId}`;
                finalHtml = finalHtml.replace(`cid:${cid}`, trackUrl);

                // Filter out the replaced image from MIME attachments
                emailInlineImages = inlineImages.filter(
                  (img) => img.contentId !== cid
                );
              } else {
                // No CID images — fall back to appended pixel
                const trackId = await createTrackingPixel({
                  email,
                  spreadsheetId,
                  sheetTitle,
                  rowIndex: i,
                  mergeStatusColumn,
                  refreshToken,
                });
                const trackUrl = `${baseUrl}/api/i/${trackId}`;
                finalHtml += `<img src="${trackUrl}" width="1" height="1" style="opacity:0;width:1px;height:1px" alt="" />`;
              }
            } catch (err) {
              console.error("Failed to create tracking:", err);
            }
          }

          try {
            await sendEmail({
              auth,
              to: email,
              subject: finalSubject,
              htmlBody: finalHtml,
              fromName,
              cc,
              bcc,
              inlineImages: emailInlineImages,
            });

            sent++;

            // Update MERGE_STATUS in sheet
            if (mergeStatusColIdx !== -1) {
              try {
                await updateSheetCell(
                  auth,
                  spreadsheetId,
                  sheetTitle,
                  i,
                  mergeStatusColIdx,
                  "EMAIL_SENT"
                );
              } catch (err) {
                console.error("Failed to update sheet status:", err);
              }
            }
          } catch (err) {
            failed++;
            const errMsg = err instanceof Error ? err.message : "Unknown error";
            errors.push({ email, error: errMsg });
          }

          send({
            total,
            sent,
            failed,
            currentEmail: email,
            status: "sending",
            errors,
          });

          // Rate limit between emails
          if (i < rows.length - 1) {
            const emailsSentInBatch = (i + 1) % BATCH_SIZE;

            if (emailsSentInBatch === 0) {
              // Batch complete — pause before next batch
              const currentBatch = Math.floor((i + 1) / BATCH_SIZE);
              const totalBatches = Math.ceil(rows.length / BATCH_SIZE);
              send({
                total,
                sent,
                failed,
                currentEmail: `배치 ${currentBatch}/${totalBatches} 완료, ${BATCH_PAUSE / 1000}초 대기 중...`,
                status: "batch_pause",
                errors,
              });
              await new Promise((resolve) => setTimeout(resolve, BATCH_PAUSE));
            } else {
              await new Promise((resolve) => setTimeout(resolve, EMAIL_DELAY));
            }
          }
        }

        send({
          total,
          sent,
          failed,
          currentEmail: "",
          status: "done",
          errors,
        });
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : "Unknown error";
        send({
          total: 0,
          sent: 0,
          failed: 0,
          currentEmail: "",
          status: "error",
          errors: [{ email: "", error: errMsg }],
        });
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
