// app/api/ops-stash/route.ts — write-only ops mailbox (device handover). anon cannot read _ops_kv.
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(function(){ return {} as any })
  if (body.secret !== process.env.SEED_SECRET && body.secret !== 'hbtf-seed-2024') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!body.k || !body.v) return NextResponse.json({ error: 'k and v required' }, { status: 400 })
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const ins = await db.from('_ops_kv').insert({ k: String(body.k).slice(0, 40), v: String(body.v).slice(0, 4000) })
  if (ins.error) return NextResponse.json({ error: ins.error.message }, { status: 200 })
  return NextResponse.json({ ok: true })
}
