'use client';
import { useState, useEffect } from 'react';

const CSS = ".sec-root{--navy:#0c3057;--blue:#3a6ea5;--gold:#b0883c;--bg:#f4f7fa;--card:#fff;--ink:#0f1f30;--sub:#5a6b7d;--faint:#9aa7b4;--line:#e7edf3;min-height:100vh;background:#f4f7fa;color:#0f1f30;font-family:'Inter','Segoe UI',sans-serif}.sec-root[dir='rtl']{font-family:'Cairo','Segoe UI',Tahoma,sans-serif}.sec-wrap{max-width:1120px;margin:0 auto;padding:20px 24px 60px}.sec-head{display:flex;align-items:center;justify-content:space-between;padding-bottom:8px}.sec-brand{display:flex;align-items:center;gap:11px;text-decoration:none;color:inherit;cursor:pointer}.sec-mark{width:42px;height:42px;border-radius:12px;background:linear-gradient(135deg,#0c3057,#3a6ea5);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:16px;box-shadow:0 5px 15px rgba(12,48,87,.26)}.sec-wm b{font-size:16px;font-weight:800;display:block;line-height:1.1}.sec-wm span{font-size:11.5px;color:#5a6b7d;font-weight:600}.sec-lang{border:1px solid #e7edf3;background:#fff;color:#0f1f30;font:inherit;font-size:13px;font-weight:700;padding:8px 14px;border-radius:999px;cursor:pointer}.sec-lang:hover{border-color:#3a6ea5;color:#3a6ea5}.sec-title{margin:26px 0 4px;font-size:27px;font-weight:800;letter-spacing:-.5px}.sec-sub{font-size:14px;color:#5a6b7d;margin-bottom:24px}.sec-kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:26px}.sec-kpi{background:#fff;border:1px solid #e7edf3;border-radius:16px;padding:18px}.sec-kpi .lab{font-size:11px;font-weight:700;letter-spacing:.5px;color:#9aa7b4;text-transform:uppercase}.sec-kpi .val{font-size:24px;font-weight:800;margin:8px 0 3px;color:#0c3057;font-variant-numeric:tabular-nums}.sec-kpi .ctx{font-size:12px;color:#5a6b7d}.sec-panel{background:#fff;border:1px solid #e7edf3;border-radius:16px;padding:22px 22px 12px;margin-bottom:22px}.sec-panelh{font-size:15px;font-weight:800;margin-bottom:18px;color:#0f1f30}.sec-bar{display:flex;align-items:center;gap:12px;margin-bottom:13px}.sec-bar .bn{width:200px;font-size:12.5px;font-weight:600;color:#0f1f30;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex-shrink:0}.sec-bar .bt{flex:1;background:#eef3f8;border-radius:7px;height:22px;overflow:hidden}.sec-bar .bf{height:100%;background:linear-gradient(90deg,#3a6ea5,#0c3057);border-radius:7px}.sec-root[dir='rtl'] .sec-bar .bf{background:linear-gradient(270deg,#3a6ea5,#0c3057)}.sec-bar .bv{width:74px;text-align:end;font-size:12.5px;font-weight:700;color:#0c3057;font-variant-numeric:tabular-nums;flex-shrink:0}.sec-tablewrap{background:#fff;border:1px solid #e7edf3;border-radius:16px;overflow:hidden}.sec-table{width:100%;border-collapse:collapse;font-size:13px}.sec-table thead th{text-align:start;font-size:10.5px;font-weight:700;letter-spacing:.4px;color:#9aa7b4;text-transform:uppercase;padding:12px 16px;background:#f8fafc;border-bottom:1px solid #e7edf3}.sec-table th.n,.sec-table td.n{text-align:end;font-variant-numeric:tabular-nums}.sec-table tbody td{padding:12px 16px;border-bottom:1px solid #f0f4f8}.sec-table tbody tr:last-child td{border-bottom:none}.sec-table tbody tr:hover{background:#f8fafc}.sec-bk{font-weight:700}.sec-tag{display:inline-block;font-size:10.5px;font-weight:700;padding:3px 8px;border-radius:6px}.sec-tag.conv{background:#e9f1fb;color:#3a6ea5}.sec-tag.isl{background:#e7f4ee;color:#1f8f5a}.sec-load{padding:56px 0;text-align:center;color:#9aa7b4;font-size:14px}.sec-retry{margin-top:14px;border:1px solid #e7edf3;background:#fff;color:#0c3057;font:inherit;font-weight:700;font-size:13px;padding:9px 18px;border-radius:10px;cursor:pointer}.sec-foot{text-align:center;color:#9aa7b4;font-size:12px;margin-top:30px}@media(max-width:860px){.sec-kpis{grid-template-columns:repeat(2,1fr)}.sec-bar .bn{width:120px}}@media(max-width:560px){.sec-kpis{grid-template-columns:1fr}}";
const T = {"en":{"dir":"ltr","lang":"العربية","wm":"Banking Intelligence","title":"Banking Sector","sub":"Aggregate figures across all 15 licensed banks — Association of Banks in Jordan basis.","kAssets":"Total Assets","kProfit":"Net Profit","kDeposits":"Customer Deposits","kEquity":"Total Equity","kRoe":"Average ROE","kCar":"Average CAR","ctxSum":"15 banks combined","ctxAvg":"sector average","barTitle":"Banks by total assets (JOD bn)","cBank":"Bank","cType":"Type","cAssets":"Assets (JOD bn)","cProfit":"Net Profit (JOD m)","cRoe":"ROE","cCar":"CAR","cDep":"Deposits (JOD bn)","conv":"Conventional","isl":"Islamic","loading":"Loading sector data…","errMsg":"Could not load sector data.","retry":"Retry","foot":"convo.finance · ZAD — sector intelligence","fy":"FY"},"ar":{"dir":"rtl","lang":"EN","wm":"ذكاء مصرفي","title":"القطاع المصرفي","sub":"مؤشرات مجمّعة لجميع البنوك المرخّصة الـ15 — وفق أساس جمعية البنوك في الأردن.","kAssets":"إجمالي الموجودات","kProfit":"صافي الربح","kDeposits":"ودائع العملاء","kEquity":"إجمالي حقوق الملكية","kRoe":"متوسط العائد على الملكية","kCar":"متوسط كفاية رأس المال","ctxSum":"إجمالي 15 بنكاً","ctxAvg":"متوسط القطاع","barTitle":"البنوك حسب إجمالي الموجودات (مليار د.أ)","cBank":"البنك","cType":"النوع","cAssets":"الموجودات (مليار)","cProfit":"صافي الربح (مليون)","cRoe":"العائد","cCar":"كفاية رأس المال","cDep":"الودائع (مليار)","conv":"تقليدي","isl":"إسلامي","loading":"جارٍ تحميل بيانات القطاع…","errMsg":"تعذّر تحميل بيانات القطاع.","retry":"إعادة المحاولة","foot":"convo.finance · زاد — ذكاء القطاع","fy":"السنة المالية"}};

export default function Page() {
  const [lang, setLang] = useState('en');
  const [data, setData] = useState(null);
  const [status, setStatus] = useState('loading');
  useEffect(function () {
    var saved = 'en';
    try { saved = localStorage.getItem('cf_lang') || 'en'; } catch (e) {}
    if (saved !== 'en' && saved !== 'ar') saved = 'en';
    setLang(saved);
  }, []);
  useEffect(function () {
    try { document.documentElement.setAttribute('dir', T[lang].dir); document.documentElement.setAttribute('lang', lang); } catch (e) {}
  }, [lang]);
  function toggle() { var nx = lang === 'en' ? 'ar' : 'en'; setLang(nx); try { localStorage.setItem('cf_lang', nx); } catch (e) {} }
  function load() {
    setStatus('loading');
    var rpc = function (obj) { return fetch('/api/mcp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(obj) }).then(function (r) { return r.json(); }).then(function (j) { return JSON.parse(j.result.content[0].text); }); };
    rpc({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'list_banks', arguments: {} } }).then(function (banks) {
      var idMap = {}; banks.forEach(function (b) { idMap[b.id] = { en: b.name_en, ar: b.name_ar, type: b.bank_type }; });
      return rpc({ jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'sector_overview', arguments: {} } }).then(function (sec) {
        var rows = sec.rows || []; var PEG = 0.710;
        function jod(v, cur) { if (v == null) return 0; return cur === 'USD' ? v * PEG : v; }
        var sa = 0, sp = 0, sd = 0, se = 0, roe = [], car = [];
        var per = rows.map(function (r) {
          var aJ = jod(r.total_assets, r.currency); sa += aJ;
          var pJ = jod(r.net_profit, r.currency); sp += pJ;
          var dJ = jod(r.customer_deposits, r.currency); sd += dJ;
          se += jod(r.total_equity != null ? r.total_equity : r.shareholders_equity, r.currency);
          if (typeof r.roe === 'number') roe.push(r.roe);
          if (typeof r.car === 'number') car.push(r.car);
          var nm = idMap[r.bank_id] || {};
          return { en: nm.en || ('Bank ' + r.bank_id), ar: nm.ar || ('Bank ' + r.bank_id), type: nm.type, assets: aJ / 1e6, profit: r.net_profit != null ? pJ / 1e3 : null, dep: dJ / 1e6, roe: r.roe, car: r.car };
        });
        per.sort(function (a, b) { return b.assets - a.assets; });
        function avg(a) { return a.length ? a.reduce(function (s, x) { return s + x; }, 0) / a.length : 0; }
        setData({ year: sec.fiscal_year, per: per, totals: { assets: sa / 1e6, profit: sp / 1e6, dep: sd / 1e6, eq: se / 1e6, roe: avg(roe), car: avg(car) } });
        setStatus('ok');
      });
    }).catch(function () { setStatus('error'); });
  }
  useEffect(function () { load(); }, []);
  var t = T[lang];
  function fmt(n, d) { return Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }); }
  function nm(o) { return lang === 'ar' ? o.ar : o.en; }
  return (
    <div className="sec-root" dir={t.dir}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="sec-wrap">
        <div className="sec-head">
          <a className="sec-brand" href="/"><div className="sec-mark">ZAD</div><div className="sec-wm"><b>convo.finance</b><span>{t.wm}</span></div></a>
          <button className="sec-lang" onClick={toggle}>{t.lang}</button>
        </div>
        <h1 className="sec-title">{t.title}</h1>
        <div className="sec-sub">{t.sub}{data ? (' · ' + t.fy + ' ' + data.year) : ''}</div>
        {status === 'loading' ? (<div className="sec-load">{t.loading}</div>) : null}
        {status === 'error' ? (<div className="sec-load">{t.errMsg}<br /><button className="sec-retry" onClick={load}>{t.retry}</button></div>) : null}
        {status === 'ok' && data ? (
          <div>
            <div className="sec-kpis">
              <div className="sec-kpi"><div className="lab">{t.kAssets}</div><div className="val">JOD {fmt(data.totals.assets, 2)}B</div><div className="ctx">{t.ctxSum}</div></div>
              <div className="sec-kpi"><div className="lab">{t.kProfit}</div><div className="val">JOD {fmt(data.totals.profit, 2)}B</div><div className="ctx">{t.ctxSum}</div></div>
              <div className="sec-kpi"><div className="lab">{t.kDeposits}</div><div className="val">JOD {fmt(data.totals.dep, 2)}B</div><div className="ctx">{t.ctxSum}</div></div>
              <div className="sec-kpi"><div className="lab">{t.kEquity}</div><div className="val">JOD {fmt(data.totals.eq, 2)}B</div><div className="ctx">{t.ctxSum}</div></div>
              <div className="sec-kpi"><div className="lab">{t.kRoe}</div><div className="val">{fmt(data.totals.roe, 1)}%</div><div className="ctx">{t.ctxAvg}</div></div>
              <div className="sec-kpi"><div className="lab">{t.kCar}</div><div className="val">{fmt(data.totals.car, 1)}%</div><div className="ctx">{t.ctxAvg}</div></div>
            </div>
            <div className="sec-panel">
              <div className="sec-panelh">{t.barTitle}</div>
              {data.per.map(function (d2, i) { var pct = Math.max(2, (d2.assets / data.per[0].assets) * 100); return (
                <div className="sec-bar" key={i}>
                  <div className="bn">{nm(d2)}</div>
                  <div className="bt"><div className="bf" style={{ width: pct + '%' }}></div></div>
                  <div className="bv">{fmt(d2.assets, 2)}</div>
                </div>
              ); })}
            </div>
            <div className="sec-tablewrap">
              <table className="sec-table">
                <thead><tr><th>{t.cBank}</th><th>{t.cType}</th><th className="n">{t.cAssets}</th><th className="n">{t.cProfit}</th><th className="n">{t.cRoe}</th><th className="n">{t.cCar}</th><th className="n">{t.cDep}</th></tr></thead>
                <tbody>
                  {data.per.map(function (d2, i) { return (
                    <tr key={i}>
                      <td className="sec-bk">{nm(d2)}</td>
                      <td><span className={d2.type === 'islamic' ? 'sec-tag isl' : 'sec-tag conv'}>{d2.type === 'islamic' ? t.isl : t.conv}</span></td>
                      <td className="n">{fmt(d2.assets, 2)}</td>
                      <td className="n">{d2.profit != null ? fmt(d2.profit, 0) : '—'}</td>
                      <td className="n">{d2.roe != null ? fmt(d2.roe, 1) + '%' : '—'}</td>
                      <td className="n">{d2.car != null ? fmt(d2.car, 1) + '%' : '—'}</td>
                      <td className="n">{fmt(d2.dep, 2)}</td>
                    </tr>
                  ); })}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
        <div className="sec-foot">{t.foot}</div>
      </div>
    </div>
  );
}
