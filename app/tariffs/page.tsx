'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import ThemeToggle from '../../components/ThemeToggle'
import LangToggle from '../../components/LangToggle'
import { useLang } from '../../lib/LangContext'
import { t } from '../../lib/i18n'

export default function TariffsPage() {
  const { lang } = useLang()
  const T = t[lang]
  const isAr = lang === 'ar'

  const [tariffs, setTariffs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('bank_tariffs')
      .select('*, banks(name_en, short_name, bank_type, name_ar, short_name_ar)')
      .order('account_maintenance_fee', { ascending: true, nullsFirst: false })
      .then(({ data }) => { setTariffs(data || []); setLoading(false) })
  }, [])

  const bName = (t: any) => isAr
    ? (t.banks?.short_name_ar || t.banks?.name_ar || t.banks?.short_name)
    : t.banks?.short_name

  const fmtFee = (v: any) => v != null ? Number(v).toFixed(2) : '—'
  const fmtPct = (v: any) => v != null ? `${Number(v).toFixed(2)}%` : '—'

  const getBest = (col: string) => {
    const vals = tariffs.map(t => t[col]).filter((v): v is number => v != null && v > 0)
    return vals.length ? Math.min(...vals) : null
  }

  const cell = (val: any, best: any, isPct = false) => {
    if (val == null) return { value: '—', isZero: false, isBest: false }
    const n = Number(val)
    const isBest = best !== null && n === best && n > 0
    const isZero = n === 0
    return { value: isPct ? fmtPct(val) : fmtFee(val), isBest, isZero }
  }

  const Section = ({ title }: { title: string }) => (
    <div style={{
      background: 'var(--bg-table-head)',
      borderBottom: '1px solid var(--border)',
      padding: '0.5rem 1.5rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
    }}>
      <span style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
        {title}
      </span>
      <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', opacity: 0.6 }}>
        {isAr ? 'الأزرق = الأدنى' : 'Blue = Lowest'}
      </span>
    </div>
  )

  const TH = ({ children, align = 'end' }: { children: React.ReactNode, align?: string }) => (
    <th style={{ textAlign: align as any, padding: '0.625rem 1.25rem', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', background: 'var(--bg-table-head)', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>
      {children}
    </th>
  )

  const TD = ({ val, best, isPct = false }: { val: any, best: any, isPct?: boolean }) => {
    const { value, isBest, isZero } = cell(val, best, isPct)
    return (
      <td style={{
        textAlign: 'end',
        padding: '0.75rem 1.25rem',
        fontWeight: isBest ? 700 : 400,
        fontSize: '0.8125rem',
        color: isZero ? 'var(--positive)' : isBest ? 'var(--accent)' : value === '—' ? 'var(--border)' : 'var(--text-primary)',
        borderBottom: '1px solid var(--border-subtle)',
      }}>
        {value}
      </td>
    )
  }

  const BankCell = ({ tar }: { tar: any }) => (
    <td style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--border-subtle)' }}>
      <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--text-primary)' }}>{bName(tar)}</div>
      <span className={tar.banks?.bank_type === 'islamic' ? 'badge-islamic' : 'badge-conventional'}>
        {tar.banks?.bank_type === 'islamic' ? T.islamic : T.conventional}
      </span>
    </td>
  )

  const SourceCell = ({ tar }: { tar: any }) => (
    <td style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--border-subtle)', textAlign: 'end' }}>
      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
        {tar.effective_date?.slice(0, 10)?.split('-').reverse().join('/')}
      </div>
      {tar.source_url && (
        <a href={tar.source_url} target="_blank" rel="noopener noreferrer"
          style={{ fontSize: '0.65rem', color: 'var(--accent)', textDecoration: 'none' }}>
          {T.viewSource} ↗
        </a>
      )}
    </td>
  )

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text-primary)' }}>
      <header className="hbtf-header">
        <div>
          <div className="hbtf-logo-eyebrow">
            <a href="/">{isAr ? 'الرئيسية' : 'Rapid Intelligence'}</a>{' / '}{T.tariffs}
          </div>
          <div className="hbtf-logo-title">{T.feeComparison}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <a href="/" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textDecoration: 'none' }}>
            {isAr ? 'الرئيسية ←' : '← Dashboard'}
          </a>
          <LangToggle /><ThemeToggle />
        </div>
      </header>

      <div style={{ padding: '1.75rem 2rem', maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
            {isAr ? 'جارٍ التحميل...' : 'Loading...'}
          </div>
        ) : (
          <>
            {/* ACCOUNT FEES */}
            <div className="hbtf-card">
              <Section title={isAr ? 'رسوم الحساب (دينار أردني)' : 'Account Fees (JOD)'} />
              <div style={{ overflowX: 'auto' }}>
                <table className="hbtf-table">
                  <thead>
                    <tr>
                      <TH align="start">{T.bank}</TH>
                      <TH>{T.maintenance}</TH>
                      <TH>{T.dormantMo}</TH>
                      <TH>{T.statementPg}</TH>
                      <TH align="end">{T.asOf} / {T.source}</TH>
                    </tr>
                  </thead>
                  <tbody>
                    {tariffs.map(tar => (
                      <tr key={tar.id} style={{ transition: 'background 0.1s' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-row-hover)')}
                        onMouseLeave={e => (e.currentTarget.style.background = '')}>
                        <BankCell tar={tar} />
                        <TD val={tar.account_maintenance_fee} best={getBest('account_maintenance_fee')} />
                        <TD val={tar.dormant_account_fee} best={getBest('dormant_account_fee')} />
                        <TD val={tar.statement_fee} best={getBest('statement_fee')} />
                        <SourceCell tar={tar} />
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* CARD FEES */}
            <div className="hbtf-card">
              <Section title={isAr ? 'رسوم البطاقات (دينار أردني سنوياً)' : 'Card Fees (JOD Annual)'} />
              <div style={{ overflowX: 'auto' }}>
                <table className="hbtf-table">
                  <thead>
                    <tr>
                      <TH align="start">{T.bank}</TH>
                      <TH>{T.classic}</TH>
                      <TH>{T.gold}</TH>
                      <TH>{T.platinum}</TH>
                      <TH align="end">{T.asOf} / {T.source}</TH>
                    </tr>
                  </thead>
                  <tbody>
                    {tariffs.map(tar => (
                      <tr key={tar.id}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-row-hover)')}
                        onMouseLeave={e => (e.currentTarget.style.background = '')}>
                        <BankCell tar={tar} />
                        <TD val={tar.credit_card_annual_fee_classic} best={getBest('credit_card_annual_fee_classic')} />
                        <TD val={tar.credit_card_annual_fee_gold} best={getBest('credit_card_annual_fee_gold')} />
                        <TD val={tar.credit_card_annual_fee_platinum} best={getBest('credit_card_annual_fee_platinum')} />
                        <SourceCell tar={tar} />
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* CHEQUES & TRANSFERS */}
            <div className="hbtf-card">
              <Section title={isAr ? 'الشيكات والتحويلات (دينار أردني)' : 'Cheques & Transfers (JOD)'} />
              <div style={{ overflowX: 'auto' }}>
                <table className="hbtf-table">
                  <thead>
                    <tr>
                      <TH align="start">{T.bank}</TH>
                      <TH>{T.chequebook}</TH>
                      <TH>{T.stopPayment}</TH>
                      <TH>{T.localTransfer}</TH>
                      <TH>{T.swiftFlat}</TH>
                      <TH align="end">{T.asOf} / {T.source}</TH>
                    </tr>
                  </thead>
                  <tbody>
                    {tariffs.map(tar => (
                      <tr key={tar.id}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-row-hover)')}
                        onMouseLeave={e => (e.currentTarget.style.background = '')}>
                        <BankCell tar={tar} />
                        <TD val={tar.cheque_book_fee} best={getBest('cheque_book_fee')} />
                        <TD val={tar.stop_payment_fee} best={getBest('stop_payment_fee')} />
                        <TD val={tar.local_transfer_fee} best={getBest('local_transfer_fee')} />
                        <TD val={tar.swift_transfer_fee_jod} best={getBest('swift_transfer_fee_jod')} />
                        <SourceCell tar={tar} />
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* LOANS */}
            <div className="hbtf-card">
              <Section title={isAr ? 'القروض' : 'Loans'} />
              <div style={{ overflowX: 'auto' }}>
                <table className="hbtf-table">
                  <thead>
                    <tr>
                      <TH align="start">{T.bank}</TH>
                      <TH>{T.origination}</TH>
                      <TH>{T.earlySettlement}</TH>
                      <TH align="end">{T.asOf} / {T.source}</TH>
                    </tr>
                  </thead>
                  <tbody>
                    {tariffs.map(tar => (
                      <tr key={tar.id}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-row-hover)')}
                        onMouseLeave={e => (e.currentTarget.style.background = '')}>
                        <BankCell tar={tar} />
                        <TD val={tar.loan_origination_fee_pct} best={getBest('loan_origination_fee_pct')} isPct />
                        <TD val={tar.early_settlement_fee_pct} best={getBest('early_settlement_fee_pct')} isPct />
                        <SourceCell tar={tar} />
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SAFE DEPOSIT BOXES */}
            <div className="hbtf-card">
              <Section title={isAr ? 'صناديق الأمانات (دينار أردني سنوياً)' : 'Safe Deposit Boxes (JOD Annual)'} />
              <div style={{ overflowX: 'auto' }}>
                <table className="hbtf-table">
                  <thead>
                    <tr>
                      <TH align="start">{T.bank}</TH>
                      <TH>{T.small}</TH>
                      <TH>{T.medium}</TH>
                      <TH>{T.large}</TH>
                      <TH align="end">{T.asOf} / {T.source}</TH>
                    </tr>
                  </thead>
                  <tbody>
                    {tariffs.map(tar => (
                      <tr key={tar.id}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-row-hover)')}
                        onMouseLeave={e => (e.currentTarget.style.background = '')}>
                        <BankCell tar={tar} />
                        <TD val={tar.safe_box_small_annual} best={getBest('safe_box_small_annual')} />
                        <TD val={tar.safe_box_medium_annual} best={getBest('safe_box_medium_annual')} />
                        <TD val={tar.safe_box_large_annual} best={getBest('safe_box_large_annual')} />
                        <SourceCell tar={tar} />
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{T.tariffSourceNote}</p>
          </>
        )}
      </div>
    </main>
  )
}
