"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useStore } from "@/lib/store";
import { replaceVariables, extractVariables, replaceCidWithDataUri } from "@/lib/template";

export default function Preview() {
  const { selectedDraft, sheetData, emailColumn, variableMap } = useStore();

  const previews = useMemo(() => {
    if (!selectedDraft || !sheetData || !emailColumn) return [];
    const headers = sheetData.headers;
    const emailIdx = headers.indexOf(emailColumn);
    if (emailIdx === -1) return [];

    const templateHtml =
      selectedDraft.htmlBody || selectedDraft.plainBody;
    const templateSubject = selectedDraft.subject;
    const templateVars = extractVariables(templateHtml + " " + templateSubject);

    return sheetData.rows.slice(0, 3).map((row) => {
      const values: Record<string, string> = {};
      for (const [templateVar, colHeader] of Object.entries(variableMap)) {
        const colIdx = headers.indexOf(colHeader);
        if (colIdx !== -1) values[templateVar] = row[colIdx] ?? "";
      }
      for (const v of templateVars) {
        if (!(v in values)) {
          const colIdx = headers.indexOf(v);
          if (colIdx !== -1) values[v] = row[colIdx] ?? "";
        }
      }

      return {
        email: row[emailIdx],
        subject: replaceVariables(templateSubject, values),
        body: replaceCidWithDataUri(
          replaceVariables(templateHtml, values),
          selectedDraft.inlineImages
        ),
      };
    });
  }, [selectedDraft, sheetData, emailColumn, variableMap]);

  if (previews.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </div>
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">미리보기</CardTitle>
            <Badge variant="secondary">처음 {previews.length}명</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {previews.map((p, i) => (
          <div key={i} className="border rounded-lg overflow-hidden">
            <div className="bg-muted/50 px-4 py-2.5 border-b flex items-center gap-3">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs font-bold">
                {i + 1}
              </span>
              <div>
                <span className="text-sm font-medium">{p.email}</span>
                <span className="text-xs text-muted-foreground ml-3">제목: {p.subject}</span>
              </div>
            </div>
            <div
              className="p-4 text-sm max-h-40 overflow-y-auto bg-white"
              dangerouslySetInnerHTML={{ __html: p.body }}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
