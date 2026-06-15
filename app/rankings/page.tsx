'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import ThemeToggle from '../../components/ThemeToggle'

export default function RankingsPage() {
  const [banks, setBanks] = useState<any[]>([])
  const [allFinancials, setAllFinancials] = useState<any[]>([])
  const [financials, setFinancials] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'total_assets' | 'net_profit' | 'customer_deposits' | 'roe' | 'car'>('total_assets')
  const [selectedYear, setSelectedYear] = useState<number>(2025)
  const availableYears = [2025, 2024, 2023]

  useEffect(() => {
    async function fetchData() {
      const [{ data: banksData }, { data: financialsData }] = await Promise.all([
        supabase.from('banks').select('*').eq('is_active', true),
        supabase.from('bank_financials').select('*, banks(name_en, short_name, bank_type)').order('fiscal_year', { ascending: false }),
      ])
      setBanks(banksData || [])
      setAllFinancials(financialsData || [])
      // Default: latest per bank
      const latest = Object.values(
        (financialsData || []).reduce((acc: any, f: any) => {
          if (!acc[f.bank_id]) acc[f.bank_id] = f
          return acc
        }, {})
      ) as any[]
      setFinancials(latest)
      setLoading(false)
    }
    fetchData()
  }, [])

  useEffect(() => {
    const filtered = allFinancials.filter(f => f.fiscal_year === selectedYear)
    // If a bank has no data for selected year, fall back to latest available
    const bankIds = new Set(filtered.map((f: any) => f.bank_id))
    const fallbacks = Object.values(
      allFinancials
        .filter((f: any) => !bankIds.has(f.bank_id))
        .reduce((acc: any, f: any) => {
          if (!acc[f.bank_id]) acc[f.bank_id] = f
          return acc
        }, {})
    ) as any[]
    setFinancials([...filtered, ...fallbacks])
  }, [selectedYear, allFinancials])

  const sorted = [...financials].sort((a, b) => (b[sortBy] || 0) - (a[sortBy] || 0))

  const fmtM = (v: any) => {
    if (v === null || v === undefined) return '—'
    const n = Number(v)
    if (n >= 1000000) return `JOD ${(n / 1000000).toFixed(1)}B`
    if (n >= 1000) return `JOD ${(n / 1000).toFixed(0)}M`
    return `JOD ${n.toFixed(0)}K`
  }

  const fmtPct = (v: any) => v !== null && v !== undefined ? `${Number(v).toFixed(1)}%` : '—'

  const tabs = [
    { key: 'total_assets', label: 'By Assets' },
    { key: 'net_profit', label: 'By Profit' },
    { key: 'customer_deposits', label: 'By Deposits' },
    { key: 'roe', label: 'By ROE' },
    { key: 'car', label: 'By CAR' },
  ]

  // If no financial data, show banks list with placeholder
  const showPlaceholder = !loading && financials.length === 0

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-[#0a0f1e] text-gray-900 dark:text-white transition-colors">
      <header className="border-b border-gray-200 dark:border-[#1f2937] bg-white dark:bg-[#111827] px-8 py-5 flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold tracking-widest text-blue-600 dark:text-[#4a9eff] uppercase mb-1">
            <a href="/" className="hover:underline">Rapid Intelligence</a> / Sector Rankings
          </div>
          <h1 className="text-xl font-bold">Sector Rankings</h1>
        </div>
        <div className="flex items-center gap-4">
          <a href="/" className="text-xs text-gray-400 hover:text-blue-600 dark:hover:text-[#4a9eff]">← Dashboard</a>
          <ThemeToggle />
        </div>
      </header>

      <div className="px-8 py-8 max-w-[1400px] mx-auto">

        {/* Year Selector */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {availableYears.map(year => (
            <button
              key={year}
              onClick={() => setSelectedYear(year)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
                selectedYear === year
                  ? 'bg-gray-800 text-white dark:bg-white dark:text-black'
                  : 'bg-white dark:bg-[#111827] border border-gray-200 dark:border-[#1f2937] text-gray-500 dark:text-gray-400 hover:border-gray-400'
              }`}
            >
              FY{year}
            </button>
          ))}
        </div>

        {/* Sort Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setSortBy(tab.key as any)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
                sortBy === tab.key
                  ? 'bg-blue-600 text-white dark:bg-[#4a9eff] dark:text-black'
                  : 'bg-white dark:bg-[#111827] border border-gray-200 dark:border-[#1f2937] text-gray-500 dark:text-gray-400 hover:border-blue-400 dark:hover:border-[#4a9eff]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading rankings...</div>
        ) : showPlaceholder ? (
          /* No financial data yet — show banks with status */
          <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-[#1f2937] rounded-xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937] flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 dark:text-[#9ca3af] uppercase tracking-wider">All 15 Banks — Financial Data Pending</span>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-[#1f2937] bg-gray-50 dark:bg-[#0a0f1e]">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 dark:text-[#4b5563] uppercase tracking-wider">#</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 dark:text-[#4b5563] uppercase tracking-wider">Bank</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 dark:text-[#4b5563] uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 dark:text-[#4b5563] uppercase tracking-wider">Total Assets</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 dark:text-[#4b5563] uppercase tracking-wider">Net Profit</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 dark:text-[#4b5563] uppercase tracking-wider">Deposits</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 dark:text-[#4b5563] uppercase tracking-wider">ROE</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 dark:text-[#4b5563] uppercase tracking-wider">CAR</th>
                </tr>
              </thead>
              <tbody>
                {banks.map((bank, i) => (
                  <tr key={bank.id} className="border-b border-gray-100 dark:border-[#1f2937] hover:bg-gray-50 dark:hover:bg-[#0a0f1e] transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-400 dark:text-[#4b5563]">{i + 1}</td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-sm text-gray-900 dark:text-white">{bank.short_name}</div>
                      <div className="text-xs text-gray-400 dark:text-[#4b5563]">{bank.name_en}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        bank.bank_type === 'islamic'
                          ? 'bg-green-100 text-green-700 dark:bg-[#1a2e1a] dark:text-[#22c55e]'
                          : 'bg-blue-100 text-blue-700 dark:bg-[#1e3a5f] dark:text-[#4a9eff]'
                      }`}>
                        {bank.bank_type === 'islamic' ? 'Islamic' : 'Conventional'}
                      </span>
                    </td>
                    {['total_assets','net_profit','customer_deposits','roe','car'].map(k => (
                      <td key={k} className="px-6 py-4 text-sm text-gray-300 dark:text-[#4b5563]">—</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-6 py-4 border-t border-gray-100 dark:border-[#1f2937] text-xs text-gray-400 dark:text-[#4b5563]">
              Financial data from annual reports will be loaded in the next phase. Rankings will populate automatically once loaded.
            </div>
          </div>
        ) : (
          /* Full rankings table */
          <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-[#1f2937] rounded-xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937] flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 dark:text-[#9ca3af] uppercase tracking-wider">
                Ranked {tabs.find(t => t.key === sortBy)?.label.replace('By ', 'by ')} · FY{selectedYear}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-[#1f2937] bg-gray-50 dark:bg-[#0a0f1e]">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 dark:text-[#4b5563] uppercase tracking-wider">#</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 dark:text-[#4b5563] uppercase tracking-wider">Bank</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-400 dark:text-[#4b5563] uppercase tracking-wider">Total Assets</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-400 dark:text-[#4b5563] uppercase tracking-wider">Net Profit</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-400 dark:text-[#4b5563] uppercase tracking-wider">Deposits</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-400 dark:text-[#4b5563] uppercase tracking-wider">ROE</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-400 dark:text-[#4b5563] uppercase tracking-wider">ROA</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-400 dark:text-[#4b5563] uppercase tracking-wider">CAR</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-400 dark:text-[#4b5563] uppercase tracking-wider">NPL</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-400 dark:text-[#4b5563] uppercase tracking-wider">Year</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((f, i) => (
                    <tr key={f.id} className={`border-b border-gray-100 dark:border-[#1f2937] hover:bg-gray-50 dark:hover:bg-[#0a0f1e] transition-colors ${i === 0 ? 'bg-blue-50 dark:bg-[#0d1f35]' : ''}`}>
                      <td className="px-6 py-4">
                        <span className={`text-sm font-bold ${i === 0 ? 'text-blue-600 dark:text-[#4a9eff]' : 'text-gray-400 dark:text-[#4b5563]'}`}>
                          {i + 1}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-sm text-gray-900 dark:text-white">{f.banks?.short_name}</div>
                        <div className="text-xs text-gray-400 dark:text-[#4b5563]">
                          {f.banks?.bank_type === 'islamic' ? 'Islamic' : 'Conventional'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium text-gray-900 dark:text-white">{fmtM(f.total_assets)}</td>
                      <td className="px-6 py-4 text-right text-sm text-gray-700 dark:text-gray-300">{fmtM(f.net_profit)}</td>
                      <td className="px-6 py-4 text-right text-sm text-gray-700 dark:text-gray-300">{fmtM(f.customer_deposits)}</td>
                      <td className="px-6 py-4 text-right text-sm text-gray-700 dark:text-gray-300">{fmtPct(f.roe)}</td>
                      <td className="px-6 py-4 text-right text-sm text-gray-700 dark:text-gray-300">{fmtPct(f.roa)}</td>
                      <td className="px-6 py-4 text-right text-sm text-gray-700 dark:text-gray-300">{fmtPct(f.car)}</td>
                      <td className="px-6 py-4 text-right text-sm text-gray-700 dark:text-gray-300">{fmtPct(f.npl_ratio)}</td>
                      <td className="px-6 py-4 text-center text-xs text-gray-400 dark:text-[#4b5563]">{f.fiscal_year}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <p className="text-xs text-gray-400 dark:text-[#4b5563] mt-4">
          Source: Audited annual reports · JOD thousands unless stated · Rankings update automatically as data is loaded
        </p>
      </div>
    </main>
  )
}
