import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const key = (req.headers.get('x-cf-key') || '').trim().replace(/^"|"$/g, '');
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: okv, error: gerr } = await sb.rpc('_cf_guard', { p: key });
  if (!okv) {
    return NextResponse.json({ ok: false, d: { g: okv === false ? 'false' : 'null', e: gerr ? gerr.message : null, kl: key.length } }, { status: 401 });
  }
  const { data, error } = await sb.from('_cf_scratch').select('k,v');
  if (error) return NextResponse.json({ ok: false, err: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, rows: data });
}
