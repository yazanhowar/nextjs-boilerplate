import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    if (body.secret !== 'hbtf-seed-2024') return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    const supa = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL as string, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string)
    const [ex, bd, re, bs, es] = await Promise.all([
      supa.from('bank_executives').select('bank_id'),
      supa.from('bank_board_members').select('bank_id'),
      supa.from('bank_real_estate').select('bank_id'),
      supa.from('bank_board_members').select('*').eq('bank_id', Number(body.sampleBank || 2)).limit(30),
      supa.from('bank_executives').select('*').eq('bank_id', Number(body.sampleBank || 2)).limit(30)
    ])
    function cnt(rows: any) { const m: any = {}; (rows.data || []).forEach((r: any) => { m[r.bank_id] = (m[r.bank_id] || 0) + 1 }); return m }
    return NextResponse.json({ execCounts: cnt(ex), boardCounts: cnt(bd), reCounts: cnt(re), boardCols: bs.data && bs.data[0] ? Object.keys(bs.data[0]) : [], boardSample: (bs.data || []).map((r: any) => ({ n: r.full_name_en, p: r.position_en || r.title_en, rep: r.representing_en || r.representing || r.represents || null, fy: r.fiscal_year })), execSample: (es.data || []).map((r: any) => ({ n: r.full_name_en, t: r.title_en, fy: r.fiscal_year })) })
  } catch (e: any) { return NextResponse.json({ error: String(e && e.message || e) }, { status: 500 }) }
}
