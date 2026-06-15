'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import ThemeToggle from '../../components/ThemeToggle'

type Result = {
  type: string
  bank_name: string
  bank_type: string
  title: string
  subtitle: string
  value?: string
  url?: string
  tag?: string
}

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); setSearched(false); return }
    setLoading(true)
    setSearched(true)
    const term = q.toLowerCase()

    const [
      { data: banks },
      { data: products },
      { data: rates },
      { data: tariffs },
      { data: announcements },
    ] = await Promise.all([
      supabase.from('banks').select('*').or(`name_en.ilike.%${q}%,short_name.ilike.%${q}%`),
      supabase.from('bank_products').select('*, banks(name_en, short_name, bank_type)').or(`product_name_en.ilike.%${q}%,description_en.ilike.%${q}%,category.ilike.%${q}%`).limit(20),
      supabase.from('bank_rates').select('*, banks(name_en, short_name, bank_type)').limit(15),
      supabase.from('bank_tariffs').select('*, banks(name_en, short_name, bank_type)').limit(15),
      supabase.from('bank_announcements').select('*, banks(name_en, short_name, bank_type)').or(`headline_en.ilike.%${q}%,summary_en.ilike.%${q}%`).order('announcement_date', { ascending: false }).limit(10),
    ])

    const out: Result[] = []

    for (const b of banks || []) {
      out.push({ type: 'bank', bank_name: b.short_name, bank_type: b.bank_type, title: b.name_en, subtitle: `${b.bank_type === 'islamic' ? 'Islamic' : 'Conventional'} · ${b.website || b.slug + '.com'}`, tag: 'Bank' })
    }

    for (const p of products || []) {
      out.push({ type: 'product', bank_name: p.banks?.short_name, bank_type: p.banks?.bank_type, title: p.product_name_en, subtitle: p.description_en || '', value: p.category?.replace(/_/g, ' '), tag: 'Product', url: p.source_url })
    }

    for (const r of rates || []) {
      const bankMatch = r.banks?.name_en?.toLowerCase().includes(term) || r.banks?.short_name?.toLowerCase().includes(term)
      const rateMatch = ['deposit', 'rate', 'saving', 'td', 'loan', 'interest', 'profit', 'murabaha', 'mudaraba'].some(k => term.includes(k))
      if (bankMatch || rateMatch) {
        out.push({ type: 'rate', bank_name: r.banks?.short_name, bank_type: r.banks?.bank_type, title: `${r.banks?.short_name} — Interest / Profit Rates`, subtitle: `Savings ${r.saving_rate ?? '—'}% · TD 12M ${r.td_12m ?? '—'}% · Home loan ${r.home_loan_min ?? '—'}–${r.home_loan_max ?? '—'}%`, tag: 'Rates', url: r.source_url })
      }
    }

    for (const t of tariffs || []) {
      const bankMatch = t.banks?.name_en?.toLowerCase().includes(term) || t.banks?.short_name?.toLowerCase().includes(term)
      const feeMatch = ['fee', 'charge', 'tariff', 'transfer', 'cheque', 'card', 'atm', 'swift', 'loan', 'safe deposit'].some(k => term.includes(k))
      if (bankMatch || feeMatch) {
        out.push({ type: 'tariff', bank_name: t.banks?.short_name, bank_type: t.banks?.bank_type, title: `${t.banks?.short_name} — Fees & Charges`, subtitle: `Maintenance JOD ${t.account_maintenance_fee ?? '—'}/mo · Local transfer JOD ${t.local_transfer_fee ?? '—'} · Origination ${t.loan_origination_fee_pct ?? '—'}%`, tag: 'Tariffs', url: t.source_url })
      }
    }

    for (const a of announcements || []) {
      out.push({ type: 'announcement', bank_name: a.banks?.short_name, bank_type: a.banks?.bank_type, title: a.headline_en, subtitle: (a.summary_en || '').slice(0, 140) + '...', value: a.announcement_date?.slice(0, 10), tag: a.category?.replace(/_/g, ' '), url: a.source_url })
    }

    setResults(out)
    setLoading(false)
  }, [])

  useEffect(() => {
    const t = setTimeout(() => search(query), 350)
    return () => clearTimeout(t)
  }, [query, search])

  const tagColors: Record<string, string> = {
    Bank: 'bg-blue-100 text-blue-700 dark:bg-[#1e3a5f] dark:text-[#4a9eff]',
    Product: 'bg-purple-100 text-purple-700 dark:bg-[#2d1b4e] dark:text-[#a78bfa]',
    Rates: 'bg-green-100 text-green-700 dark:bg-[#1a2e1a] dark:text-[#22c55e]',
    Tariffs: 'bg-orange-100 text-orange-700 dark:bg-[#2e1a0a] dark:text-[#fb923c]',
  }
  const tagColor = (tag: string) => tagColors[tag] || 'bg-gray-100 text-gray-600 dark:bg-[#1f2937] dark:text-[#9ca3af]'

  const quickSearches = ['home loan', 'credit card', 'savings rate', 'transfer fee', 'Islamic banking', 'Arab Bank', 'Capital Bank', 'dividend', 'CEO appointment', 'safe deposit box']

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-[#0a0f1e] text-gray-900 dark:text-white transition-colors">
      <header className="border-b border-gray-200 dark:border-[#1f2937] bg-white dark:bg-[#111827] px-8 py-5 flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold tracking-widest text-blue-600 dark:text-[#4a9eff] uppercase mb-1">
            <a href="/" className="hover:underline">Rapid Intelligence</a> / Search
          </div>
          <h1 className="text-xl font-bold">Search</h1>
        </div>
        <div className="flex items-center gap-4">
          <a href="/" className="text-xs text-gray-400 hover:text-blue-600 dark:hover:text-[#4a9eff]">← Dashboard</a>
          <ThemeToggle />
        </div>
      </header>

      <div className="px-8 py-8 max-w-4xl mx-auto">
        <div className="relative mb-8">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            autoFocus
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search banks, products, rates, fees, announcements..."
            className="w-full pl-12 pr-10 py-4 text-base rounded-xl border border-gray-200 dark:border-[#1f2937] bg-white dark:bg-[#111827] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#4a9eff]"
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg">×</button>
          )}
        </div>

        {!searched && (
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">Try searching for</p>
            <div className="flex flex-wrap gap-2">
              {quickSearches.map(s => (
                <button key={s} onClick={() => setQuery(s)}
                  className="px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-[#111827] border border-gray-200 dark:border-[#1f2937] text-gray-600 dark:text-gray-400 hover:border-blue-400 dark:hover:border-[#4a9eff] hover:text-blue-600 dark:hover:text-[#4a9eff] transition-colors">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {loading && <div className="text-center py-12 text-gray-400 text-sm">Searching...</div>}

        {!loading && searched && (
          <div>
            <p className="text-xs text-gray-400 mb-4">{results.length} result{results.length !== 1 ? 's' : ''} for &quot;{query}&quot;</p>
            {results.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <p className="text-base mb-2">No results found</p>
                <p className="text-sm">Try a bank name, product type, or financial term</p>
              </div>
            ) : (
              <div className="space-y-2">
                {results.map((r, i) => (
                  <div key={i} className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-[#1f2937] rounded-xl px-5 py-4 hover:border-blue-300 dark:hover:border-[#4a9eff] transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${tagColor(r.tag || '')}`}>{r.tag}</span>
                          <span className="text-xs text-gray-400 dark:text-[#4b5563]">{r.bank_name}</span>
                          {r.bank_type === 'islamic' && <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-[#1a2e1a] dark:text-[#22c55e]">Islamic</span>}
                        </div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{r.title}</p>
                        <p className="text-xs text-gray-500 dark:text-[#6b7280] mt-0.5 line-clamp-2">{r.subtitle}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        {r.value && <span className="text-xs text-gray-400 dark:text-[#4b5563]">{r.value}</span>}
                        {r.url && (
                          <a href={r.url} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-blue-600 dark:text-[#4a9eff] hover:underline whitespace-nowrap">Source ↗</a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
