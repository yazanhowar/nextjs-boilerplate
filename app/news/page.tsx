'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { BANKS } from '@/lib/banks-config'
import { useRouter } from 'next/navigation'

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
const CAT_COLORS: Record<string,string> = {
  agm: '#0071E3', financial_results: '#34C759', dividend: '#FF9500', rating: '#AF52DE',
  merger_acquisition: '#FF3B30', regulation: '#5AC8FA', product_launch: '#30D158',
  leadership_change: '#FF6B35', strategic: '#0071E3', other: '#98989D'
}

export default function NewsPage() {
  const router = useRouter()
  const dark = useTheme()
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filterBank, setFilterBank] = useState('all')
  const [filterCat, setFilterCat] = useState('all')

  const t = {
    bg: dark ? '#0D0D0D' : '#F5F5F7',
    surface: dark ? '#1C1C1E' : '#FFFFFF',
    border: dark ? '#2C2C2E' : '#E5E5EA',
    text: dark ? '#FFFFFF' : '#1C1C1E',
    textSub: dark ? '#98989D' : '#6E6E73',
    textMuted: dark ? '#48484A' : '#AEAEB2',
    accent: '#0071E3',
    inputBg: dark ? '#2C2C2E' : '#FFFFFF',
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
    <div style={{ minHeight: '100vh', backgroundColor: t.bg, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: t.text }}>
      {/* Header */}
      <header style={{ backgroundColor: dark ? 'rgba(13,13,13,0.8)' : 'rgba(245,245,247,0.8)', backdropFilter: 'blur(20px)', borderBottom: `1px solid ${t.border}`, position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', color: t.textSub, cursor: 'pointer', fontSize: 14 }}>← Dashboard</button>
            <span style={{ color: t.border }}>|</span>
            <span style={{ fontWeight: 600, fontSize: 15, color: t.text }}>News & Announcements</span>
          </div>
          <button onClick={() => router.push('/chat')} style={{ backgroundColor: t.accent, color: '#fff', border: 'none', borderRadius: 8, padding: '7px 16px', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
            Ask AI →
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, margin: '0 0 6px', color: t.text }}>News & Announcements</h1>
          <p style={{ fontSize: 14, color: t.textSub, margin: 0 }}>{filtered.length} announcements</p>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          <select value={filterBank} onChange={e => setFilterBank(e.target.value)}
            style={{ backgroundColor: t.inputBg, border: `1px solid ${t.border}`, borderRadius: 8, padding: '8px 12px', fontSize: 13, color: t.text, cursor: 'pointer', outline: 'none' }}>
            <option value="all">All Banks</option>
            {BANKS.map(b => <option key={b.id} value={String(b.id)}>{b.shortName}</option>)}
          </select>
          <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
            style={{ backgroundColor: t.inputBg, border: `1px solid ${t.border}`, borderRadius: 8, padding: '8px 12px', fontSize: 13, color: t.text, cursor: 'pointer', outline: 'none' }}>
            <option value="all">All Categories</option>
            {CATS.map(c => <option key={c} value={c}>{CAT_LABELS[c]}</option>)}
          </select>
        </div>

        {/* List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: t.textSub }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: t.textSub }}>No announcements found.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map((a, i) => {
              const bank = bankMap[a.bank_id]
              const color = CAT_COLORS[a.category] || '#98989D'
              return (
                <div key={i} style={{ backgroundColor: t.surface, border: `1px solid ${t.border}`, borderRadius: 12, padding: '16px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color, backgroundColor: color + '18', padding: '2px 8px', borderRadius: 20 }}>{CAT_LABELS[a.category] || a.category}</span>
                        {bank && <span style={{ fontSize: 11, color: t.textSub, fontWeight: 500 }}>{bank.shortName}</span>}
                        {a.is_verified && <span style={{ fontSize: 10, color: '#30D158' }}>✓ Verified</span>}
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