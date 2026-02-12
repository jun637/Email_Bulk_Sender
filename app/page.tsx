"use client";

import Guide from "@/components/Guide";
import AuthButton from "@/components/AuthButton";
import DraftSelector from "@/components/DraftSelector";
import SheetsInput from "@/components/SheetsInput";
import VariableMapper from "@/components/VariableMapper";
import SenderNameInput from "@/components/SenderNameInput";
import Preview from "@/components/Preview";
import SendingProgress from "@/components/SendingProgress";
import { useStore } from "@/lib/store";

export default function Home() {
  const { authenticated, selectedDraft, sheetData } = useStore();

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto flex items-center justify-between h-16 px-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="16" x="2" y="4" rx="2"/>
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
              </svg>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Gmail Bulk Sender
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Guide />
            <AuthButton />
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-5xl mx-auto py-8 px-6">
        {/* Step indicators */}
        {authenticated && (
          <div className="flex items-center gap-2 mb-8 text-sm overflow-x-auto pb-2">
            <StepIndicator step={1} label="Draft 선택" active done={!!selectedDraft} />
            <StepDivider />
            <StepIndicator step={2} label="Sheets 연결" active={!!selectedDraft} done={!!sheetData} />
            <StepDivider />
            <StepIndicator step={3} label="변수 매핑" active={!!sheetData} done={false} />
            <StepDivider />
            <StepIndicator step={4} label="미리보기 & 발송" active={!!sheetData} done={false} />
          </div>
        )}

        <div className="space-y-6">
          <DraftSelector />
          <SheetsInput />
          <VariableMapper />
          <SenderNameInput />
          <Preview />
          <SendingProgress />
        </div>

        {/* Footer */}
        <footer className="mt-16 pt-6 border-t text-center text-xs text-muted-foreground">
          Gmail Bulk Sender &mdash; YAMM Alternative for Internal Use
        </footer>
      </div>
    </main>
  );
}

function StepIndicator({ step, label, active, done }: { step: number; label: string; active: boolean; done: boolean }) {
  return (
    <div className={`flex items-center gap-2 shrink-0 ${active ? "text-foreground" : "text-muted-foreground/50"}`}>
      <span className={`
        inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold transition-colors
        ${done ? "bg-primary text-white" : active ? "border-2 border-primary text-primary" : "border-2 border-muted-foreground/30 text-muted-foreground/40"}
      `}>
        {done ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5"/>
          </svg>
        ) : step}
      </span>
      <span className="font-medium">{label}</span>
    </div>
  );
}

function StepDivider() {
  return <div className="w-8 h-px bg-border shrink-0" />;
}
