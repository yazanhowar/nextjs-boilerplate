'use client'
import { useState, useRef, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { BANKS } from '@/lib/banks-config'
import SettingsPanel from '@/components/SettingsPanel'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

interface Message {
  role: 'user' | 'assistant'
  content: string
  chart?: any
}

// Extract chart JSON block using indexOf — avoids regex issues with backticks
function extractChart(text: string): { text: string; chart: any | null } {
  const OPEN = '```chart'
  const CLOSE = '```'
  const si = text.indexOf(OPEN)
  if (si === -1) return { text, chart: null }
  const js = text[si + OPEN.length] === '\n' ? si + OPEN.length + 1 : si + OPEN.length
  const ci = text.indexOf(CLOSE, js)
  if (ci === -1) return { text, chart: null }
  try {
    const chart = JSON.parse(text.slice(js, ci).trim())
    return { text: (text.slice(0, si) + text.slice(ci + CLOSE.length)).trim(), chart }
  } catch {
    return { text, chart: null }
  }
}

// Bold spans — split on ** markers
function linkify(text: string, keyPrefix: string): React.ReactNode {
  const urlRe = /(https?:\/\/[^\s)]+)/g
  const segs = text.split(urlRe)
  return segs.map((seg, j) => {
    if (/^https?:\/\//.test(seg)) {
      const clean = seg.replace(/[.,;]+$/, '')
      return <a key={keyPrefix + '-' + j} href={clean} target="_blank" rel="noopener noreferrer" style={{ color: '#3B82F6', textDecoration: 'underline', wordBreak: 'break-all' }}>{clean}</a>
    }
    return <span key={keyPrefix + '-' + j}>{seg}</span>
  })
}

function bold(text: string, textColor: string): React.ReactNode {
  const parts = text.split('**')
  return parts.map((p, i) =>
    i % 2 === 1
      ? <strong key={i} style={{ color: textColor, fontWeight: 700 }}>{linkify(p, 'b' + i)}</strong>
      : <span key={i}>{linkify(p, 's' + i)}</span>
  )
}


function MarkdownTable({ rows, t }: { rows: string[]; t: any }) {
  const splitRow = (r: string) => r.replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|').map(c => c.trim().replace(/\*\*/g, ''))
  const header = splitRow(rows[0])
  const bodyRows = rows.slice(2).map(splitRow)
  const cellBase: any = { padding: '7px 12px', fontSize: 13, whiteSpace: 'nowrap' }
  return (
    <div style={{ overflowX: 'auto', margin: '10px 0', border: '1px solid ' + t.border, borderRadius: 10 }}>
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>{header.map((h, i) => (
            <th key={i} style={{ ...cellBase, textAlign: i === 0 ? 'left' : 'right', fontWeight: 700, color: t.textSub, borderBottom: '1px solid ' + t.border, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
          ))}</tr>
        </thead>
        <tbody>
          {bodyRows.map((cells, ri) => (
            <tr key={ri}>{cells.map((c, ci) => (
              <td key={ci} style={{ ...cellBase, textAlign: ci === 0 ? 'left' : 'right', color: t.text, fontWeight: ci === 0 ? 600 : 500, borderBottom: ri === bodyRows.length - 1 ? 'none' : '1px solid ' + t.border }}>{c}</td>
            ))}</tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
function isTableRow(l: string) { return /^\s*\|.*\|\s*$/.test(l) }
function isTableSep(l: string) { return /^\s*\|?[\s:|-]*-[\s:|-]*\|?\s*$/.test(l) && l.includes('-') }

function RenderText({ content, t }: { content: string; t: any }) {
  const ls = content.split('\n')
  const blocks: { type: 'text' | 'table'; lines: string[] }[] = []
  let i = 0
  while (i < ls.length) {
    if (isTableRow(ls[i]) && i + 1 < ls.length && isTableSep(ls[i + 1])) {
      const tbl: string[] = [ls[i], ls[i + 1]]
      i += 2
      while (i < ls.length && isTableRow(ls[i])) { tbl.push(ls[i]); i++ }
      blocks.push({ type: 'table', lines: tbl })
    } else {
      const txt: string[] = []
      while (i < ls.length && !(isTableRow(ls[i]) && i + 1 < ls.length && isTableSep(ls[i + 1]))) { txt.push(ls[i]); i++ }
      blocks.push({ type: 'text', lines: txt })
    }
  }
  return (
    <>
      {blocks.map((b, bi) => b.type === 'table'
        ? <MarkdownTable key={bi} rows={b.lines} t={t} />
        : <RenderTextInner key={bi} content={b.lines.join('\n')} t={t} />)}
    </>
  )
}

function RenderTextInner({ content, t }: { content: string; t: any }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {content.split('\n').map((line, i) => {
        if (!line.trim()) return <div key={i} style={{ height: 6 }} />
        if (line.startsWith('### ')) return <div key={i} style={{ fontWeight: 700, fontSize: 13, color: t.accent, marginTop: 10, letterSpacing: '0.04em' }}>{line.slice(4)}</div>
        if (line.startsWith('## '))  return <div key={i} style={{ fontWeight: 700, fontSize: 15, color: t.text,  marginTop: 10 }}>{line.slice(3)}</div>
        if (line.startsWith('# '))   return <div key={i} style={{ fontWeight: 700, fontSize: 17, color: t.text,  marginTop: 10 }}>{line.slice(2)}</div>
        if (line.startsWith('---'))  return <hr  key={i} style={{ border: 'none', borderTop: `1px solid ${t.border}`, margin: '8px 0' }} />
        // Bullet: dash or actual bullet char (• U+2022)
        if (line.startsWith('- ') || line.startsWith('• ')) {
          return (
            <div key={i} style={{ display: 'flex', gap: 8, marginLeft: 4 }}>
              <span style={{ color: t.accent, flexShrink: 0, fontWeight: 700, marginTop: 2 }}>•</span>
              <span style={{ fontSize: 14, color: t.textSub, lineHeight: 1.65 }}>{bold(line.slice(2), t.text)}</span>
            </div>
          )
        }
        // Numbered list: single digit followed by '. '
        if (line.length > 2 && line[1] === '.' && line[2] === ' ' && line[0] >= '1' && line[0] <= '9') {
          return (
            <div key={i} style={{ display: 'flex', gap: 8, marginLeft: 4 }}>
              <span style={{ color: t.accent, flexShrink: 0, fontWeight: 600, minWidth: 18 }}>{line[0]}.</span>
              <span style={{ fontSize: 14, color: t.textSub, lineHeight: 1.65 }}>{bold(line.slice(3), t.text)}</span>
            </div>
          )
        }
        return <p key={i} style={{ fontSize: 14, color: t.textSub, lineHeight: 1.7, margin: 0 }}>{bold(line, t.text)}</p>
      })}
    </div>
  )
}

function ChartBlock({ chart, t }: { chart: any; t: any }) {
  const ref = useRef<HTMLDivElement>(null)
  const COLORS = ['#0071E3','#FF9F0A','#30D158','#FF453A','#BF5AF2','#64D2FF','#FF6B35','#98989D','#34C759','#FF375F']
  const type = (chart.type || 'bar').toLowerCase()
  const isDonut = type === 'donut' || type === 'pie'
  const series: string[] = chart.series || ['value']
  const isPct = chart.unit === '%'

  async function exportPDF() {
    if (!ref.current) return
    const { default: html2canvas } = await import('html2canvas')
    const { jsPDF } = await import('jspdf')
    const canvas = await html2canvas(ref.current, { backgroundColor: t.surface })
    const img = canvas.toDataURL('image/png')
    const pdf = new jsPDF({ orientation: 'landscape' as const, unit: 'px' as const, format: [canvas.width, canvas.height] })
    pdf.addImage(img, 'PNG', 0, 0, canvas.width, canvas.height)
    pdf.save((chart.title || 'chart') + '.pdf')
  }

  const Tip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
      <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: '8px 12px', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
        {label && <div style={{ fontWeight: 600, color: t.text, marginBottom: 4 }}>{label}</div>}
        {(payload as any[]).map((e: any, i: number) => (
          <div key={i} style={{ color: e.color || t.accent }}>
            <span style={{ color: t.textSub }}>{e.name}: </span>
            <strong>{typeof e.value === 'number' ? e.value.toFixed(1) : e.value}</strong>
            {chart.unit ? ' ' + chart.unit : ''}
          </div>
        ))}
      </div>
    )
  }

  const tickFmt = (v: number) => isPct ? v + '%' : v >= 1000 ? (v/1000).toFixed(0)+'K' : String(v)

  return (
    <div style={{ marginTop: 16, border: `1px solid ${t.border}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${t.border}`, background: t.surface }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: t.text }}>{chart.title}</span>
        <button onClick={exportPDF} style={{ fontSize: 12, color: t.accent, background: 'none', border: `1px solid ${t.accent}44`, borderRadius: 6, cursor: 'pointer', padding: '3px 10px' }}>
          ↓ Export PDF
        </button>
      </div>
      <div ref={ref} style={{ padding: 16, background: t.surface }}>
        <ResponsiveContainer width="100%" height={260}>
          {isDonut ? (
            <PieChart>
              <Pie data={chart.data} cx="50%" cy="50%"
                innerRadius={type === 'donut' ? 65 : 0} outerRadius={110}
                dataKey={series[0]} nameKey="name" paddingAngle={2}>
                {(chart.data as any[])?.map((_: any, idx: number) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
              </Pie>
              <Tooltip content={<Tip />} />
              <Legend formatter={(v: string) => <span style={{ fontSize: 12, color: t.textSub }}>{v}</span>} iconType="circle" iconSize={8} />
            </PieChart>
          ) : type === 'line' ? (
            <LineChart data={chart.data} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.border} vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: t.textSub }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: t.textSub }} axisLine={false} tickLine={false} width={55} tickFormatter={tickFmt} />
              <Tooltip content={<Tip />} />
              <Legend formatter={(v: string) => <span style={{ fontSize: 12, color: t.textSub }}>{v}</span>} />
              {series.map((s: string, i: number) => (
                <Line key={s} type="monotone" dataKey={s} stroke={COLORS[i % COLORS.length]}
                  strokeWidth={2.5} dot={{ r: 5, fill: COLORS[i % COLORS.length], strokeWidth: 0 }} activeDot={{ r: 7 }} />
              ))}
            </LineChart>
          ) : (
            <BarChart data={chart.data} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.border} vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: t.textSub }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: t.textSub }} axisLine={false} tickLine={false} width={55} tickFormatter={tickFmt} />
              <Tooltip content={<Tip />} />
              <Legend formatter={(v: string) => <span style={{ fontSize: 12, color: t.textSub }}>{v}</span>} />
              {series.map((s: string, i: number) => (
                <Bar key={s} dataKey={s} fill={COLORS[i % COLORS.length]} radius={[6,6,0,0]} maxBarSize={60} />
              ))}
            </BarChart>
          )}
        </ResponsiveContainer>
        {chart.insight && (
          <div style={{ marginTop: 12, padding: '10px 14px', background: t.accentSubtle, borderRadius: 8, fontSize: 13, color: t.accent, display: 'flex', gap: 8 }}>
            <span>💡</span><span>{chart.insight}</span>
          </div>
        )}
      </div>
    </div>
  )
}

function ChatContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const bankId = searchParams.get('bank') ? parseInt(searchParams.get('bank')!) : null
  const bank = bankId ? BANKS.find(b => b.id === bankId) : null

  const [dark, setDark] = useState(false)
  useEffect(() => {
    const s = localStorage.getItem('hbtf-theme')
    const sys = window.matchMedia('(prefers-color-scheme: dark)').matches
    setDark(s === 'dark' || (!s && sys))
  }, [])
  const toggleTheme = () => {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('hbtf-theme', next ? 'dark' : 'light')
  }

  const t = {
    bg:          dark ? '#0D0D0D' : '#F2F4F7',
    surface:     dark ? '#1C1C1E' : '#FFFFFF',
    border:      dark ? '#2C2C2E' : '#E2E8F0',
    text:        dark ? '#FFFFFF' : '#0F172A',
    textSub:     dark ? '#98989D' : '#4A5568',
    textMuted:   dark ? '#48484A' : '#94A3B8',
    accent:      dark ? '#3B82F6' : '#004D8F',
    accentSubtle:dark ? 'rgba(59,130,246,0.12)' : 'rgba(0,77,143,0.08)',
    userBubble:  dark ? '#0071E3' : '#004D8F',
    aiBubble:    dark ? '#1C1C1E' : '#FFFFFF',
    inputBg:     dark ? '#1C1C1E' : '#FFFFFF',
    pillBg:      dark ? '#2C2C2E' : '#EEF2F7',
    shadow:      dark ? 'none' : '0 1px 3px rgba(0,0,0,0.08)',
    hBg:         dark ? 'rgba(13,13,13,0.92)' : 'rgba(242,244,247,0.92)',
  }

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [logoErr, setLogoErr] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLTextAreaElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])
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
      if (!res.ok) throw new Error('error')
      const reader = res.body!.getReader()
      const dec = new TextDecoder()
      let full = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        full += dec.decode(value)
        const display = full.split('__USAGE__')[0]
        setMessages(prev => { const u = [...prev]; u[u.length-1] = { role:'assistant', content:display }; return u })
      }
      // Extract token usage emitted at end of stream
      const usageMatch = full.match(/__USAGE__(\{[^}]*\})/)
      if (usageMatch) {
        try {
          const usage = JSON.parse(usageMatch[1])
          const prevIn = parseInt(localStorage.getItem('hbtf-tokens-in') || '0', 10)
          const prevOut = parseInt(localStorage.getItem('hbtf-tokens-out') || '0', 10)
          localStorage.setItem('hbtf-tokens-in', String(prevIn + (usage.in || 0)))
          localStorage.setItem('hbtf-tokens-out', String(prevOut + (usage.out || 0)))
          window.dispatchEvent(new Event('hbtf-usage-updated'))
        } catch {}
      }
      full = full.split('__USAGE__')[0]
      const { text, chart } = extractChart(full)
      setMessages(prev => { const u = [...prev]; u[u.length-1] = { role:'assistant', content:text, chart: chart||undefined }; return u })
    } catch {
      setMessages(prev => { const u = [...prev]; u[u.length-1] = { role:'assistant', content:'Something went wrong. Please try again.' }; return u })
    } finally {
      setStreaming(false)
      inputRef.current?.focus()
    }
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: t.bg, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: t.text }}>
      {/* Header */}
      <header style={{ backgroundColor: t.hBg, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: `1px solid ${t.border}`, padding: '0 20px', flexShrink: 0, position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 860, margin: '0 auto', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', color: t.textSub, fontSize: 13, cursor: 'pointer' }}>
              ← Dashboard
            </button>
            <div style={{ width: 1, height: 18, backgroundColor: t.border }} />
            {bank ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: t.pillBg, border: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {!logoErr
                    ? <img src={bank.logoUrl} width={22} height={22} style={{ objectFit: 'contain' }} onError={() => setLogoErr(true)} />
                    : <span style={{ fontSize: 9, fontWeight: 700, color: t.textSub }}>{bank.shortName.slice(0,3)}</span>}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: t.text }}>{bank.name}</div>
                  <div style={{ fontSize: 11, color: t.textSub }}>AI Analyst</div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <img src="/convo-icon.svg" alt="" style={{ width: 30, height: 30 }} />
                <span style={{ fontWeight: 600, fontSize: 14, color: t.text }}>Jordan Banking Analyst</span>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <select onChange={e => { router.push(e.target.value === 'all' ? '/chat' : `/chat?bank=${e.target.value}`); setMessages([]) }} value={bankId ?? 'all'}
              style={{ backgroundColor: t.pillBg, border: `1px solid ${t.border}`, borderRadius: 8, padding: '6px 10px', fontSize: 12, color: t.text, cursor: 'pointer', outline: 'none' }}>
              <option value="all">All banks</option>
              {BANKS.map(b => <option key={b.id} value={b.id}>{b.shortName}</option>)}
            </select>
            <button onClick={toggleTheme} title={dark ? 'Switch to light' : 'Switch to dark'} style={{ position:'relative', width:48, height:26, borderRadius:13, border:'none', cursor:'pointer', padding:0, flexShrink:0, backgroundColor:dark?'#3B82F6':'#D1D5DB', transition:'background-color 0.25s ease', display:'flex', alignItems:'center' }}>
            <span style={{ position:'absolute', left:dark?24:2, width:22, height:22, borderRadius:11, backgroundColor:'#fff', transition:'left 0.25s ease', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 1px 3px rgba(0,0,0,0.2)' }}>
              {dark ? (
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round"><path d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z"/></svg>
              ) : (
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
              )}
            </span>
          </button>
          <SettingsPanel dark={dark} />
          </div>
        </div>
      </header>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          {messages.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 160px)', textAlign: 'center', padding: '0 20px' }}>
            <img src="/convo-zad-en.svg" alt="Zad" style={{ width: 56, height: 56, marginBottom: 18 }} />
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 10px', color: t.text }}>
              {bank ? `${bank.name} — AI Analyst` : 'Jordan Banking Analyst'}
            </h2>
            <p style={{ fontSize: 14, color: t.textSub, margin: 0, lineHeight: 1.65, maxWidth: 420 }}>
              {bank
                ? `Ask me anything about ${bank.shortName} — financials, rates, fees, ownership, leadership, or how it stacks up against the sector.`
                : 'Ask me anything across all 15 Jordanian banks — profits, rates, fees, comparisons, charts, governance, strategy.'}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', maxWidth: 680, marginTop: 22 }}>
              {(bank ? [
                'What are the latest announcements?',
                'What is ' + bank.shortName + "'s competitive advantage today?",
                'How does ' + bank.shortName + ' compare to the sector on profitability?',
                'Which segment is growing fastest for ' + bank.shortName + '?',
                'How healthy is ' + bank.shortName + "'s loan portfolio?",
                'What are the trends in ' + bank.shortName + "'s net interest margin?",
                'Who leads ' + bank.shortName + ' and how experienced is the team?',
                'What are the biggest risks facing ' + bank.shortName + ' today?',
              ] : [
                'What are the latest announcements?',
                'Which segment is growing fastest in Jordan?',
                'Which bank has the healthiest loan portfolio?',
                'What are the trends in net interest margins across the sector?',
                'Which banking products are seeing the highest adoption?',
                'How are customer expectations changing in Jordanian banking?',
                'What percentage of banking transactions are now digital in Jordan?',
                'What are the risks of not adopting AI in banking?',
              ]).map((q, i) => (
                <button key={i} onClick={() => send(q)} style={{ border: '1px solid ' + t.border, backgroundColor: t.inputBg, color: t.text, borderRadius: 20, padding: '8px 14px', fontSize: 13, cursor: 'pointer', lineHeight: 1.3, transition: 'all 0.15s', textAlign: 'left' }}>
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', gap: 10, alignItems: 'flex-start' }}>
                {msg.role === 'assistant' && (
                  <img src={/[\u0600-\u06FF]/.test((messages[i-1] && messages[i-1].content) || '') ? '/convo-zad-ar.svg' : '/convo-zad-en.svg'} alt="Zad" style={{ width: 34, height: 34, flexShrink: 0, marginTop: 2 }} />
                )}
                <div style={{ maxWidth: '88%' }}>
                  {msg.role === 'user' ? (
                    <div style={{ backgroundColor: t.userBubble, color: '#fff', borderRadius: '18px 18px 4px 18px', padding: '12px 16px', fontSize: 14, lineHeight: 1.55 }}>{msg.content}</div>
                  ) : (
                    <div style={{ backgroundColor: t.aiBubble, border: `1px solid ${t.border}`, borderRadius: '4px 18px 18px 18px', padding: '14px 18px', boxShadow: t.shadow }}>
                      {msg.content
                        ? <RenderText content={msg.content} t={t} />
                        : <div style={{ display: 'flex', gap: 5, alignItems: 'center', height: 22 }}>
                            {[0,160,320].map(d => <div key={d} style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: t.accent, animation: 'bounce 1.2s infinite', animationDelay: d+'ms', opacity: 0.6 }} />)}
                          </div>
                      }
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
          
          {/* Text input */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', backgroundColor: t.inputBg, border: `1px solid ${t.border}`, borderRadius: 14, padding: '10px 10px 10px 16px', boxShadow: t.shadow }}>
            <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input) } }}
              placeholder={bank ? `Ask anything about ${bank.shortName}...` : 'Ask about profits, rates, fees, charts, comparisons…'}
              rows={1}
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 15, color: t.text, resize: 'none', maxHeight: 120, lineHeight: 1.5, fontFamily: 'inherit' }}
              onInput={e => { const el = e.currentTarget; el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 120)+'px' }}
            />
            <button onClick={() => send(input)} disabled={!input.trim() || streaming}
              style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: input.trim() && !streaming ? t.accent : t.pillBg, border: 'none', cursor: input.trim() && !streaming ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={input.trim() && !streaming ? '#fff' : t.textMuted} strokeWidth="2.5">
                <path d="M22 2L11 13M22 2L15 22L11 13L2 9L22 2Z" />
              </svg>
            </button>
          </div>
          <div style={{ textAlign: 'center', fontSize: 11, color: t.textMuted, marginTop: 7 }}>
            Data from official bank sources &middot; FY2023–2025 &middot; Press Enter to send
          </div>
          <div style={{ fontSize: 10, color: t.textSub, opacity: 0.55, marginTop: 4, textAlign: 'center' }}>
            A product by Yazan Howar &middot; Innovation &amp; Incubation Department &middot; Housing Bank
          </div>
        </div>
      </div>
      <style>{`@keyframes bounce{0%,100%{transform:translateY(0);opacity:.4}50%{transform:translateY(-5px);opacity:1}}`}</style>
    </div>
  )
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div style={{ height:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>Loading…</div>}>
      <ChatContent />
    </Suspense>
  )
}
