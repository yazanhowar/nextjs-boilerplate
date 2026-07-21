'use client'

// convo.finance - Trade Finance Encyclopedia tab.
// Standalone route at /trade-finance. Reads the tf_ tables in Supabase
// (public read RLS). Bilingual via LangContext. Renders category browser,
// search, term detail, and the process-flow diagrams (Mermaid, lazy-loaded).

import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useLang } from '@/lib/LangContext'
import { supabase } from '@/lib/supabase'

type Cat = { id: number; slug: string; name_en: string; name_ar: string; sort_order: number }
type Term = {
  id: number; slug: string; category_id: number
  term_en: string; term_ar: string | null
  body_en: string; body_ar: string | null
  governing_source: string | null
}
type Flow = {
  id: number; slug: string; title_en: string; title_ar: string | null
  mermaid: string; narration_en: string | null; narration_ar: string | null
}

const STR = {
  en: {
    eyebrow: 'Reference',
    title: 'Trade Finance Encyclopedia',
    subtitle: 'The working vocabulary of trade finance, its instruments, documents, governing rules, and the compliance and prudential frameworks around them. Grounded in ICC, SWIFT, UNCITRAL, FATF, Basel and CBJ sources.',
    search: 'Search terms, definitions, rules',
    all: 'All',
    terms: 'terms',
    flows: 'Process flows',
    hideFlows: 'Hide process flows',
    showFlows: 'Show process flows',
    governs: 'Governed by',
    noResults: 'No terms match your search.',
    loading: 'Loading the encyclopedia',
    steps: 'How it works',
  },
  ar: {
    eyebrow: 'مرجع',
    title: 'موسوعة مصطلحات التمويل التجاري',
    subtitle: 'المفردات العملية للتمويل التجاري وأدواته ومستنداته والقواعد الحاكمة وأطر الامتثال والمتطلبات الرقابية حولها. مستندة إلى مصادر غرفة التجارة الدولية وسويفت والأمم المتحدة ومجموعة العمل المالي وبازل والبنك المركزي الأردني.',
    search: 'ابحث في المصطلحات والتعريفات والقواعد',
    all: 'الكل',
    terms: 'مصطلح',
    flows: 'تدفقات العمليات',
    hideFlows: 'إخفاء تدفقات العمليات',
    showFlows: 'عرض تدفقات العمليات',
    governs: 'يحكمه',
    noResults: 'لا توجد مصطلحات مطابقة لبحثك.',
    loading: 'جارٍ تحميل الموسوعة',
    steps: 'كيف تعمل',
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

function FlowCard({ flow, lang, ready }) {
  const ref = useRef(null)
  const title = lang === 'ar' ? (flow.title_ar || flow.title_en) : flow.title_en
  const narration = lang === 'ar' ? (flow.narration_ar || flow.narration_en) : flow.narration_en
  useEffect(() => {
    let cancelled = false
    async function run() {
      const m = window.__cfMermaid
      if (!ready || !m || !ref.current) return
      try {
        const { svg } = await m.render('cf-flow-' + flow.id, flow.mermaid)
        if (!cancelled && ref.current) ref.current.innerHTML = svg
      } catch (e) {
        if (!cancelled && ref.current) ref.current.innerHTML = ''
      }
    }
    run()
    return () => { cancelled = true }
  }, [ready, flow, lang])
  return (
    <div className="cf-card" style={{ padding: '20px', marginBottom: '16px' }}>
      <h3 className="cf-h3" style={{ marginTop: 0 }}>{title}</h3>
      <div
        ref={ref}
        dir="ltr"
        style={{ overflowX: 'auto', margin: '10px 0', display: 'flex', justifyContent: 'center' }}
      />
      {narration ? (
        <p className="cf-md-p" style={{ color: 'var(--cf-ink2)', fontSize: '14px', lineHeight: 1.7 }}>
          {narration}
        </p>
      ) : null}
    </div>
  )
}

export default function TradeFinancePage() {
  const { lang } = useLang()
  const L = STR[lang === 'ar' ? 'ar' : 'en']
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

  const catName = (id) => {
    const c = cats.find((x) => x.id === id)
    if (!c) return ''
    return lang === 'ar' ? c.name_ar : c.name_en
  }

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return terms.filter((t) => {
      if (activeCat !== 'all' && t.category_id !== activeCat) return false
      if (!needle) return true
      const hay = [t.term_en, t.term_ar, t.body_en, t.body_ar, t.governing_source]
        .filter(Boolean).join(' ').toLowerCase()
      return hay.includes(needle)
    })
  }, [terms, q, activeCat, lang])

  const termLabel = (t) => (lang === 'ar' ? (t.term_ar || t.term_en) : t.term_en)
  const termBody = (t) => (lang === 'ar' ? (t.body_ar || t.body_en) : t.body_en)

  return (
    <main className="cf-page">
      <div className="cf-eyebrow">{L.eyebrow}</div>
      <h1 className="cf-h1 cf-grad-text" style={{ marginBottom: '8px' }}>{L.title}</h1>
      <p className="cf-muted" style={{ maxWidth: '760px', lineHeight: 1.7 }}>{L.subtitle}</p>

      <div style={{ margin: '20px 0 8px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpenTerm(null) }}
          placeholder={L.search}
          className="cf-input"
          style={{
            flex: '1 1 320px', minWidth: '240px', padding: '10px 14px',
            border: '1px solid var(--cf-line)', borderRadius: '10px',
            background: 'var(--cf-surface)', color: 'var(--cf-ink)',
            fontFamily: 'inherit', fontSize: '14px', outline: 'none',
          }}
        />
        <button
          className={showFlows ? 'cf-btn cf-btn-primary' : 'cf-btn cf-btn-secondary'}
          onClick={() => setShowFlows((v) => !v)}
        >
          {showFlows ? L.hideFlows : L.showFlows}
        </button>
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', margin: '10px 0 22px' }}>
        <button
          className={activeCat === 'all' ? 'cf-chip cf-chip-primary' : 'cf-chip'}
          onClick={() => { setActiveCat('all'); setOpenTerm(null) }}
        >
          {L.all}
        </button>
        {cats.map((c) => (
          <button
            key={c.id}
            className={activeCat === c.id ? 'cf-chip cf-chip-primary' : 'cf-chip'}
            onClick={() => { setActiveCat(c.id); setOpenTerm(null) }}
          >
            {lang === 'ar' ? c.name_ar : c.name_en}
          </button>
        ))}
      </div>

      {showFlows && flows.length > 0 ? (
        <section style={{ marginBottom: '28px' }}>
          <h2 className="cf-h2">{L.flows}</h2>
          <div className="cf-divider" />
          {flows.map((f) => (
            <FlowCard key={f.id} flow={f} lang={lang === 'ar' ? 'ar' : 'en'} ready={mermaidReady} />
          ))}
        </section>
      ) : null}

      {loading ? (
        <p className="cf-muted">{L.loading}<span className="middot" /></p>
      ) : (
        <>
          <p className="cf-label" style={{ marginBottom: '12px' }}>
            {filtered.length} {L.terms}
          </p>
          {filtered.length === 0 ? (
            <p className="cf-muted">{L.noResults}</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '14px' }}>
              {filtered.map((t) => {
                const open = openTerm === t.id
                return (
                  <div
                    key={t.id}
                    className="cf-card"
                    onClick={() => setOpenTerm(open ? null : t.id)}
                    style={{ padding: '16px 18px', cursor: 'pointer', gridColumn: open ? '1 / -1' : 'auto' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'baseline' }}>
                      <h3 className="cf-h3" style={{ margin: 0 }}>{termLabel(t)}</h3>
                      <span className="cf-label" style={{ color: 'var(--cf-ink3)', whiteSpace: 'nowrap' }}>
                        {catName(t.category_id)}
                      </span>
                    </div>
                    <p
                      className="cf-md-p"
                      style={{
                        color: 'var(--cf-ink2)', fontSize: '14px', lineHeight: 1.7,
                        margin: '8px 0 0',
                        display: open ? 'block' : '-webkit-box',
                        WebkitLineClamp: open ? 'unset' : 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: open ? 'visible' : 'hidden',
                      }}
                    >
                      {termBody(t)}
                    </p>
                    {t.governing_source ? (
                      <div style={{ marginTop: '12px' }}>
                        <span className="cf-chip cf-chip-primary" style={{ fontSize: '11.5px' }}>
                          {L.governs}: {t.governing_source}
                        </span>
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
