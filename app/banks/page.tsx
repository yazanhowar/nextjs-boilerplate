'use client';
import React, { useState, useEffect, useRef } from 'react';

const CSS = ".bk-wrap{min-height:100vh;background:var(--bg)}*{box-sizing:border-box}.bk-header{position:sticky;top:0;z-index:20;display:flex;align-items:center;justify-content:space-between;padding:14px 22px;background:rgba(255,255,255,0.92);backdrop-filter:blur(10px);border-bottom:1px solid #e6ecf3}.bk-brand{display:flex;align-items:center;gap:11px;text-decoration:none;cursor:pointer}.bk-logo{width:42px;height:42px;border-radius:11px;background:linear-gradient(135deg,#0c3057,#3a6ea5);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:14px;letter-spacing:0.5px;box-shadow:0 4px 12px rgba(12,48,87,0.25)}.bk-bt{font-weight:800;color:#0c3057;font-size:16px;line-height:1.1}.bk-bs{font-size:12px;color:#8a98a8}.bk-nav{display:flex;align-items:center;gap:10px}.bk-analyst{border:1px solid #d4dde7;background:#fff;color:#0c3057;border-radius:9px;padding:8px 14px;font-size:13px;font-weight:600;cursor:pointer;text-decoration:none}.bk-analyst:hover{background:#f0f4f9}.bk-lang{border:1px solid #d4dde7;background:#fff;color:#0c3057;border-radius:9px;padding:8px 13px;font-size:13px;font-weight:600;cursor:pointer}.bk-main{max-width:1120px;margin:0 auto;padding:28px 20px 80px}.bk-top{display:flex;align-items:flex-end;justify-content:space-between;flex-wrap:wrap;gap:14px;margin-bottom:8px}.bk-eyebrow{font-size:12px;font-weight:700;color:#b0883c;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px}.bk-h1{font-size:27px;font-weight:800;color:#0c3057;margin:0;line-height:1.2}.bk-sub{font-size:14px;color:#6b7785;margin-top:6px}.bk-fy{display:flex;gap:6px;background:#eaf0f6;padding:4px;border-radius:11px}.bk-fyb{border:none;background:transparent;color:#5b6b7c;font-size:13px;font-weight:600;padding:7px 14px;border-radius:8px;cursor:pointer}.bk-fyb.on{background:#fff;color:#0c3057;box-shadow:0 2px 6px rgba(20,40,70,0.1)}.bk-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(168px,1fr));gap:13px;margin:22px 0 30px}.bk-kpi{background:#fff;border:1px solid #e6ecf3;border-radius:14px;padding:16px 17px;box-shadow:0 2px 10px rgba(20,40,70,0.04)}.bk-kpi-l{font-size:12px;color:#8493a3;font-weight:600;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.4px}.bk-kpi-v{font-size:23px;font-weight:800;color:#0c3057;line-height:1}.bk-kpi-u{font-size:12px;color:#9aa7b6;font-weight:600;margin-top:4px}.bk-sectitle{font-size:16px;font-weight:700;color:#1a2733;margin:0 0 14px}.bk-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(264px,1fr));gap:14px}.bk-card{background:#fff;border:1px solid #e6ecf3;border-radius:15px;padding:17px 18px;box-shadow:0 2px 10px rgba(20,40,70,0.04);display:flex;flex-direction:column;transition:box-shadow .15s,transform .15s}.bk-card:hover{box-shadow:0 8px 22px rgba(20,40,70,0.1);transform:translateY(-2px)}.bk-card-top{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:14px}.bk-name{font-size:15.5px;font-weight:700;color:#0c3057;line-height:1.3}.bk-tag{font-size:10.5px;font-weight:700;padding:3px 8px;border-radius:6px;white-space:nowrap;flex-shrink:0}.bk-tag.conv{background:#eef4fb;color:#2c6cb0}.bk-tag.isl{background:#eef7f0;color:#2f8f54}.bk-metrics{display:flex;flex-direction:column;gap:9px;margin-bottom:15px}.bk-mrow{display:flex;align-items:baseline;justify-content:space-between;gap:8px}.bk-mk{font-size:12.5px;color:#7a8896}.bk-mv{font-size:14px;font-weight:700;color:#1a2733}.bk-ask{margin-top:auto;text-align:center;border:1px solid #d4dde7;background:#fafbfd;color:#0c3057;border-radius:10px;padding:9px;font-size:13px;font-weight:600;cursor:pointer;text-decoration:none;transition:all .15s}.bk-ask:hover{border-color:#3a6ea5;background:#f0f5fb}.bk-state{text-align:center;padding:70px 20px;color:#6b7785}.bk-spinner{width:34px;height:34px;border:3px solid #d8e2ec;border-top-color:#3a6ea5;border-radius:50%;margin:0 auto 16px;animation:bksp 0.8s linear infinite}@keyframes bksp{to{transform:rotate(360deg)}}.bk-retry{margin-top:14px;border:1px solid #d4dde7;background:#fff;color:#0c3057;border-radius:9px;padding:9px 18px;font-size:13px;font-weight:600;cursor:pointer}";
const T = {"en":{"brandSub":"Banking Intelligence","langLabel":"العربية","analyst":"AI Analyst","eyebrow":"Bank Financials","h1":"Jordanian Banks","sub":"Verified financials for all 15 licensed commercial banks.","kAssets":"Total Assets","kProfit":"Net Profit","kDeposits":"Deposits","kEquity":"Equity","kRoe":"Avg ROE","kCar":"Avg CAR","unitBn":"JOD bn","pct":"%","secTitle":"Banks by Assets","mAssets":"Assets","mProfit":"Net Profit","mRoe":"ROE","ask":"Ask AI","conv":"Conventional","isl":"Islamic","bn":"bn","mn":"mn","loading":"Loading bank data...","error":"Could not load data.","retry":"Retry"},"ar":{"brandSub":"ذكاء مصرفي","langLabel":"EN","analyst":"محلل الذكاء","eyebrow":"البيانات المالية","h1":"البنوك الأردنية","sub":"بيانات مالية مدققة لكل البنوك التجارية الـ 15 المرخصة.","kAssets":"إجمالي الأصول","kProfit":"صافي الربح","kDeposits":"الودائع","kEquity":"حقوق الملكية","kRoe":"متوسط العائد","kCar":"متوسط كفاية رأس المال","unitBn":"مليار د.أ","pct":"%","secTitle":"البنوك حسب الأصول","mAssets":"الأصول","mProfit":"صافي الربح","mRoe":"العائد","ask":"اسأل الذكاء","conv":"تقليدي","isl":"إسلامي","bn":"مليار","mn":"مليون","loading":"جارٍ تحميل البيانات...","error":"تعذّر تحميل البيانات.","retry":"إعادة المحاولة"}};

var PEG = 0.710;
var YEARS = [2025, 2024, 2023];

function jodv(v, cur) { return (cur === 'USD' && typeof v === 'number') ? v * PEG : v; }

function callMcp(name, args) {
  return fetch('/api/mcp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: name, arguments: args || {} } }) })
    .then(function (r) { return r.json(); })
    .then(function (j) { var tx = j && j.result && j.result.content && j.result.content[0] && j.result.content[0].text; return tx ? JSON.parse(tx) : null; });
}

function fmtBn(thousands, dec) {
  if (thousands == null || isNaN(thousands)) return String.fromCharCode(8212);
  return (thousands / 1000000).toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
}
function fmtMn(thousands) {
  if (thousands == null || isNaN(thousands)) return String.fromCharCode(8212);
  return Math.round(thousands / 1000).toLocaleString('en-US');
}
function fmtPct(v) { if (v == null || isNaN(v)) return String.fromCharCode(8212); return (Math.round(v * 10) / 10) + '%'; }

export default function BanksDashboard() {
  var a = useState('en'); var lang = a[0]; var setLang = a[1];
  var b = useState(2025); var year = b[0]; var setYear = b[1];
  var c = useState(null); var data = c[0]; var setData = c[1];
  var d = useState(true); var loading = d[0]; var setLoading = d[1];
  var e = useState(false); var errd = e[0]; var setErr = e[1];
  var metaRef = useRef(null);

  useEffect(function () { try { var l = localStorage.getItem('cf_lang'); if (l === 'ar' || l === 'en') setLang(l); } catch (x) {} }, []);
  useEffect(function () { try { document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'; document.documentElement.lang = lang; } catch (x) {} }, [lang]);

  function load(yr) {
    setLoading(true); setErr(false);
    var metaP = metaRef.current ? Promise.resolve(metaRef.current) : callMcp('list_banks', {});
    Promise.all([metaP, callMcp('sector_overview', { fiscal_year: yr })])
      .then(function (res) {
        var banksList = res[0] || []; metaRef.current = banksList;
        var sector = res[1] || {};
        var meta = {}; banksList.forEach(function (bk) { meta[bk.id] = bk; });
        var rows = sector.rows || [];
        var cards = rows.map(function (r) {
          var m = meta[r.bank_id] || {};
          return { id: r.bank_id, name_en: m.name_en || ('Bank ' + r.bank_id), name_ar: m.name_ar || m.name_en || ('Bank ' + r.bank_id), type: m.bank_type || '', assets: jodv(r.total_assets, r.currency), profit: jodv(r.net_profit, r.currency), roe: r.roe };
        }).sort(function (p, q) { return (q.assets || 0) - (p.assets || 0); });
        setData({ sector: sector, cards: cards });
        setLoading(false);
      })
      .catch(function () { setErr(true); setLoading(false); });
  }

  useEffect(function () { load(year); }, [year]);

  var t = T[lang];
  function toggleLang() { var n = lang === 'en' ? 'ar' : 'en'; setLang(n); try { localStorage.setItem('cf_lang', n); } catch (x) {} }

  var header = React.createElement('div', { className: 'bk-header' },
    React.createElement('a', { className: 'bk-brand', href: '/' },
      React.createElement('div', { className: 'bk-logo' }, 'ZAD'),
      React.createElement('div', null,
        React.createElement('div', { className: 'bk-bt' }, 'convo.finance'),
        React.createElement('div', { className: 'bk-bs' }, t.brandSub))),
    React.createElement('div', { className: 'bk-nav' },
      React.createElement('a', { className: 'bk-analyst', href: '/chat' }, t.analyst),
      React.createElement('button', { className: 'bk-lang', onClick: toggleLang }, t.langLabel)));

  var fyBtns = YEARS.map(function (y) { return React.createElement('button', { key: y, className: 'bk-fyb' + (y === year ? ' on' : ''), onClick: function () { setYear(y); } }, 'FY ' + y); });
  var top = React.createElement('div', { className: 'bk-top' },
    React.createElement('div', null,
      React.createElement('div', { className: 'bk-eyebrow' }, t.eyebrow),
      React.createElement('h1', { className: 'bk-h1' }, t.h1),
      React.createElement('div', { className: 'bk-sub' }, t.sub)),
    React.createElement('div', { className: 'bk-fy' }, fyBtns));

  var body;
  if (loading) {
    body = React.createElement('div', { className: 'bk-state' }, React.createElement('div', { className: 'bk-spinner' }), t.loading);
  } else if (errd) {
    body = React.createElement('div', { className: 'bk-state' }, t.error, React.createElement('div', null, React.createElement('button', { className: 'bk-retry', onClick: function () { load(year); } }, t.retry)));
  } else if (data) {
    var agg = (data.sector && data.sector.aggregates) || {};
    var S = function (f) { return agg[f] ? agg[f].sum : null; };
    var AV = function (f) { return agg[f] ? agg[f].avg : null; };
    var kpiDefs = [
      { l: t.kAssets, v: fmtBn(S('total_assets'), 2), u: t.unitBn },
      { l: t.kProfit, v: fmtBn(S('net_profit'), 2), u: t.unitBn },
      { l: t.kDeposits, v: fmtBn(S('customer_deposits'), 2), u: t.unitBn },
      { l: t.kEquity, v: fmtBn(S('total_equity'), 2), u: t.unitBn },
      { l: t.kRoe, v: fmtPct(AV('roe')), u: '' },
      { l: t.kCar, v: fmtPct(AV('car')), u: '' }
    ];
    var kpis = React.createElement('div', { className: 'bk-kpis' }, kpiDefs.map(function (k, i) {
      return React.createElement('div', { className: 'bk-kpi', key: i },
        React.createElement('div', { className: 'bk-kpi-l' }, k.l),
        React.createElement('div', { className: 'bk-kpi-v' }, k.v),
        k.u ? React.createElement('div', { className: 'bk-kpi-u' }, k.u) : null);
    }));
    var cards = React.createElement('div', { className: 'bk-grid' }, data.cards.map(function (c2) {
      var isIsl = (c2.type || '').toLowerCase().indexOf('islam') >= 0;
      var nm = lang === 'ar' ? c2.name_ar : c2.name_en;
      return React.createElement('div', { className: 'bk-card', key: c2.id },
        React.createElement('div', { className: 'bk-card-top' },
          React.createElement('div', { className: 'bk-name' }, nm),
          React.createElement('div', { className: 'bk-tag ' + (isIsl ? 'isl' : 'conv') }, isIsl ? t.isl : t.conv)),
        React.createElement('div', { className: 'bk-metrics' },
          React.createElement('div', { className: 'bk-mrow' }, React.createElement('span', { className: 'bk-mk' }, t.mAssets), React.createElement('span', { className: 'bk-mv' }, fmtBn(c2.assets, 1) + ' ' + t.bn)),
          React.createElement('div', { className: 'bk-mrow' }, React.createElement('span', { className: 'bk-mk' }, t.mProfit), React.createElement('span', { className: 'bk-mv' }, fmtMn(c2.profit) + ' ' + t.mn)),
          React.createElement('div', { className: 'bk-mrow' }, React.createElement('span', { className: 'bk-mk' }, t.mRoe), React.createElement('span', { className: 'bk-mv' }, fmtPct(c2.roe)))),
        React.createElement('a', { className: 'bk-ask', href: '/chat' }, t.ask));
    }));
    body = React.createElement('div', null, kpis, React.createElement('div', { className: 'bk-sectitle' }, t.secTitle), cards);
  } else { body = null; }

  return React.createElement('div', { className: 'bk-wrap' },
    React.createElement('style', { dangerouslySetInnerHTML: { __html: CSS } }),
    header,
    React.createElement('div', { className: 'bk-main' }, top, body));
}

