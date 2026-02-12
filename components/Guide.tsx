"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

export default function Guide() {
  const [open, setOpen] = useState(false);

  // ESC 키로 닫기
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  // 모달 열릴 때 스크롤 방지
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
          <path d="M12 17h.01"/>
        </svg>
        사용법
      </button>

      {open && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          {/* 배경 오버레이 */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* 모달 */}
          <div className="relative w-full h-full sm:w-[90%] sm:h-[90%] sm:max-w-4xl sm:rounded-2xl bg-white shadow-2xl overflow-y-auto">
            {/* 모달 헤더 */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b bg-white/95 backdrop-blur-sm sm:rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                    <path d="M12 17h.01"/>
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-foreground">사용 가이드</h2>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-9 h-9 rounded-lg hover:bg-muted flex items-center justify-center transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                  <path d="M18 6 6 18"/>
                  <path d="m6 6 12 12"/>
                </svg>
              </button>
            </div>

            {/* 모달 본문 */}
            <div className="px-6 py-6 space-y-8">
              {/* 개요 */}
              <section>
                <p className="text-muted-foreground leading-relaxed">
                  Gmail 임시보관함(Draft)에 작성한 이메일 템플릿과 Google Sheets의 수신자 목록을 연결하여 대량 이메일을 발송합니다.
                  발송 상태와 열람 여부가 자동으로 Sheets에 기록됩니다.
                </p>
              </section>

              {/* Step 1 */}
              <GuideStep
                step={1}
                title="Gmail 로그인"
                items={[
                  "우측 상단의 'Google 로그인' 버튼을 클릭합니다.",
                  "회사 Google Workspace 계정(@catalyze-research.com)으로 로그인합니다.",
                  "Gmail, Google Sheets 접근 권한을 허용합니다.",
                ]}
                tip="현재 설정상 @catalyze-research.com 계정만 로그인 가능합니다. 다른 형식의 계정으로 로그인 시도 시 권한 거부 오류가 발생합니다."
              />

              {/* Step 2 */}
              <GuideStep
                step={2}
                title="임시보관함에서 템플릿 선택"
                items={[
                  "로그인한 본인의 Gmail 계정에서 미리 이메일 템플릿을 작성하고 임시보관함에 저장합니다.",
                  "변수를 사용하려면 Gmail 템플릿 본문과 제목에 {{이름}}, {{회사}} 형식으로 입력합니다.",
                  "'임시보관함 불러오기' 버튼을 클릭하면 최근 50개의 Draft를 가져옵니다.",
                  "사용할 템플릿을 선택합니다.",
                ]}
                tip="메일 제목과 본문 서식은 여기서 수정할 수 없습니다. 사용자의 Gmail 템플릿에서 작성/수정해야 합니다."
              />

              {/* Step 3 */}
              <GuideStep
                step={3}
                title="Google Sheets 연결"
                items={[
                  "수신자 정보가 담긴 Google Sheets URL을 붙여넣습니다.",
                  "첫 번째 행은 반드시 헤더(컬럼명)여야 합니다.",
                  "시트 탭이 여러 개면 원하는 탭을 선택합니다.",
                  "데이터 미리보기에서 내용을 확인합니다.",
                ]}
                tip="발송 상태 및 열람 여부를 확인하기 위해 MERGE_STATUS라는 빈 컬럼을 미리 만들어주세요. "
              />

              {/* Step 4 */}
              <GuideStep
                step={4}
                title="변수 매핑"
                items={[
                  "이메일 주소가 들어있는 컬럼을 선택합니다.",
                  "MERGE_STATUS 컬럼을 선택합니다 (발송/열람 상태 기록용).",
                  "템플릿의 {{변수}}와 Sheets 컬럼을 매핑합니다.",
                ]}
                tip="변수를 활용해 수신자의 이름, 회사명, 본문 메세지의 내용 등을 자동으로 치환할 수 있습니다."
              />

              {/* Step 5 */}
              <GuideStep
                step={5}
                title="발신자 설정 & 옵션"
                items={[
                  "발신자 이름을 입력합니다 (수신자에게 표시되는 이름).",
                  "필요시 CC, BCC를 추가합니다.",
                  "열람 추적을 켜면 수신자가 이메일을 열었을 때 Sheets에 기록됩니다.",
                ]}
                tip="CC/BCC도 Gmail 일일 발송 한도에 포함됩니다. 예: 100명에게 CC 1명 추가후 전송 시 200명에게 전송한 것으로 카운트됩니다."
              />

              {/* Step 6 */}
              <GuideStep
                step={6}
                title="미리보기 & 발송"
                items={[
                  "미리보기에서 처음 3명의 이메일이 어떻게 보이는지 확인합니다.",
                  "변수가 올바르게 치환되었는지 확인합니다.",
                  "'발송 시작' 버튼을 클릭하면 1초에 1통씩 발송됩니다.",
                  "발송 진행률이 실시간으로 표시됩니다.",
                ]}
              />

              {/* 상태 설명 */}
              <section className="bg-muted/50 rounded-xl p-5 space-y-3">
                <h3 className="font-semibold text-foreground">MERGE_STATUS 상태값</h3>
                <div className="space-y-2">
                  <StatusBadge color="bg-gray-300" label="EMAIL_SENT" desc="이메일 발송 완료 (회색)" />
                  <StatusBadge color="bg-green-400" label="EMAIL_OPENED" desc="수신자가 이메일 열람 (연두색)" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  * 이미 EMAIL_SENT 또는 EMAIL_OPENED 상태인 행은 재발송 시 자동 스킵됩니다. 재발송하려면 해당 셀을 비워주세요.
                </p>
              </section>

              {/* 주의사항 */}
              <section className="bg-amber-50 border border-amber-200 rounded-xl p-5 space-y-2">
                <h3 className="font-semibold text-amber-900">주의사항</h3>
                <ul className="text-sm text-amber-800 space-y-1.5 list-disc list-inside">
                  <li>일일 발송 한도: Google Workspace 기준 2,000통/일</li>
                  <li>열람 추적은 100% 정확하지 않습니다 (일부 메일 클라이언트의 이미지 차단 등)</li>
                  <li>대량 발송 시 수신자 수에 따라 시간이 소요됩니다 (100명 약 2분)</li>
                </ul>
              </section>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

function GuideStep({
  step,
  title,
  items,
  tip,
}: {
  step: number;
  title: string;
  items: string[];
  tip?: string;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white text-sm font-bold shrink-0">
          {step}
        </span>
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
      </div>
      <ol className="ml-11 space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="text-sm text-muted-foreground leading-relaxed flex gap-2">
            <span className="text-muted-foreground/50 shrink-0">{i + 1}.</span>
            {item}
          </li>
        ))}
      </ol>
      {tip && (
        <div className="ml-11 flex items-start gap-2 text-xs text-primary bg-primary/5 rounded-lg px-3 py-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
            <path d="M12 20h9"/><path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z"/>
          </svg>
          <span>Tip: {tip}</span>
        </div>
      )}
    </section>
  );
}

function StatusBadge({ color, label, desc }: { color: string; label: string; desc: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className={`w-4 h-4 rounded ${color} shrink-0`} />
      <code className="text-sm font-mono font-medium text-foreground">{label}</code>
      <span className="text-sm text-muted-foreground">— {desc}</span>
    </div>
  );
}
