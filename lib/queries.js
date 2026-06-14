import { supabase } from './supabase'

export async function getBanks() {
  const { data, error } = await supabase
    .from('banks')
    .select('*')
    .eq('is_active', true)
    .order('name_en')
  if (error) throw error
  return data
}

export async function getSectorRankings() {
  const { data, error } = await supabase
    .from('v_sector_rankings')
    .select('*')
    .order('rank_assets')
  if (error) throw error
  return data
}

export async function getLatestRates() {
  const { data, error } = await supabase
    .from('v_latest_rates')
    .select('*')
    .order('name_en')
  if (error) throw error
  return data
}

export async function getHomeLoanComparison() {
  const { data, error } = await supabase
    .from('v_home_loan_comparison')
    .select('*')
    .order('home_loan_min')
  if (error) throw error
  return data
}

export async function getAnnouncements(limit = 20) {
  const { data, error } = await supabase
    .from('v_announcements_feed')
    .select('*')
    .order('announcement_date', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data
}

export async function getBankTariffs() {
  const { data, error } = await supabase
    .from('bank_tariffs')
    .select(`
      *,
      banks (name_en, short_name, bank_type)
    `)
    .order('effective_date', { ascending: false })
  if (error) throw error
  return data
}

export async function getLatestFinancials() {
  const { data, error } = await supabase
    .from('v_latest_financials')
    .select('*')
    .order('total_assets', { ascending: false, nullsFirst: false })
  if (error) throw error
  return data
}

export async function getYoYGrowth() {
  const { data, error } = await supabase
    .from('v_yoy_growth')
    .select('*')
    .order('fiscal_year', { ascending: false })
  if (error) throw error
  return data
}
