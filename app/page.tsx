'use client'
// app/page.tsx — Main dashboard: 15 bank cards + sector KPIs + AI chart prompt

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { BANKS } from '@/lib/banks-config'
import type { BankConfig } from '@/lib/banks-config'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ─── Types ────────────────────────────────────────────────────────────────────
interface BankFinancial {
  bank_id: number
  net_profit: number
  total_assets: number
  roe: number
  car: number
  fiscal_year: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(n: number | null | undefined, decimals = 1): string {
  if (n == null) return '—'
  if (Math.abs(n) >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(decimals)}B`
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(decimals)}M`
  return `${n.toFixed(decimals)}`
}

function fmtJOD(n: number | null | undefined): string {
  if (n == null) return '—'
  if (Math.abs(n) >= 1_000_000_000) return `JOD ${(n / 1_000_000_000).toFixed(1)}B`
  if (Math.abs(n) >= 1_000_000) return `JOD ${(n / 1_000_000).toFixed(0)}M`
  return `JOD ${n?.toLocaleString()}`
}

function delta(current: number, previous: number): { pct: number; up: boolean } {
  if (!previous) return { pct: 0, up: true }
  const pct = ((current - previous) / Math.abs(previous)) * 100
  return { pct: Math.abs(pct), up: pct >= 0 }
}

// ─── Bank Card ────────────────────────────────────────────────────────────────
function BankCard({ bank, financial, prevFinancial }: {
  bank: BankConfig
  financial?: BankFinancial
  prevFinancial?: BankFinancial
}) {
  const router = useRouter()
  const [imgError, setImgError] = useState(false)

  const profit = financial?.net_profit
  const assets = financial?.total_assets
  const roe = financial?.roe

  const profitDelta = profit && prevFinancial?.net_profit
    ? delta(profit, prevFinancial.net_profit)
    : null

  return (
    <div
      onClick={() => router.push(`/chat?bank=${bank.id}`)}
      className="group relative bg-[#0F1E35] border border-[#1E3450] rounded-xl p-5 cursor-pointer
                 hover:border-[#CEBA95] hover:bg-[#132240] transition-all duration-200
                 hover:shadow-[0_0_24px_rgba(206,186,149,0.12)]"
    >
      {/* HBTF indicator */}
      {bank.isHBTF && (
        <div className="absolute top-3 right-3 text-[10px] font-semibold tracking-widest
                        text-[#CEBA95] bg-[#CEBA95]/10 border border-[#CEBA95]/20
                        px-2 py-0.5 rounded-full">
          OUR BANK
        </div>
      )}

      {/* Logo + name */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10
                        flex items-center justify-center overflow-hidden flex-shrink-0">
          {!imgError ? (
            <img
              src={bank.logoUrl}
              alt={bank.name}
              className="w-8 h-8 object-contain"
              onError={() => setImgError(true)}
            />
          ) : (
            <span className="text-[10px] font-bold text-[#8B9AB0]">
              {bank.shortName.slice(0, 3).toUpperCase()}
            </span>
          )}
        </div>
        <div>
          <div className="font-semibold text-white text-[13px] leading-tight">
            {bank.shortName}
          </div>
          <div className="text-[11px] text-[#8B9AB0] mt-0.5">
            {bank.sector === 'islamic' ? 'Islamic' : 'Commercial'} · {bank.ticker}
          </div>
        </div>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="text-[10px] text-[#8B9AB0] uppercase tracking-wider mb-1">Net Profit</div>
          <div className="text-[15px] font-bold text-white">
            {profit ? fmtJOD(profit) : '—'}
          </div>
          {profitDelta && (
            <div className={`text-[11px] font-medium mt-0.5 ${profitDelta.up ? 'text-[#2ECC71]' : 'text-[#E05252]'}`}>
              {profitDelta.up ? '↑' : '↓'} {profitDelta.pct.toFixed(1)}% vs last year
            </div>
          )}
        </div>
        <div>
          <div className="text-[10px] text-[#8B9AB0] uppercase tracking-wider mb-1">Total Assets</div>
          <div className="text-[15px] font-bold text-white">
            {assets ? fmtJOD(assets) : '—'}
          </div>
          {roe != null && (
            <div className="text-[11px] text-[#8B9AB0] mt-0.5">
              ROE {roe.toFixed(1)}%
            </div>
          )}
        </div>
      </div>

      {/* Accent bar */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[2px] rounded-b-xl opacity-0
                   group-hover:opacity-100 transition-opacity duration-200"
        style={{ backgroundColor: bank.primaryColor }}
      />

      {/* Arrow */}
      <div className="absolute bottom-4 right-4 text-[#8B9AB0] group-hover:text-[#CEBA95]
                      transition-colors duration-200 text-[18px]">
        →
      </div>
    </div>
  )
}

// ─── Sector pill ──────────────────────────────────────────────────────────────
function SectorPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-1.5 rounded-full text-[12px] font-medium transition-all duration-150
        ${active
          ? 'bg-[#004D8F] text-white border border-[#004D8F]'
          : 'bg-transparent text-[#8B9AB0] border border-[#1E3450] hover:border-[#004D8F] hover:text-white'
        }`}
    >
      {label}
    </button>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const router = useRouter()
  const [financials, setFinancials] = useState<Record<number, BankFinancial>>({})
  const [prevFinancials, setPrevFinancials] = useState<Record<number, BankFinancial>>({})
  const [filter, setFilter] = useState<'all' | 'conventional' | 'islamic'>('all')
  const [search, setSearch] = useState('')
  const [chartPrompt, setChartPrompt] = useState('')
  const [loading, setLoading] = useState(true)

  // Sector KPIs
  const [sectorKPIs, setSectorKPIs] = useState({
    totalAssets: 0,
    totalProfit: 0,
    avgROE: 0,
    avgCAR: 0,
  })

  useEffect(() => {
    async function load() {
      const [{ data: curr }, { data: prev }] = await Promise.all([
        supabase.from('bank_financials').select('*').eq('fiscal_year', 2024),
        supabase.from('bank_financials').select('*').eq('fiscal_year', 2023),
      ])

      if (curr) {
        const map: Record<number, BankFinancial> = {}
        curr.forEach((r: any) => { map[r.bank_id] = r })
        setFinancials(map)

        const assets = curr.reduce((s: number, r: any) => s + (r.total_assets || 0), 0)
        const profit = curr.reduce((s: number, r: any) => s + (r.net_profit || 0), 0)
        const roes = curr.filter((r: any) => r.roe).map((r: any) => r.roe)
        const cars = curr.filter((r: any) => r.car).map((r: any) => r.car)
        setSectorKPIs({
          totalAssets: assets,
          totalProfit: profit,
          avgROE: roes.reduce((s: number, v: number) => s + v, 0) / (roes.length || 1),
          avgCAR: cars.reduce((s: number, v: number) => s + v, 0) / (cars.length || 1),
        })
      }

      if (prev) {
        const map: Record<number, BankFinancial> = {}
        prev.forEach((r: any) => { map[r.bank_id] = r })
        setPrevFinancials(map)
      }

      setLoading(false)
    }
    load()
  }, [])

  const filteredBanks = BANKS.filter(b => {
    if (filter === 'conventional' && b.sector !== 'conventional') return false
    if (filter === 'islamic' && b.sector !== 'islamic') return false
    if (search && !b.name.toLowerCase().includes(search.toLowerCase()) &&
        !b.shortName.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  function handleChartPrompt(e: React.FormEvent) {
    e.preventDefault()
    if (!chartPrompt.trim()) return
    router.push(`/compare?q=${encodeURIComponent(chartPrompt.trim())}`)
  }

  return (
    <div className="min-h-screen bg-[#0A1628] text-white">

      {/* ── Header ── */}
      <header className="border-b border-[#1E3450] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#004D8F] rounded-lg flex items-center justify-center">
            <span className="text-[#CEBA95] font-bold text-[11px]">HB</span>
          </div>
          <div>
            <div className="font-bold text-[15px] text-white">HBTF Intelligence</div>
            <div className="text-[11px] text-[#8B9AB0]">Jordanian Banking Sector — FY2024</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-[#8B9AB0]">Last updated Jun 2025</span>
          <button
            onClick={() => router.push('/compare')}
            className="text-[12px] px-3 py-1.5 rounded-lg bg-[#004D8F] text-white
                       hover:bg-[#0060B0] transition-colors"
          >
            Compare banks
          </button>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-6 py-8">

        {/* ── Sector KPIs ── */}
        <section className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Sector Total Assets', value: fmtJOD(sectorKPIs.totalAssets), sub: 'All 15 banks combined' },
            { label: 'Sector Net Profit', value: fmtJOD(sectorKPIs.totalProfit), sub: 'FY2024 combined' },
            { label: 'Average Return on Equity', value: sectorKPIs.avgROE ? `${sectorKPIs.avgROE.toFixed(1)}%` : '—', sub: 'Sector average' },
            { label: 'Average Capital Ratio', value: sectorKPIs.avgCAR ? `${sectorKPIs.avgCAR.toFixed(1)}%` : '—', sub: 'Min. required: 14%' },
          ].map(kpi => (
            <div key={kpi.label} className="bg-[#0F1E35] border border-[#1E3450] rounded-xl p-5">
              <div className="text-[10px] uppercase tracking-wider text-[#8B9AB0] mb-2">{kpi.label}</div>
              <div className="text-[24px] font-bold text-white">{loading ? '...' : kpi.value}</div>
              <div className="text-[11px] text-[#8B9AB0] mt-1">{kpi.sub}</div>
            </div>
          ))}
        </section>

        {/* ── AI Chart Prompt ── */}
        <section className="mb-8">
          <form onSubmit={handleChartPrompt} className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8B9AB0] text-[16px]">⚡</div>
            <input
              value={chartPrompt}
              onChange={e => setChartPrompt(e.target.value)}
              placeholder="Ask anything — e.g. Compare credit card fees across all banks, or Show HBTF profit trend vs JKB for 3 years"
              className="w-full bg-[#0F1E35] border border-[#1E3450] rounded-xl pl-10 pr-32 py-4
                         text-[14px] text-white placeholder-[#4A5568]
                         focus:outline-none focus:border-[#CEBA95] transition-colors"
            />
            <button
              type="submit"
              className="absolute right-3 top-1/2 -translate-y-1/2
                         bg-[#CEBA95] text-[#0A1628] font-semibold text-[12px]
                         px-4 py-2 rounded-lg hover:bg-[#D9CC9E] transition-colors"
            >
              Generate chart
            </button>
          </form>
        </section>

        {/* ── Filter bar ── */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-2">
            <SectorPill label="All banks" active={filter === 'all'} onClick={() => setFilter('all')} />
            <SectorPill label="Commercial" active={filter === 'conventional'} onClick={() => setFilter('conventional')} />
            <SectorPill label="Islamic" active={filter === 'islamic'} onClick={() => setFilter('islamic')} />
          </div>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search banks..."
            className="bg-[#0F1E35] border border-[#1E3450] rounded-lg px-4 py-2
                       text-[13px] text-white placeholder-[#4A5568]
                       focus:outline-none focus:border-[#004D8F] w-48"
          />
        </div>

        {/* ── Bank cards grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredBanks.map(bank => (
            <BankCard
              key={bank.id}
              bank={bank}
              financial={financials[bank.id]}
              prevFinancial={prevFinancials[bank.id]}
            />
          ))}
        </div>

        {filteredBanks.length === 0 && (
          <div className="text-center py-16 text-[#8B9AB0]">
            No banks match your search.
          </div>
        )}
      </main>
    </div>
  )
}
