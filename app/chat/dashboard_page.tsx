'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { BANKS } from '@/lib/banks-config'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

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

function fmtM(n: number | null | undefined): string {
  if (n == null) return '—'
  if (Math.abs(n) >= 1_000_000_000) return `JOD ${(n / 1_000_000_000).toFixed(2)}B`
  if (Math.abs(n) >= 1_000_000) return `JOD ${(n / 1_000_000).toFixed(0)}M`
  if (Math.abs(n) >= 1_000) return `JOD ${(n / 1_000).toFixed(0)}K`
  return `JOD ${n}`
}

function pctDelta(curr: number, prev: number) {
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

  // ── Theme tokens ────────────────────────────────────────────────────────────
  const t = {
    bg: dark ? '#0D0D0D' : '#F5F5F7',
    surface: dark ? '#1C1C1E' : '#FFFFFF',
    surfaceHover: dark ? '#2C2C2E' : '#F0F0F2',
    border: dark ? '#2C2C2E' : '#E5E5EA',
    text: dark ? '#FFFFFF' : '#1C1C1E',
    textSub: dark ? '#98989D' : '#6E6E73',
    textMuted: dark ? '#48484A' : '#AEAEB2',
    accent: '#0071E3',
    accentText: '#FFFFFF',
    gold: '#B8860B',
    green: dark ? '#30D158' : '#28A745',
    red: dark ? '#FF453A' : '#DC3545',
    hbtfBadgeBg: dark ? 'rgba(0,113,227,0.15)' : 'rgba(0,113,227,0.08)',
    hbtfBadgeText: '#0071E3',
    pillActive: dark ? '#0071E3' : '#0071E3',
    pillInactive: dark ? '#2C2C2E' : '#E5E5EA',
    pillInactiveText: dark ? '#98989D' : '#6E6E73',
    inputBg: dark ? '#2C2C2E' : '#FFFFFF',
    shadow: dark ? 'none' : '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
    shadowHover: dark ? '0 0 0 1px #0071E3' : '0 4px 12px rgba(0,0,0,0.12)',
  }

  useEffect(() => {
    async function load() {
      const [curr, prev] = await Promise.all([
        supabase.from('bank_financials').select('bank_id, net_profit, total_assets, roe').eq('fiscal_year', 2024),
        supabase.from('bank_financials').select('bank_id, net_profit, total_assets').eq('fiscal_year', 2023),
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

  const filtered = BANKS.filter(b => {
    if (filter === 'conventional' && b.sector !== 'conventional') return false
    if (filter === 'islamic' && b.sector !== 'islamic') return false
    if (search && !b.name.toLowerCase().includes(search.toLowerCase()) &&
        !b.shortName.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div style={{ minHeight: '100vh', backgroundColor: t.bg, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: t.text }}>

      {/* ── Header ── */}
      <header style={{ backgroundColor: dark ? 'rgba(13,13,13,0.8)' : 'rgba(245,245,247,0.8)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: `1px solid ${t.border}`, position: 'sticky', top: 0, zIndex: 100, padding: '0 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: t.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>HB</span>
            </div>
            <span style={{ fontWeight: 600, fontSize: 15, color: t.text }}>HBTF Intelligence</span>
            <span style={{ fontSize: 12, color: t.textMuted, marginLeft: 4 }}>Jordan Banking Sector</span>
          </div>
          <button
            onClick={() => router.push('/chat')}
            style={{ backgroundColor: t.accent, color: '#fff', border: 'none', borderRadius: 8, padding: '7px 16px', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
          >
            Open AI Analyst →
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>

        {/* ── Page title ── */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, color: t.text }}>Jordanian Banks</h1>
          <p style={{ fontSize: 14, color: t.textSub, margin: '6px 0 0' }}>15 banks · FY2024 data · Click any bank to open the AI analyst</p>
        </div>

        {/* ── Search + Filter ── */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 24, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: t.textMuted, fontSize: 14 }}>🔍</span>
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
                style={{ padding: '8px 16px', borderRadius: 20, border: 'none', fontSize: 13, fontWeight: 500, cursor: 'pointer', backgroundColor: filter === f ? t.pillActive : t.pillInactive, color: filter === f ? '#fff' : t.pillInactiveText, transition: 'all 0.15s' }}
              >
                {f === 'all' ? 'All banks' : f === 'conventional' ? 'Commercial' : 'Islamic'}
              </button>
            ))}
          </div>
        </div>

        {/* ── Bank cards grid ── */}
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
                onClick={() => router.push(`/chat?bank=${bank.id}`)}
              />
            )
          })}
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: t.textSub }}>
            No banks match your search.
          </div>
        )}
      </main>
    </div>
  )
}

function BankCard({ bank, fin, delta, loading, dark, t, onClick }: any) {
  const [hovered, setHovered] = useState(false)
  const [imgError, setImgError] = useState(false)

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        backgroundColor: t.surface,
        border: `1px solid ${hovered ? t.accent : t.border}`,
        borderRadius: 14,
        padding: '20px',
        cursor: 'pointer',
        transition: 'all 0.15s',
        boxShadow: hovered ? t.shadowHover : t.shadow,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* HBTF badge */}
      {bank.isHBTF && (
        <div style={{ position: 'absolute', top: 14, right: 14, backgroundColor: t.hbtfBadgeBg, color: t.hbtfBadgeText, fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 20, letterSpacing: '0.05em' }}>
          OUR BANK
        </div>
      )}

      {/* Logo + name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: dark ? '#2C2C2E' : '#F5F5F7', border: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
          {!imgError ? (
            <img
              src={bank.logoUrl}
              alt={bank.name}
              style={{ width: 32, height: 32, objectFit: 'contain' }}
              onError={() => setImgError(true)}
            />
          ) : (
            <span style={{ fontSize: 11, fontWeight: 700, color: t.textSub }}>{bank.shortName.slice(0, 3).toUpperCase()}</span>
          )}
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 15, color: t.text }}>{bank.name}</div>
          <div style={{ fontSize: 12, color: t.textSub, marginTop: 2 }}>
            {bank.sector === 'islamic' ? 'Islamic' : 'Commercial'} · {bank.ticker}
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <div style={{ backgroundColor: dark ? '#2C2C2E' : '#F5F5F7', borderRadius: 10, padding: '12px 14px' }}>
          <div style={{ fontSize: 11, color: t.textSub, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Net Profit</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: t.text }}>{loading ? '...' : fmtM(fin?.net_profit)}</div>
          {delta != null && (
            <div style={{ fontSize: 11, color: delta >= 0 ? t.green : t.red, marginTop: 3, fontWeight: 500 }}>
              {delta >= 0 ? '▲' : '▼'} {Math.abs(delta).toFixed(1)}% vs 2023
            </div>
          )}
        </div>
        <div style={{ backgroundColor: dark ? '#2C2C2E' : '#F5F5F7', borderRadius: 10, padding: '12px 14px' }}>
          <div style={{ fontSize: 11, color: t.textSub, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Assets</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: t.text }}>{loading ? '...' : fmtM(fin?.total_assets)}</div>
          {fin?.roe != null && (
            <div style={{ fontSize: 11, color: t.textSub, marginTop: 3 }}>ROE {fin.roe.toFixed(1)}%</div>
          )}
        </div>
      </div>

      {/* CTA */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, color: t.textSub }}>{bank.description.slice(0, 48)}...</span>
        <div style={{ backgroundColor: hovered ? t.accent : (dark ? '#2C2C2E' : '#F0F0F2'), color: hovered ? '#fff' : t.textSub, borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 500, transition: 'all 0.15s', whiteSpace: 'nowrap', marginLeft: 8 }}>
          Ask AI →
        </div>
      </div>
    </div>
  )
}
