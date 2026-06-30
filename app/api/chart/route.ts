import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const PEG = 0.709;

function num(v: any): number | null { if (v === null || v === undefined || v === '') return null; const n = Number(v); return isNaN(n) ? null : n; }
function fy(y: any): string { return 'FY' + String(y); }

export async function POST(req: Request) {
  try {
    let body: any = {};
    try { body = await req.json(); } catch (e) { return NextResponse.json({ error: 'Invalid request.' }, { status: 400 }); }
    const prompt: string = (body && body.prompt ? String(body.prompt) : '').toLowerCase();
    const bankId = (body && body.bankId !== undefined && body.bankId !== null) ? body.bankId : null;
    if (bankId === null || bankId === '') return NextResponse.json({ error: 'No bank specified.' }, { status: 400 });

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return NextResponse.json({ error: 'Data service is not configured.' }, { status: 500 });
    const supabase = createClient(url, key);

    const has = function (arr: string[]): boolean { for (let i = 0; i < arr.length; i++) { if (prompt.indexOf(arr[i]) !== -1) return true; } return false; };

    if (has(['rate', 'lending rate', 'deposit rate', 'term deposit', 'mortgage', 'interest rate'])) {
      const r = await supabase.from('bank_rates').select('home_loan_min,home_loan_max,personal_loan_min,personal_loan_max,car_loan_min,car_loan_max,corporate_loan_min,corporate_loan_max,credit_card_rate,saving_rate,td_3m,td_6m,td_12m,effective_date').eq('bank_id', bankId).order('effective_date', { ascending: false }).limit(1);
      if (r.error) return NextResponse.json({ error: 'Could not load rate data.' }, { status: 500 });
      const row: any = (r.data && r.data.length) ? r.data[0] : null;
      if (!row) return NextResponse.json({ error: 'No rate data available for this bank yet.' }, { status: 200 });
      if (has(['deposit', 'saving', 'term'])) {
        const d = [{ name: 'Savings', Rate: num(row.saving_rate) }, { name: '3M', Rate: num(row.td_3m) }, { name: '6M', Rate: num(row.td_6m) }, { name: '12M', Rate: num(row.td_12m) }].filter(function (x: any) { return x.Rate !== null; });
        if (!d.length) return NextResponse.json({ error: 'No deposit rate data yet.' }, { status: 200 });
        return NextResponse.json({ title: 'Deposit Rates (%)', type: 'bar', data: d, series: ['Rate'], insight: 'Current published deposit rates by tenor.' });
      }
      const mid = function (a: any, b: any) { const x = num(a), y = num(b); if (x === null && y === null) return null; if (x === null) return y; if (y === null) return x; return Math.round(((x + y) / 2) * 100) / 100; };
      const d = [{ name: 'Home', Rate: mid(row.home_loan_min, row.home_loan_max) }, { name: 'Personal', Rate: mid(row.personal_loan_min, row.personal_loan_max) }, { name: 'Car', Rate: mid(row.car_loan_min, row.car_loan_max) }, { name: 'Corporate', Rate: mid(row.corporate_loan_min, row.corporate_loan_max) }, { name: 'Card', Rate: num(row.credit_card_rate) }].filter(function (x: any) { return x.Rate !== null; });
      if (!d.length) return NextResponse.json({ error: 'No lending rate data yet.' }, { status: 200 });
      return NextResponse.json({ title: 'Lending Rates (%)', type: 'bar', data: d, series: ['Rate'], insight: 'Indicative lending rates by product (mid-point of published ranges).' });
    }

    const fin = await supabase.from('bank_financials').select('fiscal_year,currency,total_assets,net_loans,customer_deposits,shareholders_equity,net_profit,net_interest_income,net_fee_income,roe,roa,car,npl_ratio,loan_to_deposit,cost_to_income,net_interest_margin').eq('bank_id', bankId).order('fiscal_year', { ascending: true });
    if (fin.error) return NextResponse.json({ error: 'Could not load financial data.', detail: String(fin.error && fin.error.message ? fin.error.message : fin.error).slice(0,200), code: (fin.error && fin.error.code) ? fin.error.code : '' }, { status: 500 });
    const rows: any[] = fin.data || [];
    if (!rows.length) return NextResponse.json({ error: 'No financial data available for this bank yet.' }, { status: 200 });

    let isUSD = false;
    for (let i = 0; i < rows.length; i++) { if (String(rows[i].currency).toUpperCase() === 'USD') isUSD = true; }
    const fx = isUSD ? PEG : 1;
    const money = function (v: any, scale: number) { const n = num(v); if (n === null) return null; return Math.round(((n * fx) / scale) * 100) / 100; };
    const pct = function (v: any) { const n = num(v); if (n === null) return null; return Math.round(n * 100) / 100; };
    const BIL = 1000000, MIL = 1000;

    let spec: any;
    if (has(['roe', 'return on equity'])) spec = { title: 'Return on Equity (%)', type: 'line', series: ['ROE'], cols: [['ROE', 'roe']], kind: 'pct' };
    else if (has(['roa', 'return on asset'])) spec = { title: 'Return on Assets (%)', type: 'line', series: ['ROA'], cols: [['ROA', 'roa']], kind: 'pct' };
    else if (has(['npl', 'non-performing', 'non performing', 'bad loan', 'asset quality'])) spec = { title: 'NPL Ratio (%)', type: 'line', series: ['NPL Ratio'], cols: [['NPL Ratio', 'npl_ratio']], kind: 'pct' };
    else if (has(['cost to income', 'cost-to-income', 'efficiency'])) spec = { title: 'Cost-to-Income (%)', type: 'line', series: ['Cost to Income'], cols: [['Cost to Income', 'cost_to_income']], kind: 'pct' };
    else if (has(['net interest margin', 'nim'])) spec = { title: 'Net Interest Margin (%)', type: 'line', series: ['NIM'], cols: [['NIM', 'net_interest_margin']], kind: 'pct' };
    else if (has(['loan to deposit', 'loan-to-deposit', 'ldr'])) spec = { title: 'Loan-to-Deposit (%)', type: 'line', series: ['LDR'], cols: [['LDR', 'loan_to_deposit']], kind: 'pct' };
    else if (has(['capital adequacy', 'solvency'])) spec = { title: 'Capital Adequacy Ratio (%)', type: 'line', series: ['CAR'], cols: [['CAR', 'car']], kind: 'pct' };
    else if (has(['revenue', 'income breakdown'])) spec = { title: 'Revenue Breakdown (JOD millions)', type: 'bar', series: ['Interest Income', 'Fee Income'], cols: [['Interest Income', 'net_interest_income'], ['Fee Income', 'net_fee_income']], kind: 'mil' };
    else if (has(['profit', 'earnings', 'net income', 'bottom line', 'profitability'])) spec = { title: 'Net Profit (JOD millions)', type: 'line', series: ['Net Profit'], cols: [['Net Profit', 'net_profit']], kind: 'mil' };
    else if (has(['deposit']) && !has(['asset', 'loan', 'growth'])) spec = { title: 'Customer Deposits (JOD billions)', type: 'bar', series: ['Customer Deposits'], cols: [['Customer Deposits', 'customer_deposits']], kind: 'bil' };
    else if (has(['loan', 'lending']) && !has(['asset', 'deposit', 'growth'])) spec = { title: 'Net Loans (JOD billions)', type: 'bar', series: ['Net Loans'], cols: [['Net Loans', 'net_loans']], kind: 'bil' };
    else if (has(['equity']) && !has(['adequacy'])) spec = { title: 'Shareholders Equity (JOD billions)', type: 'bar', series: ['Equity'], cols: [['Equity', 'shareholders_equity']], kind: 'bil' };
    else spec = { title: 'Assets, Deposits and Loans (JOD billions)', type: 'bar', series: ['Total Assets', 'Customer Deposits', 'Net Loans'], cols: [['Total Assets', 'total_assets'], ['Customer Deposits', 'customer_deposits'], ['Net Loans', 'net_loans']], kind: 'bil' };

    const scale = (spec.kind === 'bil') ? BIL : MIL;
    const data = rows.map(function (row: any) {
      const p: any = { name: fy(row.fiscal_year) };
      for (let i = 0; i < spec.cols.length; i++) { const nm = spec.cols[i][0]; const cl = spec.cols[i][1]; p[nm] = (spec.kind === 'pct') ? pct(row[cl]) : money(row[cl], scale); }
      return p;
    });

    let insight = 'Figures shown by fiscal year.';
    try {
      const k = spec.series[0];
      const a = data[0][k], b = data[data.length - 1][k];
      const y0 = data[0].name, y1 = data[data.length - 1].name;
      if (a !== null && b !== null && a !== undefined && b !== undefined) {
        if (spec.kind === 'pct') { insight = k + ' moved from ' + a + '% in ' + y0 + ' to ' + b + '% in ' + y1 + '.'; }
        else if (a !== 0) { const g = Math.round(((b - a) / Math.abs(a)) * 1000) / 10; insight = k + ' ' + (g >= 0 ? 'grew ' : 'declined ') + Math.abs(g) + '% from ' + y0 + ' (' + a + ') to ' + y1 + ' (' + b + ').'; }
        else { insight = k + ' reached ' + b + ' by ' + y1 + '.'; }
      }
    } catch (e) { }

    return NextResponse.json({ title: spec.title, type: spec.type, data: data, series: spec.series, insight: insight });
  } catch (err) {
    return NextResponse.json({ error: 'Unable to generate this chart right now. Please try another question.' }, { status: 200 });
  }
}
