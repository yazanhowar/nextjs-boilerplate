'use client';
import { useState, useEffect } from 'react';

const CSS = ".zwl-root{--navy:#0c3057;--navy2:#0a2742;--blue:#3a6ea5;--blue2:#6c9bc8;--gold:#b0883c;--bg:#f4f7fa;--card:#fff;--ink:#0f1f30;--sub:#5a6b7d;--faint:#9aa7b4;--line:#e7edf3;min-height:100vh;background:radial-gradient(1100px 560px at 50% -8%,#eaf1f9 0,#f4f7fa 55%);color:#0f1f30;font-family:'Inter','Segoe UI',sans-serif}.zwl-root[dir='rtl']{font-family:'Cairo','Segoe UI',Tahoma,sans-serif}.zwl-wrap{max-width:1080px;margin:0 auto;padding:22px 24px 64px}.zwl-head{display:flex;align-items:center;justify-content:space-between}.zwl-brand{display:flex;align-items:center;gap:12px;text-decoration:none;color:inherit}.zwl-mark{width:46px;height:46px;border-radius:13px;background:linear-gradient(135deg,#0c3057,#3a6ea5);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:18px;letter-spacing:.5px;box-shadow:0 6px 18px rgba(12,48,87,.28)}.zwl-wm b{font-size:17px;font-weight:800;display:block;line-height:1.1}.zwl-wm span{font-size:12px;color:#5a6b7d;font-weight:600}.zwl-lang{border:1px solid #e7edf3;background:#fff;color:#0f1f30;font:inherit;font-size:13px;font-weight:700;padding:9px 15px;border-radius:999px;cursor:pointer;transition:.15s}.zwl-lang:hover{border-color:#3a6ea5;color:#3a6ea5}.zwl-hero{text-align:center;padding:56px 0 12px}.zwl-ey{display:inline-flex;align-items:center;gap:8px;background:#e9f1fb;color:#0c3057;font-size:12.5px;font-weight:700;padding:7px 15px;border-radius:999px}.zwl-ey::before{content:'';width:7px;height:7px;border-radius:50%;background:#3a6ea5}.zwl-h1{font-size:40px;font-weight:800;letter-spacing:-.8px;margin:18px 0 12px;line-height:1.12}.zwl-tag{font-size:16px;color:#5a6b7d;max-width:560px;margin:0 auto;line-height:1.6}.zwl-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:42px}.zwl-card{position:relative;display:block;background:#fff;border:1px solid #e7edf3;border-radius:20px;padding:26px 24px 24px;text-decoration:none;color:inherit;box-shadow:0 1px 2px rgba(15,31,48,.04),0 10px 30px rgba(15,31,48,.06);transition:.2s}.zwl-card:hover{transform:translateY(-4px);border-color:#6c9bc8;box-shadow:0 8px 18px rgba(15,31,48,.07),0 20px 50px rgba(15,31,48,.1)}.zwl-ic{width:50px;height:50px;border-radius:14px;display:flex;align-items:center;justify-content:center;margin-bottom:18px}.zwl-c1 .zwl-ic{background:#e9f1fb;color:#0c3057}.zwl-c2 .zwl-ic{background:#fbf3e6;color:#b0883c}.zwl-c3 .zwl-ic{background:#e7f4ee;color:#1f8f5a}.zwl-card h3{font-size:18px;font-weight:800;margin:0 0 7px}.zwl-card p{font-size:13.5px;color:#5a6b7d;line-height:1.55;margin:0}.zwl-go{margin-top:16px;font-size:13px;font-weight:700;color:#3a6ea5;display:flex;align-items:center;gap:6px}.zwl-soon{opacity:.6;pointer-events:none}.zwl-badge{position:absolute;top:16px;inset-inline-end:16px;font-size:10.5px;font-weight:800;letter-spacing:.4px;color:#b0883c;background:#fbf3e6;padding:4px 9px;border-radius:999px;text-transform:uppercase}.zwl-ask{margin-top:34px;display:flex;justify-content:center}.zwl-askb{display:inline-flex;align-items:center;gap:12px;background:linear-gradient(135deg,#0c3057,#0a2742);color:#fff;text-decoration:none;font-weight:700;font-size:15px;padding:15px 26px;border-radius:16px;box-shadow:0 10px 28px rgba(12,48,87,.28);transition:.18s}.zwl-askb:hover{transform:translateY(-2px);box-shadow:0 14px 34px rgba(12,48,87,.34)}.zwl-za{width:26px;height:26px;border-radius:8px;background:rgba(255,255,255,.16);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:13px}.zwl-foot{text-align:center;color:#9aa7b4;font-size:12px;margin-top:48px}@media(max-width:820px){.zwl-cards{grid-template-columns:1fr}.zwl-h1{font-size:32px}}";
const T = {"en":{"dir":"ltr","lang":"العربية","wm":"Banking Intelligence","ey":"ZAD Intelligence","h1":"Competitive banking intelligence for Jordan","tag":"Grounded analysis across every licensed Jordanian bank. Choose where to begin.","t1":"Bank Financials","s1":"As reported in audited financial statements, bank by bank.","t2":"Banking Sector","s2":"Sector aggregates per Association of Banks in Jordan figures.","t3":"CBJ Reports","s3":"Upload and analyze Central Bank regulatory returns.","go":"Open","soon":"Soon","ask":"Ask ZAD anything about Jordanian banking","foot":"convo.finance · ZAD — proprietary banking intelligence"},"ar":{"dir":"rtl","lang":"EN","wm":"ذكاء مصرفي","ey":"منصة زاد","h1":"ذكاء تنافسي للقطاع المصرفي الأردني","tag":"تحليل قائم على البيانات لكل بنك أردني مرخّص. اختر نقطة البداية.","t1":"البيانات المالية للبنوك","s1":"وفق القوائم المالية المدققة، بنكاً بنكاً.","t2":"القطاع المصرفي","s2":"مؤشرات القطاع وفق أرقام جمعية البنوك في الأردن.","t3":"تقارير البنك المركزي","s3":"رفع وتحليل التقارير الرقابية للبنك المركزي.","go":"فتح","soon":"قريباً","ask":"اسأل زاد عن القطاع المصرفي الأردني","foot":"convo.finance · زاد — ذكاء مصرفي خاص"}};
const IC = {"bank":"<svg width='26' height='26' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'><path d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z'/><path d='M14 2v6h6'/><line x1='8' y1='13' x2='16' y2='13'/><line x1='8' y1='17' x2='13' y2='17'/></svg>","sector":"<svg width='26' height='26' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'><line x1='4' y1='19' x2='20' y2='19'/><line x1='7' y1='19' x2='7' y2='13'/><line x1='12' y1='19' x2='12' y2='9'/><line x1='17' y1='19' x2='17' y2='5'/></svg>","cbj":"<svg width='26' height='26' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'><path d='M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2'/><polyline points='8 8 12 4 16 8'/><line x1='12' y1='4' x2='12' y2='15'/></svg>"};

export default function Page() {
  const [lang, setLang] = useState('en');
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
  var arrow = t.dir === 'rtl' ? '←' : '→';
  return (
    <div className="zwl-root" dir={t.dir}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="zwl-wrap">
        <div className="zwl-head">
          <a className="zwl-brand" href="/">
            <div className="zwl-mark">ZAD</div>
            <div className="zwl-wm"><b>convo.finance</b><span>{t.wm}</span></div>
          </a>
          <button className="zwl-lang" onClick={toggle}>{t.lang}</button>
        </div>
        <div className="zwl-hero">
          <span className="zwl-ey">{t.ey}</span>
          <h1 className="zwl-h1">{t.h1}</h1>
          <p className="zwl-tag">{t.tag}</p>
        </div>
        <div className="zwl-cards">
          <a className="zwl-card zwl-c1" href="/banks">
            <span className="zwl-ic" dangerouslySetInnerHTML={{ __html: IC.bank }} />
            <h3>{t.t1}</h3>
            <p>{t.s1}</p>
            <div className="zwl-go"><span>{t.go}</span><span>{arrow}</span></div>
          </a>
          <div className="zwl-card zwl-c2 zwl-soon">
            <span className="zwl-badge">{t.soon}</span>
            <span className="zwl-ic" dangerouslySetInnerHTML={{ __html: IC.sector }} />
            <h3>{t.t2}</h3>
            <p>{t.s2}</p>
            <div className="zwl-go"><span>{t.go}</span><span>{arrow}</span></div>
          </div>
          <a className="zwl-card zwl-c3" href="/cbj">
            <span className="zwl-ic" dangerouslySetInnerHTML={{ __html: IC.cbj }} />
            <h3>{t.t3}</h3>
            <p>{t.s3}</p>
            <div className="zwl-go"><span>{t.go}</span><span>{arrow}</span></div>
          </a>
        </div>
        <div className="zwl-ask">
          <a className="zwl-askb" href="/chat">
            <span className="zwl-za">{"ز"}</span>
            <span>{t.ask}</span>
          </a>
        </div>
        <div className="zwl-foot">{t.foot}</div>
      </div>
    </div>
  );
}
