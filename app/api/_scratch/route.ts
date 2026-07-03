import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const key = req.headers.get('x-cf-key') || '';
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: sec } = await sb.from('_cf_secrets').select('value').eq('name', 'ingest_key').single();
  if (!sec || !key || key !== sec.value) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const { data, error } = await sb.from('_cf_scratch').select('k,v');
  if (error) return NextResponse.json({ ok: false, err: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, rows: data });
}
