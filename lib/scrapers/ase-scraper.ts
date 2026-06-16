// lib/scrapers/ase-scraper.ts
//
// SOURCE: Google News RSS search per bank
// URL: https://news.google.com/rss/search?q=QUERY&hl=en&gl=JO&ceid=JO:en
//
// This is confirmed free public XML — no JS rendering, no login, works from Vercel.
// Google News aggregates Zawya, PRNewswire, Reuters, Jordan Times, and each
// bank's own press releases, so all 15 banks are covered.
//
// NOTE: Since late 2024 Google News wraps article links in encoded redirects
// (https://news.google.com/rss/articles/CBMi...). These are still valid
// clickable URLs — we store them as source_url as-is.

export type AnnouncementCategory =
  | 'agm'
  | 'financial_results'
  | 'dividend'
  | 'rating'
  | 'merger_acquisition'
  | 'regulation'
  | 'product_launch'
  | 'leadership_change'
  | 'strategic'
  | 'other'

export interface ScrapedAnnouncement {
  bank_id: number
  announced_at: string
  category: AnnouncementCategory
  title_en: string
  summary_en?: string
  source_url: string
  fiscal_year?: number
  fiscal_quarter?: number
}

const BANKS = [
  { bank_id: 1,  query: '"Arab Bank" Jordan profit OR results OR dividend OR assembly' },
  { bank_id: 2,  query: '"Housing Bank" Jordan HBTF profit OR results OR dividend' },
  { bank_id: 3,  query: '"Jordan Kuwait Bank" profit OR results OR dividend OR assembly' },
  { bank_id: 4,  query: '"Capital Bank" Jordan profit OR results OR dividend' },
  { bank_id: 5,  query: '"Bank al Etihad" Jordan profit OR results OR dividend' },
  { bank_id: 6,  query: '"Cairo Amman Bank" profit OR results OR dividend OR assembly' },
  { bank_id: 7,  query: '"Jordan Ahli Bank" profit OR results OR dividend' },
  { bank_id: 8,  query: '"Arab Jordan Investment Bank" OR "AJIB" profit OR results OR dividend' },
  { bank_id: 9,  query: '"Jordan Islamic Bank" profit OR results OR dividend' },
  { bank_id: 10, query: '"Safwa Islamic Bank" profit OR results OR dividend' },
  { bank_id: 11, query: '"Islamic International Arab Bank" OR "IIAB" results OR assembly' },
  { bank_id: 12, query: '"Bank of Jordan" profit OR results OR dividend OR assembly' },
  { bank_id: 13, query: '"Invest Bank" Jordan profit OR results OR dividend' },
  { bank_id: 14, query: '"Bank ABC" Jordan profit OR results OR financial' },
  { bank_id: 15, query: '"Jordan Commercial Bank" profit OR results OR dividend' },
] as const

function inferCategory(text: string): AnnouncementCategory {
  const t = text.toLowerCase()
  if (t.includes('general assembly') || t.includes('agm') || t.includes('shareholders meeting')) return 'agm'
  if (t.includes('dividend') || t.includes('cash distribution') || t.includes('bonus share')) return 'dividend'
  if (t.includes('rating') || t.includes("moody's") || t.includes('fitch') || t.includes('s&p')) return 'rating'
  if (t.includes('merger') || t.includes('acquisition')) return 'merger_acquisition'
  if (t.includes('appoint') || t.includes(' ceo ') || t.includes('chairman') || t.includes('general manager')) return 'leadership_change'
  if (
    t.includes('net profit') || t.includes('net income') || t.includes('financial result') ||
    t.includes('financial statement') || t.includes('quarterly') ||
    t.includes('first quarter') || t.includes('second quarter') ||
    t.includes('third quarter') || t.includes('fourth quarter') ||
    /\bq[1-4]\b/.test(t) || /\bh[12]\b/.test(t) || t.includes('annual result')
  ) return 'financial_results'
  if (t.includes('launch') || t.includes('product') || t.includes('digital') || t.includes('app')) return 'product_launch'
  if (t.includes('partner') || t.includes('strateg') || t.includes('expansion') || t.includes('agreement')) return 'strategic'
  return 'other'
}

function extractQuarterYear(title: string) {
  const year = title.match(/\b(202\d|203\d)\b/)?.[1]
  const q =
    title.match(/\bq([1-4])\b/i)?.[1] ??
    (title.match(/first quarter/i)  ? '1' :
     title.match(/second quarter/i) ? '2' :
     title.match(/third quarter/i)  ? '3' :
     title.match(/fourth quarter/i) ? '4' : undefined)
  return {
    fiscal_year:    year ? parseInt(year) : undefined,
    fiscal_quarter: q    ? parseInt(q)    : undefined,
  }
}

function parseRss(xml: string) {
  const items: { title: string; link: string; pubDate: string; description: string }[] = []
  const blocks = xml.match(/<item>[\s\S]*?<\/item>/g) ?? []

  for (const block of blocks) {
    const title = (
      block.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/)?.[1] ??
      block.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? ''
    ).trim()

    const link = (
      block.match(/<link>([\s\S]*?)<\/link>/)?.[1] ??
      block.match(/<guid[^>]*>(https?:\/\/[^<]+)<\/guid>/)?.[1] ?? ''
    ).trim()

    const pubDate = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1]?.trim() ?? ''

    const description = (
      block.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/)?.[1] ??
      block.match(/<description>([\s\S]*?)<\/description>/)?.[1] ?? ''
    ).replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim()

    if (title && link && pubDate) items.push({ title, link, pubDate, description })
  }
  return items
}

async function fetchForBank(bank: typeof BANKS[number], cutoff: Date): Promise<ScrapedAnnouncement[]> {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(bank.query)}&hl=en&gl=JO&ceid=JO:en`

  let xml = ''
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; HBTF-Intel/1.0)' },
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) return []
    xml = await res.text()
  } catch {
    return []
  }

  const results: ScrapedAnnouncement[] = []

  for (const item of parseRss(xml)) {
    const pubDate = new Date(item.pubDate)
    if (isNaN(pubDate.getTime()) || pubDate < cutoff) continue

    const combined = item.title + ' ' + item.description
    const { fiscal_year, fiscal_quarter } = extractQuarterYear(item.title)

    results.push({
      bank_id: bank.bank_id,
      announced_at: pubDate.toISOString(),
      category: inferCategory(combined),
      title_en: item.title,
      summary_en: item.description || undefined,
      source_url: item.link,
      fiscal_year,
      fiscal_quarter,
    })
  }

  return results
}

export async function scrapeAllBanks(since?: Date): Promise<ScrapedAnnouncement[]> {
  const cutoff = since ?? new Date(Date.now() - 8 * 24 * 60 * 60 * 1000)
  const chunks = await Promise.allSettled(BANKS.map(b => fetchForBank(b, cutoff)))
  return chunks.flatMap(r => r.status === 'fulfilled' ? r.value : [])
}
