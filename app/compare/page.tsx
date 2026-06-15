'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import ThemeToggle from '../../components/ThemeToggle'

export default function ComparePage() {
  const [banks, setBanks] = useState<any[]>([])
  const [selected, setSelected] = useState<number[]>([])
  const [financials, setFinancials] = useState<any[]>([])
  const [rates, setRates] = useState<any[]>([])
  const [tariffs, setTariffs] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [year, setYear] = useState(2025)

  useEffect(() => {
    supabase.from('banks').select('*').eq('is_active', true).order('name_en').then(({ data }) => setBanks(data || []))
  }, [])

  useEffect(() => {
    if (selected.length === 0) return
    setLoading(true)
    Promise.all([
      supabase.from('bank_financials').select('*').in('bank_id', selected).eq('fiscal_year', year),
      supabase.from('bank_rates').select('*').in('bank_id', selected),
      supabase.from('bank_tariffs').select('*').in('bank_id', selected),
      supabase.from('bank_products').select('*').in('bank_id', selected),
    ]).then(([f, r, t, p]) => {
      setFinancials(f.data || [])
      setRates(r.data || [])
      setTariffs(t.data || [])
      setProducts(p.data || [])
      setLoading(false)
    })
  }, [selected, year])

  const toggleBank = (id: number) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 4 ? [...prev, id] : prev)
  }

  const selectedBanks = banks.filter(b => selected.includes(b.id))
  const getF = (bankId: number) => financials.find(f => f.bank_id === bankId) || {}
  const getR = (bankId: number) => rates.find(r => r.bank_id === bankId) || {}
  const getT = (bankId: number) => tariffs.find(t => t.bank_id === bankId) || {}
  const getProducts = (bankId: number) => products.filter(p => p.bank_id === bankId)

  const fmt = (v: any, suffix = '') => (v !== null && v !== undefined) ? `${Number(v).toLocaleString()}${suffix}` : '—'
  const fmtB = (v: any) => {
    if (!v) return '—'
    const n = Number(v)
    if (n >= 1000000) return `JOD ${(n / 1000000).toFixed(1)}B`
    if (n >= 1000) return `JOD ${(n / 1000).toFixed(0)}M`
    return `JOD ${n}`
  }
  const fmtPct = (v: any) => v !== null && v !== undefined ? `${Number(v).toFixed(2)}%` : '—'
  const fmtFee = (v: any) => v !== null && v !== undefined ? `JOD ${Number(v).toFixed(2)}` : '—'

  const rows: { label: string; key: string; format: (bankId: number) => string; section?: string }[] = [
    // Financial
    { section: `Financial Highlights (FY${year})`, label: 'Total Assets', key: 'assets', format: id => fmtB(getF(id).total_assets) },
    { label: 'Net Profit', key: 'profit', format: id => fmtB(getF(id).net_profit) },
    { label: 'Customer Deposits', key: 'deposits', format: id => fmtB(getF(id).customer_deposits) },
    { label: 'Net Loans', key: 'loans', format: id => fmtB(getF(id).net_loans) },
    { label: 'Shareholders Equity', key: 'equity', format: id => fmtB(getF(id).shareholders_equity) },
    { label: 'ROE', key: 'roe', format: id => fmtPct(getF(id).roe) },
    { label: 'ROA', key: 'roa', format: id => fmtPct(getF(id).roa) },
    { label: 'CAR', key: 'car', format: id => fmtPct(getF(id).car) },
    { label: 'NPL Ratio', key: 'npl', format: id => fmtPct(getF(id).npl_ratio) },
    { label: 'EPS (fils)', key: 'eps', format: id => fmt(getF(id).eps_fils) },
    { label: 'Cash Dividend %', key: 'div', format: id => fmtPct(getF(id).dividends_cash_pct) },
    // Deposit Rates
    { section: 'Deposit Rates (JOD % p.a.)', label: 'Savings Rate', key: 'sav', format: id => fmtPct(getR(id).saving_rate) },
    { label: 'TD 1 Month', key: 'td1', format: id => fmtPct(getR(id).td_1m) },
    { label: 'TD 3 Months', key: 'td3', format: id => fmtPct(getR(id).td_3m) },
    { label: 'TD 6 Months', key: 'td6', format: id => fmtPct(getR(id).td_6m) },
    { label: 'TD 12 Months', key: 'td12', format: id => fmtPct(getR(id).td_12m) },
    { label: 'USD TD 3M', key: 'usd3', format: id => fmtPct(getR(id).td_usd_3m) },
    { label: 'USD TD 12M', key: 'usd12', format: id => fmtPct(getR(id).td_usd_12m) },
    // Lending Rates
    { section: 'Lending Rates (% p.a.)', label: 'Home Loan Min', key: 'hlmin', format: id => fmtPct(getR(id).home_loan_min) },
    { label: 'Home Loan Max', key: 'hlmax', format: id => fmtPct(getR(id).home_loan_max) },
    { label: 'Personal Loan Min', key: 'plmin', format: id => fmtPct(getR(id).personal_loan_min) },
    { label: 'Personal Loan Max', key: 'plmax', format: id => fmtPct(getR(id).personal_loan_max) },
    { label: 'Auto Loan Min', key: 'almin', format: id => fmtPct(getR(id).car_loan_min) },
    { label: 'Auto Loan Max', key: 'almax', format: id => fmtPct(getR(id).car_loan_max) },
    // Fees
    { section: 'Fees & Charges (JOD)', label: 'Account Maintenance', key: 'maint', format: id => fmtFee(getT(id).account_maintenance_fee) },
    { label: 'Dormant Account/mo', key: 'dorm', format: id => fmtFee(getT(id).dormant_account_fee) },
    { label: 'Statement per page', key: 'stmt', format: id => fmtFee(getT(id).statement_fee) },
    { label: 'Cheque Book', key: 'chq', format: id => fmtFee(getT(id).cheque_book_fee) },
    { label: 'Stop Payment', key: 'stop', format: id => fmtFee(getT(id).stop_payment_fee) },
    { label: 'Local Transfer', key: 'ltx', format: id => fmtFee(getT(id).local_transfer_fee) },
    { label: 'SWIFT Transfer (flat)', key: 'swift', format: id => fmtFee(getT(id).swift_transfer_fee_jod) },
    { label: 'Loan Origination %', key: 'orig', format: id => fmtPct(getT(id).loan_origination_fee_pct) },
    { label: 'Early Settlement %', key: 'sett', format: id => fmtPct(getT(id).early_settlement_fee_pct) },
    { label: 'Safe Box Small', key: 'sbs', format: id => fmtFee(getT(id).safe_box_small_annual) },
    { label: 'Safe Box Large', key: 'sbl', format: id => fmtFee(getT(id).safe_box_large_annual) },
    // Products count
    { section: 'Products', label: 'Total Products', key: 'prods', format: id => String(getProducts(id).length) },
    { label: 'Retail Loans', key: 'rl', format: id => String(getProducts(id).filter(p => p.category === 'retail_loan').length) },
    { label: 'Deposit Products', key: 'dp', format: id => String(getProducts(id).filter(p => p.category === 'retail_deposit').length) },
    { label: 'Cards', key: 'cards', format: id => String(getProducts(id).filter(p => p.category === 'retail_card').length) },
    { label: 'Digital Services', key: 'dig', format: id => String(getProducts(id).filter(p => p.category === 'digital').length) },
    { label: 'Islamic Products', key: 'isl', format: id => String(getProducts(id).filter(p => p.is_islamic).length) },
  ]

  // Find best value per row for highlighting
  const getBest = (row: typeof rows[0], ids: number[]) => {
    const vals = ids.map(id => {
      const v = row.format(id)
      const n = parseFloat(v.replace(/[^0-9.]/g, ''))
      return { id, n, v }
    }).filter(x => !isNaN(x.n) && x.v !== '—')
    if (vals.length === 0) return null
    // Higher is better for most metrics; lower is better for fees and NPL and loan rates
    const lowerBetter = ['maint','dorm','stmt','chq','stop','ltx','swift','orig','sett','sbs','sbl','npl','plmin','plmax','hlmin','hlmax','almin','almax'].includes(row.key)
    return lowerBetter ? vals.reduce((a, b) => a.n < b.n ? a : b).id : vals.reduce((a, b) => a.n > b.n ? a : b).id
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-[#0a0f1e] text-gray-900 dark:text-white transition-colors">
      <header className="border-b border-gray-200 dark:border-[#1f2937] bg-white dark:bg-[#111827] px-8 py-5 flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold tracking-widest text-blue-600 dark:text-[#4a9eff] uppercase mb-1">
            <a href="/" className="hover:underline">Rapid Intelligence</a> / Compare
          </div>
          <h1 className="text-xl font-bold">Bank Comparison</h1>
        </div>
        <div className="flex items-center gap-4">
          <a href="/" className="text-xs text-gray-400 hover:text-blue-600 dark:hover:text-[#4a9eff]">← Dashboard</a>
          <ThemeToggle />
        </div>
      </header>

      <div className="px-8 py-6 max-w-[1400px] mx-auto">

        {/* Bank Selector */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-500 dark:text-[#9ca3af]">Select up to 4 banks to compare</p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Year:</span>
              {[2025, 2024, 2023].map(y => (
                <button key={y} onClick={() => setYear(y)}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${year === y ? 'bg-blue-600 text-white dark:bg-[#4a9eff] dark:text-black' : 'bg-white dark:bg-[#111827] border border-gray-200 dark:border-[#1f2937] text-gray-500 dark:text-gray-400'}`}>
                  {y}
                </button>
              ))}
              {selected.length > 0 && (
                <button onClick={() => setSelected([])} className="ml-2 px-3 py-1 rounded text-xs text-red-500 border border-red-200 dark:border-red-900 hover:bg-red-50 dark:hover:bg-[#2d1a1a] transition-colors">
                  Clear
                </button>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {banks.map(b => (
              <button key={b.id} onClick={() => toggleBank(b.id)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors border ${
                  selected.includes(b.id)
                    ? 'bg-blue-600 border-blue-600 text-white dark:bg-[#4a9eff] dark:border-[#4a9eff] dark:text-black'
                    : selected.length >= 4
                    ? 'bg-gray-50 dark:bg-[#0a0f1e] border-gray-200 dark:border-[#1f2937] text-gray-300 dark:text-[#374151] cursor-not-allowed'
                    : 'bg-white dark:bg-[#111827] border-gray-200 dark:border-[#1f2937] text-gray-700 dark:text-gray-300 hover:border-blue-400 dark:hover:border-[#4a9eff]'
                }`}>
                {b.short_name}
                {b.bank_type === 'islamic' && <span className="ml-1 text-green-500">●</span>}
              </button>
            ))}
          </div>
        </div>

        {selected.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <p className="text-base mb-2">Select banks above to start comparing</p>
            <p className="text-sm">Up to 4 banks side by side · Financial data, rates, fees, and products</p>
          </div>
        )}

        {selected.length > 0 && loading && (
          <div className="text-center py-16 text-gray-400 text-sm">Loading comparison data...</div>
        )}

        {selected.length > 0 && !loading && (
          <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-[#1f2937] rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-[#1f2937] bg-gray-50 dark:bg-[#0a0f1e]">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider w-48">Metric</th>
                    {selectedBanks.map(b => (
                      <th key={b.id} className="px-6 py-4 text-center">
                        <div className="text-sm font-bold text-gray-900 dark:text-white">{b.short_name}</div>
                        <div className="flex items-center justify-center gap-1 mt-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${b.bank_type === 'islamic' ? 'bg-green-100 text-green-700 dark:bg-[#1a2e1a] dark:text-[#22c55e]' : 'bg-blue-100 text-blue-700 dark:bg-[#1e3a5f] dark:text-[#4a9eff]'}`}>
                            {b.bank_type === 'islamic' ? 'Islamic' : 'Conventional'}
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => {
                    const bestId = getBest(row, selected)
                    return (
                      <>
                        {row.section && (
                          <tr key={`section-${i}`} className="bg-gray-50 dark:bg-[#0d1117]">
                            <td colSpan={selected.length + 1} className="px-6 py-2 text-xs font-semibold text-gray-500 dark:text-[#4b5563] uppercase tracking-wider">{row.section}</td>
                          </tr>
                        )}
                        <tr key={row.key} className="border-b border-gray-50 dark:border-[#1f2937] hover:bg-gray-50 dark:hover:bg-[#0d1117] transition-colors">
                          <td className="px-6 py-3 text-xs text-gray-500 dark:text-[#6b7280]">{row.label}</td>
                          {selectedBanks.map(b => {
                            const val = row.format(b.id)
                            const isBest = bestId === b.id && val !== '—'
                            return (
                              <td key={b.id} className={`px-6 py-3 text-center text-sm font-medium ${isBest ? 'text-blue-600 dark:text-[#4a9eff]' : val === '—' ? 'text-gray-300 dark:text-[#374151]' : 'text-gray-800 dark:text-gray-200'}`}>
                                {val}
                                {isBest && <span className="ml-1 text-xs">★</span>}
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
            <div className="px-6 py-3 border-t border-gray-100 dark:border-[#1f2937] text-xs text-gray-400 dark:text-[#4b5563]">
              ★ Best value in category · Blue = highest (or lowest for fees/rates) · Source: Audited annual reports, official bank PDFs
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
