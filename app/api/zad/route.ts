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
  var reRes = await createClient(process.env.NEXT_PUBLIC_SUPABASE_URL as string, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string).from('bank_real_estate').select('bank_id');
  var stockRes = await createClient(process.env.NEXT_PUBLIC_SUPABASE_URL as string, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string).from('bank_stock_data').select('bank_id,price,day_high,day_low,change_pct,volume,price_date').order('bank_id');
  var ratesRes = await createClient(process.env.NEXT_PUBLIC_SUPABASE_URL as string, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string).from('bank_rates').select('bank_id,effective_date,home_loan_min,home_loan_max,personal_loan_min,personal_loan_max,car_loan_min,car_loan_max,credit_card_rate,saving_rate,td_12m,murabaha_rate_min,murabaha_rate_max').order('bank_id');
  var tariffRes = await createClient(process.env.NEXT_PUBLIC_SUPABASE_URL as string, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string).from('bank_tariffs').select('bank_id,effective_date,local_transfer_fee,swift_transfer_fee_jod,swift_transfer_fee_pct,account_maintenance_fee,debit_card_annual_fee,credit_card_annual_fee_classic,credit_card_annual_fee_gold').order('bank_id');
  var annRes = await createClient(process.env.NEXT_PUBLIC_SUPABASE_URL as string, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string).from('annual_reports').select('bank_id,fiscal_year,pdf_url,auditor').order('bank_id');
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
    var stRows = (stockRes && stockRes.data) || [];
  var stLines: string[] = [];
  stRows.forEach(function(r: any){ var nm = (bmap[r.bank_id] && bmap[r.bank_id].name_en) || ('Bank ' + r.bank_id); stLines.push('- ' + nm + ' (id=' + r.bank_id + '): JOD ' + r.price + ' (' + (Number(r.change_pct) >= 0 ? '+' : '') + r.change_pct + '%), day range ' + r.day_low + '-' + r.day_high + ', volume ' + r.volume); });
  var stStr = stRows.length ? ('ASE SHARE PRICES (Amman Stock Exchange, price in JOD per share, as of ' + (stRows[0].price_date || 'latest available') + '):\n' + stLines.join('\n')) : '';
  function rng(a: any, b: any){ var A = (a===null||a===undefined||a==='')?null:a; var B = (b===null||b===undefined||b==='')?null:b; if(A===null&&B===null) return ''; if(A!==null&&B!==null&&String(A)!==String(B)) return A+'-'+B+'%'; return (A!==null?A:B)+'%'; }
  var rtRows = (ratesRes && ratesRes.data) || []; var rtLines: string[] = [];
  rtRows.forEach(function(r: any){ var nm = (bmap[r.bank_id] && bmap[r.bank_id].name_en) || ('Bank ' + r.bank_id); var ps: string[] = []; var h=rng(r.home_loan_min,r.home_loan_max); if(h) ps.push('home loan '+h); var pl=rng(r.personal_loan_min,r.personal_loan_max); if(pl) ps.push('personal '+pl); var cl=rng(r.car_loan_min,r.car_loan_max); if(cl) ps.push('car '+cl); if(r.credit_card_rate!==null&&r.credit_card_rate!==undefined) ps.push('credit card '+r.credit_card_rate+'%'); if(r.saving_rate!==null&&r.saving_rate!==undefined) ps.push('savings '+r.saving_rate+'%'); if(r.td_12m!==null&&r.td_12m!==undefined) ps.push('12m deposit '+r.td_12m+'%'); var mu=rng(r.murabaha_rate_min,r.murabaha_rate_max); if(mu) ps.push('murabaha '+mu); if(ps.length) rtLines.push('- '+nm+' (id='+r.bank_id+', as of '+(r.effective_date||'n/a')+'): '+ps.join(', ')); });
  var rtStr = rtLines.length ? ('LENDING AND DEPOSIT RATES PER BANK (% per annum, indicative published rates):\n' + rtLines.join('\n')) : '';
  var feRows = (tariffRes && tariffRes.data) || []; var feLines: string[] = [];
  feRows.forEach(function(r: any){ var nm = (bmap[r.bank_id] && bmap[r.bank_id].name_en) || ('Bank ' + r.bank_id); var ps: string[] = []; if(r.local_transfer_fee!==null&&r.local_transfer_fee!==undefined) ps.push('local transfer '+r.local_transfer_fee+' JOD'); if(r.swift_transfer_fee_jod!==null&&r.swift_transfer_fee_jod!==undefined) ps.push('SWIFT '+r.swift_transfer_fee_jod+' JOD'); else if(r.swift_transfer_fee_pct!==null&&r.swift_transfer_fee_pct!==undefined) ps.push('SWIFT '+r.swift_transfer_fee_pct+'%'); if(r.account_maintenance_fee!==null&&r.account_maintenance_fee!==undefined) ps.push('account maintenance '+r.account_maintenance_fee+' JOD'); if(r.debit_card_annual_fee!==null&&r.debit_card_annual_fee!==undefined) ps.push('debit card '+r.debit_card_annual_fee+' JOD/yr'); if(r.credit_card_annual_fee_classic!==null&&r.credit_card_annual_fee_classic!==undefined) ps.push('credit card classic '+r.credit_card_annual_fee_classic+' JOD/yr'); if(r.credit_card_annual_fee_gold!==null&&r.credit_card_annual_fee_gold!==undefined) ps.push('gold '+r.credit_card_annual_fee_gold+' JOD/yr'); if(ps.length) feLines.push('- '+nm+' (id='+r.bank_id+', as of '+(r.effective_date||'n/a')+'): '+ps.join(', ')); });
  var feStr = feLines.length ? ('STANDARD FEES AND TARIFFS PER BANK (published tariff of charges):\n' + feLines.join('\n')) : '';
  var annRows = (annRes && annRes.data) || []; var annBy: any = {};
  annRows.forEach(function(r: any){ if(!r.pdf_url) return; var nm = (bmap[r.bank_id] && bmap[r.bank_id].name_en) || ('Bank ' + r.bank_id); annBy[nm] = annBy[nm] || []; annBy[nm].push('FY'+r.fiscal_year+' [PDF]('+r.pdf_url+')'+(r.auditor?(' audited by '+r.auditor):'')); });
  var annLines: string[] = []; Object.keys(annBy).forEach(function(nm){ annLines.push('- '+nm+': '+annBy[nm].join('; ')); });
  var annStr = annLines.length ? ('OFFICIAL ANNUAL REPORTS (downloadable PDFs):\n' + annLines.join('\n')) : '';
  return perBank + '\n\n' + abjStr + (prodStr ? ('\n\n' + prodStr) : '') + (reStr ? ('\n\n' + reStr) : '') + (stStr ? ('\n\n' + stStr) : '') + (rtStr ? ('\n\n' + rtStr) : '') + (feStr ? ('\n\n' + feStr) : '') + (annStr ? ('\n\n' + annStr) : '') + '\n\nSTRATEGIC ANSWER MANDATE: You advise C-suite banking executives and the Central Bank of Jordan. For every question: (1) ground each figure in the knowledge base and tag it with its period and source. (2) Compute derived measures - growth rates, shares, loan-to-deposit ratios, spreads, regional splits - from the series instead of saying data is unavailable. (3) Close every answer with a short line starting with Decision angle: (in Arabic answers start it with \u0632\u0627\u0648\u064a\u0629 \u0627\u0644\u0642\u0631\u0627\u0631:) giving one or two sentences on what the finding implies for a concrete decision a bank executive could take. (4) If a needed series is genuinely absent, name the exact missing series in one line and answer with the closest available proxy, labeled as such. (5) Avoid unexplained acronyms - spell terms out on first use. Be decision-grade, never padded. EXHAUSTIVE GROUNDING RULE - CRITICAL: The knowledge base is comprehensive and covers the Jordanian banking sector in depth across sector aggregates, bank-level financials, interest and deposit rates, regional deposits and credit, public debt, ratings, trade, inflation, growth, and electronic payments. Before ever stating that data is missing, unavailable, or not in the dataset, exhaustively search the provided context and derive the answer from related series: compute it from components, aggregate monthly figures into quarterly or annual, infer a ratio from its numerator and denominator, or carry the most recent available period as a labeled proxy. Stating that something is not available is a critical failure whenever the figure could have been derived or a close proxy supplied. If after genuine exhaustive effort a specific series is truly absent, name the exact missing series in one short clause and immediately give the closest available proxy explicitly labeled as a proxy, with its period and source, and never leave the executive without a usable number. Do not invent figures: every number must trace to the provided context or be a transparent computation from it. Deriving from what exists is expected; fabricating what does not exist is prohibited. Groundedness is the product.\n\nTONE LAW: analytical, neutral, firm, concrete. Never open with pleasantries, praise of the question, or meta commentary. Lead with the finding and the number. Present what the data supports and the trade-offs; do not issue directives - the executive decides. No exclamation marks. No filler.\n\nCHART PROTOCOL: When a comparison, ranking, trend or distribution is central to the answer, include exactly one fenced block: a line with ```chart then a single JSON object with keys type (bar, line or donut), title, unit, labels (array of strings, max 8), series (array of objects with keys name and values), then a line with ``` to close. Values must come from the knowledge base. Place the block where the chart belongs in the answer.';
}

function buildSystem(knowledge){
  var FENCE = String.fromCharCode(96,96,96);
  var rules = [
    'You are ZAD, a competitive banking-intelligence analyst for the Jordanian banking sector, built by convo.finance.',
    'STYLE CONTRACT - ABSOLUTE AND OVERRIDING: Never open with pleasantries, praise of the question, or meta-commentary. Banned openers include: great question, excellent question, good question, sure, certainly, of course, happy to help, \u0633\u0624\u0627\u0644 \u0631\u0627\u0626\u0639, \u0633\u0624\u0627\u0644 \u0645\u0645\u062a\u0627\u0632, \u0628\u0627\u0644\u062a\u0623\u0643\u064a\u062f. Begin every answer directly with the finding or the number. Tone: neutral, analytical, strategic, firm. State conclusions decisively when the series support them; do not hedge with vague maybes - when uncertainty is real, quantify it by naming the period, vintage, or missing series. Short declarative sentences. No exclamation marks. Do not end with offers of further help.',
    'Every FIGURE you state must come from the DATA below - never invent or estimate numbers. You ARE the analyst: when asked for drivers, causes, outlook or implications, give sharp qualitative analysis from your banking expertise. Never write disclaimers like "not available in the provided data" in analytical answers - analyze or omit.',
    'If the user asks to create, build or see a dashboard for a bank, never say you cannot build dashboards - every bank already has a live dashboard in this product. Respond with a compact summary of the latest key metrics (assets, deposits, loans, net profit, ROE, CAR), one chart of a single key metric over the last 3 fiscal years (prefer net profit), and a markdown link to the dashboard page in the form [Open the Housing Bank dashboard](/bank/2), using the numeric bank id exactly as shown in the id= field of the DATA (a bank listed with id=5 links to /bank/5) - never guess the id. If the user reports a UI bug or app issue, acknowledge briefly that the product team has been notified and answer any analytical part of the message.',
    'If asked for a dashboard for all banks or the whole market: produce a markdown table of all 15 banks with total assets, deposits, net profit and ROE for the latest FY, one chart of a single metric (e.g. FY2025 net profit by bank, or the 3-year sector asset trend), a growth paragraph comparing the last 3 fiscal years (who grew fastest, who lagged), and end with the links [Open the banks directory](/banks) and [Compare banks](/compare).',
    'For real-estate questions, use the BANK-OWNED REAL ESTATE data (listing counts per bank) and always include the markdown link [Browse all listings](/real-estate). Only chart listing counts per bank if the user asks for a comparison.',
    'For share-price or market questions, use the ASE SHARE PRICES data (price, daily change, day range, volume) and always state the as-of date. Market cap and P/E are not tracked in the data - say so plainly if asked, never invent them.',
    'For loan, deposit or interest-rate questions use the LENDING AND DEPOSIT RATES data; for fee, charge or tariff questions use the STANDARD FEES AND TARIFFS data. Always mention the as-of effective date and present ranges as min-max. For annual-report requests give the markdown PDF link from OFFICIAL ANNUAL REPORTS.',
    'For questions about real estate, properties or listings: use the BANK-OWNED REAL ESTATE counts from the DATA, NEVER answer with balance-sheet, assets, deposits or loans charts, and always include the link [Browse all property listings](/real-estate). If asked about one bank, give its listing count with the same link. Real estate questions are about physical properties for sale, not financial statements.',
    'The product catalogue lists availability only, not pricing. If asked for a product interest rate, fee, or amount, state that specific pricing is not in the knowledge base rather than estimating.',
    'No filler, no flattery, no preamble. Lead with the direct answer, then brief supporting detail.',
    'Tag every figure with its basis (for example: ABJ sector, group consolidated, FY2025).',
    'For any whole-sector, market or ABJ question, use the OFFICIAL ABJ SECTOR AGGREGATE. Never sum the individual banks for a sector total.',
    'For a specific bank use that bank row. Money is in JOD unless noted; Arab Bank reports in USD and is converted at ' + PEG + '.',
    'Each bank data line is labeled with its fiscal year (FY). Use the line matching the requested year; if no year is specified, use the most recent FY available.',
    'Reply in the user language: if the user writes Arabic, answer in Arabic; otherwise answer in English.',
    'Include exactly one chart ONLY when the user asks for a chart, or the answer inherently compares 3 or more entities, or shows a multi-year/multi-period trend. NEVER chart a single figure - state it in text. The chart must contain exactly the metric, entities and periods the user asked about. A chart plots exactly ONE metric in ONE unit - never mix different metrics or units (e.g. assets in JOD billions with profit in JOD millions) in a single chart. Keep point labels short: FY23 / FY24 / FY25 or bank tickers. The chart topic must match the question topic - if the user asks about something with no numeric series in the DATA, answer in text with NO chart; never substitute a chart from a different topic. Provide the chart as a fenced block: a line with ' + FENCE + 'chart, then one line of JSON {"title":"...","unit":"JOD billion","series":[{"label":"Name","value":number}]}, then a line with ' + FENCE + '. Keep the series short and ordered.'
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
    var knowledge = await buildKnowledge()
    try { knowledge += await buildMacroBlock() } catch (e) {};
    var system = buildSystem(knowledge);
    var wantStream = false; try { wantStream = req.headers.get('x-cf-stream') === '1' } catch (eS) { wantStream = false }
    var ares = await fetch('https://api.anthropic.com/v1/messages', {
      method:'POST',
      headers:{ 'x-api-key': ANTHROPIC_KEY, 'anthropic-version':'2023-06-01', 'content-type':'application/json' },
      body: JSON.stringify({ model:'claude-opus-4-6', max_tokens:4096, system: system, messages: convo, stream: wantStream })
    });
        if (wantStream && ares.ok && ares.body) {
      var enc2 = new TextEncoder();
      var outStream = new ReadableStream({
        async start(controller) {
          var reader = (ares.body as any).getReader();
          var dec2 = new TextDecoder();
          var buf2 = '';
          while (true) {
            var ch2 = await reader.read();
            if (ch2.done) break;
            buf2 += dec2.decode(ch2.value, { stream: true });
            var nl2 = -1;
            while ((nl2 = buf2.indexOf(String.fromCharCode(10))) > -1) {
              var ln2 = buf2.slice(0, nl2); buf2 = buf2.slice(nl2 + 1);
              if (ln2.indexOf('data: ') === 0) {
                try {
                  var ev2 = JSON.parse(ln2.slice(6));
                  if (ev2 && ev2.type === 'content_block_delta' && ev2.delta && ev2.delta.text) controller.enqueue(enc2.encode(ev2.delta.text));
                } catch (e3) {}
              }
            }
          }
          controller.close();
        }
      });
      return new Response(outStream, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache' } });
    }
    var data = await ares.json();
    var reply = '';
    if(data && Array.isArray(data.content)){
      reply = data.content.filter(function(c){ return c && c.type==='text'; }).map(function(c){ return c.text; }).join('\n');
    }
    if(!reply && data && data.error){ reply = (lang==='ar'?'تعذّر إنشاء رد.':'Could not generate a response.'); }
    for (var _k = 0; _k < 3; _k++) { reply = String(reply || '').replace(/^[\s"'\u201c\u201d]*((that('|\u2019)?s\s+a\s+)?(great|excellent|good|fantastic)\s+question[!.,\u060c]*|sure[!.,\u060c]+|certainly[!.,\u060c]+|of\s+course[!.,\u060c]+|happy\s+to\s+help[!.,\u060c]*|\u0633\u0624\u0627\u0644 (\u0631\u0627\u0626\u0639|\u0645\u0645\u062a\u0627\u0632|\u062c\u064a\u062f)[!.,\u060c]*|\u0628\u0627\u0644\u062a\u0623\u0643\u064a\u062f[!.,\u060c]+)\s*/i, '').replace(/^\s+/, ''); }
    return NextResponse.json({ text: reply, content: reply });
  }catch(e){
    return NextResponse.json({ text: 'Sorry, an error occurred.', content: 'Sorry, an error occurred.', error: String(e && e.message || e) }, { status: 200 });
  }
}

export async function GET(){ return NextResponse.json({ ok: true, service: 'zad' }); }

// redeploy trigger 1782828567201
// retrigger


async function buildMacroBlock(): Promise<string> {
  try {
    var sbc: any = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    var r1 = await sbc.from('macro_indicators').select('category,indicator,period,value,unit,source').neq('category', '_cf_probe').order('category', { ascending: true }).order('indicator', { ascending: true }).order('id', { ascending: true })
    var rows = (r1 && r1.data) || []
    if (!rows.length) return ''
    var g: any = {}
    var order: string[] = []
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i]
      var k = r.category + ' | ' + r.indicator + (r.unit && r.unit !== '%' ? ' (' + r.unit + ')' : '')
      if (!g[k]) { g[k] = []; order.push(k) }
      g[k].push(r.period + '=' + r.value)
    }
    var out = '\n\nMACRO AND ECONOMY DATA (Jordan and global; DoS/CBJ/MoF national sources plus IMF WEO/CPI/DOT mirrors; auto-synced weekly):\n'
    for (var j = 0; j < order.length; j++) {
      var kk = order[j]
      var vals = g[kk]
      if (vals.length > 14) vals = vals.slice(vals.length - 14)
      out += kk + ': ' + vals.join(', ') + '\n'
    }
    var r2 = await sbc.from('credit_ratings').select('agency,rating,outlook,rating_year')
    var cr = (r2 && r2.data) || []
    if (cr.length) {
      out += 'Jordan sovereign ratings: '
      for (var c = 0; c < cr.length; c++) { out += (c ? '; ' : '') + cr[c].agency + ' ' + cr[c].rating + (cr[c].outlook ? ' (' + cr[c].outlook + ')' : '') }
      out += '\n'
    }
    out += 'Macro data rules: for Jordan actuals prefer DoS/CBJ/MoF rows over IMF rows; IMF is authoritative for global aggregates and forecasts (periods ending in F are forecasts). Monthly periods use Mon-YYYY format. Monthly trade figures are USD millions (IMF DOT); DoS half-year trade figures are JOD millions.\n'
    return out
  } catch (e) { return '' }
}
