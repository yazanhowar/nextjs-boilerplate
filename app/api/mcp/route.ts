import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '');

const SERVER = { name: 'convo-finance-mcp', version: '1.0.0' };

const TOOLS = [
  { name: 'list_banks', description: 'List all 15 licensed Jordanian banks in the knowledge base with identifiers, type and profile.', inputSchema: { type: 'object', properties: {} } },
  { name: 'bank_financials', description: 'Reported financials for one bank from the knowledge base. Identify the bank by name, code (e.g. ARBK) or numeric id; optional fiscal_year.', inputSchema: { type: 'object', properties: { bank: { type: 'string' }, fiscal_year: { type: 'number' } }, required: ['bank'] } },
  { name: 'compare_banks', description: 'Compare reported financials across several banks for a fiscal year, from the knowledge base.', inputSchema: { type: 'object', properties: { banks: { type: 'array', items: { type: 'string' } }, fiscal_year: { type: 'number' } }, required: ['banks'] } },
  { name: 'sector_overview', description: 'Banking-sector aggregates for a fiscal year (Association of Banks in Jordan view): sums and averages computed from the knowledge base. Defaults to the latest year.', inputSchema: { type: 'object', properties: { fiscal_year: { type: 'number' } } } },
  { name: 'cbj_policy_rates', description: 'Central Bank of Jordan policy rates from the knowledge base.', inputSchema: { type: 'object', properties: {} } },
  { name: 'cbj_submissions', description: 'CBJ regulatory-return submission tracker per bank across months, quarters and years.', inputSchema: { type: 'object', properties: { bank: { type: 'string' } } } }
];

function numericAgg(rows) {
  var skip = { id: 1, bank_id: 1, fiscal_year: 1, year: 1 };
  var acc = {};
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    for (var k in r) {
      if (skip[k]) continue;
      var v = r[k];
      if (typeof v === 'number' && isFinite(v)) {
        if (!acc[k]) acc[k] = { sum: 0, count: 0 };
        acc[k].sum += v; acc[k].count += 1;
      }
    }
  }
  var out = {};
  for (var key in acc) { out[key] = { sum: acc[key].sum, avg: acc[key].sum / acc[key].count }; }
  return out;
}

async function resolveBankIds(qs) {
  var res = await supabase.from('banks').select('*');
  var banks = res.data || [];
  var ids = [];
  for (var i = 0; i < qs.length; i++) {
    var q = ('' + qs[i]).trim().toLowerCase();
    if (!q) continue;
    var matched = null;
    for (var b = 0; b < banks.length; b++) {
      var bank = banks[b];
      if (String(bank.id) === q) { matched = bank; break; }
      for (var k in bank) { var val = bank[k]; if (typeof val === 'string' && val.toLowerCase().indexOf(q) >= 0) { matched = bank; break; } }
      if (matched) break;
    }
    if (matched && ids.indexOf(matched.id) < 0) ids.push(matched.id);
  }
  return ids;
}

function cbjDummy(bank) {
  var names = ['Housing Bank', 'Arab Bank', 'Jordan Islamic Bank', 'Bank of Jordan', 'Cairo Amman Bank', 'Jordan Kuwait Bank', 'Capital Bank', 'Safwa Islamic Bank', 'Etihad Bank', 'Invest Bank'];
  var freqs = ['Monthly', 'Monthly', 'Monthly', 'Quarterly', 'Quarterly', 'Quarterly', 'Annual', 'Monthly', 'Quarterly', 'Annual'];
  var periods = ['May 2026', 'May 2026', 'Apr 2026', 'Q1 2026', 'Q1 2026', 'Q4 2025', 'FY 2025', 'May 2026', 'Q1 2026', 'FY 2025'];
  var counts = [17, 17, 16, 9, 8, 7, 3, 15, 8, 2];
  var status = ['Current', 'Current', 'Due', 'Current', 'Due', 'Current', 'Current', 'Current', 'Current', 'Due'];
  var rows = [];
  for (var i = 0; i < names.length; i++) { rows.push({ bank: names[i], frequency: freqs[i], latest_period: periods[i], reports_filed: counts[i], status: status[i] }); }
  if (bank) { var q = ('' + bank).toLowerCase(); rows = rows.filter(function (r) { return r.bank.toLowerCase().indexOf(q) >= 0; }); }
  return rows;
}

async function callTool(name, args) {
  args = args || {};
  if (name === 'list_banks') {
    var r = await supabase.from('banks').select('*').order('id');
    if (r.error) throw new Error(r.error.message);
    return r.data || [];
  }
  if (name === 'bank_financials') {
    var ids = await resolveBankIds([args.bank]);
    if (!ids.length) return { note: 'No bank matched the query', query: args.bank };
    var qb = supabase.from('bank_financials').select('*').eq('bank_id', ids[0]);
    if (args.fiscal_year) qb = qb.eq('fiscal_year', args.fiscal_year);
    var rr = await qb.order('fiscal_year', { ascending: false });
    if (rr.error) throw new Error(rr.error.message);
    return rr.data || [];
  }
  if (name === 'compare_banks') {
    var ids2 = await resolveBankIds(args.banks || []);
    if (!ids2.length) return { note: 'No banks matched', query: args.banks };
    var qb2 = supabase.from('bank_financials').select('*').in('bank_id', ids2);
    if (args.fiscal_year) qb2 = qb2.eq('fiscal_year', args.fiscal_year);
    var c = await qb2;
    if (c.error) throw new Error(c.error.message);
    return c.data || [];
  }
  if (name === 'sector_overview') {
    var all = await supabase.from('bank_financials').select('*');
    if (all.error) throw new Error(all.error.message);
    var rows = all.data || [];
    var year = args.fiscal_year;
    if (!year) { var ys = rows.map(function (r) { return r.fiscal_year; }).filter(function (x) { return typeof x === 'number'; }); year = ys.length ? Math.max.apply(null, ys) : null; }
    var yr = year ? rows.filter(function (r) { return r.fiscal_year === year; }) : rows;
    return { fiscal_year: year, bank_count: yr.length, aggregates: numericAgg(yr), rows: yr };
  }
  if (name === 'cbj_policy_rates') {
    var p = await supabase.from('cbj_policy_rates').select('*').order('id', { ascending: false });
    if (p.error) throw new Error(p.error.message);
    return p.data || [];
  }
  if (name === 'cbj_submissions') { return cbjDummy(args.bank); }
  throw new Error('Unknown tool: ' + name);
}

function rpcResult(id, result) { return { jsonrpc: '2.0', id: (id === undefined ? null : id), result: result }; }
function rpcError(id, code, message) { return { jsonrpc: '2.0', id: (id === undefined ? null : id), error: { code: code, message: message } }; }

export async function POST(req) {
  var body;
  try { body = await req.json(); } catch (e) { return NextResponse.json(rpcError(null, -32700, 'Parse error')); }
  var id = (body && body.id !== undefined) ? body.id : null;
  var method = body && body.method;
  if (method === 'initialize') { return NextResponse.json(rpcResult(id, { protocolVersion: '2024-11-05', capabilities: { tools: {} }, serverInfo: SERVER })); }
  if (method === 'notifications/initialized' || method === 'initialized') { return new NextResponse(null, { status: 202 }); }
  if (method === 'ping') { return NextResponse.json(rpcResult(id, {})); }
  if (method === 'tools/list') { return NextResponse.json(rpcResult(id, { tools: TOOLS })); }
  if (method === 'tools/call') {
    var params = (body && body.params) || {};
    try {
      var out = await callTool(params.name, params.arguments || {});
      return NextResponse.json(rpcResult(id, { content: [{ type: 'text', text: JSON.stringify(out) }] }));
    } catch (e) {
      return NextResponse.json(rpcResult(id, { content: [{ type: 'text', text: 'Error: ' + ((e && e.message) ? e.message : String(e)) }], isError: true }));
    }
  }
  return NextResponse.json(rpcError(id, -32601, 'Method not found: ' + method));
}

export async function GET() {
  return NextResponse.json({ name: SERVER.name, version: SERVER.version, protocol: 'jsonrpc-2.0 / mcp', tools: TOOLS.map(function (t) { return t.name; }) });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, GET, OPTIONS', 'Access-Control-Allow-Headers': 'content-type' } });
}
