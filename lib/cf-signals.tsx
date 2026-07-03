'use client'
// convo.finance - shared analytical signal board (deterministic, rule-based).
// Self-contained: fetches its own series from macro_indicators and computes
// verdicts with fixed thresholds. No generative content. Used on /sector;
// /economy's inline board can be migrated here in a later cleanup pass.
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
function sumCat(rows: any[], cat: string) {
  var s = 0, n = 0, amm = null as any
  rows.forEach(function (r: any) { if (r.category === cat) { var v = Number(r.value); if (isFinite(v)) { s += v; n++; if (r.indicator === 'Amman') amm = v } } })
  return { s: s, n: n, amm: amm }
}
export function CfSignals(props: any) {
  var lang = props.lang
  var ar = lang === 'ar'
  var st = useState<any>(null)
  var rows = st[0], setRows = st[1]
  useEffect(function () {
    var ok = true
    ;(async function () {
      try {
        var r: any = await supabase.from('macro_indicators').select('category,indicator,period,value,unit').in('category', ['banking_sector_monthly', 'banking_sector_quarterly', 'banking_rates_monthly', 'deposits_geo_governorate', 'credit_geo_governorate', 'global_growth'])
        if (ok && !r.error && r.data) setRows(r.data)
      } catch (e) { }
    })()
    return function () { ok = false }
  }, [])
  if (!rows) return <div style={{ fontSize: 11, color: 'var(--cf-ink3, #7d8ea3)' }}>{ar ? '\u062c\u0627\u0631\u064d \u0627\u062d\u062a\u0633\u0627\u0628 \u0627\u0644\u0625\u0634\u0627\u0631\u0627\u062a\u2026' : 'Computing signals\u2026'}</div>
  var sig: any[] = []
  var add = function (sec: number, l: string, la: string, val: string, d: number, ven: string, va2: string, src: string) { sig.push({ sec: sec, l: ar ? la : l, v: val, d: d, t: ar ? va2 : ven, s: src }) }
  var dep = yoyOf(series(rows, 'banking_sector_monthly', 'Total customer deposits (monthly)'))
  if (dep != null) add(0, 'Deposit growth', '\u0646\u0645\u0648 \u0627\u0644\u0648\u062f\u0627\u0626\u0639', dep.toFixed(1) + '% YoY', dep > 0.5 ? 1 : dep < -0.5 ? -1 : 0, dep >= 5 ? 'Funding base expanding briskly \u2014 liquidity supportive' : dep >= 0 ? 'Funding growth moderate' : 'Deposit base contracting', dep >= 5 ? '\u0642\u0627\u0639\u062f\u0629 \u0627\u0644\u062a\u0645\u0648\u064a\u0644 \u062a\u062a\u0648\u0633\u0639 \u0628\u0642\u0648\u0629' : dep >= 0 ? '\u0646\u0645\u0648 \u0645\u0639\u062a\u062f\u0644 \u0644\u0644\u0648\u062f\u0627\u0626\u0639' : '\u0627\u0646\u0643\u0645\u0627\u0634 \u0641\u064a \u0627\u0644\u0648\u062f\u0627\u0626\u0639', 'CBJ')
  var cr = yoyOf(series(rows, 'banking_sector_quarterly', 'ODC credit facilities (quarterly)'))
  if (cr != null) add(0, 'Credit growth', '\u0646\u0645\u0648 \u0627\u0644\u0627\u0626\u062a\u0645\u0627\u0646', cr.toFixed(1) + '% YoY', cr > 0.5 ? 1 : cr < -0.5 ? -1 : 0, cr >= 6 ? 'Credit engine accelerating \u2014 private demand firm' : cr >= 2 ? 'Healthy credit expansion' : cr >= 0 ? 'Credit growth soft' : 'Credit contracting', cr >= 6 ? '\u062a\u0633\u0627\u0631\u0639 \u0641\u064a \u0627\u0644\u0627\u0626\u062a\u0645\u0627\u0646' : cr >= 2 ? '\u062a\u0648\u0633\u0639 \u0627\u0626\u062a\u0645\u0627\u0646\u064a \u0635\u062d\u064a' : cr >= 0 ? '\u0646\u0645\u0648 \u0627\u0626\u062a\u0645\u0627\u0646\u064a \u0628\u0637\u064a\u0621' : '\u0627\u0646\u0643\u0645\u0627\u0634 \u0627\u0626\u062a\u0645\u0627\u0646\u064a', 'CBJ')
  var asg = yoyOf(series(rows, 'banking_sector_monthly', 'ODC total assets (monthly)'))
  if (asg != null) add(0, 'Sector assets', '\u0645\u0648\u062c\u0648\u062f\u0627\u062a \u0627\u0644\u0642\u0637\u0627\u0639', asg.toFixed(1) + '% YoY', asg > 0.5 ? 1 : asg < -0.5 ? -1 : 0, asg >= 4 ? 'Balance sheets scaling steadily' : asg >= 0 ? 'Sector expanding modestly' : 'Sector balance sheet shrinking', asg >= 4 ? '\u0646\u0645\u0648 \u062b\u0627\u0628\u062a \u0641\u064a \u0627\u0644\u0645\u064a\u0632\u0627\u0646\u064a\u0627\u062a' : asg >= 0 ? '\u062a\u0648\u0633\u0639 \u0645\u062a\u0648\u0627\u0636\u0639' : '\u062a\u0631\u0627\u062c\u0639 \u0641\u064a \u0627\u0644\u0645\u0648\u062c\u0648\u062f\u0627\u062a', 'CBJ')
  var lendS = series(rows, 'banking_rates_monthly', 'Weighted avg lending rate (monthly)')
  var depS = series(rows, 'banking_rates_monthly', 'Weighted avg time deposit rate (monthly)')
  var lv = lastV(lendS), dv = lastV(depS)
  var sp = (lv != null && dv != null) ? lv - dv : null
  var lvT = lendS.length ? atKey(lendS, pKey(lendS[lendS.length - 1].period) - 12) : null
  var dvT = depS.length ? atKey(depS, pKey(depS[depS.length - 1].period) - 12) : null
  var spT = (lvT != null && dvT != null) ? lvT - dvT : null
  if (sp != null) add(0, 'Lending\u2013deposit spread', '\u0647\u0627\u0645\u0634 \u0627\u0644\u0641\u0627\u0626\u062f\u0629', sp.toFixed(2) + ' pp', spT != null ? (sp - spT > 0.05 ? 1 : sp - spT < -0.05 ? -1 : 0) : 0, spT != null && sp - spT > 0.05 ? 'Margins widening \u2014 NIM tailwind' : spT != null && sp - spT < -0.05 ? 'Margins compressing \u2014 watch NIM' : 'Margins broadly stable', spT != null && sp - spT > 0.05 ? '\u0627\u062a\u0633\u0627\u0639 \u0627\u0644\u0647\u0648\u0627\u0645\u0634' : spT != null && sp - spT < -0.05 ? '\u0627\u0646\u0636\u063a\u0627\u0637 \u0627\u0644\u0647\u0648\u0627\u0645\u0634' : '\u0647\u0648\u0627\u0645\u0634 \u0645\u0633\u062a\u0642\u0631\u0629', 'CBJ')
  var g = sumCat(rows, 'deposits_geo_governorate')
  var c = sumCat(rows, 'credit_geo_governorate')
  if (g.n === 12 && g.amm != null && g.s) add(0, 'Capital concentration', '\u062a\u0631\u0643\u0632 \u0627\u0644\u0648\u062f\u0627\u0626\u0639', (g.amm / g.s * 100).toFixed(0) + '% Amman', 0, g.amm / g.s >= 0.8 ? 'Deposits heavily concentrated in the Capital \u2014 regional depth thin' : 'Regionally diversified funding', g.amm / g.s >= 0.8 ? '\u062a\u0631\u0643\u0632 \u0645\u0631\u062a\u0641\u0639 \u0641\u064a \u0627\u0644\u0639\u0627\u0635\u0645\u0629' : '\u062a\u0648\u0632\u0639 \u0645\u062a\u0648\u0627\u0632\u0646', 'CBJ \u00b7 Q1 2026')
  if (g.s && c.s) { var ldr = c.s / g.s * 100; add(0, 'System LDR (regional)', '\u0646\u0633\u0628\u0629 \u0627\u0644\u0625\u0642\u0631\u0627\u0636 \u0625\u0644\u0649 \u0627\u0644\u0648\u062f\u0627\u0626\u0639', ldr.toFixed(0) + '%', 0, ldr >= 90 ? 'Loan book stretched against deposits' : 'Loans fully deposit-funded \u2014 ample lending headroom', ldr >= 90 ? '\u062a\u0648\u0638\u064a\u0641 \u0645\u0631\u062a\u0641\u0639 \u0644\u0644\u0648\u062f\u0627\u0626\u0639' : '\u0633\u064a\u0648\u0644\u0629 \u0648\u0627\u0641\u0631\u0629', 'CBJ \u00b7 Q1 2026') }
  var wS = series(rows, 'global_growth', 'World real GDP growth')
  var wv = lastV(wS)
  if (wv != null) add(1, 'Global growth', '\u0627\u0644\u0646\u0645\u0648 \u0627\u0644\u0639\u0627\u0644\u0645\u064a', wv.toFixed(1) + '% \u00b7 ' + String(wS[wS.length - 1].period), wv >= 3 ? 1 : wv >= 2.5 ? 0 : -1, wv >= 3.2 ? 'Global backdrop supportive' : wv >= 2.5 ? 'Global growth steady but unspectacular' : 'Global headwinds building', wv >= 3.2 ? '\u0628\u064a\u0626\u0629 \u0639\u0627\u0644\u0645\u064a\u0629 \u062f\u0627\u0639\u0645\u0629' : wv >= 2.5 ? '\u0646\u0645\u0648 \u0639\u0627\u0644\u0645\u064a \u0645\u0639\u062a\u062f\u0644' : '\u0631\u064a\u0627\u062d \u0639\u0627\u0644\u0645\u064a\u0629 \u0645\u0639\u0627\u0643\u0633\u0629', 'IMF WEO')
  var eS = series(rows, 'global_growth', 'Emerging and developing growth')
  var ev = lastV(eS)
  if (ev != null) add(1, 'EM & developing', '\u0627\u0644\u0623\u0633\u0648\u0627\u0642 \u0627\u0644\u0646\u0627\u0634\u0626\u0629', ev.toFixed(1) + '% \u00b7 ' + String(eS[eS.length - 1].period), ev >= 4 ? 1 : 0, ev >= 4 ? 'EM demand firm \u2014 regional trade tailwind' : 'EM growth moderate', ev >= 4 ? '\u0637\u0644\u0628 \u0642\u0648\u064a \u0641\u064a \u0627\u0644\u0623\u0633\u0648\u0627\u0642 \u0627\u0644\u0646\u0627\u0634\u0626\u0629' : '\u0646\u0645\u0648 \u0645\u0639\u062a\u062f\u0644', 'IMF WEO')
  if (!sig.length) return null
  var secTitle = function (i: number) { return i === 0 ? (ar ? '\u0627\u0644\u0646\u0628\u0636 \u0627\u0644\u0645\u062d\u0644\u064a' : 'DOMESTIC PULSE') : (ar ? '\u0627\u0644\u062e\u0644\u0641\u064a\u0629 \u0627\u0644\u062e\u0627\u0631\u062c\u064a\u0629' : 'EXTERNAL BACKDROP') }
  var glyph = function (d: number) { return d > 0 ? '\u25b2' : d < 0 ? '\u25bc' : '\u25a0' }
  var gcol = function (d: number) { return d > 0 ? '#1a7f4f' : d < 0 ? '#b3382c' : '#7d8ea3' }
  var cell = function (r: any, i: number) {
    return (
      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '9px 10px', border: '1px solid var(--cf-line, #e5eaf2)', borderRadius: 10, background: 'var(--cf-surface2, #f7f9fc)' }}>
        <div style={{ color: gcol(r.d), fontSize: 13, lineHeight: '18px' }}>{glyph(r.d)}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--cf-ink2, #3d4f66)' }}>{r.l} <span style={{ fontWeight: 900, color: 'var(--cf-ink, #14243a)' }} dir='ltr'>{r.v}</span></div>
          <div style={{ fontSize: 11, color: 'var(--cf-ink3, #7d8ea3)', marginTop: 2 }}>{r.t}</div>
        </div>
        <div style={{ fontSize: 9.5, fontWeight: 800, color: 'var(--cf-ink3, #7d8ea3)', border: '1px solid var(--cf-line, #e5eaf2)', borderRadius: 999, padding: '2px 8px', whiteSpace: 'nowrap' }} dir='ltr'>{r.s}</div>
      </div>
    )
  }
  return (
    <div>
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
      <div style={{ fontSize: 10, color: 'var(--cf-ink3, #7d8ea3)', marginTop: 8 }}>{ar ? '\u0625\u0634\u0627\u0631\u0627\u062a \u0645\u062d\u062a\u0633\u0628\u0629 \u0622\u0644\u064a\u0627\u064b \u0645\u0646 \u0633\u0644\u0627\u0633\u0644 \u0627\u0644\u0628\u0646\u0643 \u0627\u0644\u0645\u0631\u0643\u0632\u064a \u0648\u0635\u0646\u062f\u0648\u0642 \u0627\u0644\u0646\u0642\u062f \u2014 \u0642\u0648\u0627\u0639\u062f \u062b\u0627\u0628\u062a\u0629\u060c \u0644\u064a\u0633\u062a \u062a\u0648\u0644\u064a\u062f\u064a\u0629' : 'Deterministic signals computed live from CBJ & IMF series \u2014 rule-based, not generative.'}</div>
    </div>
  )
}
