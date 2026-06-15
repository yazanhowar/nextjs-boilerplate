'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import ThemeToggle from '../components/ThemeToggle'
import LangToggle from '../components/LangToggle'
import { useLang } from '../lib/LangContext'
import { t } from '../lib/i18n'

export default function Dashboard() {
  const { lang } = useLang()
  const T = t[lang]
  const isAr = lang === 'ar'

  const [banks, setBanks] = useState<any[]>([])
  const [tariffs, setTariffs] = useState<any[]>([])
  const [rates, setRates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [{ data: banksData }, { data: tariffsData }, { data: ratesData }] = await Promise.all([
          supabase.from('banks').select('*').eq('is_active', true).order('name_en'),
          supabase.from('bank_tariffs').select('*, banks(name_en, short_name, name_ar, short_name_ar)'),
          supabase.from('bank_rates').select('*, banks(name_en, short_name, name_ar, short_name_ar)'),
        ])
        setBanks(banksData || [])
        setTariffs(tariffsData || [])
        setRates(ratesData || [])
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const bankName = (b: any) => isAr ? (b.short_name_ar || b.name_ar || b.short_name) : b.short_name

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-[#0a0f1e] text-gray-900 dark:text-white transition-colors">
      <header className="border-b border-gray-200 dark:border-[#1f2937] bg-white dark:bg-[#111827] px-8 py-5 flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold tracking-widest text-blue-600 dark:text-[#4a9eff] uppercase mb-1">{T.hbtf}</div>
          <h1 className="text-xl font-bold">{T.platform}</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs text-gray-400 dark:text-[#4b5563]">
            {T.jordanBankingSector} · {new Date().toLocaleDateString(isAr ? 'ar-JO' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
          <LangToggle />
          <ThemeToggle />
        </div>
      </header>

      <div className="px-8 py-8 max-w-[1400px] mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: T.banksTracked, value: '15' },
            { label: T.tariffRecords, value: loading ? '—' : String(tariffs.length) },
            { label: T.rateRecords, value: loading ? '—' : String(rates.length) },
            { label: T.dataSources, value: '40+' },
          ].map(s => (
            <div key={s.label} className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-[#1f2937] rounded-xl p-6 shadow-sm">
              <div className="text-4xl font-bold text-blue-600 dark:text-[#4a9eff] mb-1">{s.value}</div>
              <div className="text-xs text-gray-400 dark:text-[#4b5563] uppercase tracking-wider">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-[1fr_320px] gap-6">
          {/* Banks Table */}
          <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-[#1f2937] rounded-xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937] flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 dark:text-[#9ca3af] uppercase tracking-wider">{T.allBanks}</span>
              <span className="text-xs text-gray-400 dark:text-[#4b5563]">{T.jordanBankingSector}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-[#1f2937] bg-gray-50 dark:bg-[#0a0f1e]">
                    <th className="px-6 py-3 text-start text-xs font-semibold text-gray-400 uppercase tracking-wider">{T.bank}</th>
                    <th className="px-4 py-3 text-start text-xs font-semibold text-gray-400 uppercase tracking-wider">{T.type}</th>
                    <th className="px-4 py-3 text-start text-xs font-semibold text-gray-400 uppercase tracking-wider">{T.website}</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">{T.tariffData}</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">{T.rateData}</th>
                  </tr>
                </thead>
                <tbody>
                  {banks.map(b => {
                    const hasTariff = tariffs.some(t => t.bank_id === b.id)
                    const hasRate = rates.some(r => r.bank_id === b.id)
                    return (
                      <tr key={b.id} className="border-b border-gray-50 dark:border-[#1f2937] hover:bg-gray-50 dark:hover:bg-[#0d1117] transition-colors">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{isAr ? (b.short_name_ar || b.name_ar) : b.short_name}</div>
                          <div className="text-xs text-gray-400 dark:text-[#4b5563] mt-0.5">{isAr ? b.name_ar : b.name_en}</div>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${b.bank_type === 'islamic' ? 'bg-green-100 text-green-700 dark:bg-[#1a2e1a] dark:text-[#22c55e]' : 'bg-blue-100 text-blue-700 dark:bg-[#1e3a5f] dark:text-[#4a9eff]'}`}>
                            {b.bank_type === 'islamic' ? T.islamic : T.conventional}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-xs text-blue-600 dark:text-[#4a9eff]">
                          <a href={`https://${b.website}`} target="_blank" rel="noopener noreferrer" className="hover:underline">{b.website}</a>
                        </td>
                        <td className="px-4 py-4 text-center">
                          {hasTariff
                            ? <span className="text-xs text-green-600 dark:text-[#22c55e]">✓ {T.available}</span>
                            : <span className="text-xs text-gray-300 dark:text-[#374151]">— {T.pending}</span>}
                        </td>
                        <td className="px-4 py-4 text-center">
                          {hasRate
                            ? <span className="text-xs text-green-600 dark:text-[#22c55e]">✓ {T.available}</span>
                            : <span className="text-xs text-gray-300 dark:text-[#374151]">— {T.pending}</span>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Panel */}
          <div className="flex flex-col gap-6">
            {/* Tariff Coverage */}
            <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-[#1f2937] rounded-xl overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">
                <span className="text-xs font-semibold text-gray-500 dark:text-[#9ca3af] uppercase tracking-wider">{T.tariffCoverage}</span>
              </div>
              <div className="p-6">
                <div className="flex items-end gap-2 mb-2">
                  <span className="text-4xl font-bold text-blue-600 dark:text-[#4a9eff]">{tariffs.length}</span>
                  <span className="text-sm text-gray-400 dark:text-[#4b5563] mb-1">{T.ofBanks}</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-[#1f2937] rounded-full h-2 mb-4">
                  <div className="bg-blue-600 dark:bg-[#4a9eff] h-2 rounded-full transition-all" style={{ width: `${Math.min((tariffs.length / 15) * 100, 100)}%` }} />
                </div>
                <div className="space-y-2">
                  {tariffs.slice(0, 6).map(t => (
                    <div key={t.id} className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 dark:text-[#9ca3af]">{isAr ? (t.banks?.short_name_ar || t.banks?.name_ar || t.banks?.short_name) : t.banks?.short_name}</span>
                      <span className="text-xs text-green-600 dark:text-[#22c55e]">✓</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Navigation */}
            <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-[#1f2937] rounded-xl overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-[#1f2937]">
                <span className="text-xs font-semibold text-gray-500 dark:text-[#9ca3af] uppercase tracking-wider">{T.quickNavigation}</span>
              </div>
              <div className="p-4 space-y-2">
                {[
                  { label: T.search, href: '/search', desc: isAr ? 'ابحث في البنوك والمنتجات والأسعار' : 'Search banks, products, rates, fees' },
                  { label: T.compare, href: '/compare', desc: isAr ? 'مقارنة البنوك جنباً إلى جنب' : 'Side-by-side bank comparison' },
                  { label: T.rates, href: '/rates', desc: isAr ? 'مقارنة أسعار الفائدة والودائع' : 'Compare lending & deposit rates' },
                  { label: T.tariffs, href: '/tariffs', desc: isAr ? 'رسوم الخدمات في جميع البنوك' : 'Service fees across banks' },
                  { label: T.rankings, href: '/rankings', desc: isAr ? 'الموجودات والأرباح والودائع' : 'Assets, profit, deposits' },
                  { label: T.news, href: '/news', desc: isAr ? 'نتائج الجمعية العمومية والبيانات الصحفية' : 'AGM results & press releases' },
                ].map(link => (
                  <a key={link.href} href={link.href}
                    className="block p-3 rounded-lg bg-gray-50 dark:bg-[#0a0f1e] border border-gray-200 dark:border-[#1f2937] hover:border-blue-400 dark:hover:border-[#4a9eff] transition-colors group">
                    <div className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-[#4a9eff] transition-colors">{link.label}</div>
                    <div className="text-xs text-gray-400 dark:text-[#4b5563] mt-0.5">{link.desc}</div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
