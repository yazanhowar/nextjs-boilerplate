'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import ThemeToggle from '../../components/ThemeToggle'
import LangToggle from '../../components/LangToggle'
import { useLang } from '../../lib/LangContext'
import { t } from '../../lib/i18n'

const CATEGORIES = ['agm','financial_results','dividend','rating','merger_acquisition','regulation','product_launch','leadership_change','strategic','other']

export default function NewsPage() {
  const { lang } = useLang()
  const T = t[lang]
  const isAr = lang === 'ar'

  const [announcements, setAnnouncements] = useState<any[]>([])
  const [banks, setBanks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filterBank, setFilterBank] = useState('all')
  const [filterCat, setFilterCat] = useState('all')

  useEffect(() => {
    Promise.all([
      supabase.from('bank_announcements').select('*, banks(name_en, short_name, bank_type, name_ar, short_name_ar)').order('announcement_date', { ascending: false }),
      supabase.from('banks').select('*').eq('is_active', true).order('name_en'),
    ]).then(([a, b]) => { setAnnouncements(a.data || []); setBanks(b.data || []); setLoading(false) })
  }, [])

  const catLabel = (c: string): string => {
    const map: Record<string, string> = {
      agm: T.agm, financial_results: T.financialResults, dividend: T.dividend,
      rating: T.rating, merger_acquisition: T.mergerAcquisition, regulation: T.regulation,
      product_launch: T.productLaunch, leadership_change: T.leadershipChange,
      strategic: T.strategic, other: T.other,
    }
    return map[c] || c
  }

  const catColor: Record<string, string> = {
    financial_results: 'bg-blue-100 text-blue-700 dark:bg-[#1e3a5f] dark:text-[#4a9eff]',
    dividend: 'bg-green-100 text-green-700 dark:bg-[#1a2e1a] dark:text-[#22c55e]',
    merger_acquisition: 'bg-purple-100 text-purple-700 dark:bg-[#2d1b4e] dark:text-[#a78bfa]',
    leadership_change: 'bg-orange-100 text-orange-700 dark:bg-[#2e1a0a] dark:text-[#fb923c]',
    product_launch: 'bg-cyan-100 text-cyan-700 dark:bg-[#0a2e2e] dark:text-[#22d3ee]',
    strategic: 'bg-indigo-100 text-indigo-700 dark:bg-[#1a1e3a] dark:text-[#818cf8]',
  }
  const getCatColor = (c: string) => catColor[c] || 'bg-gray-100 text-gray-600 dark:bg-[#1f2937] dark:text-[#9ca3af]'

  const bankName = (a: any) => isAr ? (a.banks?.short_name_ar || a.banks?.name_ar || a.banks?.short_name) : a.banks?.short_name

  const filtered = announcements.filter(a =>
    (filterBank === 'all' || String(a.bank_id) === filterBank) &&
    (filterCat === 'all' || a.category === filterCat)
  )

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-[#0a0f1e] text-gray-900 dark:text-white transition-colors">
      <header className="border-b border-gray-200 dark:border-[#1f2937] bg-white dark:bg-[#111827] px-8 py-5 flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold tracking-widest text-blue-600 dark:text-[#4a9eff] uppercase mb-1">
            <a href="/" className="hover:underline">{isAr ? 'الرئيسية' : 'Rapid Intelligence'}</a> / {T.news}
          </div>
          <h1 className="text-xl font-bold">{T.announcements}</h1>
        </div>
        <div className="flex items-center gap-3">
          <a href="/" className="text-xs text-gray-400 hover:text-blue-600 dark:hover:text-[#4a9eff]">{isAr ? 'الرئيسية ←' : '← Dashboard'}</a>
          <LangToggle /><ThemeToggle />
        </div>
      </header>

      <div className="px-8 py-8 max-w-4xl mx-auto">
        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          <select value={filterBank} onChange={e => setFilterBank(e.target.value)}
            className="text-xs px-3 py-2 rounded-lg border border-gray-200 dark:border-[#1f2937] bg-white dark:bg-[#111827] text-gray-600 dark:text-gray-300 focus:outline-none">
            <option value="all">{T.allBanksFilter}</option>
            {banks.map(b => <option key={b.id} value={b.id}>{isAr ? (b.short_name_ar || b.name_ar) : b.short_name}</option>)}
          </select>
          <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
            className="text-xs px-3 py-2 rounded-lg border border-gray-200 dark:border-[#1f2937] bg-white dark:bg-[#111827] text-gray-600 dark:text-gray-300 focus:outline-none">
            <option value="all">{T.allCategories}</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{catLabel(c)}</option>)}
          </select>
          <span className="text-xs text-gray-400 self-center">{filtered.length} {isAr ? 'إعلان' : 'announcements'}</span>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400 text-sm">{isAr ? 'جارٍ التحميل...' : 'Loading...'}</div>
        ) : (
          <div className="space-y-3">
            {filtered.map(a => (
              <div key={a.id} className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-[#1f2937] rounded-xl px-6 py-5 hover:border-blue-300 dark:hover:border-[#4a9eff] transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getCatColor(a.category)}`}>{catLabel(a.category)}</span>
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-300">{bankName(a)}</span>
                      {a.banks?.bank_type === 'islamic' && <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-[#1a2e1a] dark:text-[#22c55e]">{T.islamic}</span>}
                      {a.is_verified && <span className="text-xs text-green-500">✓ {isAr ? 'موثق' : 'Verified'}</span>}
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                      {isAr && a.headline_ar ? a.headline_ar : a.headline_en}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-[#6b7280] leading-relaxed">
                      {isAr && a.summary_ar ? a.summary_ar : a.summary_en}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-xs text-gray-400 dark:text-[#4b5563] mb-1">{a.announcement_date?.slice(0,10)}</div>
                    {a.source_url && (
                      <a href={a.source_url} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-blue-600 dark:text-[#4a9eff] hover:underline">{T.viewSource} ↗</a>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-12 text-gray-400 text-sm">{isAr ? 'لا توجد إعلانات' : 'No announcements found'}</div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
