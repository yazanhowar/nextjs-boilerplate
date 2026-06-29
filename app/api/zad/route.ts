import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '');
const PEG = 0.710;
const MON = { total_assets: 1, net_loans: 1, customer_deposits: 1, shareholders_equity: 1, total_equity: 1, net_interest_income: 1, net_fee_income: 1, total_income: 1, operating_expenses: 1, provision_expense: 1, net_profit: 1 };

function jod(v, cur) { return (cur === 'USD' && typeof v === 'number') ? Math.round(v * PEG) : v; }

async function buildKnowledge() {
  var banksRes = await supabase.from('banks').select('*').order('id');
  var banks = banksRes.data || [];
  var finRes = await supabase.from('bank_financials').select('*');
  var fins = finRes.data || [];
  var byBank = {};
  fins.forEach(function (f) { (byBank[f.bank_id] = byBank[f.bank_id] || []).push(f); });
  var KEYS = ['fiscal_year', 'total_assets', 'net_loans', 'customer_deposits', 'total_equity', 'net_profit', 'roe', 'roa', 'car', 'npl_ratio', 'npl_coverage', 'loan_to_deposit', 'cost_to_income', 'net_interest_margin', 'eps_fils', 'branch_count', 'employee_count'];
  var out = banks.map(function (b) {
    var rows = (byBank[b.id] || []).sort(function (a, c) { return c.fiscal_year - a.fiscal_year; });
    var cur = rows[0] ? rows[0].currency : 'JOD';
    var financials = rows.map(function (r) { var o = {}; KEYS.forEach(function (k) { o[k] = MON[k] ? jod(r[k], r.currency) : r[k]; }); return o; });
    return { name_en: b.name_en, name_ar: b.name_ar, type: b.bank_type, ticker: b.ticker, headquarters: b.headquarters, reported_currency: cur, financials: financials };
  });

  var years = {};
  fins.forEach(function (f) { if (typeof f.fiscal_year === 'number') years[f.fiscal_year] = 1; });
  var latest = Object.keys(years).map(Number).sort(function (a, b) { return b - a; })[0];
  var yr = fins.filter(function (f) { return f.fiscal_year === latest; });
  function sum(field) { return yr.reduce(function (s, f) { return s + (jod(f[field], f.currency) || 0); }, 0); }
  function avg(field) { var a = yr.map(function (f) { return f[field]; }).filter(function (x) { return typeof x === 'number'; }); return a.length ? Math.round((a.reduce(function (s, x) { return s + x; }, 0) / a.length) * 10) / 10 : null; }
  var sector = { fiscal_year: latest, bank_count: yr.length, total_assets: sum('total_assets'), net_profit: sum('net_profit'), customer_deposits: sum('customer_deposits'), total_equity: sum('total_equity'), avg_roe: avg('roe'), avg_car: avg('car'), units: 'JOD thousands' };
  var cbj = [{ bank: 'Housing Bank', frequency: 'Monthly', latest_period: 'May 2026', status: 'Current' }, { bank: 'Arab Bank', frequency: 'Monthly', latest_period: 'May 2026', status: 'Current' }, { bank: 'Bank of Jordan', frequency: 'Monthly', latest_period: 'Apr 2026', status: 'Due' }, { bank: 'Jordan Kuwait Bank', frequency: 'Quarterly', latest_period: 'Q1 2026', status: 'Current' }, { bank: 'Invest Bank', frequency: 'Quarterly', latest_period: 'Q4 2025', status: 'Due' }, { bank: 'Safwa Islamic Bank', frequency: 'Annual', latest_period: 'FY 2025', status: 'Current' }];
  return { banks: out, sector: sector, cbj_submissions: cbj };
}

const SYS = [
  'You are ZAD, the competitive banking-intelligence analyst for convo.finance. You cover all 15 licensed Jordanian commercial banks.',
  'VOICE: Write like a senior analyst briefing a decision-maker. Lead with the answer or the number, then the why. Be concise and structured. Never open with filler such as great question, I would be happy to, certainly, or you are right. Do not flatter. Do not restate the question back.',
  'GROUNDING: Use only the figures in the knowledge_base block below. Every number must come from it. If the needed data is not present, say so plainly in one line and do not estimate, guess, or use outside knowledge.',
  'BASIS: Money is in JOD thousands unless noted. Arab Bank reports in USD and its figures here are already converted to JOD at the stated peg; note the USD basis when material. Always tie a figure to its fiscal year.',
  'LANGUAGE: Reply in the language of the latest user message. If it is Arabic, reply entirely in formal Arabic. If English, reply in English. Keep numerals in Western digits.',
  'FORMATTING: Short paragraphs. Use a tight bullet list only when comparing several items. You may bold the single most important figure. Do not pad.',
  'CHARTS: When a ranking, comparison, trend, or share is clearer as a visual, append after the text a fenced block that starts with three backtick characters immediately followed by the word chart, then a JSON object, then a closing line of three backtick characters. The JSON shape is an object with keys type set to bar, title a short string, unit a short string, and series an array of objects each having label and value. Use at most 8 series, most relevant first. For money, convert JOD thousands to JOD bn by dividing by 1000000 and set unit to JOD bn. Only include a chart when it genuinely helps.',
  'SCOPE: You answer on Jordanian bank financials, the sector aggregate on Association of Banks in Jordan basis, and CBJ regulatory reporting status. For anything outside Jordanian banking, say it is outside scope in one line.'
].join(String.fromCharCode(10));

export async function POST(req) {
  var body;
  try { body = await req.json(); } catch (e) { return NextResponse.json({ error: 'bad request' }, { status: 400 }); }
  var messages = (body && Array.isArray(body.messages)) ? body.messages : [];
  if (!messages.length) return NextResponse.json({ error: 'no messages' }, { status: 400 });
  var kb;
  try { kb = await buildKnowledge(); } catch (e) { kb = { error: 'knowledge base temporarily unavailable' }; }
  var system = SYS + String.fromCharCode(10) + String.fromCharCode(10) + '<knowledge_base>' + String.fromCharCode(10) + JSON.stringify(kb) + String.fromCharCode(10) + '</knowledge_base>';
  var key = process.env.ANTHROPIC_API_KEY || '';
  if (!key) return NextResponse.json({ error: 'analyst not configured' }, { status: 500 });
  try {
    var resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-opus-4-6', max_tokens: 4096, system: system, messages: messages })
    });
    var data = await resp.json();
    if (data && data.content) {
      var text = data.content.filter(function (c) { return c.type === 'text'; }).map(function (c) { return c.text; }).join(String.fromCharCode(10));
      return NextResponse.json({ text: text, fiscal_year: (kb && kb.sector && kb.sector.fiscal_year) || null });
    }
    return NextResponse.json({ error: 'model error', detail: (data && data.error && data.error.message) || null }, { status: 502 });
  } catch (e) {
    return NextResponse.json({ error: 'request failed' }, { status: 502 });
  }
}

export async function GET() { return NextResponse.json({ name: 'zad-analyst', model: 'claude-opus-4-6', grounded: true, version: 1 }); }
