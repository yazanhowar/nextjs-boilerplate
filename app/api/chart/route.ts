// app/api/chart/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { BANKS } from '@/lib/banks-config'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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
  if (lower.includes('loan'))
    return { column: 'net_loans', label: 'Net Loans (JOD M)' }
  if (lower.includes('roe') || lower.includes('return on equity'))
    return { column: 'roe', label: 'Return on Equity (%)' }
  if (lower.includes('roa') || lower.includes('return on asset'))
    return { column: 'roa', label: 'Return on Assets (%)' }
  if (lower.includes('capital') || lower.includes('car'))
    return { column: 'car', label: 'Capital Adequacy Ratio (%)' }
  if (lower.includes('equity'))
    return { column: 'total_equity', label: "Shareholders Equity (JOD M)" }
  if (lower.includes('revenue') || lower.includes('interest income'))
    return { column: 'net_interest_income', label: 'Net Interest Income (JOD M)' }
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

const RATIO_COLUMNS = ['roe', 'roa', 'car', 'npl_ratio']

function isRatioColumn(col: string): boolean {
  return RATIO_COLUMNS.includes(col)
}

function scaleValue(val: number, column: string): number {
  if (isRatioColumn(column)) return Math.round(val * 10) / 10
  return Math.round(val / 1_000_000)
}

async function handleRatesQuery(prompt: string, bankIds: number[]) {
  const lower = prompt.toLowerCase()

  if (lower.includes('credit card')) {
    const { data } = await supabase
      .from('bank_tariffs')
      .select('bank_id, credit_card_annual_fee_classic, credit_card_annual_fee_gold, credit_card_annual_fee_platinum')
      .in('bank_id', bankIds)

    if (!data?.length) return null

    const chartData = data.map((r: any) => {
      const bank = BANKS.find(b => b.id === r.bank_id)
      return {
        name: bank?.shortName || `Bank ${r.bank_id}`,
        'Classic Card (JOD/yr)': r.credit_card_annual_fee_classic || 0,
        'Gold Card (JOD/yr)': r.credit_card_annual_fee_gold || 0,
        'Platinum Card (JOD/yr)': r.credit_card_annual_fee_platinum || 0,
      }
    })

    const sorted = [...chartData].sort((a, b) => a['Classic Card (JOD/yr)'] - b['Classic Card (JOD/yr)'])
    const cheapest = sorted[0]
    const hbtf = chartData.find((d: any) => d.name === 'HBTF')

    return {
      title: 'Annual Credit Card Fees — Bank Comparison',
      type: 'bar',
      data: chartData,
      series: ['Classic Card (JOD/yr)', 'Gold Card (JOD/yr)', 'Platinum Card (JOD/yr)'],
      insight: hbtf
        ? `HBTF classic card fee: JOD ${hbtf['Classic Card (JOD/yr)']}. ${cheapest.name !== 'HBTF' ? `${cheapest.name} has the lowest at JOD ${cheapest['Classic Card (JOD/yr)']}.` : 'HBTF has the lowest classic card fee.'}`
        : `${cheapest.name} has the lowest classic card fee at JOD ${cheapest['Classic Card (JOD/yr)']}.`,
    }
  }

  if (lower.includes('home loan') || lower.includes('mortgage')) {
    const { data } = await supabase
      .from('bank_rates')
      .select('bank_id, home_loan_min, home_loan_max')
      .in('bank_id', bankIds)

    if (!data?.length) return null

    const chartData = data.map((r: any) => {
      const bank = BANKS.find(b => b.id === r.bank_id)
      return {
        name: bank?.shortName || `Bank ${r.bank_id}`,
        'Min Rate (%)': r.home_loan_min || 0,
        'Max Rate (%)': r.home_loan_max || 0,
      }
    })

    return {
      title: 'Home Loan Interest Rates — Bank Comparison',
      type: 'bar',
      data: chartData,
      series: ['Min Rate (%)', 'Max Rate (%)'],
      insight: 'Lower is better for borrowers.',
    }
  }

  if (lower.includes('deposit') || lower.includes('saving')) {
    const { data } = await supabase
      .from('bank_rates')
      .select('bank_id, saving_rate, td_3m, td_6m, td_12m')
      .in('bank_id', bankIds)

    if (!data?.length) return null

    const chartData = data.map((r: any) => {
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
      insight: 'Higher is better for depositors.',
    }
  }

  return null
}

export async function POST(req: NextRequest) {
  const { prompt, bankId } = await req.json()
  if (!prompt) return NextResponse.json({ error: 'No prompt provided' }, { status: 400 })

  let bankIds = detectBanks(prompt)
  if (bankId && bankIds.length === BANKS.length) {
    bankIds = [bankId]
  }

  const ratesResult = await handleRatesQuery(prompt, bankIds)
  if (ratesResult) return NextResponse.json(ratesResult)

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
    return NextResponse.json(
      { error: 'No data found. Try asking about profit, assets, deposits, or loans.' },
      { status: 404 }
    )
  }

  const rows = data as any[]
  const bankNames = bankIds.map(id => BANKS.find(b => b.id === id)?.shortName || `Bank ${id}`)

  let chartData: any[]
  let series: string[]

  if (chartType === 'line' && bankIds.length <= 4) {
    chartData = years.map(year => {
      const row: any = { name: `FY${year}` }
      bankIds.forEach(id => {
        const bankName = BANKS.find(b => b.id === id)?.shortName || `Bank ${id}`
        const match = rows.find(d => d.bank_id === id && d.fiscal_year === year)
        const val = match ? match[metric.column] : null
        row[bankName] = val != null ? scaleValue(val, metric.column) : null
      })
      return row
    })
    series = bankNames
  } else {
    const bankRows: Record<number, any> = {}
    rows.forEach(row => {
      if (!bankRows[row.bank_id]) {
        bankRows[row.bank_id] = {
          name: BANKS.find(b => b.id === row.bank_id)?.shortName || `Bank ${row.bank_id}`
        }
      }
      const val = row[metric.column]
      bankRows[row.bank_id][`FY${row.fiscal_year}`] = val != null ? scaleValue(val, metric.column) : null
    })
    chartData = Object.values(bankRows)
    series = years.map(y => `FY${y}`)
  }

  const latestYear = Math.max(...years)
  const latestRows = rows.filter(d => d.fiscal_year === latestYear)
  const sorted = [...latestRows].sort((a, b) => (b[metric.column] || 0) - (a[metric.column] || 0))
  const leader = sorted[0]
  const leaderBank = leader ? BANKS.find(b => b.id === leader.bank_id) : null
  const hbtfEntry = rows.find(d => d.bank_id === 2 && d.fiscal_year === latestYear)

  let insight = ''
  if (leaderBank && leader) {
    const leaderVal = leader[metric.column]
    if (leaderVal != null) {
      const formatted = isRatioColumn(metric.column)
        ? `${leaderVal.toFixed(1)}%`
        : `JOD ${Math.round(leaderVal / 1_000_000)}M`
      insight = `${leaderBank.shortName} leads with ${formatted} in FY${latestYear}.`
    }
  }
  if (hbtfEntry && leaderBank?.id !== 2) {
    const hbtfVal = hbtfEntry[metric.column]
    if (hbtfVal != null) {
      const rank = sorted.findIndex(d => d.bank_id === 2) + 1
      const formatted = isRatioColumn(metric.column)
        ? `${hbtfVal.toFixed(1)}%`
        : `JOD ${Math.round(hbtfVal / 1_000_000)}M`
      insight += ` Housing Bank ranks #${rank} at ${formatted}.`
    }
  }

  return NextResponse.json({
    title: `${metric.label} — ${bankIds.length === BANKS.length ? 'All Banks' : bankNames.join(' vs ')}`,
    type: chartType,
    data: chartData,
    series,
    insight: insight || undefined,
  })
}
