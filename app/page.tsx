'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import ThemeToggle from '../components/ThemeToggle'
import LangToggle from '../components/LangToggle'
import { useLang } from '../lib/LangContext'
import { t } from '../lib/i18n'

export default function Dashboard() {
  const { lang } = useLang()
  const T = t[lang]
  const isAr = lang === 'ar'

  const [banks, setBanks] = useState<any[]>([])
  const [tariffs, setTariffs] = useState<any[]>([])
  const [rates, setRates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [{ data: banksData }, { data: tariffsData }, { data: ratesData }] = await Promise.all([
          supabase.from('banks').select('*').eq('is_active', true).order('name_en'),
          supabase.from('bank_tariffs').select('*, banks(name_en, short_name, name_ar, short_name_ar)'),
          supabase.from('bank_rates').select('*, banks(name_en, short_name, name_ar, short_name_ar)'),
        ])
        setBanks(banksData || [])
        setTariffs(tariffsData || [])
        setRates(ratesData || [])
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const bankName = (b: any) => isAr ? (b.short_name_ar || b.name_ar || b.short_name) : b.short_name

  const navLinks = [
    { label: T.search, href: '/search', desc: isAr ? 'ابحث في البنوك والمنتجات والأسعار' : 'Search banks, products, rates, fees', icon: '⌕' },
    { label: T.compare, href: '/compare', desc: isAr ? 'مقارنة البنوك جنباً إلى جنب' : 'Side-by-side bank comparison', icon: '⇄' },
    { label: T.rates, href: '/rates', desc: isAr ? 'مقارنة أسعار الفائدة والودائع' : 'Compare lending & deposit rates', icon: '%' },
    { label: T.tariffs, href: '/tariffs', desc: isAr ? 'رسوم الخدمات في جميع البنوك' : 'Service fees across banks', icon: '₫' },
    { label: T.rankings, href: '/rankings', desc: isAr ? 'الموجودات والأرباح والودائع' : 'Assets, profit, deposits', icon: '↑' },
    { label: T.news, href: '/news', desc: isAr ? 'نتائج الجمعية العمومية والبيانات الصحفية' : 'AGM results & press releases', icon: '◎' },
  ]

  return (
    <main className="min-h-screen" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {/* Header */}
      <header className="hbtf-header">
        <div>
          <div className="hbtf-logo-eyebrow">{T.hbtf}</div>
          <div className="hbtf-logo-title">{T.platform}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            {T.jordanBankingSector} · {new Date().toLocaleDateString(isAr ? 'ar-JO' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
          <LangToggle />
          <ThemeToggle />
        </div>
      </header>

      <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>

        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
          {[
            { label: T.banksTracked, value: '15' },
            { label: T.tariffRecords, value: loading ? '—' : String(tariffs.length) },
            { label: T.rateRecords, value: loading ? '—' : String(rates.length) },
            { label: T.dataSources, value: '40+' },
          ].map(s => (
            <div key={s.label} className="hbtf-stat">
              <div className="hbtf-stat-value">{s.value}</div>
              <div className="hbtf-stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.5rem' }}>

          {/* Banks Table */}
          <div className="hbtf-card">
            <div className="hbtf-card-header">
              <span className="hbtf-card-label">{T.allBanks}</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{T.jordanBankingSector}</span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="hbtf-table">
                <thead>
                  <tr>
                    <th style={{ textAlign: 'start' }}>{T.bank}</th>
                    <th style={{ textAlign: 'start' }}>{T.type}</th>
                    <th style={{ textAlign: 'start' }}>{T.website}</th>
                    <th style={{ textAlign: 'center' }}>{T.tariffData}</th>
                    <th style={{ textAlign: 'center' }}>{T.rateData}</th>
                  </tr>
                </thead>
                <tbody>
                  {banks.map(b => {
                    const hasTariff = tariffs.some(tar => tar.bank_id === b.id)
                    const hasRate = rates.some(r => r.bank_id === b.id)
                    return (
                      <tr key={b.id}>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: '0.8125rem' }}>{isAr ? (b.short_name_ar || b.name_ar) : b.short_name}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>{isAr ? b.name_ar : b.name_en}</div>
                        </td>
                        <td>
                          <span className={b.bank_type === 'islamic' ? 'badge-islamic' : 'badge-conventional'}>
                            {b.bank_type === 'islamic' ? T.islamic : T.conventional}
                          </span>
                        </td>
                        <td>
                          <a href={`https://${b.website}`} target="_blank" rel="noopener noreferrer"
                            style={{ fontSize: '0.75rem', color: 'var(--hbtf-blue)', textDecoration: 'none' }}
                            className="dark:text-[#CEBA95]">
                            {b.website}
                          </a>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {hasTariff
                            ? <span style={{ fontSize: '0.7rem', color: 'var(--positive)' }}>✓ {T.available}</span>
                            : <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>— {T.pending}</span>}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {hasRate
                            ? <span style={{ fontSize: '0.7rem', color: 'var(--positive)' }}>✓ {T.available}</span>
                            : <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>— {T.pending}</span>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* Coverage */}
            <div className="hbtf-card">
              <div className="hbtf-card-header">
                <span className="hbtf-card-label">{T.tariffCoverage}</span>
              </div>
              <div style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <span className="hbtf-stat-value" style={{ fontSize: '2.5rem' }}>{tariffs.length}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{T.ofBanks}</span>
                </div>
                <div className="hbtf-progress" style={{ marginBottom: '1rem' }}>
                  <div className="hbtf-progress-fill" style={{ width: `${Math.min((tariffs.length / 15) * 100, 100)}%` }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {tariffs.slice(0, 7).map(tar => (
                    <div key={tar.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {isAr ? (tar.banks?.short_name_ar || tar.banks?.name_ar || tar.banks?.short_name) : tar.banks?.short_name}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--positive)' }}>✓</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="hbtf-card">
              <div className="hbtf-card-header">
                <span className="hbtf-card-label">{T.quickNavigation}</span>
              </div>
              <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                {navLinks.map(link => (
                  <a key={link.href} href={link.href} className="hbtf-nav-link">
                    <div className="hbtf-nav-link-title">{link.label}</div>
                    <div className="hbtf-nav-link-desc">{link.desc}</div>
                  </a>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </main>
  )
}
