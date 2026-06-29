"use client";

import { useState, useEffect, useRef, useCallback, type ChangeEvent } from "react";

type XLSXLib = {
  version: string;
  read: (data: ArrayBuffer, opts: object) => { SheetNames: string[]; Sheets: Record<string, object> };
  utils: { sheet_to_json: (ws: object, opts: object) => unknown[][] };
};

type SheetData = { name: string; rows: number; cols: number; aoa: unknown[][] };
type Figure = { label: string; value: number; coord: string; kind: "num" | "pct" };
type Holding = { name: string; value: number };
type Analysis = {
  code: string;
  titleAr: string;
  titleEn: string;
  bank: string | null;
  period: string | null;
  consolidated: boolean;
  currency: string | null;
  isNil: boolean;
  kpis: Figure[];
  ratios: Figure[];
  holdings: { total: number; count: number; items: Holding[]; header: string } | null;
  figures: Figure[];
};
type ParsedFile = { fileName: string; sizeKB: number; totalRows: number; sheets: SheetData[]; analysis: Analysis };

const XLSX_SRC = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
const MAX_PREVIEW_ROWS = 200;
const MAX_PREVIEW_COLS = 40;

const FORMS: Record<string, string> = {
  AST01: "FX Assets & Liabilities \u2014 Sources of Funds",
  AST02: "FX Sources of Funds \u2014 Ratios",
  AST03: "Money-Market Placements \u2014 Investment-Grade Countries",
  AST04: "Money-Market Placements \u2014 Sub-Investment-Grade Countries",
  AST05: "Capital-Market Instrument Investments",
  AST06: "Derivatives \u2014 Notional / Rate & FX Volatility",
  AST07: "Derivatives \u2014 Realized & Potential P&L",
  AST08: "Direct FX Credit Facilities (Domestic)",
  AST09: "Aggregate Open FX Position (JOD)",
  AST10: "Open FX Position by Currency",
  HDP: "Largest 20 Private-Sector Depositors",
  INV0102: "FVTPL Financial Assets \u2014 T-Bills & Bonds",
  INV0103: "FVTPL Financial Assets \u2014 Funds & Other",
  INV01010: "Financial Assets Held for Trading \u2014 Equities",
  INV02010: "FVOCI Financial Assets \u2014 Equities",
  INV03: "Amortized-Cost Financial Assets",
  INV04: "Investments in Subsidiaries & Associates",
};

const BANKS: Record<string, string> = { HBTF: "Housing Bank for Trade & Finance" };
const MONTHS = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const META = ["\u0646\u0648\u0639 \u0627\u0644\u0628\u064a\u0627\u0646\u0627\u062a", "\u0639\u062f\u062f \u0627\u0644\u062e\u0627\u0646\u0627\u062a \u0627\u0644\u0645\u0633\u0645\u0648\u062d \u0628\u0625\u062f\u062e\u0627\u0644\u0647\u0627", "\u0623\u0631\u0642\u0627\u0645", "\u062a\u0627\u0631\u064a\u062e", "\u062d\u0631\u0648\u0641 \u0648\u0623\u0631\u0642\u0627\u0645", "\u0627\u0644\u0645\u0628\u0644\u063a", "\u0631\u0645\u0632 \u0627\u0644\u0639\u0645\u0644\u0629", "\u0627\u0644\u0641\u0631\u0639", "\u0627\u0644\u062a\u0627\u0631\u064a\u062e", "\u0637\u0648\u064a\u0644", "\u0642\u0635\u064a\u0631"];
// book-value column keywords (fair value / recorded value)
const BOOK_KW = ["\u0627\u0644\u0642\u064a\u0645\u0629 \u0627\u0644\u0645\u062b\u0628\u062a\u0629", "\u0627\u0644\u0642\u064a\u0645\u0629 \u0627\u0644\u0639\u0627\u062f\u0644\u0629", "\u0635\u0627\u0641\u064a \u0627\u0644\u0642\u064a\u0645\u0629", "\u0627\u0644\u0642\u064a\u0645\u0629 \u0627\u0644\u0645\u0639\u0627\u062f\u0644\u0629", "\u0627\u0644\u0645\u064f\u062b\u0628\u062a\u0629"];
// tight "total / headline" phrases
const HERO_KW = ["\u0627\u0644\u0645\u062c\u0645\u0648\u0639 \u0627\u0644\u0643\u0644\u064a", "\u062d\u0642\u0648\u0642 \u0627\u0644\u0645\u0633\u0627\u0647\u0645\u064a\u0646", "\u0635\u0627\u0641\u064a \u0645\u0635\u0627\u062f\u0631", "\u0635\u0627\u0641\u0649 \u0645\u0635\u0627\u062f\u0631", "\u0627\u0644\u0645\u0631\u0643\u0632 \u0627\u0644\u0645\u0641\u062a\u0648\u062d \u0627\u0644\u0627\u062c\u0645\u0627\u0644\u064a"];
const PCT_KW = "\u0646\u0633\u0628\u0629"; // "ratio"

function getXLSX(): XLSXLib | undefined {
  return (window as unknown as { XLSX?: XLSXLib }).XLSX;
}

function loadXLSX(): Promise<XLSXLib> {
  return new Promise((resolve, reject) => {
    const ready = getXLSX();
    if (ready) { resolve(ready); return; }
    const existing = document.querySelector("script[data-xlsx-engine='1']") as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => { const x = getXLSX(); if (x) resolve(x); else reject(new Error("The spreadsheet engine did not initialize.")); });
      existing.addEventListener("error", () => reject(new Error("Could not load the spreadsheet engine.")));
      return;
    }
    const s = document.createElement("script");
    s.src = XLSX_SRC;
    s.setAttribute("data-xlsx-engine", "1");
    s.onload = () => { const x = getXLSX(); if (x) resolve(x); else reject(new Error("The spreadsheet engine did not initialize.")); };
    s.onerror = () => reject(new Error("Could not load the spreadsheet engine."));
    document.head.appendChild(s);
  });
}

function colLabel(n: number): string {
  let s = "";
  let x = n;
  while (x >= 0) { s = String.fromCharCode(65 + (x % 26)) + s; x = Math.floor(x / 26) - 1; }
  return s;
}

function isArabic(v: unknown): boolean {
  if (typeof v !== "string") return false;
  for (let i = 0; i < v.length; i++) { const c = v.charCodeAt(i); if (c >= 0x0600 && c <= 0x06ff) return true; }
  return false;
}

function cleanWs(v: unknown): string {
  return String(v).replace(/\s+/g, " ").trim();
}

function toNum(v: unknown): number | null {
  if (typeof v === "boolean") return null;
  if (typeof v === "number" && isFinite(v)) return v;
  return null;
}

function goodLabel(v: unknown): boolean {
  if (!isArabic(v)) return false;
  const s = cleanWs(v);
  if (s.length <= 3) return false;
  if (META.indexOf(s) >= 0) return false;
  if (/^[\d.,%()\-\/\s]+$/.test(s)) return false;
  return true;
}

function cell(aoa: unknown[][], r: number, c: number): unknown {
  const row = aoa[r];
  if (!row) return null;
  return row[c];
}

function rowLabel(aoa: unknown[][], r: number, c: number): string | null {
  let best: string | null = null;
  let bc = -1;
  for (let cc = 0; cc < c; cc++) {
    const v = cell(aoa, r, cc);
    if (goodLabel(v) && cc > bc) { best = cleanWs(v); bc = cc; }
  }
  return best;
}

function colLabelAbove(aoa: unknown[][], r: number, c: number): string | null {
  const lo = Math.max(0, r - 10);
  for (let rr = r - 1; rr >= lo; rr--) {
    const v = cell(aoa, rr, c);
    if (goodLabel(v)) return cleanWs(v);
  }
  return null;
}

function meaningfulSheet(name: string): boolean {
  if (name === "CRYSTAL_PERSIST") return false;
  if (/quee?ry from business/i.test(name)) return false;
  return true;
}

function heroLabel(l: string): boolean {
  for (let i = 0; i < HERO_KW.length; i++) if (l.indexOf(HERO_KW[i]) >= 0) return true;
  return false;
}

function extractFigures(aoa: unknown[][]): Figure[] {
  const out: Figure[] = [];
  const seen: Record<string, boolean> = {};
  for (let r = 0; r < aoa.length; r++) {
    const row = aoa[r] || [];
    for (let c = 0; c < row.length; c++) {
      const n = toNum(row[c]);
      if (n === null || n === 0) continue;
      const lab = rowLabel(aoa, r, c) || colLabelAbove(aoa, r, c);
      if (!lab) continue;
      const isRatio = lab.indexOf(PCT_KW) >= 0 && Math.abs(n) < 2;
      if (!isRatio && Math.abs(n) < 1000) continue;
      const key = lab + "|" + Math.round(n * 100);
      if (seen[key]) continue;
      seen[key] = true;
      out.push({ label: lab, value: n, coord: colLabel(c) + (r + 1), kind: isRatio ? "pct" : "num" });
    }
  }
  return out;
}

function detectHoldings(aoa: unknown[][]): { total: number; count: number; items: Holding[]; header: string } | null {
  let hr = -1, hc = -1, header = "";
  for (let r = 0; r < Math.min(14, aoa.length) && hr < 0; r++) {
    const row = aoa[r] || [];
    for (let c = 0; c < row.length; c++) {
      const v = row[c];
      if (isArabic(v)) {
        const s = cleanWs(v);
        for (let k = 0; k < BOOK_KW.length; k++) {
          if (s.indexOf(BOOK_KW[k]) >= 0) { hr = r; hc = c; header = s; break; }
        }
      }
      if (hr >= 0) break;
    }
  }
  if (hr < 0) return null;
  const items: Holding[] = [];
  let total = 0;
  for (let r = hr + 1; r < aoa.length; r++) {
    const n = toNum(cell(aoa, r, hc));
    if (n === null || Math.abs(n) < 1000) continue;
    const row = aoa[r] || [];
    let name = "";
    for (let c = 0; c < row.length; c++) { if (isArabic(row[c]) && cleanWs(row[c]).length > 3) { name = cleanWs(row[c]); break; } }
    items.push({ name: name, value: n });
    total += n;
  }
  if (items.length === 0) return null;
  items.sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
  return { total: total, count: items.length, items: items, header: header };
}

function parseIdentity(fileName: string): { code: string; bank: string | null; period: string | null; consolidated: boolean; currency: string | null } {
  const base = fileName.replace(/\.[^.]+$/, "");
  const up = base.toUpperCase();
  const m = up.match(/^([A-Z]+[0-9]+)/);
  const code = m ? m[1] : base.split(/[_\s.]/)[0].toUpperCase();
  let bank: string | null = null;
  Object.keys(BANKS).forEach((k) => { if (up.indexOf(k) >= 0) bank = BANKS[k] + " (" + k + ")"; });
  const pm = base.match(/(\d{2})-(\d{4})/);
  let period: string | null = null;
  if (pm) { const mo = parseInt(pm[1], 10); period = (MONTHS[mo] || pm[1]) + " " + pm[2]; }
  const consolidated = /_C(\b|_|$)/.test(base) || /_C$/.test(base);
  let currency: string | null = null;
  const cm: Record<string, string> = { DOLLER: "USD", DOLLAR: "USD", EURO: "EUR", GBP: "GBP", POUND: "GBP", YEN: "JPY", FRNK: "CHF", FRANC: "CHF", ELSE: "Other" };
  Object.keys(cm).forEach((k) => { if (up.indexOf(k) >= 0) currency = cm[k]; });
  return { code: code, bank: bank, period: period, consolidated: consolidated, currency: currency };
}

function analyze(sheets: SheetData[], fileName: string): Analysis {
  const id = parseIdentity(fileName);
  const meaningful = sheets.filter((s) => meaningfulSheet(s.name));
  let titleAr = "";
  for (let i = 0; i < meaningful.length && !titleAr; i++) {
    const row0 = meaningful[i].aoa[0] || [];
    for (let c = 0; c < row0.length; c++) { if (isArabic(row0[c])) { titleAr = cleanWs(row0[c]); break; } }
  }
  let figures: Figure[] = [];
  meaningful.forEach((s) => { figures = figures.concat(extractFigures(s.aoa)); });
  // global dedupe by label+value
  const seen: Record<string, boolean> = {};
  figures = figures.filter((f) => { const k = f.label + "|" + Math.round(f.value * 100); if (seen[k]) return false; seen[k] = true; return true; });
  const money = figures.filter((f) => f.kind === "num" && Math.abs(f.value) >= 1000);
  const isNil = money.length === 0;
  let holdings: Analysis["holdings"] = null;
  for (let i = 0; i < meaningful.length && !holdings; i++) holdings = detectHoldings(meaningful[i].aoa);
  let kpis = figures.filter((f) => f.kind === "num" && heroLabel(f.label) && Math.abs(f.value) >= 1000);
  // dedupe kpis by label (keep first)
  const ks: Record<string, boolean> = {};
  kpis = kpis.filter((f) => { if (ks[f.label]) return false; ks[f.label] = true; return true; }).slice(0, 4);
  const ratios = figures.filter((f) => f.kind === "pct").slice(0, 6);
  return {
    code: id.code,
    titleAr: titleAr,
    titleEn: FORMS[id.code] || "CBJ Regulatory Return",
    bank: id.bank,
    period: id.period,
    consolidated: id.consolidated,
    currency: id.currency,
    isNil: isNil,
    kpis: kpis,
    ratios: ratios,
    holdings: holdings,
    figures: money,
  };
}

function fmtFull(v: number): string {
  const neg = v < 0;
  const s = Math.round(Math.abs(v)).toLocaleString("en-US");
  return (neg ? "-" : "") + s;
}

function fmtCompact(v: number): string {
  const a = Math.abs(v);
  const neg = v < 0 ? "-" : "";
  if (a >= 1e9) return neg + (a / 1e9).toFixed(2) + "B";
  if (a >= 1e6) return neg + (a / 1e6).toFixed(1) + "M";
  if (a >= 1e3) return neg + (a / 1e3).toFixed(0) + "K";
  return neg + a.toFixed(0);
}

function fmtCell(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (v instanceof Date) return v.toLocaleDateString();
  return String(v);
}

export default function UploadPage() {
  const [dark, setDark] = useState(false);
  const [parsed, setParsed] = useState<ParsedFile | null>(null);
  const [activeSheet, setActiveSheet] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [showRaw, setShowRaw] = useState(false);
  const [showAllFigs, setShowAllFigs] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    try { const t = localStorage.getItem("theme") || localStorage.getItem("hbtf-theme"); setDark(t === "dark"); } catch { /* noop */ }
    loadXLSX().catch(() => {});
  }, []);

  const handleFile = useCallback(async (file: File) => {
    setError(null); setParsed(null); setActiveSheet(0); setShowRaw(false); setShowAllFigs(false); setBusy(true);
    try {
      if (!/\.(xlsx|xls)$/i.test(file.name)) throw new Error("That file is not a spreadsheet. Please upload an .xlsx or .xls file.");
      const XLSX = await loadXLSX();
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array", cellDates: true });
      let total = 0;
      const sheets: SheetData[] = wb.SheetNames.map((nm) => {
        const ws = wb.Sheets[nm];
        const aoa = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null, blankrows: false });
        let cols = 0;
        for (let i = 0; i < aoa.length; i++) { const r = aoa[i]; if (r && r.length > cols) cols = r.length; }
        total += aoa.length;
        return { name: nm, rows: aoa.length, cols: cols, aoa: aoa };
      });
      const analysis = analyze(sheets, file.name);
      setParsed({ fileName: file.name, sizeKB: Math.max(1, Math.round(file.size / 1024)), totalRows: total, sheets: sheets, analysis: analysis });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }, []);

  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files && e.target.files[0];
    if (f) handleFile(f);
    if (inputRef.current) inputRef.current.value = "";
  };

  const reset = () => { setParsed(null); setError(null); setActiveSheet(0); };

  const c = dark
    ? { bg: "#0f1115", surface: "#16191f", surfaceAlt: "#1b1f27", border: "#262b34", borderSoft: "#1f242c", text: "#f1f5f9", sub: "#94a3b8", faint: "#64748b", primary: "#3b82f6", primaryText: "#ffffff", primarySoft: "rgba(59,130,246,0.14)", thBg: "#1f2430", rowAlt: "#191d24", dropBg: "#14171d", dropBorder: "#2c333f", good: "#34d399", goodSoft: "rgba(16,185,129,0.15)", warn: "#fbbf24", warnSoft: "rgba(251,191,36,0.13)" }
    : { bg: "#f2f4f7", surface: "#ffffff", surfaceAlt: "#f8fafc", border: "#e2e8f0", borderSoft: "#eef2f6", text: "#0f172a", sub: "#64748b", faint: "#94a3b8", primary: "#0a4a8f", primaryText: "#ffffff", primarySoft: "rgba(10,74,143,0.07)", thBg: "#f1f5f9", rowAlt: "#f8fafc", dropBg: "#ffffff", dropBorder: "#cbd5e1", good: "#059669", goodSoft: "#ecfdf5", warn: "#b45309", warnSoft: "#fffbeb" };

  const a = parsed ? parsed.analysis : null;
  const sheet = parsed ? parsed.sheets[activeSheet] : null;
  const previewRows = sheet ? sheet.aoa.slice(0, MAX_PREVIEW_ROWS) : [];
  const previewCols = sheet ? Math.min(sheet.cols, MAX_PREVIEW_COLS) : 0;
  const colIdxs: number[] = [];
  for (let i = 0; i < previewCols; i++) colIdxs.push(i);
  const figsToShow = a ? (showAllFigs ? a.figures : a.figures.slice(0, 12)) : [];
  const hold = a ? a.holdings : null;
  const topHoldings = hold ? hold.items.slice(0, 8) : [];

  return (
    <div style={{ minHeight: "100vh", background: c.bg, color: c.text, fontFamily: "Inter, system-ui, -apple-system, sans-serif" }}>
      <div style={{ position: "sticky", top: 0, zIndex: 10, background: c.surface, borderBottom: "1px solid " + c.border, padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "40px", height: "40px", borderRadius: "11px", background: "#0a4a8f", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "15px", letterSpacing: "0.3px" }}>cf</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "16px", lineHeight: "1.1" }}>convo.finance</div>
            <div style={{ fontSize: "12px", color: c.sub, marginTop: "2px" }}>Jordanian Banking Intelligence</div>
          </div>
        </div>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: "7px", textDecoration: "none", color: c.sub, fontSize: "13px", fontWeight: 600, padding: "8px 14px", borderRadius: "9px", border: "1px solid " + c.border }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5" /><path d="M12 19l-7-7 7-7" /></svg>
          Dashboard
        </a>
      </div>

      <div style={{ maxWidth: "1080px", margin: "0 auto", padding: "32px 24px 64px" }}>
        <div style={{ marginBottom: "24px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "7px", fontSize: "12px", fontWeight: 600, color: c.primary, background: c.primarySoft, padding: "5px 11px", borderRadius: "999px", marginBottom: "14px" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "999px", background: c.primary, display: "inline-block" }} />
            CBJ Regulatory Reporting
          </div>
          <h1 style={{ fontSize: "26px", fontWeight: 700, margin: "0 0 8px" }}>Report Upload</h1>
          <p style={{ fontSize: "15px", color: c.sub, margin: 0, maxWidth: "680px", lineHeight: "1.5" }}>
            Upload a CBJ regulatory return in Excel format. convo.finance identifies the form, extracts the reportable figures, and builds a dashboard on the spot.
          </p>
        </div>

        {error && (
          <div style={{ background: dark ? "rgba(220,38,38,0.12)" : "#fef2f2", border: "1px solid " + (dark ? "rgba(220,38,38,0.4)" : "#fecaca"), color: dark ? "#fca5a5" : "#b91c1c", padding: "14px 16px", borderRadius: "12px", fontSize: "14px", marginBottom: "20px", display: "flex", gap: "10px", alignItems: "flex-start" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: "1px" }}><circle cx="12" cy="12" r="10" /><path d="M12 8v4" /><path d="M12 16h.01" /></svg>
            <span>{error}</span>
          </div>
        )}

        {!parsed && (
          <div
            onClick={() => inputRef.current && inputRef.current.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files && e.dataTransfer.files[0]; if (f) handleFile(f); }}
            style={{ border: "2px dashed " + (dragOver ? c.primary : c.dropBorder), background: dragOver ? c.primarySoft : c.dropBg, borderRadius: "16px", padding: "52px 24px", textAlign: "center", cursor: "pointer", transition: "border-color 0.15s, background 0.15s" }}
          >
            <div style={{ width: "56px", height: "56px", borderRadius: "14px", background: c.primarySoft, color: c.primary, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M17 8l-5-5-5 5" /><path d="M12 3v12" /></svg>
            </div>
            <div style={{ fontSize: "16px", fontWeight: 600, marginBottom: "6px" }}>{busy ? "Reading your file..." : "Drop a CBJ report here, or click to browse"}</div>
            <div style={{ fontSize: "13px", color: c.sub }}>Supports .xlsx and .xls files</div>
            <input ref={inputRef} type="file" accept=".xlsx,.xls" onChange={onInputChange} style={{ display: "none" }} />
          </div>
        )}

        {parsed && a && (
          <div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center", justifyContent: "space-between", background: c.surface, border: "1px solid " + c.border, borderRadius: "14px", padding: "16px 18px", marginBottom: "18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "13px", minWidth: 0 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minWidth: "62px", padding: "8px 10px", borderRadius: "10px", background: c.primarySoft, color: c.primary, flexShrink: 0 }}>
                  <span style={{ fontSize: "15px", fontWeight: 700, letterSpacing: "0.3px" }}>{a.code}</span>
                  {a.currency && <span style={{ fontSize: "10px", fontWeight: 600, marginTop: "2px" }}>{a.currency}</span>}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: "15px", fontWeight: 600 }}>{a.titleEn}{a.consolidated ? " (Consolidated)" : ""}</div>
                  {a.titleAr && <div dir="rtl" style={{ fontSize: "13px", color: c.sub, marginTop: "3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "520px" }}>{a.titleAr}</div>}
                  <div style={{ fontSize: "12px", color: c.faint, marginTop: "5px" }}>
                    {(a.bank || "Bank \u2014") + "  \u00b7  " + (a.period || "Period \u2014") + "  \u00b7  " + parsed.fileName}
                  </div>
                </div>
              </div>
              <button onClick={reset} style={{ background: c.primary, color: c.primaryText, border: "none", borderRadius: "9px", padding: "10px 16px", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}>Upload another</button>
            </div>

            {a.isNil && (
              <div style={{ background: c.warnSoft, border: "1px solid " + (dark ? "rgba(251,191,36,0.4)" : "#fde68a"), borderRadius: "14px", padding: "20px 22px", marginBottom: "18px", display: "flex", gap: "13px", alignItems: "flex-start" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c.warn} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: "1px" }}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><path d="M12 9v4" /><path d="M12 17h.01" /></svg>
                <div>
                  <div style={{ fontSize: "15px", fontWeight: 600, color: c.text }}>Nil return for {a.period || "this period"}</div>
                  <div style={{ fontSize: "13px", color: c.sub, marginTop: "4px", lineHeight: "1.5" }}>The form parsed and validated successfully, but no entries were reported on it. This is a recognised nil submission \u2014 no figures are shown rather than placeholder zeros.</div>
                </div>
              </div>
            )}

            {a.kpis.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px", marginBottom: "18px" }}>
                {a.kpis.map((k, i) => (
                  <div key={i} style={{ background: c.surface, border: "1px solid " + c.border, borderRadius: "14px", padding: "18px" }}>
                    <div style={{ fontSize: "26px", fontWeight: 700, letterSpacing: "-0.5px", fontVariantNumeric: "tabular-nums" }}>
                      <span style={{ fontSize: "14px", fontWeight: 600, color: c.faint, marginRight: "5px" }}>JOD</span>{fmtCompact(k.value)}
                    </div>
                    <div style={{ fontSize: "12px", color: c.faint, marginTop: "2px", fontVariantNumeric: "tabular-nums" }}>JOD {fmtFull(k.value)}</div>
                    <div dir="rtl" style={{ fontSize: "13px", color: c.sub, marginTop: "9px", lineHeight: "1.45" }}>{k.label}</div>
                  </div>
                ))}
              </div>
            )}

            {a.ratios.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "18px" }}>
                {a.ratios.map((rr, i) => (
                  <div key={i} style={{ background: c.surface, border: "1px solid " + c.border, borderRadius: "12px", padding: "12px 15px", display: "flex", alignItems: "center", gap: "12px", maxWidth: "100%" }}>
                    <div style={{ fontSize: "20px", fontWeight: 700, color: c.primary, fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>{(rr.value * 100).toFixed(1)}%</div>
                    <div dir="rtl" style={{ fontSize: "12px", color: c.sub, lineHeight: "1.4" }}>{rr.label}</div>
                  </div>
                ))}
              </div>
            )}

            {hold && (
              <div style={{ background: c.surface, border: "1px solid " + c.border, borderRadius: "14px", overflow: "hidden", marginBottom: "18px" }}>
                <div style={{ padding: "14px 18px", borderBottom: "1px solid " + c.border, display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
                    <div style={{ width: "34px", height: "34px", borderRadius: "9px", background: c.goodSoft, color: c.good, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="M18 17V9" /><path d="M13 17V5" /><path d="M8 17v-3" /></svg>
                    </div>
                    <div style={{ fontSize: "14px", fontWeight: 600 }}>Portfolio &mdash; {hold.count} holdings</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "18px", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}><span style={{ fontSize: "12px", fontWeight: 600, color: c.faint, marginRight: "4px" }}>JOD</span>{fmtFull(hold.total)}</div>
                    <div dir="rtl" style={{ fontSize: "11px", color: c.faint, marginTop: "2px" }}>{hold.header}</div>
                  </div>
                </div>
                <div>
                  {topHoldings.map((h, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", padding: "10px 18px", borderBottom: i < topHoldings.length - 1 ? "1px solid " + c.borderSoft : "none", background: i % 2 ? c.surfaceAlt : c.surface }}>
                      <div dir="rtl" style={{ fontSize: "13px", color: c.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>{h.name || "\u2014"}</div>
                      <div style={{ fontSize: "13px", fontWeight: 600, fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>{fmtFull(h.value)}</div>
                    </div>
                  ))}
                  {hold.count > 8 && (
                    <div style={{ padding: "9px 18px", fontSize: "12px", color: c.sub, background: c.surfaceAlt }}>+ {hold.count - 8} more holdings</div>
                  )}
                </div>
              </div>
            )}

            {a.figures.length > 0 && (
              <div style={{ background: c.surface, border: "1px solid " + c.border, borderRadius: "14px", overflow: "hidden", marginBottom: "18px" }}>
                <div style={{ padding: "13px 18px", borderBottom: "1px solid " + c.border, fontSize: "14px", fontWeight: 600 }}>Reported figures <span style={{ color: c.faint, fontWeight: 500 }}>({a.figures.length})</span></div>
                <div>
                  {figsToShow.map((f, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", padding: "10px 18px", borderBottom: i < figsToShow.length - 1 ? "1px solid " + c.borderSoft : "none", background: i % 2 ? c.surfaceAlt : c.surface }}>
                      <div dir="rtl" style={{ fontSize: "13px", color: c.sub, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>{f.label}</div>
                      <div style={{ fontSize: "13px", fontWeight: 600, fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>{fmtFull(f.value)}</div>
                    </div>
                  ))}
                </div>
                {a.figures.length > 12 && (
                  <button onClick={() => setShowAllFigs(!showAllFigs)} style={{ width: "100%", padding: "11px", background: c.surfaceAlt, border: "none", borderTop: "1px solid " + c.border, color: c.primary, fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                    {showAllFigs ? "Show less" : "Show all " + a.figures.length + " figures"}
                  </button>
                )}
              </div>
            )}

            <div style={{ marginBottom: "10px" }}>
              <button onClick={() => setShowRaw(!showRaw)} style={{ display: "flex", alignItems: "center", gap: "8px", background: "transparent", border: "1px solid " + c.border, borderRadius: "9px", padding: "9px 14px", color: c.sub, fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: showRaw ? "rotate(90deg)" : "none", transition: "transform 0.15s" }}><path d="M9 18l6-6-6-6" /></svg>
                {showRaw ? "Hide raw sheets" : "View raw sheets (" + parsed.sheets.length + ")"}
              </button>
            </div>

            {showRaw && sheet && (
              <div>
                {parsed.sheets.length > 1 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "14px" }}>
                    {parsed.sheets.map((s, i) => {
                      const on = i === activeSheet;
                      return (
                        <button key={i} onClick={() => setActiveSheet(i)} style={{ background: on ? c.primary : c.surface, color: on ? c.primaryText : c.sub, border: "1px solid " + (on ? c.primary : c.border), borderRadius: "999px", padding: "7px 15px", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", maxWidth: "260px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {s.name}
                          <span style={{ opacity: 0.7, marginLeft: "7px", fontWeight: 500 }}>{s.rows} x {s.cols}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
                <div style={{ background: c.surface, border: "1px solid " + c.border, borderRadius: "14px", overflow: "hidden" }}>
                  <div style={{ overflowX: "auto", maxHeight: "560px", overflowY: "auto" }}>
                    <table style={{ borderCollapse: "collapse", width: "100%", fontSize: "13px" }}>
                      <thead>
                        <tr>
                          <th style={{ position: "sticky", top: 0, left: 0, zIndex: 3, background: c.thBg, borderBottom: "1px solid " + c.border, borderRight: "1px solid " + c.border, minWidth: "44px" }} />
                          {colIdxs.map((ci) => (
                            <th key={ci} style={{ position: "sticky", top: 0, zIndex: 2, background: c.thBg, color: c.faint, fontWeight: 600, padding: "8px 12px", borderBottom: "1px solid " + c.border, borderRight: "1px solid " + c.borderSoft, textAlign: "left", whiteSpace: "nowrap" }}>{colLabel(ci)}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {previewRows.map((row, ri) => (
                          <tr key={ri} style={{ background: ri % 2 ? c.rowAlt : c.surface }}>
                            <td style={{ position: "sticky", left: 0, zIndex: 1, background: ri % 2 ? c.rowAlt : c.surface, color: c.faint, fontWeight: 600, padding: "7px 10px", borderRight: "1px solid " + c.border, borderBottom: "1px solid " + c.borderSoft, textAlign: "center" }}>{ri + 1}</td>
                            {colIdxs.map((ci) => {
                              const val = (row as unknown[])[ci];
                              const ar = isArabic(val);
                              return (
                                <td key={ci} title={fmtCell(val)} dir={ar ? "rtl" : "ltr"} style={{ padding: "7px 12px", borderBottom: "1px solid " + c.borderSoft, borderRight: "1px solid " + c.borderSoft, whiteSpace: "nowrap", maxWidth: "320px", overflow: "hidden", textOverflow: "ellipsis", textAlign: typeof val === "number" ? "right" : ar ? "right" : "left", fontVariantNumeric: "tabular-nums" }}>{fmtCell(val)}</td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {(sheet.rows > MAX_PREVIEW_ROWS || sheet.cols > MAX_PREVIEW_COLS) && (
                    <div style={{ padding: "10px 18px", borderTop: "1px solid " + c.border, fontSize: "12px", color: c.sub, background: c.surfaceAlt }}>
                      Showing first {Math.min(sheet.rows, MAX_PREVIEW_ROWS)} of {sheet.rows} rows{sheet.cols > MAX_PREVIEW_COLS ? " and first " + MAX_PREVIEW_COLS + " of " + sheet.cols + " columns" : ""}.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
