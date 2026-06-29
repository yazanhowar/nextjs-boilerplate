'use client';
import React, { useState, useEffect } from 'react';

const CSS = "*{box-sizing:border-box}.sx-wrap{min-height:100vh;background:#f2f4f7;color:#0f172a;transition:background .2s,color .2s}html.dark .sx-wrap{background:#0b1016;color:#e6edf5}.sx-header{position:sticky;top:0;z-index:20;display:flex;align-items:center;justify-content:space-between;padding:13px 22px;background:rgba(255,255,255,0.92);backdrop-filter:blur(10px);border-bottom:1px solid #e6ecf3}html.dark .sx-header{background:rgba(15,22,32,0.92);border-bottom:1px solid #1e2733}.sx-brand{display:flex;align-items:center;gap:10px;text-decoration:none;cursor:pointer}.sx-logo{height:34px;width:auto;display:block}.sx-nav{display:flex;align-items:center;gap:8px}.sx-btn{border:1px solid #d4dde7;background:#fff;color:#0c3057;border-radius:9px;padding:7px 12px;font-size:13px;font-weight:600;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;gap:6px}.sx-btn:hover{background:#f0f4f9}html.dark .sx-btn{border-color:#2a3543;background:#161f2b;color:#cdd9e6}html.dark .sx-btn:hover{background:#1d2835}.sx-cta{background:linear-gradient(135deg,#0c3057,#3a6ea5);color:#fff;border:none}.sx-cta:hover{filter:brightness(1.07)}.sx-main{max-width:1080px;margin:0 auto;padding:26px 20px 70px}.sx-top{margin-bottom:6px}.sx-eyebrow{font-size:12px;font-weight:700;color:#b0883c;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px}.sx-h1{font-size:26px;font-weight:800;margin:0;line-height:1.2}.sx-sub{font-size:13.5px;color:#6b7785;margin-top:6px}html.dark .sx-sub{color:#8b97a6}.sx-period{display:inline-block;margin-top:10px;font-size:12px;font-weight:600;color:#2c6cb0;background:#eaf3fb;border:1px solid #d4e6f5;border-radius:8px;padding:5px 11px}html.dark .sx-period{color:#7fb6e8;background:#11202e;border-color:#1d3span}html.dark .sx-period{color:#7fb6e8;background:#11202e;border-color:#1d3346}.sx-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:13px;margin:20px 0 26px}.sx-kpi{background:#fff;border:1px solid #e6ecf3;border-radius:14px;padding:17px 18px;box-shadow:0 2px 10px rgba(20,40,70,0.04)}html.dark .sx-kpi{background:#141c27;border-color:#232e3c;box-shadow:none}.sx-kpi-l{font-size:12px;color:#8493a3;font-weight:600;text-transform:uppercase;letter-spacing:0.4px;margin-bottom:9px}html.dark .sx-kpi-l{color:#7c8a9a}.sx-kpi-v{font-size:25px;font-weight:800;color:#0c3057;line-height:1}html.dark .sx-kpi-v{color:#eaf1f8}.sx-kpi-u{font-size:12px;color:#9aa7b6;font-weight:600;margin-top:5px}.sx-kpi-d{font-size:11.5px;font-weight:600;margin-top:7px}.sx-up{color:#2f8f54}.sx-down{color:#c0492f}.sx-panel{background:#fff;border:1px solid #e6ecf3;border-radius:15px;padding:19px 20px;box-shadow:0 2px 10px rgba(20,40,70,0.04);margin-bottom:18px}html.dark .sx-panel{background:#141c27;border-color:#232e3c;box-shadow:none}.sx-panel-h{font-size:15px;font-weight:700;margin:0 0 3px}.sx-panel-s{font-size:12px;color:#8493a3;margin-bottom:16px}.sx-chart{display:flex;align-items:flex-end;gap:6px;height:180px;padding-top:8px}.sx-col{flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;min-width:0}.sx-bar{width:100%;max-width:34px;background:linear-gradient(180deg,#3a6ea5,#0c3057);border-radius:5px 5px 0 0;min-height:3px}html.dark .sx-bar{background:linear-gradient(180deg,#5b9bd6,#2c5a8f)}.sx-col-l{font-size:9.5px;color:#9aa7b6;white-space:nowrap;transform:rotate(-45deg);transform-origin:center;height:30px}.sx-col-v{font-size:10px;font-weight:700;color:#37485a}html.dark .sx-col-v{color:#aab8c6}.sx-legend{display:flex;gap:16px;flex-wrap:wrap;margin-top:4px;font-size:12px;color:#6b7785}.sx-state{text-align:center;padding:70px 20px;color:#6b7785}.sx-spin{width:34px;height:34px;border:3px solid #d8e2ec;border-top-color:#3a6ea5;border-radius:50%;margin:0 auto 16px;animation:sxs .8s linear infinite}@keyframes sxs{to{transform:rotate(360deg)}}.sx-foot{font-size:11.5px;color:#9aa7b6;text-align:center;margin-top:8px}";
const T = {"en":{"brandSub":"Sector Intelligence","langLabel":"العربية","eyebrow":"ABJ · Sector Aggregate","h1":"Jordanian Banking Sector","sub":"Aggregate indicators for all licensed banks, published by the Association of Banks in Jordan.","asOf":"As of","kAssets":"Total Assets","kDeposits":"Total Deposits","kCredit":"Credit Facilities","kLDR":"Credit-to-Deposit","unitBn":"JOD bn","trendTitle":"Total Assets Trend","trendSub":"JOD billion, by reporting period","depTrend":"Deposits vs Credit Facilities","depTrendSub":"JOD billion, latest periods","analystCta":"Ask ZAD about the sector","source":"Source: Association of Banks in Jordan","loading":"Loading sector data...","error":"Could not load sector data.","retry":"Retry"},"ar":{"brandSub":"ذكاء القطاع","langLabel":"EN","eyebrow":"جمعية البنوك · إجمالي القطاع","h1":"القطاع المصرفي الأردني","sub":"مؤشرات إجمالية لكل البنوك المرخصة، الصادرة عن جمعية البنوك في الأردن.","asOf":"كما في","kAssets":"إجمالي الموجودات","kDeposits":"إجمالي الودائع","kCredit":"التسهيلات الائتمانية","kLDR":"التسهيلات إلى الودائع","unitBn":"مليار د.أ","trendTitle":"تطور إجمالي الموجودات","trendSub":"مليار دينار، حسب فترة التقرير","depTrend":"الودائع مقابل التسهيلات","depTrendSub":"مليار دينار، آخر الفترات","analystCta":"اسأل زاد عن القطاع","source":"المصدر: جمعية البنوك في الأردن","loading":"جارٍ تحميل بيانات القطاع...","error":"تعذّر تحميل بيانات القطاع.","retry":"إعادة المحاولة"}};

function callMcp(name) {
  return fetch('/api/mcp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: name, arguments: {} } }) })
    .then(function (r) { return r.json(); })
    .then(function (j) { var tx = j && j.result && j.result.content && j.result.content[0] && j.result.content[0].text; return tx ? JSON.parse(tx) : null; });
}

function fmt(v, dec) { if (v == null || isNaN(v)) return String.fromCharCode(8212); return Number(v).toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec }); }

function shortPeriod(p) {
  if (!p) return '';
  var s = String(p);
  if (s.length >= 7 && s.charAt(4) === '-') { return s.slice(2, 4) + '/' + s.slice(5, 7); }
  return s;
}

export default function SectorPage() {
  var a = useState('en'); var lang = a[0]; var setLang = a[1];
  var th = useState('light'); var theme = th[0]; var setTheme = th[1];
  var d = useState(null); var data = d[0]; var setData = d[1];
  var l = useState(true); var loading = l[0]; var setLoading = l[1];
  var e = useState(false); var errd = e[0]; var setErr = e[1];

  useEffect(function () {
    try { var lg = localStorage.getItem('cf_lang'); if (lg === 'ar' || lg === 'en') setLang(lg); } catch (x) {}
    try { var t0 = localStorage.getItem('theme'); if (t0 === 'dark') { setTheme('dark'); document.documentElement.classList.add('dark'); } } catch (x) {}
  }, []);
  useEffect(function () { try { document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'; document.documentElement.lang = lang; } catch (x) {} }, [lang]);

  function load() {
    setLoading(true); setErr(false);
    callMcp('abj_sector').then(function (res) {
      if (!res || !res.latest) { setErr(true); setLoading(false); return; }
      setData(res); setLoading(false);
    }).catch(function () { setErr(true); setLoading(false); });
  }
  useEffect(function () { load(); }, []);

  var t = T[lang];
  function toggleLang() { var n = lang === 'en' ? 'ar' : 'en'; setLang(n); try { localStorage.setItem('cf_lang', n); } catch (x) {} }
  function toggleTheme() {
    var n = theme === 'dark' ? 'light' : 'dark'; setTheme(n);
    try { localStorage.setItem('theme', n); if (n === 'dark') document.documentElement.classList.add('dark'); else document.documentElement.classList.remove('dark'); } catch (x) {}
  }

  var logo = React.createElement('img', { className: 'sx-logo', src: lang === 'ar' ? '/convo-zad-ar.svg' : '/convo-zad-en.svg', alt: 'convo.finance ZAD' });
  var header = React.createElement('div', { className: 'sx-header' },
    React.createElement('a', { className: 'sx-brand', href: '/' }, logo),
    React.createElement('div', { className: 'sx-nav' },
      React.createElement('button', { className: 'sx-btn', onClick: toggleTheme, title: 'Theme' }, theme === 'dark' ? String.fromCharCode(9728) : String.fromCharCode(9790)),
      React.createElement('button', { className: 'sx-btn', onClick: toggleLang }, t.langLabel),
      React.createElement('a', { className: 'sx-btn sx-cta', href: '/chat?focus=sector' }, t.analystCta)));

  var body;
  if (loading) {
    body = React.createElement('div', { className: 'sx-state' }, React.createElement('div', { className: 'sx-spin' }), t.loading);
  } else if (errd) {
    body = React.createElement('div', { className: 'sx-state' }, t.error, React.createElement('div', { style: { marginTop: '14px' } }, React.createElement('button', { className: 'sx-btn', onClick: load }, t.retry)));
  } else if (data) {
    var L = data.latest || {};
    function lv(k) { return L[k] ? Number(L[k].value) : null; }
    var assets = lv('total_assets'), deposits = lv('total_deposits'), credit = lv('total_credit_facilities');
    var ldr = (credit != null && deposits) ? (credit / deposits * 100) : null;
    var period = (L.total_assets && L.total_assets.period) || '';
    var kpiDefs = [
      { l: t.kAssets, v: fmt(assets, 2), u: t.unitBn },
      { l: t.kDeposits, v: fmt(deposits, 2), u: t.unitBn },
      { l: t.kCredit, v: fmt(credit, 2), u: t.unitBn },
      { l: t.kLDR, v: fmt(ldr, 1) + '%', u: '' }
    ];
    var kpis = React.createElement('div', { className: 'sx-kpis' }, kpiDefs.map(function (k, i) {
      return React.createElement('div', { className: 'sx-kpi', key: i },
        React.createElement('div', { className: 'sx-kpi-l' }, k.l),
        React.createElement('div', { className: 'sx-kpi-v' }, k.v),
        k.u ? React.createElement('div', { className: 'sx-kpi-u' }, k.u) : null);
    }));
    var series = (data.series && data.series.total_assets) || [];
    var pts = series.slice(-12);
    var maxV = 1; pts.forEach(function (p) { var v = Number(p.value) || 0; if (v > maxV) maxV = v; });
    var bars = React.createElement('div', { className: 'sx-chart' }, pts.map(function (p, i) {
      var v = Number(p.value) || 0; var h = Math.max(3, (v / maxV) * 150);
      return React.createElement('div', { className: 'sx-col', key: i },
        React.createElement('div', { className: 'sx-col-v' }, fmt(v, 0)),
        React.createElement('div', { className: 'sx-bar', style: { height: h + 'px' } }),
        React.createElement('div', { className: 'sx-col-l' }, shortPeriod(p.period)));
    }));
    var trend = React.createElement('div', { className: 'sx-panel' },
      React.createElement('div', { className: 'sx-panel-h' }, t.trendTitle),
      React.createElement('div', { className: 'sx-panel-s' }, t.trendSub),
      bars);
    var periodChip = period ? React.createElement('div', { className: 'sx-period' }, t.asOf + ' ' + period) : null;
    body = React.createElement('div', null, periodChip, kpis, trend, React.createElement('div', { className: 'sx-foot' }, t.source));
  }

  var top = React.createElement('div', { className: 'sx-top' },
    React.createElement('div', { className: 'sx-eyebrow' }, t.eyebrow),
    React.createElement('h1', { className: 'sx-h1' }, t.h1),
    React.createElement('div', { className: 'sx-sub' }, t.sub));

  return React.createElement('div', { className: 'sx-wrap' },
    React.createElement('style', { dangerouslySetInnerHTML: { __html: CSS } }),
    header,
    React.createElement('div', { className: 'sx-main' }, top, body));
}

