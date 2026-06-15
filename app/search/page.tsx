'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import ThemeToggle from '../../components/ThemeToggle'
import LangToggle from '../../components/LangToggle'
import { useLang } from '../../lib/LangContext'
import { t } from '../../lib/i18n'

type Result = {
  type: string; bank_name: string; bank_type: string
  title: string; subtitle: string; value?: string; url?: string; tag?: string
}

export default function SearchPage() {
  const { lang } = useLang()
  const T = t[lang]
  const isAr = lang === 'ar'

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); setSearched(false); return }
    setLoading(true); setSearched(true)
    const term = q.toLowerCase()

    const [{ data: banks }, { data: products }, { data: rates }, { data: tariffs }, { data: announcements }] = await Promise.all([
      supabase.from('banks').select('*').or(`name_en.ilike.%${q}%,short_name.ilike.%${q}%,name_ar.ilike.%${q}%`),
      supabase.from('bank_products').select('*, banks(name_en, short_name, bank_type, name_ar, short_name_ar)').or(`product_name_en.ilike.%${q}%,description_en.ilike.%${q}%,category.ilike.%${q}%`).limit(20),
      supabase.from('bank_rates').select('*, banks(name_en, short_name, bank_type, name_ar, short_name_ar)').limit(15),
      supabase.from('bank_tariffs').select('*, banks(name_en, short_name, bank_type, name_ar, short_name_ar)').limit(15),
      supabase.from('bank_announcements').select('*, banks(name_en, short_name, bank_type, name_ar, short_name_ar)').or(`headline_en.ilike.%${q}%,summary_en.ilike.%${q}%,headline_ar.ilike.%${q}%`).order('announcement_date', { ascending: false }).limit(10),
    ])

    const out: Result[] = []
    const bName = (b: any) => isAr ? (b?.short_name_ar || b?.name_ar || b?.short_name) : b?.short_name

    for (const b of banks || []) {
      out.push({ type: 'bank', bank_name: isAr ? (b.short_name_ar || b.name_ar || b.short_name) : b.short_name, bank_type: b.bank_type, title: isAr ? (b.name_ar || b.name_en) : b.name_en, subtitle: b.website || '', tag: isAr ? 'بنك' : 'Bank' })
    }
    for (const p of products || []) {
      out.push({ type: 'product', bank_name: bName(p.banks), bank_type: p.banks?.bank_type, title: p.product_name_en, subtitle: p.description_en || '', value: p.category?.replace(/_/g, ' '), tag: isAr ? 'منتج' : 'Product', url: p.source_url })
    }
    for (const r of rates || []) {
      const bMatch = r.banks?.name_en?.toLowerCase().includes(term) || r.banks?.short_name?.toLowerCase().includes(term)
      const rMatch = ['deposit','rate','saving','td','loan','interest','profit','murabaha','ودائع','معدل','توفير','قرض'].some(k => term.includes(k))
      if (bMatch || rMatch) out.push({ type: 'rate', bank_name: bName(r.banks), bank_type: r.banks?.bank_type, title: `${bName(r.banks)} — ${isAr ? 'أسعار الفائدة / الأرباح' : 'Interest / Profit Rates'}`, subtitle: `${isAr ? 'توفير' : 'Savings'} ${r.saving_rate ?? '—'}% · TD 12M ${r.td_12m ?? '—'}% · ${isAr ? 'قرض سكني' : 'Home'} ${r.home_loan_min ?? '—'}–${r.home_loan_max ?? '—'}%`, tag: isAr ? 'أسعار' : 'Rates', url: r.source_url })
    }
    for (const tar of tariffs || []) {
      const bMatch = tar.banks?.name_en?.toLowerCase().includes(term) || tar.banks?.short_name?.toLowerCase().includes(term)
      const fMatch = ['fee','charge','tariff','transfer','cheque','card','atm','swift','loan','رسوم','عمولة','تحويل'].some(k => term.includes(k))
      if (bMatch || fMatch) out.push({ type: 'tariff', bank_name: bName(tar.banks), bank_type: tar.banks?.bank_type, title: `${bName(tar.banks)} — ${isAr ? 'الرسوم والعمولات' : 'Fees & Charges'}`, subtitle: `${isAr ? 'صيانة' : 'Maintenance'} JOD ${tar.account_maintenance_fee ?? '—'} · ${isAr ? 'تحويل محلي' : 'Local transfer'} JOD ${tar.local_transfer_fee ?? '—'}`, tag: isAr ? 'تعريفات' : 'Tariffs', url: tar.source_url })
    }
    for (const a of announcements || []) {
      out.push({ type: 'announcement', bank_name: bName(a.banks), bank_type: a.banks?.bank_type, title: isAr && a.headline_ar ? a.headline_ar : a.headline_en, subtitle: ((isAr && a.summary_ar ? a.summary_ar : a.summary_en) || '').slice(0, 140) + '...', value: a.announcement_date?.slice(0,10), tag: a.category?.replace(/_/g, ' '), url: a.source_url })
    }

    setResults(out); setLoading(false)
  }, [isAr])

  useEffect(() => {
    const timer = setTimeout(() => search(query), 350)
    return () => clearTimeout(timer)
  }, [query, search])

  const tagColors: Record<string, string> = {
    Bank: '#004D8F', 'بنك': '#004D8F',
    Product: '#6B3FA0', 'منتج': '#6B3FA0',
    Rates: '#1A7A4A', 'أسعار': '#1A7A4A',
    Tariffs: '#8A6D3B', 'تعريفات': '#8A6D3B',
  }

  const quickSearches = isAr
    ? ['قرض سكني', 'بطاقة ائتمان', 'سعر التوفير', 'رسوم التحويل', 'بنك إسلامي', 'البنك العربي', 'أرباح', 'مدير عام']
    : ['home loan', 'credit card', 'savings rate', 'transfer fee', 'Islamic banking', 'Arab Bank', 'dividend', 'CEO']

  return (
    <main className="min-h-screen" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <header className="hbtf-header">
        <div>
          <div className="hbtf-logo-eyebrow">
            <a href="/" style={{ textDecoration: 'none', color: 'inherit' }}>{isAr ? 'الرئيسية' : 'Rapid Intelligence'}</a>{' / '}{T.search}
          </div>
          <div className="hbtf-logo-title">{T.search}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <a href="/" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textDecoration: 'none' }}>{isAr ? 'الرئيسية ←' : '← Dashboard'}</a>
          <LangToggle /><ThemeToggle />
        </div>
      </header>

      <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ position: 'relative', marginBottom: '2rem' }}>
          <svg style={{ position: 'absolute', insetInlineStart: '1rem', top: '50%', transform: 'translateY(-50%)', width: '1.25rem', height: '1.25rem', color: 'var(--text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input autoFocus type="text" value={query} onChange={e => setQuery(e.target.value)}
            placeholder={T.searchPlaceholder}
            className="hbtf-search"
            style={{ paddingInlineStart: '3rem', paddingInlineEnd: '2.5rem' }}
          />
          {query && (
            <button onClick={() => setQuery('')} style={{ position: 'absolute', insetInlineEnd: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem' }}>×</button>
          )}
        </div>

        {!searched && (
          <div>
            <p style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>{T.trySearhing}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {quickSearches.map(s => (
                <button key={s} onClick={() => setQuery(s)} className="hbtf-btn" style={{ fontSize: '0.75rem' }}>{s}</button>
              ))}
            </div>
          </div>
        )}

        {loading && <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>{T.searching}</div>}

        {!loading && searched && (
          <div>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              {results.length} {T.searchResults} &quot;{query}&quot;
            </p>
            {results.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                <p style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>{T.noResults}</p>
                <p style={{ fontSize: '0.8rem' }}>{T.noResultsHint}</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {results.map((r, i) => (
                  <div key={i} className="hbtf-result">
                    <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', gap: '1rem' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem', flexWrap: 'wrap' }}>
                          <span style={{
                            fontSize: '0.625rem', fontWeight: 700, padding: '0.15rem 0.5rem',
                            borderRadius: '99px', textTransform: 'capitalize',
                            background: `color-mix(in srgb, ${tagColors[r.tag || ''] || '#585A5B'} 15%, transparent)`,
                            color: tagColors[r.tag || ''] || 'var(--text-muted)'
                          }}>{r.tag}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{r.bank_name}</span>
                          {r.bank_type === 'islamic' && <span className="badge-islamic">{isAr ? 'إسلامي' : 'Islamic'}</span>}
                        </div>
                        <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{r.title}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem', lineHeight: 1.5 }}>{r.subtitle}</p>
                      </div>
                      <div style={{ flexShrink: 0, textAlign: 'end' }}>
                        {r.value && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>{r.value}</span>}
                        {r.url && <a href={r.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.7rem', color: 'var(--hbtf-blue)', textDecoration: 'none' }}>{T.viewSource} ↗</a>}
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
