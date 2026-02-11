"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";

export default function Guide() {
  const [open, setOpen] = useState(false);

  return (
    <Card className="border-primary/20 bg-gradient-to-r from-primary/[0.03] to-transparent">
      <CardContent className="pt-6">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center justify-between w-full text-left group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                <circle cx="12" cy="12" r="10"/>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                <path d="M12 17h.01"/>
              </svg>
            </div>
            <div>
              <p className="font-semibold text-foreground">사용 가이드</p>
              <p className="text-xs text-muted-foreground">Gmail Draft + Google Sheets로 대량 이메일 발송</p>
            </div>
          </div>
          <svg
            width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className={`text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          >
            <path d="m6 9 6 6 6-6"/>
          </svg>
        </button>

        {open && (
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <StepCard
              step={1}
              title="Gmail 로그인"
              desc="Google 계정으로 로그인하여 Gmail과 Google Sheets 접근 권한을 부여합니다."
            />
            <StepCard
              step={2}
              title="임시보관함 선택"
              desc="Gmail Draft에서 이메일 템플릿을 선택합니다. {{변수명}} 형식으로 변수를 사용할 수 있습니다."
            />
            <StepCard
              step={3}
              title="Google Sheets 연결"
              desc="수신자 목록이 있는 Sheets URL을 입력합니다. 첫 번째 행은 헤더여야 합니다."
            />
            <StepCard
              step={4}
              title="변수 매핑 & 발송"
              desc="변수와 컬럼을 매핑하고, 미리보기 확인 후 발송합니다. 상태가 실시간 업데이트됩니다."
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StepCard({ step, title, desc }: { step: number; title: string; desc: string }) {
  return (
    <div className="flex gap-3 p-3 rounded-lg bg-background/80 border border-border/50">
      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs font-bold shrink-0 mt-0.5">
        {step}
      </span>
      <div>
        <p className="font-medium text-sm text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
