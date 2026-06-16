'use client'
// app/compare/page.tsx â Side-by-side bank comparison + AI chart generation

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { BANKS } from '@/lib/banks-config'
import { createClient } from '@supabase/supabase-js'
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const CHART_COLORS = ['#004D8F', '#CEBA95', '#2ECC71', '#E05252', '#8B9AB0', '#F39C12']

// DB values stored in THOUSANDS. Arab Bank (id=1) = USD thousands, others = JOD thousands.
const ARAB_BANK_ID = 1
const USD_TO_JOD = 0.71
function toJOD(n: number | null | undefined, bankId: number): number | null {
  if (n == null) return null
  return bankId === ARAB_BANK_ID ? n * USD_TO_JOD : n
}
function fmtJOD(n: number | null | undefined, bankId?: number): string {
  if (n == null) return '—'
  const v = bankId != null ? (toJOD(n, bankId) ?? n) : n
  const abs = Math.abs(v)
  if (abs >= 1_000_000) return `JOD ${(v / 1_000_000).toFixed(2)}B`
  if (abs >= 1_000) return `JOD ${(v / 1_000).toFixed(1)}M`
  return `JOD ${v.toFixed(0)}K`
}

function CompareContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialPrompt = searchParams.get('q') || ''
  const initialBank = searchParams.get('bank') ? parseInt(searchParams.get('bank')!) : null

  const [selectedBanks, setSelectedBanks] = useState<number[]>(
    initialBank ? [2, initialBank] : [2, 3] // Default: HBTF vs JKB
  )
  const [prompt, setPrompt] = useState(initialPrompt)
  const [chartData, setChartData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [financials, setFinancials] = useState<Record<number, any[]>>({})
  const chartRef = useRef<HTMLDivElement>(null)

  // Load financials for selected banks
  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('bank_financials')
        .select('*')
        .in('bank_id', selectedBanks)
        .order('fiscal_year', { ascending: true })
      if (data) {
        const grouped: Record<number, any[]> = {}
        data.forEach(r => {
          if (!grouped[r.bank_id]) grouped[r.bank_id] = []
          grouped[r.bank_id].push(r)
        })
        setFinancials(grouped)
      }
    }
    load()
  }, [selectedBanks])

  // Auto-run prompt from URL
  useEffect(() => {
    if (initialPrompt) handleSubmit(null, initialPrompt)
  }, [])

  async function handleSubmit(e: React.FormEvent | null, overridePrompt?: string) {
    e?.preventDefault()
    const q = overridePrompt ?? prompt
    if (!q.trim()) return
    setLoading(true)
    setError('')
    setChartData(null)
    try {
      const res = await fetch('/api/chart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: q, bankId: selectedBanks[0] }),
      })
      const data = await res.json()
      if (data.error) setError(data.error)
      else setChartData(data)
    } catch {
      setError('Could not generate chart.')
    } finally {
      setLoading(false)
    }
  }

  async function exportPDF() {
    if (!chartRef.current) return
    const { default: html2canvas } = await import('html2canvas')
    const { jsPDF } = await import('jspdf')
    const canvas = await html2canvas(chartRef.current, { backgroundColor: '#0A1628' })
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [canvas.width, canvas.height] })
    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height)
    pdf.save('bank-comparison.pdf')
  }

  function toggleBank(id: number) {
    setSelectedBanks(prev => {
      if (prev.includes(id)) {
        if (prev.length <= 1) return prev
        return prev.filter(b => b !== id)
      }
      if (prev.length >= 6) return prev
      return [...prev, id]
    })
  }

  // Build comparison table rows
  const comparisonRows = [
    { label: 'Net Profit', key: 'net_profit', format: (v: number) => `JOD ${fmtJOD(v)}` },
    { label: 'Total Assets', key: 'total_assets', format: (v: number) => `JOD ${fmtJOD(v)}` },
    { label: 'Customer Deposits', key: 'total_deposits', format: (v: number) => `JOD ${fmtJOD(v)}` },
    { label: 'Net Loans', key: 'net_loans', format: (v: number) => `JOD ${fmtJOD(v)}` },
    { label: 'Return on Equity', key: 'roe', format: (v: number) => `${v?.toFixed(1)}%` },
    { label: 'Capital Ratio', key: 'car', format: (v: number) => `${v?.toFixed(1)}%` },
    { label: 'Bad Loan Ratio', key: 'npl_ratio', format: (v: number) => `${v?.toFixed(2)}%` },
  ]

  const latest2024 = (bankId: number) => financials[bankId]?.find(f => f.fiscal_year === 2024)

  return (
    <div className="min-h-screen bg-[#0A1628] text-white">
      <header className="border-b border-[#1E3450] px-6 py-4 flex items-center gap-4">
        <button onClick={() => router.push('/')} className="text-[#8B9AB0] hover:text-white text-[13px]">â Dashboard</button>
        <div className="w-px h-5 bg-[#1E3450]" />
        <div className="font-bold text-white">Compare Banks</div>
      </header>

      <div className="max-w-[1400px] mx-auto px-6 py-8 space-y-8">

        {/* Bank selector */}
        <div>
          <div className="text-[11px] uppercase tracking-wider text-[#8B9AB0] mb-3">
            Select banks to compare (up to 6)
          </div>
          <div className="flex flex-wrap gap-2">
            {BANKS.map(bank => (
              <button
                key={bank.id}
                onClick={() => toggleBank(bank.id)}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all border
                  ${selectedBanks.includes(bank.id)
                    ? 'bg-[#004D8F] text-white border-[#004D8F]'
                    : 'bg-transparent text-[#8B9AB0] border-[#1E3450] hover:border-[#004D8F]'
                  }`}
              >
                {bank.shortName}
              </button>
            ))}
          </div>
        </div>

        {/* AI Chart prompt */}
        <div className="bg-[#0F1E35] border border-[#1E3450] rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[#CEBA95]">â¡</span>
            <span className="font-semibold text-white">Generate a chart</span>
          </div>

          {/* Quick prompts */}
          <div className="flex flex-wrap gap-2 mb-4">
            {[
              'Compare net profit for 3 years',
              'Who has the highest return on equity?',
              'Compare home loan rates',
              'Compare credit card fees',
              'Total assets growth trend',
              'Who has the strongest capital ratio?',
            ].map(ex => (
              <button key={ex} onClick={() => setPrompt(ex)}
                className="text-[11px] px-3 py-1.5 rounded-full border border-[#1E3450]
                           text-[#8B9AB0] hover:border-[#CEBA95] hover:text-[#CEBA95] transition-colors">
                {ex}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex gap-3">
            <input
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="e.g. Compare deposit rates, Compare credit card fees, Who grew profits fastest?"
              className="flex-1 bg-[#0A1628] border border-[#1E3450] rounded-lg px-4 py-3
                         text-[13px] text-white placeholder-[#4A5568]
                         focus:outline-none focus:border-[#CEBA95] transition-colors"
            />
            <button type="submit" disabled={loading}
              className="bg-[#CEBA95] text-[#0A1628] font-semibold text-[13px]
                         px-6 py-3 rounded-lg hover:bg-[#D9CC9E] disabled:opacity-50 transition-colors">
              {loading ? 'Generating...' : 'Generate'}
            </button>
          </form>

          {error && <div className="mt-4 text-[#E05252] text-[13px]">{error}</div>}

          {chartData && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-[14px] font-semibold text-white">{chartData.title}</div>
                <button onClick={exportPDF}
                  className="text-[11px] px-3 py-1.5 rounded-lg border border-[#1E3450]
                             text-[#8B9AB0] hover:border-[#CEBA95] hover:text-[#CEBA95] transition-colors">
                  â Export PDF
                </button>
              </div>
              <div ref={chartRef} className="bg-[#0A1628] rounded-xl p-4">
                <ResponsiveContainer width="100%" height={320}>
                  {chartData.type === 'bar' ? (
                    <BarChart data={chartData.data}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1E3450" />
                      <XAxis dataKey="name" stroke="#8B9AB0" tick={{ fontSize: 11 }} />
                      <YAxis stroke="#8B9AB0" tick={{ fontSize: 11 }} />
                      <Tooltip contentStyle={{ backgroundColor: '#0F1E35', border: '1px solid #1E3450', borderRadius: 8 }}
                               labelStyle={{ color: '#CEBA95' }} itemStyle={{ color: '#fff' }} />
                      <Legend />
                      {chartData.series.map((s: string, i: number) => (
                        <Bar key={s} dataKey={s} fill={CHART_COLORS[i % CHART_COLORS.length]} radius={[4, 4, 0, 0]} />
                      ))}
                    </BarChart>
                  ) : (
                    <LineChart data={chartData.data}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1E3450" />
                      <XAxis dataKey="name" stroke="#8B9AB0" tick={{ fontSize: 11 }} />
                      <YAxis stroke="#8B9AB0" tick={{ fontSize: 11 }} />
                      <Tooltip contentStyle={{ backgroundColor: '#0F1E35', border: '1px solid #1E3450', borderRadius: 8 }}
                               labelStyle={{ color: '#CEBA95' }} itemStyle={{ color: '#fff' }} />
                      <Legend />
                      {chartData.series.map((s: string, i: number) => (
                        <Line key={s} type="monotone" dataKey={s}
                              stroke={CHART_COLORS[i % CHART_COLORS.length]}
                              strokeWidth={2} dot={{ r: 4 }} />
                      ))}
                    </LineChart>
                  )}
                </ResponsiveContainer>
                {chartData.insight && (
                  <div className="mt-4 p-3 bg-[#CEBA95]/10 border border-[#CEBA95]/20 rounded-lg text-[12px] text-[#CEBA95]">
                    ð¡ {chartData.insight}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Side-by-side table */}
        <div className="bg-[#0F1E35] border border-[#1E3450] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#1E3450]">
            <div className="text-[12px] uppercase tracking-wider text-[#8B9AB0]">
              FY2024 Side-by-side Comparison
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-[#1E3450]">
                  <th className="text-start px-5 py-3 text-[#8B9AB0] font-medium">Metric</th>
                  {selectedBanks.map(id => {
                    const bank = BANKS.find(b => b.id === id)!
                    return (
                      <th key={id} className="text-end px-5 py-3 font-medium">
                        <span className={bank.isHBTF ? 'text-[#CEBA95]' : 'text-white'}>
                          {bank.shortName}
                        </span>
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map(row => {
                  const values = selectedBanks.map(id => latest2024(id)?.[row.key])
                  const maxVal = Math.max(...values.filter(v => v != null) as number[])

                  return (
                    <tr key={row.key} className="border-b border-[#1E3450] hover:bg-[#132240] transition-colors">
                      <td className="px-5 py-3 text-[#8B9AB0]">{row.label}</td>
                      {selectedBanks.map((id, i) => {
                        const val = values[i]
                        const isMax = val === maxVal && val != null
                        return (
                          <td key={id} className={`px-5 py-3 text-end font-medium
                            ${isMax ? 'text-[#2ECC71]' : 'text-white'}`}>
                            {val != null ? row.format(val) : 'â'}
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ComparePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0A1628] flex items-center justify-center text-white">Loading...</div>}>
      <CompareContent />
    </Suspense>
  )
}
