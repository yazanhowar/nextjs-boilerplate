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
    supabase.from('bank_rates').select('*, banks(name_en, short_name, bank_type, name_ar, short_name_ar)')
      .order('saving_rate', { ascending: false })
      .then(({ data }) => { setRates(data || []); setLoading(false) })
  }, [])

  const fmtPct = (v: any) => v != null ? `${Number(v).toFixed(2)}%` : '—'
  const bName = (r: any) => isAr ? (r.banks?.short_name_ar || r.banks?.name_ar || r.banks?.short_name) : r.banks?.short_name

  const getBest = (col: string, highGood = true) => {
    const vals = rates.map(r => r[col]).filter((v): v is number => v != null)
    if (!vals.length) return null
    return highGood ? Math.max(...vals) : Math.min(...vals)
  }

  const cellStyle = (val: any, best: any) => {
    if (val == null) return { color: 'var(--border)', textAlign: 'end' as const }
    if (val === best) return { color: 'var(--positive)', fontWeight: 600, textAlign: 'end' as const }
    return { color: 'var(--text-secondary)', textAlign: 'end' as const }
  }

  const depositCols = [
    { key: 'saving_rate', label: T.savings },
    { key: 'td_1m', label: isAr ? 'و.آ 1ش' : 'TD 1M' },
    { key: 'td_3m', label: isAr ? 'و.آ 3ش' : 'TD 3M' },
    { key: 'td_6m', label: isAr ? 'و.آ 6ش' : 'TD 6M' },
    { key: 'td_12m', label: isAr ? 'و.آ 12ش' : 'TD 12M' },
    { key: 'td_usd_3m', label: isAr ? 'دولار 3ش' : 'USD 3M' },
    { key: 'td_usd_6m', label: isAr ? 'دولار 6ش' : 'USD 6M' },
    { key: 'td_usd_12m', label: isAr ? 'دولار 12ش' : 'USD 12M' },
  ]

  const lendCols = [
    { key: 'home_loan_min', label: T.homeLoanMin, highGood: false },
    { key: 'home_loan_max', label: T.homeLoanMax, highGood: false },
    { key: 'personal_loan_min', label: T.personalMin, highGood: false },
    { key: 'personal_loan_max', label: T.personalMax, highGood: false },
    { key: 'car_loan_min', label: T.carMin, highGood: false },
    { key: 'car_loan_max', label: T.carMax, highGood: false },
  ]

  return (
    <main className="min-h-screen" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <header className="hbtf-header">
        <div>
          <div className="hbtf-logo-eyebrow">
            <a href="/" style={{ textDecoration: 'none', color: 'inherit' }}>{isAr ? 'الرئيسية' : 'Rapid Intelligence'}</a>{' / '}{T.rates}
          </div>
          <div className="hbtf-logo-title">{T.rateComparison}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <a href="/" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textDecoration: 'none' }}>{isAr ? 'الرئيسية ←' : '← Dashboard'}</a>
          <LangToggle /><ThemeToggle />
        </div>
      </header>

      <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

        {/* Deposit Rates */}
        <div className="hbtf-card">
          <div className="hbtf-card-header">
            <span className="hbtf-card-label">{T.depositRates}</span>
            <div className="gold-accent" style={{ marginBottom: 0 }} />
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="hbtf-table">
              <thead>
                <tr>
                  <th style={{ textAlign: 'start' }}>{T.bank}</th>
                  {depositCols.map(c => <th key={c.key} style={{ textAlign: 'end' }}>{c.label}</th>)}
                  <th style={{ textAlign: 'end' }}>{T.asOf}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={depositCols.length + 2} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    {isAr ? 'جارٍ التحميل...' : 'Loading...'}
                  </td></tr>
                ) : rates.map(r => (
                  <tr key={r.id}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '0.8125rem' }}>{bName(r)}</div>
                      <span className={r.banks?.bank_type === 'islamic' ? 'badge-islamic' : 'badge-conventional'}>
                        {r.banks?.bank_type === 'islamic' ? T.islamic : T.conventional}
                      </span>
                    </td>
                    {depositCols.map(c => (
                      <td key={c.key} style={cellStyle(r[c.key], getBest(c.key, true))}>
                        {fmtPct(r[c.key])}
                      </td>
                    ))}
                    <td style={{ textAlign: 'end', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {r.effective_date?.slice(0,10)?.split('-').reverse().join('/')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Lending Rates */}
        <div className="hbtf-card">
          <div className="hbtf-card-header">
            <span className="hbtf-card-label">{T.lendingRates}</span>
            <div className="gold-accent" style={{ marginBottom: 0 }} />
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="hbtf-table">
              <thead>
                <tr>
                  <th style={{ textAlign: 'start' }}>{T.bank}</th>
                  {lendCols.map(c => <th key={c.key} style={{ textAlign: 'end' }}>{c.label}</th>)}
                  <th style={{ textAlign: 'end' }}>{T.asOf}</th>
                </tr>
              </thead>
              <tbody>
                {rates.map(r => (
                  <tr key={r.id}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '0.8125rem' }}>{bName(r)}</div>
                      <span className={r.banks?.bank_type === 'islamic' ? 'badge-islamic' : 'badge-conventional'}>
                        {r.banks?.bank_type === 'islamic' ? T.islamic : T.conventional}
                      </span>
                    </td>
                    {lendCols.map(c => (
                      <td key={c.key} style={cellStyle(r[c.key], getBest(c.key, false))}>
                        {fmtPct(r[c.key])}
                      </td>
                    ))}
                    <td style={{ textAlign: 'end', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {r.effective_date?.slice(0,10)?.split('-').reverse().join('/')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{T.rateSourceNote}</p>
      </div>
    </main>
  )
}
