"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useStore } from "@/lib/store";

export default function AuthButton() {
  const { authenticated, userEmail, setAuth } = useStore();

  useEffect(() => {
    fetch("/api/auth/status")
      .then((res) => res.json())
      .then((data) => {
        setAuth(data.authenticated, data.email);
      })
      .catch(() => setAuth(false));
  }, [setAuth]);

  const handleLogin = () => {
    window.location.href = "/api/auth/login";
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setAuth(false);
    window.location.reload();
  };

  if (authenticated) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 bg-secondary rounded-full pl-3 pr-1 py-1">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-sm text-secondary-foreground">{userEmail}</span>
          <Button
            variant="ghost"
            size="xs"
            onClick={handleLogout}
            className="rounded-full text-muted-foreground hover:text-foreground"
          >
            로그아웃
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Button onClick={handleLogin} className="gap-2">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
        <polyline points="10 17 15 12 10 7"/>
        <line x1="15" x2="3" y1="12" y2="12"/>
      </svg>
      Gmail로 로그인
    </Button>
  );
}
