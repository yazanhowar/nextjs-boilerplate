'use client'
// convo.finance - shared analytical layer v3.
// - CfSignals: rule-based board, plain-language labels, glossary in details,
//   full Arabic parity, Eastern Arabic numerals in AR mode.
// - CfSectionRead: per-topic deterministic one-paragraph analytics
//   (global / jordan / banking / regional). No generative text anywhere.
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

var MONTHS: any = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 }
function pKey(p: any) {
  var s = String(p || '')
  var m = s.match(/^([A-Za-z]{3})-(\d{4})$/)
  if (m && MONTHS[m[1]] != null) return Number(m[2]) * 12 + MONTHS[m[1]]
  var q = s.match(/^Q([1-4])-(\d{4})$/)
  if (q) return Number(q[2]) * 12 + (Number(q[1]) - 1) * 3
  var y = s.match(/(\d{4})/)
  return y ? Number(y[1]) * 12 : -1
}
function series(rows: any[], cat: string, ind: string) {
  var list = rows.filter(function (r: any) { return r.category === cat && r.indicator === ind })
  list.sort(function (a: any, b: any) { return pKey(a.period) - pKey(b.period) })
  return list
}
function lastV(list: any[]) { if (!list.length) return null; var v = Number(list[list.length - 1].value); return isFinite(v) ? v : null }
function atKey(list: any[], k: number) { for (var i = list.length - 1; i >= 0; i--) { if (pKey(list[i].period) === k) { var v = Number(list[i].value); return isFinite(v) ? v : null } } return null }
function yoyOf(list: any[]) {
  if (!list.length) return null
  var a = lastV(list)
  var b = atKey(list, pKey(list[list.length - 1].period) - 12)
  return (a != null && b != null && b !== 0) ? (a / b - 1) * 100 : null
}
function tail(list: any[], n: number) { return list.slice(-n).map(function (r: any) { return { p: r.period, v: Number(r.value) } }) }
function sumCat(rows: any[], cat: string) {
  var s = 0, n = 0, m: any = {}
  rows.forEach(function (r: any) { if (r.category === cat) { var v = Number(r.value); if (isFinite(v)) { s += v; n++; m[r.indicator] = v } } })
  return { s: s, n: n, m: m }
}
export function nf(x: any, ar: boolean, dec: number) {
  var n = Number(x)
  if (!isFinite(n)) return '\u2014'
  try { return new Intl.NumberFormat(ar ? 'ar-EG' : 'en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec }).format(n) } catch (e) { return n.toFixed(dec) }
}
function fetchCats(cats: string[], setRows: any) {
  var ok = { v: true }
  ;(async function () {
    try {
      var r: any = await supabase.from('macro_indicators').select('category,indicator,period,value,unit').in('category', cats)
      if (ok.v && !r.error && r.data) setRows(r.data)
    } catch (e) { }
  })()
  return function () { ok.v = false }
}
export function CfSectionRead(props: any) {
  var topic = props.topic
  var ar = props.lang === 'ar'
  var st = useState<any>(null)
  var rows = st[0], setRows = st[1]
  var CATS: any = { global: ['global_growth', 'global_inflation', 'global_oil'], jordan: ['jo_gdp', 'jo_inflation', 'jo_social'], banking: ['banking_sector_monthly', 'banking_sector_quarterly', 'banking_rates_monthly'], regional: ['deposits_geo_governorate', 'credit_geo_governorate'] }
  useEffect(function () { return fetchCats(CATS[topic] || [], setRows) }, [topic])
  if (!rows) return null
  var s: string[] = []
  var N = function (x: any, d: number) { return nf(x, ar, d) }
  if (topic === 'global') {
    var w = lastV(series(rows, 'global_growth', 'World real GDP growth'))
    var em = lastV(series(rows, 'global_growth', 'Emerging and developing growth'))
    var wi = lastV(series(rows, 'global_inflation', 'World inflation'))
    var oil = lastV(series(rows, 'global_oil', 'Average oil price'))
    if (w != null) s.push(ar ? '\u0627\u0644\u0646\u0645\u0648 \u0627\u0644\u0639\u0627\u0644\u0645\u064a \u0639\u0646\u062f ' + N(w, 1) + '%' + (em != null ? ' \u0648\u0627\u0644\u0623\u0633\u0648\u0627\u0642 \u0627\u0644\u0646\u0627\u0634\u0626\u0629 ' + N(em, 1) + '%' : '') + ' \u2014 \u0637\u0644\u0628 \u062e\u0627\u0631\u062c\u064a ' + (w >= 3 ? '\u062f\u0627\u0639\u0645' : '\u0645\u0639\u062a\u062f\u0644') + '.' : 'Global growth is running at ' + N(w, 1) + '%' + (em != null ? ' with emerging markets at ' + N(em, 1) + '%' : '') + ' \u2014 external demand is ' + (w >= 3 ? 'supportive' : 'moderate') + '.')
    if (wi != null) s.push(ar ? '\u0627\u0644\u062a\u0636\u062e\u0645 \u0627\u0644\u0639\u0627\u0644\u0645\u064a ' + N(wi, 1) + '% \u2014 \u0636\u063a\u0637 \u0627\u0644\u0623\u0633\u0639\u0627\u0631 \u0627\u0644\u0645\u0633\u062a\u0648\u0631\u062f\u0629 ' + (wi <= 4 ? '\u064a\u062a\u0631\u0627\u062c\u0639' : '\u0645\u0633\u062a\u0645\u0631') + '.' : 'World inflation at ' + N(wi, 1) + '% means imported-price pressure is ' + (wi <= 4 ? 'easing' : 'persistent') + '.')
    if (oil != null) s.push(ar ? '\u0627\u0644\u0646\u0641\u0637 \u0639\u0646\u062f ' + N(oil, 0) + ' \u062f\u0648\u0644\u0627\u0631 \u064a\u0628\u0642\u064a \u0641\u0627\u062a\u0648\u0631\u0629 \u0627\u0644\u0637\u0627\u0642\u0629 ' + (oil <= 85 ? '\u062a\u062d\u062a \u0627\u0644\u0633\u064a\u0637\u0631\u0629' : '\u0645\u0631\u062a\u0641\u0639\u0629') + '.' : 'Oil averaging $' + N(oil, 0) + ' keeps Jordan\u2019s energy bill ' + (oil <= 85 ? 'contained' : 'elevated') + '.')
  }
  if (topic === 'jordan') {
    var jgr = lastV(series(rows, 'jo_gdp', 'Real GDP growth'))
    var jf = lastV(series(rows, 'jo_gdp', 'Real GDP growth forecast'))
    var cpi = lastV(series(rows, 'jo_inflation', 'CPI inflation monthly YoY'))
    if (cpi == null) cpi = lastV(series(rows, 'jo_inflation', 'CPI inflation'))
    var un = lastV(series(rows, 'jo_social', 'Unemployment rate'))
    if (jgr != null) s.push(ar ? '\u0627\u0644\u0627\u0642\u062a\u0635\u0627\u062f \u0627\u0644\u0623\u0631\u062f\u0646\u064a \u064a\u0646\u0645\u0648 \u0646\u062d\u0648 ' + N(jgr, 1) + '%' + (jf != null ? ' (\u0627\u0644\u0645\u062a\u0648\u0642\u0639 ' + N(jf, 1) + '%)' : '') + '.' : 'Jordan\u2019s economy is growing about ' + N(jgr, 1) + '%' + (jf != null ? ' (forecast ' + N(jf, 1) + '%)' : '') + '.')
    if (cpi != null) s.push(ar ? '\u0627\u0644\u062a\u0636\u062e\u0645 \u0639\u0646\u062f ' + N(cpi, 1) + '% \u2014 \u0627\u0644\u0639\u0627\u0626\u062f \u0627\u0644\u062d\u0642\u064a\u0642\u064a \u0639\u0644\u0649 \u0627\u0644\u0648\u062f\u0627\u0626\u0639 ' + (cpi <= 3 ? '\u0645\u0648\u062c\u0628' : '\u062a\u062d\u062a \u0627\u0644\u0636\u063a\u0637') + '.' : 'Inflation at ' + N(cpi, 1) + '% leaves real deposit returns ' + (cpi <= 3 ? 'positive' : 'under pressure') + '.')
    if (un != null) s.push(ar ? '\u0627\u0644\u0628\u0637\u0627\u0644\u0629 ' + N(un, 1) + '% \u062a\u0628\u0642\u064a \u0646\u0645\u0648 \u0627\u0644\u0627\u0626\u062a\u0645\u0627\u0646 \u0627\u0644\u0627\u0633\u062a\u0647\u0644\u0627\u0643\u064a \u062a\u062f\u0631\u064a\u062c\u064a\u0627\u064b.' : 'Unemployment at ' + N(un, 1) + '% keeps consumer-credit demand gradual.')
  }
  if (topic === 'banking') {
    var dep = yoyOf(series(rows, 'banking_sector_monthly', 'Total customer deposits (monthly)'))
    var cr = yoyOf(series(rows, 'banking_sector_quarterly', 'ODC credit facilities (quarterly)'))
    var lv2 = lastV(series(rows, 'banking_rates_monthly', 'Weighted avg lending rate (monthly)'))
    var dv2 = lastV(series(rows, 'banking_rates_monthly', 'Weighted avg time deposit rate (monthly)'))
    if (dep != null && cr != null) s.push(ar ? '\u0627\u0644\u062a\u0645\u0648\u064a\u0644 (+' + N(dep, 1) + '%) \u064a\u0646\u0645\u0648 \u0623\u0633\u0631\u0639 \u0645\u0646 \u0627\u0644\u0625\u0642\u0631\u0627\u0636 (+' + N(cr, 1) + '%) \u2014 \u0627\u0644\u0633\u064a\u0648\u0644\u0629 \u062a\u062a\u0631\u0627\u0643\u0645 \u0641\u064a \u0627\u0644\u0646\u0638\u0627\u0645.' : 'Funding (+' + N(dep, 1) + '%) is growing faster than lending (+' + N(cr, 1) + '%) \u2014 liquidity is accumulating in the system.')
    if (lv2 != null && dv2 != null) s.push(ar ? '\u0627\u0644\u0641\u0627\u0631\u0642 \u0628\u064a\u0646 \u0633\u0639\u0631 \u0627\u0644\u0625\u0642\u0631\u0627\u0636 (' + N(lv2, 2) + '%) \u0648\u0627\u0644\u0648\u062f\u0627\u0626\u0639 (' + N(dv2, 2) + '%) \u064a\u062d\u062f\u062f \u0631\u0628\u062d\u064a\u0629 \u0627\u0644\u0642\u0637\u0627\u0639.' : 'The gap between lending (' + N(lv2, 2) + '%) and deposit (' + N(dv2, 2) + '%) rates is what drives sector profitability.')
  }
  if (topic === 'regional') {
    var gd = sumCat(rows, 'deposits_geo_governorate')
    var cd = sumCat(rows, 'credit_geo_governorate')
    if (gd.n === 12 && cd.n === 12 && gd.s && cd.s) {
      var shD = gd.m['Amman'] / gd.s * 100, shC = cd.m['Amman'] / cd.s * 100
      var bestK = '', bestL = 0
      Object.keys(gd.m).forEach(function (k) { if (k !== 'Amman' && gd.m[k] > 20 && cd.m[k] != null) { var l = cd.m[k] / gd.m[k] * 100; if (l > bestL) { bestL = l; bestK = k } } })
      s.push(ar ? '\u0639\u0645\u0651\u0627\u0646 \u062a\u0633\u062a\u062d\u0648\u0630 \u0639\u0644\u0649 ' + N(shD, 0) + '% \u0645\u0646 \u0627\u0644\u0648\u062f\u0627\u0626\u0639 \u0645\u0642\u0627\u0628\u0644 ' + N(shC, 0) + '% \u0645\u0646 \u0627\u0644\u0627\u0626\u062a\u0645\u0627\u0646.' : 'Amman books ' + N(shD, 0) + '% of deposits versus ' + N(shC, 0) + '% of credit.')
      if (bestK && bestL > 100) s.push(ar ? '\u0628\u0639\u0636 \u0627\u0644\u0645\u062d\u0627\u0641\u0638\u0627\u062a \u062a\u0642\u062a\u0631\u0636 \u0623\u0643\u062b\u0631 \u0645\u0646 \u0648\u062f\u0627\u0626\u0639\u0647\u0627 \u0627\u0644\u0645\u062d\u0644\u064a\u0629 (' + bestK + ' ' + N(bestL, 0) + '%) \u2014 \u0627\u0644\u0639\u0627\u0635\u0645\u0629 \u062a\u0645\u0648\u0651\u0644 \u0627\u0644\u0645\u062d\u0627\u0641\u0638\u0627\u062a.' : 'Several governorates lend above their local deposits (' + bestK + ' at ' + N(bestL, 0) + '%) \u2014 the capital funds the provinces.')
    }
  }
  if (!s.length) return null
  return <div style={{ fontSize: 11.5, lineHeight: 1.65, color: 'var(--cf-ink2, #3d4f66)', padding: '6px 2px 2px 2px' }}><span style={{ fontWeight: 900, color: 'var(--cf-gold, #b8912a)', marginInlineEnd: 6 }}>{ar ? '\u0627\u0644\u062e\u0644\u0627\u0635\u0629:' : 'Read:'}</span>{s.join(' ')}</div>
}
export function CfSignals(props: any) {
  var lang = props.lang
  var ar = lang === 'ar'
  var st = useState<any>(null)
  var rows = st[0], setRows = st[1]
  var op = useState<any>(null)
  var openIdx = op[0], setOpenIdx = op[1]
  useEffect(function () { return fetchCats(['banking_sector_monthly', 'banking_sector_quarterly', 'banking_rates_monthly', 'deposits_geo_governorate', 'credit_geo_governorate', 'global_growth'], setRows) }, [])
  if (!rows) return <div style={{ fontSize: 11, color: 'var(--cf-ink3, #7d8ea3)' }}>{ar ? '\u062c\u0627\u0631\u064d \u0627\u062d\u062a\u0633\u0627\u0628 \u0627\u0644\u0625\u0634\u0627\u0631\u0627\u062a\u2026' : 'Computing signals\u2026'}</div>
  var N = function (x: any, d: number) { return nf(x, ar, d) }
  var sig: any[] = []
  var add = function (sec: number, l: string, la: string, val: string, d: number, ven: string, va2: string, src: string, det: any) { sig.push({ sec: sec, l: ar ? la : l, v: val, d: d, t: ar ? va2 : ven, s: src, det: det }) }
  var band = function (v: any, edges: string) { return (ar ? '\u0627\u0644\u0642\u064a\u0645\u0629 ' : 'Value ') + v + (ar ? ' \u0645\u0642\u0627\u0628\u0644 \u0627\u0644\u0646\u0637\u0627\u0642\u0627\u062a: ' : ' vs bands: ') + edges }
  var depSer = series(rows, 'banking_sector_monthly', 'Total customer deposits (monthly)')
  var dep = yoyOf(depSer)
  if (dep != null) add(0, 'Deposit growth', '\u0646\u0645\u0648 \u0627\u0644\u0648\u062f\u0627\u0626\u0639', N(dep, 1) + '% ' + (ar ? '\u0633\u0646\u0648\u064a\u0627\u064b' : 'yearly'), dep > 0.5 ? 1 : dep < -0.5 ? -1 : 0, dep >= 5 ? 'Customer funding is expanding briskly \u2014 supports liquidity' : dep >= 0 ? 'Customer funding growing moderately' : 'Customer funding base is contracting', dep >= 5 ? '\u0623\u0645\u0648\u0627\u0644 \u0627\u0644\u0639\u0645\u0644\u0627\u0621 \u062a\u062a\u0648\u0633\u0639 \u0628\u0642\u0648\u0629 \u2014 \u062f\u0627\u0639\u0645 \u0644\u0644\u0633\u064a\u0648\u0644\u0629' : dep >= 0 ? '\u0646\u0645\u0648 \u0645\u0639\u062a\u062f\u0644 \u0641\u064a \u0623\u0645\u0648\u0627\u0644 \u0627\u0644\u0639\u0645\u0644\u0627\u0621' : '\u0642\u0627\u0639\u062f\u0629 \u0627\u0644\u062a\u0645\u0648\u064a\u0644 \u062a\u0646\u0643\u0645\u0634', 'CBJ', { rule: band(N(dep, 1) + '%', '\u22655 brisk / 0\u20135 moderate / <0 contracting'), tail: tail(depSer, 4), unit: ar ? '\u0645\u0644\u064a\u0648\u0646 \u062f\u064a\u0646\u0627\u0631' : 'JOD millions', gloss: ar ? 'CBJ = \u0627\u0644\u0628\u0646\u0643 \u0627\u0644\u0645\u0631\u0643\u0632\u064a \u0627\u0644\u0623\u0631\u062f\u0646\u064a' : 'CBJ = Central Bank of Jordan' })
  var crSer = series(rows, 'banking_sector_quarterly', 'ODC credit facilities (quarterly)')
  var cr = yoyOf(crSer)
  if (cr != null) add(0, 'Credit growth', '\u0646\u0645\u0648 \u0627\u0644\u0627\u0626\u062a\u0645\u0627\u0646', N(cr, 1) + '% ' + (ar ? '\u0633\u0646\u0648\u064a\u0627\u064b' : 'yearly'), cr > 0.5 ? 1 : cr < -0.5 ? -1 : 0, cr >= 6 ? 'Lending is accelerating \u2014 private demand is firm' : cr >= 2 ? 'Healthy lending expansion' : cr >= 0 ? 'Lending growth is soft' : 'Lending is contracting', cr >= 6 ? '\u0627\u0644\u0625\u0642\u0631\u0627\u0636 \u064a\u062a\u0633\u0627\u0631\u0639 \u2014 \u0627\u0644\u0637\u0644\u0628 \u0627\u0644\u062e\u0627\u0635 \u0642\u0648\u064a' : cr >= 2 ? '\u062a\u0648\u0633\u0639 \u0625\u0642\u0631\u0627\u0636\u064a \u0635\u062d\u064a' : cr >= 0 ? '\u0646\u0645\u0648 \u0625\u0642\u0631\u0627\u0636\u064a \u0636\u0639\u064a\u0641' : '\u0627\u0644\u0625\u0642\u0631\u0627\u0636 \u064a\u0646\u0643\u0645\u0634', 'CBJ', { rule: band(N(cr, 1) + '%', '\u22656 accelerating / 2\u20136 healthy / 0\u20132 soft / <0 contracting'), tail: tail(crSer, 4), unit: ar ? '\u0645\u0644\u064a\u0648\u0646 \u062f\u064a\u0646\u0627\u0631' : 'JOD millions', gloss: ar ? '\u0627\u0644\u062a\u0633\u0647\u064a\u0644\u0627\u062a = \u0627\u0644\u0642\u0631\u0648\u0636 \u0648\u0627\u0644\u062a\u0645\u0648\u064a\u0644 \u0627\u0644\u0645\u0645\u0646\u0648\u062d' : 'Credit facilities = loans and financing extended by banks' })
  var asSer = series(rows, 'banking_sector_monthly', 'ODC total assets (monthly)')
  var asg = yoyOf(asSer)
  if (asg != null) add(0, 'Sector total assets', '\u0625\u062c\u0645\u0627\u0644\u064a \u0645\u0648\u062c\u0648\u062f\u0627\u062a \u0627\u0644\u0642\u0637\u0627\u0639', N(asg, 1) + '% ' + (ar ? '\u0633\u0646\u0648\u064a\u0627\u064b' : 'yearly'), asg > 0.5 ? 1 : asg < -0.5 ? -1 : 0, asg >= 4 ? 'Bank balance sheets are scaling steadily' : asg >= 0 ? 'The sector is expanding modestly' : 'Sector balance sheet is shrinking', asg >= 4 ? '\u0645\u064a\u0632\u0627\u0646\u064a\u0627\u062a \u0627\u0644\u0628\u0646\u0648\u0643 \u062a\u0646\u0645\u0648 \u0628\u062b\u0628\u0627\u062a' : asg >= 0 ? '\u062a\u0648\u0633\u0639 \u0645\u062a\u0648\u0627\u0636\u0639 \u0644\u0644\u0642\u0637\u0627\u0639' : '\u062a\u0631\u0627\u062c\u0639 \u0641\u064a \u0627\u0644\u0645\u0648\u062c\u0648\u062f\u0627\u062a', 'CBJ', { rule: band(N(asg, 1) + '%', '\u22654 steady / 0\u20134 modest / <0 shrinking'), tail: tail(asSer, 4), unit: ar ? '\u0645\u0644\u064a\u0648\u0646 \u062f\u064a\u0646\u0627\u0631' : 'JOD millions', gloss: ar ? '\u0627\u0644\u0645\u0648\u062c\u0648\u062f\u0627\u062a = \u0645\u062c\u0645\u0648\u0639 \u0623\u0635\u0648\u0644 \u0627\u0644\u0628\u0646\u0648\u0643 \u0627\u0644\u0645\u0631\u062e\u0635\u0629' : 'Total assets of all licensed deposit-taking banks' })
  var lendS = series(rows, 'banking_rates_monthly', 'Weighted avg lending rate (monthly)')
  var depS = series(rows, 'banking_rates_monthly', 'Weighted avg time deposit rate (monthly)')
  var lv = lastV(lendS), dv = lastV(depS)
  var sp = (lv != null && dv != null) ? lv - dv : null
  var lvT = lendS.length ? atKey(lendS, pKey(lendS[lendS.length - 1].period) - 12) : null
  var dvT = depS.length ? atKey(depS, pKey(depS[depS.length - 1].period) - 12) : null
  var spT = (lvT != null && dvT != null) ? lvT - dvT : null
  var spDir = spT != null && sp != null ? (sp - spT > 0.05 ? 1 : sp - spT < -0.05 ? -1 : 0) : 0
  if (sp != null) add(0, 'Interest margin (lending vs deposits)', '\u0647\u0627\u0645\u0634 \u0627\u0644\u0641\u0627\u0626\u062f\u0629 (\u0625\u0642\u0631\u0627\u0636 \u0645\u0642\u0627\u0628\u0644 \u0648\u062f\u0627\u0626\u0639)', N(sp, 2) + ' ' + (ar ? '\u0646\u0642\u0637\u0629' : 'points'), spDir, spDir > 0 ? 'The margin is widening \u2014 supports bank profitability' : spDir < 0 ? 'The margin is compressing \u2014 pressure on bank profitability' : 'The margin is broadly stable', spDir > 0 ? '\u0627\u0644\u0647\u0627\u0645\u0634 \u064a\u062a\u0633\u0639 \u2014 \u062f\u0627\u0639\u0645 \u0644\u0631\u0628\u062d\u064a\u0629 \u0627\u0644\u0628\u0646\u0648\u0643' : spDir < 0 ? '\u0627\u0644\u0647\u0627\u0645\u0634 \u064a\u0646\u0636\u063a\u0637 \u2014 \u0636\u063a\u0637 \u0639\u0644\u0649 \u0627\u0644\u0631\u0628\u062d\u064a\u0629' : '\u0627\u0644\u0647\u0627\u0645\u0634 \u0645\u0633\u062a\u0642\u0631', 'CBJ', { rule: band(N(sp, 2) + (ar ? ' \u0646\u0642\u0637\u0629 (\u0642\u0628\u0644 \u0639\u0627\u0645: ' : ' pts (a year ago: ') + (spT != null ? N(spT, 2) : '\u2014') + ')', '\u00b10.05 = stable'), tail: [{ p: ar ? '\u0627\u0644\u0625\u0642\u0631\u0627\u0636' : 'Lending rate', v: lv }, { p: ar ? '\u0627\u0644\u0648\u062f\u0627\u0626\u0639' : 'Deposit rate', v: dv }], unit: '%', gloss: ar ? '\u0627\u0644\u0641\u0631\u0642 \u0628\u064a\u0646 \u0633\u0639\u0631 \u0627\u0644\u0625\u0642\u0631\u0627\u0636 \u0648\u0633\u0639\u0631 \u0627\u0644\u0648\u062f\u064a\u0639\u0629' : 'Difference between what banks charge on loans and pay on deposits' })
  var gd = sumCat(rows, 'deposits_geo_governorate')
  var cd = sumCat(rows, 'credit_geo_governorate')
  var share = (gd.n === 12 && gd.m['Amman'] != null && gd.s) ? gd.m['Amman'] / gd.s * 100 : null
  if (share != null) add(0, 'Deposits held in Amman', '\u0627\u0644\u0648\u062f\u0627\u0626\u0639 \u0627\u0644\u0645\u062d\u062c\u0648\u0632\u0629 \u0641\u064a \u0639\u0645\u0651\u0627\u0646', N(share, 0) + '%', 0, share >= 80 ? 'Deposits are heavily concentrated in the Capital \u2014 regional funding depth is thin' : 'Funding is regionally diversified', share >= 80 ? '\u062a\u0631\u0643\u0632 \u0645\u0631\u062a\u0641\u0639 \u0644\u0644\u0648\u062f\u0627\u0626\u0639 \u0641\u064a \u0627\u0644\u0639\u0627\u0635\u0645\u0629 \u2014 \u0627\u0644\u0639\u0645\u0642 \u0627\u0644\u0625\u0642\u0644\u064a\u0645\u064a \u0645\u062d\u062f\u0648\u062f' : '\u062a\u0648\u0632\u0639 \u0625\u0642\u0644\u064a\u0645\u064a \u0645\u062a\u0648\u0627\u0632\u0646', 'CBJ \u00b7 Q1 2026', { rule: band(N(share, 0) + '%', '\u226580 concentrated / <80 diversified'), tail: [{ p: ar ? '\u0639\u0645\u0651\u0627\u0646' : 'Amman', v: gd.m['Amman'] }, { p: ar ? '\u0627\u0644\u0645\u062c\u0645\u0648\u0639' : 'Total', v: gd.s }], unit: ar ? '\u0645\u0644\u064a\u0648\u0646 \u062f\u064a\u0646\u0627\u0631' : 'JOD millions', gloss: ar ? '\u062d\u0635\u0629 \u0645\u062d\u0627\u0641\u0638\u0629 \u0627\u0644\u0639\u0627\u0635\u0645\u0629 \u0645\u0646 \u0625\u062c\u0645\u0627\u0644\u064a \u0648\u062f\u0627\u0626\u0639 \u0627\u0644\u0645\u0645\u0644\u0643\u0629' : 'The Capital governorate\u2019s share of Kingdom-wide customer deposits' })
  var ldr = (gd.s && cd.s) ? cd.s / gd.s * 100 : null
  if (ldr != null) add(0, 'Loans as a share of deposits', '\u0627\u0644\u0642\u0631\u0648\u0636 \u0643\u0646\u0633\u0628\u0629 \u0645\u0646 \u0627\u0644\u0648\u062f\u0627\u0626\u0639', N(ldr, 0) + '%', 0, ldr >= 90 ? 'The loan book is stretched against deposits' : 'Loans are fully deposit-funded \u2014 ample room to lend more', ldr >= 90 ? '\u0627\u0644\u0645\u062d\u0641\u0638\u0629 \u0627\u0644\u0627\u0626\u062a\u0645\u0627\u0646\u064a\u0629 \u0645\u062a\u0645\u062f\u062f\u0629 \u0645\u0642\u0627\u0628\u0644 \u0627\u0644\u0648\u062f\u0627\u0626\u0639' : '\u0627\u0644\u0642\u0631\u0648\u0636 \u0645\u0645\u0648\u0644\u0629 \u0628\u0627\u0644\u0643\u0627\u0645\u0644 \u0645\u0646 \u0627\u0644\u0648\u062f\u0627\u0626\u0639 \u2014 \u0645\u0633\u0627\u062d\u0629 \u0648\u0627\u0633\u0639\u0629 \u0644\u0632\u064a\u0627\u062f\u0629 \u0627\u0644\u0625\u0642\u0631\u0627\u0636', 'CBJ \u00b7 Q1 2026', { rule: band(N(ldr, 0) + '%', '\u226590 stretched / <90 headroom'), tail: [{ p: ar ? '\u0627\u0644\u0627\u0626\u062a\u0645\u0627\u0646' : 'Credit', v: cd.s }, { p: ar ? '\u0627\u0644\u0648\u062f\u0627\u0626\u0639' : 'Deposits', v: gd.s }], unit: ar ? '\u0645\u0644\u064a\u0648\u0646 \u062f\u064a\u0646\u0627\u0631' : 'JOD millions', gloss: ar ? '\u064a\u0633\u0645\u0649 \u0623\u064a\u0636\u0627\u064b \u0646\u0633\u0628\u0629 \u0627\u0644\u0625\u0642\u0631\u0627\u0636 \u0625\u0644\u0649 \u0627\u0644\u0648\u062f\u0627\u0626\u0639 (LDR)' : 'Also known as the loan-to-deposit ratio (LDR)' })
  var wS = series(rows, 'global_growth', 'World real GDP growth')
  var wv = lastV(wS)
  if (wv != null) add(1, 'Global growth', '\u0627\u0644\u0646\u0645\u0648 \u0627\u0644\u0639\u0627\u0644\u0645\u064a', N(wv, 1) + '% \u00b7 ' + String(wS[wS.length - 1].period), wv >= 3 ? 1 : wv >= 2.5 ? 0 : -1, wv >= 3.2 ? 'Global conditions support external demand' : wv >= 2.5 ? 'Global growth is steady but unspectacular' : 'Global headwinds are building', wv >= 3.2 ? '\u0627\u0644\u0623\u062c\u0648\u0627\u0621 \u0627\u0644\u0639\u0627\u0644\u0645\u064a\u0629 \u062a\u062f\u0639\u0645 \u0627\u0644\u0637\u0644\u0628 \u0627\u0644\u062e\u0627\u0631\u062c\u064a' : wv >= 2.5 ? '\u0646\u0645\u0648 \u0639\u0627\u0644\u0645\u064a \u062b\u0627\u0628\u062a \u0644\u0643\u0646 \u063a\u064a\u0631 \u0627\u0633\u062a\u062b\u0646\u0627\u0626\u064a' : '\u0631\u064a\u0627\u062d \u0639\u0627\u0644\u0645\u064a\u0629 \u0645\u0639\u0627\u0643\u0633\u0629 \u062a\u062a\u0632\u0627\u064a\u062f', 'IMF', { rule: band(N(wv, 1) + '%', '\u22653.2 supportive / 2.5\u20133.2 steady / <2.5 headwinds'), tail: tail(wS, 3), unit: '%', gloss: ar ? 'IMF = \u0635\u0646\u062f\u0648\u0642 \u0627\u0644\u0646\u0642\u062f \u0627\u0644\u062f\u0648\u0644\u064a \u2014 \u062a\u0648\u0642\u0639\u0627\u062a \u0622\u0641\u0627\u0642 \u0627\u0644\u0627\u0642\u062a\u0635\u0627\u062f \u0627\u0644\u0639\u0627\u0644\u0645\u064a' : 'IMF World Economic Outlook projections' })
  var eS = series(rows, 'global_growth', 'Emerging and developing growth')
  var ev = lastV(eS)
  if (ev != null) add(1, 'Emerging markets growth', '\u0646\u0645\u0648 \u0627\u0644\u0623\u0633\u0648\u0627\u0642 \u0627\u0644\u0646\u0627\u0634\u0626\u0629', N(ev, 1) + '% \u00b7 ' + String(eS[eS.length - 1].period), ev >= 4 ? 1 : 0, ev >= 4 ? 'Emerging-market demand is firm \u2014 a tailwind for regional trade' : 'Emerging-market growth is moderate', ev >= 4 ? '\u0637\u0644\u0628 \u0642\u0648\u064a \u0641\u064a \u0627\u0644\u0623\u0633\u0648\u0627\u0642 \u0627\u0644\u0646\u0627\u0634\u0626\u0629 \u2014 \u062f\u0627\u0639\u0645 \u0644\u0644\u062a\u062c\u0627\u0631\u0629 \u0627\u0644\u0625\u0642\u0644\u064a\u0645\u064a\u0629' : '\u0646\u0645\u0648 \u0645\u0639\u062a\u062f\u0644 \u0641\u064a \u0627\u0644\u0623\u0633\u0648\u0627\u0642 \u0627\u0644\u0646\u0627\u0634\u0626\u0629', 'IMF', { rule: band(N(ev, 1) + '%', '\u22654 firm / <4 moderate'), tail: tail(eS, 3), unit: '%', gloss: ar ? '\u062a\u0634\u0645\u0644 \u0627\u0644\u0645\u0646\u0637\u0642\u0629 \u0627\u0644\u0639\u0631\u0628\u064a\u0629 \u0648\u0622\u0633\u064a\u0627 \u0627\u0644\u0646\u0627\u0645\u064a\u0629' : 'Includes the Arab region and developing Asia' })
  if (!sig.length) return null
  var reads: string[] = []
  if (dep != null && ldr != null && gd.s && cd.s) {
    var hr = (gd.s - cd.s) / 1000
    reads.push(ar ? '\u0627\u0644\u0646\u0638\u0627\u0645 \u063a\u0646\u064a \u0628\u0627\u0644\u062a\u0645\u0648\u064a\u0644: \u0627\u0644\u0648\u062f\u0627\u0626\u0639 \u062a\u0646\u0645\u0648 ' + N(dep, 1) + '% \u0633\u0646\u0648\u064a\u0627\u064b \u0645\u0642\u0627\u0628\u0644 \u062a\u0648\u0638\u064a\u0641 ' + N(ldr, 0) + '% \u0641\u0642\u0637\u060c \u0645\u0627 \u064a\u062a\u0631\u0643 \u0646\u062d\u0648 ' + N(hr, 1) + ' \u0645\u0644\u064a\u0627\u0631 \u062f\u064a\u0646\u0627\u0631 \u0642\u062f\u0631\u0629 \u0625\u0642\u0631\u0627\u0636 \u0642\u0627\u0628\u0644\u0629 \u0644\u0644\u062a\u0648\u0638\u064a\u0641.' : 'The system is funding-rich: deposits are growing ' + N(dep, 1) + '% yearly against only ' + N(ldr, 0) + '% utilization, leaving roughly ' + N(hr, 1) + 'B JOD of deployable lending capacity.')
  }
  if (sp != null) reads.push(ar ? (spDir > 0 ? '\u0627\u0644\u0642\u0648\u0629 \u0627\u0644\u062a\u0633\u0639\u064a\u0631\u064a\u0629 \u062a\u062a\u062d\u0633\u0646: \u0627\u062a\u0633\u0639 \u0627\u0644\u0647\u0627\u0645\u0634 \u0625\u0644\u0649 ' : spDir < 0 ? '\u0627\u0644\u0647\u0648\u0627\u0645\u0634 \u062a\u0646\u0636\u063a\u0637 \u0625\u0644\u0649 ' : '\u0627\u0644\u0647\u0648\u0627\u0645\u0634 \u0645\u0633\u062a\u0642\u0631\u0629 \u0639\u0646\u062f ') + N(sp, 2) + ' \u0646\u0642\u0637\u0629.' : 'Pricing power is ' + (spDir > 0 ? 'improving \u2014 the margin widened to ' : spDir < 0 ? 'eroding \u2014 the margin compressed to ' : 'holding \u2014 the margin is stable at ') + N(sp, 2) + ' points.')
  if (share != null && share >= 80) reads.push(ar ? '\u0647\u064a\u0643\u0644\u064a\u0627\u064b\u060c ' + N(share, 0) + '% \u0645\u0646 \u0627\u0644\u0648\u062f\u0627\u0626\u0639 \u0641\u064a \u0627\u0644\u0639\u0627\u0635\u0645\u0629 \u2014 \u0627\u0644\u062a\u0648\u0633\u0639 \u0627\u0644\u0625\u0642\u0644\u064a\u0645\u064a \u0647\u0648 \u0627\u0644\u0631\u0627\u0641\u0639\u0629 \u0627\u0644\u0623\u0642\u0644 \u0627\u0633\u062a\u063a\u0644\u0627\u0644\u0627\u064b.' : 'Structurally, ' + N(share, 0) + '% of deposits sit in Amman \u2014 regional franchises remain the sector\u2019s most under-exploited growth lever.')
  if (wv != null) reads.push(ar ? '\u0627\u0644\u062e\u0644\u0641\u064a\u0629 \u0627\u0644\u062e\u0627\u0631\u062c\u064a\u0629 ' + (wv >= 3.2 ? '\u062f\u0627\u0639\u0645\u0629' : wv >= 2.5 ? '\u0645\u062d\u0627\u064a\u062f\u0629' : '\u0645\u0639\u0627\u0643\u0633\u0629') + ' (\u0646\u0645\u0648 \u0639\u0627\u0644\u0645\u064a ' + N(wv, 1) + '%).' : 'The external backdrop is ' + (wv >= 3.2 ? 'supportive' : wv >= 2.5 ? 'neutral' : 'a headwind') + ' (world growth ' + N(wv, 1) + '%).')
  var secTitle = function (i: number) { return i === 0 ? (ar ? '\u0627\u0644\u0646\u0628\u0636 \u0627\u0644\u0645\u062d\u0644\u064a' : 'DOMESTIC PULSE') : (ar ? '\u0627\u0644\u062e\u0644\u0641\u064a\u0629 \u0627\u0644\u062e\u0627\u0631\u062c\u064a\u0629' : 'EXTERNAL BACKDROP') }
  var glyph = function (d: number) { return d > 0 ? '\u25b2' : d < 0 ? '\u25bc' : '\u25a0' }
  var gcol = function (d: number) { return d > 0 ? '#1a7f4f' : d < 0 ? '#b3382c' : '#7d8ea3' }
  var fmtV = function (x: any) { var n2 = Number(x); return isFinite(n2) ? (Math.abs(n2) >= 1000 ? nf(Math.round(n2), ar, 0) : nf(n2, ar, 2)) : '\u2014' }
  var cell = function (r: any, i: number) {
    var open = openIdx === r.l
    return (
      <div key={i} onClick={function () { setOpenIdx(open ? null : r.l) }} style={{ padding: '9px 10px', border: '1px solid var(--cf-line, #e5eaf2)', borderRadius: 10, background: open ? 'var(--cf-surface, #ffffff)' : 'var(--cf-surface2, #f7f9fc)', cursor: 'pointer' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <div style={{ color: gcol(r.d), fontSize: 13, lineHeight: '18px' }}>{glyph(r.d)}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--cf-ink2, #3d4f66)' }}>{r.l} <span style={{ fontWeight: 900, color: 'var(--cf-ink, #14243a)' }}>{r.v}</span></div>
            <div style={{ fontSize: 11, color: 'var(--cf-ink3, #7d8ea3)', marginTop: 2 }}>{r.t}</div>
          </div>
          <div style={{ fontSize: 9.5, fontWeight: 800, color: 'var(--cf-ink3, #7d8ea3)', border: '1px solid var(--cf-line, #e5eaf2)', borderRadius: 999, padding: '2px 8px', whiteSpace: 'nowrap' }} dir='ltr'>{r.s}</div>
        </div>
        {open && r.det ? <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px dashed var(--cf-line, #e5eaf2)', fontSize: 10.5, color: 'var(--cf-ink2, #3d4f66)' }}>
          <div>{r.det.rule}</div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 6 }}>{(r.det.tail || []).map(function (x: any, k: number) { return <span key={k} style={{ color: 'var(--cf-ink3, #7d8ea3)' }}>{x.p}: <b style={{ color: 'var(--cf-ink, #14243a)' }}>{fmtV(x.v)}</b></span> })}</div>
          <div style={{ marginTop: 5, color: 'var(--cf-ink3, #7d8ea3)' }}>{(r.det.unit ? (ar ? '\u0627\u0644\u0648\u062d\u062f\u0629: ' : 'Unit: ') + r.det.unit + ' \u00b7 ' : '') + (r.det.gloss || '')}</div>
        </div> : null}
      </div>
    )
  }
  return (
    <div>
      {reads.length ? <div style={{ background: 'var(--cf-surface2, #f7f9fc)', borderInlineStart: '3px solid var(--cf-gold, #c9a227)', borderRadius: 8, padding: '10px 12px', marginBottom: 12 }}>
        <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: 1.2, color: 'var(--cf-ink3, #7d8ea3)', marginBottom: 4 }}>{ar ? '\u0642\u0631\u0627\u0621\u0629 \u0627\u0633\u062a\u0631\u0627\u062a\u064a\u062c\u064a\u0629' : 'STRATEGIC READ'}</div>
        <div style={{ fontSize: 12.5, lineHeight: 1.7, color: 'var(--cf-ink, #14243a)' }}>{reads.join(' ')}</div>
      </div> : null}
      {[0, 1].map(function (sec: number) {
        var list = sig.filter(function (r: any) { return r.sec === sec })
        if (!list.length) return null
        return (
          <div key={sec} style={{ marginTop: sec ? 10 : 0 }}>
            <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: 1.2, color: 'var(--cf-ink3, #7d8ea3)', marginBottom: 6 }}>{secTitle(sec)}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: 8 }}>{list.map(cell)}</div>
          </div>
        )
      })}
      <div style={{ fontSize: 10, color: 'var(--cf-ink3, #7d8ea3)', marginTop: 8 }}>{ar ? '\u0625\u0634\u0627\u0631\u0627\u062a \u0648\u0642\u0631\u0627\u0621\u0627\u062a \u0645\u062d\u062a\u0633\u0628\u0629 \u0622\u0644\u064a\u0627\u064b \u0645\u0646 \u0645\u0635\u0627\u062f\u0631 \u0645\u0648\u062b\u0642\u0629 \u2014 \u0627\u0646\u0642\u0631 \u0623\u064a \u0628\u0637\u0627\u0642\u0629 \u0644\u0644\u0642\u0627\u0639\u062f\u0629 \u062e\u0644\u0641\u0647\u0627' : 'Signals and reads computed deterministically from sourced series \u2014 click any tile for the rule behind it.'}</div>
    </div>
  )
}
