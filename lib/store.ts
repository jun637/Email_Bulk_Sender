"use client";

import { create } from "zustand";
import type { Draft, SheetInfo, SheetData, SendProgress } from "./types";

interface AppState {
  // Auth
  authenticated: boolean;
  userEmail: string;
  setAuth: (authenticated: boolean, email?: string) => void;

  // Drafts
  drafts: Draft[];
  selectedDraft: Draft | null;
  setDrafts: (drafts: Draft[]) => void;
  setSelectedDraft: (draft: Draft | null) => void;

  // Sheets
  spreadsheetUrl: string;
  spreadsheetId: string;
  sheetTabs: SheetInfo[];
  selectedSheet: string;
  sheetData: SheetData | null;
  setSpreadsheetUrl: (url: string) => void;
  setSpreadsheetId: (id: string) => void;
  setSheetTabs: (tabs: SheetInfo[]) => void;
  setSelectedSheet: (sheet: string) => void;
  setSheetData: (data: SheetData | null) => void;

  // Variable mapping
  emailColumn: string;
  mergeStatusColumn: string;
  variableMap: Record<string, string>;
  setEmailColumn: (col: string) => void;
  setMergeStatusColumn: (col: string) => void;
  setVariableMap: (map: Record<string, string>) => void;

  // Sender options
  fromName: string;
  cc: string;
  bcc: string;
  trackOpens: boolean;
  batchSize: number;
  emailDelay: number;
  setFromName: (name: string) => void;
  setCc: (cc: string) => void;
  setBcc: (bcc: string) => void;
  setTrackOpens: (track: boolean) => void;
  setBatchSize: (size: number) => void;
  setEmailDelay: (delay: number) => void;

  // Sending
  isSending: boolean;
  sendProgress: SendProgress | null;
  setIsSending: (sending: boolean) => void;
  setSendProgress: (progress: SendProgress | null) => void;

  // Reset
  reset: () => void;
}

export const useStore = create<AppState>((set) => ({
  // Auth
  authenticated: false,
  userEmail: "",
  setAuth: (authenticated, email) =>
    set({ authenticated, userEmail: email ?? "" }),

  // Drafts
  drafts: [],
  selectedDraft: null,
  setDrafts: (drafts) => set({ drafts }),
  setSelectedDraft: (selectedDraft) => set({ selectedDraft }),

  // Sheets
  spreadsheetUrl: "",
  spreadsheetId: "",
  sheetTabs: [],
  selectedSheet: "",
  sheetData: null,
  setSpreadsheetUrl: (spreadsheetUrl) => set({ spreadsheetUrl }),
  setSpreadsheetId: (spreadsheetId) => set({ spreadsheetId }),
  setSheetTabs: (sheetTabs) => set({ sheetTabs }),
  setSelectedSheet: (selectedSheet) => set({ selectedSheet }),
  setSheetData: (sheetData) => set({ sheetData }),

  // Variable mapping
  emailColumn: "",
  mergeStatusColumn: "",
  variableMap: {},
  setEmailColumn: (emailColumn) => set({ emailColumn }),
  setMergeStatusColumn: (mergeStatusColumn) => set({ mergeStatusColumn }),
  setVariableMap: (variableMap) => set({ variableMap }),

  // Sender options
  fromName: "",
  cc: "",
  bcc: "",
  trackOpens: true,
  batchSize: 50,
  emailDelay: 2,
  setFromName: (fromName) => set({ fromName }),
  setCc: (cc) => set({ cc }),
  setBcc: (bcc) => set({ bcc }),
  setTrackOpens: (trackOpens) => set({ trackOpens }),
  setBatchSize: (batchSize) => set({ batchSize }),
  setEmailDelay: (emailDelay) => set({ emailDelay }),

  // Sending
  isSending: false,
  sendProgress: null,
  setIsSending: (isSending) => set({ isSending }),
  setSendProgress: (sendProgress) => set({ sendProgress }),

  // Reset
  reset: () =>
    set({
      drafts: [],
      selectedDraft: null,
      spreadsheetUrl: "",
      spreadsheetId: "",
      sheetTabs: [],
      selectedSheet: "",
      sheetData: null,
      emailColumn: "",
      mergeStatusColumn: "",
      variableMap: {},
      fromName: "",
      cc: "",
      bcc: "",
      trackOpens: true,
      batchSize: 50,
      emailDelay: 2,
      isSending: false,
      sendProgress: null,
    }),
}));
