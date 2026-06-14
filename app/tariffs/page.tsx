'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import ThemeToggle from '../../components/ThemeToggle'

export default function TariffsPage() {
  const [tariffs, setTariffs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const { data } = await supabase
        .from('bank_tariffs')
        .select('*, banks(name_en, short_name, bank_type)')
        .order('effective_date', { ascending: false })
      // Get latest per bank
      const latest = Object.values(
        (data || []).reduce((acc: any, r: any) => {
          if (!acc[r.bank_id]) acc[r.bank_id] = r
          return acc
        }, {})
      )
      setTariffs(latest as any[])
      setLoading(false)
    }
    fetchData()
  }, [])

  const fmt = (v: any, prefix = '') => v !== null && v !== undefined ? `${prefix}${Number(v).toFixed(2)}` : '—'
  const fmtPct = (v: any) => v !== null && v !== undefined ? `${Number(v).toFixed(2)}%` : '—'

  const sections = [
    {
      title: 'Account Fees (JOD)',
      cols: [
        { key: 'account_maintenance_fee', label: 'Maintenance' },
        { key: 'dormant_account_fee', label: 'Dormant/mo' },
        { key: 'statement_fee', label: 'Statement/pg' },
      ]
    },
    {
      title: 'Card Fees (JOD annual)',
      cols: [
        { key: 'credit_card_annual_fee_classic', label: 'Classic' },
        { key: 'credit_card_annual_fee_gold', label: 'Gold' },
        { key: 'credit_card_annual_fee_platinum', label: 'Platinum' },
      ]
    },
    {
      title: 'Cheques & Transfers (JOD)',
      cols: [
        { key: 'cheque_book_fee', label: 'Chequebook' },
        { key: 'stop_payment_fee', label: 'Stop Payment' },
        { key: 'local_transfer_fee', label: 'Local Transfer' },
        { key: 'swift_transfer_fee_jod', label: 'SWIFT (flat)' },
      ]
    },
    {
      title: 'Loans',
      cols: [
        { key: 'loan_origination_fee_pct', label: 'Origination %' },
        { key: 'early_settlement_fee_pct', label: 'Early Settlement %' },
      ]
    },
    {
      title: 'Safe Deposit Boxes (JOD annual)',
      cols: [
        { key: 'safe_box_small_annual', label: 'Small' },
        { key: 'safe_box_medium_annual', label: 'Medium' },
        { key: 'safe_box_large_annual', label: 'Large' },
      ]
    },
  ]

  const getMin = (key: string) => {
    const vals = tariffs.map(t => t[key]).filter(v => v !== null && v !== undefined)
    return vals.length ? Math.min(...vals) : null
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-[#0a0f1e] text-gray-900 dark:text-white transition-colors">
      <header className="border-b border-gray-200 dark:border-[#1f2937] bg-white dark:bg-[#111827] px-8 py-5 flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold tracking-widest text-blue-600 dark:text-[#4a9eff] uppercase mb-1">
            <a href="/" className="hover:underline">Rapid Intelligence</a> / Fee Comparison
          </div>
          <h1 className="text-xl font-bold">Fee & Tariff Comparison</h1>
        </div>
        <div className="flex items-center gap-4">
          <a href="/" className="text-xs text-gray-400 hover:text-blue-600 dark:hover:text-[#4a9eff]">← Dashboard</a>
          <ThemeToggle />
        </div>
      </header>

      <div className="px-8 py-8 max-w-[1600px] mx-auto">

        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading tariff data...</div>
        ) : (
          <>
            {sections.map(section => (
              <div key={section.title} className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-[#1f2937] rounded-xl overflow-hidden shadow-sm mb-6">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">
                  <span className="text-xs font-semibold text-gray-500 dark:text-[#9ca3af] uppercase tracking-wider">
                    {section.title} · Blue = lowest
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-[#1f2937] bg-gray-50 dark:bg-[#0a0f1e]">
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 dark:text-[#4b5563] uppercase tracking-wider">Bank</th>
                        {section.cols.map(c => (
                          <th key={c.key} className="px-4 py-3 text-center text-xs font-semibold text-gray-400 dark:text-[#4b5563] uppercase tracking-wider">{c.label}</th>
                        ))}
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 dark:text-[#4b5563] uppercase tracking-wider">As of</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 dark:text-[#4b5563] uppercase tracking-wider">Source</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tariffs.map((t) => (
                        <tr key={t.id} className="border-b border-gray-100 dark:border-[#1f2937] hover:bg-gray-50 dark:hover:bg-[#0a0f1e] transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-medium text-sm text-gray-900 dark:text-white">{t.banks?.short_name}</div>
                            <div className="text-xs text-gray-400 dark:text-[#4b5563]">
                              {t.banks?.bank_type === 'islamic' ? 'Islamic' : 'Conventional'}
                            </div>
                          </td>
                          {section.cols.map(c => {
                            const min = getMin(c.key)
                            const isLowest = t[c.key] !== null && t[c.key] !== undefined && Number(t[c.key]) === min
                            const isPct = c.key.includes('pct')
                            return (
                              <td key={c.key} className="px-4 py-4 text-center">
                                <span className={`text-sm font-medium ${isLowest ? 'text-blue-600 dark:text-[#4a9eff]' : 'text-gray-700 dark:text-gray-300'}`}>
                                  {isPct ? fmtPct(t[c.key]) : fmt(t[c.key])}
                                </span>
                              </td>
                            )
                          })}
                          <td className="px-4 py-4 text-xs text-gray-400 dark:text-[#4b5563]">
                            {t.effective_date ? new Date(t.effective_date).toLocaleDateString('en-GB') : '—'}
                          </td>
                          <td className="px-4 py-4">
                            {t.source_url ? (
                              <a href={t.source_url} target="_blank" rel="noopener noreferrer"
                                className="text-xs text-blue-600 dark:text-[#4a9eff] hover:underline">
                                View source ↗
                              </a>
                            ) : <span className="text-xs text-gray-300 dark:text-[#4b5563]">—</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}

            <p className="text-xs text-gray-400 dark:text-[#4b5563] mt-2">
              Blue = lowest fee in category · Data from official bank tariff PDFs · Pending = data not yet extracted
            </p>
          </>
        )}
      </div>
    </main>
  )
}
