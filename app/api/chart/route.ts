// app/api/chart/route.ts
// AI-powered chart generation — parses natural language prompts,
// queries Supabase for real data, returns structured chart spec.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { BANKS } from '@/lib/banks-config'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ── Keyword matchers ──────────────────────────────────────────────────────────
function detectBanks(prompt: string): number[] {
  const lower = prompt.toLowerCase()
  const found: number[] = []
  for (const bank of BANKS) {
    if (
      lower.includes(bank.name.toLowerCase()) ||
      lower.includes(bank.shortName.toLowerCase()) ||
      lower.includes(bank.ticker.toLowerCase())
    ) {
      found.push(bank.id)
    }
  }
  // If none found, return all (sector-wide)
  return found.length > 0 ? found : BANKS.map(b => b.id)
}

function detectMetric(prompt: string): { column: string; label: string } {
  const lower = prompt.toLowerCase()
  if (lower.includes('profit') || lower.includes('income') || lower.includes('earnings'))
    return { column: 'net_profit', label: 'Net Profit (JOD M)' }
  if (lower.includes('asset'))
    return { column: 'total_assets', label: 'Total Assets (JOD M)' }
  if (lower.includes('deposit'))
    return { column: 'total_deposits', label: 'Customer Deposits (JOD M)' }
  if (lower.includes('loan') || lower.includes('credit facilit'))
    return { column: 'net_loans', label: 'Net Loans (JOD M)' }
  if (lower.includes('roe') || lower.includes('return on equity'))
    return { column: 'roe', label: 'Return on Equity (%)' }
  if (lower.includes('roa') || lower.includes('return on asset'))
    return { column: 'roa', label: 'Return on Assets (%)' }
  if (lower.includes('capital') || lower.includes('car'))
    return { column: 'car', label: 'Capital Adequacy Ratio (%)' }
  if (lower.includes('equity'))
    return { column: 'total_equity', label: "Shareholders' Equity (JOD M)" }
  if (lower.includes('revenue') || lower.includes('interest income'))
    return { column: 'net_interest_income', label: 'Net Interest Income (JOD M)' }
  // Default
  return { column: 'net_profit', label: 'Net Profit (JOD M)' }
}

function detectChartType(prompt: string): 'bar' | 'line' {
  const lower = prompt.toLowerCase()
  if (lower.includes('trend') || lower.includes('growth') || lower.includes('over time') || lower.includes('year'))
    return 'line'
  return 'bar'
}

function detectYears(prompt: string): number[] {
  const lower = prompt.toLowerCase()
  if (lower.includes('3 year') || lower.includes('three year') || lower.includes('3-year'))
    return [2022, 2023, 2024]
  if (lower.includes('2 year') || lower.includes('two year'))
    return [2023, 2024]
  if (lower.includes('2025')) return [2023, 2024, 2025]
  return [2023, 2024]
}

// ── Rate/fee queries ──────────────────────────────────────────────────────────
async function handleRatesQuery(prompt: string, bankIds: number[]) {
  const lower = prompt.toLowerCase()

  // Credit card fees
  if (lower.includes('credit card')) {
    const { data } = await supabase
      .from('bank_tariffs')
      .select('bank_id, credit_card_annual_fee_classic, credit_card_annual_fee_gold, credit_card_annual_fee_platinum')
      .in('bank_id', bankIds)

    if (!data?.length) return null

    const chartData = data.map(r => {
      const bank = BANKS.find(b => b.id === r.bank_id)
      return {
        name: bank?.shortName || `Bank ${r.bank_id}`,
        'Classic Card (JOD/yr)': r.credit_card_annual_fee_classic || 0,
        'Gold Card (JOD/yr)': r.credit_card_annual_fee_gold || 0,
        'Platinum Card (JOD/yr)': r.credit_card_annual_fee_platinum || 0,
      }
    })

    // Find cheapest/most expensive for insight
    const cheapest = [...chartData].sort((a, b) => a['Classic Card (JOD/yr)'] - b['Classic Card (JOD/yr)'])[0]
    const hbtf = chartData.find(d => d.name === 'HBTF')

    return {
      title: 'Annual Credit Card Fees — Bank Comparison',
      type: 'bar',
      data: chartData,
      series: ['Classic Card (JOD/yr)', 'Gold Card (JOD/yr)', 'Platinum Card (JOD/yr)'],
      insight: hbtf
        ? `HBTF's classic card fee is JOD ${hbtf['Classic Card (JOD/yr)']}. ${
            cheapest.name !== 'HBTF'
              ? `${cheapest.name} has the lowest at JOD ${cheapest['Classic Card (JOD/yr)']}.`
              : 'HBTF has the lowest classic card fee in the comparison.'
          }`
        : `${cheapest.name} has the lowest classic card fee at JOD ${cheapest['Classic Card (JOD/yr)']}.`,
    }
  }

  // Home loan rates
  if (lower.includes('home loan') || lower.includes('mortgage') || lower.includes('housing loan')) {
    const { data } = await supabase
      .from('bank_rates')
      .select('bank_id, home_loan_min, home_loan_max')
      .in('bank_id', bankIds)

    if (!data?.length) return null

    const chartData = data.map(r => {
      const bank = BANKS.find(b => b.id === r.bank_id)
      return {
        name: bank?.shortName || `Bank ${r.bank_id}`,
        'Minimum Rate (%)': r.home_loan_min || 0,
        'Maximum Rate (%)': r.home_loan_max || 0,
      }
    })

    return {
      title: 'Home Loan Interest Rates — Bank Comparison',
      type: 'bar',
      data: chartData,
      series: ['Minimum Rate (%)', 'Maximum Rate (%)'],
      insight: 'Lower is better for borrowers. Check eligibility criteria as rates vary by loan size and term.',
    }
  }

  // Deposit rates
  if (lower.includes('deposit') || lower.includes('saving')) {
    const { data } = await supabase
      .from('bank_rates')
      .select('bank_id, saving_rate, td_3m, td_6m, td_12m')
      .in('bank_id', bankIds)

    if (!data?.length) return null

    const chartData = data.map(r => {
      const bank = BANKS.find(b => b.id === r.bank_id)
      return {
        name: bank?.shortName || `Bank ${r.bank_id}`,
        'Savings (%)': r.saving_rate || 0,
        '3-Month TD (%)': r.td_3m || 0,
        '6-Month TD (%)': r.td_6m || 0,
        '12-Month TD (%)': r.td_12m || 0,
      }
    })

    return {
      title: 'Deposit Interest Rates — Bank Comparison',
      type: 'bar',
      data: chartData,
      series: ['Savings (%)', '3-Month TD (%)', '6-Month TD (%)', '12-Month TD (%)'],
      insight: 'Higher is better for depositors. 12-month term deposits typically offer the best rates.',
    }
  }

  return null
}

// ── Main handler ──────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const { prompt, bankId } = await req.json()
  if (!prompt) return NextResponse.json({ error: 'No prompt provided' }, { status: 400 })

  const lower = prompt.toLowerCase()

  // Determine which banks to query
  let bankIds = detectBanks(prompt)
  // If a specific bankId context is provided and no banks detected in prompt, use it
  if (bankId && bankIds.length === BANKS.length) {
    bankIds = [bankId]
  }

  // Try rates/fees query first
  const ratesResult = await handleRatesQuery(prompt, bankIds)
  if (ratesResult) return NextResponse.json(ratesResult)

  // Otherwise query financials
  const metric = detectMetric(prompt)
  const chartType = detectChartType(prompt)
  const years = detectYears(prompt)

  const { data } = await supabase
    .from('bank_financials')
    .select(`bank_id, fiscal_year, ${metric.column}`)
    .in('bank_id', bankIds)
    .in('fiscal_year', years)
    .order('fiscal_year', { ascending: true })

  if (!data?.length) {
    return NextResponse.json({ error: 'No data found for this query. Try asking about profit, assets, deposits, or loans.' }, { status: 404 })
  }

  const bankNames = bankIds.map(id => BANKS.find(b => b.id === id)?.shortName || `Bank ${id}`)

  let chartData: any[]
  let series: string[]

  if (chartType === 'line' && bankIds.length <= 4) {
    // Multi-bank trend: X axis = year, one line per bank
    chartData = years.map(year => {
      const row: any = { name: `FY${year}` }
      bankIds.forEach(id => {
        const bankName = BANKS.find(b => b.id === id)?.shortName || `Bank ${id}`
        const match = data.find(d => d.bank_id === id && d.fiscal_year === year)
        const val = match?.[metric.column]
        row[bankName] = val != null ? Math.round(val / (metric.column.includes('rate') || metric.column === 'roe' || metric.column === 'roa' || metric.column === 'car' || metric.column === 'npl_ratio' ? 1 : 1_000_000) * 10) / 10 : null
      })
      return row
    })
    series = bankNames
  } else {
    // Bar chart: X axis = bank name, group by year
    const bankRows: Record<number, any> = {}
    data.forEach(row => {
      if (!bankRows[row.bank_id]) {
        bankRows[row.bank_id] = { name: BANKS.find(b => b.id === row.bank_id)?.shortName || `Bank ${row.bank_id}` }
      }
      const val = row[metric.column]
      const isRatio = ['roe', 'roa', 'car', 'npl_ratio'].includes(metric.column)
      bankRows[row.bank_id][`FY${row.fiscal_year}`] = val != null
        ? (isRatio ? Math.round(val * 10) / 10 : Math.round(val / 1_000_000))
        : null
    })
    chartData = Object.values(bankRows)
    series = years.map(y => `FY${y}`)
  }

  // Generate insight
  const latestYear = Math.max(...years)
  const latestData = data.filter(d => d.fiscal_year === latestYear)
  const sorted = [...latestData].sort((a, b) => (b[metric.column] || 0) - (a[metric.column] || 0))
  const leader = sorted[0]
  const leaderBank = BANKS.find(b => b.id === leader?.bank_id)
  const hbtfEntry = data.find(d => d.bank_id === 2 && d.fiscal_year === latestYear)
  const isRatio = ['roe', 'roa', 'car', 'npl_ratio'].includes(metric.column)

  const leaderVal = leader?.[metric.column]
  const hbtfVal = hbtfEntry?.[metric.column]

  let insight = ''
  if (leaderBank && leaderVal != null) {
    insight = `${leaderBank.shortName} leads with ${metric.label.includes('%') || isRatio ? `${leaderVal.toFixed(1)}%` : `JOD ${Math.round(leaderVal / 1_000_000)}M`} in FY${latestYear}.`
  }
  if (hbtfVal != null && leaderBank?.id !== 2) {
    const rank = sorted.findIndex(d => d.bank_id === 2) + 1
    insight += ` Housing Bank ranks #${rank} at ${isRatio ? `${hbtfVal.toFixed(1)}%` : `JOD ${Math.round(hbtfVal / 1_000_000)}M`}.`
  }

  return NextResponse.json({
    title: `${metric.label} — ${bankIds.length === BANKS.length ? 'All Banks' : bankNames.join(' vs ')}`,
    type: chartType,
    data: chartData,
    series,
    insight: insight || undefined,
  })
}
