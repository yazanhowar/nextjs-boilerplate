'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import ThemeToggle from '../../components/ThemeToggle'
import LangToggle from '../../components/LangToggle'
import { useLang } from '../../lib/LangContext'
import { t } from '../../lib/i18n'

const CATS = ['agm','financial_results','dividend','rating','merger_acquisition','regulation','product_launch','leadership_change','strategic','other']

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

  const bName = (a: any) => isAr ? (a.banks?.short_name_ar || a.banks?.name_ar || a.banks?.short_name) : a.banks?.short_name

  const filtered = announcements.filter(a =>
    (filterBank === 'all' || String(a.bank_id) === filterBank) &&
    (filterCat === 'all' || a.category === filterCat)
  )

  const selectStyle = {
    fontSize: '0.75rem',
    padding: '0.5rem 0.75rem',
    borderRadius: '0.5rem',
    border: '1px solid var(--border)',
    background: 'var(--bg-card)',
    color: 'var(--text-secondary)',
    outline: 'none',
  }

  return (
    <main className="min-h-screen" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <header className="hbtf-header">
        <div>
          <div className="hbtf-logo-eyebrow">
            <a href="/" style={{ textDecoration: 'none', color: 'inherit' }}>{isAr ? 'الرئيسية' : 'Rapid Intelligence'}</a>{' / '}{T.news}
          </div>
          <div className="hbtf-logo-title">{T.announcements}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <a href="/" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textDecoration: 'none' }}>{isAr ? 'الرئيسية ←' : '← Dashboard'}</a>
          <LangToggle /><ThemeToggle />
        </div>
      </header>

      <div style={{ padding: '2rem', maxWidth: '860px', margin: '0 auto' }}>
        {/* Filters */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <select value={filterBank} onChange={e => setFilterBank(e.target.value)} style={selectStyle}>
            <option value="all">{T.allBanksFilter}</option>
            {banks.map(b => <option key={b.id} value={b.id}>{isAr ? (b.short_name_ar || b.name_ar) : b.short_name}</option>)}
          </select>
          <select value={filterCat} onChange={e => setFilterCat(e.target.value)} style={selectStyle}>
            <option value="all">{T.allCategories}</option>
            {CATS.map(c => <option key={c} value={c}>{catLabel(c)}</option>)}
          </select>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginInlineStart: 'auto' }}>
            {filtered.length} {isAr ? 'إعلان' : 'announcements'}
          </span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>{isAr ? 'جارٍ التحميل...' : 'Loading...'}</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {filtered.map(a => (
              <div key={a.id} className="hbtf-announcement">
                <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', gap: '1rem' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                      <span className={`cat-${a.category}`} style={{ fontSize: '0.625rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '99px', textTransform: 'capitalize' }}>
                        {catLabel(a.category)}
                      </span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{bName(a)}</span>
                      {a.banks?.bank_type === 'islamic' && <span className="badge-islamic">{T.islamic}</span>}
                      {a.is_verified && <span style={{ fontSize: '0.65rem', color: 'var(--positive)' }}>✓ {isAr ? 'موثق' : 'Verified'}</span>}
                    </div>
                    <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.375rem', lineHeight: 1.4 }}>
                      {isAr && a.headline_ar ? a.headline_ar : a.headline_en}
                    </h3>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      {isAr && a.summary_ar ? a.summary_ar : a.summary_en}
                    </p>
                  </div>
                  <div style={{ flexShrink: 0, textAlign: 'end' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.375rem' }}>{a.announcement_date?.slice(0,10)}</div>
                    {a.source_url && (
                      <a href={a.source_url} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: '0.7rem', color: 'var(--hbtf-blue)', textDecoration: 'none' }}
                        className="dark:text-[#CEBA95]">
                        {T.viewSource} ↗
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                {isAr ? 'لا توجد إعلانات' : 'No announcements found'}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
