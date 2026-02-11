"use client";

import { useEffect, useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useStore } from "@/lib/store";
import { extractVariables } from "@/lib/template";

export default function VariableMapper() {
  const {
    selectedDraft,
    sheetData,
    emailColumn,
    mergeStatusColumn,
    variableMap,
    setEmailColumn,
    setMergeStatusColumn,
    setVariableMap,
  } = useStore();

  const templateVars = useMemo(() => {
    if (!selectedDraft) return [];
    const text =
      (selectedDraft.htmlBody || selectedDraft.plainBody) +
      " " +
      selectedDraft.subject;
    return extractVariables(text);
  }, [selectedDraft]);

  const headers = sheetData?.headers ?? [];

  // Auto-map variables that match header names exactly
  useEffect(() => {
    if (templateVars.length === 0 || headers.length === 0) return;
    const autoMap: Record<string, string> = {};
    for (const v of templateVars) {
      if (headers.includes(v)) {
        autoMap[v] = v;
      }
    }
    if (Object.keys(autoMap).length > 0) {
      setVariableMap({ ...autoMap, ...variableMap });
    }
  }, [templateVars, headers]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!selectedDraft || !sheetData || headers.length === 0) return null;

  const handleVarMapChange = (templateVar: string, column: string) => {
    setVariableMap({ ...variableMap, [templateVar]: column });
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
              <circle cx="18" cy="18" r="3"/>
              <circle cx="6" cy="6" r="3"/>
              <path d="M13 6h3a2 2 0 0 1 2 2v7"/>
              <path d="M11 18H8a2 2 0 0 1-2-2V9"/>
            </svg>
          </div>
          <div>
            <CardTitle className="text-lg">변수 매핑</CardTitle>
            <p className="text-sm text-muted-foreground mt-0.5">템플릿 변수와 시트 컬럼을 연결하세요</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Required columns */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1.5">
              이메일 컬럼
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0">필수</Badge>
            </Label>
            <Select onValueChange={setEmailColumn} value={emailColumn}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="이메일이 있는 컬럼" />
              </SelectTrigger>
              <SelectContent>
                {headers.map((h) => (
                  <SelectItem key={h} value={h}>
                    {h}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1.5">
              MERGE_STATUS 컬럼
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0">필수</Badge>
            </Label>
            <Select onValueChange={setMergeStatusColumn} value={mergeStatusColumn}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="상태 기록할 컬럼" />
              </SelectTrigger>
              <SelectContent>
                {headers.map((h) => (
                  <SelectItem key={h} value={h}>
                    {h}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Template variables */}
        {templateVars.length > 0 && (
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              템플릿 변수 매핑
              <Badge variant="outline" className="text-primary border-primary/30">
                {templateVars.length}개
              </Badge>
            </Label>
            <div className="space-y-2">
              {templateVars.map((v) => (
                <div
                  key={v}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border/50"
                >
                  <code className="text-sm font-mono bg-primary/10 text-primary px-2.5 py-1 rounded-md min-w-[120px] text-center">
                    {`{{${v}}}`}
                  </code>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground shrink-0">
                    <path d="M5 12h14"/>
                    <path d="m12 5 7 7-7 7"/>
                  </svg>
                  <Select
                    onValueChange={(col) => handleVarMapChange(v, col)}
                    value={variableMap[v] ?? ""}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="컬럼 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {headers.map((h) => (
                        <SelectItem key={h} value={h}>
                          {h}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>
        )}

        {templateVars.length === 0 && (
          <div className="text-center py-4 text-sm text-muted-foreground rounded-lg bg-muted/30 border border-dashed">
            템플릿에 {"{{변수}}"} 형식의 변수가 없습니다
          </div>
        )}
      </CardContent>
    </Card>
  );
}
