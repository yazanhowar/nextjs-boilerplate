'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import ThemeToggle from '../../components/ThemeToggle'
import LangToggle from '../../components/LangToggle'
import { useLang } from '../../lib/LangContext'
import { t } from '../../lib/i18n'

export default function RankingsPage() {
  const { lang } = useLang()
  const T = t[lang]
  const isAr = lang === 'ar'

  const [allFinancials, setAllFinancials] = useState<any[]>([])
  const [financials, setFinancials] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'total_assets'|'net_profit'|'customer_deposits'|'roe'|'car'>('total_assets')
  const [selectedYear, setSelectedYear] = useState(2025)
  const years = [2025, 2024, 2023]

  useEffect(() => {
    supabase.from('bank_financials').select('*, banks(name_en, short_name, bank_type, name_ar, short_name_ar)')
      .order('fiscal_year', { ascending: false })
      .then(({ data }) => {
        setAllFinancials(data || [])
        const latest = Object.values((data || []).reduce((acc: any, f: any) => {
          if (!acc[f.bank_id]) acc[f.bank_id] = f; return acc
        }, {})) as any[]
        setFinancials(latest)
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    const filtered = allFinancials.filter(f => f.fiscal_year === selectedYear)
    const bankIds = new Set(filtered.map((f: any) => f.bank_id))
    const fallbacks = Object.values(
      allFinancials.filter((f: any) => !bankIds.has(f.bank_id))
        .reduce((acc: any, f: any) => { if (!acc[f.bank_id]) acc[f.bank_id] = f; return acc }, {})
    ) as any[]
    setFinancials([...filtered, ...fallbacks])
  }, [selectedYear, allFinancials])

  const sorted = [...financials].sort((a, b) => (b[sortBy] || 0) - (a[sortBy] || 0))

  const tabs = [
    { key: 'total_assets', label: T.byAssets },
    { key: 'net_profit', label: T.byProfit },
    { key: 'customer_deposits', label: T.byDeposits },
    { key: 'roe', label: T.byROE },
    { key: 'car', label: T.byCAR },
  ]

  const fmtB = (v: any, currency = 'JOD') => {
    if (!v) return '—'
    const n = Number(v)
    const prefix = currency === 'USD' ? '$' : (isAr ? 'د.أ ' : 'JOD ')
    if (n >= 1000000) return `${prefix}${(n/1000000).toFixed(1)}B`
    return `${prefix}${(n/1000).toFixed(0)}M`
  }
  const fmtPct = (v: any) => v != null ? `${Number(v).toFixed(1)}%` : '—'
  const bName = (f: any) => isAr ? (f.banks?.short_name_ar || f.banks?.name_ar || f.banks?.short_name) : f.banks?.short_name

  return (
    <main className="min-h-screen" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <header className="hbtf-header">
        <div>
          <div className="hbtf-logo-eyebrow">
            <a href="/" style={{ textDecoration: 'none', color: 'inherit' }}>{isAr ? 'الرئيسية' : 'Rapid Intelligence'}</a>
            {' / '}{T.rankings}
          </div>
          <div className="hbtf-logo-title">{T.sectorRankings}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <a href="/" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textDecoration: 'none' }}>
            {isAr ? 'الرئيسية ←' : '← Dashboard'}
          </a>
          <LangToggle /><ThemeToggle />
        </div>
      </header>

      <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>

        {/* Controls */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
          {years.map(y => (
            <button key={y} onClick={() => setSelectedYear(y)}
              className={selectedYear === y ? 'hbtf-btn hbtf-btn-active' : 'hbtf-btn'}>
              {isAr ? `السنة ${y}` : `FY${y}`}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setSortBy(tab.key as any)}
              className={sortBy === tab.key ? 'hbtf-btn hbtf-btn-active' : 'hbtf-btn'}>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="hbtf-card">
          <div className="hbtf-card-header">
            <span className="hbtf-card-label">
              {isAr
                ? `مرتبة حسب ${tabs.find(t => t.key === sortBy)?.label} · السنة ${selectedYear}`
                : `Ranked ${tabs.find(t => t.key === sortBy)?.label.replace('By ', 'by ')} · FY${selectedYear}`}
            </span>
            <div className="gold-accent" style={{ marginBottom: 0 }} />
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="hbtf-table">
              <thead>
                <tr>
                  <th style={{ textAlign: 'start', width: '2.5rem' }}>#</th>
                  <th style={{ textAlign: 'start' }}>{T.bank}</th>
                  <th style={{ textAlign: 'end' }}>{T.totalAssets}</th>
                  <th style={{ textAlign: 'end' }}>{T.netProfit}</th>
                  <th style={{ textAlign: 'end' }}>{T.deposits}</th>
                  <th style={{ textAlign: 'end' }}>{T.roe}</th>
                  <th style={{ textAlign: 'end' }}>{T.roa}</th>
                  <th style={{ textAlign: 'end' }}>{T.car}</th>
                  <th style={{ textAlign: 'end' }}>{T.npl}</th>
                  <th style={{ textAlign: 'end' }}>{T.year}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={10} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    {isAr ? 'جارٍ التحميل...' : 'Loading...'}
                  </td></tr>
                ) : sorted.map((f, i) => (
                  <tr key={f.id || i} className={i === 0 ? 'rank-1' : ''}>
                    <td>
                      <span style={{
                        fontWeight: 800,
                        fontSize: '0.875rem',
                        color: i === 0 ? 'var(--hbtf-blue)' : 'var(--text-muted)'
                      }}>
                        {i === 0 ? '①' : i + 1}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{bName(f)}</div>
                      <span className={f.banks?.bank_type === 'islamic' ? 'badge-islamic' : 'badge-conventional'}>
                        {f.banks?.bank_type === 'islamic' ? T.islamic : T.conventional}
                      </span>
                    </td>
                    <td style={{ textAlign: 'end', fontWeight: 600 }}>{fmtB(f.total_assets, f.currency)}</td>
                    <td style={{ textAlign: 'end', fontWeight: 600 }}>{fmtB(f.net_profit, f.currency)}</td>
                    <td style={{ textAlign: 'end', color: 'var(--text-secondary)' }}>{fmtB(f.customer_deposits, f.currency)}</td>
                    <td style={{ textAlign: 'end', color: 'var(--text-secondary)' }}>{fmtPct(f.roe)}</td>
                    <td style={{ textAlign: 'end', color: 'var(--text-secondary)' }}>{fmtPct(f.roa)}</td>
                    <td style={{ textAlign: 'end', color: 'var(--text-secondary)' }}>{fmtPct(f.car)}</td>
                    <td style={{ textAlign: 'end', color: 'var(--text-secondary)' }}>{fmtPct(f.npl_ratio)}</td>
                    <td style={{ textAlign: 'end', fontSize: '0.7rem', color: 'var(--text-muted)' }}>{f.fiscal_year}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid var(--border-subtle)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            {T.sourceNote}
          </div>
        </div>
      </div>
    </main>
  )
}
