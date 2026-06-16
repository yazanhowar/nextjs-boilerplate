// app/api/cron/sync-announcements/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { scrapeAllBanks } from '@/lib/scrapers/ase-scraper'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function isAuthorized(req: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) return false
  const authHeader = req.headers.get('authorization')
  return authHeader === `Bearer ${cronSecret}`
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const sinceDays = parseInt(req.nextUrl.searchParams.get('days') ?? '8')
  const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000)

  const started = Date.now()
  let announcementsUpserted = 0
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

    const CHUNK = 50
    for (let i = 0; i < announcements.length; i += CHUNK) {
      const chunk = announcements.slice(i, i + CHUNK).map(a => ({
        bank_id: a.bank_id,
        announcement_date: a.announced_at.split('T')[0],
        category: a.category,
        headline_en: a.title_en,
        summary_en: a.summary_en ?? null,
        source_url: a.source_url,
        source_type: 'news',
        fiscal_year: a.fiscal_year ?? null,
        is_verified: false,
      }))

      const { error } = await supabase
        .from('bank_announcements')
        .upsert(chunk, {
          onConflict: 'bank_id,announcement_date,headline_en',
          ignoreDuplicates: true,
        })

      if (error) {
        errors.push(`chunk ${i}: ${error.message}`)
      } else {
        announcementsUpserted += chunk.length
      }
    }

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    announcements_upserted: announcementsUpserted,
    errors: errors.length > 0 ? errors : undefined,
    elapsed_ms: Date.now() - started,
  })
}
