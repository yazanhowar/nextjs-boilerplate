import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPA_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const PEG = 0.709;

function jod(v, cur){ if(v===null||v===undefined) return null; return cur==='USD' ? v*PEG : v; }
function fmtB(v, cur){ var j=jod(v,cur); if(j===null) return 'n/a'; var s=(Math.round(j/1000000*100)/100)+'B'; if(cur==='USD') s+=' (USD '+(Math.round(v/1000000*100)/100)+'B)'; return s; }
function fmtM(v, cur){ var j=jod(v,cur); if(j===null) return 'n/a'; var s=(Math.round(j/1000*10)/10)+'M'; if(cur==='USD') s+=' (USD '+(Math.round(v/1000*10)/10)+'M)'; return s; }

async function buildKnowledge(){
  var sb = createClient(SUPA_URL, SUPA_KEY);
  var banksRes = await sb.from('banks').select('id,name_en,name_ar,ticker,bank_type').order('id');
  var finRes = await sb.from('bank_financials').select('bank_id,fiscal_year,total_assets,customer_deposits,net_loans,total_equity,net_profit,roe,roa,car,npl_ratio,loan_to_deposit,net_interest_margin,cost_to_income,currency').order('bank_id', { ascending: true }).order('fiscal_year', { ascending: true });
  var abjRes = await sb.from('abj_sector_indicators').select('metric,data_period,value,unit').eq('category', 'balance_sheet').order('data_period', { ascending: false });
  var prodRes = await sb.from('bank_products').select('bank_id,category,sub_category,product_name_en').eq('is_active', true).order('bank_id');
  var reRes = await sb.from('bank_real_estate').select('bank_id');
  var banks = banksRes.data || [];
  var fins = finRes.data || [];
  var abj = abjRes.data || [];
  var bmap = {};
  banks.forEach(function(b){ bmap[b.id] = b; });
  fins.sort(function(a,b){ return (a.bank_id - b.bank_id) || ((b.fiscal_year||0) - (a.fiscal_year||0)); });
  
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
    if(f.net_interest_margin!==null && f.net_interest_margin!==undefined) parts.push('NIM ' + f.net_interest_margin + '%');
    if(f.cost_to_income!==null && f.cost_to_income!==undefined) parts.push('cost-to-income ' + f.cost_to_income + '%');
    if(f.loan_to_deposit!==null && f.loan_to_deposit!==undefined) parts.push('loan-to-deposit ' + f.loan_to_deposit + '%');
    var nm = b.name_en || ('Bank ' + f.bank_id);
    lines.push('- ' + nm + ' (id=' + f.bank_id + ', ' + (b.ticker||'') + ', ' + (b.bank_type||'') + ', FY' + f.fiscal_year + '): ' + parts.join(', '));
  });
  var latestPeriod = abj.length ? abj[0].data_period : null;
  var aLatest = {};
  abj.forEach(function(r){ if(r.data_period===latestPeriod && aLatest[r.metric]===undefined) aLatest[r.metric]=r.value; });
  function av(m){ return (aLatest[m]!==null && aLatest[m]!==undefined) ? aLatest[m] : 'n/a'; }
  var abjHist = {};
  abj.forEach(function(r){ var p = String(r.data_period||''); if (p.indexOf('-12-') > 0 || r.data_period === latestPeriod) { (abjHist[r.metric] = abjHist[r.metric] || []).push({ p: p.slice(0,7), v: r.value, u: r.unit }); } });
  Object.keys(abjHist).forEach(function(mm){ var pts = abjHist[mm].sort(function(a,b){ return a.p < b.p ? -1 : 1; }); var ser = pts.map(function(x){ return x.p + ': ' + x.v; }).join(', '); lines.push('- ABJ sector ' + mm + (pts[0] && pts[0].u ? ' (' + pts[0].u + ')' : '') + ' time series: ' + ser); });
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
  var reRows = (reRes && reRes.data) || [];
  var reBy = {}; reRows.forEach(function(r){ reBy[r.bank_id] = (reBy[r.bank_id]||0)+1; });
  var reLines = []; Object.keys(reBy).sort(function(a,b){ return reBy[b]-reBy[a]; }).forEach(function(id){ var nm = (bmap[id] && bmap[id].name_en) || ('Bank ' + id); reLines.push(nm + ' (id=' + id + '): ' + reBy[id]); });
  var reStr = reRows.length ? ('BANK-OWNED REAL ESTATE FOR SALE (all listings are browsable in this product at /real-estate): total ' + reRows.length + ' listings. Listings per bank: ' + reLines.join('; ') + '.') : '';
  return perBank + '\n\n' + abjStr + (prodStr ? ('\n\n' + prodStr) : '') + (reStr ? ('\n\n' + reStr) : '');
}

function buildSystem(knowledge){
  var FENCE = String.fromCharCode(96,96,96);
  var rules = [
    'You are ZAD, a competitive banking-intelligence analyst for the Jordanian banking sector, built by convo.finance.',
    'Every FIGURE you state must come from the DATA below - never invent or estimate numbers. You ARE the analyst: when asked for drivers, causes, outlook or implications, give sharp qualitative analysis from your banking expertise. Never write disclaimers like "not available in the provided data" in analytical answers - analyze or omit.',
    'If the user asks to create, build or see a dashboard for a bank, never say you cannot build dashboards - every bank already has a live dashboard in this product. Respond with a compact summary of the latest key metrics (assets, deposits, loans, net profit, ROE, CAR), one chart of a single key metric over the last 3 fiscal years (prefer net profit), and a markdown link to the dashboard page in the form [Open the Housing Bank dashboard](/bank/2), using the numeric bank id exactly as shown in the id= field of the DATA (a bank listed with id=5 links to /bank/5) - never guess the id. If the user reports a UI bug or app issue, acknowledge briefly that the product team has been notified and answer any analytical part of the message.',
    'If asked for a dashboard for all banks or the whole market: produce a markdown table of all 15 banks with total assets, deposits, net profit and ROE for the latest FY, one chart of a single metric (e.g. FY2025 net profit by bank, or the 3-year sector asset trend), a growth paragraph comparing the last 3 fiscal years (who grew fastest, who lagged), and end with the links [Open the banks directory](/banks) and [Compare banks](/compare).',
    'For questions about real estate, properties or listings: use the BANK-OWNED REAL ESTATE counts from the DATA, NEVER answer with balance-sheet, assets, deposits or loans charts, and always include the link [Browse all property listings](/real-estate). If asked about one bank, give its listing count with the same link. Real estate questions are about physical properties for sale, not financial statements.',
    'The product catalogue lists availability only, not pricing. If asked for a product interest rate, fee, or amount, state that specific pricing is not in the knowledge base rather than estimating.',
    'No filler, no flattery, no preamble. Lead with the direct answer, then brief supporting detail.',
    'Tag every figure with its basis (for example: ABJ sector, group consolidated, FY2025).',
    'For any whole-sector, market or ABJ question, use the OFFICIAL ABJ SECTOR AGGREGATE. Never sum the individual banks for a sector total.',
    'For a specific bank use that bank row. Money is in JOD unless noted; Arab Bank reports in USD and is converted at ' + PEG + '.',
    'Each bank data line is labeled with its fiscal year (FY). Use the line matching the requested year; if no year is specified, use the most recent FY available.',
    'Reply in the user language: if the user writes Arabic, answer in Arabic; otherwise answer in English.',
    'Include exactly one chart ONLY when the user asks for a chart, or the answer inherently compares 3 or more entities, or shows a multi-year/multi-period trend. NEVER chart a single figure - state it in text. The chart must contain exactly the metric, entities and periods the user asked about. A chart plots exactly ONE metric in ONE unit - never mix different metrics or units (e.g. assets in JOD billions with profit in JOD millions) in a single chart. Keep point labels short: FY23 / FY24 / FY25 or bank tickers. Provide the chart as a fenced block: a line with ' + FENCE + 'chart, then one line of JSON {"title":"...","unit":"JOD billion","series":[{"label":"Name","value":number}]}, then a line with ' + FENCE + '. Keep the series short and ordered.'
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
