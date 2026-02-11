"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useStore } from "@/lib/store";
import { replaceCidWithDataUri } from "@/lib/template";
import type { Draft } from "@/lib/types";

export default function DraftSelector() {
  const { authenticated, drafts, selectedDraft, setDrafts, setSelectedDraft } =
    useStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadDrafts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/drafts");
      if (!res.ok) throw new Error("Failed to load drafts");
      const data: Draft[] = await res.json();
      setDrafts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load drafts");
    } finally {
      setLoading(false);
    }
  }, [setDrafts]);

  const handleSelect = (draftId: string) => {
    const draft = drafts.find((d) => d.id === draftId) ?? null;
    setSelectedDraft(draft);
  };

  if (!authenticated) return null;

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          </div>
          <div>
            <CardTitle className="text-lg">임시보관함 (Draft) 선택</CardTitle>
            <p className="text-sm text-muted-foreground mt-0.5">발송할 이메일 템플릿을 선택하세요</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={loadDrafts} disabled={loading} variant="outline" className="gap-2">
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              불러오는 중...
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" x2="12" y1="15" y2="3"/>
              </svg>
              임시보관함 불러오기
            </>
          )}
        </Button>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {drafts.length > 0 && (
          <Select onValueChange={handleSelect} value={selectedDraft?.id ?? ""}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Draft를 선택하세요" />
            </SelectTrigger>
            <SelectContent>
              {drafts.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  <span className="font-medium">{d.subject || "(제목 없음)"}</span>
                  <span className="text-muted-foreground ml-2">— {d.snippet?.slice(0, 50)}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {selectedDraft && (
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-muted/50 px-4 py-3 border-b flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm">{selectedDraft.subject}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  To: {selectedDraft.to || "(없음)"}
                  {selectedDraft.cc && <> &middot; CC: {selectedDraft.cc}</>}
                </p>
              </div>
              <Badge variant="outline" className="text-primary border-primary/30">
                선택됨
              </Badge>
            </div>
            <div
              className="p-4 text-sm max-h-64 overflow-y-auto bg-white"
              dangerouslySetInnerHTML={{
                __html: replaceCidWithDataUri(
                  selectedDraft.htmlBody || selectedDraft.plainBody,
                  selectedDraft.inlineImages
                ),
              }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
