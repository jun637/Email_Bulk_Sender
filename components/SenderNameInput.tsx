"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useStore } from "@/lib/store";

export default function SenderNameInput() {
  const {
    selectedDraft,
    sheetData,
    fromName,
    cc,
    bcc,
    trackOpens,
    batchSize,
    emailDelay,
    setFromName,
    setCc,
    setBcc,
    setTrackOpens,
    setBatchSize,
    setEmailDelay,
  } = useStore();

  if (!selectedDraft || !sheetData) return null;

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </div>
          <div>
            <CardTitle className="text-lg">발송 설정</CardTitle>
            <p className="text-sm text-muted-foreground mt-0.5">보내는 사람 정보와 추적 옵션을 설정하세요</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="from-name" className="text-sm font-medium">보내는 사람 이름</Label>
            <Input
              id="from-name"
              placeholder="예: 홍길동"
              value={fromName}
              onChange={(e) => setFromName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cc" className="text-sm font-medium">CC</Label>
            <Input
              id="cc"
              placeholder="cc@example.com"
              value={cc}
              onChange={(e) => setCc(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bcc" className="text-sm font-medium">BCC</Label>
            <Input
              id="bcc"
              placeholder="bcc@example.com"
              value={bcc}
              onChange={(e) => setBcc(e.target.value)}
            />
          </div>
        </div>

        <Separator />

        <div>
          <p className="text-sm font-medium mb-3">발송 속도 제한</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="batch-size" className="text-sm text-muted-foreground">배치 크기 (통)</Label>
              <Input
                id="batch-size"
                type="number"
                min={10}
                max={500}
                value={batchSize}
                onChange={(e) => setBatchSize(Math.max(10, Math.min(500, Number(e.target.value) || 50)))}
              />
              <p className="text-xs text-muted-foreground">한 배치당 발송 수. 배치 사이 30초 대기.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email-delay" className="text-sm text-muted-foreground">이메일 간격 (초)</Label>
              <Input
                id="email-delay"
                type="number"
                min={1}
                max={10}
                value={emailDelay}
                onChange={(e) => setEmailDelay(Math.max(1, Math.min(10, Number(e.target.value) || 2)))}
              />
              <p className="text-xs text-muted-foreground">각 이메일 사이 대기 시간</p>
            </div>
          </div>
        </div>

        <Separator />

        <label
          htmlFor="track-opens"
          className="flex items-center gap-3 p-3 rounded-lg border border-border/50 cursor-pointer hover:bg-muted/30 transition-colors"
        >
          <input
            type="checkbox"
            id="track-opens"
            checked={trackOpens}
            onChange={(e) => setTrackOpens(e.target.checked)}
            className="rounded accent-primary w-4 h-4"
          />
          <div>
            <p className="text-sm font-medium">이메일 열람 추적</p>
            <p className="text-xs text-muted-foreground">
              추적 픽셀을 삽입하여 수신자가 이메일을 열면 시트에 EMAIL_OPENED로 업데이트됩니다
            </p>
          </div>
        </label>
      </CardContent>
    </Card>
  );
}
