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
  } = options;

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

          // Add tracking pixel if enabled
          if (trackOpens) {
            try {
              const trackId = await createTrackingPixel({
                email,
                spreadsheetId,
                sheetTitle,
                rowIndex: i,
                mergeStatusColumn,
                refreshToken,
              });
              const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
              const pixelUrl = `${baseUrl}/api/track?id=${trackId}`;
              finalHtml += `<img src="${pixelUrl}" width="1" height="1" style="display:none" alt="" />`;
            } catch (err) {
              console.error("Failed to create tracking pixel:", err);
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
              inlineImages,
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

          // Rate limit: ~1 email per second to avoid Gmail API limits
          if (i < rows.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
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
