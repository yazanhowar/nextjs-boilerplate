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
    const terms = [bank.name, bank.shortName, bank.ticker, bank.nameAr ?? ''].map((s: string) => s.toLowerCase())
    if (terms.some((t: string) => t && lower.includes(t))) found.push(bank.id)
  }
  return [...new Set(found)]
}

function needsRates(p: string) { return /rate|interest|loan|saving|deposit|td |murabaha|wakala|mudaraba/i.test(p) }
function needsTariffs(p: string) { return /fee|charge|credit card|transfer|maintenance|commission|tariff|cost|card fee|safe box|atm/i.test(p) }
function needsProducts(p: string) { return /product|service|offer|card|account|islamic|sharia|digital|mobile|what do|provide|portfolio/i.test(p) }
function needsOwnership(p: string) { return /own|shareholder|stake|investor|who controls|ownership|majority|parent|holding/i.test(p) }
function needsGovernance(p: string) { return /ceo|chairman|board|director|executive|management|leadership|who runs/i.test(p) }
function needsAnnouncements(p: string) { return /news|announce|agm|latest|recent|dividend|rating|merger|acquisition/i.test(p) }

function formatRates(r: Record<string, any>, bankName: string): string {
  const lines: string[] = []
  const pfx = '[' + bankName + '] '
  if (r.home_loan_min || r.home_loan_max) lines.push(pfx + 'Housing loan: ' + [r.home_loan_min, r.home_loan_max].filter(Boolean).join('%\u2013') + '%')
  if (r.personal_loan_min || r.personal_loan_max) lines.push(pfx + 'Personal loan: ' + [r.personal_loan_min, r.personal_loan_max].filter(Boolean).join('%\u2013') + '%')
  if (r.car_loan_min || r.car_loan_max) lines.push(pfx + 'Car loan: ' + [r.car_loan_min, r.car_loan_max].filter(Boolean).join('%\u2013') + '%')
  if (r.sme_loan_min || r.sme_loan_max) lines.push(pfx + 'SME loan: ' + [r.sme_loan_min, r.sme_loan_max].filter(Boolean).join('%\u2013') + '%')
  if (r.credit_card_rate) lines.push(pfx + 'Credit card rate: ' + r.credit_card_rate + '%')
  if (r.saving_rate) lines.push(pfx + 'Savings: ' + r.saving_rate + '%')
  const td = [r.td_1m && '1M:' + r.td_1m + '%', r.td_3m && '3M:' + r.td_3m + '%', r.td_6m && '6M:' + r.td_6m + '%', r.td_12m && '12M:' + r.td_12m + '%'].filter(Boolean)
  if (td.length) lines.push(pfx + 'JOD TD: ' + td.join(', '))
  const tdusd = [r.td_usd_3m && '3M:' + r.td_usd_3m + '%', r.td_usd_6m && '6M:' + r.td_usd_6m + '%', r.td_usd_12m && '12M:' + r.td_usd_12m + '%'].filter(Boolean)
  if (tdusd.length) lines.push(pfx + 'USD TD: ' + tdusd.join(', '))
  if (r.murabaha_rate_min || r.murabaha_rate_max) lines.push(pfx + 'Murabaha: ' + [r.murabaha_rate_min, r.murabaha_rate_max].filter(Boolean).join('%\u2013') + '%')
  if (r.wakala_rate) lines.push(pfx + 'Wakala: ' + r.wakala_rate + '%')
  return lines.join('\n')
}

function formatTariffs(t: Record<string, any>, bankName: string): string {
  const lines: string[] = []
  const pfx = '[' + bankName + '] '
  if (t.local_transfer_fee) lines.push(pfx + 'Local transfer: ' + t.local_transfer_fee + (t.local_transfer_fee_type === 'pct' ? '%' : ' JOD'))
  if (t.swift_transfer_fee_jod) lines.push(pfx + 'SWIFT: JOD ' + t.swift_transfer_fee_jod + (t.swift_transfer_fee_pct ? ' + ' + t.swift_transfer_fee_pct + '%' : ''))
  if (t.account_maintenance_fee) lines.push(pfx + 'Account maintenance: JOD ' + t.account_maintenance_fee + '/yr')
  if (t.debit_card_annual_fee) lines.push(pfx + 'Debit card annual: JOD ' + t.debit_card_annual_fee)
  if (t.credit_card_annual_fee_classic) lines.push(pfx + 'CC Classic annual: JOD ' + t.credit_card_annual_fee_classic)
  if (t.credit_card_annual_fee_gold) lines.push(pfx + 'CC Gold annual: JOD ' + t.credit_card_annual_fee_gold)
  if (t.credit_card_annual_fee_platinum) lines.push(pfx + 'CC Platinum annual: JOD ' + t.credit_card_annual_fee_platinum)
  if (t.cash_advance_fee_pct) lines.push(pfx + 'Cash advance: ' + t.cash_advance_fee_pct + '%')
  if (t.late_payment_fee) lines.push(pfx + 'Late payment: JOD ' + t.late_payment_fee)
  if (t.safe_box_small_annual) lines.push(pfx + 'Safe box (S/M/L): JOD ' + [t.safe_box_small_annual, t.safe_box_medium_annual, t.safe_box_large_annual].filter(Boolean).join('/') + '/yr')
  if (t.atm_withdrawal_other_fee) lines.push(pfx + 'Other bank ATM: JOD ' + t.atm_withdrawal_other_fee)
  return lines.join('\n')
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
    jobs.push(async () => {
      const { data } = await db.from('bank_rates').select('*').in('bank_id', targetIds).order('effective_date', { ascending: false })
      if (data) context.rates = data
    })
  }

  if (needsTariffs(prompt)) {
    jobs.push(async () => {
      const { data } = await db.from('bank_tariffs').select('*').in('bank_id', targetIds).order('effective_date', { ascending: false })
      if (data) context.tariffs = data
    })
  }

  if (needsProducts(prompt)) {
    jobs.push(async () => {
      const { data } = await db.from('bank_products').select('*').in('bank_id', targetIds)
      if (data) context.products = data
    })
  }

  if (needsOwnership(prompt)) {
    jobs.push(async () => {
      const { data } = await db.from('bank_ownership').select('*').in('bank_id', targetIds).order('ownership_pct', { ascending: false })
      if (data) context.ownership = data
    })
  }

  if (needsGovernance(prompt)) {
    jobs.push(async () => {
      const [exec, board] = await Promise.all([
        db.from('bank_executives').select('*').in('bank_id', targetIds),
        db.from('bank_board_members').select('*').in('bank_id', targetIds),
      ])
      if (exec.data) context.executives = exec.data
      if (board.data) context.board = board.data
    })
  }

  if (needsAnnouncements(prompt)) {
    jobs.push(async () => {
      const { data } = await db.from('bank_announcements').select('*').in('bank_id', targetIds).order('announcement_date', { ascending: false }).limit(30)
      if (data) context.announcements = data
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

  const financials: any[] = context.financials || []
  const years = [...new Set(financials.map(f => f.fiscal_year as number))].sort((a, b) => b - a)
  const latestYear = years[0] ?? 2024

  const byBank: Record<number, any[]> = {}
  financials.forEach(f => {
    if (!byBank[f.bank_id]) byBank[f.bank_id] = []
    byBank[f.bank_id].push(f)
  })

  const fmtVal = (n: number | null, bankId: number): string => {
    if (n == null) return 'N/A'
    const v = bankId === ARAB_BANK_ID ? n * USD_TO_JOD : n
    if (Math.abs(v) >= 1_000_000) return 'JOD ' + (v / 1_000_000).toFixed(2) + 'B'
    if (Math.abs(v) >= 1_000) return 'JOD ' + (v / 1_000).toFixed(1) + 'M'
    return 'JOD ' + v.toFixed(0) + 'K'
  }

  let finSection = ''
  for (const bankIdStr of Object.keys(byBank)) {
    const bankId = parseInt(bankIdStr)
    const bank = (context.banks as any[])?.find(b => b.id === bankId)
    if (!bank) continue
    const records = byBank[bankId]
    records.sort((a: any, b: any) => (b.fiscal_year as number) - (a.fiscal_year as number))
    // --- multi-year history (all fetched years: FY2023-2025) so the model never guesses ---
    const histLines = records
      .slice()
      .sort((a: any, b: any) => (a.fiscal_year as number) - (b.fiscal_year as number))
      .map((r: any) => {
        const parts: string[] = []
        if (r.net_profit != null) parts.push(`net profit ${fmtVal(r.net_profit, bankId)}`)
        if (r.total_assets != null) parts.push(`assets ${fmtVal(r.total_assets, bankId)}`)
        if (r.customer_deposits != null) parts.push(`deposits ${fmtVal(r.customer_deposits, bankId)}`)
        const eq = r.shareholders_equity ?? r.total_equity
        if (eq != null) parts.push(`equity ${fmtVal(eq as number, bankId)}`)
        if (r.roe != null) parts.push(`ROE ${(r.roe as number).toFixed(1)}%`)
        if (r.car != null) parts.push(`CAR ${(r.car as number).toFixed(1)}%`)
        if (r.eps_fils != null) parts.push(`EPS ${r.eps_fils} fils`)
        return `    FY${r.fiscal_year}: ${parts.join(", ")}`
      })
      .join("\n")
    if (histLines) finSection += `\n  ${bank.name} (${bank.ticker}) - VERIFIED multi-year history${bankId === ARAB_BANK_ID ? " (converted from USD at 0.71)" : ""}:\n${histLines}\n`
    const curr = records[0]
    const prev = records[1]
    const pct = (a: number, b: number) => b ? ((a - b) / Math.abs(b) * 100).toFixed(1) + '%' : 'N/A'

    finSection += '\n[' + bank.name + ' (' + bank.ticker + ') | FY' + curr.fiscal_year + (bankId === ARAB_BANK_ID ? ' | USD thousands' : '') + ']\n'
    if (curr.net_profit != null) finSection += '  Net Profit: ' + fmtVal(curr.net_profit, bankId) + (prev?.net_profit ? ' (' + pct(curr.net_profit as number, prev.net_profit as number) + ' vs FY' + prev.fiscal_year + ')' : '') + '\n'
    if (curr.total_assets != null) finSection += '  Total Assets: ' + fmtVal(curr.total_assets, bankId) + '\n'
    if (curr.customer_deposits != null) finSection += '  Deposits: ' + fmtVal(curr.customer_deposits, bankId) + '\n'
    const equity = curr.shareholders_equity ?? curr.total_equity
    if (equity != null) finSection += '  Equity: ' + fmtVal(equity as number, bankId) + '\n'
    const ratios = [curr.roe != null ? 'ROE ' + (curr.roe as number).toFixed(1) + '%' : '', curr.roa != null ? 'ROA ' + (curr.roa as number).toFixed(2) + '%' : '', curr.car != null ? 'CAR ' + (curr.car as number).toFixed(1) + '%' : ''].filter(Boolean)
    if (ratios.length) finSection += '  ' + ratios.join(' | ') + '\n'
    const extras = [curr.eps_fils != null ? 'EPS ' + curr.eps_fils + ' fils' : '', curr.dividends_cash_pct != null ? 'Div ' + curr.dividends_cash_pct + '%' : ''].filter(Boolean)
    if (extras.length) finSection += '  ' + extras.join(' | ') + '\n'
  }

  let ratesSection = ''
  if ((context.rates as any[])?.length > 0) {
    ratesSection = '\n=== INTEREST RATES (latest per bank) ===\n'
    const seenBanks = new Set<number>()
    for (const r of context.rates as any[]) {
      if (seenBanks.has(r.bank_id)) continue
      seenBanks.add(r.bank_id)
      const bank = (context.banks as any[])?.find(b => b.id === r.bank_id)
      ratesSection += formatRates(r, bank?.shortName || 'Bank ' + r.bank_id) + '\n'
    }
  }

  let tariffsSection = ''
  if ((context.tariffs as any[])?.length > 0) {
    tariffsSection = '\n=== FEES & TARIFFS (latest per bank) ===\n'
    const seenBanks = new Set<number>()
    for (const t of context.tariffs as any[]) {
      if (seenBanks.has(t.bank_id)) continue
      seenBanks.add(t.bank_id)
      const bank = (context.banks as any[])?.find(b => b.id === t.bank_id)
      tariffsSection += formatTariffs(t, bank?.shortName || 'Bank ' + t.bank_id) + '\n'
    }
  }

  let govSection = ''
  if ((context.executives as any[])?.length || (context.board as any[])?.length) {
    govSection = '\n=== LEADERSHIP ===\n'
    ;(context.executives as any[])?.forEach(e => {
      const bank = (context.banks as any[])?.find(b => b.id === e.bank_id)
      govSection += '[' + bank?.shortName + '] ' + e.title_en + ': ' + e.full_name_en + '\n'
    })
    ;(context.board as any[])?.slice(0, 20).forEach(b => {
      const bank = (context.banks as any[])?.find(bk => bk.id === b.bank_id)
      govSection += '[' + bank?.shortName + '] Board: ' + b.full_name_en + ' (' + b.role + (b.is_independent ? ', Independent' : '') + ')\n'
    })
  }

  let ownSection = ''
  if ((context.ownership as any[])?.length > 0) {
    ownSection = '\n=== OWNERSHIP ===\n'
    ;(context.ownership as any[])?.slice(0, 30).forEach(o => {
      const bank = (context.banks as any[])?.find(b => b.id === o.bank_id)
      ownSection += '[' + bank?.shortName + '] ' + o.shareholder_name_en + ': ' + o.ownership_pct + '%\n'
    })
  }

  let annSection = ''
  if ((context.announcements as any[])?.length > 0) {
    annSection = '\n=== ANNOUNCEMENTS ===\n'
    ;(context.announcements as any[])?.slice(0, 15).forEach(a => {
      const bank = (context.banks as any[])?.find(b => b.id === a.bank_id)
      annSection += '[' + bank?.shortName + ' ' + (a.announcement_date || '').slice(0, 10) + '] ' + a.headline_en + '\n'
      if (a.summary_en) annSection += '  ' + (a.summary_en as string).slice(0, 150) + '\n'
    })
  }

  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  return 'You are Rami â a senior banking analyst and strategic advisor built into HBTF Intelligence. You think like a McKinsey partner who spent 20 years in Jordanian banking. Sharp, direct, opinionated, genuinely helpful â never robotic.\n\n' +
    'PERSONALITY:\n' +
    '- Lead with the key insight, not a preamble\n' +
    '- Natural language: "HBTF made JOD 157.7M in 2025" not raw field names\n' +
    '- Have opinions: "JKB\'s 116% profit jump is extraordinary â driven by Bank of Baghdad consolidation, not organic growth"\n' +
    '- Connect dots: asked about profit? mention what drove it + HBTF implications\n' +
    '- Concise for simple questions; thorough for strategic ones\n' +
    '- When comparing rates/fees: highlight best and worst clearly\n' +
    '- Use **bold** for key numbers, bullet points for comparisons\n\n' +
    'DATA RULES:\n' +
    '1. Financial values in THOUSANDS (divide by 1000=millions, 1000000=billions)\n' +
    '2. Arab Bank (bank_id 1) = USD thousands (multiply by 0.71 for JOD)\n' +
    '3. Latest data year: FY' + latestYear + '\n' +
    '4. JKB FY2024 profit JOD 194.3M = VERIFIED CORRECT (includes Bank of Baghdad Iraq subsidiary)\n\n' +
    'HBTF (OUR BANK â bank_id 2):\n' +
    '- FY2025: Net Profit JOD 157.7M (+4.9%), Total Assets JOD 9.39B, Deposits JOD 6.3B\n' +
    '- FY2024: Net Profit JOD 150.3M (+6.7%), Total Assets JOD 9.22B, ROE 11.3%, CAR 18.6%\n' +
    '- Always frame peer insights vs HBTF competitive position\n\n' +
    'CHART FORMAT — CRITICAL RULES:\n' +
    '1. Use ONLY when chart genuinely adds insight\n' +
    '2. Place EXACTLY ONE chart block at END of response\n' +
    '3. SUPPORTED TYPES: "bar", "line", "pie", "donut" — use exactly what user requests\n' +
    '4. For GROWTH comparisons: use PERCENTAGE values (%), not absolute JOD values\n' +
    '5. For multi-bank comparisons: include ALL requested banks — never omit one\n' +
    '6. Multi-bank series format: data objects must have bank names as keys\n' +
    '7. "unit" field controls Y-axis: use "%" for percentages, "JOD M" for millions\n' +
    '\n' +
    'CHART TEMPLATES:\n' +
    'Single trend bar: ```chart\n{"type":"bar","title":"HBTF Net Profit (JOD M)","data":[{"name":"FY2023","value":140.8},{"name":"FY2024","value":150.3},{"name":"FY2025","value":157.7}],"series":["value"],"unit":"JOD M","insight":"Insight here"}\n```\n' +
    'Multi-bank line: ```chart\n{"type":"line","title":"Profit Comparison (JOD M)","data":[{"name":"FY2023","HBTF":140.8,"Capital":96.0},{"name":"FY2024","HBTF":150.3,"Capital":70.2},{"name":"FY2025","HBTF":157.7,"Capital":201.0}],"series":["HBTF","Capital"],"unit":"JOD M","insight":"Insight here"}\n```\n' +
    'YoY growth %: ```chart\n{"type":"bar","title":"YoY Net Profit Growth (%)","data":[{"name":"HBTF","value":4.9},{"name":"Capital","value":186.3}],"series":["value"],"unit":"%","insight":"Insight here"}\n```\n' +
    'Donut/pie: ```chart\n{"type":"donut","title":"FY2025 Sector Profit Share","data":[{"name":"HBTF","value":157.7},{"name":"JKB","value":151.1},{"name":"Capital","value":201.0}],"series":["value"],"unit":"JOD M","insight":"Insight here"}\n```\n\n' +
    'Today: ' + today + '\n\n' +
    '=== FINANCIAL DATA ===\n' + finSection +
    ratesSection + tariffsSection + govSection + ownSection + annSection
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
      messages: (messages as any[]).filter(m => m.content).map(m => ({ role: m.role, content: m.content })),
      stream: true,
    }),
  })

  if (!response.ok) {
    const err = await response.text()
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
