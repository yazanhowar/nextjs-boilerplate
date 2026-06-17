'use client'
import { useState, useRef, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { BANKS } from '@/lib/banks-config'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

interface Message {
  role: 'user' | 'assistant'
  content: string
  chart?: any
}

// Parse chart blocks from AI response — handle both backtick variants
function extractChart(text: string): { text: string; chart: any | null } {
  // Match ```chart ... ``` blocks
  const match = text.match(/```chart\n([\s\S]*?)\n```/)
  if (!match) return { text, chart: null }
  try {
    const chart = JSON.parse(match[1])
    const cleaned = text.replace(/```chart\n[\s\S]*?\n```/, '').trim()
    return { text: cleaned, chart }
  } catch {
    return { text, chart: null }
  }
}

// Render inline markdown with bold, bullets, numbered lists, inline code
function RenderText({ content, t }: { content: string; t: any }) {
  const lines = content.split('\n')
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} style={{ height: 6 }} />
        if (line.startsWith('### ')) return <div key={i} style={{ fontWeight: 700, fontSize: 13, color: t.accent, marginTop: 10, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{line.slice(4)}</div>
        if (line.startsWith('## ')) return <div key={i} style={{ fontWeight: 700, fontSize: 15, color: t.text, marginTop: 10 }}>{line.slice(3)}</div>
        if (line.startsWith('# ')) return <div key={i} style={{ fontWeight: 700, fontSize: 17, color: t.text, marginTop: 10 }}>{line.slice(2)}</div>
        if (line.startsWith('---')) return <hr key={i} style={{ border: 'none', borderTop: `1px solid ${t.border}`, margin: '8px 0' }} />
        if (line.startsWith('- ') || line.startsWith('• ')) {
          const raw = line.slice(2)
          const parts = raw.split(/(**[^*]+**)/)
          return (
            <div key={i} style={{ display: 'flex', gap: 8, marginLeft: 4 }}>
              <span style={{ color: t.accent, flexShrink: 0, fontWeight: 700, fontSize: 12, marginTop: 2 }}>•</span>
              <span style={{ fontSize: 14, color: t.textSub, lineHeight: 1.65 }}>
                {parts.map((p, j) => p.startsWith('**') ? <strong key={j} style={{ color: t.text }}>{p.slice(2, -2)}</strong> : p)}
              </span>
            </div>
          )
        }
        if (line.match(/^\d+\. /)) {
          const num = line.match(/^(\d+)\./)?.[1]
          const raw = line.replace(/^\d+\. /, '')
          const parts = raw.split(/(**[^*]+**)/)
          return (
            <div key={i} style={{ display: 'flex', gap: 8, marginLeft: 4 }}>
              <span style={{ color: t.accent, flexShrink: 0, fontWeight: 600, fontSize: 13, minWidth: 18 }}>{num}.</span>
              <span style={{ fontSize: 14, color: t.textSub, lineHeight: 1.65 }}>
                {parts.map((p, j) => p.startsWith('**') ? <strong key={j} style={{ color: t.text }}>{p.slice(2, -2)}</strong> : p)}
              </span>
            </div>
          )
        }
        // Inline formatting for regular paragraphs
        const parts = line.split(/(**[^*]+**|`[^`]+`)/)
        return (
          <p key={i} style={{ fontSize: 14, color: t.textSub, lineHeight: 1.7, margin: 0 }}>
            {parts.map((p, j) => {
              if (p.startsWith('**')) return <strong key={j} style={{ color: t.text }}>{p.slice(2,-2)}</strong>
              if (p.startsWith('`')) return <code key={j} style={{ background: t.codeBg, padding: '1px 5px', borderRadius: 4, fontSize: 12, fontFamily: 'monospace' }}>{p.slice(1,-1)}</code>
              return p
            })}
          </p>
        )
      })}
    </div>
  )
}

// Recharts-based chart supporting bar, line, pie/donut types
function ChartBlock({ chart, t }: { chart: any; t: any }) {
  const ref = useRef<HTMLDivElement>(null)
  const COLORS = ['#0071E3', '#FF9F0A', '#30D158', '#FF453A', '#BF5AF2', '#64D2FF', '#FF6B35', '#98989D']

  async function exportPDF() {
    if (!ref.current) return
    const { default: html2canvas } = await import('html2canvas')
    const { jsPDF } = await import('jspdf')
    const canvas = await html2canvas(ref.current, { backgroundColor: t.surface })
    const img = canvas.toDataURL('image/png')
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [canvas.width, canvas.height] })
    pdf.addImage(img, 'PNG', 0, 0, canvas.width, canvas.height)
    pdf.save(`${chart.title || 'chart'}.pdf`)
  }

  const chartType = chart.type?.toLowerCase() || 'bar'
  const isDonut = chartType === 'donut' || chartType === 'pie'

  const customTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
      <div style={{ backgroundColor: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: '8px 12px', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
        {label && <div style={{ fontWeight: 600, color: t.text, marginBottom: 4 }}>{label}</div>}
        {payload.map((entry: any, i: number) => (
          <div key={i} style={{ color: entry.color || t.accent }}>
            <span style={{ color: t.textSub }}>{entry.name}: </span>
            <strong>{typeof entry.value === 'number' ? entry.value.toFixed(entry.value % 1 === 0 ? 0 : 1) : entry.value}</strong>
            {chart.unit ? ' ' + chart.unit : ''}
          </div>
        ))}
      </div>
    )
  }

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, name, value, percent }: any) => {
    if (percent < 0.05) return null
    const RADIAN = Math.PI / 180
    const r = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + r * Math.cos(-midAngle * RADIAN)
    const y = cy + r * Math.sin(-midAngle * RADIAN)
    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
        {percent > 0.08 ? name.split(' ')[0] : ''}{percent > 0.08 ? '\n' : ''}{(percent * 100).toFixed(0)}%
      </text>
    )
  }

  return (
    <div style={{ marginTop: 16, border: `1px solid ${t.border}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${t.border}`, backgroundColor: t.surface }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: t.text }}>{chart.title}</span>
        <button onClick={exportPDF} style={{ fontSize: 12, color: t.accent, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, padding: '4px 8px', borderRadius: 6, border: `1px solid ${t.accent}33` }}>
          ↓ Export PDF
        </button>
      </div>
      <div ref={ref} style={{ padding: '16px', backgroundColor: t.surface }}>
        <ResponsiveContainer width="100%" height={260}>
          {isDonut ? (
            <PieChart>
              <Pie
                data={chart.data}
                cx="50%"
                cy="50%"
                innerRadius={chartType === 'donut' ? 70 : 0}
                outerRadius={110}
                dataKey={chart.series?.[0] || 'value'}
                nameKey="name"
                label={renderCustomLabel}
                labelLine={false}
                paddingAngle={2}
              >
                {chart.data?.map((_: any, idx: number) => (
                  <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={customTooltip} />
              <Legend
                formatter={(value: string) => <span style={{ fontSize: 12, color: t.textSub }}>{value}</span>}
                iconType="circle"
                iconSize={8}
              />
            </PieChart>
          ) : chartType === 'line' ? (
            <LineChart data={chart.data} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.border} vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: t.textSub }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: t.textSub }} axisLine={false} tickLine={false} width={50}
                tickFormatter={(v: number) => chart.unit === '%' ? v + '%' : v >= 1000 ? (v/1000).toFixed(0) + 'K' : String(v)} />
              <Tooltip content={customTooltip} />
              <Legend formatter={(v: string) => <span style={{ fontSize: 12, color: t.textSub }}>{v}</span>} />
              {(chart.series || ['value']).map((s: string, i: number) => (
                <Line key={s} type="monotone" dataKey={s} stroke={COLORS[i % COLORS.length]}
                  strokeWidth={2.5} dot={{ r: 5, fill: COLORS[i % COLORS.length], strokeWidth: 0 }}
                  activeDot={{ r: 7 }} />
              ))}
            </LineChart>
          ) : (
            <BarChart data={chart.data} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.border} vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: t.textSub }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: t.textSub }} axisLine={false} tickLine={false} width={50}
                tickFormatter={(v: number) => chart.unit === '%' ? v + '%' : v >= 1000 ? (v/1000).toFixed(0) + 'K' : String(v)} />
              <Tooltip content={customTooltip} />
              <Legend formatter={(v: string) => <span style={{ fontSize: 12, color: t.textSub }}>{v}</span>} />
              {(chart.series || ['value']).map((s: string, i: number) => (
                <Bar key={s} dataKey={s} fill={COLORS[i % COLORS.length]} radius={[6, 6, 0, 0]} maxBarSize={60} />
              ))}
            </BarChart>
          )}
        </ResponsiveContainer>
        {chart.insight && (
          <div style={{ marginTop: 12, padding: '10px 14px', backgroundColor: t.accentSubtle, borderRadius: 8, fontSize: 13, color: t.accent, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <span>💡</span>
            <span>{chart.insight}</span>
          </div>
        )}
      </div>
    </div>
  )
}

const SUGGESTED_ALL = [
  'Which bank had the highest profit in 2025?',
  'Compare HBTF vs Capital Bank growth 2023–2025',
  'Show me a donut chart of sector profit share',
  'Which bank has the lowest home loan rate?',
  'Compare credit card fees across all banks',
  'Who are the top shareholders of Housing Bank?',
  'Compare ROE across all banks — bar chart',
  'What is JKB\'s profit trend 2023–2025?',
]

function YearChips({ onSend, t }: { onSend: (q: string) => void; t: any }) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
      {[
        { label: 'FY2025 results', q: 'Show me all bank profits for FY2025 with a bar chart' },
        { label: 'FY2024 results', q: 'Show me all bank profits for FY2024 with a bar chart' },
        { label: 'FY2023 results', q: 'Show me all bank profits for FY2023 with a bar chart' },
        { label: '3-year comparison', q: 'Compare HBTF net profit trend from 2023 to 2025 — line chart' },
        { label: 'Profit ranking', q: 'Rank all 15 banks by net profit in 2025 from highest to lowest' },
        { label: 'ROE comparison', q: 'Compare return on equity across all banks for 2025 — bar chart' },
      ].map(c => (
        <button
          key={c.label}
          onClick={() => onSend(c.q)}
          style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: `1px solid ${t.border}`, backgroundColor: t.surface, color: t.textSub, transition: 'all 0.15s', whiteSpace: 'nowrap' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = t.accent; (e.currentTarget as HTMLElement).style.color = t.accent }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = t.border; (e.currentTarget as HTMLElement).style.color = t.textSub }}
        >
          {c.label}
        </button>
      ))}
    </div>
  )
}

function ChatContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const bankId = searchParams.get('bank') ? parseInt(searchParams.get('bank')!) : null
  const bank = bankId ? BANKS.find(b => b.id === bankId) : null

  // Theme: read from localStorage + system preference
  const [dark, setDark] = useState(false)
  useEffect(() => {
    const stored = localStorage.getItem('hbtf-theme')
    const sysDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    setDark(stored === 'dark' || (!stored && sysDark))
  }, [])

  const toggleTheme = () => {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('hbtf-theme', next ? 'dark' : 'light')
  }

  const t = {
    bg: dark ? '#0D0D0D' : '#F2F4F7',
    surface: dark ? '#1C1C1E' : '#FFFFFF',
    border: dark ? '#2C2C2E' : '#E2E8F0',
    text: dark ? '#FFFFFF' : '#0F172A',
    textSub: dark ? '#98989D' : '#4A5568',
    textMuted: dark ? '#48484A' : '#94A3B8',
    accent: dark ? '#3B82F6' : '#004D8F',
    accentSubtle: dark ? 'rgba(59,130,246,0.12)' : 'rgba(0,77,143,0.08)',
    green: dark ? '#30D158' : '#16A34A',
    red: dark ? '#FF453A' : '#DC2626',
    userBubble: dark ? '#0071E3' : '#004D8F',
    aiBubble: dark ? '#1C1C1E' : '#FFFFFF',
    inputBg: dark ? '#1C1C1E' : '#FFFFFF',
    codeBg: dark ? '#2C2C2E' : '#F0F4FA',
    pillBg: dark ? '#2C2C2E' : '#EEF2F7',
    shadow: dark ? 'none' : '0 1px 3px rgba(0,0,0,0.08)',
    headerBg: dark ? 'rgba(13,13,13,0.9)' : 'rgba(242,244,247,0.9)',
  }

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [logoErr, setLogoErr] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send(content: string) {
    if (!content.trim() || streaming) return
    const userMsg: Message = { role: 'user', content: content.trim() }
    const history = [...messages, userMsg]
    setMessages([...history, { role: 'assistant', content: '' }])
    setInput('')
    setStreaming(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history.map(m => ({ role: m.role, content: m.content })), bankId }),
      })
      if (!res.ok) throw new Error('Failed')
      const reader = res.body!.getReader()
      const dec = new TextDecoder()
      let full = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        full += dec.decode(value)
        setMessages(prev => {
          const u = [...prev]
          u[u.length - 1] = { role: 'assistant', content: full }
          return u
        })
      }
      const { text, chart } = extractChart(full)
      setMessages(prev => {
        const u = [...prev]
        u[u.length - 1] = { role: 'assistant', content: text, chart: chart || undefined }
        return u
      })
    } catch {
      setMessages(prev => {
        const u = [...prev]
        u[u.length - 1] = { role: 'assistant', content: 'Something went wrong. Please try again.' }
        return u
      })
    } finally {
      setStreaming(false)
      inputRef.current?.focus()
    }
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: t.bg, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: t.text }}>
      {/* Header */}
      <header style={{ backgroundColor: t.headerBg, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: `1px solid ${t.border}`, padding: '0 20px', flexShrink: 0, position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 860, margin: '0 auto', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', color: t.textSub, fontSize: 13, cursor: 'pointer', padding: '4px 8px', borderRadius: 6 }}>
              ← Dashboard
            </button>
            <div style={{ width: 1, height: 18, backgroundColor: t.border }} />
            {bank ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: t.pillBg, border: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {!logoErr
                    ? <img src={bank.logoUrl} width={22} height={22} style={{ objectFit: 'contain' }} onError={() => setLogoErr(true)} />
                    : <span style={{ fontSize: 9, fontWeight: 700, color: t.textSub }}>{bank.shortName.slice(0,3)}</span>
                  }
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: t.text }}>{bank.name}</div>
                  <div style={{ fontSize: 11, color: t.textSub }}>AI Analyst</div>
                </div>
              </div>
            ) : (
              <span style={{ fontWeight: 600, fontSize: 14, color: t.text }}>Jordan Banking Analyst</span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={toggleTheme} title={dark ? 'Light mode' : 'Dark mode'} style={{ width: 34, height: 34, borderRadius: 8, border: `1px solid ${t.border}`, background: t.surface, cursor: 'pointer', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {dark ? '☀️' : '🌙'}
            </button>
            <select
              onChange={e => { router.push(e.target.value === 'all' ? '/chat' : `/chat?bank=${e.target.value}`); setMessages([]) }}
              value={bankId ?? 'all'}
              style={{ backgroundColor: t.pillBg, border: `1px solid ${t.border}`, borderRadius: 8, padding: '6px 10px', fontSize: 12, color: t.text, cursor: 'pointer', outline: 'none' }}
            >
              <option value="all">All banks</option>
              {BANKS.map(b => <option key={b.id} value={b.id}>{b.shortName}</option>)}
            </select>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          {messages.length === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', textAlign: 'center' }}>
              <div style={{ width: 60, height: 60, borderRadius: 18, backgroundColor: t.accentSubtle, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, fontSize: 28 }}>🏦</div>
              <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 8px', color: t.text }}>
                {bank ? `Ask me about ${bank.shortName}` : 'Jordan Banking Analyst'}
              </h2>
              <p style={{ fontSize: 14, color: t.textSub, margin: '0 0 24px', maxWidth: 440, lineHeight: 1.6 }}>
                {bank
                  ? `Verified data on ${bank.name} — financials, rates, fees, governance, ownership.`
                  : 'Verified FY2023–2025 data on all 15 Jordanian banks. Ask anything.'}
              </p>
              <div style={{ width: '100%', maxWidth: 620 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
                  {(bank ? [
                    `What was ${bank.shortName}'s net profit in 2025?`,
                    `Show ${bank.shortName} profit trend 2023–2025`,
                    `What loan rates does ${bank.shortName} offer?`,
                    `Compare ${bank.shortName} vs peers on ROE`,
                    `What credit card fees does ${bank.shortName} charge?`,
                    `Who are the top shareholders of ${bank.name}?`,
                    `Who is the CEO of ${bank.name}?`,
                    `Show a donut chart of ${bank.shortName} fee breakdown`,
                  ] : SUGGESTED_ALL).map(s => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      style={{ textAlign: 'left', padding: '12px 14px', borderRadius: 10, border: `1px solid ${t.border}`, backgroundColor: t.surface, color: t.textSub, fontSize: 13, cursor: 'pointer', lineHeight: 1.4, transition: 'all 0.15s', boxShadow: t.shadow }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = t.accent; (e.currentTarget as HTMLElement).style.color = t.text }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = t.border; (e.currentTarget as HTMLElement).style.color = t.textSub }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', gap: 10, alignItems: 'flex-start' }}>
                {msg.role === 'assistant' && (
                  <div style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: t.accentSubtle, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2, fontSize: 16 }}>🏦</div>
                )}
                <div style={{ maxWidth: '88%' }}>
                  {msg.role === 'user' ? (
                    <div style={{ backgroundColor: t.userBubble, color: '#fff', borderRadius: '18px 18px 4px 18px', padding: '12px 16px', fontSize: 14, lineHeight: 1.55 }}>
                      {msg.content}
                    </div>
                  ) : (
                    <div style={{ backgroundColor: t.aiBubble, border: `1px solid ${t.border}`, borderRadius: '4px 18px 18px 18px', padding: '14px 18px', boxShadow: t.shadow }}>
                      {msg.content ? <RenderText content={msg.content} t={t} /> : (
                        <div style={{ display: 'flex', gap: 5, alignItems: 'center', height: 22 }}>
                          {[0, 160, 320].map(delay => (
                            <div key={delay} style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: t.accent, animation: 'bounce 1.2s infinite', animationDelay: `${delay}ms`, opacity: 0.6 }} />
                          ))}
                        </div>
                      )}
                      {msg.chart && <ChartBlock chart={msg.chart} t={t} />}
                    </div>
                  )}
                </div>
                {msg.role === 'user' && (
                  <div style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: t.pillBg, border: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2, fontSize: 11, fontWeight: 700, color: t.textSub }}>You</div>
                )}
              </div>
            ))}
          </div>
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input area */}
      <div style={{ borderTop: `1px solid ${t.border}`, padding: '10px 20px 18px', backgroundColor: t.bg, flexShrink: 0 }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <YearChips onSend={send} t={t} />
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', backgroundColor: t.inputBg, border: `1px solid ${t.border}`, borderRadius: 14, padding: '10px 10px 10px 16px', boxShadow: t.shadow }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input) } }}
              placeholder={bank ? `Ask anything about ${bank.shortName}...` : 'Ask anything — profits, rates, fees, comparisons, charts...'}
              rows={1}
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 15, color: t.text, resize: 'none', maxHeight: 120, lineHeight: 1.5, fontFamily: 'inherit' }}
              onInput={e => { const el = e.currentTarget; el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 120) + 'px' }}
            />
            <button
              onClick={() => send(input)}
              disabled={!input.trim() || streaming}
              style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: input.trim() && !streaming ? t.accent : t.pillBg, border: 'none', cursor: input.trim() && !streaming ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={input.trim() && !streaming ? '#fff' : t.textMuted} strokeWidth="2.5">
                <path d="M22 2L11 13M22 2L15 22L11 13L2 9L22 2Z" />
              </svg>
            </button>
          </div>
          <div style={{ textAlign: 'center', fontSize: 11, color: t.textMuted, marginTop: 7 }}>
            Data from official bank sources &middot; FY2023–2025 &middot; Press Enter to send
          </div>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50% { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>}>
      <ChatContent />
    </Suspense>
  )
}
