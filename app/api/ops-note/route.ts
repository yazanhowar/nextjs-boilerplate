import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    if (body.secret !== 'hbtf-seed-2024') return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    const id = Number(body.bankId)
    const note = String(body.note || '').slice(0, 2000)
    if (!id || !note) return NextResponse.json({ error: 'bad input' }, { status: 400 })
    const supa = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL as string, process.env.SUPABASE_SERVICE_ROLE_KEY as string)
    const { error } = await supa.from('banks').update({ analyst_note: note }).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, id })
  } catch (e: any) {
    return NextResponse.json({ error: String(e && e.message || e) }, { status: 500 })
  }
}
