import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

function db() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}

const IMF = 'https://www.imf.org/external/datamapper/api/v1'

type Geo = { geo: string; category: string; indicator: string; indicator_ar: string; forecastIndicator?: string; forecast_ar?: string; unit?: string }
type Spec = { code: string; geos: Geo[] }

const SPECS: Spec[] = [
  { code: 'NGDP_RPCH', geos: [
    { geo: 'WEOWORLD', category: 'global_growth', indicator: 'World real GDP growth', indicator_ar: 'نمو الاقتصاد العالمي' },
    { geo: 'ADVEC', category: 'global_growth', indicator: 'Advanced economies growth', indicator_ar: 'نمو الاقتصادات المتقدمة' },
    { geo: 'OEMDC', category: 'global_growth', indicator: 'Emerging and developing growth', indicator_ar: 'نمو الاقتصادات الصاعدة والنامية' },
    { geo: 'JOR', category: 'jo_gdp', indicator: 'Real GDP growth', indicator_ar: 'النمو الاقتصادي الحقيقي', forecastIndicator: 'Real GDP growth forecast', forecast_ar: 'توقعات النمو الحقيقي' }
  ]},
  { code: 'PCPIPCH', geos: [
    { geo: 'WEOWORLD', category: 'global_inflation', indicator: 'World inflation', indicator_ar: 'التضخم العالمي' },
    { geo: 'ADVEC', category: 'global_inflation', indicator: 'Advanced economies inflation', indicator_ar: 'تضخم الاقتصادات المتقدمة' },
    { geo: 'OEMDC', category: 'global_inflation', indicator: 'Emerging and developing inflation', indicator_ar: 'تضخم الاقتصادات الصاعدة والنامية' },
    { geo: 'JOR', category: 'jo_inflation', indicator: 'CPI inflation', indicator_ar: 'معدل التضخم', forecastIndicator: 'Inflation forecast', forecast_ar: 'توقعات التضخم' }
  ]},
  { code: 'LUR', geos: [
    { geo: 'JOR', category: 'jo_social', indicator: 'Unemployment rate', indicator_ar: 'معدل البطالة', forecastIndicator: 'Unemployment rate forecast', forecast_ar: 'توقعات معدل البطالة' }
  ]},
  { code: 'GGXWDG_NGDP', geos: [
    { geo: 'JOR', category: 'jo_debt', indicator: 'General gov gross debt pct GDP (IMF)', indicator_ar: 'الدين الحكومي العام نسبة للناتج (صندوق النقد)', forecastIndicator: 'Gov debt pct GDP forecast (IMF)', forecast_ar: 'توقعات الدين نسبة للناتج (صندوق النقد)' }
  ]}
]

const PROBE_HOSTS = ['imf.org', 'dos.gov.jo', 'cbj.gov.jo', 'mof.gov.jo', 'abj.org.jo', 'worldbank.org']

async function fetchJson(url: string, ms: number): Promise<any> {
  const ctl = new AbortController()
  const t = setTimeout(function(){ ctl.abort() }, ms)
  try {
    const r = await fetch(url, { signal: ctl.signal, cache: 'no-store', headers: { accept: 'application/json', 'user-agent': 'Mozilla/5.0 (compatible; convofinance-sync/1.0)' } })
    if (!r.ok) throw new Error('http ' + r.status)
    return await r.json()
  } finally { clearTimeout(t) }
}

async function syncImf(dry: boolean) {
  const nowYear = new Date().getUTCFullYear()
  const rows: any[] = []
  const errors: string[] = []
  for (const sp of SPECS) {
    try {
      const j = await fetchJson(IMF + '/' + sp.code + '/' + sp.geos.map(function(g){ return g.geo }).join(','), 15000)
      const vals = j && j.values && j.values[sp.code]
      if (!vals) { errors.push(sp.code + ': no values'); continue }
      for (const g of sp.geos) {
        const series = vals[g.geo]
        if (!series) { errors.push(sp.code + '/' + g.geo + ': missing'); continue }
        for (let y = 2019; y <= nowYear + 2; y++) {
          const raw = series[String(y)]
          if (raw === undefined || raw === null) continue
          const v = Math.round(Number(raw) * 100) / 100
          if (!isFinite(v)) continue
          const isF = y >= nowYear
          rows.push({
            category: g.category,
            indicator: isF && g.forecastIndicator ? g.forecastIndicator : g.indicator,
            indicator_ar: isF && g.forecastIndicator ? (g.forecast_ar || g.indicator_ar) : g.indicator_ar,
            period: String(y) + (isF ? 'F' : ''),
            value: v,
            unit: g.unit || '%',
            source: 'IMF WEO (live)',
            note: 'auto-sync'
          })
        }
      }
    } catch (e: any) { errors.push(sp.code + ': ' + String(e && e.message ? e.message : e)) }
  }
  let upserted = 0
  let cleaned = 0
  if (!dry && rows.length) {
    const s = db()
    const up = await s.from('macro_indicators').upsert(rows, { onConflict: 'category,indicator,period' })
    if (up.error) { errors.push('upsert: ' + up.error.message) } else { upserted = rows.length }
    const twin: Record<string, string> = {
      'Real GDP growth': 'Real GDP growth forecast',
      'CPI inflation': 'Inflation forecast',
      'Unemployment rate': 'Unemployment rate forecast',
      'General gov gross debt pct GDP (IMF)': 'Gov debt pct GDP forecast (IMF)'
    }
    const prevY = String(nowYear - 1)
    const dels: { category: string; indicator: string; period: string }[] = []
    for (const r of rows) {
      if (r.period === prevY) {
        dels.push({ category: r.category, indicator: r.indicator, period: prevY + 'F' })
        if (twin[r.indicator]) dels.push({ category: r.category, indicator: twin[r.indicator], period: prevY + 'F' })
      }
    }
    const seen: Record<string, boolean> = {}
    for (const d of dels) {
      const k = d.category + '|' + d.indicator + '|' + d.period
      if (seen[k]) continue
      seen[k] = true
      const del = await s.from('macro_indicators').delete().match(d)
      if (!del.error) cleaned++
    }
  }
  return { source: 'imf', fetched: rows.length, upserted: upserted, cleanedForecasts: cleaned, dry: dry, errors: errors, sample: rows.slice(0, 4) }
}

export async function GET(req: Request) {
  const u = new URL(req.url)
  const probe = u.searchParams.get('probe')
  if (probe) {
    try {
      const pu = new URL(probe)
      const ok = PROBE_HOSTS.some(function(h){ return pu.hostname === h || pu.hostname.endsWith('.' + h) })
      if (!ok) return NextResponse.json({ error: 'host not allowed' }, { status: 400 })
      const ctl = new AbortController()
      const t = setTimeout(function(){ ctl.abort() }, 20000)
      const r = await fetch(probe, { signal: ctl.signal, cache: 'no-store', headers: { 'user-agent': 'Mozilla/5.0 (compatible; convofinance-sync/1.0)', accept: '*/*' } })
      clearTimeout(t)
      const ct = r.headers.get('content-type') || ''
      const body = await r.text()
      return NextResponse.json({ status: r.status, contentType: ct, len: body.length, head: body.slice(0, 900) })
    } catch (e: any) {
      return NextResponse.json({ error: String(e && e.message ? e.message : e) }, { status: 500 })
    }
  }
  const dry = u.searchParams.get('dry') === '1'
  const src = u.searchParams.get('source') || 'all'
  const results: any[] = []
  if (src === 'all' || src === 'imf') results.push(await syncImf(dry))
  return NextResponse.json({ ok: true, ranAt: new Date().toISOString(), results: results })
}
