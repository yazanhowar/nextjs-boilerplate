'use client'

// convo.finance - Trade Finance Encyclopedia tab.
// Route /trade-finance. Reads tf_ tables (public read RLS). Bilingual via
// LangContext, RTL-aware. Prominent search, a "Most asked about" featured
// row, category filters, term detail, and lazy-rendered process flows.

import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useLang } from '@/lib/LangContext'
import { supabase } from '@/lib/supabase'

const FEATURED = [
  'documentary-credit-letter-of-credit',
  'bank-guarantee',
  'standby-letter-of-credit',
  'documentary-collection',
  'incoterms-rules',
  'trade-based-money-laundering',
  'supply-chain-finance',
  'ucp-600',
]

const STR = {
  en: {
    eyebrow: 'Reference',
    title: 'Trade Finance Encyclopedia',
    subtitle: 'The working vocabulary of trade finance, its instruments, documents and governing rules. Bilingual, grounded in ICC, SWIFT, UNCITRAL, FATF, Basel and CBJ sources.',
    search: 'Search terms, definitions and rules',
    mostAsked: 'Most asked about',
    all: 'All',
    terms: 'terms',
    showFlows: 'Show process flows',
    hideFlows: 'Hide process flows',
    flows: 'Process flows',
    governs: 'Governed by',
    none: 'No terms match your search.',
    loading: 'Loading the encyclopedia',
  },
  ar: {
    eyebrow: 'مرجع',
    title: 'موسوعة مصطلحات التمويل التجاري',
    subtitle: 'المفردات العملية للتمويل التجاري وأدواته ومستنداته والقواعد الحاكمة. ثنائية اللغة، ومستندة إلى مصادر غرفة التجارة الدولية وسويفت والأمم المتحدة ومجموعة العمل المالي وبازل والبنك المركزي الأردني.',
    search: 'ابحث في المصطلحات والتعريفات والقواعد',
    mostAsked: 'الأكثر طلباً',
    all: 'الكل',
    terms: 'مصطلح',
    showFlows: 'عرض تدفقات العمليات',
    hideFlows: 'إخفاء تدفقات العمليات',
    flows: 'تدفقات العمليات',
    governs: 'يحكمه',
    none: 'لا توجد مصطلحات مطابقة لبحثك.',
    loading: 'جارٍ تحميل الموسوعة',
  },
}

function useMermaid(enabled) {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    if (!enabled) return
    if (window.__cfMermaid) { setReady(true); return }
    const onReady = () => setReady(true)
    window.addEventListener('cf-mermaid-ready', onReady)
    const s = document.createElement('script')
    s.type = 'module'
    s.textContent =
      "import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';" +
      "mermaid.initialize({ startOnLoad:false, securityLevel:'strict', theme:'neutral', fontFamily:'inherit' });" +
      "window.__cfMermaid = mermaid;" +
      "window.dispatchEvent(new Event('cf-mermaid-ready'));"
    document.head.appendChild(s)
    return () => window.removeEventListener('cf-mermaid-ready', onReady)
  }, [enabled])
  return ready
}

function FlowCard({ flow, ar, ready }) {
  const ref = useRef(null)
  const title = ar ? (flow.title_ar || flow.title_en) : flow.title_en
  const narration = ar ? (flow.narration_ar || flow.narration_en) : flow.narration_en
  useEffect(() => {
    let cancelled = false
    async function run() {
      const m = window.__cfMermaid
      if (!ready || !m || !ref.current) return
      try {
        const out = await m.render('cf-flow-' + flow.id, flow.mermaid)
        if (!cancelled && ref.current) ref.current.innerHTML = out.svg
      } catch (e) {
        if (!cancelled && ref.current) ref.current.innerHTML = ''
      }
    }
    run()
    return () => { cancelled = true }
  }, [ready, flow, ar])
  return (
    <div className="cf-card" style={{ padding: '20px', marginBottom: '16px' }}>
      <h3 className="cf-h3" style={{ marginTop: 0 }}>{title}</h3>
      <div ref={ref} dir="ltr" style={{ overflowX: 'auto', margin: '10px 0', display: 'flex', justifyContent: 'center' }} />
      {narration ? (
        <p style={{ color: 'var(--cf-ink2)', fontSize: '14px', lineHeight: 1.75, margin: 0 }}>{narration}</p>
      ) : null}
    </div>
  )
}

export default function TradeFinancePage() {
  const { lang } = useLang()
  const ar = lang === 'ar'
  const L = ar ? STR.ar : STR.en

  const [cats, setCats] = useState([])
  const [terms, setTerms] = useState([])
  const [flows, setFlows] = useState([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [activeCat, setActiveCat] = useState('all')
  const [openTerm, setOpenTerm] = useState(null)
  const [showFlows, setShowFlows] = useState(false)
  const mermaidReady = useMermaid(showFlows && flows.length > 0)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const [c, t, f] = await Promise.all([
        supabase.from('tf_categories').select('*').order('sort_order', { ascending: true }),
        supabase.from('tf_terms').select('*').order('term_en', { ascending: true }),
        supabase.from('tf_flows').select('*').order('id', { ascending: true }),
      ])
      if (cancelled) return
      setCats(c.data || [])
      setTerms(t.data || [])
      setFlows(f.data || [])
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [])

  const label = (t) => (ar ? (t.term_ar || t.term_en) : t.term_en)
  const body = (t) => (ar ? (t.body_ar || t.body_en) : t.body_en)
  const catName = (id) => {
    const c = cats.find((x) => x.id === id)
    return c ? (ar ? c.name_ar : c.name_en) : ''
  }

  const featuredTerms = useMemo(
    () => FEATURED.map((sl) => terms.find((t) => t.slug === sl)).filter(Boolean),
    [terms]
  )

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return terms.filter((t) => {
      if (activeCat !== 'all' && t.category_id !== activeCat) return false
      if (!needle) return true
      const hay = [t.term_en, t.term_ar, t.body_en, t.body_ar, t.governing_source].filter(Boolean).join(' ').toLowerCase()
      return hay.includes(needle)
    })
  }, [terms, q, activeCat, ar])

  const openFeatured = (t) => { setActiveCat('all'); setQ(label(t)); setOpenTerm(t.id) }

  const showFeatured = !loading && featuredTerms.length > 0 && !q.trim() && activeCat === 'all'
  const align = ar ? 'right' : 'left'

  return (
    <main className="cf-page" style={{ textAlign: align }}>
      <div className="cf-eyebrow">{L.eyebrow}</div>
      <h1 className="cf-h1 cf-grad-text" style={{ marginBottom: '8px' }}>{L.title}</h1>
      <p className="cf-muted" style={{ maxWidth: '780px', lineHeight: 1.75, marginTop: 0 }}>{L.subtitle}</p>

      <div style={{ position: 'relative', margin: '22px 0 6px' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          style={{ position: 'absolute', insetInlineStart: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--cf-ink3)', pointerEvents: 'none' }}>
          <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
        </svg>
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpenTerm(null) }}
          placeholder={L.search}
          style={{
            width: '100%', paddingInlineStart: '44px', paddingInlineEnd: '16px', paddingTop: '13px', paddingBottom: '13px',
            border: '1px solid var(--cf-line)', borderRadius: '12px', background: 'var(--cf-surface)',
            color: 'var(--cf-ink)', fontFamily: 'inherit', fontSize: '15px', outline: 'none', textAlign: align,
          }}
        />
      </div>

      {showFeatured ? (
        <section>
          <h2 className="cf-h2" style={{ margin: '26px 0 4px' }}>{L.mostAsked}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '10px', marginTop: '10px' }}>
            {featuredTerms.map((t) => (
              <button
                key={t.id}
                onClick={() => openFeatured(t)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '9px', padding: '13px 15px', borderRadius: '12px',
                  border: '1px solid var(--cf-line)', background: 'var(--cf-surface)', color: 'var(--cf-ink)',
                  fontFamily: 'inherit', fontWeight: 600, fontSize: '13.5px', cursor: 'pointer', textAlign: align,
                }}
              >
                <span style={{ width: '7px', height: '7px', borderRadius: '99px', background: 'var(--cf-gold)', flex: 'none' }} />
                <span>{label(t)}</span>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', margin: '22px 0 4px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button className={activeCat === 'all' ? 'cf-chip cf-chip-primary' : 'cf-chip'} onClick={() => { setActiveCat('all'); setOpenTerm(null) }}>{L.all}</button>
          {cats.map((c) => (
            <button key={c.id} className={activeCat === c.id ? 'cf-chip cf-chip-primary' : 'cf-chip'} onClick={() => { setActiveCat(c.id); setOpenTerm(null) }}>
              {ar ? c.name_ar : c.name_en}
            </button>
          ))}
        </div>
        {flows.length > 0 ? (
          <button className={showFlows ? 'cf-btn cf-btn-primary' : 'cf-btn cf-btn-secondary'} onClick={() => setShowFlows((v) => !v)}>
            {showFlows ? L.hideFlows : L.showFlows}
          </button>
        ) : null}
      </div>

      {showFlows && flows.length > 0 ? (
        <section style={{ margin: '18px 0 8px' }}>
          <h2 className="cf-h2">{L.flows}</h2>
          <div className="cf-divider" />
          {flows.map((f) => (<FlowCard key={f.id} flow={f} ar={ar} ready={mermaidReady} />))}
        </section>
      ) : null}

      {loading ? (
        <p className="cf-muted" style={{ marginTop: '18px' }}>{L.loading}</p>
      ) : (
        <>
          <p style={{ color: 'var(--cf-ink3)', fontSize: '12.5px', fontWeight: 600, letterSpacing: '.03em', textTransform: 'uppercase', margin: '18px 0 10px' }}>
            {filtered.length} {L.terms}
          </p>
          {filtered.length === 0 ? (
            <p className="cf-muted">{L.none}</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '14px' }}>
              {filtered.map((t) => {
                const open = openTerm === t.id
                return (
                  <div key={t.id} className="cf-card" onClick={() => setOpenTerm(open ? null : t.id)}
                    style={{ padding: '16px 18px', cursor: 'pointer', gridColumn: open ? '1 / -1' : 'auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'baseline' }}>
                      <h3 className="cf-h3" style={{ margin: 0 }}>{label(t)}</h3>
                      <span style={{ fontSize: '11.5px', color: 'var(--cf-ink3)', whiteSpace: 'nowrap' }}>{catName(t.category_id)}</span>
                    </div>
                    <p style={{
                      color: 'var(--cf-ink2)', fontSize: '13.5px', lineHeight: 1.7, margin: '8px 0 0',
                      display: open ? 'block' : '-webkit-box', WebkitLineClamp: open ? 'unset' : 3,
                      WebkitBoxOrient: 'vertical', overflow: open ? 'visible' : 'hidden',
                    }}>{body(t)}</p>
                    {t.governing_source ? (
                      <div style={{ marginTop: '12px' }}>
                        <span className="cf-chip cf-chip-primary" style={{ fontSize: '11px' }}>{L.governs}: {t.governing_source}</span>
                      </div>
                    ) : null}
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </main>
  )
}
