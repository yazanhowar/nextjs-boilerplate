'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { BANKS } from '@/lib/banks-config'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

const ARAB_BANK_ID = 1
const USD_TO_JOD = 0.71

function toJOD(n: number | null | undefined, bankId: number): number | null {
  if (n == null) return null
  return bankId === ARAB_BANK_ID ? n * USD_TO_JOD : n
}

function fmtK(n: number | null | undefined, bankId?: number): string {
  if (n == null) return '—'
  const v = bankId != null ? toJOD(n, bankId) : n
  if (v == null) return '—'
  const abs = Math.abs(v)
  if (abs >= 1_000_000) return `JOD ${(v / 1_000_000).toFixed(2)}B`
  if (abs >= 1_000) return `JOD ${(v / 1_000).toFixed(1)}M`
  return `JOD ${v.toFixed(0)}K`
}

function pctDelta(curr: number, prev: number): number | null {
  if (!prev) return null
  return ((curr - prev) / Math.abs(prev)) * 100
}

function ThemeToggle({ dark, onToggle }: { dark: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{
        width: 36, height: 36, borderRadius: 8, border: `1px solid ${dark ? '#2C2C2E' : '#E2E8F0'}`,
        background: dark ? '#1C1C1E' : '#F8FAFC', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
        transition: 'all 0.15s',
      }}
    >
      {dark ? '☀️' : '🌙'}
    </button>
  )
}

export default function Dashboard() {
  const router = useRouter()
  const [dark, setDark] = useState(false)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'conventional' | 'islamic'>('all')
  const [financials, setFinancials] = useState<Record<number, any>>({})
  const [prevFinancials, setPrevFinancials] = useState<Record<number, any>>({})
  const [loading, setLoading] = useState(true)
  const [dataYear, setDataYear] = useState(2024)
  const [hovered, setHovered] = useState<number | null>(null)

  // Init theme from localStorage / system preference
  useEffect(() => {
    const stored = localStorage.getItem('hbtf-theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const isDark = stored === 'dark' || (!stored && prefersDark)
    setDark(isDark)
    document.documentElement.classList.toggle('dark', isDark)
  }, [])

  const toggleTheme = () => {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('hbtf-theme', next ? 'dark' : 'light')
  }

  // Color palette from CSS variables
  const t = {
    bg: dark ? '#0A1628' : '#F2F4F7',
    surface: dark ? '#0F1E35' : '#FFFFFF',
    surfaceHover: dark ? '#132240' : '#F0F4FA',
    border: dark ? '#1E3450' : '#DDE2EA',
    text: dark ? '#FFFFFF' : '#0F172A',
    textSub: dark ? '#8B9AB0' : '#4A5568',
    textMuted: dark ? '#4A5568' : '#94A3B8',
    accent: dark ? '#3B82F6' : '#004D8F',
    green: dark ? '#2ECC71' : '#16A34A',
    red: dark ? '#E05252' : '#DC2626',
    inputBg: dark ? '#0F1E35' : '#FFFFFF',
    pillBg: dark ? '#132240' : '#EEF2F7',
    shadow: dark ? 'none' : '0 1px 4px rgba(0,0,0,0.07)',
  }

  useEffect(() => {
    async function load() {
      const sb = getSupabase()
      // Try 2025 first, fall back to 2024
      const [r25, r24, rPrev] = await Promise.all([
        sb.from('bank_financials').select('*').eq('fiscal_year', 2025),
        sb.from('bank_financials').select('*').eq('fiscal_year', 2024),
        sb.from('bank_financials').select('*').eq('fiscal_year', 2023),
      ])
      
      // Use 2025 if available (>= 5 banks), else 2024
      const curr = (r25.data?.length ?? 0) >= 5 ? r25 : r24
      const prev = (r25.data?.length ?? 0) >= 5 ? r24 : rPrev
      const year = (r25.data?.length ?? 0) >= 5 ? 2025 : 2024
      
      if (curr.data) {
        const m: Record<number, any> = {}
        curr.data.forEach((r: any) => { m[r.bank_id] = r })
        setFinancials(m)
        setDataYear(year)
      }
      if (prev.data) {
        const m: Record<number, any> = {}
        prev.data.forEach((r: any) => { m[r.bank_id] = r })
        setPrevFinancials(m)
      }
      setLoading(false)
    }
    load()
  }, [])

  // Sector totals (JOD, exclude Arab Bank from sum since it's USD-denominated globally)
  const jodBanks = BANKS.filter(b => b.id !== ARAB_BANK_ID)
  const totalAssetsJOD = jodBanks.reduce((s, b) => s + (financials[b.id]?.total_assets ?? 0), 0)
  const totalProfitJOD = jodBanks.reduce((s, b) => s + (financials[b.id]?.net_profit ?? 0), 0)
  const arabAssets = toJOD(financials[ARAB_BANK_ID]?.total_assets, ARAB_BANK_ID) ?? 0
  const arabProfit = toJOD(financials[ARAB_BANK_ID]?.net_profit, ARAB_BANK_ID) ?? 0
  const grandAssets = totalAssetsJOD + arabAssets
  const grandProfit = totalProfitJOD + arabProfit

  const roeVals = BANKS.map(b => financials[b.id]?.roe).filter(Boolean) as number[]
  const avgROE = roeVals.length ? roeVals.reduce((a, b) => a + b, 0) / roeVals.length : null
  const carVals = BANKS.map(b => financials[b.id]?.car).filter(Boolean) as number[]
  const avgCAR = carVals.length ? carVals.reduce((a, b) => a + b, 0) / carVals.length : null

  const filtered = BANKS.filter(b => {
    if (filter === 'conventional' && b.sector !== 'conventional') return false
    if (filter === 'islamic' && b.sector !== 'islamic') return false
    if (search) {
      const q = search.toLowerCase()
      if (!b.name.toLowerCase().includes(q) && !b.shortName.toLowerCase().includes(q) && !b.ticker.toLowerCase().includes(q)) return false
    }
    return true
  })

  return (
    <div style={{ minHeight: '100vh', backgroundColor: t.bg, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: t.text }}>
      {/* Header */}
      <header style={{ backgroundColor: dark ? 'rgba(10,22,40,0.9)' : 'rgba(242,244,247,0.9)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: `1px solid ${t.border}`, position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: t.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>HB</span>
            </div>
            <span style={{ fontWeight: 600, fontSize: 15, color: t.text }}>HBTF Intelligence</span>
            <span style={{ fontSize: 12, color: t.textMuted, marginLeft: 4 }}>Jordan Banking Sector</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ThemeToggle dark={dark} onToggle={toggleTheme} />
            <button
              onClick={() => router.push('/chat')}
              style={{ backgroundColor: t.accent, color: '#fff', border: 'none', borderRadius: 8, padding: '7px 16px', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
            >
              Open AI Analyst
            </button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
        {/* Title */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, color: t.text }}>Jordanian Banks</h1>
          <p style={{ fontSize: 14, color: t.textSub, margin: '6px 0 0' }}>
            FY{dataYear} data &middot; All figures in JOD unless noted
          </p>
        </div>

        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 32 }}>
          {[
            { label: 'Sector Total Assets', value: fmtK(grandAssets), sub: 'All 15 banks combined' },
            { label: 'Sector Net Profit', value: fmtK(grandProfit), sub: `FY${dataYear}` },
            { label: 'Avg ROE', value: avgROE != null ? `${avgROE.toFixed(1)}%` : '—', sub: 'Return on equity' },
            { label: 'Avg CAR', value: avgCAR != null ? `${avgCAR.toFixed(1)}%` : '—', sub: 'Capital adequacy' },
          ].map((kpi, i) => (
            <div key={i} style={{ backgroundColor: t.surface, borderRadius: 12, padding: '16px 18px', border: `1px solid ${t.border}`, boxShadow: t.shadow }}>
              <div style={{ fontSize: 11, color: t.textSub, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{kpi.label}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: t.text }}>{loading ? '...' : kpi.value}</div>
              <div style={{ fontSize: 11, color: t.textMuted, marginTop: 4 }}>{kpi.sub}</div>
            </div>
          ))}
        </div>

        {/* Search + Filter */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: t.textMuted, fontSize: 14 }}>&#128269;</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search banks..."
              style={{ width: '100%', backgroundColor: t.inputBg, border: `1px solid ${t.border}`, borderRadius: 10, padding: '9px 12px 9px 34px', fontSize: 14, color: t.text, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['all', 'conventional', 'islamic'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{ padding: '8px 16px', borderRadius: 20, fontSize: 13, fontWeight: 500, cursor: 'pointer', backgroundColor: filter === f ? t.accent : t.surface, color: filter === f ? '#fff' : t.textSub, border: `1px solid ${filter === f ? t.accent : t.border}`, transition: 'all 0.15s' }}
              >
                {f === 'all' ? 'All banks' : f === 'conventional' ? 'Commercial' : 'Islamic'}
              </button>
            ))}
          </div>
        </div>

        {/* Bank Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          {filtered.map(bank => {
            const fin = financials[bank.id]
            const prev = prevFinancials[bank.id]
            const delta = fin?.net_profit && prev?.net_profit ? pctDelta(fin.net_profit, prev.net_profit) : null
            return (
              <BankCard
                key={bank.id}
                bank={bank}
                fin={fin}
                delta={delta}
                loading={loading}
                dark={dark}
                t={t}
                dataYear={dataYear}
                hovered={hovered === bank.id}
                onMouseEnter={() => setHovered(bank.id)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => router.push(`/chat?bank=${bank.id}`)}
              />
            )
          })}
        </div>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: t.textSub }}>No banks match your search.</div>
        )}
      </main>
    </div>
  )
}

function BankCard({ bank, fin, delta, loading, dark, t, dataYear, hovered, onMouseEnter, onMouseLeave, onClick }: any) {
  const [imgError, setImgError] = useState(false)
  const logoUrl = `https://www.google.com/s2/favicons?domain=${bank.domain}&sz=64`

  return (
    <div
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        backgroundColor: hovered ? t.surfaceHover : t.surface,
        border: `1px solid ${hovered ? t.accent + '55' : t.border}`,
        borderRadius: 14,
        padding: 20,
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        transform: hovered ? 'translateY(-2px)' : 'none',
        boxShadow: hovered ? `0 8px 24px ${dark ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.1)'}` : t.shadow,
      }}
    >
      {bank.isHBTF && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: t.accent, backgroundColor: t.accent + '18', padding: '2px 8px', borderRadius: 20, letterSpacing: '0.05em' }}>OUR BANK</span>
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: dark ? '#1E3450' : '#F0F4FA', border: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
          {!imgError
            ? <img src={logoUrl} alt={bank.name} width={28} height={28} style={{ objectFit: 'contain' }} onError={() => setImgError(true)} />
            : <span style={{ fontSize: 11, fontWeight: 700, color: t.textSub }}>{bank.shortName.slice(0, 3).toUpperCase()}</span>
          }
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 15, color: t.text }}>{bank.name}</div>
          <div style={{ fontSize: 12, color: t.textSub, marginTop: 2 }}>{bank.sector === 'islamic' ? 'Islamic' : 'Commercial'} &middot; {bank.ticker}</div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
        <div style={{ backgroundColor: dark ? '#132240' : '#F5F8FD', borderRadius: 10, padding: '12px 14px' }}>
          <div style={{ fontSize: 11, color: t.textSub, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Net Profit</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: t.text }}>{loading ? '...' : (fin ? fmtK(fin.net_profit, bank.id) : '—')}</div>
          {delta != null && !loading && (
            <div style={{ fontSize: 11, color: delta >= 0 ? t.green : t.red, marginTop: 3, fontWeight: 500 }}>
              {delta >= 0 ? '↑' : '↓'} {Math.abs(delta).toFixed(1)}% vs {dataYear - 1}
            </div>
          )}
        </div>
        <div style={{ backgroundColor: dark ? '#132240' : '#F5F8FD', borderRadius: 10, padding: '12px 14px' }}>
          <div style={{ fontSize: 11, color: t.textSub, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Assets</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: t.text }}>{loading ? '...' : (fin ? fmtK(fin.total_assets, bank.id) : '—')}</div>
          {fin?.roe != null && !loading && (
            <div style={{ fontSize: 11, color: t.textSub, marginTop: 3 }}>ROE {fin.roe.toFixed(1)}%</div>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, color: t.textSub }}>{bank.description.slice(0, 48)}...</span>
        <span style={{
          backgroundColor: hovered ? t.accent : (dark ? '#132240' : '#EEF2F7'),
          color: hovered ? '#fff' : t.textSub,
          borderRadius: 8, padding: '5px 12px', fontSize: 12, fontWeight: 500,
          transition: 'all 0.15s', whiteSpace: 'nowrap', marginLeft: 8,
        }}>
          Ask AI
        </span>
      </div>
    </div>
  )
}
