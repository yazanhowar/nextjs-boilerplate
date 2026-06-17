import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const table = searchParams.get('table') || 'bank_financials'
  const limit = parseInt(searchParams.get('limit') || '50')
  const bankId = searchParams.get('bank_id')
  const year = searchParams.get('year')

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  let query = db.from(table).select('*').limit(limit)
  if (bankId) query = query.eq('bank_id', bankId)
  if (year) query = query.eq('fiscal_year', year)

  const { data, error, count } = await query

  // Also get counts per bank from bank_financials
  const { data: summary } = await db
    .from('bank_financials')
    .select('bank_id, fiscal_year, net_profit, total_assets')
    .order('bank_id')
    .order('fiscal_year', { ascending: false })

  return NextResponse.json({
    table,
    data,
    error: error?.message,
    count: data?.length,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'set' : 'missing',
    summary: summary?.reduce((acc: any, r: any) => {
      if (!acc[r.bank_id]) acc[r.bank_id] = []
      acc[r.bank_id].push({ year: r.fiscal_year, profit: r.net_profit, assets: r.total_assets })
      return acc
    }, {})
  })
}
