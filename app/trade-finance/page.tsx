'use client'

// convo.finance - Trade Finance Encyclopedia tab.
// Reads tf_categories, tf_terms and tf_flows (public read). Bilingual via LangContext.
// A ZAD chat panel sits alongside a searchable term browser grouped by category; each term shows its own process flow.

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
    flowLabel: 'Flowchart',
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
    flowLabel: 'مخطط',
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

function FlowCard({ flow, ar, ready, rid }) {
  const ref = useRef(null)
  const title = ar ? (flow.title_ar || flow.title_en) : flow.title_en
  const narration = ar ? (flow.narration_ar || flow.narration_en) : flow.narration_en
  useEffect(() => {
    let cancelled = false
    async function run() {
      const m = window.__cfMermaid
      if (!ready || !m || !ref.current) return
      try {
        const out = await m.render(rid || ('cf-flow-' + flow.id), flow.mermaid)
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

function FlowBadge({ label, compact }) {
  return (
    <span title={label} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--cf-primary)', background: 'var(--cf-primary-soft)', border: '1px solid var(--cf-primary-soft)', borderRadius: '5px', padding: compact ? '3px' : '2px 6px', whiteSpace: 'nowrap', flex: '0 0 auto' }}>
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="6" rx="1.5" /><rect x="14" y="15" width="7" height="6" rx="1.5" /><path d="M6.5 9 v3.5 a2 2 0 0 0 2 2 h5.5" /></svg>
      {compact ? null : label}
    </span>
  )
}

function renderInline(text) {
  const parts = String(text).split('**')
  return parts.map((p, i) => (i % 2 === 1)
    ? <strong key={i}>{p}</strong>
    : <React.Fragment key={i}>{p}</React.Fragment>)
}

function stripHeading(s) {
  let n = 0
  while (n < s.length && s[n] === '#') n++
  if (n > 0 && n <= 6 && s[n] === ' ') return s.slice(n + 1)
  return null
}

function splitCells(row) {
  let parts = String(row).split('|').map(function (c) { return c.trim() })
  if (parts.length && parts[0] === '') parts = parts.slice(1)
  if (parts.length && parts[parts.length - 1] === '') parts = parts.slice(0, -1)
  return parts
}

function isSepRow(line) {
  const t = line.trim()
  if (t.indexOf('-') === -1) return false
  for (let i = 0; i < t.length; i++) { const c = t[i]; if (c !== '|' && c !== '-' && c !== ':' && c !== ' ') return false }
  return true
}

function renderRich(text) {
  const NL = String.fromCharCode(10)
  const CR = String.fromCharCode(13)
  const lines = String(text).split(CR).join('').split(NL)
  const out = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    const trimmed = line.trim()
    if (trimmed.indexOf('|') > -1 && i + 1 < lines.length && isSepRow(lines[i + 1])) {
      const header = splitCells(line)
      const rows = []
      let j = i + 2
      while (j < lines.length && lines[j].indexOf('|') > -1 && lines[j].trim() !== '') { rows.push(splitCells(lines[j])); j++ }
      out.push(
        <div key={'tbl' + i} style={{ overflowX: 'auto', margin: '10px 0' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '13px', lineHeight: 1.5 }}>
            <thead>
              <tr>{header.map((h, hi) => (<th key={hi} style={{ textAlign: 'start', padding: '7px 10px', borderBottom: '1px solid var(--cf-line)', color: 'var(--cf-ink)', fontWeight: 700 }}>{renderInline(h)}</th>))}</tr>
            </thead>
            <tbody>
              {rows.map((r, ri) => (<tr key={ri}>{r.map((c, ci) => (<td key={ci} style={{ padding: '7px 10px', borderBottom: '1px solid var(--cf-line)', color: 'var(--cf-ink2)', verticalAlign: 'top' }}>{renderInline(c)}</td>))}</tr>))}
            </tbody>
          </table>
        </div>
      )
      i = j
      continue
    }
    if (trimmed === '') { out.push(<div key={i} style={{ height: '8px' }} />); i++; continue }
    const head = stripHeading(trimmed)
    if (head !== null) { out.push(<div key={i} style={{ fontWeight: 700, margin: '6px 0 2px' }}>{renderInline(head)}</div>); i++; continue }
    out.push(<div key={i} style={{ margin: '2px 0' }}>{renderInline(line)}</div>)
    i++
  }
  return out
}

function ChatPanel({ L, ar, mermaidReady, matchFlow }) {
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
      const answer = (j.text || '').toString()
      const flow = matchFlow ? matchFlow(query) : null
      setMsgs(next.concat([{ role: 'assistant', content: answer, flow: flow }]))
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
        <div ref={boxRef} style={{ maxHeight: '520px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', margin: '0 0 12px', paddingInlineEnd: '4px' }}>
          {msgs.map((m, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{ maxWidth: '92%' }}>
                <div className="cf-label" style={{ color: 'var(--cf-ink3)', marginBottom: '3px', textAlign: m.role === 'user' ? 'end' : 'start' }}>{m.role === 'user' ? L.you : L.zad}</div>
                <div style={{ background: m.role === 'user' ? 'var(--cf-primary-soft)' : 'var(--cf-surface)', color: 'var(--cf-ink)', border: '1px solid var(--cf-line)', borderRadius: '12px', padding: '10px 13px', fontSize: '14px', lineHeight: 1.7, whiteSpace: m.role === 'user' ? 'pre-wrap' : 'normal' }}>{m.role === 'user' ? m.content : renderRich(m.content)}</div>
              </div>
              {m.flow ? (<div style={{ width: '100%', marginTop: '10px' }}><FlowCard flow={m.flow} ar={ar} ready={mermaidReady} rid={'cf-flow-chat-' + i + '-' + m.flow.id} /></div>) : null}
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
  const [openCats, setOpenCats] = useState({})
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

  const matchFlow = (text) => {
    const hay = String(text || '').toLowerCase()
    let best = null, bestScore = 0
    flows.forEach((f) => {
      const term = terms.find((t) => t.slug === f.term_slug)
      if (!term) return
      const names = String(term.term_en || '').split('/').map((p) => p.split('(')[0].trim().toLowerCase()).filter((n) => n.length >= 4)
      let score = 0
      names.forEach((n) => { if (hay.indexOf(n) > -1) score += n.length })
      if (score > bestScore) { bestScore = score; best = f }
    })
    return best
  }

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return terms.filter((t) => {
      if (activeCat !== 'all' && t.category_id !== activeCat) return false
      if (!needle) return true
      const hay = [t.term_en, t.term_ar, t.body_en, t.body_ar, t.governing_source].filter(Boolean).join(' ').toLowerCase()
      return hay.includes(needle)
    })
  }, [terms, q, activeCat, ar])

  const grouped = useMemo(() => {
    return cats
      .map((c) => ({ cat: c, items: filtered.filter((t) => t.category_id === c.id) }))
      .filter((g) => g.items.length > 0)
  }, [cats, filtered])

  const showGrouped = !q.trim() && activeCat === 'all'

  const featuredTerms = useMemo(() => FEATURED.map((sl) => terms.find((t) => t.slug === sl)).filter(Boolean), [terms])

  const openFeatured = (t) => {
    setActiveCat('all'); setQ(''); setOpenTerm(t.id)
    setOpenCats((prev) => ({ ...prev, [t.category_id]: true }))
    setTimeout(function () { var el = document.getElementById('tf-term-' + t.id); if (el) el.scrollIntoView({ block: 'start' }) }, 80)
  }

  const align = ar ? 'right' : 'left'
  const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px', alignItems: 'start' }

  const renderTermCard = (t) => {
    const open = openTerm === t.id
    const flow = flowByTerm[t.slug]
    const showCat = !showGrouped
    return (
      <div key={t.id} id={'tf-term-' + t.id} className="cf-card" onClick={() => setOpenTerm(open ? null : t.id)} style={{ padding: '16px 18px', cursor: 'pointer', gridColumn: open ? '1 / -1' : 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'baseline' }}>
          <h3 className="cf-h3" style={{ margin: 0, flex: '1 1 auto' }}>{termLabel(t)}</h3>
          {(flow || showCat) ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end', flex: '0 0 auto' }}>
              {flow ? <FlowBadge label={L.flowLabel} /> : null}
              {showCat ? <span className="cf-label" style={{ color: 'var(--cf-ink3)', whiteSpace: 'nowrap' }}>{catName(t.category_id)}</span> : null}
            </span>
          ) : null}
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
  }

  return (
    <main className="cf-page">
      <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '28px 26px 80px', textAlign: align }}>
        <div className="cf-eyebrow">{L.eyebrow}</div>
        <h1 className="cf-h1 cf-grad-text" style={{ marginBottom: '8px' }}>{L.title}</h1>
        <p className="cf-muted" style={{ maxWidth: '760px', lineHeight: 1.7, marginBottom: '22px' }}>{L.subtitle}</p>

        <ChatPanel L={L} ar={ar} mermaidReady={mermaidReady} matchFlow={matchFlow} />

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
                  <span style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--cf-ink)', flex: '1 1 auto' }}>{termLabel(t)}</span>
                  {flowByTerm[t.slug] ? <FlowBadge label={L.flowLabel} compact /> : null}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {loading ? (
          <p className="cf-muted">{L.loading}</p>
        ) : filtered.length === 0 ? (
          <p className="cf-muted">{L.noResults}</p>
        ) : showGrouped ? (
          <div style={{ borderTop: '1px solid var(--cf-line)' }}>
            {grouped.map((g) => {
              const expanded = !!openCats[g.cat.id]
              return (
                <div key={g.cat.id} style={{ borderBottom: '1px solid var(--cf-line)' }}>
                  <button onClick={() => setOpenCats((prev) => ({ ...prev, [g.cat.id]: !prev[g.cat.id] }))} style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '15px 2px', color: 'var(--cf-ink)', fontFamily: 'inherit' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" style={{ transform: expanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s', flex: '0 0 auto', color: 'var(--cf-primary)' }}><path d="M9 6 l6 6 l-6 6" /></svg>
                    <span style={{ fontSize: '15px', fontWeight: 700, flex: '1 1 auto', textAlign: 'start' }}>{ar ? g.cat.name_ar : g.cat.name_en}</span>
                    <span className="cf-label" style={{ color: 'var(--cf-ink3)', flex: '0 0 auto' }}>{g.items.length}</span>
                  </button>
                  {expanded ? (
                    <div style={{ ...gridStyle, margin: '2px 0 20px' }}>
                      {g.items.map(renderTermCard)}
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>
        ) : (
          <div>
            <p className="cf-label" style={{ marginBottom: '12px', color: 'var(--cf-ink3)' }}>{filtered.length} {L.terms}</p>
            <div style={gridStyle}>
              {filtered.map(renderTermCard)}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
