'use client'
// app/chat/page.tsx — Main AI chat interface for the banking platform

import { useState, useRef, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { BANKS } from '@/lib/banks-config'
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts'

// ── Types ─────────────────────────────────────────────────────────────────────
interface Message {
  role: 'user' | 'assistant'
  content: string
  chart?: ChartSpec
}

interface ChartSpec {
  type: 'bar' | 'line'
  title: string
  data: any[]
  series: string[]
  insight?: string
}

const CHART_COLORS = ['#004D8F', '#CEBA95', '#2ECC71', '#E05252', '#8B9AB0', '#F39C12']

// ── Parse chart JSON from Claude response ─────────────────────────────────────
function extractChart(text: string): { text: string; chart: ChartSpec | null } {
  const match = text.match(/```chart\n([\s\S]*?)\n```/)
  if (!match) return { text, chart: null }
  try {
    const chart = JSON.parse(match[1]) as ChartSpec
    const cleanText = text.replace(/```chart\n[\s\S]*?\n```/, '').trim()
    return { text: cleanText, chart }
  } catch {
    return { text, chart: null }
  }
}

// ── Render markdown-like text ─────────────────────────────────────────────────
function RenderText({ content }: { content: string }) {
  const lines = content.split('\n')
  return (
    <div className="space-y-1.5">
      {lines.map((line, i) => {
        if (line.startsWith('### ')) {
          return <div key={i} className="font-bold text-[#CEBA95] text-[14px] mt-3">{line.replace('### ', '')}</div>
        }
        if (line.startsWith('## ')) {
          return <div key={i} className="font-bold text-white text-[15px] mt-3">{line.replace('## ', '')}</div>
        }
        if (line.startsWith('# ')) {
          return <div key={i} className="font-bold text-white text-[16px] mt-3">{line.replace('# ', '')}</div>
        }
        if (line.startsWith('- ') || line.startsWith('• ')) {
          const text = line.replace(/^[-•] /, '')
          return (
            <div key={i} className="flex items-start gap-2 ml-2">
              <span className="text-[#CEBA95] mt-1 flex-shrink-0">·</span>
              <span className="text-[13px] text-[#CBD5E0]" dangerouslySetInnerHTML={{ __html: boldify(text) }} />
            </div>
          )
        }
        if (line.match(/^\d+\. /)) {
          const text = line.replace(/^\d+\. /, '')
          const num = line.match(/^(\d+)\./)?.[1]
          return (
            <div key={i} className="flex items-start gap-2 ml-2">
              <span className="text-[#CEBA95] font-bold text-[12px] mt-0.5 flex-shrink-0 w-4">{num}.</span>
              <span className="text-[13px] text-[#CBD5E0]" dangerouslySetInnerHTML={{ __html: boldify(text) }} />
            </div>
          )
        }
        if (line.startsWith('|')) {
          return <TableRow key={i} line={line} />
        }
        if (line === '' || line === '---') return <div key={i} className="h-1" />
        return (
          <p key={i} className="text-[13px] text-[#CBD5E0] leading-relaxed"
            dangerouslySetInnerHTML={{ __html: boldify(line) }} />
        )
      })}
    </div>
  )
}

function boldify(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
    .replace(/`(.*?)`/g, '<code class="bg-[#1E3450] px-1.5 py-0.5 rounded text-[#CEBA95] text-[12px]">$1</code>')
}

function TableRow({ line }: { line: string }) {
  if (line.match(/^\|[-\s|]+\|$/)) return null
  const cells = line.split('|').filter(c => c.trim() !== '')
  return (
    <div className="flex gap-0 text-[12px] border-b border-[#1E3450]">
      {cells.map((cell, i) => (
        <div key={i} className={`flex-1 px-3 py-1.5 ${i === 0 ? 'text-[#8B9AB0]' : 'text-white font-medium'}`}>
          {cell.trim()}
        </div>
      ))}
    </div>
  )
}

// ── Chart renderer ────────────────────────────────────────────────────────────
function ChartRenderer({ chart }: { chart: ChartSpec }) {
  const chartRef = useRef<HTMLDivElement>(null)

  async function exportPDF() {
    if (!chartRef.current) return
    const { default: html2canvas } = await import('html2canvas')
    const { jsPDF } = await import('jspdf')
    const canvas = await html2canvas(chartRef.current, { backgroundColor: '#0A1628' })
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [canvas.width, canvas.height] })
    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height)
    pdf.save(`${chart.title}.pdf`)
  }

  return (
    <div className="mt-4 bg-[#0A1628] border border-[#1E3450] rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="text-[13px] font-semibold text-white">{chart.title}</div>
        <button
          onClick={exportPDF}
          className="text-[11px] px-3 py-1.5 rounded-lg border border-[#1E3450]
                     text-[#8B9AB0] hover:border-[#CEBA95] hover:text-[#CEBA95] transition-colors"
        >
          ↓ Export PDF
        </button>
      </div>
      <div ref={chartRef} className="bg-[#0A1628] rounded-lg">
        <ResponsiveContainer width="100%" height={280}>
          {chart.type === 'bar' ? (
            <BarChart data={chart.data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E3450" />
              <XAxis dataKey="name" stroke="#8B9AB0" tick={{ fontSize: 11 }} />
              <YAxis stroke="#8B9AB0" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0F1E35', border: '1px solid #1E3450', borderRadius: 8 }}
                labelStyle={{ color: '#CEBA95' }}
                itemStyle={{ color: '#fff' }}
              />
              <Legend />
              {chart.series.map((s, i) => (
                <Bar key={s} dataKey={s} fill={CHART_COLORS[i % CHART_COLORS.length]} radius={[4, 4, 0, 0]} />
              ))}
            </BarChart>
          ) : (
            <LineChart data={chart.data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E3450" />
              <XAxis dataKey="name" stroke="#8B9AB0" tick={{ fontSize: 11 }} />
              <YAxis stroke="#8B9AB0" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0F1E35', border: '1px solid #1E3450', borderRadius: 8 }}
                labelStyle={{ color: '#CEBA95' }}
                itemStyle={{ color: '#fff' }}
              />
              <Legend />
              {chart.series.map((s, i) => (
                <Line key={s} type="monotone" dataKey={s}
                  stroke={CHART_COLORS[i % CHART_COLORS.length]}
                  strokeWidth={2} dot={{ r: 4 }} />
              ))}
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
      {chart.insight && (
        <div className="mt-3 p-3 bg-[#CEBA95]/10 border border-[#CEBA95]/20 rounded-lg text-[12px] text-[#CEBA95]">
          💡 {chart.insight}
        </div>
      )}
    </div>
  )
}

// ── Suggested prompts ─────────────────────────────────────────────────────────
const SECTOR_PROMPTS = [
  'Which bank had the highest profit in 2024?',
  'Compare HBTF and Arab Bank total assets over 3 years',
  'Which bank offers the lowest home loan rate?',
  'Show me credit card fees across all banks',
  'Who are the top shareholders of Housing Bank?',
  'What products does Jordan Islamic Bank offer?',
  'Which banks paid dividends in 2024?',
  'Compare return on equity across all banks',
]

// ── Main chat component ───────────────────────────────────────────────────────
function ChatContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const bankIdParam = searchParams.get('bank')
  const bankId = bankIdParam ? parseInt(bankIdParam) : null
  const bank = bankId ? BANKS.find(b => b.id === bankId) : null

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [imgError, setImgError] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(content: string) {
    if (!content.trim() || streaming) return

    const userMessage: Message = { role: 'user', content: content.trim() }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('')
    setStreaming(true)

    // Add empty assistant message to stream into
    setMessages(prev => [...prev, { role: 'assistant', content: '' }])

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          bankId,
        }),
      })

      if (!res.ok) throw new Error('Failed to get response')

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let fullText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        fullText += decoder.decode(value)

        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = { role: 'assistant', content: fullText }
          return updated
        })
      }

      // Extract chart if present
      const { text, chart } = extractChart(fullText)
      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = { role: 'assistant', content: text, chart: chart || undefined }
        return updated
      })

    } catch {
      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = {
          role: 'assistant',
          content: 'Something went wrong. Please try again.'
        }
        return updated
      })
    } finally {
      setStreaming(false)
      inputRef.current?.focus()
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const isEmptyChat = messages.length === 0

  return (
    <div className="min-h-screen bg-[#0A1628] text-white flex flex-col">

      {/* ── Header ── */}
      <header className="border-b border-[#1E3450] px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/')}
            className="text-[#8B9AB0] hover:text-white transition-colors text-[13px]"
          >
            ← Dashboard
          </button>
          {bank && (
            <>
              <div className="w-px h-5 bg-[#1E3450]" />
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                  {!imgError ? (
                    <img src={bank.logoUrl} alt={bank.name} className="w-6 h-6 object-contain"
                      onError={() => setImgError(true)} />
                  ) : (
                    <span className="text-[10px] font-bold text-[#8B9AB0]">{bank.shortName.slice(0, 3)}</span>
                  )}
                </div>
                <div>
                  <div className="font-semibold text-white text-[14px]">{bank.name}</div>
                  <div className="text-[11px] text-[#8B9AB0]">Ask me anything about this bank</div>
                </div>
              </div>
            </>
          )}
          {!bank && (
            <>
              <div className="w-px h-5 bg-[#1E3450]" />
              <div>
                <div className="font-semibold text-white text-[14px]">Jordan Banking Analyst</div>
                <div className="text-[11px] text-[#8B9AB0]">Ask me anything about the Jordanian banking sector</div>
              </div>
            </>
          )}
        </div>

        {/* Bank switcher */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-[#8B9AB0]">Switch bank:</span>
          <select
            onChange={e => {
              const val = e.target.value
              if (val === 'all') router.push('/chat')
              else router.push(`/chat?bank=${val}`)
              setMessages([])
            }}
            value={bankId || 'all'}
            className="bg-[#0F1E35] border border-[#1E3450] rounded-lg px-3 py-1.5
                       text-[12px] text-white focus:outline-none focus:border-[#CEBA95]"
          >
            <option value="all">All banks</option>
            {BANKS.map(b => (
              <option key={b.id} value={b.id}>{b.shortName}</option>
            ))}
          </select>
        </div>
      </header>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-[800px] mx-auto space-y-6">

          {/* Empty state */}
          {isEmptyChat && (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
              <div className="w-14 h-14 bg-[#004D8F]/20 border border-[#004D8F]/30 rounded-2xl
                              flex items-center justify-center mb-6">
                <span className="text-2xl">🏦</span>
              </div>
              <h2 className="text-[22px] font-bold text-white mb-2">
                {bank ? `Ask me about ${bank.shortName}` : 'Ask me about Jordanian banking'}
              </h2>
              <p className="text-[14px] text-[#8B9AB0] mb-8 max-w-md">
                {bank
                  ? `I have complete data on ${bank.name} — financials, rates, fees, products, ownership, and leadership.`
                  : 'I have complete data on all 15 Jordanian banks — financials, rates, fees, products, ownership, and leadership.'}
              </p>

              {/* Suggested prompts */}
              <div className="grid grid-cols-2 gap-2 w-full max-w-[600px]">
                {(bank ? [
                  `What was ${bank.shortName}'s net profit in 2024?`,
                  `Show ${bank.shortName} profit trend over 3 years`,
                  `What loan rates does ${bank.shortName} offer?`,
                  `What credit card fees does ${bank.shortName} charge?`,
                  `Who owns ${bank.shortName}?`,
                  `Who is the CEO of ${bank.shortName}?`,
                  `What products does ${bank.shortName} offer?`,
                  `Compare ${bank.shortName} ROE vs sector average`,
                ] : SECTOR_PROMPTS).map(prompt => (
                  <button
                    key={prompt}
                    onClick={() => sendMessage(prompt)}
                    className="text-start px-4 py-3 rounded-xl bg-[#0F1E35] border border-[#1E3450]
                               text-[12px] text-[#8B9AB0] hover:border-[#CEBA95] hover:text-white
                               transition-all duration-150"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Message list */}
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-lg bg-[#004D8F]/20 border border-[#004D8F]/30
                                flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-[14px]">🏦</span>
                </div>
              )}

              <div className={`max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                {msg.role === 'user' ? (
                  <div className="bg-[#004D8F] text-white rounded-2xl rounded-tr-sm px-4 py-3 text-[14px]">
                    {msg.content}
                  </div>
                ) : (
                  <div className="bg-[#0F1E35] border border-[#1E3450] rounded-2xl rounded-tl-sm px-5 py-4 w-full">
                    {msg.content ? (
                      <RenderText content={msg.content} />
                    ) : (
                      <div className="flex gap-1 items-center h-5">
                        <div className="w-1.5 h-1.5 bg-[#CEBA95] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-1.5 h-1.5 bg-[#CEBA95] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-1.5 h-1.5 bg-[#CEBA95] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    )}
                    {msg.chart && <ChartRenderer chart={msg.chart} />}
                  </div>
                )}
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-lg bg-[#CEBA95]/20 border border-[#CEBA95]/30
                                flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-[12px] font-bold text-[#CEBA95]">You</span>
                </div>
              )}
            </div>
          ))}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* ── Input ── */}
      <div className="border-t border-[#1E3450] px-6 py-4 flex-shrink-0">
        <div className="max-w-[800px] mx-auto">
          <div className="flex gap-3 items-end bg-[#0F1E35] border border-[#1E3450]
                          rounded-xl px-4 py-3 focus-within:border-[#CEBA95] transition-colors">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={bank
                ? `Ask anything about ${bank.shortName}...`
                : 'Ask anything about Jordanian banking...'
              }
              rows={1}
              className="flex-1 bg-transparent text-[14px] text-white placeholder-[#4A5568]
                         focus:outline-none resize-none leading-relaxed"
              style={{ maxHeight: '120px' }}
              onInput={e => {
                const el = e.currentTarget
                el.style.height = 'auto'
                el.style.height = Math.min(el.scrollHeight, 120) + 'px'
              }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || streaming}
              className="w-8 h-8 rounded-lg bg-[#004D8F] flex items-center justify-center
                         hover:bg-[#0060B0] disabled:opacity-40 transition-colors flex-shrink-0"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M22 2L11 13M22 2L15 22L11 13L2 9L22 2Z" />
              </svg>
            </button>
          </div>
          <div className="text-[11px] text-[#4A5568] mt-2 text-center">
            Answers are based strictly on verified data from official bank sources
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0A1628] flex items-center justify-center text-white">
        Loading...
      </div>
    }>
      <ChatContent />
    </Suspense>
  )
}
