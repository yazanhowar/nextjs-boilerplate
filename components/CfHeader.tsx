'use client';
import { usePathname } from 'next/navigation';
import { useLang } from '@/lib/LangContext';

const NAV: any = {
  en: { fin: 'Financials', sector: 'Sector', economy: 'Economy', cbj: 'CBJ Reports', sub: 'Banking Intelligence', lang: '\u0627\u0644\u0639\u0631\u0628\u064A\u0629' },
  ar: { fin: '\u0627\u0644\u0645\u0627\u0644\u064A\u0629', sector: '\u0627\u0644\u0642\u0637\u0627\u0639', economy: 'الاقتصاد', cbj: '\u062A\u0642\u0627\u0631\u064A\u0631 \u0627\u0644\u0645\u0631\u0643\u0632\u064A', sub: '\u0630\u0643\u0627\u0621 \u0645\u0635\u0631\u0641\u064A', lang: 'English' },
};

export default function CfHeader() {
  const pathname = usePathname() || '/';
  const { lang, setLang } = useLang();
  if (pathname === '/' || pathname === '/sector') return null;
  const isAr = lang === 'ar';
  const t = isAr ? NAV.ar : NAV.en;
  const active = pathname.indexOf('/cbj') === 0 ? 'cbj' : pathname.indexOf('/economy') === 0 ? 'economy' : pathname.indexOf('/sector') === 0 ? 'sector' : 'financials';
  const toggleLang = () => setLang(isAr ? 'en' : 'ar');
  const toggleTheme = () => { try { const d = document.documentElement.classList.toggle('dark'); localStorage.setItem('hbtf-theme', d ? 'dark' : 'light'); localStorage.setItem('theme', d ? 'dark' : 'light'); } catch (e) {} };
  const navLink = (key: string, href: string, label: string) => (
    <a href={href} style={{ fontSize: '13.5px', fontWeight: active === key ? 600 : 500, color: active === key ? 'var(--cf-ink)' : 'var(--cf-primary)', textDecoration: 'none', whiteSpace: 'nowrap' }}>{label}</a>
        
  );
  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '20px 26px 0' }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '18px', flexWrap: 'wrap', paddingBottom: '18px', marginBottom: '4px', borderBottom: '1px solid var(--cf-line)' }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none', color: 'inherit' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '11px', background: 'var(--cf-grad)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '12.5px', letterSpacing: '.04em', flexShrink: 0 }}>ZAD</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '16px', color: 'var(--cf-ink)', letterSpacing: '-.01em', lineHeight: 1.15 }}>convo.finance</div>
            <div style={{ fontSize: '11px', color: 'var(--cf-ink3)' }}>{t.sub}</div>
          </div>
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <nav style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            {navLink('financials', '/banks', t.fin)}
            {navLink('sector', '/sector', t.sector)}
            {navLink('economy', '/economy', t.economy)}
            {navLink('cbj', '/cbj', t.cbj)}
          </nav>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button onClick={toggleLang} style={{ border: '1px solid var(--cf-line)', background: 'transparent', color: 'var(--cf-ink2)', borderRadius: '9px', padding: '6px 11px', fontSize: '12.5px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>{t.lang}</button>
            <button onClick={toggleTheme} aria-label="theme" style={{ border: '1px solid var(--cf-line)', background: 'transparent', color: 'var(--cf-ink2)', borderRadius: '9px', padding: '6px 9px', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>{'\u25D0'}</button>
          </div>
        </div>
      </header>
    </div>
  );
}
