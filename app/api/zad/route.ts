import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPA_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const PEG = 0.710;

function jod(v, cur){ if(v===null||v===undefined) return null; return cur==='USD' ? v*PEG : v; }
function fmtB(v, cur){ var j=jod(v,cur); if(j===null) return 'n/a'; return (Math.round(j/1000000*100)/100)+'B'; }
function fmtM(v, cur){ var j=jod(v,cur); if(j===null) return 'n/a'; return (Math.round(j/1000*10)/10)+'M'; }

async function buildKnowledge(){
  var sb = createClient(SUPA_URL, SUPA_KEY);
  var banksRes = await sb.from('banks').select('id,name_en,name_ar,ticker,bank_type').order('id');
  var finRes = await sb.from('bank_financials').select('bank_id,fiscal_year,total_assets,customer_deposits,net_loans,total_equity,net_profit,roe,roa,car,npl_ratio,loan_to_deposit,currency').order('bank_id', { ascending: true }).order('fiscal_year', { ascending: true });
  var abjRes = await sb.from('abj_sector_indicators').select('metric,data_period,value,unit').eq('category', 'balance_sheet').order('data_period', { ascending: false });
  var prodRes = await sb.from('bank_products').select('bank_id,category,sub_category,product_name_en').eq('is_active', true).order('bank_id');
  var banks = banksRes.data || [];
  var fins = finRes.data || [];
  var abj = abjRes.data || [];
  var bmap = {};
  banks.forEach(function(b){ bmap[b.id] = b; });
  fins.sort(function(a,b){ return (jod(b.total_assets,b.currency)||0) - (jod(a.total_assets,a.currency)||0); });
  var lines = [];
  fins.forEach(function(f){
    var b = bmap[f.bank_id] || {};
    var parts = [];
    parts.push('assets ' + fmtB(f.total_assets, f.currency));
    parts.push('deposits ' + fmtB(f.customer_deposits, f.currency));
    if(f.net_loans!==null && f.net_loans!==undefined) parts.push('net loans ' + fmtB(f.net_loans, f.currency));
    parts.push('equity ' + fmtB(f.total_equity, f.currency));
    parts.push('net profit ' + fmtM(f.net_profit, f.currency));
    if(f.roe!==null && f.roe!==undefined) parts.push('ROE ' + f.roe + '%');
    if(f.roa!==null && f.roa!==undefined) parts.push('ROA ' + f.roa + '%');
    if(f.car!==null && f.car!==undefined) parts.push('CAR ' + f.car + '%');
    if(f.npl_ratio!==null && f.npl_ratio!==undefined) parts.push('NPL ' + f.npl_ratio + '%');
    if(f.loan_to_deposit!==null && f.loan_to_deposit!==undefined) parts.push('loan-to-deposit ' + f.loan_to_deposit + '%');
    var nm = b.name_en || ('Bank ' + f.bank_id);
    lines.push('- ' + nm + ' (' + (b.ticker||'') + ', ' + (b.bank_type||'') + '): ' + parts.join(', '));
  });
  var latestPeriod = abj.length ? abj[0].data_period : null;
  var aLatest = {};
  abj.forEach(function(r){ if(r.data_period===latestPeriod && aLatest[r.metric]===undefined) aLatest[r.metric]=r.value; });
  function av(m){ return (aLatest[m]!==null && aLatest[m]!==undefined) ? aLatest[m] : 'n/a'; }
  var ewRes = await sb.from('abj_sector_indicators').select('metric,data_period,value,unit').eq('category', 'ewallet').order('data_period', { ascending: false });
  var ewRows = (ewRes && ewRes.data) || [];
  var ewLatestPeriod = null; if (ewRows.length) { ewLatestPeriod = ewRows[0].data_period; }
  var ewMap = {};
  for (var ewi = 0; ewi < ewRows.length; ewi++) { if (ewRows[ewi].data_period === ewLatestPeriod) { ewMap[ewRows[ewi].metric] = ewRows[ewi]; } }
  function ewv(m){ var r = ewMap[m]; if (!r || r.value === null || r.value === undefined) { return null; } var u = ''; if (r.unit) { u = ' ' + r.unit; } return r.value + u; }
  var ewSentence = '';
  if (ewLatestPeriod) {
    var ewParts = [];
    var ewT = ewv('jomopay_transactions'); if (ewT) { ewParts.push(ewT + ' transactions'); }
    var ewU = ewv('jomopay_users'); if (ewU) { ewParts.push(ewU + ' registered users'); }
    var ewVal = ewv('jomopay_value'); if (ewVal) { ewParts.push('transaction value of ' + ewVal); }
    if (ewParts.length) { ewSentence = ' DIGITAL PAYMENTS (JoMoPay national mobile-payment switch, sector-wide, as of ' + ewLatestPeriod + '): ' + ewParts.join(', ') + '.'; }
  }
  var abjStr = 'OFFICIAL ABJ SECTOR AGGREGATE (source: Association of Banks in Jordan; authoritative basis for any whole-sector question; as of ' + (latestPeriod||'latest') + '): total assets JOD ' + av('total_assets') + 'B, total deposits JOD ' + av('total_deposits') + 'B, total credit facilities JOD ' + av('total_credit_facilities') + 'B. For any sector-wide or ABJ figure use THESE numbers. Do NOT sum the individual banks below for a sector total, because Arab Bank is stored at its global consolidated balance sheet (USD) and over-counts the Jordanian sector.' + ewSentence;
  var perBank = 'PER-BANK FY2025 (group consolidated; normalized to JOD; Arab Bank converted from USD at ' + PEG + '):\n' + lines.join('\n');
  var prods = prodRes.data || [];
  var pByBank = {};
  prods.forEach(function(p){ var id = p.bank_id; (pByBank[id] = pByBank[id] || []).push(p.product_name_en + ' [' + (p.sub_category || p.category || '') + ']'); });
  var prodLines = [];
  Object.keys(pByBank).forEach(function(id){ var b = bmap[id] || {}; var nm = b.name_en || ('Bank ' + id); prodLines.push('- ' + nm + ' (' + pByBank[id].length + ' products): ' + pByBank[id].join('; ')); });
  var prodStr = prodLines.length ? ('BANKING PRODUCTS PER BANK (source: each bank official website; product availability/catalogue only, no pricing or interest rates): ' + prodLines.join('\n')) : '';
  return perBank + '\n\n' + abjStr + (prodStr ? ('\n\n' + prodStr) : '');
}

function buildSystem(knowledge){
  var FENCE = String.fromCharCode(96,96,96);
  var rules = [
    'You are ZAD, a competitive banking-intelligence analyst for the Jordanian banking sector, built by convo.finance.',
    'Answer using ONLY the DATA provided below. Never invent or estimate numbers; if something is not in the data, say it is not available.',
    'The product catalogue lists availability only, not pricing. If asked for a product interest rate, fee, or amount, state that specific pricing is not in the knowledge base rather than estimating.',
    'No filler, no flattery, no preamble. Lead with the direct answer, then brief supporting detail.',
    'Tag every figure with its basis (for example: ABJ sector, group consolidated, FY2025).',
    'For any whole-sector, market or ABJ question, use the OFFICIAL ABJ SECTOR AGGREGATE. Never sum the individual banks for a sector total.',
    'For a specific bank use that bank row. Money is in JOD unless noted; Arab Bank reports in USD and is converted at ' + PEG + '.',
    'Reply in the user language: if the user writes Arabic, answer in Arabic; otherwise answer in English.',
    'When a comparison, ranking, trend or distribution would help, include exactly one chart as a fenced block: a line with ' + FENCE + 'chart, then one line of JSON {"title":"...","unit":"JOD billion","series":[{"label":"Name","value":number}]}, then a line with ' + FENCE + '. Keep the series short and ordered.'
  ];
  return rules.join('\n') + '\n\nDATA:\n' + knowledge;
}

export async function POST(req){
  try{
    var body = await req.json();
    var lang = (body && body.lang==='ar') ? 'ar' : 'en';
    var convo = [];
    if(body && Array.isArray(body.messages)){
      body.messages.forEach(function(m){
        if(!m) return;
        var role = (m.role==='assistant') ? 'assistant' : 'user';
        var content = (typeof m.content==='string') ? m.content : String((m.content!==undefined?m.content:''));
        if(content) convo.push({ role: role, content: content });
      });
    }
    var input = '';
    if(body){ if(typeof body.input==='string') input=body.input; else if(typeof body.question==='string') input=body.question; else if(typeof body.message==='string') input=body.message; }
    if(input){
      var last = convo.length ? convo[convo.length-1] : null;
      if(!last || last.role!=='user' || last.content!==input) convo.push({ role:'user', content: input });
    }
    if(convo.length===0) convo.push({ role:'user', content: (lang==='ar'?'مرحبا':'Hello') });
    var knowledge = await buildKnowledge();
    var system = buildSystem(knowledge);
    var ares = await fetch('https://api.anthropic.com/v1/messages', {
      method:'POST',
      headers:{ 'x-api-key': ANTHROPIC_KEY, 'anthropic-version':'2023-06-01', 'content-type':'application/json' },
      body: JSON.stringify({ model:'claude-opus-4-6', max_tokens:4096, system: system, messages: convo })
    });
    var data = await ares.json();
    var reply = '';
    if(data && Array.isArray(data.content)){
      reply = data.content.filter(function(c){ return c && c.type==='text'; }).map(function(c){ return c.text; }).join('\n');
    }
    if(!reply && data && data.error){ reply = (lang==='ar'?'تعذّر إنشاء رد.':'Could not generate a response.'); }
    return NextResponse.json({ text: reply, content: reply });
  }catch(e){
    return NextResponse.json({ text: 'Sorry, an error occurred.', content: 'Sorry, an error occurred.', error: String(e && e.message || e) }, { status: 200 });
  }
}

export async function GET(){ return NextResponse.json({ ok: true, service: 'zad' }); }

// redeploy trigger 1782828567201
