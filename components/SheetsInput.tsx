"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useStore } from "@/lib/store";

export default function SheetsInput() {
  const {
    authenticated,
    selectedDraft,
    spreadsheetUrl,
    spreadsheetId,
    sheetTabs,
    selectedSheet,
    sheetData,
    setSpreadsheetUrl,
    setSpreadsheetId,
    setSheetTabs,
    setSelectedSheet,
    setSheetData,
  } = useStore();

  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [error, setError] = useState("");

  const loadSheets = async () => {
    if (!spreadsheetUrl.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/sheets/list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: spreadsheetUrl }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to load sheets");
      }
      const data = await res.json();
      setSpreadsheetId(data.spreadsheetId);
      setSheetTabs(data.sheets);
      setSelectedSheet("");
      setSheetData(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load sheets");
    } finally {
      setLoading(false);
    }
  };

  const loadSheetData = async (sheetTitle: string) => {
    setSelectedSheet(sheetTitle);
    setDataLoading(true);
    setError("");
    try {
      const res = await fetch("/api/sheets/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spreadsheetId, sheetTitle }),
      });
      if (!res.ok) throw new Error("Failed to load sheet data");
      const data = await res.json();
      setSheetData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setDataLoading(false);
    }
  };

  if (!authenticated || !selectedDraft) return null;

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
              <line x1="3" x2="21" y1="9" y2="9"/>
              <line x1="3" x2="21" y1="15" y2="15"/>
              <line x1="9" x2="9" y1="3" y2="21"/>
            </svg>
          </div>
          <div>
            <CardTitle className="text-lg">Google Sheets 연결</CardTitle>
            <p className="text-sm text-muted-foreground mt-0.5">수신자 목록이 포함된 스프레드시트를 연결하세요</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="sheets-url" className="text-sm font-medium">Google Sheets URL</Label>
          <div className="flex gap-2">
            <Input
              id="sheets-url"
              placeholder="https://docs.google.com/spreadsheets/d/..."
              value={spreadsheetUrl}
              onChange={(e) => setSpreadsheetUrl(e.target.value)}
              className="flex-1"
            />
            <Button onClick={loadSheets} disabled={loading} className="gap-2 shrink-0">
              {loading ? (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                </svg>
              )}
              연결
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {sheetTabs.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">시트 탭 선택</Label>
            <Select onValueChange={loadSheetData} value={selectedSheet}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="시트를 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {sheetTabs.map((tab) => (
                  <SelectItem key={tab.sheetId} value={tab.title}>
                    {tab.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {dataLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-4 justify-center">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            데이터 불러오는 중...
          </div>
        )}

        {sheetData && sheetData.headers.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">데이터 미리보기</Label>
              <Badge variant="secondary">{sheetData.rows.length}행</Badge>
            </div>
            <div className="border rounded-lg overflow-auto max-h-64">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    {sheetData.headers.map((h, i) => (
                      <TableHead key={i} className="whitespace-nowrap text-xs font-semibold">
                        {h}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sheetData.rows.slice(0, 5).map((row, ri) => (
                    <TableRow key={ri}>
                      {row.map((cell, ci) => (
                        <TableCell key={ci} className="whitespace-nowrap text-sm">
                          {cell}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {sheetData.rows.length > 5 && (
              <p className="text-xs text-muted-foreground text-center">
                외 {sheetData.rows.length - 5}개 행 더 있음
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
