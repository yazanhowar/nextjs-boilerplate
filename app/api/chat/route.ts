// app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { BANKS } from '@/lib/banks-config'

// Create fresh client each request to ensure env vars are loaded at runtime
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
    if (lower.includes(bank.name.toLowerCase()) || lower.includes(bank.shortName.toLowerCase()) || lower.includes(bank.ticker.toLowerCase()))
      found.push(bank.id)
  }
  return found
}

function needsRates(p: string) { return /rate|interest|mortgage|home loan|personal loan|car loan|saving|term deposit|td |murabaha|wakala/i.test(p) }
function needsTariffs(p: string) { return /fee|charge|credit card|transfer|maintenance|safe box|commission|tariff|cost|price|annual fee/i.test(p) }
function needsProducts(p: string) { return /product|service|offer|card|account|islamic|sharia|digital|mobile|app|have|provide/i.test(p) }
function needsOwnership(p: string) { return /own|shareholder|stake|investor|who controls|ownership|majority|parent/i.test(p) }
function needsGovernance(p: string) { return /ceo|chairman|board|director|executive|management|leadership|who runs|appoint/i.test(p) }
function needsAnnouncements(p: string) { return /news|announce|agm|assembly|latest|recent|dividend declared|rating|merger|acquisition/i.test(p) }

async function fetchContext(prompt: string, bankIds: number[]) {
  const db = getDB()
  const targetIds = bankIds.length > 0 ? bankIds : BANKS.map(b => b.id)
  const context: Record<string, any> = {}
  const jobs: Array<() => Promise<void>> = []

  // Always fetch financials
  jobs.push(async () => {
    const { data, error } = await db
      .from('bank_financials')
      .select('bank_id, fiscal_year, net_profit, total_assets, customer_deposits, net_loans, total_equity, roe, roa, car, npl_ratio')
      .in('bank_id', targetIds)
      .order('fiscal_year', { ascending: false })
    if (error) console.error('[HBTF] financials error:', error.message)
    if (data && data.length > 0) context.financials = data
    else console.warn('[HBTF] financials empty! targetIds:', targetIds, 'error:', error)
  })

  if (needsRates(prompt)) {
    jobs.push(async () => {
      const { data } = await db.from('bank_rates').select('*').in('bank_id', targetIds)
      if (data) context.rates = data
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

  context.banks = BANKS.filter(b => targetIds.includes(b.id)).map(b => ({
    id: b.id, name: b.name, shortName: b.shortName, ticker: b.ticker, sector: b.sector, description: b.description,
  }))

  await Promise.allSettled(jobs.map(j => j()))
  console.log('[HBTF] context:', Object.keys(context), '| financials rows:', context.financials?.length ?? 0, '| url:', process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0,30))
  return context
}

function buildSystemPrompt(context: Record<string, any>): string {
  return `You are an expert banking analyst for the Jordanian banking sector, inside HBTF's competitive intelligence platform.

CRITICAL RULES:
1. Answer ONLY from the data below. Never invent numbers, rates, names, or facts.
2. If data is missing, say: "I don't have that data available."
3. Always cite actual numbers from the data.
4. Use bullet points, bold for key numbers, markdown tables where useful.
5. Always mention where HBTF (bank_id: 2) stands vs competitors.
6. Executive-friendly â no fluff.
7. For charts, output at END of response:
\`\`\`chart
{"type":"bar","title":"Title","data":[{"name":"HBTF","value":150}],"series":["value"],"insight":"Takeaway"}
\`\`\`
8. CRITICAL SCALING â Financials are in THOUSANDS: value/1000="JOD XXXM", value/1000000="JOD X.XB". Arab Bank (bank_id:1) is USD thousands â Ã0.71 for JOD.
9. Rates are percentages. Fees are in JOD.
10. Today: ${new Date().toLocaleDateString('en-GB', {day:'numeric',month:'long',year:'numeric'})}.

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
      messages: messages.filter((m: any) => m.content).map((m: any) => ({ role: m.role, content: m.content })),
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