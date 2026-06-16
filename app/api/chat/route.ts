// app/api/chat/route.ts
// Claude-powered banking analyst â strictly answers from DB data, no hallucination

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { BANKS } from '@/lib/banks-config'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

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

function needsRates(p: string): boolean {
  return /rate|interest|mortgage|home loan|personal loan|car loan|saving|term deposit|td |murabaha|wakala/i.test(p)
}
function needsTariffs(p: string): boolean {
  return /fee|charge|credit card|transfer|maintenance|safe box|commission|tariff|cost|price|annual fee|settlement/i.test(p)
}
function needsProducts(p: string): boolean {
  return /product|service|offer|card|account|islamic|sharia|digital|mobile|app|have|provide/i.test(p)
}
function needsOwnership(p: string): boolean {
  return /own|shareholder|stake|investor|who controls|ownership|majority|parent/i.test(p)
}
function needsGovernance(p: string): boolean {
  return /ceo|chairman|board|director|executive|management|leadership|who runs|appoint/i.test(p)
}
function needsAnnouncements(p: string): boolean {
  return /news|announce|agm|assembly|latest|recent|dividend declared|rating|merger|acquisition/i.test(p)
}

async function fetchContext(prompt: string, bankIds: number[]) {
  const targetIds = bankIds.length > 0 ? bankIds : BANKS.map(b => b.id)
  const context: Record<string, any> = {}
  const jobs: Array<() => Promise<void>> = []

  // Always fetch financials â core data for every banking question
  jobs.push(async () => {
    const { data, error } = await supabase
      .from('bank_financials')
      .select('bank_id, fiscal_year, net_profit, total_assets, total_deposits, net_loans, total_equity, roe, roa, car, npl_ratio, net_interest_income, eps_fils')
      .in('bank_id', targetIds)
      .order('fiscal_year', { ascending: true })
    if (error) console.error('[HBTF] financials error:', error.message)
    if (data) context.financials = data
  })

  if (needsRates(prompt)) {
    jobs.push(async () => {
      const { data } = await supabase.from('bank_rates').select('*').in('bank_id', targetIds)
      if (data) context.rates = data
    })
  }
  if (needsTariffs(prompt)) {
    jobs.push(async () => {
      const { data } = await supabase.from('bank_tariffs').select('*').in('bank_id', targetIds)
      if (data) context.tariffs = data
    })
  }
  if (needsProducts(prompt)) {
    jobs.push(async () => {
      const { data } = await supabase.from('bank_products').select('bank_id, category, product_name_en, description_en, is_islamic, sharia_structure').in('bank_id', targetIds)
      if (data) context.products = data
    })
  }
  if (needsOwnership(prompt)) {
    jobs.push(async () => {
      const { data } = await supabase.from('bank_ownership').select('bank_id, fiscal_year, shareholder_name_en, ownership_pct, shareholder_type, country').in('bank_id', targetIds).order('ownership_pct', { ascending: false })
      if (data) context.ownership = data
    })
  }
  if (needsGovernance(prompt)) {
    jobs.push(async () => {
      const [exec, board] = await Promise.all([
        supabase.from('bank_executives').select('bank_id, full_name_en, title_en, fiscal_year').in('bank_id', targetIds),
        supabase.from('bank_board_members').select('bank_id, full_name_en, role, is_independent, fiscal_year').in('bank_id', targetIds),
      ])
      if (exec.data) context.executives = exec.data
      if (board.data) context.board = board.data
    })
  }
  if (needsAnnouncements(prompt)) {
    jobs.push(async () => {
      const { data } = await supabase.from('bank_announcements').select('bank_id, announcement_date, category, headline_en, summary_en').in('bank_id', targetIds).order('announcement_date', { ascending: false }).limit(30)
      if (data) context.announcements = data
    })
  }

  context.banks = BANKS.filter(b => targetIds.includes(b.id)).map(b => ({
    id: b.id, name: b.name, shortName: b.shortName, ticker: b.ticker, sector: b.sector, description: b.description,
  }))

  await Promise.allSettled(jobs.map(j => j()))
  console.log('[HBTF] context keys:', Object.keys(context), '| financials:', context.financials?.length ?? 0)
  return context
}

function buildSystemPrompt(context: Record<string, any>): string {
  return `You are an expert banking analyst for the Jordanian banking sector, embedded inside HBTF's (Housing Bank for Trade & Finance) competitive intelligence platform.

CRITICAL RULES:
1. You ONLY answer using the data provided below. Never invent numbers, rates, names, or facts.
2. If the data does not contain what the user is asking for, say exactly: "I don't have that data available."
3. Always be specific â cite actual numbers from the data.
4. Format responses clearly using bullet points, bold for key numbers, and markdown tables where useful.
5. When comparing banks, always mention where HBTF (bank_id: 2) stands relative to competitors.
6. Keep responses concise and executive-friendly â no fluff.
7. For chart requests, output a JSON block at the END of your response in this exact format:
\`\`\`chart
{"type":"bar","title":"Chart Title","data":[{"name":"HBTF","value":150},{"name":"Arab Bank","value":200}],"series":["value"],"insight":"Key takeaway here"}
\`\`\`
8. CRITICAL â Financials stored in THOUSANDS. Display: value/1000 = "JOD XXXM", value/1000000 = "JOD X.XB". Arab Bank (bank_id:1) is USD thousands â multiply by 0.71 for JOD.
9. Rates are already percentages. Fees are in JOD.
10. Today: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}.

AVAILABLE DATA:
${JSON.stringify(context, null, 2)}`
}

export async function POST(req: NextRequest) {
  const { messages, bankId } = await req.json()
  if (!messages?.length) return NextResponse.json({ error: 'No messages provided' }, { status: 400 })

  const lastUserMsg = [...messages].reverse().find((m: any) => m.role === 'user')
  const lastMessage = (typeof lastUserMsg?.content === 'string' ? lastUserMsg.content : JSON.stringify(lastUserMsg?.content)) || ''

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
      messages: messages.map((m: any) => ({ role: m.role, content: m.content })),
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