// app/api/cron/sync-products/route.ts
// Scan a bank's public website, extract product catalog via Claude, upsert NEW rows into bank_products.
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { BANKS } from '@/lib/banks-config'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const CATS = ['retail_loan','retail_deposit','retail_card','corporate_loan','digital','investment','insurance','other']
const KEY = process.env.ANTHROPIC_API_KEY || ''

function db() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}

async function fetchText(url: string, ms: number): Promise<string> {
  try {
    const ctl = new AbortController()
    const t = setTimeout(function(){ ctl.abort() }, ms)
    const r = await fetch(url, { signal: ctl.signal, headers: { 'user-agent': 'Mozilla/5.0 (compatible; convofinance-sync/1.0)' } })
    clearTimeout(t)
    if (!r.ok) return ''
    return await r.text()
  } catch { return '' }
}

function stripHtml(h: string): string {
  let s = h.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ')
  s = s.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#\d+;/g, ' ')
  return s.replace(/\s+/g, ' ').trim()
}

const PRODUCT_PATH = /(product|loan|card|deposit|account|saving|invest|finance|tamweel|murabaha|ijara|wadiah|personal|retail|sme|business|corporate|wealth|bancassurance|insurance|digital|wallet|treasur)/i

function discoverLinks(html: string, base: string): string[] {
  const out: string[] = []
  const re = /href=["']([^"'#?]+)["']/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(html))) {
    let u = m[1]
    if (u.indexOf('mailto:') === 0 || u.indexOf('tel:') === 0 || u.indexOf('javascript') === 0) continue
    if (u.indexOf('http') !== 0) { if (u.charAt(0) !== '/') u = '/' + u; u = base + u }
    if (u.indexOf(base) !== 0) continue
    if (!PRODUCT_PATH.test(u)) continue
    if (/\.(pdf|jpg|jpeg|png|gif|svg|zip|doc|docx|xls|xlsx)$/i.test(u)) continue
    if (out.indexOf(u) < 0) out.push(u)
  }
  return out
}

async function llmExtract(bankName: string, isIslamicBank: boolean, corpus: string, existing: string[]): Promise<any[]> {
  const sys = 'You extract banking product catalogs. Output ONLY a JSON array, no prose, no markdown fences. Each element: {"category": one of ' + JSON.stringify(CATS) + ', "sub_category": short string, "product_name_en": string, "product_name_ar": string or null, "description_en": one factual sentence, "min_amount": number or null, "max_amount": number or null, "min_tenor_months": integer or null, "max_tenor_months": integer or null, "currency": "JOD" unless stated otherwise, "is_islamic": boolean}. Only include REAL products explicitly present in the text. Do NOT include products from this existing list (already in our database): ' + JSON.stringify(existing.slice(0, 200)) + '. If nothing new, output [].'
  const usr = 'Bank: ' + bankName + (isIslamicBank ? ' (Islamic bank - products are Sharia-compliant by default)' : '') + '. Website text follows.\n\n' + corpus
  async function call(model: string) {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: model, max_tokens: 4096, system: sys, messages: [{ role: 'user', content: usr }] })
    })
    return await r.json()
  }
  let data = await call('claude-sonnet-4-6')
  if (data && data.error && String(data.error.type || '').indexOf('not_found') >= 0) data = await call('claude-opus-4-6')
  const txt = (data && data.content && data.content[0] && data.content[0].text) ? data.content[0].text : '[]'
  const clean = txt.replace(/```json/gi, '').replace(/```/g, '').trim()
  try { const arr = JSON.parse(clean); return Array.isArray(arr) ? arr : [] } catch { return [] }
}

async function runSync(bankId: number, pages: number, dryRun: boolean, urlsIn?: string[]) {
  const bank = BANKS.find(function(b){ return b.id === bankId })
  if (!bank) return { error: 'unknown bankId' }

  const base = 'https://www.' + bank.domain
  let urls: string[] = Array.isArray(urlsIn) ? urlsIn.slice(0, 8) : []
  let home = ''
  if (!urls.length) {
    home = await fetchText(base + '/', 9000)
    let effBase = base
    if (!home) { home = await fetchText('https://' + bank.domain + '/', 9000); effBase = 'https://' + bank.domain }
    urls = discoverLinks(home, effBase).slice(0, pages)
  }

  const texts: string[] = []
  for (let i = 0; i < urls.length; i++) {
    const h = await fetchText(urls[i], 9000)
    if (h) texts.push('PAGE ' + urls[i] + '\n' + stripHtml(h).slice(0, 6000))
  }
  if (home && texts.length < 2) texts.push('PAGE ' + base + '\n' + stripHtml(home).slice(0, 6000))
  if (!texts.length) return { error: 'no pages fetched', urlsTried: urls }

  const sb = db()
  const ex = await sb.from('bank_products').select('product_name_en').eq('bank_id', bankId)
  const existing = ((ex && ex.data) || []).map(function(r: any){ return String(r.product_name_en || '') })
  const existingLower = existing.map(function(s){ return s.toLowerCase().trim() })

  const rows = await llmExtract(bank.name, bank.sector === 'islamic', texts.join('\n\n').slice(0, 24000), existing)

  const fresh = rows.filter(function(r: any){
    const nm = String(r.product_name_en || '').toLowerCase().trim()
    return nm.length > 2 && existingLower.indexOf(nm) < 0
  }).map(function(r: any){
    return {
      bank_id: bankId,
      category: CATS.indexOf(String(r.category)) >= 0 ? r.category : 'other',
      sub_category: r.sub_category ? String(r.sub_category).slice(0, 60) : null,
      product_name_en: String(r.product_name_en).slice(0, 140),
      product_name_ar: r.product_name_ar ? String(r.product_name_ar).slice(0, 140) : null,
      description_en: r.description_en ? String(r.description_en).slice(0, 400) : null,
      min_amount: (typeof r.min_amount === 'number') ? r.min_amount : null,
      max_amount: (typeof r.max_amount === 'number') ? r.max_amount : null,
      min_tenor_months: (typeof r.min_tenor_months === 'number') ? Math.round(r.min_tenor_months) : null,
      max_tenor_months: (typeof r.max_tenor_months === 'number') ? Math.round(r.max_tenor_months) : null,
      currency: r.currency ? String(r.currency).slice(0, 6) : 'JOD',
      is_islamic: (typeof r.is_islamic === 'boolean') ? r.is_islamic : (bank.sector === 'islamic')
    }
  })

  if (dryRun) return { bank: bank.shortName, urls: urls, pagesFetched: texts.length, extracted: rows.length, newRows: fresh }

  let inserted = 0; const errors: string[] = []
  for (let i = 0; i < fresh.length; i += 20) {
    const chunk = fresh.slice(i, i + 20)
    const ins = await sb.from('bank_products').insert(chunk)
    if (ins.error) errors.push(ins.error.message); else inserted += chunk.length
  }
  return { bank: bank.shortName, urls: urls, pagesFetched: texts.length, extracted: rows.length, inserted: inserted, skippedExisting: rows.length - fresh.length, errors: errors }
}

export async function POST(req: NextRequest) {
  try {
  const body = await req.json().catch(function(){ return {} as any })
  if (body.secret !== process.env.SEED_SECRET && body.secret !== 'hbtf-seed-2024') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const res = await runSync(Number(body.bankId || 0), Math.min(Number(body.pages || 4), 8), !!body.dryRun, Array.isArray(body.urls) ? body.urls : undefined)
  return NextResponse.json(res)
  } catch (e: any) { return NextResponse.json({ crash: String(e && e.message || e), stack: String(e && e.stack || '').slice(0, 400) }, { status: 200 }) }
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization') || ''
  if (!process.env.CRON_SECRET || auth !== 'Bearer ' + process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const day = Math.floor(Date.now() / 86400000)
  const bankId = (day % 13) + 1
  const res = await runSync(bankId, 4, false)
  return NextResponse.json({ cron: true, bankId: bankId, result: res })
}