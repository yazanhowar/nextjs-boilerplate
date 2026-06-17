// app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { BANKS } from '@/lib/banks-config'

function getDB() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

function detectBankIds(prompt: string): number[] {
  const lower = prompt.toLowerCase()
  const found: number[] = []
  for (const bank of BANKS) {
    const terms = [bank.name, bank.shortName, bank.ticker, bank.nameAr].map(s => s.toLowerCase())
    if (terms.some(t => lower.includes(t))) found.push(bank.id)
  }
  return [...new Set(found)]
}

// Classify what data is needed
function needsRates(p: string) { return /rate|interest|profit rate|return|margin|mortgage|housing loan|home loan|personal loan|car loan|auto loan|saving|term deposit|td |murabaha|wakala|ijara|ijarah/i.test(p) }
function needsTariffs(p: string) { return /fee|charge|credit card|transfer|maintenance|safe box|commission|tariff|cost|price|annual fee|debit card|card fee|renewal|issuance/i.test(p) }
function needsProducts(p: string) { return /product|service|offer|card|account|islamic|sharia|digital|mobile|app|what do|provide|range|portfolio/i.test(p) }
function needsOwnership(p: string) { return /own|shareholder|stake|investor|who controls|ownership|majority|parent|holding|kipco|qnb|ssf/i.test(p) }
function needsGovernance(p: string) { return /ceo|chairman|board|director|executive|management|leadership|who runs|appoint|head|president/i.test(p) }
function needsAnnouncements(p: string) { return /news|announce|agm|assembly|latest|recent|dividend declared|rating|merger|acquisition|upgrade|downgrade/i.test(p) }
function needsRealEstate(p: string) { return /real estate|property|properties|for sale|house|apartment|land|real-estate/i.test(p) }

// Detect loan type specifically to avoid mixing personal vs housing rates
function detectLoanType(p: string): string | null {
  if (/personal loan|consumer loan|retail loan/i.test(p)) return 'personal'
  if (/housing loan|home loan|mortgage|real estate loan/i.test(p)) return 'housing'
  if (/car loan|auto loan|vehicle/i.test(p)) return 'auto'
  if (/sme|business loan|corporate loan/i.test(p)) return 'sme'
  return null
}

async function fetchContext(prompt: string, bankIds: number[]) {
  const db = getDB()
  const targetIds = bankIds.length > 0 ? bankIds : BANKS.map(b => b.id)
  const context: Record<string, any> = {}
  const jobs: Array<() => Promise<void>> = []

  // Always fetch financials - get both 2024 AND 2025 if available
  jobs.push(async () => {
    const { data } = await db
      .from('bank_financials')
      .select('bank_id, fiscal_year, net_profit, total_assets, customer_deposits, net_loans, total_equity, roe, roa, car, npl_ratio, eps, dividend_per_share, share_price')
      .in('bank_id', targetIds)
      .in('fiscal_year', [2023, 2024, 2025])
      .order('fiscal_year', { ascending: false })
    if (data && data.length > 0) context.financials = data
  })

  if (needsRates(prompt)) {
    const loanType = detectLoanType(prompt)
    jobs.push(async () => {
      let query = db.from('bank_rates').select('*').in('bank_id', targetIds)
      // If user asks specifically about personal loans, filter to avoid showing housing rates
      if (loanType) {
        query = query.ilike('rate_type', `%${loanType}%`)
      }
      const { data } = await query
      if (data) {
        context.rates = data
        context.loanTypeFilter = loanType
      }
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
      const { data } = await db.from('bank_real_estate').select('bank_id, property_type, location, price_jod, area_sqm, description_en, listing_url').in('bank_id', targetIds).limit(20)
      if (data) context.realEstate = data
    })
  }

  context.banks = BANKS.filter(b => targetIds.includes(b.id)).map(b => ({
    id: b.id, name: b.name, shortName: b.shortName, ticker: b.ticker,
    sector: b.sector, isHBTF: b.isHBTF, description: b.description,
  }))

  await Promise.allSettled(jobs.map(j => j()))
  return context
}

function buildSystemPrompt(context: Record<string, any>): string {
  return `You are Rami — a senior banking analyst and strategic advisor embedded inside HBTF's competitive intelligence platform. You have deep expertise in Jordanian banking, finance, and strategy.

PERSONALITY & TONE:
- You think and speak like a brilliant McKinsey partner who also happens to have spent 20 years in Jordanian banking
- Be direct, sharp, insightful — not robotic or formulaic
- Lead with the most important insight first, then support with data
- Use natural language — say "HBTF made JOD 150M last year" not "The net_profit field shows 150300"
- It's okay to have opinions: "That's actually impressive — JKB grew profits 116% in one year, which is exceptional for a bank this size"
- Connect dots across data: if asked about rates, mention competitive position; if asked about profit, mention what drove it
- Be concise when the question is simple; be thorough when it's complex
- Never use table headers in ALL CAPS; use Title Case
- Format numbers cleanly: JOD 150.3M not JOD 150,300,000

DATA ACCURACY RULES:
1. Answer ONLY from the data below. Never invent numbers, rates, or facts.
2. If data is missing for something, say so naturally: "I don't have that data yet" — then suggest what you do know
3. Financials are stored in THOUSANDS. So value ÷ 1,000 = JOD XXM; value ÷ 1,000,000 = JOD X.XB
4. Arab Bank (bank_id: 1) stores values in USD thousands → multiply by 0.71 for JOD
5. Rates are already in percentages. Card/account fees are in JOD.
6. If loanTypeFilter is set in context, only show rates matching that loan type
7. FY2025 data may be available — always check and use the most recent year available
8. JKB's 2024 net profit of JOD 194.3M is CORRECT — it includes Bank of Baghdad (Iraq) subsidiary; this is a verified consolidated group figure with 116% growth vs 2023

HBTF CONTEXT:
- HBTF (bank_id: 2) is the platform owner — always position HBTF relative to peers
- HBTF 2024 verified: Net Profit JOD 150.3M (+6.7% vs 2023), Total Assets JOD 9.2B, Deposits JOD 6.0B, Equity JOD 1.4B, ROE 11.3%, CAR 18.6%

CHART FORMAT — append at the END only when visually useful:
\`\`\`chart
{"type":"bar","title":"Title","data":[{"name":"HBTF","value":150}],"series":["value"],"insight":"One-sentence takeaway"}
\`\`\`

Today: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}.

DATA:
${JSON.stringify(context, null, 2)}`
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
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: systemPrompt,
      messages: messages.filter((m: any) => m.content).map((m: any) => ({
        role: m.role,
        content: m.content,
      })),
      stream: true,
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    console.error('[HBTF] Anthropic error:', err)
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
