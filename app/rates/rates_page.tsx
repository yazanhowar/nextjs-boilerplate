'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import ThemeToggle from '../../components/ThemeToggle'
import LangToggle from '../../components/LangToggle'
import { useLang } from '../../lib/LangContext'
import { t } from '../../lib/i18n'

export default function RatesPage() {
  const { lang } = useLang()
  const T = t[lang]
  const isAr = lang === 'ar'

  const [rates, setRates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('bank_rates').select('*, banks(name_en, short_name, bank_type, name_ar, short_name_ar)').order('saving_rate', { ascending: false })
      .then(({ data }) => { setRates(data || []); setLoading(false) })
  }, [])

  const fmtPct = (v: any) => v != null ? `${Number(v).toFixed(2)}%` : '—'
  const bankName = (r: any) => isAr ? (r.banks?.short_name_ar || r.banks?.name_ar || r.banks?.short_name) : r.banks?.short_name

  const getColor = (vals: (number|null)[], val: number|null, highGood = true) => {
    if (val == null) return ''
    const nums = vals.filter((v): v is number => v != null)
    if (nums.length === 0) return ''
    const best = highGood ? Math.max(...nums) : Math.min(...nums)
    return val === best ? 'text-green-600 dark:text-[#22c55e] font-semibold' : ''
  }

  const cols = ['saving_rate','td_1m','td_3m','td_6m','td_12m','td_usd_3m','td_usd_6m','td_usd_12m']
  const lendCols = ['home_loan_min','home_loan_max','personal_loan_min','personal_loan_max','car_loan_min','car_loan_max']

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-[#0a0f1e] text-gray-900 dark:text-white transition-colors">
      <header className="border-b border-gray-200 dark:border-[#1f2937] bg-white dark:bg-[#111827] px-8 py-5 flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold tracking-widest text-blue-600 dark:text-[#4a9eff] uppercase mb-1">
            <a href="/" className="hover:underline">{isAr ? 'الرئيسية' : 'Rapid Intelligence'}</a> / {T.rates}
          </div>
          <h1 className="text-xl font-bold">{T.rateComparison}</h1>
        </div>
        <div className="flex items-center gap-3">
          <a href="/" className="text-xs text-gray-400 hover:text-blue-600 dark:hover:text-[#4a9eff]">{isAr ? 'الرئيسية ←' : '← Dashboard'}</a>
          <LangToggle /><ThemeToggle />
        </div>
      </header>

      <div className="px-8 py-8 max-w-[1400px] mx-auto space-y-8">
        {/* Deposit Rates */}
        <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-[#1f2937] rounded-xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-[#1f2937] bg-gray-50 dark:bg-[#0a0f1e]">
            <span className="text-xs font-semibold text-gray-500 dark:text-[#9ca3af] uppercase tracking-wider">{T.depositRates}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-[#1f2937]">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase">{T.bank}</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">{T.savings}</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">{isAr ? 'و.آ 1ش' : 'TD 1M'}</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">{isAr ? 'و.آ 3ش' : 'TD 3M'}</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">{isAr ? 'و.آ 6ش' : 'TD 6M'}</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">{isAr ? 'و.آ 12ش' : 'TD 12M'}</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">{isAr ? 'دولار 3ش' : 'USD 3M'}</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">{isAr ? 'دولار 6ش' : 'USD 6M'}</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">{isAr ? 'دولار 12ش' : 'USD 12M'}</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">{T.asOf}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={10} className="text-center py-8 text-gray-400 text-sm">{isAr ? 'جارٍ التحميل...' : 'Loading...'}</td></tr>
                ) : rates.map((r, i) => (
                  <tr key={r.id} className="border-b border-gray-50 dark:border-[#1f2937] hover:bg-gray-50 dark:hover:bg-[#0d1117] transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{bankName(r)}</div>
                      <div className={`text-xs mt-0.5 ${r.banks?.bank_type === 'islamic' ? 'text-green-600 dark:text-[#22c55e]' : 'text-gray-400'}`}>
                        {r.banks?.bank_type === 'islamic' ? T.islamic : T.conventional}
                      </div>
                    </td>
                    {cols.map(col => (
                      <td key={col} className={`px-4 py-4 text-right text-sm ${getColor(rates.map(x => x[col]), r[col], true)}`}>{fmtPct(r[col])}</td>
                    ))}
                    <td className="px-4 py-4 text-right text-xs text-gray-400">{r.effective_date?.slice(0,10)?.split('-').reverse().join('/')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Lending Rates */}
        <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-[#1f2937] rounded-xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-[#1f2937] bg-gray-50 dark:bg-[#0a0f1e]">
            <span className="text-xs font-semibold text-gray-500 dark:text-[#9ca3af] uppercase tracking-wider">{T.lendingRates}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-[#1f2937]">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase">{T.bank}</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">{T.homeLoanMin}</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">{T.homeLoanMax}</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">{T.personalMin}</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">{T.personalMax}</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">{T.carMin}</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">{T.carMax}</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">{T.asOf}</th>
                </tr>
              </thead>
              <tbody>
                {rates.map(r => (
                  <tr key={r.id} className="border-b border-gray-50 dark:border-[#1f2937] hover:bg-gray-50 dark:hover:bg-[#0d1117] transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{bankName(r)}</div>
                      <div className={`text-xs mt-0.5 ${r.banks?.bank_type === 'islamic' ? 'text-green-600 dark:text-[#22c55e]' : 'text-gray-400'}`}>
                        {r.banks?.bank_type === 'islamic' ? T.islamic : T.conventional}
                      </div>
                    </td>
                    {lendCols.map(col => (
                      <td key={col} className={`px-4 py-4 text-right text-sm ${getColor(rates.map(x => x[col]), r[col], false)}`}>{fmtPct(r[col])}</td>
                    ))}
                    <td className="px-4 py-4 text-right text-xs text-gray-400">{r.effective_date?.slice(0,10)?.split('-').reverse().join('/')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-xs text-gray-400 dark:text-[#4b5563]">{T.rateSourceNote}</p>
      </div>
    </main>
  )
}
