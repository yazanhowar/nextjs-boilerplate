"use client";

import { useState, useEffect, useRef, useCallback, type ChangeEvent } from "react";

type XLSXLib = {
  version: string;
  read: (data: ArrayBuffer, opts: object) => { SheetNames: string[]; Sheets: Record<string, object> };
  utils: { sheet_to_json: (ws: object, opts: object) => unknown[][] };
};

type SheetData = {
  name: string;
  rows: number;
  cols: number;
  aoa: unknown[][];
};

type ParsedFile = {
  fileName: string;
  sizeKB: number;
  totalRows: number;
  sheets: SheetData[];
};

const XLSX_SRC = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
const MAX_PREVIEW_ROWS = 200;
const MAX_PREVIEW_COLS = 40;

function getXLSX(): XLSXLib | undefined {
  return (window as unknown as { XLSX?: XLSXLib }).XLSX;
}

function loadXLSX(): Promise<XLSXLib> {
  return new Promise((resolve, reject) => {
    const ready = getXLSX();
    if (ready) {
      resolve(ready);
      return;
    }
    const existing = document.querySelector("script[data-xlsx-engine='1']") as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => {
        const x = getXLSX();
        if (x) resolve(x);
        else reject(new Error("The spreadsheet engine did not initialize."));
      });
      existing.addEventListener("error", () => reject(new Error("Could not load the spreadsheet engine.")));
      return;
    }
    const s = document.createElement("script");
    s.src = XLSX_SRC;
    s.setAttribute("data-xlsx-engine", "1");
    s.onload = () => {
      const x = getXLSX();
      if (x) resolve(x);
      else reject(new Error("The spreadsheet engine did not initialize."));
    };
    s.onerror = () => reject(new Error("Could not load the spreadsheet engine."));
    document.head.appendChild(s);
  });
}

function colLabel(n: number): string {
  let s = "";
  let x = n;
  while (x >= 0) {
    s = String.fromCharCode(65 + (x % 26)) + s;
    x = Math.floor(x / 26) - 1;
  }
  return s;
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
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    try {
      const t = localStorage.getItem("theme") || localStorage.getItem("hbtf-theme");
      setDark(t === "dark");
    } catch (e) {
      // localStorage unavailable; keep default
    }
    loadXLSX().catch(() => {});
  }, []);

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    setParsed(null);
    setActiveSheet(0);
    setBusy(true);
    try {
      if (!/\.(xlsx|xls)$/i.test(file.name)) {
        throw new Error("That file is not a spreadsheet. Please upload an .xlsx or .xls file.");
      }
      const XLSX = await loadXLSX();
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array", cellDates: true });
      let total = 0;
      const sheets: SheetData[] = wb.SheetNames.map((nm) => {
        const ws = wb.Sheets[nm];
        const aoa = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null, blankrows: false });
        let cols = 0;
        for (let i = 0; i < aoa.length; i++) {
          const r = aoa[i];
          if (r && r.length > cols) cols = r.length;
        }
        total += aoa.length;
        return { name: nm, rows: aoa.length, cols, aoa };
      });
      setParsed({
        fileName: file.name,
        sizeKB: Math.max(1, Math.round(file.size / 1024)),
        totalRows: total,
        sheets,
      });
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

  const reset = () => {
    setParsed(null);
    setError(null);
    setActiveSheet(0);
  };

  const c = dark
    ? {
        bg: "#0f1115",
        surface: "#16191f",
        surfaceAlt: "#1b1f27",
        border: "#262b34",
        borderSoft: "#1f242c",
        text: "#f1f5f9",
        sub: "#94a3b8",
        faint: "#64748b",
        primary: "#3b82f6",
        primaryText: "#ffffff",
        primarySoft: "rgba(59,130,246,0.14)",
        thBg: "#1f2430",
        rowAlt: "#191d24",
        dropBg: "#14171d",
        dropBorder: "#2c333f",
      }
    : {
        bg: "#f2f4f7",
        surface: "#ffffff",
        surfaceAlt: "#f8fafc",
        border: "#e2e8f0",
        borderSoft: "#eef2f6",
        text: "#0f172a",
        sub: "#64748b",
        faint: "#94a3b8",
        primary: "#0a4a8f",
        primaryText: "#ffffff",
        primarySoft: "rgba(10,74,143,0.07)",
        thBg: "#f1f5f9",
        rowAlt: "#f8fafc",
        dropBg: "#ffffff",
        dropBorder: "#cbd5e1",
      };

  const sheet = parsed ? parsed.sheets[activeSheet] : null;
  const previewRows = sheet ? sheet.aoa.slice(0, MAX_PREVIEW_ROWS) : [];
  const previewCols = sheet ? Math.min(sheet.cols, MAX_PREVIEW_COLS) : 0;
  const colIdxs: number[] = [];
  for (let i = 0; i < previewCols; i++) colIdxs.push(i);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: c.bg,
        color: c.text,
        fontFamily: "Inter, system-ui, -apple-system, sans-serif",
      }}
    >
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          background: c.surface,
          borderBottom: "1px solid " + c.border,
          padding: "14px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "11px",
              background: "#0a4a8f",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: "15px",
              letterSpacing: "0.3px",
            }}
          >
            cf
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "16px", lineHeight: "1.1" }}>convo.finance</div>
            <div style={{ fontSize: "12px", color: c.sub, marginTop: "2px" }}>Jordanian Banking Intelligence</div>
          </div>
        </div>
        <a
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "7px",
            textDecoration: "none",
            color: c.sub,
            fontSize: "13px",
            fontWeight: 600,
            padding: "8px 14px",
            borderRadius: "9px",
            border: "1px solid " + c.border,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" />
            <path d="M12 19l-7-7 7-7" />
          </svg>
          Dashboard
        </a>
      </div>

      <div style={{ maxWidth: "1080px", margin: "0 auto", padding: "32px 24px 64px" }}>
        <div style={{ marginBottom: "24px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "7px",
              fontSize: "12px",
              fontWeight: 600,
              color: c.primary,
              background: c.primarySoft,
              padding: "5px 11px",
              borderRadius: "999px",
              marginBottom: "14px",
            }}
          >
            <span style={{ width: "6px", height: "6px", borderRadius: "999px", background: c.primary, display: "inline-block" }} />
            CBJ Regulatory Reporting
          </div>
          <h1 style={{ fontSize: "26px", fontWeight: 700, margin: "0 0 8px" }}>Report Upload</h1>
          <p style={{ fontSize: "15px", color: c.sub, margin: 0, maxWidth: "680px", lineHeight: "1.5" }}>
            Upload a regulatory report in Excel format. convo.finance reads and structures every sheet on the spot. Once the report schema
            is mapped, the same upload generates dashboards and analytics automatically.
          </p>
        </div>

        {error && (
          <div
            style={{
              background: dark ? "rgba(220,38,38,0.12)" : "#fef2f2",
              border: "1px solid " + (dark ? "rgba(220,38,38,0.4)" : "#fecaca"),
              color: dark ? "#fca5a5" : "#b91c1c",
              padding: "14px 16px",
              borderRadius: "12px",
              fontSize: "14px",
              marginBottom: "20px",
              display: "flex",
              gap: "10px",
              alignItems: "flex-start",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: "1px" }}>
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4" />
              <path d="M12 16h.01" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {!parsed && (
          <div
            onClick={() => inputRef.current && inputRef.current.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const f = e.dataTransfer.files && e.dataTransfer.files[0];
              if (f) handleFile(f);
            }}
            style={{
              border: "2px dashed " + (dragOver ? c.primary : c.dropBorder),
              background: dragOver ? c.primarySoft : c.dropBg,
              borderRadius: "16px",
              padding: "52px 24px",
              textAlign: "center",
              cursor: "pointer",
              transition: "border-color 0.15s, background 0.15s",
            }}
          >
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "14px",
                background: c.primarySoft,
                color: c.primary,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
              }}
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <path d="M17 8l-5-5-5 5" />
                <path d="M12 3v12" />
              </svg>
            </div>
            <div style={{ fontSize: "16px", fontWeight: 600, marginBottom: "6px" }}>
              {busy ? "Reading your file..." : "Drop an Excel report here, or click to browse"}
            </div>
            <div style={{ fontSize: "13px", color: c.sub }}>Supports .xlsx and .xls files</div>
            <input ref={inputRef} type="file" accept=".xlsx,.xls" onChange={onInputChange} style={{ display: "none" }} />
          </div>
        )}

        {parsed && sheet && (
          <div>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "12px",
                alignItems: "center",
                justifyContent: "space-between",
                background: c.surface,
                border: "1px solid " + c.border,
                borderRadius: "14px",
                padding: "16px 18px",
                marginBottom: "18px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "13px", minWidth: 0 }}>
                <div
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "10px",
                    background: dark ? "rgba(16,185,129,0.15)" : "#ecfdf5",
                    color: dark ? "#34d399" : "#059669",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <path d="M14 2v6h6" />
                  </svg>
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: "15px", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {parsed.fileName}
                  </div>
                  <div style={{ fontSize: "12px", color: c.sub, marginTop: "2px" }}>{parsed.sizeKB} KB</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: "26px", alignItems: "center" }}>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "19px", fontWeight: 700 }}>{parsed.sheets.length}</div>
                  <div style={{ fontSize: "11px", color: c.sub, textTransform: "uppercase", letterSpacing: "0.5px" }}>Sheets</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "19px", fontWeight: 700 }}>{parsed.totalRows.toLocaleString()}</div>
                  <div style={{ fontSize: "11px", color: c.sub, textTransform: "uppercase", letterSpacing: "0.5px" }}>Rows</div>
                </div>
                <button
                  onClick={reset}
                  style={{
                    background: c.primary,
                    color: c.primaryText,
                    border: "none",
                    borderRadius: "9px",
                    padding: "10px 16px",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  Upload another
                </button>
              </div>
            </div>

            {parsed.sheets.length > 1 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "14px" }}>
                {parsed.sheets.map((s, i) => {
                  const on = i === activeSheet;
                  return (
                    <button
                      key={i}
                      onClick={() => setActiveSheet(i)}
                      style={{
                        background: on ? c.primary : c.surface,
                        color: on ? c.primaryText : c.sub,
                        border: "1px solid " + (on ? c.primary : c.border),
                        borderRadius: "999px",
                        padding: "7px 15px",
                        fontSize: "13px",
                        fontWeight: 600,
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      {s.name}
                      <span style={{ opacity: 0.7, marginLeft: "7px", fontWeight: 500 }}>
                        {s.rows} x {s.cols}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            <div style={{ background: c.surface, border: "1px solid " + c.border, borderRadius: "14px", overflow: "hidden" }}>
              <div
                style={{
                  padding: "13px 18px",
                  borderBottom: "1px solid " + c.border,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ fontSize: "14px", fontWeight: 600 }}>{sheet.name}</div>
                <div style={{ fontSize: "12px", color: c.sub }}>
                  {sheet.rows} rows, {sheet.cols} columns
                </div>
              </div>
              <div style={{ overflowX: "auto", maxHeight: "560px", overflowY: "auto" }}>
                <table style={{ borderCollapse: "collapse", width: "100%", fontSize: "13px" }}>
                  <thead>
                    <tr>
                      <th
                        style={{
                          position: "sticky",
                          top: 0,
                          left: 0,
                          zIndex: 3,
                          background: c.thBg,
                          borderBottom: "1px solid " + c.border,
                          borderRight: "1px solid " + c.border,
                          minWidth: "44px",
                        }}
                      />
                      {colIdxs.map((ci) => (
                        <th
                          key={ci}
                          style={{
                            position: "sticky",
                            top: 0,
                            zIndex: 2,
                            background: c.thBg,
                            color: c.faint,
                            fontWeight: 600,
                            padding: "8px 12px",
                            borderBottom: "1px solid " + c.border,
                            borderRight: "1px solid " + c.borderSoft,
                            textAlign: "left",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {colLabel(ci)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, ri) => (
                      <tr key={ri} style={{ background: ri % 2 ? c.rowAlt : c.surface }}>
                        <td
                          style={{
                            position: "sticky",
                            left: 0,
                            zIndex: 1,
                            background: ri % 2 ? c.rowAlt : c.surface,
                            color: c.faint,
                            fontWeight: 600,
                            padding: "7px 10px",
                            borderRight: "1px solid " + c.border,
                            borderBottom: "1px solid " + c.borderSoft,
                            textAlign: "center",
                          }}
                        >
                          {ri + 1}
                        </td>
                        {colIdxs.map((ci) => {
                          const val = (row as unknown[])[ci];
                          return (
                            <td
                              key={ci}
                              title={fmtCell(val)}
                              style={{
                                padding: "7px 12px",
                                borderBottom: "1px solid " + c.borderSoft,
                                borderRight: "1px solid " + c.borderSoft,
                                whiteSpace: "nowrap",
                                maxWidth: "320px",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                textAlign: typeof val === "number" ? "right" : "left",
                                fontVariantNumeric: "tabular-nums",
                              }}
                            >
                              {fmtCell(val)}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {(sheet.rows > MAX_PREVIEW_ROWS || sheet.cols > MAX_PREVIEW_COLS) && (
                <div
                  style={{
                    padding: "10px 18px",
                    borderTop: "1px solid " + c.border,
                    fontSize: "12px",
                    color: c.sub,
                    background: c.surfaceAlt,
                  }}
                >
                  Showing first {Math.min(sheet.rows, MAX_PREVIEW_ROWS)} of {sheet.rows} rows
                  {sheet.cols > MAX_PREVIEW_COLS ? " and first " + MAX_PREVIEW_COLS + " of " + sheet.cols + " columns" : ""}. The full file is read into memory.
                </div>
              )}
            </div>

            <div
              style={{
                marginTop: "18px",
                padding: "13px 16px",
                background: c.surfaceAlt,
                border: "1px solid " + c.border,
                borderRadius: "12px",
                fontSize: "13px",
                color: c.sub,
                display: "flex",
                gap: "9px",
                alignItems: "flex-start",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: "1px", color: c.primary }}>
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4" />
                <path d="M12 8h.01" />
              </svg>
              <span>
                Reading stage. The report is parsed and verified above. Dashboard and analytics generation activates once the report schema
                is mapped to convo.finance.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
