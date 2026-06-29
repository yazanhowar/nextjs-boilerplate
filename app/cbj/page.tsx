'use client';
import { useState, useEffect } from 'react';

const CSS = ".cbj-root{--navy:#0c3057;--blue:#3a6ea5;--gold:#b0883c;--bg:#f4f7fa;--card:#fff;--ink:#0f1f30;--sub:#5a6b7d;--faint:#9aa7b4;--line:#e7edf3;min-height:100vh;background:#f4f7fa;color:#0f1f30;font-family:'Inter','Segoe UI',sans-serif}.cbj-root[dir='rtl']{font-family:'Cairo','Segoe UI',Tahoma,sans-serif}.cbj-wrap{max-width:1120px;margin:0 auto;padding:20px 24px 60px}.cbj-head{display:flex;align-items:center;justify-content:space-between;padding-bottom:8px}.cbj-brand{display:flex;align-items:center;gap:11px;text-decoration:none;color:inherit;cursor:pointer}.cbj-mark{width:42px;height:42px;border-radius:12px;background:linear-gradient(135deg,#0c3057,#3a6ea5);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:16px;box-shadow:0 5px 15px rgba(12,48,87,.26)}.cbj-wm b{font-size:16px;font-weight:800;display:block;line-height:1.1}.cbj-wm span{font-size:11.5px;color:#5a6b7d;font-weight:600}.cbj-lang{border:1px solid #e7edf3;background:#fff;color:#0f1f30;font:inherit;font-size:13px;font-weight:700;padding:8px 14px;border-radius:999px;cursor:pointer}.cbj-lang:hover{border-color:#3a6ea5;color:#3a6ea5}.cbj-title{margin:26px 0 4px;font-size:27px;font-weight:800;letter-spacing:-.5px}.cbj-sub{font-size:14px;color:#5a6b7d;margin-bottom:24px}.cbj-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:26px}.cbj-kpi{background:#fff;border:1px solid #e7edf3;border-radius:16px;padding:18px 18px 16px;box-shadow:0 1px 2px rgba(15,31,48,.04)}.cbj-kpi .lab{font-size:11px;font-weight:700;letter-spacing:.5px;color:#9aa7b4;text-transform:uppercase}.cbj-kpi .val{font-size:26px;font-weight:800;margin:8px 0 3px;color:#0c3057;font-variant-numeric:tabular-nums}.cbj-kpi .ctx{font-size:12px;color:#5a6b7d}.cbj-bar{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px;flex-wrap:wrap}.cbj-chips{display:flex;gap:8px;flex-wrap:wrap}.cbj-chip{border:1px solid #e7edf3;background:#fff;color:#5a6b7d;font:inherit;font-size:12.5px;font-weight:700;padding:7px 14px;border-radius:999px;cursor:pointer;transition:.12s}.cbj-chip:hover{border-color:#6c9bc8}.cbj-chip.on{background:#0c3057;border-color:#0c3057;color:#fff}.cbj-upload{display:inline-flex;align-items:center;gap:9px;background:linear-gradient(135deg,#0c3057,#0a2742);color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:11px 20px;border-radius:12px;box-shadow:0 6px 18px rgba(12,48,87,.24);cursor:pointer;border:none}.cbj-upload:hover{transform:translateY(-1px)}.cbj-tablewrap{background:#fff;border:1px solid #e7edf3;border-radius:16px;overflow:hidden;box-shadow:0 1px 2px rgba(15,31,48,.04)}.cbj-table{width:100%;border-collapse:collapse;font-size:13.5px}.cbj-table thead th{text-align:start;font-size:11px;font-weight:700;letter-spacing:.4px;color:#9aa7b4;text-transform:uppercase;padding:13px 18px;background:#f8fafc;border-bottom:1px solid #e7edf3}.cbj-table tbody td{padding:13px 18px;border-bottom:1px solid #f0f4f8;color:#0f1f30}.cbj-table tbody tr:last-child td{border-bottom:none}.cbj-table tbody tr:hover{background:#f8fafc}.cbj-num{font-variant-numeric:tabular-nums;font-weight:700}.cbj-bank{font-weight:700}.cbj-badge{display:inline-block;font-size:11px;font-weight:700;padding:4px 10px;border-radius:999px}.cbj-badge.cur{background:#e7f4ee;color:#1f8f5a}.cbj-badge.due{background:#fbf3e6;color:#b0883c}.cbj-freq{display:inline-block;font-size:11.5px;font-weight:700;color:#3a6ea5;background:#e9f1fb;padding:3px 9px;border-radius:6px}.cbj-foot{text-align:center;color:#9aa7b4;font-size:12px;margin-top:30px}@media(max-width:860px){.cbj-kpis{grid-template-columns:repeat(2,1fr)}}@media(max-width:560px){.cbj-kpis{grid-template-columns:1fr}}";
const T = {"en":{"dir":"ltr","lang":"العربية","wm":"Banking Intelligence","title":"CBJ Regulatory Reports","sub":"Submission tracker across all licensed banks, by reporting period.","kBanks":"Banks Reporting","kBanksCtx":"of 15 licensed","kSubs":"Submissions (YTD)","kSubsCtx":"2026 to date","kPeriod":"Latest Period","kPeriodCtx":"most recent filing","kRate":"On-time Rate","kRateCtx":"trailing 12 months","fAll":"All","fM":"Monthly","fQ":"Quarterly","fA":"Annual","upload":"Upload Documents","cBank":"Bank","cFreq":"Frequency","cPeriod":"Latest Period","cReports":"Reports Filed","cStatus":"Status","stCur":"Current","stDue":"Due","mLabel":"Monthly","qLabel":"Quarterly","aLabel":"Annual","foot":"convo.finance · ZAD — CBJ regulatory intelligence"},"ar":{"dir":"rtl","lang":"EN","wm":"ذكاء مصرفي","title":"تقارير البنك المركزي الرقابية","sub":"متابعة التقارير المقدمة من جميع البنوك المرخّصة، حسب فترة الإبلاغ.","kBanks":"بنوك مُبلِّغة","kBanksCtx":"من أصل 15 مرخّصاً","kSubs":"التقارير المقدمة","kSubsCtx":"2026 حتى تاريخه","kPeriod":"آخر فترة","kPeriodCtx":"أحدث تقرير مقدّم","kRate":"نسبة الالتزام","kRateCtx":"آخر 12 شهراً","fAll":"الكل","fM":"شهري","fQ":"ربع سنوي","fA":"سنوي","upload":"رفع المستندات","cBank":"البنك","cFreq":"التكرار","cPeriod":"آخر فترة","cReports":"التقارير المقدمة","cStatus":"الحالة","stCur":"محدّث","stDue":"مستحق","mLabel":"شهري","qLabel":"ربع سنوي","aLabel":"سنوي","foot":"convo.finance · زاد — ذكاء رقابي للبنك المركزي"}};
const DATA = [{"en":"Arab Bank","ar":"البنك العربي","freq":"M","pEn":"May 2026","pAr":"أيار 2026","reports":17,"status":"cur"},{"en":"Housing Bank","ar":"بنك الإسكان","freq":"M","pEn":"May 2026","pAr":"أيار 2026","reports":17,"status":"cur"},{"en":"Jordan Islamic Bank","ar":"البنك الإسلامي الأردني","freq":"M","pEn":"May 2026","pAr":"أيار 2026","reports":16,"status":"cur"},{"en":"Bank of Jordan","ar":"بنك الأردن","freq":"M","pEn":"Apr 2026","pAr":"نيسان 2026","reports":15,"status":"due"},{"en":"Cairo Amman Bank","ar":"بنك القاهرة عمّان","freq":"M","pEn":"May 2026","pAr":"أيار 2026","reports":16,"status":"cur"},{"en":"Jordan Ahli Bank","ar":"البنك الأهلي الأردني","freq":"M","pEn":"May 2026","pAr":"أيار 2026","reports":15,"status":"cur"},{"en":"Jordan Kuwait Bank","ar":"البنك الأردني الكويتي","freq":"Q","pEn":"Q1 2026","pAr":"الربع الأول 2026","reports":9,"status":"cur"},{"en":"Capital Bank","ar":"كابيتال بنك","freq":"Q","pEn":"Q1 2026","pAr":"الربع الأول 2026","reports":8,"status":"cur"},{"en":"Bank al Etihad","ar":"بنك الاتحاد","freq":"Q","pEn":"Q1 2026","pAr":"الربع الأول 2026","reports":8,"status":"cur"},{"en":"Invest Bank","ar":"بنك الاستثمار","freq":"Q","pEn":"Q4 2025","pAr":"الربع الرابع 2025","reports":7,"status":"due"},{"en":"Arab Jordan Investment Bank","ar":"البنك العربي الأردني للاستثمار","freq":"Q","pEn":"Q1 2026","pAr":"الربع الأول 2026","reports":8,"status":"cur"},{"en":"Jordan Commercial Bank","ar":"البنك التجاري الأردني","freq":"Q","pEn":"Q4 2025","pAr":"الربع الرابع 2025","reports":6,"status":"due"},{"en":"Safwa Islamic Bank","ar":"بنك صفوة الإسلامي","freq":"A","pEn":"FY 2025","pAr":"السنة المالية 2025","reports":3,"status":"cur"},{"en":"Islamic International Arab Bank","ar":"البنك الإسلامي العربي الدولي","freq":"A","pEn":"FY 2025","pAr":"السنة المالية 2025","reports":3,"status":"cur"},{"en":"Societe Generale Jordan","ar":"سوسيته جنرال الأردن","freq":"A","pEn":"FY 2025","pAr":"السنة المالية 2025","reports":2,"status":"due"}];

export default function Page() {
  const [lang, setLang] = useState('en');
  const [filter, setFilter] = useState('all');
  useEffect(function () {
    var saved = 'en';
    try { saved = localStorage.getItem('cf_lang') || 'en'; } catch (e) {}
    if (saved !== 'en' && saved !== 'ar') saved = 'en';
    setLang(saved);
  }, []);
  useEffect(function () {
    try { document.documentElement.setAttribute('dir', T[lang].dir); document.documentElement.setAttribute('lang', lang); } catch (e) {}
  }, [lang]);
  function toggle() {
    var nx = lang === 'en' ? 'ar' : 'en';
    setLang(nx);
    try { localStorage.setItem('cf_lang', nx); } catch (e) {}
  }
  var t = T[lang];
  var rows = DATA.filter(function (d) { return filter === 'all' || d.freq === filter; });
  var totalReports = DATA.reduce(function (s, d) { return s + d.reports; }, 0);
  var onTime = Math.round((DATA.filter(function (d) { return d.status === 'cur'; }).length / DATA.length) * 100);
  function freqLabel(f) { return f === 'M' ? t.mLabel : (f === 'Q' ? t.qLabel : t.aLabel); }
  var chips = [['all', t.fAll], ['M', t.fM], ['Q', t.fQ], ['A', t.fA]];
  return (
    <div className="cbj-root" dir={t.dir}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="cbj-wrap">
        <div className="cbj-head">
          <a className="cbj-brand" href="/">
            <div className="cbj-mark">ZAD</div>
            <div className="cbj-wm"><b>convo.finance</b><span>{t.wm}</span></div>
          </a>
          <button className="cbj-lang" onClick={toggle}>{t.lang}</button>
        </div>
        <h1 className="cbj-title">{t.title}</h1>
        <div className="cbj-sub">{t.sub}</div>
        <div className="cbj-kpis">
          <div className="cbj-kpi"><div className="lab">{t.kBanks}</div><div className="val">{DATA.length}</div><div className="ctx">{t.kBanksCtx}</div></div>
          <div className="cbj-kpi"><div className="lab">{t.kSubs}</div><div className="val">{totalReports}</div><div className="ctx">{t.kSubsCtx}</div></div>
          <div className="cbj-kpi"><div className="lab">{t.kPeriod}</div><div className="val">{lang === 'ar' ? 'أيار 2026' : 'May 2026'}</div><div className="ctx">{t.kPeriodCtx}</div></div>
          <div className="cbj-kpi"><div className="lab">{t.kRate}</div><div className="val">{onTime}%</div><div className="ctx">{t.kRateCtx}</div></div>
        </div>
        <div className="cbj-bar">
          <div className="cbj-chips">
            {chips.map(function (c) { return (<button key={c[0]} className={filter === c[0] ? 'cbj-chip on' : 'cbj-chip'} onClick={function () { setFilter(c[0]); }}>{c[1]}</button>); })}
          </div>
          <a className="cbj-upload" href="/upload"><span>{"↥"}</span><span>{t.upload}</span></a>
        </div>
        <div className="cbj-tablewrap">
          <table className="cbj-table">
            <thead><tr><th>{t.cBank}</th><th>{t.cFreq}</th><th>{t.cPeriod}</th><th>{t.cReports}</th><th>{t.cStatus}</th></tr></thead>
            <tbody>
              {rows.map(function (d, i) { return (
                <tr key={i}>
                  <td className="cbj-bank">{lang === 'ar' ? d.ar : d.en}</td>
                  <td><span className="cbj-freq">{freqLabel(d.freq)}</span></td>
                  <td>{lang === 'ar' ? d.pAr : d.pEn}</td>
                  <td className="cbj-num">{d.reports}</td>
                  <td><span className={d.status === 'cur' ? 'cbj-badge cur' : 'cbj-badge due'}>{d.status === 'cur' ? t.stCur : t.stDue}</span></td>
                </tr>
              ); })}
            </tbody>
          </table>
        </div>
        <div className="cbj-foot">{t.foot}</div>
      </div>
    </div>
  );
}
