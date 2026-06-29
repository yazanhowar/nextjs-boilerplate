"use client";

import { useState, useEffect, useRef, useCallback, type ChangeEvent, type ReactNode } from "react";

type XLSXLib = {
  read: (data: ArrayBuffer, opts: object) => { SheetNames: string[]; Sheets: Record<string, object> };
  utils: { sheet_to_json: (ws: object, opts: object) => unknown[][] };
};
type SheetData = { name: string; rows: number; cols: number; aoa: unknown[][] };
type Figure = { label: string; value: number; kind: "num" | "pct" };
type Holding = { name: string; value: number };
type LoadedForm = {
  id: string;
  fileName: string;
  code: string;
  titleEn: string;
  bank: string | null;
  period: string | null;
  currency: string | null;
  consolidated: boolean;
  figures: Figure[];
  money: Figure[];
  holdings: { total: number; count: number; items: Holding[] } | null;
  bookTotal: number | null;
  isNil: boolean;
  sheets: SheetData[];
};
type Slice = { label: string; value: number; color: string };
type ExecModel = {
  bank: string | null;
  period: string | null;
  formCount: number;
  stats: { key: string; label: string; value: number | null; sub: string }[];
  funding: Slice[];
  fundingGross: number;
  fundingDeductions: { label: string; value: number }[];
  fundingNet: number | null;
  investTotal: number;
  fxUse: Slice[];
  currencies: { cur: string; assets: number; liab: number; net: number }[];
  investTypes: Slice[];
  moneyMarket: Slice[];
  coverage: { code: string; present: boolean; nil: boolean }[];
};

const XLSX_SRC = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";

const FORMS: Record<string, string> = {
  AST01: "FX Sources of Funds", AST02: "FX Sources \u2014 Ratios", AST03: "Money-Market \u2014 Investment-Grade",
  AST04: "Money-Market \u2014 Sub-Investment-Grade", AST05: "Capital-Market Investments", AST06: "Derivatives \u2014 Volatility",
  AST07: "Derivatives \u2014 P&L", AST08: "Direct FX Facilities", AST09: "Aggregate Open FX Position", AST10: "Open Position by Currency",
  HDP: "Top-20 Depositors", INV0102: "FVTPL \u2014 Bills & Bonds", INV0103: "FVTPL \u2014 Funds", INV01010: "Trading Equities",
  INV02010: "FVOCI Equities", INV03: "Amortized-Cost Assets", INV04: "Subsidiaries & Associates",
};
const CORE_FORMS = ["AST01", "AST02", "AST03", "AST04", "AST05", "AST09", "AST10", "INV01010", "INV02010", "INV03"];
const BANKS: Record<string, string> = { HBTF: "Housing Bank for Trade & Finance" };
const MONTHS = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const META = ["\u0646\u0648\u0639 \u0627\u0644\u0628\u064a\u0627\u0646\u0627\u062a", "\u0639\u062f\u062f \u0627\u0644\u062e\u0627\u0646\u0627\u062a \u0627\u0644\u0645\u0633\u0645\u0648\u062d \u0628\u0625\u062f\u062e\u0627\u0644\u0647\u0627", "\u0623\u0631\u0642\u0627\u0645", "\u062a\u0627\u0631\u064a\u062e", "\u062d\u0631\u0648\u0641 \u0648\u0623\u0631\u0642\u0627\u0645", "\u0627\u0644\u0645\u0628\u0644\u063a", "\u0631\u0645\u0632 \u0627\u0644\u0639\u0645\u0644\u0629", "\u0627\u0644\u0641\u0631\u0639", "\u0627\u0644\u062a\u0627\u0631\u064a\u062e", "\u0637\u0648\u064a\u0644", "\u0642\u0635\u064a\u0631"];
const BOOK_KW = ["\u0627\u0644\u0642\u064a\u0645\u0629 \u0627\u0644\u0645\u062b\u0628\u062a\u0629", "\u0627\u0644\u0642\u064a\u0645\u0629 \u0627\u0644\u0639\u0627\u062f\u0644\u0629", "\u0635\u0627\u0641\u064a \u0627\u0644\u0642\u064a\u0645\u0629", "\u0627\u0644\u0642\u064a\u0645\u0629 \u0627\u0644\u0645\u0639\u0627\u062f\u0644\u0629", "\u0627\u0644\u0645\u064f\u062b\u0628\u062a\u0629"];
const NET_KW = ["\u0635\u0627\u0641\u0649 \u0645\u0635\u0627\u062f\u0631", "\u0635\u0627\u0641\u064a \u0645\u0635\u0627\u062f\u0631"];
const TOTKULLI = "\u0627\u0644\u0645\u062c\u0645\u0648\u0639 \u0627\u0644\u0643\u0644\u064a";
const EQUITY_KW = "\u062d\u0642\u0648\u0642 \u0627\u0644\u0645\u0633\u0627\u0647\u0645\u064a\u0646";
const POS_KW = "\u0627\u0644\u0645\u0631\u0643\u0632 \u0627\u0644\u0645\u0641\u062a\u0648\u062d \u0627\u0644\u0627\u062c\u0645\u0627\u0644\u064a";
const PCT_KW = "\u0646\u0633\u0628\u0629";
const ASSET_KW = "\u0627\u0644\u0645\u0648\u062c\u0648\u062f\u0627\u062a";
const LIAB_KW = "\u0627\u0644\u0645\u0637\u0644\u0648\u0628\u0627\u062a";
const CAPMKT_KW = "\u0633\u0648\u0642 \u0631\u0623\u0633 \u0627\u0644\u0645\u0627\u0644";

const PALETTE = ["#0a4a8f", "#2f7ed8", "#5aa9e6", "#86c5ef", "#34c759", "#ff9500", "#5856d6", "#af52de", "#ff3b30", "#64748b"];

function getXLSX(): XLSXLib | undefined { return (window as unknown as { XLSX?: XLSXLib }).XLSX; }
function loadXLSX(): Promise<XLSXLib> {
  return new Promise((resolve, reject) => {
    const r = getXLSX(); if (r) { resolve(r); return; }
    const ex = document.querySelector("script[data-xlsx-engine='1']") as HTMLScriptElement | null;
    if (ex) { ex.addEventListener("load", () => { const x = getXLSX(); if (x) resolve(x); else reject(new Error("engine init failed")); }); ex.addEventListener("error", () => reject(new Error("engine load failed"))); return; }
    const s = document.createElement("script"); s.src = XLSX_SRC; s.setAttribute("data-xlsx-engine", "1");
    s.onload = () => { const x = getXLSX(); if (x) resolve(x); else reject(new Error("engine init failed")); };
    s.onerror = () => reject(new Error("Could not load the spreadsheet engine.")); document.head.appendChild(s);
  });
}
function isArabic(v: unknown): boolean { if (typeof v !== "string") return false; for (let i = 0; i < v.length; i++) { const c = v.charCodeAt(i); if (c >= 0x0600 && c <= 0x06ff) return true; } return false; }
function cleanWs(v: unknown): string { return String(v).replace(/\s+/g, " ").trim(); }
function toNum(v: unknown): number | null { if (typeof v === "boolean") return null; if (typeof v === "number" && isFinite(v)) return v; return null; }
function goodLabel(v: unknown): boolean { if (!isArabic(v)) return false; const s = cleanWs(v); if (s.length <= 3) return false; if (META.indexOf(s) >= 0) return false; if (/^[\d.,%()\-\/\s]+$/.test(s)) return false; return true; }
function cell(aoa: unknown[][], r: number, c: number): unknown { const row = aoa[r]; if (!row) return null; return row[c]; }
function rowLabel(aoa: unknown[][], r: number, c: number): string | null { let best: string | null = null; let bc = -1; for (let cc = 0; cc < c; cc++) { const v = cell(aoa, r, cc); if (goodLabel(v) && cc > bc) { best = cleanWs(v); bc = cc; } } return best; }
function colLabelAbove(aoa: unknown[][], r: number, c: number): string | null { const lo = Math.max(0, r - 10); for (let rr = r - 1; rr >= lo; rr--) { const v = cell(aoa, rr, c); if (goodLabel(v)) return cleanWs(v); } return null; }
function meaningfulSheet(name: string): boolean { if (name === "CRYSTAL_PERSIST") return false; if (/quee?ry from business/i.test(name)) return false; return true; }

function extractFigures(sheets: SheetData[]): Figure[] {
  const out: Figure[] = []; const seen: Record<string, boolean> = {};
  sheets.forEach((s) => {
    if (!meaningfulSheet(s.name)) return;
    const aoa = s.aoa;
    for (let r = 0; r < aoa.length; r++) {
      const row = aoa[r] || [];
      for (let c = 0; c < row.length; c++) {
        const n = toNum(row[c]); if (n === null || n === 0) continue;
        const lab = rowLabel(aoa, r, c) || colLabelAbove(aoa, r, c); if (!lab) continue;
        const isRatio = lab.indexOf(PCT_KW) >= 0 && Math.abs(n) < 2;
        if (!isRatio && Math.abs(n) < 1000) continue;
        const key = lab + "|" + Math.round(n * 100); if (seen[key]) continue; seen[key] = true;
        out.push({ label: lab, value: n, kind: isRatio ? "pct" : "num" });
      }
    }
  });
  return out;
}
function detectBookTotal(sheets: SheetData[]): { total: number; count: number; items: Holding[] } | null {
  for (let si = 0; si < sheets.length; si++) {
    if (!meaningfulSheet(sheets[si].name)) continue;
    const aoa = sheets[si].aoa; let hr = -1, hc = -1;
    for (let r = 0; r < Math.min(14, aoa.length) && hr < 0; r++) { const row = aoa[r] || []; for (let c = 0; c < row.length; c++) { const v = row[c]; if (isArabic(v)) { const s = cleanWs(v); for (let k = 0; k < BOOK_KW.length; k++) { if (s.indexOf(BOOK_KW[k]) >= 0) { hr = r; hc = c; break; } } } if (hr >= 0) break; } }
    if (hr < 0) continue;
    const items: Holding[] = []; let total = 0;
    for (let r = hr + 1; r < aoa.length; r++) { const n = toNum(cell(aoa, r, hc)); if (n === null || Math.abs(n) < 1000) continue; const row = aoa[r] || []; let name = ""; for (let c = 0; c < row.length; c++) { if (isArabic(row[c]) && cleanWs(row[c]).length > 3) { name = cleanWs(row[c]); break; } } items.push({ name: name, value: n }); total += n; }
    if (items.length === 0) continue;
    items.sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
    return { total: total, count: items.length, items: items };
  }
  return null;
}
function parseIdentity(fileName: string): { code: string; bank: string | null; period: string | null; currency: string | null; consolidated: boolean } {
  const base = fileName.replace(/\.[^.]+$/, ""); const up = base.toUpperCase();
  const m = up.match(/^([A-Z]+[0-9]+)/); const code = m ? m[1] : base.split(/[_\s.]/)[0].toUpperCase();
  let bank: string | null = null; Object.keys(BANKS).forEach((k) => { if (up.indexOf(k) >= 0) bank = BANKS[k] + " (" + k + ")"; });
  const pm = base.match(/(\d{2})-(\d{4})/); let period: string | null = null; if (pm) { const mo = parseInt(pm[1], 10); period = (MONTHS[mo] || pm[1]) + " " + pm[2]; }
  let currency: string | null = null; const cm: Record<string, string> = { DOLLER: "USD", DOLLAR: "USD", EURO: "EUR", GBP: "GBP", POUND: "GBP", YEN: "JPY", FRNK: "CHF", FRANC: "CHF", ELSE: "Other" }; Object.keys(cm).forEach((k) => { if (up.indexOf(k) >= 0) currency = cm[k]; });
  const consolidated = /_C(\b|_|$)/.test(base);
  return { code: code, bank: bank, period: period, currency: currency, consolidated: consolidated };
}
function analyzeForm(sheets: SheetData[], fileName: string): LoadedForm {
  const id = parseIdentity(fileName);
  const figures = extractFigures(sheets);
  const money = figures.filter((f) => f.kind === "num" && Math.abs(f.value) >= 1000);
  const holdings = detectBookTotal(sheets);
  return { id: fileName + ":" + Date.now() + ":" + Math.random().toString(36).slice(2, 6), fileName: fileName, code: id.code, titleEn: FORMS[id.code] || "CBJ Return", bank: id.bank, period: id.period, currency: id.currency, consolidated: id.consolidated, figures: figures, money: money, holdings: holdings, bookTotal: holdings ? holdings.total : null, isNil: money.length === 0, sheets: sheets };
}

function byCode(forms: LoadedForm[], code: string): LoadedForm | null {
  const c = forms.filter((f) => f.code === code && !f.consolidated); if (c.length) return c[0];
  const c2 = forms.filter((f) => f.code === code); return c2.length ? c2[0] : null;
}
function biggestWith(form: LoadedForm | null, kws: string[]): number | null {
  if (!form) return null; let best: number | null = null;
  form.money.forEach((f) => { for (let i = 0; i < kws.length; i++) { if (f.label.indexOf(kws[i]) >= 0) { if (best === null || Math.abs(f.value) > Math.abs(best)) best = f.value; } } });
  return best;
}
function buildExecutive(forms: LoadedForm[]): ExecModel {
  let bank: string | null = null, period: string | null = null;
  forms.forEach((f) => { if (!bank && f.bank) bank = f.bank; if (!period && f.period) period = f.period; });
  const ast01 = byCode(forms, "AST01"), ast02 = byCode(forms, "AST02"), ast03 = byCode(forms, "AST03"), ast04 = byCode(forms, "AST04"), ast09 = byCode(forms, "AST09");
  const netSources = biggestWith(ast01, NET_KW) || biggestWith(ast02, NET_KW);
  const equity = biggestWith(ast02, [EQUITY_KW]);
  const openPos = biggestWith(ast09, [POS_KW]);
  const mmIG = biggestWith(ast03, [TOTKULLI]); const mmSub = biggestWith(ast04, [TOTKULLI]);
  const ast05 = byCode(forms, "AST05");
  const DINARBAL = "\u0627\u0644\u0631\u0635\u064a\u062f \u0628\u0627\u0644\u062f\u064a\u0646\u0627\u0631";
  let capMkt: number | null = null;
  if (ast05) { let cmv = 0, cmc = 0; ast05.money.forEach((f) => { if (f.label.indexOf(DINARBAL) >= 0) { cmv += f.value; cmc++; } }); if (cmc > 0) capMkt = cmv; }
  // investment book totals (dedupe by code)
  const invSeen: Record<string, boolean> = {}; let invTotal = 0; const investTypes: Slice[] = [];
  const invLabels: Record<string, string> = { INV01010: "Trading equities", INV02010: "FVOCI equities", INV03: "Amortized-cost" };
  ["INV01010", "INV02010", "INV03"].forEach((code, idx) => { const f = byCode(forms, code); if (f && f.bookTotal && !invSeen[code]) { invSeen[code] = true; invTotal += f.bookTotal; investTypes.push({ label: invLabels[code], value: f.bookTotal, color: PALETTE[idx] }); } });
  // funding composition (AST01) - gross sources only; reserve(s) treated as deductions so slices sum to gross
  const funding: Slice[] = []; let fundingGross = 0; const fundingDeductions: { label: string; value: number }[] = []; let fundingNet: number | null = netSources;
  if (ast01) {
    const YATRAH = "\u064a\u0637\u0631\u062d";
    const srcItems = ast01.money.filter((f) => { for (let i = 0; i < NET_KW.length; i++) if (f.label.indexOf(NET_KW[i]) >= 0) return false; if (f.label.indexOf(YATRAH) >= 0) return false; return true; });
    const dedItems = ast01.money.filter((f) => f.label.indexOf(YATRAH) >= 0);
    srcItems.sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
    srcItems.forEach((f) => { fundingGross += f.value; });
    const topN = srcItems.slice(0, 5), restN = srcItems.slice(5);
    topN.forEach((f, i) => funding.push({ label: f.label, value: f.value, color: PALETTE[i % PALETTE.length] }));
    if (restN.length) { let ro = 0; restN.forEach((f) => { ro += f.value; }); funding.push({ label: "Other sources (" + restN.length + ")", value: ro, color: PALETTE[9] }); }
    dedItems.forEach((f) => fundingDeductions.push({ label: f.label, value: f.value }));
    if (fundingNet === null) fundingNet = fundingGross - dedItems.reduce((a, f) => a + f.value, 0);
  }
  // fx use (AST02 ratios) deduped by rounded value
  const fxUse: Slice[] = [];
  if (ast02) { const seenPct: Record<string, boolean> = {}; ast02.figures.filter((f) => f.kind === "pct").forEach((f) => { const k = String(Math.round(f.value * 1000)); if (seenPct[k]) return; seenPct[k] = true; if (fxUse.length < 5) fxUse.push({ label: f.label, value: f.value, color: PALETTE[fxUse.length % PALETTE.length] }); }); }
  // currencies (AST10)
  const currencies: { cur: string; assets: number; liab: number; net: number }[] = [];
  forms.filter((f) => f.code === "AST10" && !f.consolidated).forEach((f) => { const assets = biggestWith(f, [ASSET_KW]) || 0; const liab = biggestWith(f, [LIAB_KW]) || 0; currencies.push({ cur: f.currency || "?", assets: assets, liab: liab, net: assets + liab }); });
  // money market IG vs sub
  const moneyMarket: Slice[] = [];
  if (mmIG !== null) moneyMarket.push({ label: "Investment-grade", value: mmIG, color: PALETTE[0] });
  if (mmSub !== null) moneyMarket.push({ label: "Sub-investment-grade", value: mmSub, color: PALETTE[5] });
  // coverage
  const present: Record<string, boolean> = {}; const nil: Record<string, boolean> = {};
  forms.forEach((f) => { present[f.code] = true; if (f.isNil) nil[f.code] = (nil[f.code] === undefined ? true : nil[f.code]); else nil[f.code] = false; });
  const coverage = CORE_FORMS.map((code) => ({ code: code, present: !!present[code], nil: !!nil[code] }));
  const stats = [
    { key: "net", label: "Net FX Sources of Funds", value: netSources, sub: "AST01" },
    { key: "eq", label: "Shareholders' Equity", value: equity, sub: "AST02" },
    { key: "pos", label: "Aggregate Open FX Position", value: openPos, sub: "AST09" },
    { key: "inv", label: "Investment Portfolio (book)", value: invTotal || null, sub: "INV01/02/03" },
    { key: "mm", label: "Money-Market Placements", value: (mmIG !== null || mmSub !== null) ? (mmIG || 0) + (mmSub || 0) : null, sub: "AST03 + AST04" },
    { key: "cap", label: "Capital-Market Investments", value: capMkt, sub: "AST05 \u00b7 JOD balances" },
  ];
  return { bank: bank, period: period, formCount: forms.length, stats: stats, funding: funding, fundingGross: fundingGross, fundingDeductions: fundingDeductions, fundingNet: fundingNet, investTotal: invTotal, fxUse: fxUse, currencies: currencies, investTypes: investTypes, moneyMarket: moneyMarket, coverage: coverage };
}

function fmtFull(v: number): string { const neg = v < 0; const s = Math.round(Math.abs(v)).toLocaleString("en-US"); return (neg ? "-" : "") + s; }
function fmtCompact(v: number): string { const a = Math.abs(v); const n = v < 0 ? "-" : ""; if (a >= 1e9) return n + (a / 1e9).toFixed(2) + "B"; if (a >= 1e6) return n + (a / 1e6).toFixed(1) + "M"; if (a >= 1e3) return n + (a / 1e3).toFixed(0) + "K"; return n + a.toFixed(0); }

type CT = { surface: string; border: string; borderSoft: string; text: string; sub: string; faint: string; primary: string; surfaceAlt: string; grid: string };

function Donut(props: { items: Slice[]; size: number; c: CT; centerVal?: string; centerLab?: string }) {
  const items = props.items.filter((i) => Math.abs(i.value) > 0); const size = props.size; const R = size / 2, r = R * 0.6, cx = R, cy = R;
  const total = items.reduce((s, i) => s + Math.abs(i.value), 0) || 1; let acc = 0;
  const arcs = items.map((it, idx) => {
    const frac = Math.abs(it.value) / total; const a0 = acc * 2 * Math.PI - Math.PI / 2; acc += frac; const a1 = acc * 2 * Math.PI - Math.PI / 2; const large = frac > 0.5 ? 1 : 0;
    const x0 = cx + R * Math.cos(a0), y0 = cy + R * Math.sin(a0), x1 = cx + R * Math.cos(a1), y1 = cy + R * Math.sin(a1);
    const xi1 = cx + r * Math.cos(a1), yi1 = cy + r * Math.sin(a1), xi0 = cx + r * Math.cos(a0), yi0 = cy + r * Math.sin(a0);
    const d = "M " + x0 + " " + y0 + " A " + R + " " + R + " 0 " + large + " 1 " + x1 + " " + y1 + " L " + xi1 + " " + yi1 + " A " + r + " " + r + " 0 " + large + " 0 " + xi0 + " " + yi0 + " Z";
    return <path key={idx} d={d} fill={it.color} />;
  });
  const cv = props.centerVal;
  const center = (cv === undefined || cv === null) ? null : (<g><text x={cx} y={cy - 1} textAnchor="middle" fontSize={size * 0.15} fontWeight={700} fill={props.c.text}>{cv}</text>{props.centerLab ? <text x={cx} y={cy + size * 0.13} textAnchor="middle" fontSize={size * 0.08} fill={props.c.sub}>{props.centerLab}</text> : null}</g>);
  return <svg viewBox={"0 0 " + size + " " + size} width={size} height={size} style={{ flexShrink: 0 }}>{arcs}{center}</svg>;
}
function Legend(props: { items: Slice[]; c: CT; pct?: boolean }) {
  return (<div style={{ display: "flex", flexDirection: "column", gap: "8px", minWidth: 0 }}>{props.items.map((it, i) => (
    <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px" }}>
      <span style={{ width: "10px", height: "10px", borderRadius: "3px", background: it.color, flexShrink: 0 }} />
      <span dir="rtl" style={{ color: props.c.sub, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, minWidth: 0 }}>{it.label}</span>
      <span style={{ color: props.c.text, fontWeight: 600, fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>{props.pct ? (it.value * 100).toFixed(1) + "%" : fmtCompact(it.value)}</span>
    </div>))}</div>);
}
function HBars(props: { items: Slice[]; c: CT; pct?: boolean; signed?: boolean }) {
  const max = Math.max.apply(null, props.items.map((i) => Math.abs(i.value)).concat([1]));
  return (<div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>{props.items.map((it, i) => {
    const w = (Math.abs(it.value) / max) * 100; const neg = it.value < 0;
    return (<div key={i}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px", fontSize: "12px" }}>
        <span dir="rtl" style={{ color: props.c.sub, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "70%" }}>{it.label}</span>
        <span style={{ color: props.c.text, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{props.pct ? (it.value * 100).toFixed(1) + "%" : (props.signed && it.value >= 0 ? "+" : "") + fmtCompact(it.value)}</span>
      </div>
      <div style={{ height: "8px", background: props.c.surfaceAlt, borderRadius: "5px", overflow: "hidden" }}>
        <div style={{ width: w + "%", height: "100%", background: neg ? "#ff3b30" : it.color, borderRadius: "5px" }} />
      </div>
    </div>);
  })}</div>);
}
function Panel(props: { title: string; c: CT; children: ReactNode }) {
  return (<div style={{ background: props.c.surface, border: "1px solid " + props.c.border, borderRadius: "14px", padding: "18px" }}>
    <div style={{ fontSize: "13px", fontWeight: 600, color: props.c.text, marginBottom: "16px" }}>{props.title}</div>
    {props.children}</div>);
}

export default function ExecutiveUploadPage() {
  const [dark, setDark] = useState(false);
  const [forms, setForms] = useState<LoadedForm[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [openForm, setOpenForm] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => { try { const t = localStorage.getItem("theme") || localStorage.getItem("hbtf-theme"); setDark(t === "dark"); } catch { /* noop */ } loadXLSX().catch(() => {}); }, []);

  const addFiles = useCallback(async (fileList: File[]) => {
    setError(null); setBusy(true);
    try {
      const XLSX = await loadXLSX(); const added: LoadedForm[] = [];
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i]; if (!/\.(xlsx|xls)$/i.test(file.name)) continue;
        const buf = await file.arrayBuffer(); const wb = XLSX.read(buf, { type: "array", cellDates: true });
        const sheets: SheetData[] = wb.SheetNames.map((nm) => { const ws = wb.Sheets[nm]; const aoa = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null, blankrows: false }); let cols = 0; for (let k = 0; k < aoa.length; k++) { const rr = aoa[k]; if (rr && rr.length > cols) cols = rr.length; } return { name: nm, rows: aoa.length, cols: cols, aoa: aoa }; });
        added.push(analyzeForm(sheets, file.name));
      }
      if (added.length === 0) throw new Error("No .xlsx or .xls files found in that drop.");
      setForms((prev) => { const map: Record<string, LoadedForm> = {}; prev.forEach((f) => { map[f.code + (f.currency || "") + (f.consolidated ? "C" : "")] = f; }); added.forEach((f) => { map[f.code + (f.currency || "") + (f.consolidated ? "C" : "")] = f; }); return Object.keys(map).map((k) => map[k]); });
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); } finally { setBusy(false); }
  }, []);

  const onInput = (e: ChangeEvent<HTMLInputElement>) => { const fs = e.target.files; if (fs && fs.length) addFiles(Array.from(fs)); if (inputRef.current) inputRef.current.value = ""; };
  const removeForm = (id: string) => setForms((prev) => prev.filter((f) => f.id !== id));
  const clearAll = () => { setForms([]); setError(null); setOpenForm(null); };

  const c: CT = dark
    ? { surface: "#16191f", border: "#262b34", borderSoft: "#1f242c", text: "#f1f5f9", sub: "#94a3b8", faint: "#64748b", primary: "#3b82f6", surfaceAlt: "#0f1115", grid: "#1f242c" }
    : { surface: "#ffffff", border: "#e2e8f0", borderSoft: "#eef2f6", text: "#0f172a", sub: "#64748b", faint: "#94a3b8", primary: "#0a4a8f", surfaceAlt: "#f1f5f9", grid: "#eef2f6" };
  const bg = dark ? "#0f1115" : "#f2f4f7";
  const exec = forms.length ? buildExecutive(forms) : null;
  const openDetail = openForm ? forms.filter((f) => f.id === openForm)[0] || null : null;

  return (
    <div style={{ minHeight: "100vh", background: bg, color: c.text, fontFamily: "Inter, system-ui, -apple-system, sans-serif" }}>
      <div style={{ position: "sticky", top: 0, zIndex: 10, background: c.surface, borderBottom: "1px solid " + c.border, padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "40px", height: "40px", borderRadius: "11px", background: "#0a4a8f", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "15px" }}>cf</div>
          <div><div style={{ fontWeight: 700, fontSize: "16px", lineHeight: "1.1" }}>convo.finance</div><div style={{ fontSize: "12px", color: c.sub, marginTop: "2px" }}>CBJ Regulatory Intelligence</div></div>
        </div>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: "7px", textDecoration: "none", color: c.sub, fontSize: "13px", fontWeight: 600, padding: "8px 14px", borderRadius: "9px", border: "1px solid " + c.border }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5" /><path d="M12 19l-7-7 7-7" /></svg>Dashboard</a>
      </div>

      <div style={{ maxWidth: "1120px", margin: "0 auto", padding: "28px 24px 64px" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "7px", fontSize: "12px", fontWeight: 600, color: c.primary, background: dark ? "rgba(59,130,246,0.14)" : "rgba(10,74,143,0.07)", padding: "5px 11px", borderRadius: "999px", marginBottom: "12px" }}><span style={{ width: "6px", height: "6px", borderRadius: "999px", background: c.primary }} />Executive Dashboard</div>
        <h1 style={{ fontSize: "25px", fontWeight: 700, margin: "0 0 8px" }}>CBJ Regulatory Pack</h1>
        <p style={{ fontSize: "15px", color: c.sub, margin: "0 0 22px", maxWidth: "720px", lineHeight: "1.5" }}>Upload an entire bank's monthly CBJ returns at once. The figures are extracted, de-duplicated, and combined into one executive view.</p>

        {error && (<div style={{ background: dark ? "rgba(220,38,38,0.12)" : "#fef2f2", border: "1px solid " + (dark ? "rgba(220,38,38,0.4)" : "#fecaca"), color: dark ? "#fca5a5" : "#b91c1c", padding: "12px 15px", borderRadius: "12px", fontSize: "14px", marginBottom: "18px" }}>{error}</div>)}

        <div onClick={() => inputRef.current && inputRef.current.click()} onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={(e) => { e.preventDefault(); setDragOver(false); const fs = e.dataTransfer.files; if (fs && fs.length) addFiles(Array.from(fs)); }}
          style={{ border: "2px dashed " + (dragOver ? c.primary : (dark ? "#2c333f" : "#cbd5e1")), background: dragOver ? (dark ? "rgba(59,130,246,0.08)" : "rgba(10,74,143,0.04)") : c.surface, borderRadius: "16px", padding: forms.length ? "20px" : "44px 24px", textAlign: "center", cursor: "pointer", marginBottom: "18px" }}>
          <div style={{ fontSize: forms.length ? "14px" : "16px", fontWeight: 600 }}>{busy ? "Reading files..." : (forms.length ? "Drop more reports, or click to add" : "Drop the whole pack here, or click to browse")}</div>
          {!forms.length && <div style={{ fontSize: "13px", color: c.sub, marginTop: "6px" }}>Select multiple .xlsx / .xls files at once</div>}
          <input ref={inputRef} type="file" accept=".xlsx,.xls" multiple onChange={onInput} style={{ display: "none" }} />
        </div>

        {forms.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center", marginBottom: "22px" }}>
            {forms.map((f) => (<span key={f.id} onClick={() => setOpenForm(openForm === f.id ? null : f.id)} style={{ display: "inline-flex", alignItems: "center", gap: "7px", background: c.surface, border: "1px solid " + (openForm === f.id ? c.primary : c.border), borderRadius: "999px", padding: "6px 8px 6px 12px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
              <span style={{ color: c.primary }}>{f.code}{f.currency ? " " + f.currency : ""}</span>
              {f.isNil && <span style={{ color: c.faint, fontWeight: 500 }}>nil</span>}
              <span onClick={(e) => { e.stopPropagation(); removeForm(f.id); }} style={{ width: "16px", height: "16px", borderRadius: "999px", background: c.surfaceAlt, color: c.faint, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "13px", lineHeight: 1 }}>&times;</span>
            </span>))}
            <span onClick={clearAll} style={{ fontSize: "12px", color: c.faint, cursor: "pointer", padding: "6px 8px" }}>Clear all</span>
          </div>
        )}

        {exec && (
          <div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "baseline", marginBottom: "16px" }}>
              <span style={{ fontSize: "18px", fontWeight: 700 }}>{exec.bank || "Bank \u2014"}</span>
              <span style={{ fontSize: "13px", color: c.sub }}>{(exec.period || "Period \u2014") + "  \u00b7  " + exec.formCount + " forms loaded"}</span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginBottom: "22px" }}>
              {exec.stats.map((s) => (<div key={s.key} style={{ background: c.surface, border: "1px solid " + c.border, borderRadius: "14px", padding: "16px" }}>
                <div style={{ fontSize: "11px", color: c.faint, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: "8px" }}>{s.label}</div>
                {s.value !== null ? (<div><div style={{ fontSize: "23px", fontWeight: 700, letterSpacing: "-0.5px", fontVariantNumeric: "tabular-nums" }}><span style={{ fontSize: "13px", fontWeight: 600, color: c.faint, marginRight: "4px" }}>JOD</span>{fmtCompact(s.value)}</div><div style={{ fontSize: "11px", color: c.faint, marginTop: "3px" }}>{"JOD " + fmtFull(s.value) + "  \u00b7  " + s.sub}</div></div>) : (<div style={{ fontSize: "15px", color: c.faint, fontWeight: 600 }}>not loaded</div>)}
              </div>))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(330px, 1fr))", gap: "16px", marginBottom: "22px" }}>
              {exec.funding.length > 0 && (<Panel title="Sources of Funds composition" c={c}><div style={{ display: "flex", alignItems: "center", gap: "18px" }}><Donut items={exec.funding} size={120} c={c} centerVal={fmtCompact(exec.fundingGross)} centerLab="gross" /><div style={{ flex: 1, minWidth: 0 }}><Legend items={exec.funding} c={c} /></div></div><div style={{ marginTop: "10px", borderTop: "1px solid " + c.borderSoft, paddingTop: "8px", fontSize: "12.5px" }}><div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0" }}><span style={{ color: c.sub }}>Gross FX sources</span><span style={{ fontWeight: 600, color: c.text, fontVariantNumeric: "tabular-nums" }}>{"JOD " + fmtCompact(exec.fundingGross)}</span></div>{exec.fundingDeductions.map((d, i) => (<div key={i} style={{ display: "flex", justifyContent: "space-between", gap: "12px", padding: "3px 0" }}><span dir="rtl" style={{ color: "#d97706", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.label}</span><span style={{ fontWeight: 600, color: "#d97706", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>{"\u2212 JOD " + fmtCompact(d.value)}</span></div>))}<div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0 0", borderTop: "1px dashed " + c.borderSoft, marginTop: "4px" }}><span style={{ color: c.text, fontWeight: 600 }}>{"Net FX sources \u00b7 AST01"}</span><span style={{ fontWeight: 700, color: c.primary, fontVariantNumeric: "tabular-nums" }}>{exec.fundingNet !== null ? "JOD " + fmtCompact(exec.fundingNet) : "\u2014"}</span></div></div></Panel>)}
              {exec.investTypes.length > 0 && (<Panel title="Investment portfolio by type" c={c}><div style={{ display: "flex", alignItems: "center", gap: "18px" }}><Donut items={exec.investTypes} size={120} c={c} centerVal={fmtCompact(exec.investTotal)} centerLab="book value" /><div style={{ flex: 1, minWidth: 0 }}><Legend items={exec.investTypes} c={c} /></div></div></Panel>)}
              {exec.fxUse.length > 0 && (<Panel title="Use of FX funds (% of net sources)" c={c}><HBars items={exec.fxUse} c={c} pct={true} /></Panel>)}
              {exec.moneyMarket.length > 0 && (<Panel title="Money-market placements" c={c}><HBars items={exec.moneyMarket} c={c} /></Panel>)}
              {exec.currencies.length > 0 && (<Panel title="Net open FX position by currency" c={c}><HBars items={exec.currencies.map((cc, i) => ({ label: cc.cur, value: cc.net, color: PALETTE[i % PALETTE.length] }))} c={c} signed={true} /></Panel>)}
            </div>

            <div style={{ background: c.surface, border: "1px solid " + c.border, borderRadius: "14px", padding: "16px 18px", marginBottom: "22px" }}>
              <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "12px" }}>Form coverage</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {exec.coverage.map((cv) => { const col = !cv.present ? c.faint : cv.nil ? "#ff9500" : "#34c759"; const bgc = !cv.present ? c.surfaceAlt : cv.nil ? (dark ? "rgba(255,149,0,0.13)" : "#fff7ed") : (dark ? "rgba(52,199,89,0.13)" : "#ecfdf5"); return (<span key={cv.code} style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: bgc, border: "1px solid " + (dark ? c.border : "transparent"), borderRadius: "8px", padding: "5px 10px", fontSize: "12px", fontWeight: 600, color: cv.present ? c.text : c.faint }}><span style={{ width: "7px", height: "7px", borderRadius: "999px", background: col }} />{cv.code}<span style={{ fontWeight: 500, color: c.faint }}>{!cv.present ? "missing" : cv.nil ? "nil" : "loaded"}</span></span>); })}
              </div>
            </div>

            {openDetail && (
              <div style={{ background: c.surface, border: "1px solid " + c.primary, borderRadius: "14px", overflow: "hidden", marginBottom: "10px" }}>
                <div style={{ padding: "14px 18px", borderBottom: "1px solid " + c.border, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div><span style={{ fontSize: "14px", fontWeight: 600 }}>{openDetail.code + "  " + openDetail.titleEn}</span>{openDetail.currency && <span style={{ fontSize: "12px", color: c.faint, marginLeft: "8px" }}>{openDetail.currency}</span>}</div>
                  <span onClick={() => setOpenForm(null)} style={{ fontSize: "13px", color: c.faint, cursor: "pointer" }}>Close</span>
                </div>
                {openDetail.isNil ? (<div style={{ padding: "16px 18px", fontSize: "13px", color: c.sub }}>Nil return \u2014 no figures reported on this form for {openDetail.period || "this period"}.</div>) : (
                  <div>{openDetail.holdings && (<div style={{ padding: "12px 18px", borderBottom: "1px solid " + c.borderSoft, fontSize: "13px" }}>Portfolio: <strong>{openDetail.holdings.count}</strong> holdings, book value <strong>JOD {fmtFull(openDetail.holdings.total)}</strong></div>)}
                    {openDetail.money.slice(0, 14).map((f, i) => (<div key={i} style={{ display: "flex", justifyContent: "space-between", gap: "12px", padding: "9px 18px", borderBottom: i < Math.min(14, openDetail.money.length) - 1 ? "1px solid " + c.borderSoft : "none", background: i % 2 ? c.surfaceAlt : c.surface }}><span dir="rtl" style={{ fontSize: "13px", color: c.sub, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>{f.label}</span><span style={{ fontSize: "13px", fontWeight: 600, fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>{fmtFull(f.value)}</span></div>))}
                  </div>)}
              </div>
            )}
            {!openDetail && <div style={{ fontSize: "12px", color: c.faint, textAlign: "center", padding: "4px" }}>Tap any form chip above to inspect its individual figures.</div>}
          </div>
        )}
      </div>
    </div>
  );
}
