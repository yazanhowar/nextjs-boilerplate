import { supabase } from '../../../lib/supabase'

export async function GET() {
  const { data, error } = await supabase
    .from('bank_financials')
    .select('bank_id, fiscal_year, net_profit, total_assets')
    .eq('fiscal_year', 2024)
    .limit(5)

  return Response.json({ data, error, count: data?.length ?? 0, supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'set' : 'MISSING' })
}