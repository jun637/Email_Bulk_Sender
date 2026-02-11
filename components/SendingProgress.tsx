"use client";

import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useStore } from "@/lib/store";
import type { SendProgress } from "@/lib/types";

export default function SendingProgress() {
  const {
    authenticated,
    selectedDraft,
    sheetData,
    spreadsheetId,
    selectedSheet,
    emailColumn,
    mergeStatusColumn,
    variableMap,
    fromName,
    cc,
    bcc,
    trackOpens,
    isSending,
    sendProgress,
    setIsSending,
    setSendProgress,
  } = useStore();

  const canSend =
    authenticated &&
    selectedDraft &&
    sheetData &&
    emailColumn &&
    mergeStatusColumn &&
    !isSending;

  const handleSend = useCallback(async () => {
    if (!canSend) return;

    setIsSending(true);
    setSendProgress(null);

    try {
      const res = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draftId: selectedDraft!.id,
          spreadsheetId,
          sheetTitle: selectedSheet,
          emailColumn,
          variableMap,
          fromName: fromName || undefined,
          cc: cc || undefined,
          bcc: bcc || undefined,
          mergeStatusColumn,
          trackOpens,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to start sending");
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No stream reader");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data: SendProgress = JSON.parse(line.slice(6));
              setSendProgress(data);
            } catch {
              // ignore parse errors
            }
          }
        }
      }
    } catch (err) {
      setSendProgress({
        total: 0,
        sent: 0,
        failed: 0,
        currentEmail: "",
        status: "error",
        errors: [
          {
            email: "",
            error: err instanceof Error ? err.message : "Unknown error",
          },
        ],
      });
    } finally {
      setIsSending(false);
    }
  }, [
    canSend,
    selectedDraft,
    spreadsheetId,
    selectedSheet,
    emailColumn,
    variableMap,
    fromName,
    cc,
    bcc,
    mergeStatusColumn,
    trackOpens,
    setIsSending,
    setSendProgress,
  ]);

  const downloadErrors = () => {
    if (!sendProgress?.errors.length) return;
    const csv = [
      "Email,Error",
      ...sendProgress.errors.map(
        (e) => `"${e.email}","${e.error.replace(/"/g, '""')}"`
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "send-errors.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!authenticated || !selectedDraft || !sheetData) return null;

  const progress = sendProgress;
  const percent =
    progress && progress.total > 0
      ? Math.round(((progress.sent + progress.failed) / progress.total) * 100)
      : 0;

  return (
    <Card className={isSending ? "border-primary/30 shadow-md shadow-primary/5" : ""}>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
            progress?.status === "done"
              ? "bg-emerald-100"
              : progress?.status === "error"
                ? "bg-red-100"
                : "bg-primary/10"
          }`}>
            {progress?.status === "done" ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <path d="m9 11 3 3L22 4"/>
              </svg>
            ) : progress?.status === "error" ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" x2="9" y1="9" y2="15"/>
                <line x1="9" x2="15" y1="9" y2="15"/>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                <path d="m22 2-7 20-4-9-9-4Z"/>
                <path d="M22 2 11 13"/>
              </svg>
            )}
          </div>
          <div>
            <CardTitle className="text-lg">발송</CardTitle>
            <p className="text-sm text-muted-foreground mt-0.5">
              총 {sheetData.rows.length}명에게 발송
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isSending && !progress && (
          <Button onClick={handleSend} disabled={!canSend} size="lg" className="w-full gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m22 2-7 20-4-9-9-4Z"/>
              <path d="M22 2 11 13"/>
            </svg>
            발송 시작
          </Button>
        )}

        {(isSending || progress) && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">진행률</span>
                <span className="font-semibold">{percent}%</span>
              </div>
              <Progress value={percent} className="h-3" />
            </div>

            <div className="flex gap-3">
              <div className="flex-1 text-center py-2.5 rounded-lg bg-muted/50 border">
                <p className="text-lg font-bold text-foreground">{progress?.total ?? 0}</p>
                <p className="text-xs text-muted-foreground">전체</p>
              </div>
              <div className="flex-1 text-center py-2.5 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-lg font-bold text-primary">{progress?.sent ?? 0}</p>
                <p className="text-xs text-muted-foreground">성공</p>
              </div>
              {(progress?.failed ?? 0) > 0 && (
                <div className="flex-1 text-center py-2.5 rounded-lg bg-destructive/5 border border-destructive/20">
                  <p className="text-lg font-bold text-destructive">{progress?.failed ?? 0}</p>
                  <p className="text-xs text-muted-foreground">실패</p>
                </div>
              )}
            </div>

            {isSending && progress?.currentEmail && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <svg className="animate-spin h-3.5 w-3.5 text-primary" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                발송 중: {progress.currentEmail}
              </div>
            )}

            {progress?.status === "done" && (
              <Alert className="border-emerald-200 bg-emerald-50 text-emerald-800">
                <AlertDescription>
                  발송이 완료되었습니다. 성공 {progress.sent}건, 실패 {progress.failed}건
                </AlertDescription>
              </Alert>
            )}

            {progress?.status === "error" && (
              <Alert variant="destructive">
                <AlertDescription>
                  {progress.errors[0]?.error || "발송 중 오류가 발생했습니다."}
                </AlertDescription>
              </Alert>
            )}

            {progress && progress.errors.length > 0 && progress.status === "done" && (
              <Button variant="outline" size="sm" onClick={downloadErrors} className="gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" x2="12" y1="15" y2="3"/>
                </svg>
                실패 목록 다운로드 (CSV)
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
