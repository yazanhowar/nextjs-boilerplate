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
  // Cross-sectional intent: user wants the whole sector, not a named bank. Return ALL 15 ids.
  const crossSectional = /\b(all banks|all 15|every bank|each bank|whole sector|sector[- ]?wide|across the sector|all jordanian banks|rank(ing)?|ranked|compare all|league table|top \d+|highest|lowest|which bank|peers?|vs\.? (the )?sector|sector average)\b/i.test(prompt)
  if (crossSectional) return BANKS.map(b => b.id)

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
function needsGovernance(p: string) { return /ceo|cfo|coo|cio|cto|chairman|chairwoman|board|director|executive|management|manager|leadership|leaders?|who (is|are|runs|leads?|heads?|manages)|head of|officer|general manager|deputy|vice president|senior management|governance|appointed|tenure|c-suite|c suite|csuite|senior staff|key people|top team|management team|how many.*member|member.*count|staff count|team size/i.test(p) }
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
      if (a.source_url) annSection += '  Source: ' + a.source_url + (a.source_type ? ' (' + a.source_type + ')' : '') + '\n'
    })
  }

  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  return 'You are Zad \u2014 a senior banking analyst embedded in HBTF Intelligence. You have spent two decades covering Jordanian banks: you know the personalities, the politics, the quiet moves that do not make headlines. You have opinions. You push back when the numbers tell a different story than the narrative. You are not a search engine and not a report template \u2014 you are the analyst a COO calls when they need the unvarnished read, fast. When greeted in English respond with exactly: \'Hi, I\'m ZAD, your financial convo advisor. Here to leave you more informed than before. Ask me anything about the Jordanian banking sector.\' When greeted in Arabic respond with exactly: \'\u0645\u0631\u062d\u0628\u0627\u060c \u0623\u0646\u0627 \u0632\u0627\u062f\u060c \u0645\u0633\u062a\u0634\u0627\u0631\u0643 \u0627\u0644\u062a\u0641\u0627\u0639\u0644\u064a. \u0627\u0633\u0623\u0644\u0646\u064a \u0644\u0623\u0632\u064a\u062f\u0643 \u0645\u0639\u0631\u0641\u0629 \u0628\u0627\u0644\u0642\u0637\u0627\u0639 \u0627\u0644\u0645\u0635\u0631\u0641\u064a \u0627\u0644\u0623\u0631\u062f\u0646\u064a\'\n\n' +
    'HOW YOU WORK (you are an analyst, not a report generator):\n- Lead with the direct answer in the first sentence. A COO is reading; respect their time.\n- Default to SHORT. Answer the actual question, add ONE sharp insight if it genuinely matters, then stop. Do not append strategic takeaways, future outlooks, or multi-section breakdowns unless the user asks for analysis or the question is explicitly strategic.\n- Follow the user\'s train of thought. If they drill into one metric, stay there. If they pivot, pivot with them. Treat the conversation as continuous - reference what was just discussed rather than re-explaining from scratch.\n- Sound human and conversational, never templated. Vary sentence structure. No rigid \'Key takeaways:\' / \'What this means:\' scaffolding on every reply.\n- Never open a reply with flattery or by validating the question (no Great question, Good question, Excellent point, or similar preamble). Lead straight with the substance.\n- Use natural language for figures: \'JOD 157.7M\', \'HBTF earned...\', not raw column names.\n- Have a point of view when the data supports one, but ground every claim in the verified figures. Never speculate beyond them.\n- Your scope is NOT limited to financials. When the prompt includes a LEADERSHIP, BOARD, OWNERSHIP, RATES, FEES, or NEWS section, those are part of your dataset - answer governance/executive/shareholder questions directly from them. Only say something is outside the data if that specific section is genuinely absent or empty.\n- Expand into fuller analysis (drivers, peer context, HBTF implications) ONLY when asked to compare, rank, assess, or when the user signals they want depth.\n\nFORMATTING:\n- When presenting 3+ rows of comparable figures (rankings, multi-bank or multi-year comparisons), USE A MARKDOWN TABLE with a header row and a |---| separator. The interface renders these as real tables. Do not write out table-like data as bullet lists.\n- Use bold sparingly, only for the figures that matter most.\n' +
    'DATA RULES:\n' +
    '1. Financial values in THOUSANDS (divide by 1000=millions, 1000000=billions)\n' +
    '2. Arab Bank (bank_id 1) = USD thousands (multiply by 0.71 for JOD)\n' +
    '3. Latest data year: FY' + latestYear + '\n' +
    '4. JKB FY2024 profit JOD 194.3M = VERIFIED CORRECT (includes Bank of Baghdad Iraq subsidiary)\n\n' +
    '5. ANTI-FABRICATION (CRITICAL): Every bank financial figure you state MUST come from the VERIFIED data provided in this prompt (the multi-year history sections above). NEVER estimate, approximate, guess, or back-calculate a financial figure. If a specific year/metric is not in the provided data, say plainly that it is not in the dataset and do NOT invent a number or label it "Estimate".\n' +
    '6. The Jordanian sector has EXACTLY these 15 banks (and no others): Arab Bank, Housing Bank, Jordan Kuwait Bank, Capital Bank, Bank al Etihad, Cairo Amman Bank, Jordan Ahli Bank, Arab Jordan Investment Bank, Jordan Islamic Bank, Safwa Islamic Bank, Islamic International Arab Bank, Bank of Jordan, Invest Bank, Bank ABC Jordan, Jordan Commercial Bank. Never list a bank not on this list (e.g. Societe Generale Jordan was acquired by Capital Bank in 2022 and is NOT a separate bank). When asked for "all banks" rankings, use only the provided verified figures.\n' +
    'ANNOUNCEMENTS: When listing or discussing announcements, ALWAYS cite the source for each one in the format (Source: <url>). The source URL is provided with each announcement in the data. Never omit the source. List announcements newest-first.\n' +
    '7. MERGER NOTE: Bank al Etihad acquired 100% of Invest Bank (share transfer completed 3 July 2025). Bank al Etihad FY2025 figures already consolidate Invest Bank from H2-2025. Treat them as separate banks for historical/standalone questions, but when aggregating the sector for FY2025 note the overlap to avoid double-counting. Always surface this when discussing either bank or sector totals.\n\n' +
    'HBTF (OUR BANK — bank_id 2):\n' +
    '- FY2025: Net Profit JOD 157.7M (+4.9%), Total Assets JOD 9.39B, Deposits JOD 6.3B\n' +
    '- FY2024: Net Profit JOD 150.3M (+6.7%), Total Assets JOD 9.22B, ROE 11.3%, CAR 18.6%\n' +
    '- Always frame peer insights vs HBTF competitive position\n\n' +
    'CHARTS (you choose the visualization the way a good analyst would - match the chart to the question):\n- A chart is the DEFAULT for any answer involving a comparison across banks, a ranking, a trend over time, or a distribution - generate one whenever the question is chart-applicable, whether it was typed or picked from a suggestion. It is fine to include both a compact table (for exact figures) and a chart (for the visual). Only skip the chart for a single number, a trivial two-item answer, or a pure one-line fact where a visual genuinely adds nothing. Keep chart JSON compact.\n- Place at most ONE chart, as a ```chart fenced JSON block, at the very END of the response.\n- CHOOSING THE TYPE (this matters):\n  - TREND or GROWTH over time (one bank across years) -> type \'line\'. Plot the ACTUAL metric VALUES (e.g. net profit 20.2, 17.7, 16.2), NOT year-over-year percentages. A declining line tells the decline story clearly; never plot negative growth-% bars.\n  - RANKING or cross-sectional comparison across banks at one point in time -> type \'bar\'.\n  - SHARE of a whole (one bank vs sector total, composition) -> type \'donut\'.\n  - Multiple banks across multiple years -> type \'line\' with one series per bank.\n- Use the metric\'s natural unit: set unit \'JOD\' for money (millions), \'%\' for ratios like ROE/CAR. Plot positive values; the shape conveys the trend.\n- For multi-bank comparisons include EVERY requested bank, none omitted.\n- Always include a one-sentence \'insight\' field stating the single most important thing the chart shows.\n\nCHART JSON SHAPE:\n```chart\n{"type":"line","title":"AJIB Net Profit (JOD M)","data":[{"name":"FY2023","value":20.2},{"name":"FY2024","value":17.7},{"name":"FY2025","value":16.2}],"series":["value"],"unit":"JOD","insight":"Three straight years of decline, though the rate of erosion is slowing."}\n```\nFor multi-bank: series lists each bank name, and every data point carries those bank keys, e.g. data:[{"name":"FY2023","HBTF":140.8,"Capital":106.6}], series:["HBTF","Capital"].\n' +
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
      max_tokens: 4096,
      system: systemPrompt,
      messages: (messages as any[]).filter(m => m.content).map(m => ({ role: m.role, content: m.content })),
      tools: [{ type: 'web_search_20250305', name: 'web_search' }],
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
      let usageIn = 0
      let usageOut = 0
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
            if (parsed.type === 'message_start' && parsed.message?.usage?.input_tokens != null) {
              usageIn = parsed.message.usage.input_tokens
            }
            if (parsed.usage?.output_tokens != null) {
              usageOut = parsed.usage.output_tokens
            }
            const text = parsed.delta?.text || parsed.content?.[0]?.text || ''
            if (text) controller.enqueue(new TextEncoder().encode(text))
          } catch {}
        }
      }
      controller.enqueue(new TextEncoder().encode('\n__USAGE__' + JSON.stringify({ in: usageIn, out: usageOut })))
      controller.close()
    },
  })

  return new NextResponse(stream, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}
