'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import ThemeToggle from '../../components/ThemeToggle'
import LangToggle from '../../components/LangToggle'
import { useLang } from '../../lib/LangContext'
import { t } from '../../lib/i18n'

export default function RankingsPage() {
  const { lang } = useLang()
  const T = t[lang]
  const isAr = lang === 'ar'

  const [allFinancials, setAllFinancials] = useState<any[]>([])
  const [financials, setFinancials] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'total_assets'|'net_profit'|'customer_deposits'|'roe'|'car'>('total_assets')
  const [selectedYear, setSelectedYear] = useState(2025)
  const availableYears = [2025, 2024, 2023]

  useEffect(() => {
    supabase.from('bank_financials').select('*, banks(name_en, short_name, bank_type, name_ar, short_name_ar)').order('fiscal_year', { ascending: false })
      .then(({ data }) => {
        setAllFinancials(data || [])
        const latest = Object.values((data || []).reduce((acc: any, f: any) => { if (!acc[f.bank_id]) acc[f.bank_id] = f; return acc }, {})) as any[]
        setFinancials(latest)
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    const filtered = allFinancials.filter(f => f.fiscal_year === selectedYear)
    const bankIds = new Set(filtered.map((f: any) => f.bank_id))
    const fallbacks = Object.values(allFinancials.filter((f: any) => !bankIds.has(f.bank_id)).reduce((acc: any, f: any) => { if (!acc[f.bank_id]) acc[f.bank_id] = f; return acc }, {})) as any[]
    setFinancials([...filtered, ...fallbacks])
  }, [selectedYear, allFinancials])

  const sorted = [...financials].sort((a, b) => (b[sortBy] || 0) - (a[sortBy] || 0))

  const tabs = [
    { key: 'total_assets', label: T.byAssets },
    { key: 'net_profit', label: T.byProfit },
    { key: 'customer_deposits', label: T.byDeposits },
    { key: 'roe', label: T.byROE },
    { key: 'car', label: T.byCAR },
  ]

  const fmtB = (v: any, currency = 'JOD') => {
    if (!v) return '—'
    const n = Number(v)
    if (currency === 'USD') {
      if (n >= 1000000) return `$${(n/1000000).toFixed(1)}B`
      return `$${(n/1000).toFixed(0)}M`
    }
    if (n >= 1000000) return `${isAr ? 'د.أ' : 'JOD'} ${(n/1000000).toFixed(1)}B`
    return `${isAr ? 'د.أ' : 'JOD'} ${(n/1000).toFixed(0)}M`
  }
  const fmtPct = (v: any) => v != null ? `${Number(v).toFixed(1)}%` : '—'
  const bankName = (f: any) => isAr ? (f.banks?.short_name_ar || f.banks?.name_ar || f.banks?.short_name) : f.banks?.short_name

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-[#0a0f1e] text-gray-900 dark:text-white transition-colors">
      <header className="border-b border-gray-200 dark:border-[#1f2937] bg-white dark:bg-[#111827] px-8 py-5 flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold tracking-widest text-blue-600 dark:text-[#4a9eff] uppercase mb-1">
            <a href="/" className="hover:underline">{isAr ? 'الرئيسية' : 'Rapid Intelligence'}</a> / {T.rankings}
          </div>
          <h1 className="text-xl font-bold">{T.sectorRankings}</h1>
        </div>
        <div className="flex items-center gap-3">
          <a href="/" className="text-xs text-gray-400 hover:text-blue-600 dark:hover:text-[#4a9eff]">{isAr ? 'الرئيسية ←' : '← Dashboard'}</a>
          <LangToggle /><ThemeToggle />
        </div>
      </header>

      <div className="px-8 py-8 max-w-[1400px] mx-auto">
        {/* Year Selector */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {availableYears.map(year => (
            <button key={year} onClick={() => setSelectedYear(year)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${selectedYear === year ? 'bg-gray-800 text-white dark:bg-white dark:text-black' : 'bg-white dark:bg-[#111827] border border-gray-200 dark:border-[#1f2937] text-gray-500 dark:text-gray-400 hover:border-gray-400'}`}>
              {isAr ? `السنة ${year}` : `FY${year}`}
            </button>
          ))}
        </div>

        {/* Sort Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setSortBy(tab.key as any)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${sortBy === tab.key ? 'bg-blue-600 text-white dark:bg-[#4a9eff] dark:text-black' : 'bg-white dark:bg-[#111827] border border-gray-200 dark:border-[#1f2937] text-gray-500 dark:text-gray-400 hover:border-blue-400 dark:hover:border-[#4a9eff]'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-[#1f2937] rounded-xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-[#1f2937] bg-gray-50 dark:bg-[#0a0f1e]">
            <span className="text-xs font-semibold text-gray-500 dark:text-[#9ca3af] uppercase tracking-wider">
              {isAr ? `مرتبة حسب ${tabs.find(t => t.key === sortBy)?.label} · ${isAr ? 'السنة المالية' : 'FY'}${selectedYear}` : `Ranked ${tabs.find(t => t.key === sortBy)?.label.replace('By ', 'by ')} · FY${selectedYear}`}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-[#1f2937] bg-gray-50 dark:bg-[#0a0f1e]">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider w-8">#</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">{T.bank}</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">{T.totalAssets}</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">{T.netProfit}</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">{T.deposits}</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">{T.roe}</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">{T.roa}</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">{T.car}</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">{T.npl}</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">{T.year}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={10} className="text-center py-12 text-gray-400 text-sm">{isAr ? 'جارٍ التحميل...' : 'Loading...'}</td></tr>
                ) : sorted.map((f, i) => (
                  <tr key={f.id || i} className={`border-b border-gray-50 dark:border-[#1f2937] hover:bg-gray-50 dark:hover:bg-[#0d1117] transition-colors ${i === 0 ? 'bg-blue-50 dark:bg-[#0d1a2d]' : ''}`}>
                    <td className={`px-4 py-4 text-sm font-bold ${i === 0 ? 'text-blue-600 dark:text-[#4a9eff]' : 'text-gray-400'}`}>{i + 1}</td>
                    <td className="px-4 py-4">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">{bankName(f)}</div>
                      <div className={`text-xs mt-0.5 ${f.banks?.bank_type === 'islamic' ? 'text-green-600 dark:text-[#22c55e]' : 'text-gray-400 dark:text-[#4b5563]'}`}>
                        {f.banks?.bank_type === 'islamic' ? T.islamic : T.conventional}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right text-sm font-medium text-gray-900 dark:text-white">{fmtB(f.total_assets, f.currency)}</td>
                    <td className="px-4 py-4 text-right text-sm font-medium text-gray-900 dark:text-white">{fmtB(f.net_profit, f.currency)}</td>
                    <td className="px-4 py-4 text-right text-sm text-gray-700 dark:text-gray-300">{fmtB(f.customer_deposits, f.currency)}</td>
                    <td className="px-4 py-4 text-right text-sm text-gray-700 dark:text-gray-300">{fmtPct(f.roe)}</td>
                    <td className="px-4 py-4 text-right text-sm text-gray-700 dark:text-gray-300">{fmtPct(f.roa)}</td>
                    <td className="px-4 py-4 text-right text-sm text-gray-700 dark:text-gray-300">{fmtPct(f.car)}</td>
                    <td className="px-4 py-4 text-right text-sm text-gray-700 dark:text-gray-300">{fmtPct(f.npl_ratio)}</td>
                    <td className="px-4 py-4 text-right text-xs text-gray-400">{f.fiscal_year}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-3 border-t border-gray-100 dark:border-[#1f2937] text-xs text-gray-400">{T.sourceNote}</div>
        </div>
      </div>
    </main>
  )
}
