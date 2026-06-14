import { supabase } from '../../../lib/supabase'

export async function GET() {
  const { data, error } = await supabase
    .from('banks')
    .select('id, slug')
    .limit(3)

  return Response.json({ data, error })
}
