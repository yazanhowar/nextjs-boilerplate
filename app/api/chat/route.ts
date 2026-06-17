// app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { BANKS } from '@/lib/banks-config'

function getDB() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}

function detectBankIds(prompt: string): number[] {
  const lower = prompt.toLowerCase()
  const found: number[] = []
  for (const bank of BANKS) {
    const terms = [bank.name, bank.shortName, bank.ticker, bank.nameAr ?? ''].map(s => s.toLowerCase())
    if (terms.some(t => t && lower.includes(t))) found.push(bank.id)
  }
  return [...new Set(found)]
}

function needsRates(p: string) { return /rate|interest|profit rate|margin|mortgage|housing loan|home loan|personal loan|car loan|saving|deposit|murabaha|wakala|ijara/i.test(p) }
function needsTariffs(p: string) { return /fee|charge|credit card|transfer|maintenance|commission|tariff|cost|annual fee|card fee|renewal|issuance/i.test(p) }
function needsProducts(p: string) { return /product|service|offer|card|account|islamic|sharia|digital|mobile|what do|provide|portfolio/i.test(p) }
function needsOwnership(p: string) { return /own|shareholder|stake|investor|who controls|ownership|majority|parent|holding|kipco/i.test(p) }
function needsGovernance(p: string) { return /ceo|chairman|board|director|executive|management|leadership|who runs/i.test(p) }
function needsAnnouncements(p: string) { return /news|announce|agm|latest|recent|dividend|rating|merger|acquisition/i.test(p) }
function needsRealEstate(p: string) { return /real estate|property|properties|for sale|house|apartment|land|listing/i.test(p) }

function detectLoanType(p: string): string | null {
  if (/personal loan|consumer loan/i.test(p)) return 'personal'
  if (/housing loan|home loan|mortgage/i.test(p)) return 'housing'
  if (/car loan|auto loan|vehicle/i.test(p)) return 'auto'
  if (/sme|business loan/i.test(p)) return 'sme'
  return null
}

async function fetchContext(prompt: string, bankIds: number[]) {
  const db = getDB()
  const targetIds = bankIds.length > 0 ? bankIds : BANKS.map(b => b.id)
  const context: Record<string, any> = {}
  const jobs: Array<() => Promise<void>> = []

  jobs.push(async () => {
    const { data } = await db.from('bank_financials')
      .select('bank_id, fiscal_year, net_profit, total_assets, customer_deposits, net_loans, shareholders_equity, total_equity, roe, roa, car, npl_ratio, eps_fils, dividends_cash_pct, net_interest_income, total_income, cost_to_income, net_interest_margin')
      .in('bank_id', targetIds).in('fiscal_year', [2025, 2024, 2023]).order('fiscal_year', { ascending: false })
    if (data && data.length > 0) context.financials = data
  })

  if (needsRates(prompt)) {
    const loanType = detectLoanType(prompt)
    jobs.push(async () => {
      let query = db.from('bank_rates').select('*').in('bank_id', targetIds)
      if (loanType) query = query.ilike('rate_type', '%' + loanType + '%')
      const { data } = await query
      if (data) { context.rates = data; context.loanTypeFilter = loanType }
    })
  }

  if (needsTariffs(prompt)) {
    jobs.push(async () => {
      const { data } = await db.from('bank_tariffs').select('*').in('bank_id', targetIds)
      if (data) context.tariffs = data
    })
  }

  if (needsProducts(prompt)) {
    jobs.push(async () => {
      const { data } = await db.from('bank_products').select('bank_id, category, product_name_en, description_en').in('bank_id', targetIds)
      if (data) context.products = data
    })
  }

  if (needsOwnership(prompt)) {
    jobs.push(async () => {
      const { data } = await db.from('bank_ownership').select('bank_id, fiscal_year, shareholder_name_en, ownership_pct, shareholder_type').in('bank_id', targetIds).order('ownership_pct', { ascending: false })
      if (data) context.ownership = data
    })
  }

  if (needsGovernance(prompt)) {
    jobs.push(async () => {
      const [exec, board] = await Promise.all([
        db.from('bank_executives').select('bank_id, full_name_en, title_en, fiscal_year').in('bank_id', targetIds),
        db.from('bank_board_members').select('bank_id, full_name_en, role, is_independent, fiscal_year').in('bank_id', targetIds),
      ])
      if (exec.data) context.executives = exec.data
      if (board.data) context.board = board.data
    })
  }

  if (needsAnnouncements(prompt)) {
    jobs.push(async () => {
      const { data } = await db.from('bank_announcements').select('bank_id, announcement_date, category, headline_en, summary_en').in('bank_id', targetIds).order('announcement_date', { ascending: false }).limit(30)
      if (data) context.announcements = data
    })
  }

  if (needsRealEstate(prompt)) {
    jobs.push(async () => {
      const { data } = await db.from('bank_real_estate').select('bank_id, property_type, location, price_jod, area_sqm, description_en, listing_url').in('bank_id', targetIds).limit(50)
      if (data) context.realEstate = data
    })
  }

  context.banks = BANKS.filter(b => targetIds.includes(b.id)).map(b => ({
    id: b.id, name: b.name, shortName: b.shortName, ticker: b.ticker, sector: b.sector, isHBTF: b.isHBTF, description: b.description,
  }))

  await Promise.allSettled(jobs.map(j => j()))
  return context
}

function buildSystemPrompt(context: Record<string, any>): string {
  const USD_TO_JOD = 0.71
  const ARAB_BANK_ID = 1

  const years = [...new Set((context.financials || []).map((f: any) => f.fiscal_year))].sort((a: number, b: number) => b - a)
  const latestYear = years[0] ?? 2024
  const prevYear = years[1] ?? (latestYear - 1)

  const byBank: Record<number, any[]> = {}
  ;(context.financials || []).forEach((f: any) => {
    if (!byBank[f.bank_id]) byBank[f.bank_id] = []
    byBank[f.bank_id].push(f)
  })

  const fmtVal = (n: number | null, bankId: number, scale = 1) => {
    if (n == null) return 'N/A'
    const v = (bankId === ARAB_BANK_ID ? n * USD_TO_JOD : n) * scale
    if (Math.abs(v) >= 1_000_000) return 'JOD ' + (v / 1_000_000).toFixed(2) + 'B'
    if (Math.abs(v) >= 1_000) return 'JOD ' + (v / 1_000).toFixed(1) + 'M'
    return 'JOD ' + v.toFixed(0) + 'K'
  }

  let finSection = ''
  for (const [bankIdStr, records] of Object.entries(byBank)) {
    const bankId = parseInt(bankIdStr)
    const bank = context.banks?.find((b: any) => b.id === bankId)
    if (!bank) continue
    const sorted = (records as any[]).sort((a: any, b: any) => b.fiscal_year - a.fiscal_year)
    const curr = sorted[0]
    const prev = sorted[1]
    const isUSD = bankId === ARAB_BANK_ID
    const pct = (a: number, b: number) => b ? ((a - b) / Math.abs(b) * 100).toFixed(1) + '%' : 'N/A'

    finSection += '\n[' + bank.name + ' (' + bank.ticker + ') | FY' + curr.fiscal_year + (isUSD ? ' | USD thousands' : '') + ']\n'
    if (curr.net_profit != null) finSection += '  Net Profit: ' + fmtVal(curr.net_profit, bankId) + (prev?.net_profit ? ' (' + pct(curr.net_profit, prev.net_profit) + ' vs FY' + prev.fiscal_year + ')' : '') + '\n'
    if (curr.total_assets != null) finSection += '  Total Assets: ' + fmtVal(curr.total_assets, bankId) + '\n'
    if (curr.customer_deposits != null) finSection += '  Deposits: ' + fmtVal(curr.customer_deposits, bankId) + '\n'
    if (curr.net_loans != null) finSection += '  Net Loans: ' + fmtVal(curr.net_loans, bankId) + '\n'
    const equity = curr.shareholders_equity ?? curr.total_equity
    if (equity != null) finSection += '  Equity: ' + fmtVal(equity, bankId) + '\n'
    const ratios = [curr.roe != null ? 'ROE ' + curr.roe.toFixed(1) + '%' : '', curr.roa != null ? 'ROA ' + curr.roa.toFixed(2) + '%' : '', curr.car != null ? 'CAR ' + curr.car.toFixed(1) + '%' : '', curr.npl_ratio != null ? 'NPL ' + curr.npl_ratio.toFixed(1) + '%' : ''].filter(Boolean).join(' | ')
    if (ratios) finSection += '  ' + ratios + '\n'
    const extras = [curr.net_interest_margin != null ? 'NIM ' + curr.net_interest_margin.toFixed(2) + '%' : '', curr.cost_to_income != null ? 'C/I ' + curr.cost_to_income.toFixed(1) + '%' : '', curr.eps_fils != null ? 'EPS ' + curr.eps_fils + ' fils' : '', curr.dividends_cash_pct != null ? 'Div ' + curr.dividends_cash_pct + '%' : ''].filter(Boolean).join(' | ')
    if (extras) finSection += '  ' + extras + '\n'
  }

  let ratesSection = ''
  if (context.rates?.length > 0) {
    ratesSection = '\n=== RATES' + (context.loanTypeFilter ? ' (' + context.loanTypeFilter + ' loans only)' : '') + ' ===\n'
    context.rates.slice(0, 60).forEach((r: any) => {
      const bank = context.banks?.find((b: any) => b.id === r.bank_id)
      ratesSection += '[' + (bank?.shortName || r.bank_id) + '] ' + r.rate_type + ': '
      if (r.rate_min != null && r.rate_max != null) ratesSection += r.rate_min + '%-' + r.rate_max + '%'
      else if (r.rate_value != null) ratesSection += r.rate_value + '%'
      if (r.currency && r.currency !== 'JOD') ratesSection += ' (' + r.currency + ')'
      if (r.notes_en) ratesSection += ' — ' + r.notes_en
      ratesSection += '\n'
    })
  }

  let tariffsSection = ''
  if (context.tariffs?.length > 0) {
    tariffsSection = '\n=== FEES & TARIFFS ===\n'
    context.tariffs.forEach((t: any) => {
      const bank = context.banks?.find((b: any) => b.id === t.bank_id)
      tariffsSection += '[' + (bank?.shortName || t.bank_id) + '] ' + (t.service_category || '') + ' > ' + t.service_name_en + ': '
      if (t.fee_amount != null) tariffsSection += t.fee_amount + ' ' + (t.fee_currency || 'JOD')
      if (t.fee_pct != null) tariffsSection += t.fee_pct + '%'
      if (t.notes_en) tariffsSection += ' (' + t.notes_en + ')'
      tariffsSection += '\n'
    })
  }

  let reSection = ''
  if (context.realEstate?.length > 0) {
    reSection = '\n=== REAL ESTATE LISTINGS ===\n'
    context.realEstate.forEach((r: any) => {
      const bank = context.banks?.find((b: any) => b.id === r.bank_id)
      reSection += '[' + (bank?.shortName || r.bank_id) + '] ' + r.property_type + ' in ' + r.location + ': '
      if (r.price_jod) reSection += 'JOD ' + r.price_jod.toLocaleString()
      if (r.area_sqm) reSection += ' | ' + r.area_sqm + 'm²'
      if (r.description_en) reSection += ' — ' + r.description_en.slice(0, 100)
      if (r.listing_url) reSection += ' [URL: ' + r.listing_url + ']'
      reSection += '\n'
    })
  }

  let govSection = ''
  if (context.executives?.length || context.board?.length) {
    govSection = '\n=== LEADERSHIP ===\n'
    context.executives?.forEach((e: any) => {
      const bank = context.banks?.find((b: any) => b.id === e.bank_id)
      govSection += '[' + bank?.shortName + '] ' + e.title_en + ': ' + e.full_name_en + '\n'
    })
    context.board?.forEach((b: any) => {
      const bank = context.banks?.find((bk: any) => bk.id === b.bank_id)
      govSection += '[' + bank?.shortName + '] Board: ' + b.full_name_en + ' (' + b.role + (b.is_independent ? ', Independent' : '') + ')\n'
    })
  }

  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  return 'You are Rami — a senior banking analyst and strategic advisor built into HBTF Intelligence. You think like a McKinsey partner who spent 20 years in Jordanian banking. Sharp, direct, opinionated, genuine — not a chatbot.\n\n' +
    'PERSONALITY:\n' +
    '- Lead with the key insight, not a preamble\n' +
    '- Use natural language: "HBTF made JOD 150M last year" not "net_profit field shows 150300"\n' +
    '- Have opinions: "That 116% jump at JKB is extraordinary — driven by Bank of Baghdad consolidation, not organic growth"\n' +
    '- Connect dots proactively: asked about profit? mention what drove it + HBTF competitive implications\n' +
    '- Be concise for simple questions; thorough for complex ones\n' +
    '- When data is missing, say so naturally then share contextual knowledge\n' +
    '- Format numbers cleanly: JOD 150.3M not 150,300,000\n\n' +
    'DATA RULES:\n' +
    '1. All stored values in THOUSANDS (divide by 1000 for millions, 1000000 for billions)\n' +
    '2. Arab Bank (bank_id 1) = USD thousands — multiply by 0.71 for JOD\n' +
    '3. Latest year available: FY' + latestYear + '\n' +
    '4. Loan filter: ' + (context.loanTypeFilter || 'none — show all types') + '\n' +
    '5. JKB FY2024 profit JOD 194.3M is CORRECT — includes Bank of Baghdad Iraq subsidiary\n\n' +
    'HBTF CONTEXT:\n' +
    '- HBTF (bank_id 2) is the platform owner — always frame insights vs HBTF competitive position\n' +
    '- HBTF FY2025: Net Profit JOD 157.7M (+4.9% vs 2024), Total Assets JOD 9.39B\n' +
    '- HBTF FY2024: Net Profit JOD 150.3M (+6.7%), Total Assets JOD 9.22B, ROE 11.3%, CAR 18.6%\n\n' +
    'CHART FORMAT — use at end only when genuinely useful:\n' +
    '```chart\n{"type":"bar","title":"Title","data":[{"name":"HBTF","value":150}],"series":["value"],"insight":"One takeaway"}\n```\n\n' +
    'Today: ' + today + '\n\n' +
    '=== FINANCIAL DATA ===\n' + finSection +
    ratesSection + tariffsSection + reSection + govSection
}

export async function POST(req: NextRequest) {
  const { messages, bankId } = await req.json()
  if (!messages?.length) return NextResponse.json({ error: 'No messages' }, { status: 400 })

  const lastUserMsg = [...messages].reverse().find((m: any) => m.role === 'user')
  const lastMessage = typeof lastUserMsg?.content === 'string' ? lastUserMsg.content : ''

  const bankIds = detectBankIds(lastMessage)
  if (bankId && !bankIds.includes(bankId)) bankIds.push(bankId)

  const context = await fetchContext(lastMessage, bankIds)
  const systemPrompt = buildSystemPrompt(context)

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-opus-4-6',
      max_tokens: 2048,
      system: systemPrompt,
      messages: messages.filter((m: any) => m.content).map((m: any) => ({ role: m.role, content: m.content })),
      stream: true,
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    console.error('[HBTF Chat] Anthropic error:', err)
    return NextResponse.json({ error: err }, { status: 500 })
  }

  const stream = new ReadableStream({
    async start(controller) {
      const reader = response.body!.getReader()
      const decoder = new TextDecoder()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        const lines = chunk.split('\n').filter(l => l.startsWith('data: '))
        for (const line of lines) {
          const data = line.slice(6)
          if (data === '[DONE]') continue
          try {
            const parsed = JSON.parse(data)
            const text = parsed.delta?.text || parsed.content?.[0]?.text || ''
            if (text) controller.enqueue(new TextEncoder().encode(text))
          } catch {}
        }
      }
      controller.close()
    },
  })

  return new NextResponse(stream, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}