'use client'

import { useState } from 'react'
import { useLang } from '@/lib/LangContext'

function dec(b){ try{ var bin=atob(b); var u=new Uint8Array(bin.length); for(var i=0;i<bin.length;i++){ u[i]=bin.charCodeAt(i) } return new TextDecoder('utf-8').decode(u) }catch(e){ return '' } }

var T = {
  tagline:{ en:'Banking Intelligence', ar:'2LDZg9in2KEg2YXYtdix2YHZig==' },
  navFin:{ en:'Financials', ar:'2KfZhNmF2KfZhNmK2Kk=' },
  navSector:{ en:'Sector', ar:'2KfZhNmC2LfYp9i5' },
  navCbj:{ en:'CBJ Reports', ar:'2KrZgtin2LHZitixINin2YTZhdix2YPYstmK' },
  eyebrow:{ en:'ZAD INTELLIGENCE', ar:'2KrYrdmE2YrZhNin2Kog2LLYp9iv' },
  heroTitle:{ en:'Competitive banking intelligence for Jordan', ar:'2LDZg9in2KEg2KrZhtin2YHYs9mKINmE2YTZgti32KfYuSDYp9mE2YXYtdix2YHZiiDYp9mE2KPYsdiv2YbZig==' },
  heroSub:{ en:'Grounded analysis across all 15 licensed Jordanian banks. Choose where to begin.', ar:'2KrYrdmE2YrZhCDZhdmI2KvZkdmCINmE2KzZhdmK2Lkg2KfZhNio2YbZiNmDINin2YTYo9ix2K/ZhtmK2Kkg2KfZhNmF2LHYrtmR2LXYqSDYp9mE2K7ZhdizINi52LTYsdipLiDYp9iu2KrYsSDZhdmGINij2YrZhiDYqtio2K/Yoy4=' },
  stAssets:{ en:'Sector assets', ar:'2YXZiNis2YjYr9in2Kog2KfZhNmC2LfYp9i5' },
  stDeposits:{ en:'Deposits', ar:'2KfZhNmI2K/Yp9im2Lk=' },
  stCredit:{ en:'Credit facilities', ar:'2KfZhNiq2LPZh9mK2YTYp9iqINin2YTYp9im2KrZhdin2YbZitip' },
  stBanks:{ en:'Licensed banks', ar:'2KjZhtmDINmF2LHYrtmR2LU=' },
  stCD:{ en:'Credit-to-deposit', ar:'2KfZhNiq2LPZh9mK2YTYp9iqINil2YTZiSDYp9mE2YjYr9in2KbYuQ==' },
  stSource:{ en:'Sector aggregate - Association of Banks in Jordan - Q1 2026', ar:'2KXYrNmF2KfZhNmKINin2YTZgti32KfYuSDCtyDYrNmF2LnZitipINin2YTYqNmG2YjZgyDZgdmKINin2YTYo9ix2K/ZhiDCtyDYp9mE2LHYqNi5INin2YTYo9mI2YQgMjAyNg==' },
  c1t:{ en:'Bank Financials', ar:'2KfZhNio2YrYp9mG2KfYqiDYp9mE2YXYp9mE2YrYqSDZhNmE2KjZhtmI2YM=' },
  c1d:{ en:'As reported in audited financial statements, bank by bank.', ar:'2YPZhdinINmI2LHYr9iqINmB2Yog2KfZhNmC2YjYp9im2YUg2KfZhNmF2KfZhNmK2Kkg2KfZhNmF2K/ZgtmR2YLYqdiMINio2YbZg9in2Ysg2KjZhtmD2KfZiy4=' },
  c2t:{ en:'Banking Sector', ar:'2KfZhNmC2LfYp9i5INin2YTZhdi12LHZgdmK' },
  c2d:{ en:'Sector aggregates per Association of Banks in Jordan figures.', ar:'2YXYpNi02ZHYsdin2Kog2KfZhNmC2LfYp9i5INin2YTZhdis2YXZkdi52Kkg2YjZgdmCINij2LHZgtin2YUg2KzZhdi52YrYqSDYp9mE2KjZhtmI2YMg2YHZiiDYp9mE2KPYsdiv2YYu' },
  c3t:{ en:'CBJ Reports', ar:'2KrZgtin2LHZitixINin2YTYqNmG2YMg2KfZhNmF2LHZg9iy2Yo=' },
  c3d:{ en:'Upload regulatory returns and auto-generate dashboards.', ar:'2KfYsdmB2Lkg2KfZhNiq2YLYp9ix2YrYsSDYp9mE2LHZgtin2KjZitipINmI2K/YuSDYp9mE2YXZhti12ZHYqSDYqtio2YbZiiDZhNmI2K3Yp9iq2YfYpyDYqtmE2YLYp9im2YrYp9mLLg==' },
  navEco:{ en:'Economy', ar:'2KfZhNin2YLYqti12KfYrw==' },
  c4t:{ en:'Economy & Macro', ar:'2KfZhNin2YLYqti12KfYryDZiNin2YTZhdik2LTYsdin2Kog2KfZhNmD2YTZitip' },
  c4d:{ en:'Jordan macro, CBJ series and the regional map - with ZAD signal analytics.', ar:'2YXYpNi02LHYp9iqINin2YTYo9ix2K/ZhiDYp9mE2YPZhNmK2Kkg2YjYs9mE2KfYs9mEINin2YTYqNmG2YMg2KfZhNmF2LHZg9iy2Yog2YjYp9mE2K7YsdmK2LfYqSDYp9mE2KXZgtmE2YrZhdmK2Kkg4oCUINmF2Lkg2KrYrdmE2YrZhNin2Kog2LLYp9ivLg==' },
  open:{ en:'Open', ar:'2KfZgdiq2K0=' },
  cta:{ en:'Ask ZAD anything about Jordanian banking', ar:'2KfYs9ij2YQg2LLYp9ivINij2Yog2LTZitihINi52YYg2KfZhNmC2LfYp9i5INin2YTZhdi12LHZgdmKINin2YTYo9ix2K/ZhtmK' },
  footer:{ en:'convo.finance - ZAD proprietary banking intelligence', ar:'Y29udm8uZmluYW5jZSDCtyDYstin2K8g4oCUINiw2YPYp9ihINmF2LXYsdmB2Yog2YXZhdmE2YjZgw==' },
  langWord:{ en:'English', ar:'2KfZhNi52LHYqNmK2Kk=' }
}

export default function Home(){
  const { lang, setLang } = useLang()
  var ar = lang === 'ar'
  function t(k){ var o=T[k]; if(!o) return ''; return ar ? dec(o.ar) : o.en }
  var cards = [
    { t:'c1t', d:'c1d', href:'/banks', accent:'var(--cf-primary)' },
    { t:'c2t', d:'c2d', href:'/sector', accent:'var(--cf-teal)' },
    { t:'c3t', d:'c3d', href:'/cbj', accent:'var(--cf-iris)' }
    , { t:'c4t', d:'c4d', href:'/economy', accent:'var(--cf-iris)' }
  ]
  var stats = [
    { v:'75.43', u:'JOD bn', l:'stAssets' },
    { v:'50.32', u:'JOD bn', l:'stDeposits' },
    { v:'36.67', u:'JOD bn', l:'stCredit' },
    { v:'72.9%', u:'', l:'stCD' },
    { v:'15', u:'', l:'stBanks' }
  ]
  return (
    <div className='cf-page' dir={ar ? 'rtl' : 'ltr'} style={{ minHeight:'100vh', fontFamily: ar ? 'var(--cf-font-ar)' : 'var(--cf-font-sans)' }}>
      <style>{'.cf-cardlink{transition:border-color .15s ease, transform .15s ease} .cf-cardlink:hover{border-color:var(--cf-primary); transform:translateY(-2px)} .cf-ctalink{transition:opacity .15s ease} .cf-ctalink:hover{opacity:.92} @media (max-width:680px){ .cf-nav-links{display:none} .cf-hero{font-size:34px !important} }'}</style>
      <div style={{ maxWidth:'1080px', margin:'0 auto', padding:'22px 24px 60px' }}>

        <header style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'56px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
            <div style={{ width:'42px', height:'42px', borderRadius:'11px', background:'var(--cf-grad)', display:'flex', alignItems:'center', justifyContent:'center', color:'#ffffff', fontWeight:'800', fontSize:'13px', letterSpacing:'0.04em' }}>ZAD</div>
            <div>
              <div style={{ fontWeight:'700', fontSize:'17px', color:'var(--cf-ink)', letterSpacing:'-0.01em' }}>convo.finance</div>
              <div className='cf-muted' style={{ fontSize:'11.5px' }}>{ t('tagline') }</div>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'22px' }}>
            <nav className='cf-nav-links' style={{ display:'flex', gap:'20px' }}>
              <a className='cf-link' href='/banks' style={{ fontSize:'13.5px' }}>{ t('navFin') }</a>
              <a className='cf-link' href='/sector' style={{ fontSize:'13.5px' }}>{ t('navSector') }</a>
              <a className='cf-link' href='/economy' style={{ fontSize:'13.5px' }}>{ t('navEco') }</a>
              <a className='cf-link' href='/cbj' style={{ fontSize:'13.5px' }}>{ t('navCbj') }</a>
            </nav>
            <button onClick={function(){ setLang(ar ? 'en' : 'ar') }} className='cf-btn cf-btn-secondary' style={{ fontSize:'12.5px', padding:'7px 14px' }}>{ ar ? 'English' : dec(T.langWord.ar) }</button>
          </div>
        </header>

        <section style={{ textAlign:'center', maxWidth:'760px', margin:'0 auto 44px' }}>
          <div className='cf-eyebrow' style={{ marginBottom:'14px' }}>{ t('eyebrow') }</div>
          <h1 className='cf-hero' style={{ fontSize:'46px', lineHeight:'1.08', fontWeight:'700', letterSpacing:'-0.025em', color:'var(--cf-ink)', margin:'0 0 18px' }}>{ t('heroTitle') }</h1>
          <p className='cf-muted' style={{ fontSize:'17px', lineHeight:'1.5', margin:'0' }}>{ t('heroSub') }</p>
        </section>

        <section style={{ marginBottom:'52px' }}>
          <div style={{ display:'flex', flexWrap:'wrap', justifyContent:'center', border:'1px solid var(--cf-line)', borderRadius:'14px', background:'var(--cf-surface)', overflow:'hidden' }}>
            { stats.map(function(s, i){
              return (
                <div key={i} style={{ flex:'1 1 0', minWidth:'150px', padding:'18px 20px', textAlign:'center', borderInlineStart: i===0 ? 'none' : '1px solid var(--cf-line)' }}>
                  <div style={{ fontSize:'24px', fontWeight:'700', color:'var(--cf-ink)', letterSpacing:'-0.02em', fontFamily:'var(--cf-font-mono)' }}>{ s.v }</div>
                  <div className='cf-muted' style={{ fontSize:'11px', marginTop:'3px' }}>{ t(s.l) }{ s.u ? (' ' + s.u) : '' }</div>
                </div>
              )
            }) }
          </div>
          <div className='cf-muted' style={{ fontSize:'11px', textAlign:'center', marginTop:'10px' }}>{ t('stSource') }</div>
        </section>

        <section style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(260px, 1fr))', gap:'16px', marginBottom:'24px' }}>
          { cards.map(function(c, i){
            return (
              <a key={i} href={c.href} className='cf-card cf-cardlink' style={{ display:'block', textDecoration:'none', padding:'22px' }}>
                <div style={{ width:'38px', height:'4px', borderRadius:'2px', background:c.accent, marginBottom:'18px' }}></div>
                <div style={{ fontSize:'18px', fontWeight:'700', color:'var(--cf-ink)', marginBottom:'7px' }}>{ t(c.t) }</div>
                <div className='cf-muted' style={{ fontSize:'13.5px', lineHeight:'1.5', marginBottom:'18px' }}>{ t(c.d) }</div>
                <div style={{ fontSize:'13px', fontWeight:'600', color:c.accent }}>{ t('open') }{ ar ? '' : ' ->' }</div>
              </a>
            )
          }) }
        </section>

        <a href='/chat' className='cf-ctalink' style={{ display:'block', textDecoration:'none', background:'var(--cf-grad)', borderRadius:'14px', padding:'22px 26px', textAlign:'center', marginBottom:'40px' }}>
          <span style={{ color:'#ffffff', fontSize:'16px', fontWeight:'600' }}>{ t('cta') }</span>
        </a>

        <footer className='cf-muted' style={{ textAlign:'center', fontSize:'11.5px' }}>{ t('footer') }</footer>

      </div>
    </div>
  )
}
