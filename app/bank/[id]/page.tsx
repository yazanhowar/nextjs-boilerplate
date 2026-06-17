'use client'
// app/bank/[id]/page.tsx — Individual bank intelligence page

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { BANKS, getBank } from '@/lib/banks-config'
import { createClient } from '@supabase/supabase-js'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, RadarChart, PolarGrid,
  PolarAngleAxis, Radar
} from 'recharts'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtJOD(n: number | null | undefined, short = true): string {
  if (n == null) return '—'
  // DB stores values in JOD thousands — multiply by 1000 to get actual JOD
  const v = n * 1000
  if (short) {
    if (Math.abs(v) >= 1_000_000_000) return `JOD ${(v / 1_000_000_000).toFixed(2)}B`
    if (Math.abs(v) >= 1_000_000) return `JOD ${(v / 1_000_000).toFixed(1)}M`
    if (Math.abs(v) >= 1_000) return `JOD ${(v / 1_000).toFixed(0)}K`
  }
  return `JOD ${v.toLocaleString()}`
}

function pct(n: number | null | undefined): string {
  if (n == null) return '—'
  return `${n.toFixed(1)}%`
}

function deltaColor(n: number | null | undefined): string {
  if (n == null) return 'text-[#9CA3AF]'
  return n >= 0 ? 'text-[#2ECC71]' : 'text-[#E05252]'
}

function deltaSign(n: number | null | undefined): string {
  if (n == null) return ''
  return n >= 0 ? '↑' : '↓'
}

const CHART_COLORS = ['#004D8F', '#CEBA95', '#2ECC71', '#E05252', '#9CA3AF', '#F39C12']

// ─── Section tabs ─────────────────────────────────────────────────────────────
const TABS = [
  { id: 'overview',     label: 'Overview' },
  { id: 'financials',   label: 'Financials' },
  { id: 'rates',        label: 'Rates & Fees' },
  { id: 'products',     label: 'Products' },
  { id: 'ownership',    label: 'Ownership' },
  { id: 'governance',   label: 'Leadership' },
  { id: 'news',         label: 'News' },
]

// ─── Chart prompt component ───────────────────────────────────────────────────
function ChartPrompt({ bankId, bankName }: { bankId: number; bankName: string }) {
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [chartData, setChartData] = useState<any>(null)
  const [error, setError] = useState('')
  const chartRef = useRef<HTMLDivElement>(null)

  const examples = [
    `Show ${bankName} profit trend over 3 years`,
    `Compare ${bankName} credit card fees vs Housing Bank`,
    `What deposit rates does ${bankName} offer?`,
    `${bankName} revenue breakdown by year`,
  ]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!prompt.trim()) return
    setLoading(true)
    setError('')
    setChartData(null)

    try {
      const res = await fetch('/api/chart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, bankId }),
      })
      const data = await res.json()
      if (data.error) setError(data.error)
      else setChartData(data)
    } catch {
      setError('Could not generate chart. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function exportPDF() {
    if (!chartRef.current) return
    const { default: html2canvas } = await import('html2canvas')
    const { jsPDF } = await import('jspdf')
    const canvas = await html2canvas(chartRef.current, { backgroundColor: '#1a1a1a' })
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [canvas.width, canvas.height] })
    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height)
    pdf.save(`${bankName}-chart.pdf`)
  }

  return (
    <div className="bg-[#242424] border border-[#383838] rounded-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-[#CEBA95] text-[18px]">⚡</span>
        <span className="font-semibold text-white">Ask about {bankName}</span>
      </div>

      {/* Example prompts */}
      <div className="flex flex-wrap gap-2 mb-4">
        {examples.map(ex => (
          <button
            key={ex}
            onClick={() => setPrompt(ex)}
            className="text-[11px] px-3 py-1.5 rounded-full border border-[#383838]
                       text-[#9CA3AF] hover:border-[#CEBA95] hover:text-[#CEBA95]
                       transition-colors"
          >
            {ex}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder={`e.g. "Compare ${bankName} loan rates vs market average"`}
          className="flex-1 bg-[#1a1a1a] border border-[#383838] rounded-lg px-4 py-3
                     text-[13px] text-white placeholder-[#4A5568]
                     focus:outline-none focus:border-[#CEBA95] transition-colors"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-[#CEBA95] text-[#0A1628] font-semibold text-[13px]
                     px-5 py-3 rounded-lg hover:bg-[#D9CC9E] disabled:opacity-50
                     transition-colors whitespace-nowrap"
        >
          {loading ? 'Generating...' : 'Generate chart'}
        </button>
      </form>

      {error && (
        <div className="mt-4 text-[#E05252] text-[13px]">{error}</div>
      )}

      {chartData && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[14px] font-semibold text-white">{chartData.title}</div>
            <button
              onClick={exportPDF}
              className="text-[11px] px-3 py-1.5 rounded-lg border border-[#383838]
                         text-[#9CA3AF] hover:border-[#CEBA95] hover:text-[#CEBA95]
                         transition-colors flex items-center gap-1.5"
            >
              ↓ Export PDF
            </button>
          </div>
          <div ref={chartRef} className="bg-[#1a1a1a] rounded-xl p-4">
            <ResponsiveContainer width="100%" height={300}>
              {chartData.type === 'bar' ? (
                <BarChart data={chartData.data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#383838" />
                  <XAxis dataKey="name" stroke="#9CA3AF" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#9CA3AF" tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#242424', border: '1px solid #383838', borderRadius: 8 }}
                    labelStyle={{ color: '#CEBA95' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Legend />
                  {chartData.series.map((s: string, i: number) => (
                    <Bar key={s} dataKey={s} fill={CHART_COLORS[i % CHART_COLORS.length]} radius={[4, 4, 0, 0]} />
                  ))}
                </BarChart>
              ) : (
                <LineChart data={chartData.data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#383838" />
                  <XAxis dataKey="name" stroke="#9CA3AF" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#9CA3AF" tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#242424', border: '1px solid #383838', borderRadius: 8 }}
                    labelStyle={{ color: '#CEBA95' }}
                    itemStyle={{ color: '#fff' }}
                  />
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
              <div className="mt-4 p-3 bg-[#CEBA95]/10 border border-[#CEBA95]/20 rounded-lg
                              text-[12px] text-[#CEBA95]">
                💡 {chartData.insight}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main bank page ───────────────────────────────────────────────────────────
export default function BankPage() {
  const params = useParams()
  const router = useRouter()
  const bankId = parseInt(params.id as string)
  const bank = getBank(bankId)

  const [activeTab, setActiveTab] = useState('overview')
  const [imgError, setImgError] = useState(false)

  // Data states
  const [financials, setFinancials] = useState<any[]>([])
  const [rates, setRates] = useState<any>(null)
  const [products, setProducts] = useState<any[]>([])
  const [ownership, setOwnership] = useState<any[]>([])
  const [boardMembers, setBoardMembers] = useState<any[]>([])
  const [executives, setExecutives] = useState<any[]>([])
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!bankId) return
    async function load() {
      const [fins, rts, prods, own, board, execs, news] = await Promise.all([
        supabase.from('bank_financials').select('*').eq('bank_id', bankId).order('fiscal_year', { ascending: true }),
        supabase.from('bank_rates').select('*').eq('bank_id', bankId).limit(1).single(),
        supabase.from('bank_products').select('*').eq('bank_id', bankId),
        supabase.from('bank_ownership').select('*').eq('bank_id', bankId).order('ownership_pct', { ascending: false }),
        supabase.from('bank_board_members').select('*').eq('bank_id', bankId).order('fiscal_year', { ascending: false }).limit(20),
        supabase.from('bank_executives').select('*').eq('bank_id', bankId).order('fiscal_year', { ascending: false }).limit(10),
        supabase.from('bank_announcements').select('*').eq('bank_id', bankId).order('announcement_date', { ascending: false }).limit(15),
      ])
      setFinancials(fins.data || [])
      setRates(rts.data || null)
      setProducts(prods.data || [])
      setOwnership(own.data || [])
      setBoardMembers(board.data || [])
      setExecutives(execs.data || [])
      setAnnouncements(news.data || [])
      setLoading(false)
    }
    load()
  }, [bankId])

  if (!bank) return <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center text-white">Bank not found</div>

  // Latest + previous financials for delta
  const latest = financials[financials.length - 1]
  const prev = financials[financials.length - 2]

  // Profit trend data for sparkline
  const profitTrend = financials.map(f => ({
    name: `FY${f.fiscal_year}`,
    'Net Profit': Math.round((f.net_profit || 0) / 1_000),
    'Total Assets': Math.round((f.total_assets || 0) / 1_000),
  }))

  // Product categories
  const productCategories = [...new Set(products.map(p => p.category))].filter(Boolean)

  // Category labels (plain English)
  const catLabel: Record<string, string> = {
    agm: 'Shareholder Meetings',
    financial_results: 'Financial Results',
    dividend: 'Dividends',
    rating: 'Credit Ratings',
    leadership_change: 'Leadership Changes',
    strategic: 'Strategy & Partnerships',
    product_launch: 'Product Launches',
    regulation: 'Regulatory Updates',
    merger_acquisition: 'Mergers & Acquisitions',
    other: 'Other',
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white">

      {/* ── Header ── */}
      <header className="border-b border-[#383838] px-6 py-4">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/')}
              className="text-[#9CA3AF] hover:text-white transition-colors text-[13px]"
            >
              ← All banks
            </button>
            <div className="w-px h-5 bg-[#383838]" />
            <div className="flex items-center gap-3">
              <div style={{ width:36, height:36, borderRadius:8, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', flexShrink:0 }}>
                {!imgError ? (
                  <img src={bank.logoUrl} alt={bank.name} style={{ width:28, height:28, objectFit:'contain' }}
                    onError={() => setImgError(true)} />
                ) : (
                  <span style={{ fontSize:10, fontWeight:700, color:'#9CA3AF' }}>{bank.shortName.slice(0, 3)}</span>
                )}
                </div>
              <div>
                <div className="font-bold text-white text-[16px]">{bank.name}</div>
                <div className="text-[11px] text-[#9CA3AF]">
                  {bank.sector === 'islamic' ? 'Islamic Bank' : 'Commercial Bank'} · {bank.ticker} · ASE listed
                </div>
              </div>
              {bank.isHBTF && (
                <span className="text-[10px] font-semibold text-[#CEBA95] bg-[#CEBA95]/10
                                 border border-[#CEBA95]/20 px-2 py-0.5 rounded-full">
                  OUR BANK
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => router.push(`/compare?bank=${bankId}`)}
            className="text-[12px] px-4 py-2 rounded-lg border border-[#383838]
                       text-[#9CA3AF] hover:border-[#CEBA95] hover:text-[#CEBA95] transition-colors"
          >
            Compare with another bank
          </button>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-6 py-6">

        {/* ── Top KPIs ── */}
        {latest && (
          <div className="grid grid-cols-5 gap-4 mb-6">
            {[
              {
                label: 'Net Profit',
                value: fmtJOD(latest.net_profit),
                delta: prev ? ((latest.net_profit - prev.net_profit) / Math.abs(prev.net_profit) * 100) : null,
                sub: `FY${latest.fiscal_year}`,
              },
              {
                label: 'Total Assets',
                value: fmtJOD(latest.total_assets),
                delta: prev ? ((latest.total_assets - prev.total_assets) / Math.abs(prev.total_assets) * 100) : null,
                sub: `FY${latest.fiscal_year}`,
              },
              {
                label: 'Return on Equity',
                value: pct(latest.roe),
                delta: prev ? (latest.roe - prev.roe) : null,
                sub: 'Profit vs shareholder equity',
              },
              {
                label: 'Capital Ratio',
                value: pct(latest.car),
                delta: null,
                sub: 'Min. required: 14%',
              },
              {
                label: 'Earnings Per Share',
                value: latest.eps_fils ? `${latest.eps_fils} fils` : '—',
                delta: prev?.eps_fils ? (latest.eps_fils - prev.eps_fils) : null,
                sub: 'FY2024 basic EPS',
              },
            ].map(kpi => (
              <div key={kpi.label} className="bg-[#242424] border border-[#383838] rounded-xl p-4">
                <div className="text-[10px] uppercase tracking-wider text-[#9CA3AF] mb-2">{kpi.label}</div>
                <div className="text-[20px] font-bold text-white">{loading ? '...' : kpi.value}</div>
                {kpi.delta != null && (
                  <div className={`text-[11px] font-medium mt-1 ${deltaColor(kpi.delta)}`}>
                    {deltaSign(kpi.delta)} {Math.abs(kpi.delta).toFixed(1)}% vs prior year
                  </div>
                )}
                <div className="text-[10px] text-[#6B7280] mt-1">{kpi.sub}</div>
              </div>
            ))}
          </div>
        )}

        {/* ── Tab bar ── */}
        <div className="flex gap-1 border-b border-[#383838] mb-6 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-[13px] font-medium whitespace-nowrap transition-colors border-b-2 -mb-px
                ${activeTab === tab.id
                  ? 'text-white border-[#CEBA95]'
                  : 'text-[#9CA3AF] border-transparent hover:text-white'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Tab content ── */}

        {/* OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-6">
              {/* About */}
              <div className="bg-[#242424] border border-[#383838] rounded-xl p-5">
                <div className="text-[12px] uppercase tracking-wider text-[#9CA3AF] mb-3">About</div>
                <p className="text-[13px] text-[#CBD5E0] leading-relaxed">{bank.description}</p>
                <div className="mt-4 pt-4 border-t border-[#383838] space-y-2">
                  <div className="flex justify-between text-[12px]">
                    <span className="text-[#9CA3AF]">Sector</span>
                    <span className="text-white">{bank.sector === 'islamic' ? 'Islamic Banking' : 'Commercial Banking'}</span>
                  </div>
                  <div className="flex justify-between text-[12px]">
                    <span className="text-[#9CA3AF]">Stock ticker</span>
                    <span className="text-white">{bank.ticker}</span>
                  </div>
                  <div className="flex justify-between text-[12px]">
                    <span className="text-[#9CA3AF]">Website</span>
                    <a href={`https://${bank.domain}`} target="_blank" rel="noopener"
                       className="text-[#004D8F] hover:text-[#CEBA95] transition-colors">
                      {bank.domain}
                    </a>
                  </div>
                </div>
              </div>

              {/* 3-year profit chart */}
              <div className="col-span-2 bg-[#242424] border border-[#383838] rounded-xl p-5">
                <div className="text-[12px] uppercase tracking-wider text-[#9CA3AF] mb-4">
                  Net Profit (JOD millions) — 3-year trend
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={profitTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#383838" />
                    <XAxis dataKey="name" stroke="#9CA3AF" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#9CA3AF" tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#242424', border: '1px solid #383838', borderRadius: 8 }}
                      labelStyle={{ color: '#CEBA95' }}
                      itemStyle={{ color: '#fff' }}
                      formatter={(v: any) => [`JOD ${v}M`, 'Net Profit']}
                    />
                    <Line type="monotone" dataKey="Net Profit"
                      stroke="#CEBA95" strokeWidth={2.5}
                      dot={{ fill: '#CEBA95', r: 5 }}
                      activeDot={{ r: 7 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* AI Chart prompt */}
            <ChartPrompt bankId={bankId} bankName={bank.shortName} />

            {/* Recent news */}
            {announcements.length > 0 && (
              <div className="bg-[#242424] border border-[#383838] rounded-xl p-5">
                <div className="text-[12px] uppercase tracking-wider text-[#9CA3AF] mb-4">Recent announcements</div>
                <div className="space-y-3">
                  {announcements.slice(0, 5).map((a, i) => (
                    <div key={i} className="flex items-start gap-3 py-2 border-b border-[#383838] last:border-0">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full mt-0.5 whitespace-nowrap
                        ${a.category === 'financial_results' ? 'bg-[#004D8F]/20 text-[#60A5FA]' :
                          a.category === 'dividend' ? 'bg-[#2ECC71]/20 text-[#2ECC71]' :
                          a.category === 'leadership_change' ? 'bg-[#CEBA95]/20 text-[#CEBA95]' :
                          'bg-[#383838] text-[#9CA3AF]'}`}>
                        {catLabel[a.category] || a.category}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] text-white truncate">{a.headline_en}</div>
                        <div className="text-[11px] text-[#9CA3AF] mt-0.5">
                          {new Date(a.announcement_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* FINANCIALS */}
        {activeTab === 'financials' && (
          <div className="space-y-6">
            {/* Year-over-year table */}
            <div className="bg-[#242424] border border-[#383838] rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-[#383838]">
                <div className="text-[12px] uppercase tracking-wider text-[#9CA3AF]">Year-over-year comparison</div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-[#383838]">
                      <th className="text-start px-5 py-3 text-[#9CA3AF] font-medium">Metric</th>
                      {financials.map(f => (
                        <th key={f.fiscal_year} className="text-end px-5 py-3 text-[#9CA3AF] font-medium">
                          FY{f.fiscal_year}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { label: 'Net Profit', key: 'net_profit', format: fmtJOD },
                      { label: 'Total Assets', key: 'total_assets', format: fmtJOD },
                      { label: 'Customer Deposits', key: 'customer_deposits', format: fmtJOD },
                      { label: 'Loans to Customers', key: 'net_loans', format: fmtJOD },
                      { label: 'Shareholders\' Equity', key: 'total_equity', format: fmtJOD },
                      { label: 'Return on Equity', key: 'roe', format: pct },
                      { label: 'Return on Assets', key: 'roa', format: pct },
                      { label: 'Capital Adequacy Ratio', key: 'car', format: pct },
                      { label: 'Bad Loan Ratio', key: 'npl_ratio', format: pct },
                    ].map(row => (
                      <tr key={row.key} className="border-b border-[#383838] hover:bg-[#2a2a2a] transition-colors">
                        <td className="px-5 py-3 text-[#9CA3AF]">{row.label}</td>
                        {financials.map(f => (
                          <td key={f.fiscal_year} className="px-5 py-3 text-end text-white font-medium">
                            {row.format(f[row.key])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Assets vs Deposits chart */}
            <div className="bg-[#242424] border border-[#383838] rounded-xl p-5">
              <div className="text-[12px] uppercase tracking-wider text-[#9CA3AF] mb-4">
                Assets & Deposits Growth (JOD millions)
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={financials.map(f => ({
                  name: `FY${f.fiscal_year}`,
                  'Total Assets': Math.round((f.total_assets || 0) / 1_000_000),
                  'Customer Deposits': Math.round((f.customer_deposits || 0) / 1_000_000),
                  'Loans': Math.round((f.net_loans || 0) / 1_000_000),
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#383838" />
                  <XAxis dataKey="name" stroke="#9CA3AF" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#9CA3AF" tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#242424', border: '1px solid #383838', borderRadius: 8 }}
                    labelStyle={{ color: '#CEBA95' }}
                    formatter={(v: any) => [`JOD ${v}M`]}
                  />
                  <Legend />
                  <Bar dataKey="Total Assets" fill="#004D8F" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="Customer Deposits" fill="#CEBA95" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="Loans" fill="#2ECC71" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <ChartPrompt bankId={bankId} bankName={bank.shortName} />
          </div>
        )}

        {/* RATES & FEES */}
        {activeTab === 'rates' && (
          <div className="space-y-6">
            {rates ? (
              <div className="grid grid-cols-2 gap-6">
                {/* Lending rates */}
                <div className="bg-[#242424] border border-[#383838] rounded-xl p-5">
                  <div className="text-[12px] uppercase tracking-wider text-[#9CA3AF] mb-4">Loan Interest Rates</div>
                  <div className="space-y-3">
                    {[
                      { label: 'Home Loans', min: rates.home_loan_min, max: rates.home_loan_max },
                      { label: 'Personal Loans', min: rates.personal_loan_min, max: rates.personal_loan_max },
                      { label: 'Car Loans', min: rates.car_loan_min, max: rates.car_loan_max },
                      { label: 'Business Loans', min: rates.corporate_loan_min, max: rates.corporate_loan_max },
                    ].map(r => (
                      <div key={r.label} className="flex justify-between items-center py-2
                                                      border-b border-[#383838] last:border-0">
                        <span className="text-[13px] text-[#CBD5E0]">{r.label}</span>
                        <span className="text-[13px] font-medium text-white">
                          {r.min && r.max ? `${r.min}% – ${r.max}%` :
                           r.min ? `From ${r.min}%` : '—'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Savings rates */}
                <div className="bg-[#242424] border border-[#383838] rounded-xl p-5">
                  <div className="text-[12px] uppercase tracking-wider text-[#9CA3AF] mb-4">Deposit Interest Rates</div>
                  <div className="space-y-3">
                    {[
                      { label: 'Savings Account', val: rates.saving_rate },
                      { label: '1-Month Term Deposit', val: rates.td_1m },
                      { label: '3-Month Term Deposit', val: rates.td_3m },
                      { label: '6-Month Term Deposit', val: rates.td_6m },
                      { label: '12-Month Term Deposit', val: rates.td_12m },
                    ].map(r => (
                      <div key={r.label} className="flex justify-between items-center py-2
                                                      border-b border-[#383838] last:border-0">
                        <span className="text-[13px] text-[#CBD5E0]">{r.label}</span>
                        <span className="text-[13px] font-medium text-white">
                          {r.val != null ? `${r.val}%` : '—'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Fees */}
                {/* tariffs would go here */}
              </div>
            ) : (
              <div className="text-[#9CA3AF] text-center py-12">No rate data available</div>
            )}
            <ChartPrompt bankId={bankId} bankName={bank.shortName} />
          </div>
        )}

        {/* PRODUCTS */}
        {activeTab === 'products' && (
          <div className="space-y-4">
            {productCategories.map(cat => (
              <div key={cat} className="bg-[#242424] border border-[#383838] rounded-xl p-5">
                <div className="text-[12px] uppercase tracking-wider text-[#9CA3AF] mb-4">{cat}</div>
                <div className="grid grid-cols-2 gap-3">
                  {products.filter(p => p.category === cat).map((p, i) => (
                    <div key={i} className="p-3 rounded-lg bg-[#1a1a1a] border border-[#383838]">
                      <div className="text-[13px] font-medium text-white">{p.product_name_en}</div>
                      {p.description_en && (
                        <div className="text-[11px] text-[#9CA3AF] mt-1 line-clamp-2">{p.description_en}</div>
                      )}
                      {p.is_islamic && (
                        <span className="mt-2 inline-block text-[10px] text-[#2ECC71] bg-[#2ECC71]/10
                                         border border-[#2ECC71]/20 px-2 py-0.5 rounded-full">
                          Sharia-compliant
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {products.length === 0 && (
              <div className="text-center py-12 text-[#9CA3AF]">No product data available</div>
            )}
          </div>
        )}

        {/* OWNERSHIP */}
        {activeTab === 'ownership' && (
          <div className="space-y-6">
            <div className="bg-[#242424] border border-[#383838] rounded-xl p-5">
              <div className="text-[12px] uppercase tracking-wider text-[#9CA3AF] mb-4">
                Who owns {bank.shortName}
              </div>
              {ownership.length > 0 ? (
                <div className="space-y-3">
                  {ownership.map((o, i) => (
                    <div key={i}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[13px] text-white">{o.shareholder_name_en}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-[11px] text-[#9CA3AF]">{o.country || ''}</span>
                          <span className="text-[14px] font-bold text-[#CEBA95]">
                            {o.ownership_pct != null ? `${o.ownership_pct.toFixed(2)}%` : 'Controlling'}
                          </span>
                        </div>
                      </div>
                      {o.ownership_pct != null && (
                        <div className="h-1.5 bg-[#383838] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.min(o.ownership_pct, 100)}%`,
                              backgroundColor: bank.primaryColor || '#004D8F',
                            }}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-[#9CA3AF] text-center py-8">No ownership data available</div>
              )}
            </div>
          </div>
        )}

        {/* GOVERNANCE / LEADERSHIP */}
        {activeTab === 'governance' && (
          <div className="grid grid-cols-2 gap-6">
            {/* Executives */}
            <div className="bg-[#242424] border border-[#383838] rounded-xl p-5">
              <div className="text-[12px] uppercase tracking-wider text-[#9CA3AF] mb-4">Executive Management</div>
              <div className="space-y-3">
                {executives.slice(0, 8).map((e, i) => (
                  <div key={i} className="flex items-start gap-3 py-2 border-b border-[#383838] last:border-0">
                    <div className="w-8 h-8 rounded-full bg-[#004D8F]/20 border border-[#004D8F]/30
                                    flex items-center justify-center flex-shrink-0">
                      <span className="text-[11px] font-bold text-[#004D8F]">
                        {e.full_name_en?.split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
                      </span>
                    </div>
                    <div>
                      <div className="text-[13px] font-medium text-white">{e.full_name_en}</div>
                      <div className="text-[11px] text-[#9CA3AF]">{e.title_en}</div>
                    </div>
                  </div>
                ))}
                {executives.length === 0 && (
                  <div className="text-[#9CA3AF] text-center py-6">No data available</div>
                )}
              </div>
            </div>

            {/* Board */}
            <div className="bg-[#242424] border border-[#383838] rounded-xl p-5">
              <div className="text-[12px] uppercase tracking-wider text-[#9CA3AF] mb-4">Board of Directors</div>
              <div className="space-y-3">
                {boardMembers.slice(0, 12).map((b, i) => (
                  <div key={i} className="flex items-start gap-3 py-2 border-b border-[#383838] last:border-0">
                    <div className="w-8 h-8 rounded-full bg-[#CEBA95]/10 border border-[#CEBA95]/20
                                    flex items-center justify-center flex-shrink-0">
                      <span className="text-[11px] font-bold text-[#CEBA95]">
                        {b.full_name_en?.split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
                      </span>
                    </div>
                    <div>
                      <div className="text-[13px] font-medium text-white">{b.full_name_en}</div>
                      <div className="text-[11px] text-[#9CA3AF]">
                        {b.role}
                        {b.is_independent && (
                          <span className="ml-2 text-[10px] text-[#2ECC71] bg-[#2ECC71]/10
                                           border border-[#2ECC71]/20 px-1.5 py-0 rounded-full">
                            Independent
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {boardMembers.length === 0 && (
                  <div className="text-[#9CA3AF] text-center py-6">No data available</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* NEWS */}
        {activeTab === 'news' && (
          <div className="space-y-3">
            {announcements.map((a, i) => (
              <div key={i} className="bg-[#242424] border border-[#383838] rounded-xl p-4 flex items-start gap-4">
                <div className="text-center flex-shrink-0 w-12">
                  <div className="text-[18px] font-bold text-white">
                    {new Date(a.announcement_date).getDate()}
                  </div>
                  <div className="text-[10px] text-[#9CA3AF] uppercase">
                    {new Date(a.announcement_date).toLocaleDateString('en-GB', { month: 'short' })}
                  </div>
                  <div className="text-[10px] text-[#6B7280]">
                    {new Date(a.announcement_date).getFullYear()}
                  </div>
                </div>
                <div className="w-px bg-[#383838] self-stretch flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full
                      ${a.category === 'financial_results' ? 'bg-[#004D8F]/20 text-[#60A5FA]' :
                        a.category === 'dividend' ? 'bg-[#2ECC71]/20 text-[#2ECC71]' :
                        a.category === 'agm' ? 'bg-[#CEBA95]/20 text-[#CEBA95]' :
                        a.category === 'leadership_change' ? 'bg-purple-500/20 text-purple-400' :
                        'bg-[#383838] text-[#9CA3AF]'}`}>
                      {catLabel[a.category] || a.category}
                    </span>
                    {a.fiscal_year && (
                      <span className="text-[10px] text-[#6B7280]">FY{a.fiscal_year}</span>
                    )}
                  </div>
                  <div className="text-[14px] font-medium text-white">{a.headline_en}</div>
                  {a.summary_en && (
                    <div className="text-[12px] text-[#9CA3AF] mt-1.5 line-clamp-2">{a.summary_en}</div>
                  )}
                </div>
                {a.source_url && (
                  <a href={a.source_url} target="_blank" rel="noopener"
                     className="text-[11px] text-[#9CA3AF] hover:text-[#CEBA95] transition-colors
                                flex-shrink-0 mt-0.5">
                    Source →
                  </a>
                )}
              </div>
            ))}
            {announcements.length === 0 && (
              <div className="text-center py-12 text-[#9CA3AF]">No announcements available</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
