// lib/scrapers/ase-scraper.ts
// Fetches bank disclosures from ASE (Amman Stock Exchange) disclosure feed
// and each bank's own IR page as fallback.
// Returns structured announcements ready to upsert into bank_announcements.

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
  announced_at: string        // ISO date string
  category: AnnouncementCategory
  title_en: string
  summary_en?: string
  source_url: string
  pdf_url?: string            // if a financial statement PDF is attached
  fiscal_year?: number
  fiscal_quarter?: number
}

// ─── Bank registry ────────────────────────────────────────────────────────────
// ASE ticker → bank_id + IR page URL pattern
const BANKS: Record<string, { bank_id: number; ir_url: string; pdf_pattern?: string }> = {
  ARBK: { bank_id: 1,  ir_url: 'https://www.arabbank.jo/en/investor-relations/financial-statements' },
  THBK: { bank_id: 2,  ir_url: 'https://www.hbtf.com/en/financial-reports' },
  JOKB: { bank_id: 3,  ir_url: 'https://www.jkb.com/en/investor-relations/financial-statements' },
  CAPL: { bank_id: 4,  ir_url: 'https://www.capitalbank.jo/en/personal/about-us/investor-relations' },
  ETHD: { bank_id: 5,  ir_url: 'https://www.bankaletihad.com/en/investor-relations' },
  CABK: { bank_id: 6,  ir_url: 'https://www.cab.jo/en/investor-relations' },
  AHLI: { bank_id: 7,  ir_url: 'https://www.ahli.com/en/investor-relations' },
  AJIB: { bank_id: 8,  ir_url: 'https://www.ajib.com/investor-relations' },
  JOIB: { bank_id: 9,  ir_url: 'https://www.jordanislamicbank.com/en/investor-relations' },
  SAFWA:{ bank_id: 10, ir_url: 'https://www.safwabank.com/en/investor-relations' },
  IIAB: { bank_id: 11, ir_url: 'https://www.iiabank.com.jo/en/investor-relations' },
  BOJX: { bank_id: 12, ir_url: 'https://www.bankofjordan.com/en/investor-relations' },
  INVB: { bank_id: 13, ir_url: 'https://www.investbank.jo/en/investor-relations' },
  ABCO: { bank_id: 14, ir_url: 'https://www.bank-abc.com/en/Jordan/investor-relations' },
  JCBK: { bank_id: 15, ir_url: 'https://www.jcbank.com.jo/en/investor-relations' },
}

// ─── Category inference ───────────────────────────────────────────────────────
// Maps keywords found in disclosure titles → our allowed category values
function inferCategory(title: string): AnnouncementCategory {
  const t = title.toLowerCase()
  if (t.includes('general assembly') || t.includes('agm') || t.includes('ordinary general')) return 'agm'
  if (t.includes('dividend') || t.includes('distribution') || t.includes('cash dividend')) return 'dividend'
  if (t.includes('rating') || t.includes('moody') || t.includes('fitch') || t.includes('s&p')) return 'rating'
  if (t.includes('merger') || t.includes('acquisition') || t.includes('takeover')) return 'merger_acquisition'
  if (t.includes('central bank') || t.includes('regulation') || t.includes('circular')) return 'regulation'
  if (t.includes('product') || t.includes('launch') || t.includes('service')) return 'product_launch'
  if (t.includes('ceo') || t.includes('chairman') || t.includes('board member') || t.includes('appoint')) return 'leadership_change'
  if (
    t.includes('financial result') || t.includes('financial statement') ||
    t.includes('quarterly') || t.includes('annual result') ||
    t.includes('profit') || t.includes('net income') ||
    t.includes('q1') || t.includes('q2') || t.includes('q3') || t.includes('q4') ||
    t.includes('first quarter') || t.includes('second quarter') ||
    t.includes('third quarter') || t.includes('fourth quarter')
  ) return 'financial_results'
  if (t.includes('strateg') || t.includes('expansion') || t.includes('partnership')) return 'strategic'
  return 'other'
}

// ─── Quarter + year extraction ────────────────────────────────────────────────
function extractQuarterYear(title: string): { fiscal_year?: number; fiscal_quarter?: number } {
  const year = title.match(/20(2\d|3\d)/)?.[0]
  const quarter =
    title.match(/\bq([1-4])\b/i)?.[1] ||
    title.match(/first quarter/i) ? '1' :
    title.match(/second quarter/i) ? '2' :
    title.match(/third quarter/i) ? '3' :
    title.match(/fourth quarter/i) ? '4' : undefined

  return {
    fiscal_year: year ? parseInt(year) : undefined,
    fiscal_quarter: quarter ? parseInt(quarter as string) : undefined,
  }
}

// ─── ASE disclosure feed ──────────────────────────────────────────────────────
// ASE publishes a public disclosures page. We fetch it and parse for each bank.
// URL: https://www.ase.com.jo/en/disclosures?symbol=ARBK  (one per ticker)
async function fetchASEDisclosures(ticker: string): Promise<{ title: string; date: string; url: string; pdfUrl?: string }[]> {
  const url = `https://www.ase.com.jo/en/disclosures?symbol=${ticker}`
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; HBTF-Intel-Bot/1.0)' },
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) return []
    const html = await res.text()

    // Parse disclosure rows from ASE HTML table
    // ASE renders: <tr><td>DATE</td><td><a href="/disclosure/123">TITLE</a></td><td>PDF link</td></tr>
    const rows: { title: string; date: string; url: string; pdfUrl?: string }[] = []
    const rowRegex = /<tr[^>]*>[\s\S]*?<\/tr>/gi
    const matches = html.match(rowRegex) || []

    for (const row of matches) {
      const dateMatch = row.match(/(\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4})/)
      const titleMatch = row.match(/href="([^"]*disclosure[^"]*)"[^>]*>([^<]+)<\/a>/)
      const pdfMatch = row.match(/href="([^"]*\.pdf[^"]*)"/)

      if (dateMatch && titleMatch) {
        const rawDate = dateMatch[1]
        // Normalise DD/MM/YYYY → YYYY-MM-DD
        const isoDate = rawDate.includes('/')
          ? rawDate.split('/').reverse().join('-')
          : rawDate

        rows.push({
          title: titleMatch[2].trim(),
          date: isoDate,
          url: titleMatch[1].startsWith('http') ? titleMatch[1] : `https://www.ase.com.jo${titleMatch[1]}`,
          pdfUrl: pdfMatch ? (pdfMatch[1].startsWith('http') ? pdfMatch[1] : `https://www.ase.com.jo${pdfMatch[1]}`) : undefined,
        })
      }
    }

    return rows
  } catch {
    return []
  }
}

// ─── Main export ──────────────────────────────────────────────────────────────
// Fetches announcements for all 15 banks (or a subset) from ASE
// Returns them ready to upsert into bank_announcements

export async function scrapeAllBanks(since?: Date): Promise<ScrapedAnnouncement[]> {
  const cutoff = since ?? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // default: last 7 days
  const results: ScrapedAnnouncement[] = []

  await Promise.allSettled(
    Object.entries(BANKS).map(async ([ticker, { bank_id }]) => {
      const disclosures = await fetchASEDisclosures(ticker)

      for (const d of disclosures) {
        const announcedAt = new Date(d.date)
        if (announcedAt < cutoff) continue

        const category = inferCategory(d.title)
        const { fiscal_year, fiscal_quarter } = extractQuarterYear(d.title)

        results.push({
          bank_id,
          announced_at: announcedAt.toISOString(),
          category,
          title_en: d.title,
          source_url: d.url,
          pdf_url: d.pdfUrl,
          fiscal_year,
          fiscal_quarter,
        })
      }
    })
  )

  return results
}

// Fetch for a single bank (useful for backfilling the 3 missing banks)
export async function scrapeBankById(bank_id: number, since?: Date): Promise<ScrapedAnnouncement[]> {
  const entry = Object.entries(BANKS).find(([, v]) => v.bank_id === bank_id)
  if (!entry) return []
  const [ticker] = entry
  const all = await scrapeAllBanks(since)
  return all.filter(a => a.bank_id === bank_id)
}

export { BANKS }
