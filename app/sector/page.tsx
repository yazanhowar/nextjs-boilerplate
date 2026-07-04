'use client';
import { zadMdToHtml, ZAD_MD_CSS } from '@/lib/zad-md'
import React, { useState, useEffect } from 'react';
import { CfSignals } from '@/lib/cf-signals';
import { useLang } from '@/lib/LangContext'

const CSS = "*{box-sizing:border-box}.sk-wrap{min-height:100vh;background:var(--cf-bg);color:var(--cf-ink);font-family:var(--cf-font-sans)}.sk-wrap[dir=rtl]{font-family:var(--cf-font-ar)}.sk-main{max-width:1200px;margin:0 auto;padding:26px 26px 64px}.sk-head{display:flex;align-items:center;justify-content:space-between;gap:20px;margin-bottom:40px}.sk-brand{display:flex;align-items:center;gap:12px;text-decoration:none;color:inherit}.sk-mark{width:42px;height:42px;border-radius:11px;background:var(--cf-grad);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:13px;letter-spacing:.04em;flex-shrink:0}.sk-bname{font-weight:700;font-size:17px;color:var(--cf-ink);letter-spacing:-.01em;line-height:1.15}.sk-bsub{font-size:11.5px;color:var(--cf-ink3)}.sk-hnav{display:flex;align-items:center;gap:22px}.sk-nav{display:flex;gap:20px}.sk-navlink{font-size:13.5px;font-weight:500;color:var(--cf-primary);text-decoration:none;transition:color .15s;white-space:nowrap}.sk-navlink:hover{color:var(--cf-primary-strong)}.sk-navlink.on{color:var(--cf-ink);font-weight:600}.sk-tools{display:flex;align-items:center;gap:8px}.sk-tbtn{border:1px solid var(--cf-line);background:var(--cf-surface);color:var(--cf-ink2);border-radius:9px;padding:7px 12px;font-size:12.5px;font-weight:500;cursor:pointer;transition:all .15s;font-family:inherit}.sk-tbtn:hover{border-color:var(--cf-primary);color:var(--cf-primary)}.sk-eyebrow{font-size:12px;font-weight:600;letter-spacing:.14em;color:var(--cf-ink3);text-transform:uppercase;margin-bottom:9px}.sk-title{font-size:30px;font-weight:800;letter-spacing:-.02em;margin:0 0 9px;color:var(--cf-ink)}.sk-sub{font-size:15px;color:var(--cf-ink2);max-width:640px;margin:0 0 15px;line-height:1.55}.sk-asof{display:inline-flex;align-items:center;gap:8px;font-size:12px;font-weight:500;color:var(--cf-ink2);background:var(--cf-surface);border:1px solid var(--cf-line);border-radius:20px;padding:5px 13px}.sk-live{width:7px;height:7px;border-radius:50%;background:var(--cf-positive);box-shadow:0 0 0 3px rgba(30,138,90,.14)}.sk-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin:24px 0}.sk-kpi{background:var(--cf-surface);border:1px solid var(--cf-line);border-radius:14px;padding:16px 18px 13px;position:relative;overflow:hidden}.sk-kpi::before{content:'';position:absolute;top:0;inset-inline-start:0;inset-inline-end:0;height:3px;background:var(--kc,var(--cf-primary))}.sk-kl{font-size:11.5px;font-weight:600;color:var(--cf-ink3);text-transform:uppercase;letter-spacing:.05em;margin-bottom:10px}.sk-kv{display:flex;align-items:baseline;gap:6px}.sk-kvn{font-size:27px;font-weight:800;letter-spacing:-.02em;color:var(--cf-ink);font-variant-numeric:tabular-nums}.sk-ku{font-size:12px;font-weight:500;color:var(--cf-ink3)}.sk-kd{display:inline-flex;align-items:center;gap:4px;font-size:12px;font-weight:700;margin-top:8px}.sk-up{color:var(--cf-positive)}.sk-down{color:var(--cf-negative)}.sk-ksp{margin-top:9px;height:30px}.sk-grid{display:grid;grid-template-columns:1.85fr 1fr;gap:14px;margin-bottom:14px}.sk-g2{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px}.sk-card{background:var(--cf-surface);border:1px solid var(--cf-line);border-radius:14px;padding:20px 22px;display:flex;flex-direction:column}.sk-ch{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:16px}.sk-ct{font-size:15px;font-weight:700;margin:0;color:var(--cf-ink)}.sk-cs{font-size:12px;color:var(--cf-ink3);margin-top:3px}.sk-cb{text-align:end;flex-shrink:0}.sk-cbn{font-size:19px;font-weight:800;font-variant-numeric:tabular-nums;letter-spacing:-.01em;color:var(--cf-ink)}.sk-cbd{font-size:12px;font-weight:700;margin-top:2px}.sk-chart{width:100%;height:150px;position:relative}.sk-chart svg{display:block;width:100%;height:100%}.sk-chart.tall{height:212px}.sk-xax{display:flex;justify-content:space-between;margin-top:10px;font-size:11px;color:var(--cf-ink3);font-weight:500}.sk-leg{display:flex;gap:18px;flex-wrap:wrap;margin-top:14px}.sk-li{display:flex;align-items:center;gap:7px;font-size:12.5px;font-weight:500;color:var(--cf-ink2)}.sk-ld{width:11px;height:11px;border-radius:3px}.sk-bars{display:flex;flex-direction:column;gap:16px;margin-top:8px}.sk-br{display:flex;flex-direction:column;gap:7px}.sk-brt{display:flex;align-items:center;justify-content:space-between}.sk-brl{font-size:13px;font-weight:500;color:var(--cf-ink2)}.sk-brv{font-size:15px;font-weight:800;font-variant-numeric:tabular-nums}.sk-brk{height:8px;border-radius:5px;background:var(--cf-surface2);overflow:hidden}.sk-brf{height:100%;border-radius:5px;transition:width .7s cubic-bezier(.2,.8,.2,1)}.sk-chat{background:var(--cf-surface);border:1px solid var(--cf-line);border-radius:14px;padding:22px;margin-top:6px}.sk-chq{display:flex;align-items:center;gap:12px;margin-bottom:16px}.sk-chi{width:40px;height:40px;border-radius:11px;background:var(--cf-grad);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:13px;letter-spacing:.04em;flex-shrink:0}.sk-cht{font-size:16px;font-weight:700;margin:0;color:var(--cf-ink)}.sk-chs{font-size:12px;color:var(--cf-ink3);margin-top:2px}.sk-pr{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px}.sk-prb{border:1px solid var(--cf-line);background:var(--cf-bg);color:var(--cf-ink2);border-radius:20px;padding:8px 14px;font-size:13px;font-weight:500;cursor:pointer;transition:all .15s;text-align:start;font-family:inherit}.sk-prb:hover{border-color:var(--cf-primary);color:var(--cf-primary);background:var(--cf-primary-soft)}.sk-ms{display:flex;flex-direction:column;gap:12px;margin-bottom:16px}.sk-m{max-width:88%;padding:12px 16px;border-radius:14px;font-size:14px;line-height:1.6}.sk-mu{align-self:flex-end;background:var(--cf-primary);color:#fff;border-bottom-right-radius:4px}.sk-mb{align-self:flex-start;background:var(--cf-bg);border:1px solid var(--cf-line);color:var(--cf-ink);border-bottom-left-radius:4px}.sk-mb strong{font-weight:700}.sk-tblw{overflow-x:auto;margin:10px 0}.sk-tbl{border-collapse:collapse;width:100%;font-size:12px}.sk-tbl th{background:var(--cf-surface2);color:var(--cf-ink2);text-align:start;padding:6px 9px;border:1px solid var(--cf-line);font-weight:600;white-space:nowrap}.sk-tbl td{padding:6px 9px;border:1px solid var(--cf-line);color:var(--cf-ink)}.sk-hr{border:none;border-top:1px solid var(--cf-line);margin:12px 0}.sk-h{font-weight:800;color:var(--cf-ink);margin:8px 0 6px}.sk-hh1{font-size:15px}.sk-hh2{font-size:14px}.sk-hh3{font-size:13px}.sk-p{margin:0 0 8px}.sk-li{margin:0 0 4px}.sk-lnk{color:var(--cf-primary);font-weight:600;text-decoration:none;border-bottom:1px solid var(--cf-line)}.sk-mb .sk-h{display:block;font-size:14.5px;margin:2px 0 4px;color:var(--cf-ink)}.sk-typ{display:inline-flex;gap:4px;align-items:center;padding:4px 2px}.sk-typ span{width:7px;height:7px;border-radius:50%;background:var(--cf-ink3);animation:skb 1.2s infinite}.sk-typ span:nth-child(2){animation-delay:.2s}.sk-typ span:nth-child(3){animation-delay:.4s}@keyframes skb{0%,60%,100%{opacity:.3;transform:translateY(0)}30%{opacity:1;transform:translateY(-3px)}}.sk-ir{display:flex;gap:10px;align-items:flex-end}.sk-in{flex:1;border:1px solid var(--cf-line);background:var(--cf-bg);color:var(--cf-ink);border-radius:11px;padding:13px 15px;font-size:14px;font-family:inherit;resize:none;outline:none;transition:border-color .15s;max-height:120px}.sk-in:focus{border-color:var(--cf-primary)}.sk-in::placeholder{color:var(--cf-ink3)}.sk-snd{border:none;background:var(--cf-primary);color:#fff;border-radius:11px;padding:13px 22px;font-size:14px;font-weight:700;cursor:pointer;transition:background .15s;flex-shrink:0;font-family:inherit}.sk-snd:hover{background:var(--cf-primary-strong)}.sk-snd:disabled{opacity:.5;cursor:not-allowed}.sk-ft{text-align:center;font-size:12px;color:var(--cf-ink3);margin-top:30px;padding-top:20px;border-top:1px solid var(--cf-line)}.sk-sk{background:var(--cf-surface2);border-radius:14px;animation:skp 1.5s infinite}@keyframes skp{0%,100%{opacity:.55}50%{opacity:.85}}@media(max-width:960px){.sk-kpis{grid-template-columns:repeat(2,1fr)}.sk-grid{grid-template-columns:1fr}.sk-g2{grid-template-columns:1fr}.sk-nav{display:none}}@media(max-width:560px){.sk-kpis{grid-template-columns:1fr}.sk-title{font-size:24px}.sk-main{padding:20px 16px 48px}.sk-head{margin-bottom:28px}}";

const T: any = {
  en: {
    bname: "convo.finance", bsub: "Banking Intelligence", langLabel: "\u0627\u0644\u0639\u0631\u0628\u064A\u0629",
    navFin: "Financials", navSector: "Sector", navCbj: "CBJ Reports",
    eyebrow: "ABJ \u00B7 Sector Aggregate", title: "Jordanian Banking Sector",
    sub: "Aggregate performance across all 15 licensed banks, published monthly by the Association of Banks in Jordan.",
    asOf: "As of", of15: "15 licensed banks",
    kAssets: "Total Assets", kDeposits: "Total Deposits", kCredit: "Credit Facilities", kC2D: "Credit-to-Deposit",
    yoy: "YoY", unitBn: "JOD bn",
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
    bname: "convo.finance", bsub: "\u0630\u0643\u0627\u0621 \u0645\u0635\u0631\u0641\u064A", langLabel: "English",
    navFin: "\u0627\u0644\u0645\u0627\u0644\u064A\u0629", navSector: "\u0627\u0644\u0642\u0637\u0627\u0639", navCbj: "\u062A\u0642\u0627\u0631\u064A\u0631 \u0627\u0644\u0628\u0646\u0643 \u0627\u0644\u0645\u0631\u0643\u0632\u064A",
    eyebrow: "\u062C\u0645\u0639\u064A\u0629 \u0627\u0644\u0628\u0646\u0648\u0643 \u00B7 \u0645\u0624\u0634\u0631\u0627\u062A \u0627\u0644\u0642\u0637\u0627\u0639", title: "\u0627\u0644\u0642\u0637\u0627\u0639 \u0627\u0644\u0645\u0635\u0631\u0641\u064A \u0627\u0644\u0623\u0631\u062F\u0646\u064A",
    sub: "\u0627\u0644\u0623\u062F\u0627\u0621 \u0627\u0644\u0625\u062C\u0645\u0627\u0644\u064A \u0644\u062C\u0645\u064A\u0639 \u0627\u0644\u0628\u0646\u0648\u0643 \u0627\u0644\u0645\u0631\u062E\u0651\u0635\u0629 \u0627\u0644\u062E\u0645\u0633\u0629 \u0639\u0634\u0631\u060C \u062A\u0635\u062F\u0631\u0647\u0627 \u0634\u0647\u0631\u064A\u0627\u064B \u062C\u0645\u0639\u064A\u0629 \u0627\u0644\u0628\u0646\u0648\u0643 \u0641\u064A \u0627\u0644\u0623\u0631\u062F\u0646.",
    asOf: "\u062D\u062A\u0649 \u062A\u0627\u0631\u064A\u062E", of15: "\u0661\u0665 \u0628\u0646\u0643\u0627\u064B \u0645\u0631\u062E\u0651\u0635\u0627\u064B",
    kAssets: "\u0625\u062C\u0645\u0627\u0644\u064A \u0627\u0644\u0645\u0648\u062C\u0648\u062F\u0627\u062A", kDeposits: "\u0625\u062C\u0645\u0627\u0644\u064A \u0627\u0644\u0648\u062F\u0627\u0626\u0639", kCredit: "\u0627\u0644\u062A\u0633\u0647\u064A\u0644\u0627\u062A \u0627\u0644\u0627\u0626\u062A\u0645\u0627\u0646\u064A\u0629", kC2D: "\u0627\u0644\u062A\u0633\u0647\u064A\u0644\u0627\u062A / \u0627\u0644\u0648\u062F\u0627\u0626\u0639",
    yoy: "\u0633\u0646\u0648\u064A\u0627\u064B", unitBn: "\u0645\u0644\u064A\u0627\u0631 \u062F.\u0623",
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
function fmt(v: any, dec?: number) { if (v == null || isNaN(v)) return '\u2014'; var d = dec == null ? 2 : dec; return Number(v).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }); }
function shortPeriod(p: any) { if (!p) return ''; var s = String(p); var mo = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']; if (s.length >= 7 && s.charAt(4) === '-') { var m = parseInt(s.slice(5, 7), 10); return mo[m] + " '" + s.slice(2, 4); } return s; }
function yoyCalc(series: any[]) { if (!series || series.length < 13) return null; var latest = series[series.length - 1].value; var prior = series[series.length - 13].value; if (prior == null || latest == null) return null; return { latest: latest, prior: prior, pct: ((latest - prior) / prior) * 100 }; }

function svgArea(pts: any[], cvar: string, id: string) {
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
  for (var g = 1; g <= 2; g++) { var gy = (padT + (g / 3) * ih).toFixed(1); grid += '<line x1="0" y1="' + gy + '" x2="' + w + '" y2="' + gy + '" style="stroke:var(--cf-ink3);stroke-opacity:0.18" stroke-width="1" vector-effect="non-scaling-stroke"/>'; }
  return '<svg viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">' +
    '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" style="stop-color:var(' + cvar + ');stop-opacity:0.26"/><stop offset="100%" style="stop-color:var(' + cvar + ');stop-opacity:0.02"/></linearGradient></defs>' +
    grid + '<path d="' + area + '" fill="url(#' + id + ')"/>' +
    '<path d="' + line + '" fill="none" style="stroke:var(' + cvar + ')" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg>';
}
function svgSpark(pts: any[], cvar: string) {
  if (!pts || !pts.length) return '';
  var w = 300, h = 60, pad = 5;
  var vals = pts.map(function (p) { return p.value; });
  var min = Math.min.apply(null, vals), max = Math.max.apply(null, vals);
  var range = (max - min) || 1, ih = h - pad * 2;
  var X = function (i: number) { return (i / (pts.length - 1)) * w; };
  var Y = function (v: number) { return pad + (1 - (v - min) / range) * ih; };
  var line = '';
  for (var i = 0; i < pts.length; i++) { line += (i === 0 ? 'M' : 'L') + X(i).toFixed(1) + ' ' + Y(pts[i].value).toFixed(1) + ' '; }
  return '<svg viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg"><path d="' + line + '" fill="none" style="stroke:var(' + cvar + ');opacity:0.9" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg>';
}
function svgMulti(seriesArr: any[], cvars: string[]) {
  if (!seriesArr || !seriesArr.length || !seriesArr[0].length) return '';
  var all: number[] = [];
  seriesArr.forEach(function (s) { s.forEach(function (p: any) { all.push(p.value); }); });
  var min = Math.min.apply(null, all), max = Math.max.apply(null, all);
  var range = (max - min) || 1, lo = min - range * 0.06, hi = max + range * 0.06, rng = hi - lo;
  var w = 1000, h = 212, padT = 10, padB = 8, ih = h - padT - padB, n = seriesArr[0].length;
  var X = function (i: number) { return (i / (n - 1)) * w; };
  var Y = function (v: number) { return padT + (1 - (v - lo) / rng) * ih; };
  var grid = '';
  for (var g = 1; g <= 3; g++) { var gy = (padT + (g / 4) * ih).toFixed(1); grid += '<line x1="0" y1="' + gy + '" x2="' + w + '" y2="' + gy + '" style="stroke:var(--cf-ink3);stroke-opacity:0.15" stroke-width="1" vector-effect="non-scaling-stroke"/>'; }
  var paths = '';
  for (var k = 0; k < seriesArr.length; k++) {
    var s = seriesArr[k], line = '';
    for (var i = 0; i < s.length; i++) { line += (i === 0 ? 'M' : 'L') + X(i).toFixed(1) + ' ' + Y(s[i].value).toFixed(1) + ' '; }
    paths += '<path d="' + line + '" fill="none" style="stroke:var(' + cvars[k] + ')" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/>';
  }
  return '<svg viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">' + grid + paths + '</svg>';
}
function mdLite(text: any) { return zadMdToHtml(text) }



var CA = '--cf-primary', CD = '--cf-teal', CC = '--cf-iris', CR = '--cf-primary-strong';

export default function SectorPage() {
  var __lc = useLang(); var lang = __lc.lang; var setLang = __lc.setLang;
  var dd = useState<any>(null); var data = dd[0]; var setData = dd[1];
  var ll = useState(true); var loading = ll[0]; var setLoading = ll[1];
  var ee = useState(false); var errd = ee[0]; var setErr = ee[1];
  var mm = useState<any[]>([]); var msgs = mm[0]; var setMsgs = mm[1];
  var ii = useState(''); var input = ii[0]; var setInput = ii[1];
  var bb = useState(false); var busy = bb[0]; var setBusy = bb[1];

  useEffect(function () {
    try { var l = localStorage.getItem('lang'); if (l === 'ar' || l === 'en') setLang(l); } catch (e) {}
    callMcp('abj_sector').then(function (res) { if (res && res.series) { setData(res); } else { setErr(true); } setLoading(false); }).catch(function () { setErr(true); setLoading(false); });
  }, []);

  var isAr = lang === 'ar';
  var t = T[lang];
  function toggleLang() { var n = isAr ? 'en' : 'ar'; setLang(n); try { localStorage.setItem('lang', n); } catch (e) {} try { document.documentElement.dir = n === 'ar' ? 'rtl' : 'ltr'; document.documentElement.lang = n; } catch (e) {} }
  function toggleTheme() { try { var isDark = document.documentElement.classList.toggle('dark'); localStorage.setItem('hbtf-theme', isDark ? 'dark' : 'light'); localStorage.setItem('theme', isDark ? 'dark' : 'light'); } catch (e) {} }
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

  var header = React.createElement('header', { className: 'sk-head' },
    React.createElement('a', { className: 'sk-brand', href: '/' },
      React.createElement('div', { className: 'sk-mark' }, 'ZAD'),
      React.createElement('div', null, React.createElement('div', { className: 'sk-bname' }, t.bname), React.createElement('div', { className: 'sk-bsub' }, t.bsub))
    ),
    React.createElement('div', { className: 'sk-hnav' },
      React.createElement('nav', { className: 'sk-nav' },
        React.createElement('a', { className: 'sk-navlink', href: '/banks' }, t.navFin),
        React.createElement('a', { className: 'sk-navlink on', href: '/sector' }, t.navSector),
        React.createElement('a', { className: 'sk-navlink', href: '/cbj' }, t.navCbj)
      ),
      React.createElement('div', { className: 'sk-tools' },
        React.createElement('button', { className: 'sk-tbtn', onClick: toggleLang }, t.langLabel),
        React.createElement('button', { className: 'sk-tbtn', onClick: toggleTheme, 'aria-label': 'theme' }, '\u25D0')
      )
    )
  );

  if (loading) {
    return React.createElement('div', { className: 'sk-wrap', dir: isAr ? 'rtl' : 'ltr' },
      React.createElement('style', { dangerouslySetInnerHTML: { __html: CSS + ZAD_MD_CSS } }),
      React.createElement('div', { className: 'sk-main' }, header,
        React.createElement('div', { className: 'sk-sk', style: { height: '40px', width: '320px', marginBottom: '18px' } }),
        React.createElement('div', { className: 'sk-kpis' }, React.createElement('div', { className: 'sk-sk', style: { height: '124px' } }), React.createElement('div', { className: 'sk-sk', style: { height: '124px' } }), React.createElement('div', { className: 'sk-sk', style: { height: '124px' } }), React.createElement('div', { className: 'sk-sk', style: { height: '124px' } })),
        React.createElement('div', { className: 'sk-sk', style: { height: '300px' } })
      )
    );
  }
  if (errd) {
    return React.createElement('div', { className: 'sk-wrap', dir: isAr ? 'rtl' : 'ltr' },
      React.createElement('style', { dangerouslySetInnerHTML: { __html: CSS + ZAD_MD_CSS } }),
      React.createElement('div', { className: 'sk-main' }, header, React.createElement('p', { style: { color: 'var(--cf-ink2)', padding: '40px 0' } }, t.loadErr)));
  }

  var series = data.series;
  var assets = series.total_assets || [], deposits = series.total_deposits || [], credit = series.total_credit_facilities || [];
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

  function delta(y: any) { if (!y) return null; var up = y.pct >= 0; return React.createElement('span', { className: 'sk-kd ' + (up ? 'sk-up' : 'sk-down') }, (up ? '\u25B2 ' : '\u25BC ') + fmt(Math.abs(y.pct), 1) + '% ' + t.yoy); }
  function kpi(label: string, val: any, unit: string, y: any, spark: any[], cvar: string) {
    return React.createElement('div', { className: 'sk-kpi', style: ({ '--kc': 'var(' + cvar + ')' } as any) },
      React.createElement('div', { className: 'sk-kl' }, label),
      React.createElement('div', { className: 'sk-kv' }, React.createElement('span', { className: 'sk-kvn' }, val), unit ? React.createElement('span', { className: 'sk-ku' }, unit) : null),
      delta(y),
      React.createElement('div', { className: 'sk-ksp', dangerouslySetInnerHTML: { __html: svgSpark(spark, cvar) } })
    );
  }
  function xax() { return React.createElement('div', { className: 'sk-xax' }, React.createElement('span', null, xF), React.createElement('span', null, xM), React.createElement('span', null, xL)); }
  function legItem(cvar: string, label: string) { return React.createElement('div', { className: 'sk-li' }, React.createElement('span', { className: 'sk-ld', style: { background: 'var(' + cvar + ')' } }), label); }

  var kpis = React.createElement('div', { className: 'sk-kpis' },
    kpi(t.kAssets, fmt(latestA, 2), t.unitBn, yA, assets, CA),
    kpi(t.kDeposits, fmt(latestD, 2), t.unitBn, yD, deposits, CD),
    kpi(t.kCredit, fmt(latestC, 2), t.unitBn, yC, credit, CC),
    kpi(t.kC2D, fmt(c2dLatest, 1) + '%', '', c2dYoY, c2d, CR)
  );
  var chartGrowth = React.createElement('div', { className: 'sk-card' },
    React.createElement('div', { className: 'sk-ch' }, React.createElement('div', null, React.createElement('h3', { className: 'sk-ct' }, t.cGrowthT), React.createElement('div', { className: 'sk-cs' }, t.cGrowthS))),
    React.createElement('div', { className: 'sk-chart tall', dangerouslySetInnerHTML: { __html: svgMulti([assets, deposits, credit], [CA, CD, CC]) } }),
    xax(),
    React.createElement('div', { className: 'sk-leg' }, legItem(CA, t.lgAssets), legItem(CD, t.lgDeposits), legItem(CC, t.lgCredit))
  );
  function barRow(label: string, y: any, cvar: string) {
    var pct = y ? y.pct : 0, wd = (Math.abs(pct) / maxGrowth) * 100;
    return React.createElement('div', { className: 'sk-br' },
      React.createElement('div', { className: 'sk-brt' }, React.createElement('span', { className: 'sk-brl' }, label), React.createElement('span', { className: 'sk-brv ' + (pct >= 0 ? 'sk-up' : 'sk-down') }, (pct >= 0 ? '+' : '') + fmt(pct, 1) + '%')),
      React.createElement('div', { className: 'sk-brk' }, React.createElement('div', { className: 'sk-brf', style: { width: wd + '%', background: 'var(' + cvar + ')' } }))
    );
  }
  var chartYoy = React.createElement('div', { className: 'sk-card' },
    React.createElement('div', { className: 'sk-ch' }, React.createElement('div', null, React.createElement('h3', { className: 'sk-ct' }, t.cYoyT), React.createElement('div', { className: 'sk-cs' }, t.cYoyS))),
    React.createElement('div', { className: 'sk-bars' }, barRow(t.lgAssets, yA, CA), barRow(t.lgDeposits, yD, CD), barRow(t.lgCredit, yC, CC))
  );
  var chartAssets = React.createElement('div', { className: 'sk-card' },
    React.createElement('div', { className: 'sk-ch' },
      React.createElement('div', null, React.createElement('h3', { className: 'sk-ct' }, t.cAssetsT), React.createElement('div', { className: 'sk-cs' }, t.cAssetsS)),
      React.createElement('div', { className: 'sk-cb' }, React.createElement('div', { className: 'sk-cbn' }, fmt(latestA, 2)), yA ? React.createElement('div', { className: 'sk-cbd ' + (yA.pct >= 0 ? 'sk-up' : 'sk-down') }, (yA.pct >= 0 ? '\u25B2 ' : '\u25BC ') + fmt(Math.abs(yA.pct), 1) + '%') : null)
    ),
    React.createElement('div', { className: 'sk-chart', dangerouslySetInnerHTML: { __html: svgArea(assets, CA, 'gA') } }), xax()
  );
  var chartInt = React.createElement('div', { className: 'sk-card' },
    React.createElement('div', { className: 'sk-ch' }, React.createElement('div', null, React.createElement('h3', { className: 'sk-ct' }, t.cIntT), React.createElement('div', { className: 'sk-cs' }, t.cIntS))),
    React.createElement('div', { className: 'sk-chart', dangerouslySetInnerHTML: { __html: svgMulti([deposits, credit], [CD, CC]) } }), xax(),
    React.createElement('div', { className: 'sk-leg' }, legItem(CD, t.lgDeposits), legItem(CC, t.lgCredit))
  );
  var chartRatio = React.createElement('div', { className: 'sk-card' },
    React.createElement('div', { className: 'sk-ch' },
      React.createElement('div', null, React.createElement('h3', { className: 'sk-ct' }, t.cRatioT), React.createElement('div', { className: 'sk-cs' }, t.cRatioS)),
      React.createElement('div', { className: 'sk-cb' }, React.createElement('div', { className: 'sk-cbn' }, fmt(c2dLatest, 1) + '%'))
    ),
    React.createElement('div', { className: 'sk-chart', dangerouslySetInnerHTML: { __html: svgArea(c2d, CR, 'gR') } }), xax()
  );
  var chatMsgs = msgs.map(function (m: any, idx: number) {
    if (m.role === 'user') return React.createElement('div', { key: idx, className: 'sk-m sk-mu' }, m.content);
    return React.createElement('div', { key: idx, className: 'sk-m sk-mb', dangerouslySetInnerHTML: { __html: mdLite(m.content) } });
  });
  if (busy) chatMsgs = chatMsgs.concat([React.createElement('div', { key: 'typ', className: 'sk-m sk-mb' }, React.createElement('span', { className: 'sk-typ' }, React.createElement('span', null), React.createElement('span', null), React.createElement('span', null)))]);
  var promptRow = msgs.length === 0 ? React.createElement('div', { className: 'sk-pr' }, t.prompts.map(function (p: string, idx: number) { return React.createElement('button', { key: idx, className: 'sk-prb', onClick: function () { send(p); } }, p); })) : null;
  var chat = React.createElement('div', { className: 'sk-chat' },
    React.createElement('div', { className: 'sk-chq' }, React.createElement('div', { className: 'sk-chi' }, 'ZAD'), React.createElement('div', null, React.createElement('h3', { className: 'sk-cht' }, t.chatT), React.createElement('div', { className: 'sk-chs' }, busy ? t.thinking : t.chatS))),
    promptRow,
    chatMsgs.length ? React.createElement('div', { className: 'sk-ms' }, chatMsgs) : null,
    React.createElement('div', { className: 'sk-ir' },
      React.createElement('textarea', { className: 'sk-in', rows: 1, placeholder: t.ph, value: input, onChange: function (e: any) { setInput(e.target.value); }, onKeyDown: function (e: any) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } } }),
      React.createElement('button', { className: 'sk-snd', onClick: function () { send(); }, disabled: busy }, t.send)
    )
  );

  var signalsSection = React.createElement('section', { style: { background: 'var(--cf-surface, #ffffff)', border: '1px solid var(--cf-line, #e5eaf2)', borderRadius: 14, padding: '14px 16px', marginTop: 14 } },
    React.createElement('div', { style: { fontSize: 12, fontWeight: 900, letterSpacing: 1, color: 'var(--cf-ink2, #3d4f66)', marginBottom: 8 } }, lang === 'ar' ? 'لوحة إشارات زاد' : 'ZAD SIGNAL BOARD'),
    React.createElement(CfSignals, { lang: lang }));
  return React.createElement('div', { className: 'sk-wrap', dir: isAr ? 'rtl' : 'ltr' },
    React.createElement('style', { dangerouslySetInnerHTML: { __html: CSS + ZAD_MD_CSS } }),
    React.createElement('div', { className: 'sk-main' },
      header,
      signalsSection,
      React.createElement('div', { className: 'sk-hero' },
        React.createElement('div', { className: 'sk-eyebrow' }, t.eyebrow),
        React.createElement('h1', { className: 'sk-title' }, t.title),
        React.createElement('p', { className: 'sk-sub' }, t.sub),
        React.createElement('div', { className: 'sk-asof' }, React.createElement('span', { className: 'sk-live' }), t.asOf + ' ' + asOfPeriod + '  \u00B7  ' + t.of15)
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
