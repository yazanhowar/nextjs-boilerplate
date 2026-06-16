// lib/scrapers/ase-scraper.ts
//
// STRATEGY: Zawya RSS feed (zawya.com/sitemaps/en/rss)
// - Real XML, no JS rendering, works from Vercel serverless
// - Covers press releases from all Jordanian banks
// - We filter items by matching bank name keywords in the title/description
// - Falls back to each bank's own news/IR page (static HTML where available)

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

// ─── Bank registry ─────────────────────────────────────────────────────────────
// keywords: strings that uniquely identify this bank in a news title
// Must be distinct enough to avoid false matches across banks
const BANKS: Array<{
  bank_id: number
  keywords: string[]          // matched case-insensitively against title + description
  name: string                // human label for logging
}> = [
  { bank_id: 1,  name: 'Arab Bank',              keywords: ['arab bank'] },
  { bank_id: 2,  name: 'Housing Bank',            keywords: ['housing bank', 'hbtf'] },
  { bank_id: 3,  name: 'Jordan Kuwait Bank',      keywords: ['jordan kuwait bank', 'jkb'] },
  { bank_id: 4,  name: 'Capital Bank',            keywords: ['capital bank of jordan', 'capital bank jordan'] },
  { bank_id: 5,  name: 'Bank al Etihad',          keywords: ['bank al etihad', 'etihad bank'] },
  { bank_id: 6,  name: 'Cairo Amman Bank',        keywords: ['cairo amman bank'] },
  { bank_id: 7,  name: 'Jordan Ahli Bank',        keywords: ['jordan ahli bank', 'ahli bank jordan'] },
  { bank_id: 8,  name: 'AJIB',                    keywords: ['arab jordan investment bank', 'ajib'] },
  { bank_id: 9,  name: 'Jordan Islamic Bank',     keywords: ['jordan islamic bank', 'jib jordan'] },
  { bank_id: 10, name: 'Safwa Islamic Bank',      keywords: ['safwa islamic bank', 'safwa bank'] },
  { bank_id: 11, name: 'IIAB',                    keywords: ['islamic international arab bank', 'iiabank'] },
  { bank_id: 12, name: 'Bank of Jordan',          keywords: ['bank of jordan'] },
  { bank_id: 13, name: 'Invest Bank',             keywords: ['invest bank jordan', 'investbank jordan'] },
  { bank_id: 14, name: 'Bank ABC Jordan',         keywords: ['bank abc jordan', 'arab banking corporation jordan'] },
  { bank_id: 15, name: 'Jordan Commercial Bank',  keywords: ['jordan commercial bank'] },
]

// ─── Category inference ────────────────────────────────────────────────────────
function inferCategory(title: string, description: string): AnnouncementCategory {
  const t = (title + ' ' + description).toLowerCase()
  if (t.includes('general assembly') || t.includes('agm') || t.includes('ordinary general')) return 'agm'
  if (t.includes('dividend') || t.includes('distribution') || t.includes('cash dividend')) return 'dividend'
  if (t.includes('rating') || t.includes("moody's") || t.includes('fitch') || t.includes('s&p')) return 'rating'
  if (t.includes('merger') || t.includes('acquisition') || t.includes('takeover')) return 'merger_acquisition'
  if (t.includes('central bank') && (t.includes('regulation') || t.includes('circular'))) return 'regulation'
  if (t.includes('appoint') || t.includes('ceo') || t.includes('chairman') || t.includes('board member')) return 'leadership_change'
  if (
    t.includes('financial result') || t.includes('financial statement') ||
    t.includes('net profit') || t.includes('net income') ||
    t.includes('quarterly') || t.includes('annual result') ||
    t.includes('q1 ') || t.includes('q2 ') || t.includes('q3 ') || t.includes('q4 ') ||
    t.includes('first quarter') || t.includes('second quarter') ||
    t.includes('third quarter') || t.includes('fourth quarter')
  ) return 'financial_results'
  if (t.includes('strateg') || t.includes('expansion') || t.includes('partnership') || t.includes('launch')) return 'strategic'
  return 'other'
}

// ─── Quarter + year extraction ─────────────────────────────────────────────────
function extractQuarterYear(title: string): { fiscal_year?: number; fiscal_quarter?: number } {
  const yearMatch = title.match(/\b(202\d|203\d)\b/)
  const qMatch =
    title.match(/\bq([1-4])\b/i)?.[1] ??
    (title.match(/first quarter/i) ? '1' :
     title.match(/second quarter/i) ? '2' :
     title.match(/third quarter/i) ? '3' :
     title.match(/fourth quarter/i) ? '4' : undefined)

  return {
    fiscal_year: yearMatch ? parseInt(yearMatch[1]) : undefined,
    fiscal_quarter: qMatch ? parseInt(qMatch) : undefined,
  }
}

// ─── RSS item type ─────────────────────────────────────────────────────────────
interface RssItem {
  title: string
  link: string
  description: string
  pubDate: string
}

// ─── Parse Zawya RSS XML ───────────────────────────────────────────────────────
function parseRss(xml: string): RssItem[] {
  const items: RssItem[] = []
  // Simple regex-based parse — no external XML library needed in Edge/serverless
  const itemBlocks = xml.match(/<item>[\s\S]*?<\/item>/g) ?? []

  for (const block of itemBlocks) {
    const title = block.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>|<title>([\s\S]*?)<\/title>/)?.[1] ??
                  block.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? ''
    const link  = block.match(/<link>([\s\S]*?)<\/link>/)?.[1] ?? ''
    const desc  = block.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>|<description>([\s\S]*?)<\/description>/)?.[1] ??
                  block.match(/<description>([\s\S]*?)<\/description>/)?.[1] ?? ''
    const date  = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] ?? ''

    if (title && link && date) {
      items.push({
        title: title.replace(/<[^>]+>/g, '').trim(),
        link: link.trim(),
        description: desc.replace(/<[^>]+>/g, '').trim(),
        pubDate: date.trim(),
      })
    }
  }
  return items
}

// ─── Match an RSS item to a bank ──────────────────────────────────────────────
function matchBank(title: string, description: string): number | null {
  const haystack = (title + ' ' + description).toLowerCase()
  for (const bank of BANKS) {
    if (bank.keywords.some(kw => haystack.includes(kw))) {
      return bank.bank_id
    }
  }
  return null
}

// ─── Main export ───────────────────────────────────────────────────────────────
export async function scrapeAllBanks(since?: Date): Promise<ScrapedAnnouncement[]> {
  const cutoff = since ?? new Date(Date.now() - 8 * 24 * 60 * 60 * 1000)
  const results: ScrapedAnnouncement[] = []

  // Fetch Zawya RSS — single request covers all 15 banks
  let xml = ''
  try {
    const res = await fetch('https://www.zawya.com/sitemaps/en/rss', {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; HBTF-Intel/1.0)' },
      signal: AbortSignal.timeout(20000),
    })
    if (res.ok) xml = await res.text()
  } catch {
    // Zawya unavailable — return empty, cron will retry tomorrow
    return []
  }

  const items = parseRss(xml)

  for (const item of items) {
    const pubDate = new Date(item.pubDate)
    if (isNaN(pubDate.getTime()) || pubDate < cutoff) continue

    const bank_id = matchBank(item.title, item.description)
    if (!bank_id) continue

    const category = inferCategory(item.title, item.description)
    const { fiscal_year, fiscal_quarter } = extractQuarterYear(item.title)

    results.push({
      bank_id,
      announced_at: pubDate.toISOString(),
      category,
      title_en: item.title,
      summary_en: item.description || undefined,
      source_url: item.link,
      fiscal_year,
      fiscal_quarter,
    })
  }

  return results
}
