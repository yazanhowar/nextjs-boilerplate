'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import ThemeToggle from '../../components/ThemeToggle'

const CATEGORIES = ['all', 'agm', 'financial_results', 'dividend', 'merger_acquisition', 'rating', 'product_launch', 'leadership_change', 'strategic', 'regulation', 'other']

const CATEGORY_LABELS: Record<string, string> = {
  all: 'All',
  agm: 'AGM',
  financial_results: 'Results',
  dividend: 'Dividend',
  merger_acquisition: 'M&A',
  rating: 'Rating',
  product_launch: 'Products',
  leadership_change: 'Leadership',
  strategic: 'Strategic',
  regulation: 'Regulation',
  other: 'Other',
}

const CATEGORY_COLORS: Record<string, string> = {
  agm: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  financial_results: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  dividend: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  merger_acquisition: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  rating: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  product_launch: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
  leadership_change: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
  strategic: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
  regulation: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  other: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
}

export default function NewsPage() {
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function fetchData() {
      const { data } = await supabase
        .from('bank_announcements')
        .select('*, banks(name_en, short_name)')
        .order('announcement_date', { ascending: false })
        .limit(100)
      setAnnouncements(data || [])
      setLoading(false)
    }
    fetchData()
  }, [])

  const filtered = announcements.filter(a => {
    const matchCat = category === 'all' || a.category === category
    const matchSearch = !search || 
      a.headline_en?.toLowerCase().includes(search.toLowerCase()) ||
      a.banks?.short_name?.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-[#0a0f1e] text-gray-900 dark:text-white transition-colors">
      <header className="border-b border-gray-200 dark:border-[#1f2937] bg-white dark:bg-[#111827] px-8 py-5 flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold tracking-widest text-blue-600 dark:text-[#4a9eff] uppercase mb-1">
            <a href="/" className="hover:underline">Rapid Intelligence</a> / Announcements
          </div>
          <h1 className="text-xl font-bold">Announcements & Intelligence Feed</h1>
        </div>
        <div className="flex items-center gap-4">
          <a href="/" className="text-xs text-gray-400 hover:text-blue-600 dark:hover:text-[#4a9eff]">← Dashboard</a>
          <ThemeToggle />
        </div>
      </header>

      <div className="px-8 py-8 max-w-[1200px] mx-auto">

        {/* Search + Filters */}
        <div className="flex flex-col gap-4 mb-6">
          <input
            type="text"
            placeholder="Search announcements..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white dark:bg-[#111827] border border-gray-200 dark:border-[#1f2937] rounded-lg px-4 py-2.5 text-sm outline-none focus:border-blue-400 dark:focus:border-[#4a9eff] transition-colors"
          />
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  category === cat
                    ? 'bg-blue-600 text-white dark:bg-[#4a9eff] dark:text-black'
                    : 'bg-white dark:bg-[#111827] border border-gray-200 dark:border-[#1f2937] text-gray-500 dark:text-gray-400 hover:border-blue-400'
                }`}
              >
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>
        </div>

        {/* Feed */}
        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading announcements...</div>
        ) : filtered.length === 0 ? (
          <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-[#1f2937] rounded-xl p-12 text-center">
            <div className="text-4xl mb-4">📰</div>
            <div className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">No announcements yet</div>
            <div className="text-sm text-gray-400 dark:text-[#4b5563]">
              AGM results, press releases, and sector intelligence will appear here as they are added.
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(a => (
              <div key={a.id} className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-[#1f2937] rounded-xl p-5 hover:border-blue-300 dark:hover:border-[#4a9eff] transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {a.category && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[a.category] || CATEGORY_COLORS.other}`}>
                          {CATEGORY_LABELS[a.category] || a.category}
                        </span>
                      )}
                      {a.banks?.short_name && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-600 dark:bg-[#1f2937] dark:text-gray-400">
                          {a.banks.short_name}
                        </span>
                      )}
                      {a.fiscal_year && (
                        <span className="text-xs text-gray-400 dark:text-[#4b5563]">FY{a.fiscal_year}</span>
                      )}
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">{a.headline_en}</h3>
                    {a.summary_en && (
                      <p className="text-xs text-gray-500 dark:text-[#6b7280] leading-relaxed">{a.summary_en}</p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-xs text-gray-400 dark:text-[#4b5563] mb-2">
                      {a.announcement_date ? new Date(a.announcement_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    </div>
                    {a.source_url && (
                      <a href={a.source_url} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-blue-600 dark:text-[#4a9eff] hover:underline">
                        Source ↗
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
