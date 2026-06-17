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

function needsRates(p: string) { return /rate|interest|loan|saving|deposit|td |murabaha|wakala|mudaraba/i.test(p) }
function needsTariffs(p: string) { return /fee|charge|credit card|transfer|maintenance|commission|tariff|cost|price|card fee|renewal|safe box|atm/i.test(p) }
function needsProducts(p: string) { return /product|service|offer|card|account|islamic|sharia|digital|mobile|what do|provide|portfolio/i.test(p) }
function needsOwnership(p: string) { return /own|shareholder|stake|investor|who controls|ownership|majority|parent|holding/i.test(p) }
function needsGovernance(p: string) { return /ceo|chairman|board|director|executive|management|leadership|who runs/i.test(p) }
function needsAnnouncements(p: string) { return /news|announce|agm|latest|recent|dividend|rating|merger|acquisition/i.test(p) }
function needsRealEstate(p: string) { return /real estate|property|properties|for sale|house|apartment|land|listing/i.test(p) }

// Format rate row into readable text for AI
function formatRates(r: any, bankName: string): string {
  const lines: string[] = []
  const yr = r.effective_date ? r.effective_date.slice(0,7) : 'latest'
  const pfx = '[' + bankName + ' ' + yr + '] '
  if (r.home_loan_min || r.home_loan_max) lines.push(pfx + 'Housing loan: ' + [r.home_loan_min, r.home_loan_max].filter(Boolean).join('%–') + '%')
  if (r.personal_loan_min || r.personal_loan_max) lines.push(pfx + 'Personal loan: ' + [r.personal_loan_min, r.personal_loan_max].filter(Boolean).join('%–') + '%')
  if (r.car_loan_min || r.car_loan_max) lines.push(pfx + 'Car loan: ' + [r.car_loan_min, r.car_loan_max].filter(Boolean).join('%–') + '%')
  if (r.corporate_loan_min || r.corporate_loan_max) lines.push(pfx + 'Corporate loan: ' + [r.corporate_loan_min, r.corporate_loan_max].filter(Boolean).join('%–') + '%')
  if (r.sme_loan_min || r.sme_loan_max) lines.push(pfx + 'SME loan: ' + [r.sme_loan_min, r.sme_loan_max].filter(Boolean).join('%–') + '%')
  if (r.credit_card_rate) lines.push(pfx + 'Credit card rate: ' + r.credit_card_rate + '%')
  if (r.overdraft_rate) lines.push(pfx + 'Overdraft: ' + r.overdraft_rate + '%')
  if (r.saving_rate) lines.push(pfx + 'Savings rate: ' + r.saving_rate + '%')
  const tdRates = [r.td_1m && '1M:' + r.td_1m + '%', r.td_3m && '3M:' + r.td_3m + '%', r.td_6m && '6M:' + r.td_6m + '%', r.td_12m && '12M:' + r.td_12m + '%', r.td_24m && '24M:' + r.td_24m + '%'].filter(Boolean)
  if (tdRates.length) lines.push(pfx + 'JOD TD rates — ' + tdRates.join(', '))
  const tdUsd = [r.td_usd_3m && '3M:' + r.td_usd_3m + '%', r.td_usd_6m && '6M:' + r.td_usd_6m + '%', r.td_usd_12m && '12M:' + r.td_usd_12m + '%'].filter(Boolean)
  if (tdUsd.length) lines.push(pfx + 'USD TD rates — ' + tdUsd.join(', '))
  if (r.murabaha_rate_min || r.murabaha_rate_max) lines.push(pfx + 'Murabaha: ' + [r.murabaha_rate_min, r.murabaha_rate_max].filter(Boolean).join('%–') + '%')
  if (r.wakala_rate) lines.push(pfx + 'Wakala: ' + r.wakala_rate + '%')
  if (r.mudaraba_rate) lines.push(pfx + 'Mudaraba: ' + r.mudaraba_rate + '%')
  return lines.join('\n')
}

// Format tariff row into readable text for AI
function formatTariffs(t: any, bankName: string): string {
  const lines: string[] = []
  const pfx = '[' + bankName + '] '
  if (t.local_transfer_fee) lines.push(pfx + 'Local transfer: ' + t.local_transfer_fee + (t.local_transfer_fee_type === 'pct' ? '%' : ' JOD'))
  if (t.swift_transfer_fee_jod) lines.push(pfx + 'SWIFT transfer: JOD ' + t.swift_transfer_fee_jod + (t.swift_transfer_fee_pct ? ' + ' + t.swift_transfer_fee_pct + '%' : '') + (t.swift_transfer_min ? ' (min ' + t.swift_transfer_min + ')' : ''))
  if (t.account_maintenance_fee) lines.push(pfx + 'Account maintenance: JOD ' + t.account_maintenance_fee + '/year')
  if (t.debit_card_annual_fee) lines.push(pfx + 'Debit card annual fee: JOD ' + t.debit_card_annual_fee)
  if (t.credit_card_annual_fee_classic) lines.push(pfx + 'Credit card Classic annual fee: JOD ' + t.credit_card_annual_fee_classic)
  if (t.credit_card_annual_fee_gold) lines.push(pfx + 'Credit card Gold annual fee: JOD ' + t.credit_card_annual_fee_gold)
  if (t.credit_card_annual_fee_platinum) lines.push(pfx + 'Credit card Platinum annual fee: JOD ' + t.credit_card_annual_fee_platinum)
  if (t.cash_advance_fee_pct) lines.push(pfx + 'Cash advance fee: ' + t.cash_advance_fee_pct + '%')
  if (t.late_payment_fee) lines.push(pfx + 'Late payment fee: JOD ' + t.late_payment_fee)
  if (t.loan_origination_fee_pct) lines.push(pfx + 'Loan origination fee: ' + t.loan_origination_fee_pct + '%')
  if (t.early_settlement_fee_pct) lines.push(pfx + 'Early settlement fee: ' + t.early_settlement_fee_pct + '%')
  if (t.safe_box_small_annual) lines.push(pfx + 'Safe box small: JOD ' + t.safe_box_small_annual + '/year')
  if (t.safe_box_medium_annual) lines.push(pfx + 'Safe box medium: JOD ' + t.safe_box_medium_annual + '/year')
  if (t.safe_box_large_annual) lines.push(pfx + 'Safe box large: JOD ' + t.safe_box_large_annual + '/year')
  if (t.atm_withdrawal_other_fee) lines.push(pfx + 'Other bank ATM withdrawal: JOD ' + t.atm_withdrawal_other_fee)
  if (t.cheque_book_fee) lines.push(pfx + 'Cheque book: JOD ' + t.cheque_book_fee)
  return lines.join('\n')
}

async function fetchContext(prompt: string, bankIds: number[]) {
  const db = getDB()
  const targetIds = bankIds.length > 0 ? bankIds : BANKS.map(b => b.id)
  const context: Record<string, any> = {}
  const jobs: Array<() => Promise<void>> = []

  // Always fetch financials
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

  const years = [...new Set((context.financials || []).map((f: any) => f.fiscal_year))].sort((a: number, b: number) => b - a)
  const latestYear = years[0] ?? 2024

  const byBank: Record<number, any[]> = {}
  ;(context.financials || []).forEach((f: any) => {
    if (!byBank[f.bank_id]) byBank[f.bank_id] = []
    byBank[f.bank_id].push(f)
  })

  const fmtVal = (n: number | null, bankId: number) => {
    if (n == null) return 'N/A'
    const v = bankId === ARAB_BANK_ID ? n * USD_TO_JOD : n
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
    const pct = (a: number, b: number) => b ? ((a - b) / Math.abs(b) * 100).toFixed(1) + '%' : 'N/A'
    const isUSD = bankId === ARAB_BANK_ID

    finSection += '\n[' + bank.name + ' (' + bank.ticker + ') | FY' + curr.fiscal_year + (isUSD ? ' | USD thousands' : '') + ']\n'
    if (curr.net_profit != null) finSection += '  Net Profit: ' + fmtVal(curr.net_profit, bankId) + (prev?.net_profit ? ' (' + pct(curr.net_profit, prev.net_profit) + ' vs FY' + prev.fiscal_year + ')' : '') + '\n'
    if (curr.total_assets != null) finSection += '  Total Assets: ' + fmtVal(curr.total_assets, bankId) + '\n'
    if (curr.customer_deposits != null) finSection += '  Deposits: ' + fmtVal(curr.customer_deposits, bankId) + '\n'
    const equity = curr.shareholders_equity ?? curr.total_equity
    if (equity != null) finSection += '  Equity: ' + fmtVal(equity, bankId) + '\n'
    const ratios = [curr.roe != null ? 'ROE ' + curr.roe.toFixed(1) + '%' : '', curr.roa != null ? 'ROA ' + curr.roa.toFixed(2) + '%' : '', curr.car != null ? 'CAR ' + curr.car.toFixed(1) + '%' : '', curr.npl_ratio != null ? 'NPL ' + curr.npl_ratio.toFixed(1) + '%' : ''].filter(Boolean)
    if (ratios.length) finSection += '  ' + ratios.join(' | ') + '\n'
    const extras = [curr.eps_fils != null ? 'EPS ' + curr.eps_fils + ' fils' : '', curr.dividends_cash_pct != null ? 'Cash Div ' + curr.dividends_cash_pct + '%' : '', curr.net_interest_margin != null ? 'NIM ' + curr.net_interest_margin.toFixed(2) + '%' : '', curr.cost_to_income != null ? 'C/I ' + curr.cost_to_income.toFixed(1) + '%' : ''].filter(Boolean)
    if (extras.length) finSection += '  ' + extras.join(' | ') + '\n'
  }

  let ratesSection = ''
  if (context.rates?.length > 0) {
    ratesSection = '\n=== INTEREST RATES (most recent per bank) ===\n'
    // Only show most recent row per bank
    const seenBanks = new Set()
    for (const r of context.rates) {
      if (seenBanks.has(r.bank_id)) continue
      seenBanks.add(r.bank_id)
      const bank = context.banks?.find((b: any) => b.id === r.bank_id)
      ratesSection += formatRates(r, bank?.shortName || 'Bank ' + r.bank_id) + '\n'
    }
  }

  let tariffsSection = ''
  if (context.tariffs?.length > 0) {
    tariffsSection = '\n=== FEES & TARIFFS (most recent per bank) ===\n'
    const seenBanks = new Set()
    for (const t of context.tariffs) {
      if (seenBanks.has(t.bank_id)) continue
      seenBanks.add(t.bank_id)
      const bank = context.banks?.find((b: any) => b.id === t.bank_id)
      tariffsSection += formatTariffs(t, bank?.shortName || 'Bank ' + t.bank_id) + '\n'
    }
  }

  let govSection = ''
  if (context.executives?.length || context.board?.length) {
    govSection = '\n=== LEADERSHIP ===\n'
    context.executives?.forEach((e: any) => {
      const bank = context.banks?.find((b: any) => b.id === e.bank_id)
      govSection += '[' + bank?.shortName + '] ' + e.title_en + ': ' + e.full_name_en + '\n'
    })
    context.board?.slice(0, 20).forEach((b: any) => {
      const bank = context.banks?.find((bk: any) => bk.id === b.bank_id)
      govSection += '[' + bank?.shortName + '] Board: ' + b.full_name_en + ' (' + b.role + (b.is_independent ? ', Independent' : '') + ')\n'
    })
  }

  let ownSection = ''
  if (context.ownership?.length > 0) {
    ownSection = '\n=== OWNERSHIP ===\n'
    context.ownership?.slice(0, 30).forEach((o: any) => {
      const bank = context.banks?.find((b: any) => b.id === o.bank_id)
      ownSection += '[' + bank?.shortName + '] ' + o.shareholder_name_en + ': ' + o.ownership_pct + '%\n'
    })
  }

  let annSection = ''
  if (context.announcements?.length > 0) {
    annSection = '\n=== RECENT ANNOUNCEMENTS ===\n'
    context.announcements?.slice(0, 15).forEach((a: any) => {
      const bank = context.banks?.find((b: any) => b.id === a.bank_id)
      annSection += '[' + bank?.shortName + ' ' + (a.announcement_date || '').slice(0,10) + '] ' + a.headline_en + '\n'
      if (a.summary_en) annSection += '  ' + a.summary_en.slice(0, 150) + '\n'
    })
  }

  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  return 'You are Rami — a senior banking analyst and strategic advisor built into HBTF Intelligence. You think like a McKinsey partner who spent 20 years in Jordanian banking. Sharp, direct, opinionated, genuinely helpful — not a chatbot.\n\n' +
    'PERSONALITY:\n' +
    '- Lead with the key insight, not a preamble\n' +
    '- Use natural language: say "HBTF made JOD 157.7M profit in 2025" not raw field values\n' +
    '- Have and share opinions: "That 116% jump at JKB is extraordinary — driven by Bank of Baghdad, not organic growth"\n' +
    '- Proactively connect dots: asked about one metric? Mention what drove it + HBTF implications\n' +
    '- Be concise for simple questions; thorough for complex strategic ones\n' +
    '- When comparing rates/fees: highlight best deal and worst deal clearly\n' +
    '- Use markdown formatting: bold key numbers, use bullet points for comparisons\n\n' +
    'DATA RULES (CRITICAL):\n' +
    '1. All financial values stored in THOUSANDS — divide by 1000 for millions, 1000000 for billions\n' +
    '2. Arab Bank (bank_id 1) values are in USD thousands — multiply by 0.71 for JOD equivalent\n' +
    '3. Latest year available: FY' + latestYear + '\n' +
    '4. Rates table has flat structure: home_loan_min/max, personal_loan_min/max, td_12m, etc\n' +
    '5. JKB FY2024 profit JOD 194.3M is VERIFIED CORRECT (includes Bank of Baghdad Iraq subsidiary, +116%)\n\n' +
    'HBTF (OUR BANK — bank_id 2):\n' +
    '- FY2025: Net Profit JOD 157.7M (+4.9%), Total Assets JOD 9.39B, Deposits JOD 6.3B\n' +
    '- FY2024: Net Profit JOD 150.3M (+6.7%), Total Assets JOD 9.22B, ROE 11.3%, CAR 18.6%\n' +
    '- Always frame peer insights vs HBTF competitive position\n\n' +
    'CHART FORMAT (use at end only when genuinely adds value):\n' +
    '```chart\n{"type":"bar","title":"Title","data":[{"name":"HBTF","value":150}],"series":["value"],"insight":"Key takeaway"}\n```\n\n' +
    'Today: ' + today + '\n\n' +
    '=== FINANCIAL DATA (in thousands, most recent year first) ===\n' + finSection +
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
      messages: messages.filter((m: any) => m.content).map((m: any) => ({ role: m.role, content: m.content })),
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