import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export default async function Page({ searchParams }: { searchParams: Promise<{ k?: string }> }) {
  const { k } = await searchParams;
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: rk } = await sb.from('_cf_readkey').select('v').eq('v', k || '').maybeSingle();
  if (!rk) return <pre>denied</pre>;
  const { data } = await sb.from('_cf_scratch').select('k,v');
  return <pre style={{ whiteSpace: 'pre-wrap', fontSize: 11 }}>{'CFSTART' + JSON.stringify(data) + 'CFEND'}</pre>;
}
