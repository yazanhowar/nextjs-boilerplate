// app/api/chat/route.ts
// Claude-powered banking analyst — strictly answers from DB data, no hallucination

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { BANKS } from '@/lib/banks-config'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ── Detect which banks the user is asking about ───────────────────────────────
function detectBankIds(prompt: string): number[] {
  const lower = prompt.toLowerCase()
  const found: number[] = []
  for (const bank of BANKS) {
    if (
      lower.includes(bank.name.toLowerCase()) ||
      lower.includes(bank.shortName.toLowerCase()) ||
      lower.includes(bank.ticker.toLowerCase())
    ) {
      found.push(bank.id)
    }
  }
  return found
}

// ── Detect what data the user needs ──────────────────────────────────────────
function needsFinancials(prompt: string): boolean {
  const kw = ['profit', 'asset', 'deposit', 'loan', 'revenue', 'income', 'equity', 'roe', 'roa', 'capital', 'ratio', 'growth', 'financial', 'earn', 'return', 'dividend', 'performance', 'result', 'balance']
  const lower = prompt.toLowerCase()
  return kw.some(k => lower.includes(k))
}

function needsRates(prompt: string): boolean {
  const kw = ['rate', 'interest', 'mortgage', 'home loan', 'personal loan', 'car loan', 'saving', 'deposit rate', 'td ', 'term deposit', 'murabaha', 'wakala']
  const lower = prompt.toLowerCase()
  return kw.some(k => lower.includes(k))
}

function needsTariffs(prompt: string): boolean {
  const kw = ['fee', 'charge', 'credit card', 'transfer', 'maintenance', 'safe box', 'commission', 'tariff', 'cost', 'price', 'annual fee', 'settlement']
  const lower = prompt.toLowerCase()
  return kw.some(k => lower.includes(k))
}

function needsProducts(prompt: string): boolean {
  const kw = ['product', 'service', 'offer', 'card', 'account', 'islamic', 'sharia', 'digital', 'mobile', 'app', 'have', 'provide']
  const lower = prompt.toLowerCase()
  return kw.some(k => lower.includes(k))
}

function needsOwnership(prompt: string): boolean {
  const kw = ['own', 'shareholder', 'stake', 'investor', 'who controls', 'ownership', 'majority', 'parent']
  const lower = prompt.toLowerCase()
  return kw.some(k => lower.includes(k))
}

function needsGovernance(prompt: string): boolean {
  const kw = ['ceo', 'chairman', 'board', 'director', 'executive', 'management', 'leadership', 'who runs', 'appoint']
  const lower = prompt.toLowerCase()
  return kw.some(k => lower.includes(k))
}

function needsAnnouncements(prompt: string): boolean {
  const kw = ['news', 'announce', 'agm', 'assembly', 'latest', 'recent', 'dividend declared', 'rating', 'merger', 'acquisition']
  const lower = prompt.toLowerCase()
  return kw.some(k => lower.includes(k))
}

function needsChart(prompt: string): boolean {
  const kw = ['chart', 'graph', 'plot', 'visuali', 'compare', 'trend', 'show me', 'display']
  const lower = prompt.toLowerCase()
  return kw.some(k => lower.includes(k))
}

// ── Fetch relevant data from Supabase ─────────────────────────────────────────
async function fetchContext(prompt: string, bankIds: number[]) {
  const targetIds = bankIds.length > 0 ? bankIds : BANKS.map(b => b.id)
  const context: Record<string, any> = {}

  const fetches: Promise<void>[] = []

  if (needsFinancials(prompt)) {
    fetches.push(
      supabase
        .from('bank_financials')
        .select('bank_id, fiscal_year, net_profit, total_assets, total_deposits, net_loans, total_equity, roe, roa, car, npl_ratio, net_interest_income, eps_fils')
        .in('bank_id', targetIds)
        .order('fiscal_year', { ascending: true })
        .then(({ data }) => { if (data) context.financials = data })
    )
  }

  if (needsRates(prompt)) {
    fetches.push(
      supabase
        .from('bank_rates')
        .select('*')
        .in('bank_id', targetIds)
        .then(({ data }) => { if (data) context.rates = data })
    )
  }

  if (needsTariffs(prompt)) {
    fetches.push(
      supabase
        .from('bank_tariffs')
        .select('*')
        .in('bank_id', targetIds)
        .then(({ data }) => { if (data) context.tariffs = data })
    )
  }

  if (needsProducts(prompt)) {
    fetches.push(
      supabase
        .from('bank_products')
        .select('bank_id, category, product_name_en, description_en, is_islamic, sharia_structure')
        .in('bank_id', targetIds)
        .then(({ data }) => { if (data) context.products = data })
    )
  }

  if (needsOwnership(prompt)) {
    fetches.push(
      supabase
        .from('bank_ownership')
        .select('bank_id, fiscal_year, shareholder_name_en, ownership_pct, shareholder_type, country')
        .in('bank_id', targetIds)
        .order('ownership_pct', { ascending: false })
        .then(({ data }) => { if (data) context.ownership = data })
    )
  }

  if (needsGovernance(prompt)) {
    fetches.push(
      supabase
        .from('bank_executives')
        .select('bank_id, full_name_en, title_en, fiscal_year')
        .in('bank_id', targetIds)
        .then(({ data }) => { if (data) context.executives = data })
    )
    fetches.push(
      supabase
        .from('bank_board_members')
        .select('bank_id, full_name_en, role, is_independent, fiscal_year')
        .in('bank_id', targetIds)
        .then(({ data }) => { if (data) context.board = data })
    )
  }

  if (needsAnnouncements(prompt)) {
    fetches.push(
      supabase
        .from('bank_announcements')
        .select('bank_id, announcement_date, category, headline_en, summary_en')
        .in('bank_id', targetIds)
        .order('announcement_date', { ascending: false })
        .limit(30)
        .then(({ data }) => { if (data) context.announcements = data })
    )
  }

  // Always include bank metadata
  context.banks = BANKS.filter(b => targetIds.includes(b.id)).map(b => ({
    id: b.id,
    name: b.name,
    shortName: b.shortName,
    ticker: b.ticker,
    sector: b.sector,
    description: b.description,
  }))

  await Promise.allSettled(fetches)
  return context
}

// ── Build Claude system prompt ────────────────────────────────────────────────
function buildSystemPrompt(context: Record<string, any>): string {
  return `You are an expert banking analyst for the Jordanian banking sector, embedded inside HBTF's (Housing Bank for Trade & Finance) competitive intelligence platform.

CRITICAL RULES:
1. You ONLY answer using the data provided below. Never invent numbers, rates, names, or facts.
2. If the data doesn't contain what the user is asking for, say exactly: "I don't have that data available."
3. Always be specific — cite actual numbers from the data.
4. Format responses clearly: use bullet points, tables in markdown, and bold key numbers.
5. When comparing banks, always mention where HBTF (bank_id: 2) stands relative to competitors.
6. Keep responses concise and executive-friendly — no fluff.
7. For chart requests, output a JSON block at the END of your response in this exact format:
   \`\`\`chart
   {"type":"bar|line","title":"...","data":[{"name":"...","value":...}],"series":["value"],"insight":"..."}
   \`\`\`
8. Numbers in the DB: financials are in JOD (Jordanian Dinars). Rates are percentages. Fees are in JOD.
9. When showing financials, convert large numbers: divide by 1,000,000 and show as "JOD XXM" or divide by 1,000,000,000 and show as "JOD X.XB".

AVAILABLE DATA:
${JSON.stringify(context, null, 2)}

Today's date: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}.
Data covers fiscal years 2022-2025 where available.`
}

// ── Stream response from Claude ───────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const { messages, bankId } = await req.json()

  if (!messages?.length) {
    return NextResponse.json({ error: 'No messages provided' }, { status: 400 })
  }

  const lastMessage = messages[messages.length - 1].content as string

  // Detect context
  const bankIds = detectBankIds(lastMessage)
  if (bankId && !bankIds.includes(bankId)) bankIds.push(bankId)

  // Fetch relevant DB data
  const context = await fetchContext(lastMessage, bankIds)

  // Build system prompt with data
  const systemPrompt = buildSystemPrompt(context)

  // Call Claude API
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
      messages: messages.map((m: any) => ({
        role: m.role,
        content: m.content,
      })),
      stream: true,
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    return NextResponse.json({ error: err }, { status: 500 })
  }

  // Stream the response back
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
          const data = line.replace('data: ', '')
          if (data === '[DONE]') break
          try {
            const parsed = JSON.parse(data)
            if (parsed.type === 'content_block_delta') {
              controller.enqueue(new TextEncoder().encode(parsed.delta.text || ''))
            }
          } catch {
            // skip
          }
        }
      }
      controller.close()
    }
  })

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
    },
  })
}
