'use client'

// convo.finance - Trade Finance Encyclopedia tab.
// Reads tf_categories, tf_terms and tf_flows (public read). Bilingual via LangContext.
// A ZAD chat panel sits alongside a searchable term browser; each term shows its own process flow.

import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useLang } from '@/lib/LangContext'
import { supabase } from '@/lib/supabase'

const STR = {
  en: {
    eyebrow: 'Reference',
    title: 'Trade Finance Encyclopedia',
    subtitle: 'The working vocabulary of trade finance, its instruments, documents and governing rules. Bilingual, grounded in ICC, SWIFT, UNCITRAL, FATF, Basel and CBJ sources.',
    search: 'Search terms, definitions and rules',
    all: 'All',
    terms: 'terms',
    governs: 'Governed by',
    source: 'Source',
    noResults: 'No terms match your search.',
    loading: 'Loading the encyclopedia',
    featured: 'Most asked about',
    chatTitle: 'Ask ZAD',
    chatIntro: 'Ask anything about trade finance and its rules. Answers are grounded in the source register.',
    chatPlaceholder: 'How does a confirmed letter of credit work?',
    chatSend: 'Ask',
    chatThinking: 'ZAD is thinking',
    chatError: 'Could not reach ZAD. Please try again.',
    you: 'You',
    zad: 'ZAD',
  },
  ar: {
    eyebrow: 'مرجع',
    title: 'موسوعة مصطلحات التمويل التجاري',
    subtitle: 'المفردات العملية للتمويل التجاري وأدواته ومستنداته والقواعد الحاكمة له. ثنائية اللغة، ومستندة إلى مصادر غرفة التجارة الدولية وسويفت والأمم المتحدة ومجموعة العمل المالي وبازل والبنك المركزي الأردني.',
    search: 'ابحث في المصطلحات والتعريفات والقواعد',
    all: 'الكل',
    terms: 'مصطلح',
    governs: 'يحكمه',
    source: 'المصدر',
    noResults: 'لا توجد مصطلحات مطابقة لبحثك.',
    loading: 'جارٍ تحميل الموسوعة',
    featured: 'الأكثر طلباً',
    chatTitle: 'اسأل زاد',
    chatIntro: 'اسأل عن أي شيء في التمويل التجاري وقواعده. الإجابات مستندة إلى سجل المصادر.',
    chatPlaceholder: 'كيف يعمل الاعتماد المستندي المعزّز؟',
    chatSend: 'اسأل',
    chatThinking: 'زاد يفكّر',
    chatError: 'تعذّر الاتصال بزاد. حاول مرة أخرى.',
    you: 'أنت',
    zad: 'زاد',
  },
}

const FEATURED = ['documentary-credit-letter-of-credit', 'bank-guarantee', 'standby-letter-of-credit', 'documentary-collection', 'incoterms-rules', 'trade-based-money-laundering', 'supply-chain-finance', 'ucp-600']

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
    <div style={{ marginTop: '14px', borderTop: '1px solid var(--cf-line)', paddingTop: '12px' }}>
      <div className="cf-label" style={{ marginBottom: '8px', color: 'var(--cf-ink3)' }}>{title}</div>
      <div ref={ref} dir="ltr" style={{ overflowX: 'auto', display: 'flex', justifyContent: 'center' }} />
      {narration ? (<p className="cf-md-p" style={{ color: 'var(--cf-ink2)', fontSize: '13px', lineHeight: 1.7, marginTop: '8px' }}>{narration}</p>) : null}
    </div>
  )
}

function ChatPanel({ L, ar }) {
  const [msgs, setMsgs] = useState([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const boxRef = useRef(null)
  useEffect(() => { if (boxRef.current) boxRef.current.scrollTop = boxRef.current.scrollHeight }, [msgs, busy])
  async function send() {
    const query = input.trim()
    if (!query || busy) return
    const next = msgs.concat([{ role: 'user', content: query }])
    setMsgs(next); setInput(''); setBusy(true)
    try {
      const r = await fetch('/api/zad', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ messages: next }) })
      const j = await r.json()
      setMsgs(next.concat([{ role: 'assistant', content: (j.text || '').toString() }]))
    } catch (e) {
      setMsgs(next.concat([{ role: 'assistant', content: L.chatError }]))
    } finally { setBusy(false) }
  }
  function onKey(e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }
  return (
    <div className="cf-card" style={{ padding: '18px', marginBottom: '22px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
        <span style={{ width: '8px', height: '8px', borderRadius: '9px', background: 'var(--cf-primary)' }} />
        <h2 className="cf-h3" style={{ margin: 0 }}>{L.chatTitle}</h2>
      </div>
      <p className="cf-muted" style={{ fontSize: '13px', margin: '0 0 12px' }}>{L.chatIntro}</p>
      {msgs.length > 0 ? (
        <div ref={boxRef} style={{ maxHeight: '340px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', margin: '0 0 12px', paddingInlineEnd: '4px' }}>
          {msgs.map((m, i) => (
            <div key={i} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '92%' }}>
              <div className="cf-label" style={{ color: 'var(--cf-ink3)', marginBottom: '3px', textAlign: m.role === 'user' ? 'end' : 'start' }}>{m.role === 'user' ? L.you : L.zad}</div>
              <div style={{ background: m.role === 'user' ? 'var(--cf-primary-soft)' : 'var(--cf-surface)', color: 'var(--cf-ink)', border: '1px solid var(--cf-line)', borderRadius: '12px', padding: '10px 13px', fontSize: '14px', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{m.content}</div>
            </div>
          ))}
          {busy ? (<div style={{ alignSelf: 'flex-start' }}><span className="cf-muted" style={{ fontSize: '13px' }}>{L.chatThinking}</span></div>) : null}
        </div>
      ) : null}
      <div style={{ display: 'flex', gap: '8px' }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={onKey} placeholder={L.chatPlaceholder} className="cf-input" style={{ flex: '1 1 auto', minWidth: '0', padding: '11px 14px', border: '1px solid var(--cf-line)', borderRadius: '10px', background: 'var(--cf-surface)', color: 'var(--cf-ink)', fontFamily: 'inherit', fontSize: '14px', outline: 'none' }} />
        <button className="cf-btn cf-btn-primary" onClick={send} disabled={busy} style={{ whiteSpace: 'nowrap' }}>{L.chatSend}</button>
      </div>
    </div>
  )
}

export default function TradeFinancePage() {
  const { lang } = useLang()
  const ar = lang === 'ar'
  const L = STR[ar ? 'ar' : 'en']
  const [cats, setCats] = useState([])
  const [terms, setTerms] = useState([])
  const [flows, setFlows] = useState([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [activeCat, setActiveCat] = useState('all')
  const [openTerm, setOpenTerm] = useState(null)
  const mermaidReady = useMermaid(flows.length > 0)

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

  const flowByTerm = useMemo(() => {
    const m = {}
    flows.forEach((f) => { if (f.term_slug) m[f.term_slug] = f })
    return m
  }, [flows])

  const catName = (id) => {
    const c = cats.find((x) => x.id === id)
    if (!c) return ''
    return ar ? c.name_ar : c.name_en
  }

  const termLabel = (t) => (ar ? (t.term_ar || t.term_en) : t.term_en)
  const termBody = (t) => (ar ? (t.body_ar || t.body_en) : t.body_en)

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return terms.filter((t) => {
      if (activeCat !== 'all' && t.category_id !== activeCat) return false
      if (!needle) return true
      const hay = [t.term_en, t.term_ar, t.body_en, t.body_ar, t.governing_source].filter(Boolean).join(' ').toLowerCase()
      return hay.includes(needle)
    })
  }, [terms, q, activeCat, ar])

  const featuredTerms = useMemo(() => FEATURED.map((sl) => terms.find((t) => t.slug === sl)).filter(Boolean), [terms])

  const openFeatured = (t) => { setActiveCat('all'); setQ(''); setOpenTerm(t.id) }

  const align = ar ? 'right' : 'left'

  return (
    <main className="cf-page">
      <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '28px 26px 80px', textAlign: align }}>
        <div className="cf-eyebrow">{L.eyebrow}</div>
        <h1 className="cf-h1 cf-grad-text" style={{ marginBottom: '8px' }}>{L.title}</h1>
        <p className="cf-muted" style={{ maxWidth: '760px', lineHeight: 1.7, marginBottom: '22px' }}>{L.subtitle}</p>

        <ChatPanel L={L} ar={ar} />

        <div style={{ position: 'relative', margin: '0 0 18px' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ position: 'absolute', top: '50%', insetInlineStart: '16px', transform: 'translateY(-50%)', color: 'var(--cf-ink3)' }}><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          <input value={q} onChange={(e) => { setQ(e.target.value); setOpenTerm(null) }} placeholder={L.search} className="cf-input" style={{ width: '100%', boxSizing: 'border-box', padding: '13px 16px', paddingInlineStart: '44px', border: '1px solid var(--cf-line)', borderRadius: '12px', background: 'var(--cf-surface)', color: 'var(--cf-ink)', fontFamily: 'inherit', fontSize: '14px', outline: 'none' }} />
        </div>

        {featuredTerms.length > 0 && !q ? (
          <div style={{ marginBottom: '22px' }}>
            <div className="cf-label" style={{ color: 'var(--cf-ink3)', marginBottom: '10px' }}>{L.featured}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '10px' }}>
              {featuredTerms.map((t) => (
                <button key={t.id} className="cf-card" onClick={() => openFeatured(t)} style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '14px 16px', cursor: 'pointer', textAlign: 'start', background: 'var(--cf-surface)' }}>
                  <span style={{ width: '7px', height: '7px', borderRadius: '8px', background: 'var(--cf-primary)', flex: '0 0 auto' }} />
                  <span style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--cf-ink)' }}>{termLabel(t)}</span>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', margin: '0 0 22px' }}>
          <button className={activeCat === 'all' ? 'cf-chip cf-chip-primary' : 'cf-chip'} onClick={() => { setActiveCat('all'); setOpenTerm(null) }}>{L.all}</button>
          {cats.map((c) => (
            <button key={c.id} className={activeCat === c.id ? 'cf-chip cf-chip-primary' : 'cf-chip'} onClick={() => { setActiveCat(c.id); setOpenTerm(null) }}>{ar ? c.name_ar : c.name_en}</button>
          ))}
        </div>

        {loading ? (
          <p className="cf-muted">{L.loading}</p>
        ) : (
          <>
            <p className="cf-label" style={{ marginBottom: '12px', color: 'var(--cf-ink3)' }}>{filtered.length} {L.terms}</p>
            {filtered.length === 0 ? (
              <p className="cf-muted">{L.noResults}</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '14px' }}>
                {filtered.map((t) => {
                  const open = openTerm === t.id
                  const flow = flowByTerm[t.slug]
                  return (
                    <div key={t.id} className="cf-card" onClick={() => setOpenTerm(open ? null : t.id)} style={{ padding: '16px 18px', cursor: 'pointer', gridColumn: open ? '1 / -1' : 'auto' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'baseline' }}>
                        <h3 className="cf-h3" style={{ margin: 0 }}>{termLabel(t)}</h3>
                        <span className="cf-label" style={{ color: 'var(--cf-ink3)', whiteSpace: 'nowrap' }}>{catName(t.category_id)}</span>
                      </div>
                      <p className="cf-md-p" style={{ color: 'var(--cf-ink2)', fontSize: '14px', lineHeight: 1.7, margin: '8px 0 0', display: open ? 'block' : '-webkit-box', WebkitLineClamp: open ? 'unset' : 3, WebkitBoxOrient: 'vertical', overflow: open ? 'visible' : 'hidden' }}>{termBody(t)}</p>
                      {(t.governing_source || t.source_url) ? (
                        <div style={{ marginTop: '12px' }}>
                          {t.source_url ? (
                            <a href={t.source_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="cf-chip cf-chip-primary" style={{ fontSize: '11.5px', textDecoration: 'none' }}>{t.governing_source ? (L.governs + ': ' + t.governing_source) : L.source} ↗</a>
                          ) : (
                            <span className="cf-chip cf-chip-primary" style={{ fontSize: '11.5px' }}>{L.governs}: {t.governing_source}</span>
                          )}
                        </div>
                      ) : null}
                      {open && flow ? (<FlowCard flow={flow} ar={ar} ready={mermaidReady} />) : null}
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}
