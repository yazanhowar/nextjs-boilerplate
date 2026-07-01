'use client';
import React, { useState, useEffect } from 'react';

const CSS = "*{box-sizing:border-box}.sk-wrap{min-height:100vh;background:var(--bg-primary);color:var(--text-primary);font-family:var(--font-ibm-sans),-apple-system,system-ui,sans-serif}.sk-header{position:sticky;top:0;z-index:30;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:11px 22px;background:var(--bg-card);border-bottom:1px solid var(--border)}.sk-brand{display:flex;align-items:center;gap:10px;text-decoration:none;color:inherit;cursor:pointer;flex-shrink:0}.sk-logo{width:30px;height:30px;border-radius:8px;background:linear-gradient(135deg,#0A3A6B,#0E5AA0);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:12px;letter-spacing:-.5px}.sk-bt{display:flex;flex-direction:column;line-height:1.12}.sk-bn{font-weight:700;font-size:14px}.sk-bs{font-size:11px;color:var(--text-muted)}.sk-nav{display:flex;align-items:center;gap:4px;flex:1;justify-content:center}.sk-navlink{padding:7px 15px;border-radius:8px;font-size:13px;font-weight:600;color:var(--text-secondary);text-decoration:none;cursor:pointer;transition:all .15s;white-space:nowrap}.sk-navlink:hover{background:var(--bg-hover);color:var(--text-primary)}.sk-navlink.on{background:#0E5AA0;color:#fff}.sk-tools{display:flex;align-items:center;gap:8px;flex-shrink:0}.sk-tbtn{border:1px solid var(--border);background:var(--bg-card);color:var(--text-secondary);border-radius:8px;padding:7px 11px;font-size:12px;font-weight:600;cursor:pointer;transition:all .15s}.sk-tbtn:hover{border-color:#0E5AA0;color:#0E5AA0}.sk-main{max-width:1240px;margin:0 auto;padding:26px 24px 60px}.sk-back{display:inline-flex;align-items:center;gap:6px;font-size:13px;font-weight:600;color:var(--text-secondary);text-decoration:none;cursor:pointer;margin-bottom:16px}.sk-back:hover{color:#0E5AA0}.sk-eyebrow{font-size:12px;font-weight:700;letter-spacing:1.1px;color:#B08D4F;text-transform:uppercase;margin-bottom:8px}.sk-title{font-size:29px;font-weight:800;letter-spacing:-.7px;margin:0 0 8px}.sk-sub{font-size:15px;color:var(--text-secondary);max-width:660px;margin:0 0 14px;line-height:1.5}.sk-asof{display:inline-flex;align-items:center;gap:8px;font-size:12px;font-weight:600;color:var(--text-secondary);background:var(--bg-card);border:1px solid var(--border);border-radius:20px;padding:5px 13px}.sk-livedot{width:7px;height:7px;border-radius:50%;background:#16A34A;box-shadow:0 0 0 3px rgba(22,163,74,.16)}.sk-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin:22px 0}.sk-kpi{background:var(--bg-card);border:1px solid var(--border);border-radius:14px;padding:15px 16px 12px;position:relative;overflow:hidden}.sk-kpi::before{content:'';position:absolute;top:0;inset-inline:0;height:3px;background:var(--acc,#0E5AA0)}.sk-kl{font-size:11.5px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.4px;margin-bottom:9px}.sk-kv{display:flex;align-items:baseline;gap:6px}.sk-kvn{font-size:27px;font-weight:800;letter-spacing:-.6px;font-variant-numeric:tabular-nums}.sk-ku{font-size:12px;font-weight:600;color:var(--text-muted)}.sk-kd{display:inline-flex;align-items:center;gap:4px;font-size:12px;font-weight:700;margin-top:7px}.sk-up{color:#16A34A}.sk-down{color:#DC2626}.sk-ksp{margin-top:8px;height:32px}.sk-grid{display:grid;grid-template-columns:1.9fr 1fr;gap:16px;margin-bottom:16px}.sk-g2{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px}.sk-card{background:var(--bg-card);border:1px solid var(--border);border-radius:16px;padding:18px 20px 16px;display:flex;flex-direction:column}.sk-ch{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:14px}.sk-ct{font-size:15px;font-weight:700;margin:0}.sk-cs{font-size:12px;color:var(--text-muted);margin-top:3px}.sk-cb{text-align:end;flex-shrink:0}.sk-cbn{font-size:20px;font-weight:800;font-variant-numeric:tabular-nums;letter-spacing:-.4px}.sk-cbd{font-size:12px;font-weight:700;margin-top:2px}.sk-chart{width:100%;height:148px;position:relative}.sk-chart svg{display:block;width:100%;height:100%}.sk-chart.tall{height:210px}.sk-xax{display:flex;justify-content:space-between;margin-top:9px;font-size:11px;color:var(--text-muted);font-weight:500}.sk-leg{display:flex;gap:18px;flex-wrap:wrap;margin-top:13px}.sk-li{display:flex;align-items:center;gap:7px;font-size:12.5px;font-weight:600;color:var(--text-secondary)}.sk-ld{width:11px;height:11px;border-radius:3px}.sk-bars{display:flex;flex-direction:column;gap:15px;margin-top:6px}.sk-br{display:flex;flex-direction:column;gap:7px}.sk-brt{display:flex;align-items:center;justify-content:space-between}.sk-brl{font-size:13px;font-weight:600;color:var(--text-secondary)}.sk-brv{font-size:15px;font-weight:800;font-variant-numeric:tabular-nums}.sk-brk{height:9px;border-radius:6px;background:var(--bg-hover);overflow:hidden}.sk-brf{height:100%;border-radius:6px;transition:width .6s cubic-bezier(.2,.8,.2,1)}.sk-chat{background:var(--bg-card);border:1px solid var(--border);border-radius:18px;padding:22px;margin-top:8px}.sk-chq{display:flex;align-items:center;gap:12px;margin-bottom:16px}.sk-chi{width:40px;height:40px;border-radius:11px;background:linear-gradient(135deg,#0A3A6B,#0E5AA0);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:14px;flex-shrink:0}.sk-cht{font-size:16px;font-weight:700;margin:0}.sk-chs{font-size:12px;color:var(--text-muted);margin-top:2px}.sk-pr{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px}.sk-prb{border:1px solid var(--border);background:var(--bg-primary);color:var(--text-secondary);border-radius:20px;padding:8px 14px;font-size:13px;font-weight:500;cursor:pointer;transition:all .15s;text-align:start}.sk-prb:hover{border-color:#0E5AA0;color:#0E5AA0;background:var(--bg-hover)}.sk-ms{display:flex;flex-direction:column;gap:12px;margin-bottom:16px}.sk-m{max-width:88%;padding:12px 16px;border-radius:14px;font-size:14px;line-height:1.55}.sk-mu{align-self:flex-end;background:#0E5AA0;color:#fff;border-bottom-right-radius:4px}.sk-mb{align-self:flex-start;background:var(--bg-primary);border:1px solid var(--border);color:var(--text-primary);border-bottom-left-radius:4px}.sk-mb strong{font-weight:700}.sk-typ{display:inline-flex;gap:4px;align-items:center;padding:4px 2px}.sk-typ span{width:7px;height:7px;border-radius:50%;background:var(--text-muted);animation:skb 1.2s infinite}.sk-typ span:nth-child(2){animation-delay:.2s}.sk-typ span:nth-child(3){animation-delay:.4s}@keyframes skb{0%,60%,100%{opacity:.3;transform:translateY(0)}30%{opacity:1;transform:translateY(-3px)}}.sk-ir{display:flex;gap:10px;align-items:flex-end}.sk-in{flex:1;border:1px solid var(--border);background:var(--bg-primary);color:var(--text-primary);border-radius:12px;padding:13px 15px;font-size:14px;font-family:inherit;resize:none;outline:none;transition:border-color .15s;max-height:120px}.sk-in:focus{border-color:#0E5AA0}.sk-snd{border:none;background:#0E5AA0;color:#fff;border-radius:12px;padding:13px 22px;font-size:14px;font-weight:700;cursor:pointer;transition:background .15s;flex-shrink:0}.sk-snd:hover{background:#0A4585}.sk-snd:disabled{opacity:.5;cursor:not-allowed}.sk-ft{text-align:center;font-size:12px;color:var(--text-muted);margin-top:30px;padding-top:20px;border-top:1px solid var(--border)}.sk-sk{background:var(--bg-hover);border-radius:10px;animation:skp 1.5s infinite}@keyframes skp{0%,100%{opacity:.55}50%{opacity:.85}}@media(max-width:960px){.sk-kpis{grid-template-columns:repeat(2,1fr)}.sk-grid{grid-template-columns:1fr}.sk-g2{grid-template-columns:1fr}.sk-nav{display:none}}@media(max-width:560px){.sk-kpis{grid-template-columns:1fr}.sk-title{font-size:23px}.sk-main{padding:20px 16px 48px}}";

const T: any = {
  en: {
    bn: "convo.finance", bs: "Sector Intelligence", langLabel: "العربية",
    back: "Dashboard", navFin: "Financials", navSector: "Sector", navCbj: "CBJ Reports",
    eyebrow: "ABJ \u00B7 Sector Aggregate", title: "Jordanian Banking Sector",
    sub: "Aggregate performance across all 15 licensed banks, published monthly by the Association of Banks in Jordan.",
    asOf: "As of", of15: "15 licensed banks",
    kAssets: "Total Assets", kDeposits: "Total Deposits", kCredit: "Credit Facilities", kC2D: "Credit-to-Deposit",
    yoy: "YoY", unitBn: "JOD bn", vsYr: "vs. year ago",
    cGrowthT: "Sector Growth Trajectory", cGrowthS: "Assets, deposits & credit facilities \u00B7 34 months",
    cAssetsT: "Total Assets", cAssetsS: "Monthly, JOD billion",
    cIntT: "Deposits vs. Credit Deployment", cIntS: "Funding base against lending \u00B7 JOD billion",
    cRatioT: "Credit-to-Deposit Ratio", cRatioS: "Intermediation intensity over time",
    cYoyT: "Annual Growth by Metric", cYoyS: "Year-over-year change, latest period",
    lgAssets: "Assets", lgDeposits: "Deposits", lgCredit: "Credit",
    chatT: "Ask ZAD about the sector", chatS: "Grounded analysis from live ABJ figures",
    prompts: ["What is driving deposit growth in the sector?", "Is credit growth keeping pace with deposits?", "How has intermediation shifted over the last year?", "Summarise the sector outlook for a board briefing."],
    ph: "Ask about sector trends, growth drivers, intermediation\u2026", send: "Ask",
    thinking: "ZAD is analysing the sector\u2026", err: "Something went wrong. Please try again.",
    source: "Source: Association of Banks in Jordan \u00B7 Monthly Statistical Bulletin", loadErr: "Unable to load sector data."
  },
  ar: {
    bn: "convo.finance", bs: "\u0630\u0643\u0627\u0621 \u0627\u0644\u0642\u0637\u0627\u0639", langLabel: "English",
    back: "\u0627\u0644\u0631\u0626\u064A\u0633\u064A\u0629", navFin: "\u0627\u0644\u0645\u0627\u0644\u064A\u0629", navSector: "\u0627\u0644\u0642\u0637\u0627\u0639", navCbj: "\u062A\u0642\u0627\u0631\u064A\u0631 \u0627\u0644\u0628\u0646\u0643 \u0627\u0644\u0645\u0631\u0643\u0632\u064A",
    eyebrow: "\u062C\u0645\u0639\u064A\u0629 \u0627\u0644\u0628\u0646\u0648\u0643 \u00B7 \u0645\u0624\u0634\u0631\u0627\u062A \u0627\u0644\u0642\u0637\u0627\u0639", title: "\u0627\u0644\u0642\u0637\u0627\u0639 \u0627\u0644\u0645\u0635\u0631\u0641\u064A \u0627\u0644\u0623\u0631\u062F\u0646\u064A",
    sub: "\u0627\u0644\u0623\u062F\u0627\u0621 \u0627\u0644\u0625\u062C\u0645\u0627\u0644\u064A \u0644\u062C\u0645\u064A\u0639 \u0627\u0644\u0628\u0646\u0648\u0643 \u0627\u0644\u0645\u0631\u062E\u0651\u0635\u0629 \u0627\u0644\u062E\u0645\u0633\u0629 \u0639\u0634\u0631\u060C \u062A\u0635\u062F\u0631\u0647\u0627 \u0634\u0647\u0631\u064A\u0627\u064B \u062C\u0645\u0639\u064A\u0629 \u0627\u0644\u0628\u0646\u0648\u0643 \u0641\u064A \u0627\u0644\u0623\u0631\u062F\u0646.",
    asOf: "\u062D\u062A\u0649 \u062A\u0627\u0631\u064A\u062E", of15: "\u0661\u0665 \u0628\u0646\u0643\u0627\u064B \u0645\u0631\u062E\u0651\u0635\u0627\u064B",
    kAssets: "\u0625\u062C\u0645\u0627\u0644\u064A \u0627\u0644\u0645\u0648\u062C\u0648\u062F\u0627\u062A", kDeposits: "\u0625\u062C\u0645\u0627\u0644\u064A \u0627\u0644\u0648\u062F\u0627\u0626\u0639", kCredit: "\u0627\u0644\u062A\u0633\u0647\u064A\u0644\u0627\u062A \u0627\u0644\u0627\u0626\u062A\u0645\u0627\u0646\u064A\u0629", kC2D: "\u0627\u0644\u062A\u0633\u0647\u064A\u0644\u0627\u062A / \u0627\u0644\u0648\u062F\u0627\u0626\u0639",
    yoy: "\u0633\u0646\u0648\u064A\u0627\u064B", unitBn: "\u0645\u0644\u064A\u0627\u0631 \u062F.\u0623", vsYr: "\u0645\u0642\u0627\u0631\u0646\u0629 \u0628\u0627\u0644\u0639\u0627\u0645 \u0627\u0644\u0633\u0627\u0628\u0642",
    cGrowthT: "\u0645\u0633\u0627\u0631 \u0646\u0645\u0648 \u0627\u0644\u0642\u0637\u0627\u0639", cGrowthS: "\u0627\u0644\u0645\u0648\u062C\u0648\u062F\u0627\u062A \u0648\u0627\u0644\u0648\u062F\u0627\u0626\u0639 \u0648\u0627\u0644\u062A\u0633\u0647\u064A\u0644\u0627\u062A \u00B7 \u0663\u0664 \u0634\u0647\u0631\u0627\u064B",
    cAssetsT: "\u0625\u062C\u0645\u0627\u0644\u064A \u0627\u0644\u0645\u0648\u062C\u0648\u062F\u0627\u062A", cAssetsS: "\u0634\u0647\u0631\u064A\u0627\u064B\u060C \u0645\u0644\u064A\u0627\u0631 \u062F.\u0623",
    cIntT: "\u0627\u0644\u0648\u062F\u0627\u0626\u0639 \u0645\u0642\u0627\u0628\u0644 \u0627\u0644\u062A\u0633\u0647\u064A\u0644\u0627\u062A", cIntS: "\u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u062A\u0645\u0648\u064A\u0644 \u0645\u0642\u0627\u0628\u0644 \u0627\u0644\u0625\u0642\u0631\u0627\u0636 \u00B7 \u0645\u0644\u064A\u0627\u0631 \u062F.\u0623",
    cRatioT: "\u0646\u0633\u0628\u0629 \u0627\u0644\u062A\u0633\u0647\u064A\u0644\u0627\u062A \u0625\u0644\u0649 \u0627\u0644\u0648\u062F\u0627\u0626\u0639", cRatioS: "\u0643\u062B\u0627\u0641\u0629 \u0627\u0644\u0648\u0633\u0627\u0637\u0629 \u0639\u0628\u0631 \u0627\u0644\u0632\u0645\u0646",
    cYoyT: "\u0627\u0644\u0646\u0645\u0648 \u0627\u0644\u0633\u0646\u0648\u064A \u062D\u0633\u0628 \u0627\u0644\u0645\u0624\u0634\u0631", cYoyS: "\u0627\u0644\u062A\u063A\u064A\u0651\u0631 \u0627\u0644\u0633\u0646\u0648\u064A\u060C \u0622\u062E\u0631 \u0641\u062A\u0631\u0629",
    lgAssets: "\u0627\u0644\u0645\u0648\u062C\u0648\u062F\u0627\u062A", lgDeposits: "\u0627\u0644\u0648\u062F\u0627\u0626\u0639", lgCredit: "\u0627\u0644\u062A\u0633\u0647\u064A\u0644\u0627\u062A",
    chatT: "\u0627\u0633\u0623\u0644 \u0632\u0627\u062F \u0639\u0646 \u0627\u0644\u0642\u0637\u0627\u0639", chatS: "\u062A\u062D\u0644\u064A\u0644 \u0645\u0648\u062B\u0651\u0642 \u0645\u0646 \u0623\u0631\u0642\u0627\u0645 \u062C\u0645\u0639\u064A\u0629 \u0627\u0644\u0628\u0646\u0648\u0643",
    prompts: ["\u0645\u0627 \u0627\u0644\u0630\u064A \u064A\u062F\u0641\u0639 \u0646\u0645\u0648 \u0627\u0644\u0648\u062F\u0627\u0626\u0639 \u0641\u064A \u0627\u0644\u0642\u0637\u0627\u0639\u061F", "\u0647\u0644 \u064A\u0648\u0627\u0643\u0628 \u0646\u0645\u0648 \u0627\u0644\u0627\u0626\u062A\u0645\u0627\u0646 \u0646\u0645\u0648 \u0627\u0644\u0648\u062F\u0627\u0626\u0639\u061F", "\u0643\u064A\u0641 \u062A\u063A\u064A\u0651\u0631\u062A \u0627\u0644\u0648\u0633\u0627\u0637\u0629 \u062E\u0644\u0627\u0644 \u0627\u0644\u0639\u0627\u0645 \u0627\u0644\u0645\u0627\u0636\u064A\u061F", "\u0644\u062E\u0651\u0635 \u0622\u0641\u0627\u0642 \u0627\u0644\u0642\u0637\u0627\u0639 \u0644\u0625\u064A\u062C\u0627\u0632 \u0644\u0645\u062C\u0644\u0633 \u0627\u0644\u0625\u062F\u0627\u0631\u0629."],
    ph: "\u0627\u0633\u0623\u0644 \u0639\u0646 \u0627\u062A\u062C\u0627\u0647\u0627\u062A \u0627\u0644\u0642\u0637\u0627\u0639 \u0648\u0645\u062D\u0631\u0643\u0627\u062A \u0627\u0644\u0646\u0645\u0648\u2026", send: "\u0627\u0633\u0623\u0644",
    thinking: "\u0632\u0627\u062F \u064A\u062D\u0644\u0651\u0644 \u0627\u0644\u0642\u0637\u0627\u0639\u2026", err: "\u062D\u062F\u062B \u062E\u0637\u0623. \u064A\u0631\u062C\u0649 \u0627\u0644\u0645\u062D\u0627\u0648\u0644\u0629 \u0645\u062C\u062F\u062F\u0627\u064B.",
    source: "\u0627\u0644\u0645\u0635\u062F\u0631: \u062C\u0645\u0639\u064A\u0629 \u0627\u0644\u0628\u0646\u0648\u0643 \u0641\u064A \u0627\u0644\u0623\u0631\u062F\u0646 \u00B7 \u0627\u0644\u0646\u0634\u0631\u0629 \u0627\u0644\u0625\u062D\u0635\u0627\u0626\u064A\u0629 \u0627\u0644\u0634\u0647\u0631\u064A\u0629", loadErr: "\u062A\u0639\u0630\u0651\u0631 \u062A\u062D\u0645\u064A\u0644 \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0642\u0637\u0627\u0639."
  }
};

function callMcp(name: string) {
  return fetch('/api/mcp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: name, arguments: {} } }) })
    .then(function (r) { return r.json(); })
    .then(function (j) { var tx = j && j.result && j.result.content && j.result.content[0] && j.result.content[0].text; return tx ? JSON.parse(tx) : null; });
}

function fmt(v: any, dec?: number) {
  if (v == null || isNaN(v)) return '\u2014';
  var d = dec == null ? 2 : dec;
  return Number(v).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
}

function shortPeriod(p: any) {
  if (!p) return '';
  var s = String(p);
  var mo = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  if (s.length >= 7 && s.charAt(4) === '-') { var m = parseInt(s.slice(5, 7), 10); return mo[m] + " '" + s.slice(2, 4); }
  return s;
}

function yoyCalc(series: any[]) {
  if (!series || series.length < 13) return null;
  var latest = series[series.length - 1].value;
  var prior = series[series.length - 13].value;
  if (prior == null || latest == null) return null;
  return { latest: latest, prior: prior, pct: ((latest - prior) / prior) * 100 };
}

function svgArea(pts: any[], color: string, id: string) {
  if (!pts || !pts.length) return '';
  var w = 1000, h = 200, padT = 10, padB = 8;
  var vals = pts.map(function (p) { return p.value; });
  var min = Math.min.apply(null, vals), max = Math.max.apply(null, vals);
  var range = (max - min) || 1, lo = min - range * 0.16, hi = max + range * 0.16, rng = hi - lo, ih = h - padT - padB;
  var X = function (i: number) { return (i / (pts.length - 1)) * w; };
  var Y = function (v: number) { return padT + (1 - (v - lo) / rng) * ih; };
  var line = '';
  for (var i = 0; i < pts.length; i++) { line += (i === 0 ? 'M' : 'L') + X(i).toFixed(1) + ' ' + Y(pts[i].value).toFixed(1) + ' '; }
  var area = line + 'L' + w + ' ' + h + ' L0 ' + h + ' Z';
  var grid = '';
  for (var g = 1; g <= 2; g++) { var gy = (padT + (g / 3) * ih).toFixed(1); grid += '<line x1="0" y1="' + gy + '" x2="' + w + '" y2="' + gy + '" stroke="currentColor" stroke-opacity="0.09" stroke-width="1" vector-effect="non-scaling-stroke"/>'; }
  return '<svg viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">' +
    '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="' + color + '" stop-opacity="0.32"/><stop offset="100%" stop-color="' + color + '" stop-opacity="0.02"/></linearGradient></defs>' +
    grid + '<path d="' + area + '" fill="url(#' + id + ')"/>' +
    '<path d="' + line + '" fill="none" stroke="' + color + '" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg>';
}

function svgSpark(pts: any[], color: string) {
  if (!pts || !pts.length) return '';
  var w = 300, h = 64, pad = 6;
  var vals = pts.map(function (p) { return p.value; });
  var min = Math.min.apply(null, vals), max = Math.max.apply(null, vals);
  var range = (max - min) || 1, ih = h - pad * 2;
  var X = function (i: number) { return (i / (pts.length - 1)) * w; };
  var Y = function (v: number) { return pad + (1 - (v - min) / range) * ih; };
  var line = '';
  for (var i = 0; i < pts.length; i++) { line += (i === 0 ? 'M' : 'L') + X(i).toFixed(1) + ' ' + Y(pts[i].value).toFixed(1) + ' '; }
  return '<svg viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg"><path d="' + line + '" fill="none" stroke="' + color + '" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke" opacity="0.85"/></svg>';
}

function svgMulti(seriesArr: any[], colors: string[]) {
  if (!seriesArr || !seriesArr.length || !seriesArr[0].length) return '';
  var all: number[] = [];
  seriesArr.forEach(function (s) { s.forEach(function (p: any) { all.push(p.value); }); });
  var min = Math.min.apply(null, all), max = Math.max.apply(null, all);
  var range = (max - min) || 1, lo = min - range * 0.06, hi = max + range * 0.06, rng = hi - lo;
  var w = 1000, h = 220, padT = 10, padB = 8, ih = h - padT - padB, n = seriesArr[0].length;
  var X = function (i: number) { return (i / (n - 1)) * w; };
  var Y = function (v: number) { return padT + (1 - (v - lo) / rng) * ih; };
  var grid = '';
  for (var g = 1; g <= 3; g++) { var gy = (padT + (g / 4) * ih).toFixed(1); grid += '<line x1="0" y1="' + gy + '" x2="' + w + '" y2="' + gy + '" stroke="currentColor" stroke-opacity="0.08" stroke-width="1" vector-effect="non-scaling-stroke"/>'; }
  var paths = '';
  for (var k = 0; k < seriesArr.length; k++) {
    var s = seriesArr[k], line = '';
    for (var i = 0; i < s.length; i++) { line += (i === 0 ? 'M' : 'L') + X(i).toFixed(1) + ' ' + Y(s[i].value).toFixed(1) + ' '; }
    paths += '<path d="' + line + '" fill="none" stroke="' + colors[k] + '" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/>';
  }
  return '<svg viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">' + grid + paths + '</svg>';
}

function mdLite(text: any) {
  var t = String(text || '');
  t = t.replace(/```[\s\S]*?```/g, '');
  t = t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  t = t.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  t = t.replace(/\n{2,}/g, '<br/><br/>').replace(/\n/g, '<br/>');
  return t.trim();
}

const C_ASSETS = '#0E5AA0', C_DEP = '#0E9A8F', C_CRED = '#7C6FE8', C_GOLD = '#B08D4F';

export default function SectorPage() {
  var la = useState('en'); var lang = la[0]; var setLang = la[1];
  var dd = useState<any>(null); var data = dd[0]; var setData = dd[1];
  var ll = useState(true); var loading = ll[0]; var setLoading = ll[1];
  var ee = useState(false); var errd = ee[0]; var setErr = ee[1];
  var mm = useState<any[]>([]); var msgs = mm[0]; var setMsgs = mm[1];
  var ii = useState(''); var input = ii[0]; var setInput = ii[1];
  var bb = useState(false); var busy = bb[0]; var setBusy = bb[1];

  useEffect(function () {
    try { var l = localStorage.getItem('lang'); if (l === 'ar' || l === 'en') setLang(l); } catch (e) {}
    callMcp('abj_sector').then(function (res) {
      if (res && res.series) { setData(res); } else { setErr(true); }
      setLoading(false);
    }).catch(function () { setErr(true); setLoading(false); });
  }, []);

  var isAr = lang === 'ar';
  var t = T[lang];

  function toggleLang() {
    var n = isAr ? 'en' : 'ar'; setLang(n);
    try { localStorage.setItem('lang', n); } catch (e) {}
    try { document.documentElement.dir = n === 'ar' ? 'rtl' : 'ltr'; document.documentElement.lang = n; } catch (e) {}
  }
  function toggleTheme() {
    try {
      var isDark = document.documentElement.classList.toggle('dark');
      localStorage.setItem('hbtf-theme', isDark ? 'dark' : 'light');
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
    } catch (e) {}
  }
  function send(q?: string) {
    var question = (q != null ? q : input).trim();
    if (!question || busy) return;
    var next = msgs.concat([{ role: 'user', content: question }]);
    setMsgs(next); setInput(''); setBusy(true);
    fetch('/api/zad', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: next.map(function (m) { return { role: m.role, content: m.content }; }), lang: lang }) })
      .then(function (r) { return r.json(); })
      .then(function (d) { setMsgs(next.concat([{ role: 'assistant', content: (d && d.text) ? d.text : t.err }])); setBusy(false); })
      .catch(function () { setMsgs(next.concat([{ role: 'assistant', content: t.err }])); setBusy(false); });
  }

  var series = data ? data.series : null;
  var assets = series ? series.total_assets : [];
  var deposits = series ? series.total_deposits : [];
  var credit = series ? series.total_credit_facilities : [];
  var yA = yoyCalc(assets), yD = yoyCalc(deposits), yC = yoyCalc(credit);
  var latestA = assets.length ? assets[assets.length - 1].value : null;
  var latestD = deposits.length ? deposits[deposits.length - 1].value : null;
  var latestC = credit.length ? credit[credit.length - 1].value : null;
  var c2d: any[] = [];
  for (var i = 0; i < deposits.length; i++) { var dv = deposits[i].value, cv = credit[i] ? credit[i].value : null; if (dv && cv != null) c2d.push({ value: (cv / dv) * 100, period: deposits[i].period }); }
  var c2dLatest = c2d.length ? c2d[c2d.length - 1].value : null;
  var c2dYoY = yoyCalc(c2d);
  var asOfPeriod = assets.length ? assets[assets.length - 1].period : '';
  var labels = assets.map(function (p: any) { return shortPeriod(p.period); });
  var xF = labels.length ? labels[0] : '', xM = labels.length ? labels[Math.floor(labels.length / 2)] : '', xL = labels.length ? labels[labels.length - 1] : '';
  var maxGrowth = Math.max(Math.abs(yA ? yA.pct : 0), Math.abs(yD ? yD.pct : 0), Math.abs(yC ? yC.pct : 0), 1);

  function delta(y: any) {
    if (!y) return null;
    var up = y.pct >= 0;
    return React.createElement('span', { className: 'sk-kd ' + (up ? 'sk-up' : 'sk-down') }, (up ? '\u25B2 ' : '\u25BC ') + fmt(Math.abs(y.pct), 1) + '% ' + t.yoy);
  }
  function kpi(label: string, val: any, unit: string, y: any, spark: any[], color: string) {
    return React.createElement('div', { className: 'sk-kpi', style: ({ '--acc': color } as any) },
      React.createElement('div', { className: 'sk-kl' }, label),
      React.createElement('div', { className: 'sk-kv' }, React.createElement('span', { className: 'sk-kvn' }, val), React.createElement('span', { className: 'sk-ku' }, unit)),
      delta(y),
      React.createElement('div', { className: 'sk-ksp', dangerouslySetInnerHTML: { __html: svgSpark(spark, color) } })
    );
  }

  var nav = React.createElement('nav', { className: 'sk-nav' },
    React.createElement('a', { className: 'sk-navlink', href: '/banks' }, t.navFin),
    React.createElement('a', { className: 'sk-navlink on', href: '/sector' }, t.navSector),
    React.createElement('a', { className: 'sk-navlink', href: '/cbj' }, t.navCbj)
  );
  var header = React.createElement('header', { className: 'sk-header' },
    React.createElement('a', { className: 'sk-brand', href: '/' },
      React.createElement('div', { className: 'sk-logo' }, 'cf'),
      React.createElement('div', { className: 'sk-bt' }, React.createElement('div', { className: 'sk-bn' }, t.bn), React.createElement('div', { className: 'sk-bs' }, t.bs))
    ),
    nav,
    React.createElement('div', { className: 'sk-tools' },
      React.createElement('button', { className: 'sk-tbtn', onClick: toggleLang }, t.langLabel),
      React.createElement('button', { className: 'sk-tbtn', onClick: toggleTheme, 'aria-label': 'theme' }, '\u25D0')
    )
  );

  if (loading) {
    return React.createElement('div', { className: 'sk-wrap', dir: isAr ? 'rtl' : 'ltr' }, header,
      React.createElement('div', { className: 'sk-main' },
        React.createElement('div', { className: 'sk-sk', style: { height: '38px', width: '320px', marginBottom: '18px' } }),
        React.createElement('div', { className: 'sk-kpis' }, React.createElement('div', { className: 'sk-sk', style: { height: '128px' } }), React.createElement('div', { className: 'sk-sk', style: { height: '128px' } }), React.createElement('div', { className: 'sk-sk', style: { height: '128px' } }), React.createElement('div', { className: 'sk-sk', style: { height: '128px' } })),
        React.createElement('div', { className: 'sk-sk', style: { height: '300px' } })
      )
    );
  }
  if (errd) {
    return React.createElement('div', { className: 'sk-wrap', dir: isAr ? 'rtl' : 'ltr' }, header,
      React.createElement('div', { className: 'sk-main' }, React.createElement('p', { style: { color: 'var(--text-secondary)', padding: '40px 0' } }, t.loadErr)));
  }

  var kpis = React.createElement('div', { className: 'sk-kpis' },
    kpi(t.kAssets, fmt(latestA, 2), t.unitBn, yA, assets, C_ASSETS),
    kpi(t.kDeposits, fmt(latestD, 2), t.unitBn, yD, deposits, C_DEP),
    kpi(t.kCredit, fmt(latestC, 2), t.unitBn, yC, credit, C_CRED),
    kpi(t.kC2D, fmt(c2dLatest, 1) + '%', '', c2dYoY, c2d, C_GOLD)
  );

  var chartGrowth = React.createElement('div', { className: 'sk-card' },
    React.createElement('div', { className: 'sk-ch' }, React.createElement('div', null, React.createElement('h3', { className: 'sk-ct' }, t.cGrowthT), React.createElement('div', { className: 'sk-cs' }, t.cGrowthS))),
    React.createElement('div', { className: 'sk-chart tall', dangerouslySetInnerHTML: { __html: svgMulti([assets, deposits, credit], [C_ASSETS, C_DEP, C_CRED]) } }),
    React.createElement('div', { className: 'sk-xax' }, React.createElement('span', null, xF), React.createElement('span', null, xM), React.createElement('span', null, xL)),
    React.createElement('div', { className: 'sk-leg' },
      React.createElement('div', { className: 'sk-li' }, React.createElement('span', { className: 'sk-ld', style: { background: C_ASSETS } }), t.lgAssets),
      React.createElement('div', { className: 'sk-li' }, React.createElement('span', { className: 'sk-ld', style: { background: C_DEP } }), t.lgDeposits),
      React.createElement('div', { className: 'sk-li' }, React.createElement('span', { className: 'sk-ld', style: { background: C_CRED } }), t.lgCredit)
    )
  );
  var chartAssets = React.createElement('div', { className: 'sk-card' },
    React.createElement('div', { className: 'sk-ch' },
      React.createElement('div', null, React.createElement('h3', { className: 'sk-ct' }, t.cAssetsT), React.createElement('div', { className: 'sk-cs' }, t.cAssetsS)),
      React.createElement('div', { className: 'sk-cb' }, React.createElement('div', { className: 'sk-cbn' }, fmt(latestA, 2)), yA ? React.createElement('div', { className: 'sk-cbd ' + (yA.pct >= 0 ? 'sk-up' : 'sk-down') }, (yA.pct >= 0 ? '\u25B2 ' : '\u25BC ') + fmt(Math.abs(yA.pct), 1) + '%') : null)
    ),
    React.createElement('div', { className: 'sk-chart', dangerouslySetInnerHTML: { __html: svgArea(assets, C_ASSETS, 'gA') } }),
    React.createElement('div', { className: 'sk-xax' }, React.createElement('span', null, xF), React.createElement('span', null, xM), React.createElement('span', null, xL))
  );
  var chartInt = React.createElement('div', { className: 'sk-card' },
    React.createElement('div', { className: 'sk-ch' }, React.createElement('div', null, React.createElement('h3', { className: 'sk-ct' }, t.cIntT), React.createElement('div', { className: 'sk-cs' }, t.cIntS))),
    React.createElement('div', { className: 'sk-chart', dangerouslySetInnerHTML: { __html: svgMulti([deposits, credit], [C_DEP, C_CRED]) } }),
    React.createElement('div', { className: 'sk-xax' }, React.createElement('span', null, xF), React.createElement('span', null, xM), React.createElement('span', null, xL)),
    React.createElement('div', { className: 'sk-leg' },
      React.createElement('div', { className: 'sk-li' }, React.createElement('span', { className: 'sk-ld', style: { background: C_DEP } }), t.lgDeposits),
      React.createElement('div', { className: 'sk-li' }, React.createElement('span', { className: 'sk-ld', style: { background: C_CRED } }), t.lgCredit)
    )
  );
  var chartRatio = React.createElement('div', { className: 'sk-card' },
    React.createElement('div', { className: 'sk-ch' },
      React.createElement('div', null, React.createElement('h3', { className: 'sk-ct' }, t.cRatioT), React.createElement('div', { className: 'sk-cs' }, t.cRatioS)),
      React.createElement('div', { className: 'sk-cb' }, React.createElement('div', { className: 'sk-cbn' }, fmt(c2dLatest, 1) + '%'))
    ),
    React.createElement('div', { className: 'sk-chart', dangerouslySetInnerHTML: { __html: svgArea(c2d, C_GOLD, 'gR') } }),
    React.createElement('div', { className: 'sk-xax' }, React.createElement('span', null, xF), React.createElement('span', null, xM), React.createElement('span', null, xL))
  );
  function bar(label: string, y: any, color: string) {
    var pct = y ? y.pct : 0;
    var wd = (Math.abs(pct) / maxGrowth) * 100;
    return React.createElement('div', { className: 'sk-br' },
      React.createElement('div', { className: 'sk-brt' }, React.createElement('span', { className: 'sk-brl' }, label), React.createElement('span', { className: 'sk-brv ' + (pct >= 0 ? 'sk-up' : 'sk-down') }, (pct >= 0 ? '+' : '') + fmt(pct, 1) + '%')),
      React.createElement('div', { className: 'sk-brk' }, React.createElement('div', { className: 'sk-brf', style: { width: wd + '%', background: color } }))
    );
  }
  var chartYoy = React.createElement('div', { className: 'sk-card' },
    React.createElement('div', { className: 'sk-ch' }, React.createElement('div', null, React.createElement('h3', { className: 'sk-ct' }, t.cYoyT), React.createElement('div', { className: 'sk-cs' }, t.cYoyS))),
    React.createElement('div', { className: 'sk-bars' }, bar(t.lgAssets, yA, C_ASSETS), bar(t.lgDeposits, yD, C_DEP), bar(t.lgCredit, yC, C_CRED))
  );

  var chatMsgs = msgs.map(function (m: any, idx: number) {
    if (m.role === 'user') return React.createElement('div', { key: idx, className: 'sk-m sk-mu' }, m.content);
    return React.createElement('div', { key: idx, className: 'sk-m sk-mb', dangerouslySetInnerHTML: { __html: mdLite(m.content) } });
  });
  if (busy) chatMsgs = chatMsgs.concat([React.createElement('div', { key: 'typ', className: 'sk-m sk-mb' }, React.createElement('span', { className: 'sk-typ' }, React.createElement('span', null), React.createElement('span', null), React.createElement('span', null)))]);
  var promptRow = msgs.length === 0 ? React.createElement('div', { className: 'sk-pr' }, t.prompts.map(function (p: string, idx: number) { return React.createElement('button', { key: idx, className: 'sk-prb', onClick: function () { send(p); } }, p); })) : null;
  var chat = React.createElement('div', { className: 'sk-chat' },
    React.createElement('div', { className: 'sk-chq' }, React.createElement('div', { className: 'sk-chi' }, 'Z'), React.createElement('div', null, React.createElement('h3', { className: 'sk-cht' }, t.chatT), React.createElement('div', { className: 'sk-chs' }, busy ? t.thinking : t.chatS))),
    promptRow,
    chatMsgs.length ? React.createElement('div', { className: 'sk-ms' }, chatMsgs) : null,
    React.createElement('div', { className: 'sk-ir' },
      React.createElement('textarea', { className: 'sk-in', rows: 1, placeholder: t.ph, value: input, onChange: function (e: any) { setInput(e.target.value); }, onKeyDown: function (e: any) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } } }),
      React.createElement('button', { className: 'sk-snd', onClick: function () { send(); }, disabled: busy }, t.send)
    )
  );

  return React.createElement('div', { className: 'sk-wrap', dir: isAr ? 'rtl' : 'ltr' },
    React.createElement('style', { dangerouslySetInnerHTML: { __html: CSS } }),
    header,
    React.createElement('div', { className: 'sk-main' },
      React.createElement('a', { className: 'sk-back', href: '/' }, (isAr ? '\u2192 ' : '\u2190 ') + t.back),
      React.createElement('div', { className: 'sk-hero' },
        React.createElement('div', { className: 'sk-eyebrow' }, t.eyebrow),
        React.createElement('h1', { className: 'sk-title' }, t.title),
        React.createElement('p', { className: 'sk-sub' }, t.sub),
        React.createElement('div', { className: 'sk-asof' }, React.createElement('span', { className: 'sk-livedot' }), t.asOf + ' ' + asOfPeriod + '  \u00B7  ' + t.of15)
      ),
      kpis,
      React.createElement('div', { className: 'sk-grid' }, chartGrowth, chartYoy),
      React.createElement('div', { className: 'sk-g2' }, chartAssets, chartInt),
      chartRatio,
      chat,
      React.createElement('div', { className: 'sk-ft' }, t.source)
    )
  );
}
