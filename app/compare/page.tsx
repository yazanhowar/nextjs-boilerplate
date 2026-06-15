'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import ThemeToggle from '../../components/ThemeToggle'
import LangToggle from '../../components/LangToggle'
import { useLang } from '../../lib/LangContext'
import { t } from '../../lib/i18n'

export default function ComparePage() {
  const { lang } = useLang()
  const T = t[lang]
  const isAr = lang === 'ar'

  const [banks, setBanks] = useState<any[]>([])
  const [selected, setSelected] = useState<number[]>([])
  const [financials, setFinancials] = useState<any[]>([])
  const [rates, setRates] = useState<any[]>([])
  const [tariffs, setTariffs] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [year, setYear] = useState(2025)

  useEffect(() => {
    supabase.from('banks').select('*').eq('is_active', true).order('name_en')
      .then(({ data }) => setBanks(data || []))
  }, [])

  useEffect(() => {
    if (!selected.length) return
    setLoading(true)
    Promise.all([
      supabase.from('bank_financials').select('*').in('bank_id', selected).eq('fiscal_year', year),
      supabase.from('bank_rates').select('*').in('bank_id', selected),
      supabase.from('bank_tariffs').select('*').in('bank_id', selected),
      supabase.from('bank_products').select('*').in('bank_id', selected),
    ]).then(([f, r, tar, p]) => {
      setFinancials(f.data || [])
      setRates(r.data || [])
      setTariffs(tar.data || [])
      setProducts(p.data || [])
      setLoading(false)
    })
  }, [selected, year])

  const toggle = (id: number) => setSelected(prev =>
    prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 4 ? [...prev, id] : prev
  )

  const getF = (id: number) => financials.find(f => f.bank_id === id) || {}
  const getR = (id: number) => rates.find(r => r.bank_id === id) || {}
  const getT = (id: number) => tariffs.find(t => t.bank_id === id) || {}
  const getProds = (id: number) => products.filter(p => p.bank_id === id)
  const bName = (b: any) => isAr ? (b.short_name_ar || b.name_ar || b.short_name) : b.short_name

  const fmt = (v: any, suffix = '') => (v != null) ? `${Number(v).toLocaleString()}${suffix}` : '—'
  const fmtB = (v: any) => {
    if (!v) return '—'
    const n = Number(v)
    const p = isAr ? 'د.أ ' : 'JOD '
    if (n >= 1000000) return `${p}${(n/1000000).toFixed(1)}B`
    return `${p}${(n/1000).toFixed(0)}M`
  }
  const fmtP = (v: any) => v != null ? `${Number(v).toFixed(2)}%` : '—'
  const fmtF = (v: any) => v != null ? `JOD ${Number(v).toFixed(2)}` : '—'

  const selectedBanks = banks.filter(b => selected.includes(b.id))

  type RowDef = { label: string; key: string; format: (id: number) => string; section?: string }
  const rows: RowDef[] = [
    { section: `${T.financialHighlights} (${year})`, label: T.totalAssets, key: 'assets', format: id => fmtB(getF(id).total_assets) },
    { label: T.netProfit, key: 'profit', format: id => fmtB(getF(id).net_profit) },
    { label: T.deposits, key: 'deps', format: id => fmtB(getF(id).customer_deposits) },
    { label: T.roe, key: 'roe', format: id => fmtP(getF(id).roe) },
    { label: T.roa, key: 'roa', format: id => fmtP(getF(id).roa) },
    { label: T.car, key: 'car', format: id => fmtP(getF(id).car) },
    { label: T.npl, key: 'npl', format: id => fmtP(getF(id).npl_ratio) },
    { label: isAr ? 'ربحية السهم (فلس)' : 'EPS (fils)', key: 'eps', format: id => fmt(getF(id).eps_fils) },
    { label: isAr ? 'الأرباح الموزعة %' : 'Cash Dividend %', key: 'div', format: id => fmtP(getF(id).dividends_cash_pct) },
    { section: T.depositRatesSection, label: T.savings, key: 'sav', format: id => fmtP(getR(id).saving_rate) },
    { label: isAr ? 'و.آ 3 أشهر' : 'TD 3M', key: 'td3', format: id => fmtP(getR(id).td_3m) },
    { label: isAr ? 'و.آ 12 شهر' : 'TD 12M', key: 'td12', format: id => fmtP(getR(id).td_12m) },
    { label: isAr ? 'دولار 12 شهر' : 'USD 12M', key: 'usd12', format: id => fmtP(getR(id).td_usd_12m) },
    { section: T.lendingRatesSection, label: T.homeLoanMin, key: 'hlmin', format: id => fmtP(getR(id).home_loan_min) },
    { label: T.homeLoanMax, key: 'hlmax', format: id => fmtP(getR(id).home_loan_max) },
    { label: T.personalMin, key: 'plmin', format: id => fmtP(getR(id).personal_loan_min) },
    { label: T.carMin, key: 'almin', format: id => fmtP(getR(id).car_loan_min) },
    { section: T.feesSection, label: isAr ? 'رسوم الصيانة' : 'Account Maintenance', key: 'maint', format: id => fmtF(getT(id).account_maintenance_fee) },
    { label: isAr ? 'الحساب الراكد' : 'Dormant/Month', key: 'dorm', format: id => fmtF(getT(id).dormant_account_fee) },
    { label: isAr ? 'دفتر الشيكات' : 'Cheque Book', key: 'chq', format: id => fmtF(getT(id).cheque_book_fee) },
    { label: isAr ? 'التحويل المحلي' : 'Local Transfer', key: 'ltx', format: id => fmtF(getT(id).local_transfer_fee) },
    { label: isAr ? 'سويفت' : 'SWIFT Flat', key: 'swift', format: id => fmtF(getT(id).swift_transfer_fee_jod) },
    { label: isAr ? '% رسوم القرض' : 'Loan Origination %', key: 'orig', format: id => fmtP(getT(id).loan_origination_fee_pct) },
    { label: isAr ? 'صندوق أمانات (صغير)' : 'Safe Box Small', key: 'sbs', format: id => fmtF(getT(id).safe_box_small_annual) },
    { section: T.productsSection, label: isAr ? 'إجمالي المنتجات' : 'Total Products', key: 'prods', format: id => String(getProds(id).length) },
    { label: isAr ? 'قروض التجزئة' : 'Retail Loans', key: 'rl', format: id => String(getProds(id).filter(p => p.category === 'retail_loan').length) },
    { label: isAr ? 'منتجات الودائع' : 'Deposit Products', key: 'dp', format: id => String(getProds(id).filter(p => p.category === 'retail_deposit').length) },
    { label: isAr ? 'البطاقات' : 'Cards', key: 'cards', format: id => String(getProds(id).filter(p => p.category === 'retail_card').length) },
    { label: isAr ? 'الخدمات الرقمية' : 'Digital Services', key: 'dig', format: id => String(getProds(id).filter(p => p.category === 'digital').length) },
    { label: isAr ? 'المنتجات الإسلامية' : 'Islamic Products', key: 'isl', format: id => String(getProds(id).filter(p => p.is_islamic).length) },
  ]

  const getBest = (row: RowDef) => {
    const lowerBetter = ['maint','dorm','chq','ltx','swift','orig','sbs','npl','plmin','hlmin','almin','hlmax'].includes(row.key)
    const vals = selectedBanks.map(b => ({ id: b.id, n: parseFloat(row.format(b.id).replace(/[^0-9.]/g, '')) })).filter(x => !isNaN(x.n))
    if (!vals.length) return null
    return (lowerBetter ? vals.reduce((a, b) => a.n < b.n ? a : b) : vals.reduce((a, b) => a.n > b.n ? a : b)).id
  }

  return (
    <main className="min-h-screen" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <header className="hbtf-header">
        <div>
          <div className="hbtf-logo-eyebrow">
            <a href="/" style={{ textDecoration: 'none', color: 'inherit' }}>{isAr ? 'الرئيسية' : 'Rapid Intelligence'}</a>{' / '}{T.compare}
          </div>
          <div className="hbtf-logo-title">{T.bankComparison}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <a href="/" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textDecoration: 'none' }}>{isAr ? 'الرئيسية ←' : '← Dashboard'}</a>
          <LangToggle /><ThemeToggle />
        </div>
      </header>

      <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{T.selectBanks}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {[2025, 2024, 2023].map(y => (
                <button key={y} onClick={() => setYear(y)} className={year === y ? 'hbtf-btn hbtf-btn-active' : 'hbtf-btn'}>{y}</button>
              ))}
              {selected.length > 0 && (
                <button onClick={() => setSelected([])}
                  style={{ fontSize: '0.75rem', padding: '0.4rem 0.75rem', borderRadius: '0.5rem', border: '1px solid var(--negative)', color: 'var(--negative)', background: 'none', cursor: 'pointer' }}>
                  {T.clear}
                </button>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {banks.map(b => (
              <button key={b.id} onClick={() => toggle(b.id)}
                style={{
                  padding: '0.5rem 0.875rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  border: '1px solid',
                  cursor: selected.length >= 4 && !selected.includes(b.id) ? 'not-allowed' : 'pointer',
                  borderColor: selected.includes(b.id) ? 'var(--hbtf-blue)' : 'var(--border)',
                  background: selected.includes(b.id) ? 'var(--hbtf-blue)' : 'var(--bg-card)',
                  color: selected.includes(b.id) ? 'white' : selected.length >= 4 ? 'var(--border)' : 'var(--text-secondary)',
                  opacity: selected.length >= 4 && !selected.includes(b.id) ? 0.4 : 1,
                  transition: 'all 0.15s',
                }}>
                {bName(b)}
                {b.bank_type === 'islamic' && <span style={{ color: selected.includes(b.id) ? '#90EE90' : 'var(--positive)', marginInlineStart: '0.25rem' }}>●</span>}
              </button>
            ))}
          </div>
        </div>

        {!selected.length && (
          <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⇄</div>
            <p style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>{T.selectBanksHint}</p>
            <p style={{ fontSize: '0.8rem' }}>{T.selectBanksSubhint}</p>
          </div>
        )}

        {selected.length > 0 && loading && (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>{T.loadingComparison}</div>
        )}

        {selected.length > 0 && !loading && (
          <div className="hbtf-card">
            <div style={{ overflowX: 'auto' }}>
              <table className="hbtf-table">
                <thead>
                  <tr>
                    <th style={{ textAlign: 'start', width: '12rem' }}>{T.metric}</th>
                    {selectedBanks.map(b => (
                      <th key={b.id} style={{ textAlign: 'center' }}>
                        <div style={{ fontWeight: 800 }}>{bName(b)}</div>
                        <span className={b.bank_type === 'islamic' ? 'badge-islamic' : 'badge-conventional'} style={{ marginTop: '0.25rem', display: 'inline-block' }}>
                          {b.bank_type === 'islamic' ? T.islamic : T.conventional}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => {
                    const bestId = getBest(row)
                    return (
                      <>
                        {row.section && (
                          <tr key={`s-${i}`}>
                            <td colSpan={selectedBanks.length + 1} style={{ background: 'var(--bg-primary)', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', padding: '0.5rem 1.25rem' }}>
                              {row.section}
                            </td>
                          </tr>
                        )}
                        <tr key={row.key}>
                          <td style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{row.label}</td>
                          {selectedBanks.map(b => {
                            const val = row.format(b.id)
                            const isBest = bestId === b.id && val !== '—'
                            return (
                              <td key={b.id} style={{ textAlign: 'center', fontWeight: isBest ? 700 : 400, color: isBest ? 'var(--hbtf-blue)' : val === '—' ? 'var(--border)' : 'var(--text-primary)', fontSize: '0.8125rem' }}>
                                {val}{isBest && <span style={{ marginInlineStart: '0.25rem', color: 'var(--gold)' }}>★</span>}
                              </td>
                            )
                          })}
                        </tr>
                      </>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid var(--border-subtle)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              {T.bestNote}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
