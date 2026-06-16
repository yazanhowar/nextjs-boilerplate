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

function useTheme() {
  const [dark, setDark] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    setDark(mq.matches)
    const handler = (e: MediaQueryListEvent) => setDark(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return dark
}

// DB values are stored in THOUSANDS. Arab Bank (id=1) = USD thousands, all others = JOD thousands.
const ARAB_BANK_ID = 1
const USD_TO_JOD = 0.71

function toJOD(n: number | null | undefined, bankId: number): number | null {
  if (n == null) return null
  if (bankId === ARAB_BANK_ID) return n * USD_TO_JOD
  return n
}

function fmtK(n: number | null | undefined, bankId?: number): string {
  if (n == null) return 'â'
  const jod = bankId != null ? toJOD(n, bankId) : n
  if (jod == null) return 'â'
  const abs = Math.abs(jod)
  if (abs >= 1_000_000) return `JOD ${(jod / 1_000_000).toFixed(2)}B`
  if (abs >= 1_000) return `JOD ${(jod / 1_000).toFixed(1)}M`
  return `JOD ${jod.toFixed(0)}K`
}

function pctDelta(curr: number, prev: number): number | null {
  if (!prev) return null
  return ((curr - prev) / Math.abs(prev)) * 100
}

export default function Dashboard() {
  const router = useRouter()
  const dark = useTheme()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'conventional' | 'islamic'>('all')
  const [financials, setFinancials] = useState<Record<number, any>>({})
  const [prevFinancials, setPrevFinancials] = useState<Record<number, any>>({})
  const [loading, setLoading] = useState(true)
  const [hovered, setHovered] = useState<number | null>(null)

  const t = {
    bg: dark ? '#0D0D0D' : '#F5F5F7',
    surface: dark ? '#1C1C1E' : '#FFFFFF',
    surfaceHover: dark ? '#2C2C2E' : '#F0F0F2',
    border: dark ? '#2C2C2E' : '#E5E5EA',
    text: dark ? '#FFFFFF' : '#1C1C1E',
    textSub: dark ? '#98989D' : '#6E6E73',
    textMuted: dark ? '#48484A' : '#AEAEB2',
    accent: '#0071E3',
    green: dark ? '#30D158' : '#28A745',
    red: dark ? '#FF453A' : '#DC3545',
    inputBg: dark ? '#2C2C2E' : '#FFFFFF',
  }

  useEffect(() => {
    async function load() {
      const [curr, prev] = await Promise.all([
        getSupabase().from('bank_financials').select('*').eq('fiscal_year', 2024),
        getSupabase().from('bank_financials').select('*').eq('fiscal_year', 2023),
      ])
      if (curr.data) {
        const m: Record<number, any> = {}
        curr.data.forEach((r: any) => { m[r.bank_id] = r })
        setFinancials(m)
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

  const jodBanks = BANKS.filter(b => b.id !== ARAB_BANK_ID)
  const totalAssetsJOD = jodBanks.reduce((sum, b) => sum + (financials[b.id]?.total_assets ?? 0), 0)
  const totalProfitJOD = jodBanks.reduce((sum, b) => sum + (financials[b.id]?.net_profit ?? 0), 0)
  const arabAssets = toJOD(financials[ARAB_BANK_ID]?.total_assets, ARAB_BANK_ID) ?? 0
  const arabProfit = toJOD(financials[ARAB_BANK_ID]?.net_profit, ARAB_BANK_ID) ?? 0
  const grandTotalAssets = totalAssetsJOD + arabAssets
  const grandTotalProfit = totalProfitJOD + arabProfit

  const roeValues = BANKS.map(b => financials[b.id]?.roe).filter(v => v != null) as number[]
  const avgROE = roeValues.length ? roeValues.reduce((a, b) => a + b, 0) / roeValues.length : null
  const carValues = BANKS.map(b => financials[b.id]?.car).filter(v => v != null) as number[]
  const avgCAR = carValues.length ? carValues.reduce((a, b) => a + b, 0) / carValues.length : null

  const filtered = BANKS.filter(b => {
    if (filter === 'conventional' && b.sector !== 'conventional') return false
    if (filter === 'islamic' && b.sector !== 'islamic') return false
    if (search && !b.name.toLowerCase().includes(search.toLowerCase()) &&
      !b.shortName.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div style={{ minHeight: '100vh', backgroundColor: t.bg, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: t.text }}>
      <header style={{ backgroundColor: dark ? 'rgba(13,13,13,0.8)' : 'rgba(245,245,247,0.8)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: `1px solid ${t.border}`, position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: t.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>HB</span>
            </div>
            <span style={{ fontWeight: 600, fontSize: 15, color: t.text }}>HBTF Intelligence</span>
            <span style={{ fontSize: 12, color: t.textMuted, marginLeft: 4 }}>Jordan Banking Sector</span>
          </div>
          <button onClick={() => router.push('/chat')} style={{ backgroundColor: t.accent, color: '#fff', border: 'none', borderRadius: 8, padding: '7px 16px', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
            Open AI Analyst â
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, color: t.text }}>Jordanian Banks</h1>
          <p style={{ fontSize: 14, color: t.textSub, margin: '6px 0 0' }}>FY2024 data Â· All figures in JOD unless noted</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 32 }}>
          {[
            { label: 'Sector Total Assets', value: fmtK(grandTotalAssets), sub: 'All 15 banks combined' },
            { label: 'Sector Net Profit', value: fmtK(grandTotalProfit), sub: 'FY2024' },
            { label: 'Avg ROE', value: avgROE != null ? `${avgROE.toFixed(1)}%` : 'â', sub: 'Return on equity' },
            { label: 'Avg CAR', value: avgCAR != null ? `${avgCAR.toFixed(1)}%` : 'â', sub: 'Capital adequacy' },
          ].map((kpi, i) => (
            <div key={i} style={{ backgroundColor: t.surface, borderRadius: 12, padding: '16px 18px', border: `1px solid ${t.border}` }}>
              <div style={{ fontSize: 11, color: t.textSub, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{kpi.label}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: t.text }}>{loading ? '...' : kpi.value}</div>
              <div style={{ fontSize: 11, color: t.textMuted, marginTop: 4 }}>{kpi.sub}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 24, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: t.textMuted, fontSize: 14 }}>ð</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search banks..." style={{ width: '100%', backgroundColor: t.inputBg, border: `1px solid ${t.border}`, borderRadius: 10, padding: '9px 12px 9px 34px', fontSize: 14, color: t.text, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['all', 'conventional', 'islamic'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{ padding: '8px 16px', borderRadius: 20, fontSize: 13, fontWeight: 500, cursor: 'pointer', backgroundColor: filter === f ? t.accent : t.surface, color: filter === f ? '#fff' : t.textSub, border: `1px solid ${filter === f ? t.accent : t.border}` }}>
                {f === 'all' ? 'All banks' : f === 'conventional' ? 'Commercial' : 'Islamic'}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          {filtered.map(bank => {
            const fin = financials[bank.id]
            const prev = prevFinancials[bank.id]
            const delta = fin?.net_profit && prev?.net_profit ? pctDelta(fin.net_profit, prev.net_profit) : null
            return (
              <BankCard key={bank.id} bank={bank} fin={fin} delta={delta} loading={loading} dark={dark} t={t}
                hovered={hovered === bank.id} onMouseEnter={() => setHovered(bank.id)} onMouseLeave={() => setHovered(null)}
                onClick={() => router.push(`/chat?bank=${bank.id}`)} />
            )
          })}
        </div>
        {filtered.length === 0 && <div style={{ textAlign: 'center', padding: '60px 0', color: t.textSub }}>No banks match your search.</div>}
      </main>
    </div>
  )
}

function BankCard({ bank, fin, delta, loading, dark, t, hovered, onMouseEnter, onMouseLeave, onClick }: any) {
  const [imgError, setImgError] = useState(false)
  return (
    <div onClick={onClick} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}
      style={{ backgroundColor: hovered ? t.surfaceHover : t.surface, border: `1px solid ${hovered ? t.accent + '44' : t.border}`, borderRadius: 14, padding: '20px', cursor: 'pointer', transition: 'all 0.15s ease', transform: hovered ? 'translateY(-2px)' : 'none', boxShadow: hovered ? `0 8px 24px ${dark ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.08)'}` : 'none' }}>
      {bank.isHBTF && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: t.accent, backgroundColor: t.accent + '18', padding: '2px 8px', borderRadius: 20, letterSpacing: '0.05em' }}>OUR BANK</span>
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: dark ? '#2C2C2E' : '#F5F5F7', border: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
          {!imgError
            ? <img src={`https://www.google.com/s2/favicons?domain=${bank.domain}&sz=64`} alt={bank.name} width={28} height={28} style={{ objectFit: 'contain' }} onError={() => setImgError(true)} />
            : <span style={{ fontSize: 11, fontWeight: 700, color: t.textSub }}>{bank.shortName.slice(0, 3).toUpperCase()}</span>
          }
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 15, color: t.text }}>{bank.name}</div>
          <div style={{ fontSize: 12, color: t.textSub, marginTop: 2 }}>{bank.sector === 'islamic' ? 'Islamic' : 'Commercial'} Â· {bank.ticker}</div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
        <div style={{ backgroundColor: dark ? '#2C2C2E' : '#F5F5F7', borderRadius: 10, padding: '12px 14px' }}>
          <div style={{ fontSize: 11, color: t.textSub, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Net Profit</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: t.text }}>{loading ? '...' : fmtK(fin?.net_profit, bank.id)}</div>
          {delta != null && !loading && <div style={{ fontSize: 11, color: delta >= 0 ? t.green : t.red, marginTop: 3, fontWeight: 500 }}>{delta >= 0 ? 'â' : 'â'} {Math.abs(delta).toFixed(1)}% vs 2023</div>}
        </div>
        <div style={{ backgroundColor: dark ? '#2C2C2E' : '#F5F5F7', borderRadius: 10, padding: '12px 14px' }}>
          <div style={{ fontSize: 11, color: t.textSub, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Assets</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: t.text }}>{loading ? '...' : fmtK(fin?.total_assets, bank.id)}</div>
          {fin?.roe != null && !loading && <div style={{ fontSize: 11, color: t.textSub, marginTop: 3 }}>ROE {fin.roe.toFixed(1)}%</div>}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, color: t.textSub }}>{bank.description.slice(0, 48)}...</span>
        <span style={{ backgroundColor: hovered ? t.accent : (dark ? '#2C2C2E' : '#F0F0F2'), color: hovered ? '#fff' : t.textSub, borderRadius: 8, padding: '5px 12px', fontSize: 12, fontWeight: 500, transition: 'all 0.15s ease', whiteSpace: 'nowrap', marginLeft: 8 }}>Ask AI â</span>
      </div>
    </div>
  )
}