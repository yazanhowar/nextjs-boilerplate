'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import ThemeToggle from '../../components/ThemeToggle'

export default function RatesPage() {
  const [rates, setRates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const { data } = await supabase
        .from('bank_rates')
        .select('*, banks(name_en, short_name, bank_type)')
        .order('effective_date', { ascending: false })
      setRates(data || [])
      setLoading(false)
    }
    fetchData()
  }, [])

  const latestRates = Object.values(
    rates.reduce((acc: any, r: any) => {
      if (!acc[r.bank_id]) acc[r.bank_id] = r
      return acc
    }, {})
  ) as any[]

  const depositCols = [
    { key: 'saving_rate', label: 'Savings' },
    { key: 'td_1m', label: 'TD 1M' },
    { key: 'td_3m', label: 'TD 3M' },
    { key: 'td_6m', label: 'TD 6M' },
    { key: 'td_12m', label: 'TD 12M' },
    { key: 'td_usd_3m', label: 'USD 3M' },
    { key: 'td_usd_6m', label: 'USD 6M' },
    { key: 'td_usd_12m', label: 'USD 12M' },
  ]

  const lendingCols = [
    { key: 'home_loan_min', label: 'Home Min' },
    { key: 'home_loan_max', label: 'Home Max' },
    { key: 'personal_loan_min', label: 'Personal Min' },
    { key: 'personal_loan_max', label: 'Personal Max' },
    { key: 'car_loan_min', label: 'Car Min' },
    { key: 'car_loan_max', label: 'Car Max' },
  ]

  const getMax = (key: string) => {
    const vals = latestRates.map(r => r[key]).filter(v => v !== null && v !== undefined)
    return vals.length ? Math.max(...vals) : null
  }

  const getMin = (key: string) => {
    const vals = latestRates.map(r => r[key]).filter(v => v !== null && v !== undefined)
    return vals.length ? Math.min(...vals) : null
  }

  const fmt = (v: any) => v !== null && v !== undefined ? `${Number(v).toFixed(2)}%` : '—'

  const RateTable = ({ title, cols, highlight }: { title: string, cols: typeof depositCols, highlight: 'max' | 'min' }) => (
    <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-[#1f2937] rounded-xl overflow-hidden shadow-sm mb-6">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">
        <span className="text-xs font-semibold text-gray-500 dark:text-[#9ca3af] uppercase tracking-wider">{title}</span>
      </div>
      <div className="overflow-x-auto">
        {loading ? (
          <div className="px-6 py-12 text-center text-sm text-gray-400">Loading...</div>
        ) : latestRates.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-gray-400">No data available yet</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 dark:border-[#1f2937] bg-gray-50 dark:bg-[#0a0f1e]">
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 dark:text-[#4b5563] uppercase tracking-wider">Bank</th>
                {cols.map(c => (
                  <th key={c.key} className="px-4 py-3 text-center text-xs font-semibold text-gray-400 dark:text-[#4b5563] uppercase tracking-wider">{c.label}</th>
                ))}
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 dark:text-[#4b5563] uppercase tracking-wider">As of</th>
              </tr>
            </thead>
            <tbody>
              {latestRates.map((r) => (
                <tr key={r.id} className="border-b border-gray-100 dark:border-[#1f2937] hover:bg-gray-50 dark:hover:bg-[#0a0f1e] transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-sm text-gray-900 dark:text-white">{r.banks?.short_name}</div>
                    <div className="text-xs text-gray-400 dark:text-[#4b5563]">{r.banks?.bank_type === 'islamic' ? 'Islamic' : 'Conventional'}</div>
                  </td>
                  {cols.map(c => {
                    const best = highlight === 'max' ? getMax(c.key) : getMin(c.key)
                    const isBest = r[c.key] !== null && r[c.key] !== undefined && Number(r[c.key]) === best
                    return (
                      <td key={c.key} className="px-4 py-4 text-center">
                        <span className={`text-sm font-medium ${isBest ? (highlight === 'max' ? 'text-green-600 dark:text-[#22c55e]' : 'text-blue-600 dark:text-[#4a9eff]') : 'text-gray-700 dark:text-gray-300'}`}>
                          {fmt(r[c.key])}
                        </span>
                      </td>
                    )
                  })}
                  <td className="px-4 py-4 text-xs text-gray-400 dark:text-[#4b5563]">
                    {r.effective_date ? new Date(r.effective_date).toLocaleDateString('en-GB') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-[#0a0f1e] text-gray-900 dark:text-white transition-colors">
      <header className="border-b border-gray-200 dark:border-[#1f2937] bg-white dark:bg-[#111827] px-8 py-5 flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold tracking-widest text-blue-600 dark:text-[#4a9eff] uppercase mb-1">
            <a href="/" className="hover:underline">Rapid Intelligence</a> / Rate Comparison
          </div>
          <h1 className="text-xl font-bold">Interest Rate Comparison</h1>
        </div>
        <div className="flex items-center gap-4">
          <a href="/" className="text-xs text-gray-400 hover:text-blue-600 dark:hover:text-[#4a9eff]">← Dashboard</a>
          <ThemeToggle />
        </div>
      </header>

      <div className="px-8 py-8 max-w-[1600px] mx-auto">
        <RateTable title="Deposit Rates — JOD (% per annum) · Green = highest" cols={depositCols} highlight="max" />
        <RateTable title="Lending Rates (% per annum) · Blue = lowest" cols={lendingCols} highlight="min" />
        <p className="text-xs text-gray-400 dark:text-[#4b5563] mt-2">
          Data sourced from official bank publications and tariff PDFs. Rates subject to change.
        </p>
      </div>
    </main>
  )
}
