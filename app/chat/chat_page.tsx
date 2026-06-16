'use client'
import { useState, useRef, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { BANKS } from '@/lib/banks-config'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface Message {
  role: 'user' | 'assistant'
  content: string
  chart?: any
}

function useTheme() {
  const [dark, setDark] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    setDark(mq.matches)
    mq.addEventListener('change', (e) => setDark(e.matches))
  }, [])
  return dark
}

function extractChart(text: string): { text: string; chart: any | null } {
  const match = text.match(/```chart\n([\s\S]*?)\n```/)
  if (!match) return { text, chart: null }
  try {
    const chart = JSON.parse(match[1])
    return { text: text.replace(/```chart\n[\s\S]*?\n```/, '').trim(), chart }
  } catch {
    return { text, chart: null }
  }
}

function RenderText({ content, t }: { content: string; t: any }) {
  const lines = content.split('\n')
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} style={{ height: 4 }} />
        if (line.startsWith('### ')) return <div key={i} style={{ fontWeight: 700, fontSize: 14, color: t.accent, marginTop: 8 }}>{line.replace('### ', '')}</div>
        if (line.startsWith('## ')) return <div key={i} style={{ fontWeight: 700, fontSize: 15, color: t.text, marginTop: 8 }}>{line.replace('## ', '')}</div>
        if (line.startsWith('**') && line.endsWith('**')) return <div key={i} style={{ fontWeight: 700, fontSize: 14, color: t.text }}>{line.replace(/\*\*/g, '')}</div>
        if (line.startsWith('- ') || line.startsWith('• ')) {
          const txt = line.replace(/^[-•] /, '').replace(/\*\*(.*?)\*\*/g, '$1')
          return (
            <div key={i} style={{ display: 'flex', gap: 8, marginLeft: 8 }}>
              <span style={{ color: t.accent, flexShrink: 0, marginTop: 1 }}>•</span>
              <span style={{ fontSize: 14, color: t.textSub, lineHeight: 1.6 }}>{txt}</span>
            </div>
          )
        }
        if (line.match(/^\d+\. /)) {
          const num = line.match(/^(\d+)\./)?.[1]
          const txt = line.replace(/^\d+\. /, '').replace(/\*\*(.*?)\*\*/g, '$1')
          return (
            <div key={i} style={{ display: 'flex', gap: 8, marginLeft: 8 }}>
              <span style={{ color: t.accent, flexShrink: 0, fontWeight: 600, fontSize: 13 }}>{num}.</span>
              <span style={{ fontSize: 14, color: t.textSub, lineHeight: 1.6 }}>{txt}</span>
            </div>
          )
        }
        if (line.startsWith('|')) return null // skip table rows — handled as plain text
        const html = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/`(.*?)`/g, `<code style="background:${t.codeBg};padding:1px 5px;border-radius:4px;font-size:12px">${'$1'}</code>`)
        return <p key={i} style={{ fontSize: 14, color: t.textSub, lineHeight: 1.7, margin: 0 }} dangerouslySetInnerHTML={{ __html: html }} />
      })}
    </div>
  )
}

function ChartBlock({ chart, t }: { chart: any; t: any }) {
  const ref = useRef<HTMLDivElement>(null)
  const COLORS = ['#0071E3', '#B8860B', '#30D158', '#FF453A', '#98989D']

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

  return (
    <div style={{ marginTop: 16, border: `1px solid ${t.border}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${t.border}` }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: t.text }}>{chart.title}</span>
        <button onClick={exportPDF} style={{ fontSize: 12, color: t.accent, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>↓ Export PDF</button>
      </div>
      <div ref={ref} style={{ padding: 16, backgroundColor: t.surface }}>
        <ResponsiveContainer width="100%" height={240}>
          {chart.type === 'line' ? (
            <LineChart data={chart.data}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.border} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: t.textSub }} />
              <YAxis tick={{ fontSize: 11, fill: t.textSub }} />
              <Tooltip contentStyle={{ backgroundColor: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, fontSize: 12 }} />
              <Legend />
              {(chart.series || ['value']).map((s: string, i: number) => (
                <Line key={s} type="monotone" dataKey={s} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={{ r: 4 }} />
              ))}
            </LineChart>
          ) : (
            <BarChart data={chart.data}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.border} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: t.textSub }} />
              <YAxis tick={{ fontSize: 11, fill: t.textSub }} />
              <Tooltip contentStyle={{ backgroundColor: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, fontSize: 12 }} />
              <Legend />
              {(chart.series || ['value']).map((s: string, i: number) => (
                <Bar key={s} dataKey={s} fill={COLORS[i % COLORS.length]} radius={[4, 4, 0, 0]} />
              ))}
            </BarChart>
          )}
        </ResponsiveContainer>
        {chart.insight && (
          <div style={{ marginTop: 12, padding: '10px 14px', backgroundColor: t.accentSubtle, borderRadius: 8, fontSize: 12, color: t.accent }}>
            💡 {chart.insight}
          </div>
        )}
      </div>
    </div>
  )
}

const SUGGESTED = [
  'Which bank had the highest profit in 2024?',
  'Compare HBTF and Arab Bank total assets over 3 years',
  'Which bank offers the lowest home loan rate?',
  'Show me credit card fees across all banks',
  'Who are the top shareholders of Housing Bank?',
  'Which banks paid dividends in 2024?',
  'Compare return on equity across all banks',
  'What products does Jordan Islamic Bank offer?',
]

function ChatContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const dark = useTheme()
  const bankId = searchParams.get('bank') ? parseInt(searchParams.get('bank')!) : null
  const bank = bankId ? BANKS.find(b => b.id === bankId) : null

  const t = {
    bg: dark ? '#0D0D0D' : '#F5F5F7',
    surface: dark ? '#1C1C1E' : '#FFFFFF',
    border: dark ? '#2C2C2E' : '#E5E5EA',
    text: dark ? '#FFFFFF' : '#1C1C1E',
    textSub: dark ? '#98989D' : '#6E6E73',
    textMuted: dark ? '#48484A' : '#AEAEB2',
    accent: '#0071E3',
    accentSubtle: dark ? 'rgba(0,113,227,0.12)' : 'rgba(0,113,227,0.08)',
    green: dark ? '#30D158' : '#28A745',
    red: dark ? '#FF453A' : '#DC3545',
    userBubble: '#0071E3',
    aiBubble: dark ? '#1C1C1E' : '#FFFFFF',
    inputBg: dark ? '#1C1C1E' : '#FFFFFF',
    codeBg: dark ? '#2C2C2E' : '#F0F0F2',
    pillBg: dark ? '#2C2C2E' : '#EEEEEE',
    shadow: dark ? 'none' : '0 1px 3px rgba(0,0,0,0.08)',
  }

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [imgError, setImgError] = useState(false)
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
      <header style={{ borderBottom: `1px solid ${t.border}`, padding: '0 20px', backgroundColor: t.bg, flexShrink: 0 }}>
        <div style={{ maxWidth: 800, margin: '0 auto', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', color: t.textSub, fontSize: 13, cursor: 'pointer', padding: 0 }}>← Dashboard</button>
            <div style={{ width: 1, height: 18, backgroundColor: t.border }} />
            {bank ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: dark ? '#2C2C2E' : '#F0F0F0', border: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {!imgError
                    ? <img src={bank.logoUrl} alt={bank.name} style={{ width: 24, height: 24, objectFit: 'contain' }} onError={() => setImgError(true)} />
                    : <span style={{ fontSize: 10, fontWeight: 700, color: t.textSub }}>{bank.shortName.slice(0, 3)}</span>
                  }
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: t.text }}>{bank.name}</div>
                  <div style={{ fontSize: 11, color: t.textSub }}>AI Analyst</div>
                </div>
              </div>
            ) : (
              <div style={{ fontWeight: 600, fontSize: 14, color: t.text }}>Jordan Banking Analyst</div>
            )}
          </div>
          <select
            onChange={e => { router.push(e.target.value === 'all' ? '/chat' : `/chat?bank=${e.target.value}`); setMessages([]) }}
            value={bankId || 'all'}
            style={{ backgroundColor: t.pillBg, border: `1px solid ${t.border}`, borderRadius: 8, padding: '6px 10px', fontSize: 12, color: t.text, cursor: 'pointer', outline: 'none' }}
          >
            <option value="all">All banks</option>
            {BANKS.map(b => <option key={b.id} value={b.id}>{b.shortName}</option>)}
          </select>
        </div>
      </header>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>

          {/* Empty state */}
          {messages.length === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '55vh', textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: t.accentSubtle, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, fontSize: 26 }}>🏦</div>
              <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 8px', color: t.text }}>
                {bank ? `Ask me about ${bank.shortName}` : 'Jordan Banking Analyst'}
              </h2>
              <p style={{ fontSize: 14, color: t.textSub, margin: '0 0 28px', maxWidth: 420, lineHeight: 1.6 }}>
                {bank
                  ? `I have verified data on ${bank.name} — financials, rates, fees, products, ownership, and leadership.`
                  : 'I have verified data on all 15 Jordanian banks. Ask me anything.'}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, width: '100%', maxWidth: 580 }}>
                {(bank ? [
                  `What was ${bank.shortName}'s net profit in 2024?`,
                  `Show ${bank.shortName} profit trend over 3 years`,
                  `What loan rates does ${bank.shortName} offer?`,
                  `What credit card fees does ${bank.shortName} charge?`,
                  `Who owns ${bank.shortName}?`,
                  `Who is the CEO of ${bank.shortName}?`,
                  `What products does ${bank.shortName} offer?`,
                  `Compare ${bank.shortName} ROE vs all banks`,
                ] : SUGGESTED).map(s => (
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
          )}

          {/* Message bubbles */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', gap: 10 }}>
                {msg.role === 'assistant' && (
                  <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: t.accentSubtle, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2, fontSize: 16 }}>🏦</div>
                )}
                <div style={{ maxWidth: '85%' }}>
                  {msg.role === 'user' ? (
                    <div style={{ backgroundColor: t.userBubble, color: '#fff', borderRadius: '18px 18px 4px 18px', padding: '12px 16px', fontSize: 14, lineHeight: 1.5 }}>
                      {msg.content}
                    </div>
                  ) : (
                    <div style={{ backgroundColor: t.aiBubble, border: `1px solid ${t.border}`, borderRadius: '4px 18px 18px 18px', padding: '14px 18px', boxShadow: t.shadow }}>
                      {msg.content ? (
                        <RenderText content={msg.content} t={t} />
                      ) : (
                        <div style={{ display: 'flex', gap: 4, alignItems: 'center', height: 20 }}>
                          {[0, 150, 300].map(delay => (
                            <div key={delay} style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: t.accent, animation: 'bounce 1s infinite', animationDelay: `${delay}ms` }} />
                          ))}
                        </div>
                      )}
                      {msg.chart && <ChartBlock chart={msg.chart} t={t} />}
                    </div>
                  )}
                </div>
                {msg.role === 'user' && (
                  <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: t.pillBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2, fontSize: 11, fontWeight: 600, color: t.textSub }}>You</div>
                )}
              </div>
            ))}
          </div>

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div style={{ borderTop: `1px solid ${t.border}`, padding: '12px 20px 20px', backgroundColor: t.bg, flexShrink: 0 }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', backgroundColor: t.inputBg, border: `1px solid ${t.border}`, borderRadius: 14, padding: '10px 10px 10px 16px', boxShadow: t.shadow }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input) } }}
              placeholder={bank ? `Ask anything about ${bank.shortName}...` : 'Ask anything about Jordanian banking...'}
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
          <div style={{ textAlign: 'center', fontSize: 11, color: t.textMuted, marginTop: 8 }}>
            Answers are based strictly on verified data from official bank sources · Press Enter to send
          </div>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui' }}>Loading...</div>}>
      <ChatContent />
    </Suspense>
  )
}
