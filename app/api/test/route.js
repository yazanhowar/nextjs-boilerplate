import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const table = searchParams.get('table') || 'bank_financials'
  const limit = parseInt(searchParams.get('limit') || '50')
  const bankId = searchParams.get('bank_id')
  const year = searchParams.get('year')

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  let query = db.from(table).select('*').limit(limit)
  if (bankId) query = query.eq('bank_id', parseInt(bankId))
  if (year) query = query.eq('fiscal_year', parseInt(year))

  const { data, error } = await query

  // Quick summary of financials by bank
  const { data: summary } = await db
    .from('bank_financials')
    .select('bank_id, fiscal_year, net_profit, total_assets, roe, car')
    .order('bank_id')
    .order('fiscal_year', { ascending: false })

  const byBank = {}
  if (summary) {
    summary.forEach(r => {
      if (!byBank[r.bank_id]) byBank[r.bank_id] = []
      byBank[r.bank_id].push({ yr: r.fiscal_year, profit: r.net_profit, assets: r.total_assets, roe: r.roe })
    })
  }

  return NextResponse.json({
    table,
    data,
    error: error?.message || null,
    count: data?.length || 0,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'set' : 'missing',
    summary: byBank,
    totalBanks: Object.keys(byBank).length,
  })
}
