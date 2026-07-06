'use client'
import HbFootprintMap from '../../components/HbFootprintMap';
// app/bank/[id]/page.tsx — Individual bank intelligence page

import { zadMdToHtml, ZAD_MD_CSS } from '@/lib/zad-md'
import { useState, useEffect, useRef } from 'react'
import { useLang } from '@/lib/LangContext'
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
let __cfIsAr = false
function fmtJOD(n: number | null | undefined, short = true): string {
  if (n == null) return '—'
  const v = n * 1000
  const A = __cfIsAr
  const c = A ? ' د.أ' : ''
  const p = A ? '' : 'JOD '
  if (short) {
    if (Math.abs(v) >= 1_000_000_000) return p + (v / 1_000_000_000).toFixed(2) + (A ? ' مليار' : 'B') + c
    if (Math.abs(v) >= 1_000_000) return p + (v / 1_000_000).toFixed(1) + (A ? ' مليون' : 'M') + c
    if (Math.abs(v) >= 1_000) return p + (v / 1_000).toFixed(0) + (A ? ' ألف' : 'K') + c
  }
  return p + v.toLocaleString() + c
}

function pct(n: number | null | undefined): string {
  if (n == null) return '—'
  return `${n.toFixed(1)}%`
}

function deltaColor(n: number | null | undefined): string {
  if (n == null) return 'text-[var(--cf-ink2)]'
  return n >= 0 ? 'text-[var(--cf-positive)]' : 'text-[var(--cf-negative)]'
}

function deltaSign(n: number | null | undefined): string {
  if (n == null) return ''
  return n >= 0 ? '↑' : '↓'
}

const CHART_COLORS = ['var(--cf-primary)', 'var(--cf-gold)', 'var(--cf-positive)', 'var(--cf-negative)', 'var(--cf-ink2)', 'var(--cf-gold)']

// ─── Section tabs ─────────────────────────────────────────────────────────────
const TAB_AR: Record<string, string> = { overview: 'نظرة عامة', financials: 'المالية', rates: 'الأسعار والعمولات', products: 'المنتجات', ownership: 'الملكية', governance: 'القيادة', news: 'الأخبار' }
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
  const { lang } = useLang()
  const isAr = lang === 'ar'
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [chartData, setChartData] = useState<any>(null)
  const [error, setError] = useState('')
  const chartRef = useRef<HTMLDivElement>(null)

  const examples = isAr ? [
    `اعرض اتجاه أرباح ${bankName} على مدى 3 سنوات`,
    `قارن رسوم بطاقات ائتمان ${bankName} مع ${bankName === 'HBTF' ? 'البنك العربي' : 'بنك الإسكان'}`,
    `ما هي أسعار الودائع التي يقدمها ${bankName}؟`,
    `تفصيل إيرادات ${bankName} حسب السنة`,
  ] : [
    `Show ${bankName} profit trend over 3 years`,
    `Compare ${bankName} credit card fees vs ${bankName === 'HBTF' ? 'Arab Bank' : 'Housing Bank'}`,
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
      setError((isAr ? 'تعذّر إنشاء الرسم البياني. حاول مرة أخرى.' : 'Could not generate chart. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  async function exportPDF() {
    if (!chartRef.current) return
    const { default: html2canvas } = await import('html2canvas')
    const { jsPDF } = await import('jspdf')
    const canvas = await html2canvas(chartRef.current, { backgroundColor: 'var(--cf-bg)' })
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [canvas.width, canvas.height] })
    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height)
    pdf.save(`${bankName}-chart.pdf`)
  }

  return (
    <div className="bg-[var(--cf-surface)] border border-[var(--cf-line)] rounded-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-[var(--cf-gold)] text-[18px]">⚡</span>
        <span className="font-semibold text-[var(--cf-ink)]">{isAr ? 'اسأل عن' : 'Ask about'} {bankName}</span>
      </div>

      {/* Example prompts */}
      <div className="flex flex-wrap gap-2 mb-4">
        {examples.map(ex => (
          <button
            key={ex}
            onClick={() => setPrompt(ex)}
            className="text-[11px] px-3 py-1.5 rounded-full border border-[var(--cf-line)]
                       text-[var(--cf-ink2)] hover:border-[var(--cf-gold)] hover:text-[var(--cf-gold)]
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
          placeholder={isAr ? ('مثال: "قارن أسعار قروض ' + bankName + ' مع متوسط السوق"') : ('e.g. "Compare ' + bankName + ' loan rates vs market average"')}
          className="flex-1 bg-[var(--cf-bg)] border border-[var(--cf-line)] rounded-lg px-4 py-3
                     text-[13px] text-[var(--cf-ink)] placeholder-[var(--cf-ink3)]
                     focus:outline-none focus:border-[var(--cf-gold)] transition-colors"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-[var(--cf-primary)] text-[var(--cf-bg)] font-semibold text-[13px]
                     px-5 py-3 rounded-lg hover:bg-[var(--cf-primary)] disabled:opacity-50
                     transition-colors whitespace-nowrap"
        >
          {loading ? (isAr ? 'جارٍ التفكير...' : 'Thinking...') : (isAr ? 'اسأل' : 'Ask')}
        </button>
      </form>

      {error && (
        <div className="mt-4 text-[var(--cf-negative)] text-[13px]">{error}</div>
      )}

      {chartData && chartData.kind === 'text' && (
        <div className="mt-6 p-4 rounded-xl bg-[var(--cf-surface2)] border border-[var(--cf-line)]">
          <div className="text-[11px] uppercase tracking-wider text-[var(--cf-ink3)] mb-2">{chartData.title}</div>
          <style dangerouslySetInnerHTML={{ __html: ZAD_MD_CSS }} />
          <div className="text-[13px]" dangerouslySetInnerHTML={{ __html: zadMdToHtml(chartData.text) }} />
        </div>
      )}
      {chartData && chartData.kind !== 'text' && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[14px] font-semibold text-[var(--cf-ink)]">{chartData.title}</div>
            <button
              onClick={exportPDF}
              className="text-[11px] px-3 py-1.5 rounded-lg border border-[var(--cf-line)]
                         text-[var(--cf-ink2)] hover:border-[var(--cf-gold)] hover:text-[var(--cf-gold)]
                         transition-colors flex items-center gap-1.5"
            >
              ↓ Export PDF
            </button>
          </div>
          <div ref={chartRef} className="bg-[var(--cf-bg)] rounded-xl p-4">
            <ResponsiveContainer width="100%" height={300}>
              {chartData.type === 'bar' ? (
                <BarChart data={chartData.data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--cf-line)" />
                  <XAxis dataKey="name" stroke="var(--cf-ink2)" tick={{ fontSize: 11 }} />
                  <YAxis stroke="var(--cf-ink2)" tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--cf-surface)', border: '1px solid var(--cf-line)', borderRadius: 8 }}
                    labelStyle={{ color: 'var(--cf-gold)' }}
                    itemStyle={{ color: 'var(--cf-ink)' }}
                  />
                  <Legend />
                  {chartData.series.map((s: string, i: number) => (
                    <Bar isAnimationActive={false} key={s} dataKey={s} fill={CHART_COLORS[i % CHART_COLORS.length]} radius={[4, 4, 0, 0]} />
                  ))}
                </BarChart>
              ) : (
                <LineChart data={chartData.data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--cf-line)" />
                  <XAxis dataKey="name" stroke="var(--cf-ink2)" tick={{ fontSize: 11 }} />
                  <YAxis stroke="var(--cf-ink2)" tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--cf-surface)', border: '1px solid var(--cf-line)', borderRadius: 8 }}
                    labelStyle={{ color: 'var(--cf-gold)' }}
                    itemStyle={{ color: 'var(--cf-ink)' }}
                  />
                  <Legend />
                  {chartData.series.map((s: string, i: number) => (
                    <Line isAnimationActive={false} key={s} type="monotone" dataKey={s}
                      stroke={CHART_COLORS[i % CHART_COLORS.length]}
                      strokeWidth={2} dot={{ r: 4 }} />
                  ))}
                </LineChart>
              )}
            </ResponsiveContainer>
            {chartData.insight && (
              <div className="mt-4 p-3 bg-[var(--cf-gold)]/10 border border-[var(--cf-gold)]/20 rounded-lg
                              text-[12px] text-[var(--cf-gold)]">
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
function LoanCalculator() {
  const { lang } = useLang()
  const isAr = lang === 'ar'
  const [amount, setAmount] = useState<number>(50000)
  const [rate, setRate] = useState<number>(7.5)
  const [years, setYears] = useState<number>(10)
  const n = Math.max(1, Math.round(years * 12))
  const r = rate / 100 / 12
  const monthly = r === 0 ? amount / n : (amount * r) / (1 - Math.pow(1 + r, -n))
  const total = monthly * n
  const interest = total - amount
  const money = (x: number) => 'JOD ' + Math.round(x).toLocaleString()
  const fieldStyle: any = { width: '100%', background: 'var(--cf-surface2)', border: '1px solid var(--cf-line)', borderRadius: '8px', padding: '9px 10px', color: 'var(--cf-ink)', fontSize: '14px', marginTop: '5px', outline: 'none', boxSizing: 'border-box' }
  const lblStyle: any = { fontSize: '10.5px', color: 'var(--cf-ink3)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }
  const outCard: any = { background: 'var(--cf-surface2)', borderRadius: '10px', padding: '12px 13px' }
  return (
    <div style={{ background: 'var(--cf-surface)', border: '1px solid var(--cf-line)', borderRadius: '14px', padding: '20px' }}>
      <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--cf-ink)', marginBottom: '2px' }}>{isAr ? 'حاسبة سداد القرض' : 'Loan Repayment Calculator'}</div>
      <div style={{ fontSize: '11px', color: 'var(--cf-ink3)', marginBottom: '16px' }}>{isAr ? 'قدّر أقساطك الشهرية — أدخل الفائدة المعروضة عليك' : 'Estimate monthly instalments — enter the rate quoted to you'}</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '18px' }}>
        <label><div style={lblStyle}>{isAr ? 'المبلغ (دينار)' : 'Amount (JOD)'}</div><input type="number" value={amount} onChange={(e: any) => setAmount(Math.max(0, Number(e.target.value)))} style={fieldStyle} /></label>
        <label><div style={lblStyle}>{isAr ? 'الفائدة (% سنوياً)' : 'Rate (% APR)'}</div><input type="number" step="0.1" value={rate} onChange={(e: any) => setRate(Math.max(0, Number(e.target.value)))} style={fieldStyle} /></label>
        <label><div style={lblStyle}>{isAr ? 'المدة (بالسنوات)' : 'Term (years)'}</div><input type="number" value={years} onChange={(e: any) => setYears(Math.max(1, Number(e.target.value)))} style={fieldStyle} /></label>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
        <div style={{ background: 'var(--cf-primary-soft)', borderRadius: '10px', padding: '12px 13px' }}>
          <div style={lblStyle}>{isAr ? 'القسط الشهري' : 'Monthly'}</div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--cf-primary-strong)', marginTop: '5px' }}>{money(monthly)}</div>
        </div>
        <div style={outCard}>
          <div style={lblStyle}>{isAr ? 'إجمالي الفوائد' : 'Total Interest'}</div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--cf-ink)', marginTop: '5px' }}>{money(interest)}</div>
        </div>
        <div style={outCard}>
          <div style={lblStyle}>{isAr ? 'إجمالي السداد' : 'Total Repayment'}</div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--cf-ink)', marginTop: '5px' }}>{money(total)}</div>
        </div>
      </div>
      <div style={{ fontSize: '10.5px', color: 'var(--cf-ink3)', marginTop: '14px', lineHeight: '1.5' }}>{isAr ? 'قرض تقريبي بالتناقص؛ الأسعار والرسوم وشروط الأهلية الفعلية يحددها البنك.' : 'Illustrative amortising loan. Actual rates, fees and eligibility are set by the bank.'}</div>
    </div>
  )
}

export default function BankPage() {
  const params = useParams()
  const router = useRouter()
  const bankId = parseInt(params.id as string)
  const bank = getBank(bankId)

  const [activeTab, setActiveTab] = useState('overview')
  const { lang } = useLang()
  const isAr = lang === 'ar'
  __cfIsAr = isAr
  const [imgError, setImgError] = useState(false)
  const [analystNote, setAnalystNote] = useState('')
  const [nameAr, setNameAr] = useState('')
  const [analystNoteAr, setAnalystNoteAr] = useState('')
  useEffect(() => { if (!bankId) return; supabase.from('banks').select('analyst_note, name_ar, analyst_note_ar').eq('id', bankId).single().then(({ data }: any) => { if (data && data.analyst_note) setAnalystNote(data.analyst_note); if (data && data.name_ar) setNameAr(data.name_ar); if (data && data.analyst_note_ar) setAnalystNoteAr(data.analyst_note_ar) }) }, [bankId])

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
        supabase.from('bank_board_members').select('*').eq('bank_id', bankId).order('fiscal_year', { ascending: false }).limit(30),
        supabase.from('bank_executives').select('*').eq('bank_id', bankId).order('fiscal_year', { ascending: false }).limit(40),
        supabase.from('bank_announcements').select('*').eq('bank_id', bankId).order('announcement_date', { ascending: false }).limit(15),
      ])
      setFinancials((fins.data || []).map(function (f: any) { if (String((f && f.currency) || '').toUpperCase() !== 'USD') return f; var g: any = Object.assign({}, f); ['total_assets','net_loans','customer_deposits','shareholders_equity','total_equity','paid_up_capital','net_interest_income','net_fee_income','total_income','operating_expenses','provision_expense','net_profit'].forEach(function (k) { if (g[k] != null) g[k] = Math.round(Number(g[k]) * 0.709) }); g._fx = 'USD to JOD @ 0.709'; return g }))
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

  if (!bank) return <div className="min-h-screen bg-[var(--cf-bg)] flex items-center justify-center text-[var(--cf-ink)]">{isAr ? 'البنك غير موجود' : 'Bank not found'}</div>

  // Latest + previous financials for delta
  // FX normalization happens once at fetch time (_fx mapper); render-time pass removed to prevent double USD->JOD conversion.
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
    agm: (isAr ? 'اجتماعات المساهمين' : 'Shareholder Meetings'),
    financial_results: (isAr ? 'النتائج المالية' : 'Financial Results'),
    dividend: (isAr ? 'توزيعات الأرباح' : 'Dividends'),
    rating: (isAr ? 'التصنيفات الائتمانية' : 'Credit Ratings'),
    leadership_change: (isAr ? 'تغييرات في القيادة' : 'Leadership Changes'),
    strategic: (isAr ? 'الاستراتيجية والشراكات' : 'Strategy & Partnerships'),
    product_launch: (isAr ? 'إطلاق المنتجات' : 'Product Launches'),
    regulation: (isAr ? 'تحديثات تنظيمية' : 'Regulatory Updates'),
    merger_acquisition: (isAr ? 'عمليات الاندماج والاستحواذ' : 'Mergers & Acquisitions'),
    other: (isAr ? 'أخرى' : 'Other'),
  }

  return (
    <div className="min-h-screen bg-[var(--cf-bg)] text-[var(--cf-ink)]">
      {/* ── Header ── */}
      <header className="border-b border-[var(--cf-line)] px-6 py-4">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/banks')}
              className="text-[var(--cf-ink2)] hover:text-[var(--cf-ink)] transition-colors text-[13px]"
            >
              {isAr ? '→ كل البنوك' : '← All banks'}
            </button>
            <div className="w-px h-5 bg-[var(--cf-line)]" />
            <div className="flex items-center gap-3">
              <div style={{ width:36, height:36, borderRadius:8, background:'var(--cf-surface2)', border:'1px solid var(--cf-line)', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', flexShrink:0 }}>
                {!imgError ? (
                  <img src={bank.logoUrl} alt={bank.name} style={{ width:28, height:28, objectFit:'contain' }}
                    onError={() => setImgError(true)} />
                ) : (
                  <span style={{ fontSize:10, fontWeight:700, color:'var(--cf-ink2)' }}>{bank.shortName.slice(0, 3)}</span>
                )}
                </div>
              <div>
                <div className="font-bold text-[var(--cf-ink)] text-[16px]">{isAr && nameAr ? nameAr : bank.name}</div>
                <div className="text-[11px] text-[var(--cf-ink2)]">
                  {bank.sector === 'islamic' ? (isAr ? 'بنك إسلامي' : 'Islamic Bank') : (isAr ? 'بنك تجاري' : 'Commercial Bank')} · {bank.ticker} · {isAr ? 'مدرج في بورصة عمّان' : 'ASE listed'}
                </div>
              </div>
              {bank.isHBTF && (
                <span className="text-[10px] font-semibold text-[var(--cf-gold)] bg-[var(--cf-gold)]/10
                                 border border-[var(--cf-gold)]/20 px-2 py-0.5 rounded-full">
                  {isAr ? 'بنكنا' : 'OUR BANK'}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => router.push(`/compare?bank=${bankId}`)}
            className="text-[12px] px-4 py-2 rounded-lg border border-[var(--cf-line)]
                       text-[var(--cf-ink2)] hover:border-[var(--cf-gold)] hover:text-[var(--cf-gold)] transition-colors"
          >
            {isAr ? 'قارن مع بنك آخر' : 'Compare with another bank'}
          </button>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-6 py-6">

        {/* ── Top KPIs ── */}
        {latest && (
          <div className="grid grid-cols-5 gap-4 mb-6">
            {[
              {
                label: (isAr ? 'صافي الربح' : 'Net Profit'),
                value: fmtJOD(latest.net_profit),
                delta: prev ? ((latest.net_profit - prev.net_profit) / Math.abs(prev.net_profit) * 100) : null,
                sub: `FY${latest.fiscal_year}`,
              },
              {
                label: (isAr ? 'إجمالي الأصول' : 'Total Assets'),
                value: fmtJOD(latest.total_assets),
                delta: prev ? ((latest.total_assets - prev.total_assets) / Math.abs(prev.total_assets) * 100) : null,
                sub: bank.id === 1 ? ('FY' + latest.fiscal_year + ' - group, USD converted @ 0.709') : ('FY' + latest.fiscal_year),
              },
              {
                label: (isAr ? 'العائد على حقوق الملكية' : 'Return on Equity'),
                value: pct(latest.roe),
                delta: prev ? (latest.roe - prev.roe) : null,
                sub: (isAr ? 'الربح مقابل حقوق المساهمين' : 'Profit vs shareholder equity'),
              },
              {
                label: (isAr ? 'نسبة رأس المال' : 'Capital Ratio'),
                value: pct(latest.car),
                delta: null,
                sub: (isAr ? 'الحد الأدنى المطلوب: 14%' : 'Min. required: 14%'),
              },
              {
                label: (isAr ? 'ربحية السهم' : 'Earnings Per Share'),
                value: latest.eps_fils ? (isAr ? `${latest.eps_fils} فلس` : `${latest.eps_fils} fils`) : '—',
                delta: prev?.eps_fils && latest.eps_fils != null ? ((latest.eps_fils - prev.eps_fils) / prev.eps_fils) * 100 : null,
                sub: latest.fiscal_year ? (isAr ? ('ربحية أساسية · ' + latest.fiscal_year) : ('FY' + latest.fiscal_year + ' basic EPS')) : (isAr ? 'ربحية أساسية' : 'Basic EPS'),
              },
            ].map(kpi => (
              <div key={kpi.label} className="bg-[var(--cf-surface)] border border-[var(--cf-line)] rounded-xl p-4">
                <div className="text-[10px] uppercase tracking-wider text-[var(--cf-ink2)] mb-2">{kpi.label}</div>
                <div className="text-[20px] font-bold text-[var(--cf-ink)]">{loading ? '...' : kpi.value}</div>
                {kpi.delta != null && (
                  <div className={`text-[11px] font-medium mt-1 ${deltaColor(kpi.delta)}`}>
                    {deltaSign(kpi.delta)} {Math.abs(kpi.delta).toFixed(1)}%{isAr ? ' مقابل العام السابق' : ' vs prior year'}
                  </div>
                )}
                <div className="text-[10px] text-[var(--cf-ink2)] mt-1">{kpi.sub}</div>
              </div>
            ))}
          </div>
        )}

        {/* ── Tab bar ── */}
        <div className="flex gap-1 border-b border-[var(--cf-line)] mb-6 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-[13px] font-medium whitespace-nowrap transition-colors border-b-2 -mb-px
                ${activeTab === tab.id
                  ? 'text-[var(--cf-ink)] border-[var(--cf-gold)]'
                  : 'text-[var(--cf-ink2)] border-transparent hover:text-[var(--cf-ink)]'
                }`}
            >
              {isAr ? (TAB_AR[tab.id] || tab.label) : tab.label}
            </button>
          ))}
        </div>

        {/* ── Tab content ── */}

        {/* OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">{bankId === 2 && <HbFootprintMap />}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px' }}>
              {(() => {
                const latest: any = financials[financials.length - 1] || {}
                const prev: any = financials[financials.length - 2] || {}
                const items: any[] = [
                  { label: (isAr ? 'إجمالي الأصول' : 'Total Assets'), v: latest.total_assets, p: prev.total_assets, kind: 'money' },
                  { label: (isAr ? 'ودائع العملاء' : 'Cust. Deposits'), v: latest.customer_deposits, p: prev.customer_deposits, kind: 'money' },
                  { label: (isAr ? 'صافي القروض' : 'Net Loans'), v: latest.net_loans, p: prev.net_loans, kind: 'money' },
                  { label: (isAr ? 'صافي الربح' : 'Net Profit'), v: latest.net_profit, p: prev.net_profit, kind: 'money' },
                  { label: 'ROE', v: latest.roe, p: prev.roe, kind: 'pct' },
                  { label: 'CAR', v: latest.car, p: prev.car, kind: 'pct' },
                ]
                return items.map((k: any, i: number) => {
                  const delta = (k.v != null && k.p != null && k.p !== 0) ? ((k.v - k.p) / Math.abs(k.p) * 100) : null
                  const valStr = k.v == null ? '—' : (k.kind === 'pct' ? (k.v + '%') : fmtJOD(k.v))
                  return (
                    <div key={i} style={{ background: 'var(--cf-surface)', border: '1px solid var(--cf-line)', borderRadius: '12px', padding: '14px 15px' }}>
                      <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--cf-ink3)', marginBottom: '7px', fontWeight: 600 }}>{k.label}</div>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--cf-ink)', letterSpacing: '-0.01em' }}>{valStr}</div>
                      {delta != null && (
                        <div style={{ fontSize: '11px', marginTop: '5px', fontWeight: 600, color: delta >= 0 ? 'var(--cf-positive)' : 'var(--cf-negative)' }}>{(delta >= 0 ? '\u25B2 ' : '\u25BC ') + Math.abs(delta).toFixed(1) + '% YoY'}</div>
                      )}
                    </div>
                  )
                })
              })()}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ background: 'var(--cf-surface)', border: '1px solid var(--cf-line)', borderRadius: '14px', padding: '20px' }}>
                <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--cf-ink)', marginBottom: '2px' }}>{isAr ? 'اتجاه الميزانية العمومية' : 'Balance Sheet Trend'}</div>
                <div style={{ fontSize: '11px', color: 'var(--cf-ink3)', marginBottom: '16px' }}>{(isAr ? 'مليار دينار، حسب السنة المالية' : 'JOD billions, by fiscal year') + ((financials || []).some(function (f: any) { return f._fx }) ? ' · converted from USD @ 0.709' : '')}</div>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={financials.map((f: any) => ({ name: 'FY' + f.fiscal_year, Assets: Number(((f.total_assets || 0) / 1000000).toFixed(2)), Deposits: Number(((f.customer_deposits || 0) / 1000000).toFixed(2)), Loans: (f.net_loans == null ? null : Number((f.net_loans / 1000000).toFixed(2))) }))} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--cf-line)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--cf-ink2)' }} axisLine={{ stroke: 'var(--cf-line)' }} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--cf-ink2)' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: 'var(--cf-surface)', border: '1px solid var(--cf-line)', borderRadius: '8px', fontSize: '12px', color: 'var(--cf-ink)' }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} formatter={(v: any) => isAr ? (({'Assets': 'الأصول', 'Liabilities': 'الالتزامات', 'Equity': 'حقوق الملكية', 'Total Assets': 'إجمالي الأصول', 'Customer Deposits': 'ودائع العملاء', 'Deposits': 'ودائع العملاء', 'Loans': 'القروض'} as Record<string, string>)[v] || v) : v} />
                    <Bar dataKey="Assets" fill="var(--cf-primary)" isAnimationActive={false} radius={[3, 3, 0, 0]} />
                    <Bar dataKey="Deposits" fill="var(--cf-teal)" isAnimationActive={false} radius={[3, 3, 0, 0]} />
                    <Bar dataKey="Loans" fill="var(--cf-iris)" isAnimationActive={false} radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: 'var(--cf-surface)', border: '1px solid var(--cf-line)', borderRadius: '14px', padding: '20px' }}>
                <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--cf-ink)', marginBottom: '2px' }}>{isAr ? 'اتجاه الربحية' : 'Profitability Trend'}</div>
                <div style={{ fontSize: '11px', color: 'var(--cf-ink3)', marginBottom: '16px' }}>{isAr ? 'العائد على حقوق الملكية والأصول + صافي هامش الفائدة (%)، حسب السنة المالية' : 'ROE, ROA + net interest margin (%), by fiscal year'}</div>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={financials.map((f: any) => ({ name: 'FY' + f.fiscal_year, ROE: f.roe, ROA: f.roa, NIM: f.net_interest_margin }))} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--cf-line)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--cf-ink2)' }} axisLine={{ stroke: 'var(--cf-line)' }} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--cf-ink2)' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: 'var(--cf-surface)', border: '1px solid var(--cf-line)', borderRadius: '8px', fontSize: '12px', color: 'var(--cf-ink)' }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="ROE" stroke="var(--cf-primary)" strokeWidth={2.5} dot={{ r: 3 }} isAnimationActive={false} />
                    <Line type="monotone" dataKey="ROA" stroke="var(--cf-teal)" strokeWidth={2.5} dot={{ r: 3 }} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ background: 'var(--cf-surface)', border: '1px solid var(--cf-line)', borderRadius: '14px', padding: '20px' }}>
                <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--cf-ink)', marginBottom: '2px' }}>{isAr ? 'أبرز النسب — آخر سنة مالية' : 'Key Ratios — Latest FY'}</div>
                <div style={{ fontSize: '11px', color: 'var(--cf-ink3)', marginBottom: '16px' }}>{isAr ? 'رأس المال والعوائد وجودة الأصول (%)' : 'Capital, returns and asset quality (%)'}</div>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart layout="vertical" data={(() => { const f: any = financials[financials.length - 1] || {}; return [{ name: 'CAR', value: f.car }, { name: isAr ? 'قروض/ودائع' : 'Loan/Deposit', value: f.loan_to_deposit }, { name: 'ROE', value: f.roe }, { name: 'ROA', value: f.roa }, { name: 'NPL', value: f.npl_ratio }].filter((x: any) => x.value != null) })()} margin={{ top: 4, right: 16, left: 20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--cf-line)" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--cf-ink2)' }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: 'var(--cf-ink2)' }} axisLine={false} tickLine={false} width={82} />
                    <Tooltip contentStyle={{ background: 'var(--cf-surface)', border: '1px solid var(--cf-line)', borderRadius: '8px', fontSize: '12px', color: 'var(--cf-ink)' }} />
                    <Bar dataKey="value" fill="var(--cf-primary)" isAnimationActive={false} radius={[0, 4, 4, 0]} barSize={16} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <LoanCalculator />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: bank && bank.description ? '1fr 1fr' : '1fr', gap: '16px' }}>
              {bank && bank.description && (
                <div style={{ background: 'var(--cf-surface)', border: '1px solid var(--cf-line)', borderRadius: '14px', padding: '20px' }}>
                  <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--cf-ink)', marginBottom: '12px' }}>{isAr ? 'نبذة عن ' : 'About '}{isAr && nameAr ? nameAr : (bank.name || 'the Bank')}</div>
                  <p style={{ fontSize: '13px', color: 'var(--cf-ink2)', lineHeight: '1.6', margin: 0 }}>{bank.description}</p>
                  {analystNote && (
                    <div style={{ marginTop: '14px', padding: '12px 14px', background: 'var(--cf-surface2)', borderRadius: '10px', borderInlineStart: '3px solid var(--cf-primary)' }}>
                      <div style={{ fontSize: '10px', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--cf-ink3)', marginBottom: '6px' }}>{isAr ? 'رؤية زاد' : 'ZAD Insight'}</div>
                      <p style={{ fontSize: '12.5px', color: 'var(--cf-ink2)', lineHeight: '1.65', margin: 0 }}>{isAr && analystNoteAr ? analystNoteAr : analystNote}</p>
                    </div>
                  )}
                  <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--cf-line)', display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: 'var(--cf-ink3)' }}>{isAr ? 'النوع' : 'Type'}</span>
                    <span style={{ color: 'var(--cf-ink)', fontWeight: 600 }}>{bank.sector === 'islamic' ? (isAr ? 'مصرفية إسلامية' : 'Islamic Banking') : (isAr ? 'مصرفية تجارية' : 'Commercial Banking')}</span>
                  </div>
                </div>
              )}
              {products && products.length > 0 && (
                <div style={{ background: 'var(--cf-surface)', border: '1px solid var(--cf-line)', borderRadius: '14px', padding: '20px' }}>
                  <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--cf-ink)', marginBottom: '2px' }}>{isAr ? 'محفظة المنتجات' : 'Product Portfolio'}</div>
                  <div style={{ fontSize: '11px', color: 'var(--cf-ink3)', marginBottom: '16px' }}>{isAr ? (products.length + ' منتج ضمن مختلف الفئات') : (products.length + ' products across categories')}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    {(() => {
                      const byCat: any = {}
                      products.forEach((p: any) => { const c = (p.category || 'other').replace(/_/g, ' '); byCat[c] = (byCat[c] || 0) + 1 })
                      return Object.keys(byCat).sort((a: any, b: any) => byCat[b] - byCat[a]).slice(0, 6).map((c: any, i: number) => (
                        <div key={i} onClick={() => { setActiveTab('products'); setTimeout(() => { const el = document.getElementById('cat-' + String(c).replace(/ /g, '_')); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }) }, 150) }} title="View products" style={{ background: 'var(--cf-surface2)', borderRadius: '10px', padding: '11px 13px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                          <span style={{ fontSize: '12px', color: 'var(--cf-ink2)', textTransform: 'capitalize' }}>{isAr ? (({'retail deposit':'ودائع الأفراد','retail card':'بطاقات الأفراد','retail loan':'قروض الأفراد','retail account':'حسابات الأفراد','retail investment':'استثمارات الأفراد','corporate loan':'قروض الشركات','corporate deposit':'ودائع الشركات','corporate account':'حسابات الشركات','corporate card':'بطاقات الشركات','sme loan':'قروض الشركات الصغيرة والمتوسطة','business loan':'قروض الأعمال','private banking':'الخدمات المصرفية الخاصة','digital':'الخدمات الرقمية','insurance':'التأمين','investment':'الاستثمار','other':'أخرى'} as Record<string, string>)[c] || c) : c}</span>
                          <span style={{ fontSize: '17px', fontWeight: 800, color: 'var(--cf-primary)' }}>{byCat[c]}</span>
                        </div>
                      ))
                    })()}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* FINANCIALS */}
        {activeTab === 'financials' && (
          <div className="space-y-6">
            {/* Year-over-year table */}
            <div className="bg-[var(--cf-surface)] border border-[var(--cf-line)] rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-[var(--cf-line)]">
                <div className="text-[12px] uppercase tracking-wider text-[var(--cf-ink2)]">{isAr ? 'مقارنة سنوية' : 'Year-over-year comparison'}</div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-[var(--cf-line)]">
                      <th className="text-start px-5 py-3 text-[var(--cf-ink2)] font-medium">{isAr ? 'المؤشر' : 'Metric'}</th>
                      {financials.map(f => (
                        <th key={f.fiscal_year} className="text-end px-5 py-3 text-[var(--cf-ink2)] font-medium">
                          FY{f.fiscal_year}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { label: (isAr ? 'صافي الربح' : 'Net Profit'), key: 'net_profit', format: fmtJOD },
                      { label: (isAr ? 'إجمالي الأصول' : 'Total Assets'), key: 'total_assets', format: fmtJOD },
                      { label: (isAr ? 'ودائع العملاء' : 'Customer Deposits'), key: 'customer_deposits', format: fmtJOD },
                      { label: (isAr ? 'القروض للعملاء' : 'Loans to Customers'), key: 'net_loans', format: fmtJOD },
                      { label: (isAr ? 'حقوق المساهمين' : 'Shareholders\' Equity'), key: 'total_equity', format: fmtJOD },
                      { label: (isAr ? 'العائد على حقوق الملكية' : 'Return on Equity'), key: 'roe', format: pct },
                      { label: (isAr ? 'العائد على الأصول' : 'Return on Assets'), key: 'roa', format: pct },
                      { label: (isAr ? 'نسبة كفاية رأس المال' : 'Capital Adequacy Ratio'), key: 'car', format: pct },
                      { label: (isAr ? 'نسبة القروض المتعثرة' : 'Bad Loan Ratio'), key: 'npl_ratio', format: pct },
                    ].map(row => (
                      <tr key={row.key} className="border-b border-[var(--cf-line)] hover:bg-[var(--cf-surface2)] transition-colors">
                        <td className="px-5 py-3 text-[var(--cf-ink2)]">{row.label}</td>
                        {financials.map(f => (
                          <td key={f.fiscal_year} className="px-5 py-3 text-end text-[var(--cf-ink)] font-medium">
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
            <div className="bg-[var(--cf-surface)] border border-[var(--cf-line)] rounded-xl p-5">
              <div className="text-[12px] uppercase tracking-wider text-[var(--cf-ink2)] mb-4">
                {isAr ? 'نمو الأصول والودائع (مليار دينار)' : 'Assets & Deposits Growth (JOD billions)'}
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={financials.map(f => ({
                  name: `FY${f.fiscal_year}`,
                  'Total Assets': Math.round((f.total_assets || 0) / 1_000_000),
                  'Customer Deposits': Math.round((f.customer_deposits || 0) / 1_000_000),
                  'Loans': (f.net_loans == null ? null : Math.round(f.net_loans / 1_000_000)),
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--cf-line)" />
                  <XAxis dataKey="name" stroke="var(--cf-ink2)" tick={{ fontSize: 11 }} />
                  <YAxis stroke="var(--cf-ink2)" tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--cf-surface)', border: '1px solid var(--cf-line)', borderRadius: 8 }}
                    labelStyle={{ color: 'var(--cf-gold)' }}
                    formatter={(v: any) => [`JOD ${v}M`]}
                  />
                  <Legend formatter={(v: any) => isAr ? (({'Assets': 'الأصول', 'Liabilities': 'الالتزامات', 'Equity': 'حقوق الملكية', 'Total Assets': 'إجمالي الأصول', 'Customer Deposits': 'ودائع العملاء', 'Deposits': 'ودائع العملاء', 'Loans': 'القروض'} as Record<string, string>)[v] || v) : v} />
                  <Bar isAnimationActive={false} dataKey="Total Assets" fill="var(--cf-primary)" radius={[3, 3, 0, 0]} />
                  <Bar isAnimationActive={false} dataKey="Customer Deposits" fill="var(--cf-gold)" radius={[3, 3, 0, 0]} />
                  <Bar isAnimationActive={false} dataKey="Loans" fill="var(--cf-positive)" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            
          </div>
        )}

        {/* RATES & FEES */}
        {activeTab === 'rates' && (
          <div className="space-y-6">
            {rates ? (
              <div className="grid grid-cols-2 gap-6">
                {/* Lending rates */}
                <div className="bg-[var(--cf-surface)] border border-[var(--cf-line)] rounded-xl p-5">
                  <div className="text-[12px] uppercase tracking-wider text-[var(--cf-ink2)] mb-4">{bank.sector === 'islamic' ? (isAr ? 'أسعار التمويل (مرابحة)' : 'Financing Rates (Murabaha)') : (isAr ? 'أسعار الفائدة على القروض' : 'Loan Interest Rates')}</div>
                  <div className="space-y-3">
                    {[
                      { label: (isAr ? 'قروض السكن' : 'Home Loans'), min: rates.home_loan_min, max: rates.home_loan_max },
                      { label: (isAr ? 'القروض الشخصية' : 'Personal Loans'), min: rates.personal_loan_min, max: rates.personal_loan_max },
                      { label: (isAr ? 'قروض السيارات' : 'Car Loans'), min: rates.car_loan_min, max: rates.car_loan_max },
                      { label: (isAr ? 'قروض الأعمال' : 'Business Loans'), min: rates.corporate_loan_min, max: rates.corporate_loan_max },
                    ].map(r => (
                      <div key={r.label} className="flex justify-between items-center py-2
                                                      border-b border-[var(--cf-line)] last:border-0">
                        <span className="text-[13px] text-[var(--cf-ink)]">{r.label}</span>
                        <span className="text-[13px] font-medium text-[var(--cf-ink)]">
                          {r.min && r.max ? `${r.min}% – ${r.max}%` :
                           r.min ? `From ${r.min}%` : '—'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Savings rates */}
                <div className="bg-[var(--cf-surface)] border border-[var(--cf-line)] rounded-xl p-5">
                  <div className="text-[12px] uppercase tracking-wider text-[var(--cf-ink2)] mb-4">{bank.sector === 'islamic' ? (isAr ? 'أسعار الأرباح المتوقعة (مضاربة)' : 'Expected Profit Rates (Mudaraba)') : (isAr ? 'أسعار الفائدة على الودائع' : 'Deposit Interest Rates')}</div>
                  <div className="space-y-3">
                    {[
                      { label: (isAr ? 'حساب التوفير' : 'Savings Account'), val: rates.saving_rate },
                      { label: (isAr ? 'وديعة لأجل شهر' : '1-Month Term Deposit'), val: rates.td_1m },
                      { label: (isAr ? 'وديعة لأجل 3 أشهر' : '3-Month Term Deposit'), val: rates.td_3m },
                      { label: (isAr ? 'وديعة لأجل 6 أشهر' : '6-Month Term Deposit'), val: rates.td_6m },
                      { label: (isAr ? 'وديعة لأجل 12 شهراً' : '12-Month Term Deposit'), val: rates.td_12m },
                    ].map(r => (
                      <div key={r.label} className="flex justify-between items-center py-2
                                                      border-b border-[var(--cf-line)] last:border-0">
                        <span className="text-[13px] text-[var(--cf-ink)]">{r.label}</span>
                        <span className="text-[13px] font-medium text-[var(--cf-ink)]">
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
              <div className="text-[var(--cf-ink2)] text-center py-12">{isAr ? 'لا تتوفر بيانات أسعار' : 'No rate data available'}</div>
            )}
            
          </div>
        )}

        {/* PRODUCTS */}
        {activeTab === 'products' && (
          <div className="space-y-4">
            {productCategories.map(cat => (
              <div key={cat} id={'cat-' + cat} className="bg-[var(--cf-surface)] border border-[var(--cf-line)] rounded-xl p-5">
                <div className="text-[12px] uppercase tracking-wider text-[var(--cf-ink2)] mb-4">{isAr ? (({'retail':'التجزئة','deposit':'الودائع','deposits':'الودائع','lending':'الإقراض','loans':'القروض','cards':'البطاقات','card':'البطاقات','corporate':'الشركات','sme':'الشركات الصغيرة والمتوسطة','wealth':'إدارة الثروات','digital':'الخدمات الرقمية','business':'الأعمال','personal':'الأفراد','savings':'التوفير','current':'الحسابات الجارية','financing':'التمويل','investment':'الاستثمار','insurance':'التأمين','islamic':'الإسلامية','treasury':'الخزينة','trade':'التجارة','other':'أخرى','retail_deposit':'ودائع الأفراد','retail_card':'بطاقات الأفراد','retail_loan':'قروض الأفراد','retail_account':'حسابات الأفراد','retail_investment':'استثمارات الأفراد','corporate_loan':'قروض الشركات','corporate_deposit':'ودائع الشركات','corporate_account':'حسابات الشركات','corporate_card':'بطاقات الشركات','sme_loan':'قروض الشركات الصغيرة والمتوسطة','business_loan':'قروض الأعمال','private_banking':'الخدمات المصرفية الخاصة'} as Record<string, string>)[cat.toLowerCase()] || cat.split('_').join(' ')) : cat.split('_').join(' ')}</div>
                <div className="grid grid-cols-2 gap-3">
                  {products.filter(p => p.category === cat).map((p, i) => (
                    <div key={i} className="p-3 rounded-lg bg-[var(--cf-bg)] border border-[var(--cf-line)]">
                      <div className="text-[13px] font-medium text-[var(--cf-ink)]">{isAr && p.product_name_ar ? p.product_name_ar : p.product_name_en}</div>
                      {p.description_en && (
                        <div className="text-[11px] text-[var(--cf-ink2)] mt-1 line-clamp-2">{isAr && p.description_ar ? p.description_ar : p.description_en}</div>
                      )}
                      {p.is_islamic && (
                        <span className="mt-2 inline-block text-[10px] text-[var(--cf-positive)] bg-[var(--cf-positive)]/10
                                         border border-[var(--cf-positive)]/20 px-2 py-0.5 rounded-full">
                          {isAr ? 'متوافق مع الشريعة' : 'Sharia-compliant'}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {products.length === 0 && (
              <div className="text-center py-12 text-[var(--cf-ink2)]">{isAr ? 'لا تتوفر بيانات منتجات' : 'No product data available'}</div>
            )}
          </div>
        )}

        {/* OWNERSHIP */}
        {activeTab === 'ownership' && (
          <div className="space-y-6">
            <div className="bg-[var(--cf-surface)] border border-[var(--cf-line)] rounded-xl p-5">
              <div className="text-[12px] uppercase tracking-wider text-[var(--cf-ink2)] mb-4">
                {isAr ? 'من يملك' : 'Who owns'} {isAr && nameAr ? nameAr : bank.shortName}
              </div>
              {ownership.length > 0 ? (
                <div className="space-y-3">
                  {ownership.map((o, i) => (
                    <div key={i}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[13px] text-[var(--cf-ink)]">{isAr && o.shareholder_name_ar ? o.shareholder_name_ar : o.shareholder_name_en}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-[11px] text-[var(--cf-ink2)]">{o.country || ''}</span>
                          <span className="text-[14px] font-bold text-[var(--cf-gold)]">
                            {o.ownership_pct != null ? `${o.ownership_pct.toFixed(2)}%` : (isAr ? 'مسيطر' : 'Controlling')}
                          </span>
                        </div>
                      </div>
                      {o.ownership_pct != null && (
                        <div className="h-1.5 bg-[var(--cf-line)] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.min(o.ownership_pct, 100)}%`,
                              backgroundColor: bank.primaryColor || 'var(--cf-primary)',
                            }}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-[var(--cf-ink2)] text-center py-8">{isAr ? 'لا تتوفر بيانات ملكية' : 'No ownership data available'}</div>
              )}
            </div>
          </div>
        )}

        {/* GOVERNANCE / LEADERSHIP */}
        {activeTab === 'governance' && (
          <div className="grid grid-cols-2 gap-6">
            {/* Executives */}
            <div className="bg-[var(--cf-surface)] border border-[var(--cf-line)] rounded-xl p-5">
              <div className="text-[12px] uppercase tracking-wider text-[var(--cf-ink2)] mb-4">{isAr ? 'الإدارة التنفيذية' : 'Executive Management'}</div>
              <div className="space-y-3">
                {executives.map((e, i) => (
                  <div key={i} className="flex items-start gap-3 py-2 border-b border-[var(--cf-line)] last:border-0">
                    <div className="w-8 h-8 rounded-full bg-[var(--cf-primary)]/20 border border-[var(--cf-primary)]/30
                                    flex items-center justify-center flex-shrink-0">
                      <span className="text-[11px] font-bold text-[var(--cf-primary)]">
                        {e.full_name_en?.split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
                      </span>
                    </div>
                    <div>
                      <div className="text-[13px] font-medium text-[var(--cf-ink)]">{isAr && e.full_name_ar ? e.full_name_ar : e.full_name_en}</div>
                      <div className="text-[11px] text-[var(--cf-ink2)]">{e.title_en}</div>
                    </div>
                  </div>
                ))}
                {executives.length === 0 && (
                  <div className="text-[var(--cf-ink2)] text-center py-6">{isAr ? 'لا تتوفر بيانات' : 'No data available'}</div>
                )}
              </div>
            </div>

            {/* Board */}
            <div className="bg-[var(--cf-surface)] border border-[var(--cf-line)] rounded-xl p-5">
              <div className="text-[12px] uppercase tracking-wider text-[var(--cf-ink2)] mb-4">{isAr ? 'مجلس الإدارة' : 'Board of Directors'}</div>
              <div className="space-y-3">
                {boardMembers.slice(0, 12).map((b, i) => (
                  <div key={i} className="flex items-start gap-3 py-2 border-b border-[var(--cf-line)] last:border-0">
                    <div className="w-8 h-8 rounded-full bg-[var(--cf-gold)]/10 border border-[var(--cf-gold)]/20
                                    flex items-center justify-center flex-shrink-0">
                      <span className="text-[11px] font-bold text-[var(--cf-gold)]">
                        {b.full_name_en?.split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
                      </span>
                    </div>
                    <div>
                      <div className="text-[13px] font-medium text-[var(--cf-ink)]">{isAr && b.full_name_ar ? b.full_name_ar : b.full_name_en}</div>
                      {b.notes && (
                        <div className="text-[10.5px] text-[var(--cf-gold)] mt-[1px]">{b.notes}</div>
                      )}
                      <div className="text-[11px] text-[var(--cf-ink2)]">
                        {b.role}
                        {b.is_independent && (
                          <span className="ml-2 text-[10px] text-[var(--cf-positive)] bg-[var(--cf-positive)]/10
                                           border border-[var(--cf-positive)]/20 px-1.5 py-0 rounded-full">
                            {isAr ? 'مستقل' : 'Independent'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {boardMembers.length === 0 && (
                  <div className="text-[var(--cf-ink2)] text-center py-6">{isAr ? 'لا تتوفر بيانات' : 'No data available'}</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* NEWS */}
        {activeTab === 'news' && (
          <div className="space-y-3">
            {announcements.map((a, i) => (
              <div key={i} className="bg-[var(--cf-surface)] border border-[var(--cf-line)] rounded-xl p-4 flex items-start gap-4">
                <div className="text-center flex-shrink-0 w-12">
                  <div className="text-[18px] font-bold text-[var(--cf-ink)]">
                    {new Date(a.announcement_date).getDate()}
                  </div>
                  <div className="text-[10px] text-[var(--cf-ink2)] uppercase">
                    {new Date(a.announcement_date).toLocaleDateString('en-GB', { month: 'short' })}
                  </div>
                  <div className="text-[10px] text-[var(--cf-ink2)]">
                    {new Date(a.announcement_date).getFullYear()}
                  </div>
                </div>
                <div className="w-px bg-[var(--cf-line)] self-stretch flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full
                      ${a.category === 'financial_results' ? 'bg-[var(--cf-primary)]/20 text-[var(--cf-primary)]' :
                        a.category === 'dividend' ? 'bg-[var(--cf-positive)]/20 text-[var(--cf-positive)]' :
                        a.category === 'agm' ? 'bg-[var(--cf-gold)]/20 text-[var(--cf-gold)]' :
                        a.category === 'leadership_change' ? 'bg-purple-500/20 text-purple-400' :
                        'bg-[var(--cf-line)] text-[var(--cf-ink2)]'}`}>
                      {catLabel[a.category] || a.category}
                    </span>
                    {a.fiscal_year && (
                      <span className="text-[10px] text-[var(--cf-ink2)]">FY{a.fiscal_year}</span>
                    )}
                  </div>
                  <div className="text-[14px] font-medium text-[var(--cf-ink)]">{isAr && a.headline_ar ? a.headline_ar : a.headline_en}</div>
                  {a.summary_en && (
                    <div className="text-[12px] text-[var(--cf-ink2)] mt-1.5 line-clamp-2">{isAr && a.summary_ar ? a.summary_ar : a.summary_en}</div>
                  )}
                </div>
                {a.source_url && (
                  <a href={a.source_url} target="_blank" rel="noopener"
                     className="text-[11px] text-[var(--cf-ink2)] hover:text-[var(--cf-gold)] transition-colors
                                flex-shrink-0 mt-0.5">
                    {isAr ? 'المصدر ←' : 'Source →'}
                  </a>
                )}
              </div>
            ))}
            {announcements.length === 0 && (
              <div className="text-center py-12 text-[var(--cf-ink2)]">{isAr ? 'لا تتوفر إعلانات' : 'No announcements available'}</div>
            )}
          </div>
        )}

        <ChartPrompt bankId={bankId} bankName={isAr && nameAr ? nameAr : bank.shortName} />
      </div>
    </div>
  )
}
