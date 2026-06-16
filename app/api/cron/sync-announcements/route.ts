// app/api/cron/sync-announcements/route.ts
// Vercel Cron job — runs daily at 06:00 UTC (vercel.json)
// Scrapes ASE disclosures for all 15 banks and upserts into:
//   - bank_announcements
//   - annual_reports  (when the disclosure has a financial statement PDF attached)

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { scrapeAllBanks, ScrapedAnnouncement } from '@/lib/scrapers/ase-scraper'

// Supabase admin client (bypasses RLS — only used server-side in a protected route)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!  // service role, never exposed to client
)

// ─── Auth guard ───────────────────────────────────────────────────────────────
// Vercel passes CRON_SECRET as a Bearer token in the Authorization header
// when invoking cron routes. This prevents public triggering.
function isAuthorized(req: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) return false
  const authHeader = req.headers.get('authorization')
  return authHeader === `Bearer ${cronSecret}`
}

// ─── Financial statement PDF detector ────────────────────────────────────────
// Returns true if the announcement looks like a quarterly/annual financial filing
function isFinancialStatement(announcement: ScrapedAnnouncement): boolean {
  return (
    announcement.category === 'financial_results' &&
    !!announcement.pdf_url &&
    !!(announcement.fiscal_year || announcement.fiscal_quarter)
  )
}

// Build a report_type label for annual_reports table
function reportType(a: ScrapedAnnouncement): string {
  if (!a.fiscal_quarter) return 'annual'
  return `Q${a.fiscal_quarter}`
}

// ─── Handler ──────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // How far back to look — default 8 days so we never miss a day if cron is late
  const sinceDays = parseInt(req.nextUrl.searchParams.get('days') ?? '8')
  const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000)

  const started = Date.now()
  let announcementsUpserted = 0
  let reportsUpserted = 0
  const errors: string[] = []

  try {
    const announcements = await scrapeAllBanks(since)

    if (announcements.length === 0) {
      return NextResponse.json({
        ok: true,
        message: 'No new announcements found',
        elapsed_ms: Date.now() - started,
      })
    }

    // ── Upsert bank_announcements ──────────────────────────────────────────
    // Unique key: (bank_id, announced_at, title_en)
    // We do batch upserts in chunks of 50 to stay within Supabase limits
    const CHUNK = 50
    for (let i = 0; i < announcements.length; i += CHUNK) {
      const chunk = announcements.slice(i, i + CHUNK).map(a => ({
        bank_id: a.bank_id,
        announced_at: a.announced_at,
        category: a.category,
        title_en: a.title_en,
        summary_en: a.summary_en ?? null,
        source_url: a.source_url,
        is_verified: false,  // scraped, not manually verified
      }))

      const { error } = await supabase
        .from('bank_announcements')
        .upsert(chunk, {
          onConflict: 'bank_id,announced_at,title_en',
          ignoreDuplicates: true,
        })

      if (error) {
        errors.push(`announcements chunk ${i}: ${error.message}`)
      } else {
        announcementsUpserted += chunk.length
      }
    }

    // ── Upsert annual_reports for financial statement PDFs ─────────────────
    const financialFilings = announcements.filter(isFinancialStatement)

    for (const filing of financialFilings) {
      const { error } = await supabase
        .from('annual_reports')
        .upsert({
          bank_id: filing.bank_id,
          fiscal_year: filing.fiscal_year,
          report_type: reportType(filing),
          report_url: filing.pdf_url,
          published_at: filing.announced_at,
          title: filing.title_en,
          is_verified: false,
        }, {
          onConflict: 'bank_id,fiscal_year,report_type',
          ignoreDuplicates: true,
        })

      if (error) {
        errors.push(`annual_reports bank_id=${filing.bank_id} FY${filing.fiscal_year} ${reportType(filing)}: ${error.message}`)
      } else {
        reportsUpserted++
      }
    }

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    announcements_upserted: announcementsUpserted,
    reports_upserted: reportsUpserted,
    errors: errors.length > 0 ? errors : undefined,
    elapsed_ms: Date.now() - started,
  })
}
