'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { BANKS } from '@/lib/banks-config'
import { useRouter } from 'next/navigation'
import { useLang } from '@/lib/LangContext'
import { t as i18nDict } from '@/lib/i18n'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

function useTheme() {
  const [dark, setDark] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    setDark(mq.matches)
    const handler = (e: MediaQueryListEvent) => setDark(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return dark
}

const CATS = ['agm','financial_results','dividend','rating','merger_acquisition','regulation','product_launch','leadership_change','strategic','other']
const CAT_LABELS: Record<string,string> = {
  agm: 'AGM', financial_results: 'Financials', dividend: 'Dividend', rating: 'Rating',
  merger_acquisition: 'M&A', regulation: 'Regulation', product_launch: 'Product Launch',
  leadership_change: 'Leadership', strategic: 'Strategic', other: 'Other'
}
const CAT_LABELS_AR: Record<string,string> = {
  agm: 'اجتماع الهيئة العامة', financial_results: 'نتائج مالية', dividend: 'توزيعات أرباح', rating: 'تصنيف ائتماني',
  merger_acquisition: 'اندماج واستحواذ', regulation: 'تنظيمي', product_launch: 'إطلاق منتج',
  leadership_change: 'تغيير قيادي', strategic: 'استراتيجي', other: 'أخرى'
}
const CAT_COLORS: Record<string,string> = {
  agm: 'var(--cf-primary)', financial_results: 'var(--cf-positive)', dividend: 'var(--cf-gold)', rating: 'var(--cf-iris)',
  merger_acquisition: 'var(--cf-negative)', regulation: 'var(--cf-teal)', product_launch: 'var(--cf-primary-strong)',
  leadership_change: 'var(--cf-gold)', strategic: 'var(--cf-primary)', other: 'var(--cf-ink3)'
}

export default function NewsPage() {
  const router = useRouter()
  const { lang } = useLang()
  const L = i18nDict[lang]
  const isAr = lang === 'ar'
  const CATL = isAr ? CAT_LABELS_AR : CAT_LABELS
  const dark = useTheme()
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filterBank, setFilterBank] = useState('all')
  const [filterCat, setFilterCat] = useState('all')

  const t = {
    bg: 'var(--cf-bg)',
    surface: 'var(--cf-surface)',
    border: 'var(--cf-surface2)',
    text: 'var(--cf-ink)',
    textSub: 'var(--cf-ink2)',
    textMuted: 'var(--cf-ink3)',
    accent: 'var(--cf-primary)',
    inputBg: 'var(--cf-surface2)',
  }

  useEffect(() => {
    supabase
      .from('bank_announcements')
      .select('bank_id, announcement_date, category, headline_en, summary_en, source_url, is_verified')
      .order('announcement_date', { ascending: false })
      .limit(100)
      .then(({ data }) => {
        setAnnouncements(data || [])
        setLoading(false)
      })
  }, [])

  const bankMap = Object.fromEntries(BANKS.map(b => [b.id, b]))

  const filtered = announcements.filter(a =>
    (filterBank === 'all' || String(a.bank_id) === filterBank) &&
    (filterCat === 'all' || a.category === filterCat)
  )

  return (
    <div dir={isAr ? 'rtl' : 'ltr'} style={{ minHeight: '100vh', backgroundColor: t.bg, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: t.text }}>
      {/* Header */}
      <header style={{ backgroundColor: 'var(--cf-surface)', borderBottom: `1px solid ${t.border}`, position: 'relative' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            
            <span style={{ fontWeight: 600, fontSize: 15, color: t.text }}>{L.nw_title}</span>
          </div>
          <button onClick={() => router.push('/chat')} style={{ backgroundColor: t.accent, color: '#fff', border: 'none', borderRadius: 8, padding: '7px 16px', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
            Ask AI →
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, margin: '0 0 6px', color: t.text }}>{L.nw_title}</h1>
          <p style={{ fontSize: 14, color: t.textSub, margin: 0 }}>{filtered.length} announcements</p>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          <select value={filterBank} onChange={e => setFilterBank(e.target.value)}
            style={{ backgroundColor: t.inputBg, border: `1px solid ${t.border}`, borderRadius: 8, padding: '8px 12px', fontSize: 13, color: t.text, cursor: 'pointer', outline: 'none' }}>
            <option value="all">{L.bk_allBanks}</option>
            {BANKS.map(b => <option key={b.id} value={String(b.id)}>{b.shortName}</option>)}
          </select>
          <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
            style={{ backgroundColor: t.inputBg, border: `1px solid ${t.border}`, borderRadius: 8, padding: '8px 12px', fontSize: 13, color: t.text, cursor: 'pointer', outline: 'none' }}>
            <option value="all">{L.nw_allCategories}</option>
            {CATS.map(c => <option key={c} value={c}>{CATL[c]}</option>)}
          </select>
        </div>

        {/* List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: t.textSub }}>{L.cmp_loading}</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: t.textSub }}>{L.nw_noAnnouncements}</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map((a, i) => {
              const bank = bankMap[a.bank_id]
              const color = CAT_COLORS[a.category] || 'var(--cf-ink2)'
              return (
                <div key={i} style={{ backgroundColor: t.surface, border: `1px solid ${t.border}`, borderRadius: 12, padding: '16px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color, backgroundColor: 'color-mix(in srgb, ' + color + ' 10%, transparent)', padding: '2px 8px', borderRadius: 20 }}>{CATL[a.category] || a.category}</span>
                        {bank && <span style={{ fontSize: 11, color: t.textSub, fontWeight: 500 }}>{bank.shortName}</span>}
                        {a.is_verified && <span style={{ fontSize: 10, color: 'var(--cf-positive)' }}>{L.nw_verified}</span>}
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: t.text, marginBottom: 6, lineHeight: 1.4 }}>{a.headline_en}</div>
                      {a.summary_en && <div style={{ fontSize: 13, color: t.textSub, lineHeight: 1.5 }}>{a.summary_en}</div>}
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 12, color: t.textMuted }}>{a.announcement_date ? new Date(a.announcement_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</div>
                      {a.source_url && (
                        <a href={a.source_url} target="_blank" rel="noopener noreferrer"
                          style={{ fontSize: 11, color: t.accent, textDecoration: 'none', marginTop: 4, display: 'block' }}>
                          Source →
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}