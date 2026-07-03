'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { useLang } from '@/lib/LangContext'
import { zadMdToHtml, ZAD_MD_CSS } from '@/lib/zad-md'

type Row = { category: string; indicator: string; indicator_ar: string | null; period: string; value: any; unit: string | null; source: string | null; note?: string | null }

const T: any = {
  en: { crumb: 'ECONOMY', title: 'Jordan Economy', sub: 'Live macro intelligence - auto-synced from DoS, CBJ, MoF and IMF sources', kpi_gdp: 'Real GDP growth', kpi_cpi: 'Inflation, monthly YoY', kpi_unemp: 'Unemployment', kpi_debt: 'Public debt / GDP', kpi_trade: 'Trade balance, H1', ratings: 'Sovereign ratings', global: 'Global backdrop', g_growth: 'Real GDP growth (%)', g_infl: 'Inflation (%)', world: 'World', adv: 'Advanced', emg: 'Emerging & developing', jordan: 'Jordan', j_growth: 'Real growth: national actuals + IMF path (%)', monthly_cpi: 'Monthly CPI inflation, YoY (%)', trade: 'Foreign trade, monthly (USD m)', exports: 'Exports', imports: 'Imports', balance: 'Trade balance, monthly (USD m)', debt: 'Public debt (% of GDP)', dom: 'Domestic (MoF)', ext: 'External (MoF)', imf_path: 'Gen. gov. total (IMF)', sector: 'Banking sector', s_bs: 'Assets / Deposits / Credit (JOD bn)', assets: 'Assets', deposits: 'Deposits', credit: 'Credit facilities', s_prof: 'Sector profitability (%)', s_rates: 'Rates & interest margin (%)', lend: 'Lending', dep: 'Time deposits', margin: 'Margin', epay: 'Digital payments 2024', m_assets: 'Sector assets, monthly (JOD bn, CBJ)', m_credit: 'Credit facilities, quarterly (JOD bn, CBJ)', m_rates: 'Interest rates, monthly (%, CBJ)', cbjLive: 'Live CBJ series - refreshed to the latest published month', forecast: 'Periods ending in F are IMF forecasts', src: 'Sources: Department of Statistics, Central Bank of Jordan, Ministry of Finance, IMF WEO / CPI / DOT (via DBnomics). The knowledge base re-syncs itself weekly inside the database.', ask: 'Ask ZAD', askPh: 'Ask about growth, inflation, trade, debt, or the banking sector...', send: 'Send', thinking: 'ZAD is analyzing...', err: 'Something went wrong. Try again.', lastSync: 'Last sync', dotNote: 'Monthly series: IMF DOT (USD, FOB) — methodology differs from DoS totals (JOD, incl. re-exports).', y2564: '2025: CPI full-year 1.98% (DoS); real GDP annual pending from DoS (IMF projected 2.6%); H1 trade and Jun-25 debt per DoS/MoF releases.' },
  ar: { crumb: 'الاقتصاد', title: 'الاقتصاد الأردني', sub: 'ذكاء اقتصادي حي - مزامنة تلقائية من الإحصاءات والمركزي والمالية وصندوق النقد', kpi_gdp: 'النمو الحقيقي', kpi_cpi: 'التضخم الشهري', kpi_unemp: 'البطالة', kpi_debt: 'الدين / الناتج', kpi_trade: 'الميزان التجاري H1', ratings: 'التصنيف السيادي', global: 'المشهد العالمي', g_growth: 'النمو الحقيقي (%)', g_infl: 'التضخم (%)', world: 'العالم', adv: 'المتقدمة', emg: 'الصاعدة والنامية', jordan: 'الأردن', j_growth: 'النمو الحقيقي: الفعلي ومسار الصندوق (%)', monthly_cpi: 'التضخم الشهري سنوي الأساس (%)', trade: 'التجارة الخارجية شهرياً (مليون دولار)', exports: 'الصادرات', imports: 'المستوردات', balance: 'الميزان التجاري الشهري (مليون دولار)', debt: 'الدين العام (% من الناتج)', dom: 'داخلي (المالية)', ext: 'خارجي (المالية)', imf_path: 'الإجمالي (الصندوق)', sector: 'القطاع المصرفي', s_bs: 'الموجودات / الودائع / التسهيلات (مليار دينار)', assets: 'الموجودات', deposits: 'الودائع', credit: 'التسهيلات', s_prof: 'ربحية القطاع (%)', s_rates: 'الفوائد والهامش (%)', lend: 'الإقراض', dep: 'ودائع لأجل', margin: 'الهامش', epay: 'المدفوعات الرقمية 2024', m_assets: 'موجودات القطاع شهرياً (مليار دينار، المركزي)', m_credit: 'التسهيلات ربعياً (مليار دينار، المركزي)', m_rates: 'أسعار الفائدة شهرياً (٪، المركزي)', cbjLive: 'سلاسل المركزي الحية - محدثة لآخر شهر منشور', forecast: 'الفترات المنتهية بـ F توقعات الصندوق', src: 'المصادر: دائرة الإحصاءات العامة، البنك المركزي، وزارة المالية، صندوق النقد الدولي. القاعدة المعرفية تزامن نفسها أسبوعياً داخل قاعدة البيانات.', ask: 'اسأل زاد', askPh: 'اسأل عن النمو أو التضخم أو التجارة أو الدين أو القطاع المصرفي...', send: 'إرسال', thinking: 'زاد يحلل...', err: 'حدث خطأ، حاول مجدداً.', lastSync: 'آخر مزامنة', dotNote: 'السلسلة الشهرية: صندوق النقد (دولار، فوب) — منهجية تختلف عن إجماليات الإحصاءات (دينار، تشمل إعادة التصدير).', y2564: 'أرقام 2025: التضخم السنوي 1.98٪ (الإحصاءات)، والتجارة والدين من إصدارات المالية والإحصاءات.' }
}

function monthTime(p: string): number { var d = new Date(p.replace('-', ' 1, ')); return isNaN(d.getTime()) ? 0 : d.getTime() }
function yearKey(p: string): number { var n = parseInt(p, 10); return isNaN(n) ? 0 : n + (p.indexOf('F') >= 0 ? 0.5 : 0) }

function PieChart(props: any) {
  var data = props.data || []
  var total = 0
  data.forEach(function (d: any) { total += Number(d.v) || 0 })
  if (!total) return null
  var W = 620, H = props.h || 190
  var cx = 118, cy = H / 2, r = 64, ir = 38
  var a0 = -Math.PI / 2
  var segs = data.map(function (d: any) {
    var frac = (Number(d.v) || 0) / total
    var a1 = a0 + frac * Math.PI * 2
    var large = a1 - a0 > Math.PI ? 1 : 0
    var x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0)
    var x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1)
    var xi1 = cx + ir * Math.cos(a1), yi1 = cy + ir * Math.sin(a1)
    var xi0 = cx + ir * Math.cos(a0), yi0 = cy + ir * Math.sin(a0)
    var dp = 'M ' + x0.toFixed(2) + ' ' + y0.toFixed(2) + ' A ' + r + ' ' + r + ' 0 ' + large + ' 1 ' + x1.toFixed(2) + ' ' + y1.toFixed(2) + ' L ' + xi1.toFixed(2) + ' ' + yi1.toFixed(2) + ' A ' + ir + ' ' + ir + ' 0 ' + large + ' 0 ' + xi0.toFixed(2) + ' ' + yi0.toFixed(2) + ' Z'
    a0 = a1
    return { d: dp, c: d.c, name: d.name, pct: frac * 100, v: Number(d.v) }
  })
  return (
    <svg viewBox={'0 0 ' + W + ' ' + H} style={{ width: '100%', height: 'auto', display: 'block' }}>
      {segs.map(function (s: any, i: number) { return <path key={i} d={s.d} fill={s.c} stroke='var(--cf-bg, #fff)' strokeWidth='1.5' /> })}
      <text x={cx} y={cy - 3} textAnchor='middle' style={{ fontSize: 15, fontWeight: 700, fill: 'var(--cf-ink)' }}>{props.center}</text>
      <text x={cx} y={cy + 13} textAnchor='middle' style={{ fontSize: 9, fill: 'var(--cf-ink3)' }}>{props.centerSub}</text>
      {segs.map(function (s: any, i: number) {
        var ly = 34 + i * 34
        return (
          <g key={'l' + i}>
            <rect x={236} y={ly - 9} width={11} height={11} rx={2} fill={s.c} />
            <text x={254} y={ly} style={{ fontSize: 11, fill: 'var(--cf-ink2, #243b53)' }}>{s.name}</text>
            <text x={W - 12} y={ly} textAnchor='end' style={{ fontSize: 11, fontWeight: 600, fill: 'var(--cf-ink)' }}>{s.v.toLocaleString(undefined, { maximumFractionDigits: 0 }) + ' · ' + s.pct.toFixed(1) + '%'}</text>
          </g>
        )
      })}
    </svg>
  )
}

function LineChart(props: any) {
  var series = props.series, labels = props.labels
  var H = props.h || 168, W = 620, P = { l: 40, r: 10, t: 10, b: 22 }
  var all: number[] = []
  series.forEach(function (s: any) { s.pts.forEach(function (v: any) { if (v !== null && v !== undefined) all.push(Number(v)) }) })
  if (!all.length) return null
  var lo = Math.min.apply(null, all), hi = Math.max.apply(null, all)
  if (props.zero) lo = Math.min(lo, 0)
  if (hi === lo) hi = lo + 1
  var pad = (hi - lo) * 0.12; lo -= pad; hi += pad
  var X = function (i: number) { return P.l + (W - P.l - P.r) * (labels.length === 1 ? 0.5 : i / (labels.length - 1)) }
  var Y = function (v: number) { return P.t + (H - P.t - P.b) * (1 - (v - lo) / (hi - lo)) }
  var grid = [lo + (hi - lo) * 0.08, (lo + hi) / 2, hi - (hi - lo) * 0.08]
  var step = Math.max(1, Math.ceil(labels.length / 8))
  return (
    <svg viewBox={'0 0 ' + W + ' ' + H} style={{ width: '100%', height: 'auto', display: 'block' }}>
      {grid.map(function (g: number, gi: number) { return (
        <g key={gi}>
          <line x1={P.l} x2={W - P.r} y1={Y(g)} y2={Y(g)} stroke='var(--cf-line)' strokeDasharray='3 4' strokeWidth={1} />
          <text x={P.l - 6} y={Y(g) + 3} textAnchor='end' fontSize={9} fill='var(--cf-ink3)'>{g.toFixed(1)}</text>
        </g>) })}
      {labels.map(function (lb: string, i: number) { return i % step === 0 ? (
        <text key={'x' + i} x={X(i)} y={H - 6} textAnchor='middle' fontSize={8.5} fill='var(--cf-ink3)'>{lb}</text>) : null })}
      {series.map(function (s: any, si: number) {
        var segs: string[] = []; var cur = ''
        s.pts.forEach(function (v: any, i: number) {
          if (v === null || v === undefined) { if (cur) segs.push(cur); cur = ''; return }
          cur += (cur ? ' L ' : 'M ') + X(i).toFixed(1) + ' ' + Y(Number(v)).toFixed(1)
        })
        if (cur) segs.push(cur)
        var lastIdx = -1
        s.pts.forEach(function (v: any, i: number) { if (v !== null && v !== undefined) lastIdx = i })
        return (
          <g key={si}>
            {segs.map(function (d: string, di: number) { return <path key={di} d={d} fill='none' stroke={s.color} strokeWidth={s.w || 2} strokeDasharray={s.dash || undefined} /> })}
            {lastIdx >= 0 ? <circle cx={X(lastIdx)} cy={Y(Number(s.pts[lastIdx]))} r={3} fill={s.color} /> : null}
            {lastIdx >= 0 && props.endLabels ? <text x={X(lastIdx) - 4} y={Y(Number(s.pts[lastIdx])) - 6} textAnchor='end' fontSize={9} fontWeight={700} fill={s.color}>{Number(s.pts[lastIdx]).toFixed(1)}</text> : null}
          </g>)
      })}
    </svg>)
}

function BarChart(props: any) {
  var pts = props.pts, labels = props.labels
  var H = props.h || 150, W = 620, P = { l: 46, r: 10, t: 10, b: 22 }
  var vals = pts.filter(function (v: any) { return v !== null && v !== undefined }).map(Number)
  if (!vals.length) return null
  var lo = Math.min(0, Math.min.apply(null, vals)), hi = Math.max(0, Math.max.apply(null, vals))
  if (hi === lo) hi = lo + 1
  var Y = function (v: number) { return P.t + (H - P.t - P.b) * (1 - (v - lo) / (hi - lo)) }
  var bw = (W - P.l - P.r) / labels.length
  var step = Math.max(1, Math.ceil(labels.length / 8))
  return (
    <svg viewBox={'0 0 ' + W + ' ' + H} style={{ width: '100%', height: 'auto', display: 'block' }}>
      <line x1={P.l} x2={W - P.r} y1={Y(0)} y2={Y(0)} stroke='var(--cf-line)' strokeWidth={1} />
      <text x={P.l - 6} y={Y(0) + 3} textAnchor='end' fontSize={9} fill='var(--cf-ink3)'>0</text>
      {pts.map(function (v: any, i: number) {
        if (v === null || v === undefined) return null
        var n = Number(v); var y0 = Y(Math.max(0, n)); var hgt = Math.abs(Y(n) - Y(0))
        return <rect key={i} x={P.l + i * bw + bw * 0.18} y={y0} width={bw * 0.64} height={Math.max(1, hgt)} rx={2} fill={n < 0 ? 'var(--cf-negative)' : 'var(--cf-positive)'} opacity={0.85} />
      })}
      {labels.map(function (lb: string, i: number) { return i % step === 0 ? (
        <text key={'x' + i} x={P.l + i * bw + bw * 0.5} y={H - 6} textAnchor='middle' fontSize={8.5} fill='var(--cf-ink3)'>{lb}</text>) : null })}
    </svg>)
}

export default function EconomyPage() {
  var langCtx: any = useLang()
  var lang = langCtx.lang
  var isAr = lang === 'ar'
  var t = T[isAr ? 'ar' : 'en']
  var st = useState<Row[]>([]); var rows = st[0], setRows = st[1]
  var sr = useState<any[]>([]); var ratings = sr[0], setRatings = sr[1]
  var sl = useState<any[]>([]); var syncs = sl[0], setSyncs = sl[1]
  var so = useState(false); var askOpen = so[0], setAskOpen = so[1]
  var sm = useState<any[]>([]); var msgs = sm[0], setMsgs = sm[1]
  var sq = useState(''); var q = sq[0], setQ = sq[1]
  var sb2 = useState(false); var busy = sb2[0], setBusy = sb2[1]

  useEffect(function () {
    supabase.from('macro_indicators').select('category,indicator,indicator_ar,period,value,unit,source,note').order('id', { ascending: true }).then(function (r: any) { if (r.data) setRows(r.data) })
    supabase.from('credit_ratings').select('agency,agency_ar,rating,outlook,rating_year').then(function (r: any) { if (r.data) setRatings(r.data) })
    supabase.from('macro_sync_log').select('source,ok,at').order('id', { ascending: false }).limit(2).then(function (r: any) { if (r.data) setSyncs(r.data) })
  }, [])

  var D = useMemo(function () {
    var pick = function (cat: string, ind: string) { return rows.filter(function (r) { return r.category === cat && r.indicator === ind }) }
    var yearly = function (list: Row[]) { return list.slice().sort(function (a, b) { return yearKey(a.period) - yearKey(b.period) }) }
    var monthly = function (list: Row[]) { return list.slice().sort(function (a, b) { return monthTime(a.period) - monthTime(b.period) }) }
    var mergeYears = function (specs: any[]) {
      var set: any = {}; specs.forEach(function (sp: any) { sp.rows.forEach(function (r: Row) { set[r.period] = yearKey(r.period) }) })
      var labels = Object.keys(set).sort(function (a, b) { return set[a] - set[b] })
      var series = specs.map(function (sp: any) {
        var m: any = {}; sp.rows.forEach(function (r: Row) { m[r.period] = Number(r.value) })
        return { name: sp.name, color: sp.color, dash: sp.dash, w: sp.w, pts: labels.map(function (L) { return m[L] !== undefined ? m[L] : null }) }
      })
      return { labels: labels, series: series }
    }
    var last = function (list: Row[]) { return list.length ? list[list.length - 1] : null }
    var gg = mergeYears([
      { name: t.world, color: 'var(--cf-primary-strong)', w: 2.4, rows: yearly(pick('global_growth', 'World real GDP growth')) },
      { name: t.adv, color: 'var(--cf-teal)', rows: yearly(pick('global_growth', 'Advanced economies growth')) },
      { name: t.emg, color: 'var(--cf-iris)', rows: yearly(pick('global_growth', 'Emerging and developing growth')) }])
    var gi = mergeYears([
      { name: t.world, color: 'var(--cf-primary-strong)', w: 2.4, rows: yearly(pick('global_inflation', 'World inflation')) },
      { name: t.adv, color: 'var(--cf-teal)', rows: yearly(pick('global_inflation', 'Advanced economies inflation')) },
      { name: t.emg, color: 'var(--cf-iris)', rows: yearly(pick('global_inflation', 'Emerging and developing inflation')) }])
    var jg = mergeYears([
      { name: 'DoS', color: 'var(--cf-primary-strong)', w: 2.4, rows: yearly(pick('jo_gdp', 'Real GDP growth')) },
      { name: 'IMF', color: 'var(--cf-primary)', dash: '5 4', rows: yearly(pick('jo_gdp', 'Real GDP growth forecast')) }])
    var cpiM = monthly(pick('jo_inflation', 'CPI inflation monthly YoY'))
    var exM = monthly(pick('jo_trade', 'Monthly exports (USD)'))
    var imM = monthly(pick('jo_trade', 'Monthly imports (USD)'))
    var tbM = monthly(pick('jo_trade', 'Monthly trade balance (USD)'))
    var mLabels = exM.map(function (r) { return r.period.replace('-20', ' ') })
    var debt = mergeYears([
      { name: t.dom, color: 'var(--cf-teal)', rows: yearly(pick('jo_debt', 'Domestic debt pct GDP')) },
      { name: t.ext, color: 'var(--cf-primary-strong)', w: 2.4, rows: yearly(pick('jo_debt', 'External debt pct GDP')) },
      { name: t.imf_path, color: 'var(--cf-iris)', dash: '5 4', rows: yearly(pick('jo_debt', 'General gov gross debt pct GDP (IMF)').concat(pick('jo_debt', 'Gov debt pct GDP forecast (IMF)'))) }])
    var bs = mergeYears([
      { name: t.assets, color: 'var(--cf-primary-strong)', w: 2.4, rows: yearly(pick('banking_sector', 'Sector assets')) },
      { name: t.deposits, color: 'var(--cf-teal)', rows: yearly(pick('banking_sector', 'Sector deposits')) },
      { name: t.credit, color: 'var(--cf-iris)', rows: yearly(pick('banking_sector', 'Sector credit facilities')) }])
    var prof = mergeYears([
      { name: 'ROE', color: 'var(--cf-primary-strong)', w: 2.4, rows: yearly(pick('banking_sector', 'Sector ROE')) },
      { name: 'ROA', color: 'var(--cf-teal)', rows: yearly(pick('banking_sector', 'Sector ROA')) }])
    var rates = mergeYears([
      { name: t.lend, color: 'var(--cf-primary-strong)', w: 2.4, rows: yearly(pick('banking_rates', 'Weighted avg lending rate')) },
      { name: t.dep, color: 'var(--cf-teal)', rows: yearly(pick('banking_rates', 'Weighted avg time deposit rate')) },
      { name: t.margin, color: 'var(--cf-iris)', dash: '4 4', rows: yearly(pick('banking_rates', 'Interest margin')) }])
    var mseries = function (cat: string, ind: string) { var list = rows.filter(function (r) { return r.category === cat && r.indicator === ind }); list = list.slice().sort(function (a, b) { return monthTime(a.period) - monthTime(b.period) }); return { labels: list.map(function (r) { return r.period.replace('-20', ' ') }), pts: list.map(function (r) { return Number(r.value) }) } }
    var mAssets = mseries('banking_sector_monthly', 'ODC total assets (monthly)')
    var mCredit = mseries('banking_sector_quarterly', 'ODC credit facilities (quarterly)')
    var mLend = mseries('banking_rates_monthly', 'Weighted avg lending rate (monthly)')
    var mDep = mseries('banking_rates_monthly', 'Weighted avg time deposit rate (monthly)')
    var mDepTot = mseries('banking_sector_monthly', 'Total customer deposits (monthly)')
    var mixDef = [
      { ind: 'Deposits: private sector resident (monthly)', en: 'Private sector — resident', ar: 'القطاع الخاص المقيم', c: 'var(--cf-primary-strong)' },
      { ind: 'Deposits: private sector non-resident (monthly)', en: 'Private sector — non-resident', ar: 'القطاع الخاص غير المقيم', c: 'var(--cf-teal)' },
      { ind: 'Deposits: public sector (monthly)', en: 'Public sector', ar: 'القطاع العام', c: 'var(--cf-gold, #c9a227)' },
      { ind: 'Deposits: other financial corporations (monthly)', en: 'Other financial corporations', ar: 'الشركات المالية الأخرى', c: 'var(--cf-ink3)' }
    ]
    var depPerRaw: any = null
    ;(function () { var l = rows.filter(function (r) { return r.indicator === 'Total customer deposits (monthly)' }); l = l.slice().sort(function (a, b) { return monthTime(a.period) - monthTime(b.period) }); if (l.length) depPerRaw = l[l.length - 1].period })()
    var depMix = mixDef.map(function (m) {
      var r0 = rows.filter(function (r) { return r.indicator === m.ind && r.period === depPerRaw })[0]
      return { name: lang === 'ar' ? m.ar : m.en, v: r0 ? Number(r0.value) : 0, c: m.c }
    }).filter(function (d) { return d.v > 0 })
    var depTotVal = mDepTot.pts.length ? mDepTot.pts[mDepTot.pts.length - 1] : 0
    var depYoY = mDepTot.pts.length > 12 ? (mDepTot.pts[mDepTot.pts.length - 1] / mDepTot.pts[mDepTot.pts.length - 13] - 1) * 100 : null
    var toBn = function (o: any) { return { labels: o.labels, pts: o.pts.map(function (v: any) { return Math.round(v / 10) / 100 }) } }
    var ep = function (ind: string) { var r = last(yearly(pick('banking_epayments', ind))); return r ? { v: Number(r.value), u: r.unit || '' } : null }
    return {
      gg: gg, gi: gi, jg: jg, debt: debt, bs: bs, prof: prof, rates: rates,
      cpiLabels: cpiM.map(function (r) { return r.period.replace('-20', ' ') }), cpiPts: cpiM.map(function (r) { return Number(r.value) }),
      mLabels: mLabels, exPts: exM.map(function (r) { return Number(r.value) }), imPts: imM.map(function (r) { return Number(r.value) }), tbLabels: tbM.map(function (r) { return r.period.replace('-20', ' ') }), tbPts: tbM.map(function (r) { return Number(r.value) }),
      kGdp: last(yearly(pick('jo_gdp', 'Real GDP growth'))), kGdpF: (pick('jo_gdp', 'Real GDP growth forecast').filter(function (r) { return r.period === '2026F' })[0] || null),
      kCpi: last(cpiM), kUn: last(yearly(pick('jo_social', 'Unemployment rate'))),
      kDebt: (pick('jo_debt', 'Public debt excl SSIF pct GDP').filter(function (r) { return r.period === 'Jun-2025' })[0] || last(yearly(pick('jo_debt', 'Public debt excl SSIF pct GDP')))),
      kTb: last(tbM),
      kH1b: (pick('jo_trade', 'Trade balance').filter(function (r) { return r.period === 'H1-2025' })[0] || null),
      h1: { x: (pick('jo_trade', 'Total exports').filter(function (r) { return r.period === 'H1-2025' })[0] || {}).value, m: (pick('jo_trade', 'Total imports').filter(function (r) { return r.period === 'H1-2025' })[0] || {}).value, b: (pick('jo_trade', 'Trade balance').filter(function (r) { return r.period === 'H1-2025' })[0] || {}).value },
      vint: (function () { for (var i2 = 0; i2 < rows.length; i2++) { var nt = rows[i2].note; if (nt && String(nt).indexOf('WEO') >= 0) { var mm = String(nt).match(/([0-9][0-9][0-9][0-9]-[0-9][0-9])/); if (mm) return mm[1] } } return null })(),
      mAssets: toBn(mAssets), mCredit: toBn(mCredit), mLend: mLend, mDep: mDep,
      eShare: ep('Electronic channel share of payments'), eUsers: ep('Digital banking users'), eVal: ep('Digital payment value'), eAtm: ep('ATMs in Kingdom')
    }
  }, [rows, lang])

  var ask = function () {
    if (!q.trim() || busy) return
    var next = msgs.concat([{ role: 'user', content: q.trim() }])
    setMsgs(next); setQ(''); setBusy(true)
    fetch('/api/zad', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: next.map(function (m) { return { role: m.role, content: m.content } }), lang: lang }) })
      .then(function (r) { return r.json() })
      .then(function (d) { setMsgs(next.concat([{ role: 'assistant', content: (d && d.text) ? d.text : t.err }])); setBusy(false) })
      .catch(function () { setMsgs(next.concat([{ role: 'assistant', content: t.err }])); setBusy(false) })
  }

  var card: any = { background: 'var(--cf-surface)', border: '1px solid var(--cf-line)', borderRadius: 12, padding: '14px 16px' }
  var h2: any = { margin: '0 0 2px', fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--cf-ink3)', fontWeight: 700 }
  var big: any = { fontSize: 22, fontWeight: 800, color: 'var(--cf-ink)', lineHeight: 1.15 }
  var legend = function (items: any[]) { return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 6 }}>
      {items.map(function (s: any, i: number) { return (
        <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10.5, color: 'var(--cf-ink2)' }}>
          <span style={{ width: 14, height: 3, borderRadius: 2, background: s.color, display: 'inline-block' }} />{s.name}</span>) })}
    </div>) }
  var fmt = function (v: any, d: number) { return v === null || v === undefined ? '—' : Number(v).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }) }

  var kpis = [
    { l: t.kpi_gdp, v: D.kGdp ? fmt(D.kGdp.value, 1) + '%' : '—', s: (D.kGdp ? D.kGdp.period : '') + (D.kGdpF ? ' · 2026F ' + fmt(D.kGdpF.value, 1) + '%' : '') },
    { l: t.kpi_cpi, v: D.kCpi ? fmt(D.kCpi.value, 2) + '%' : '—', s: D.kCpi ? D.kCpi.period : '' },
    { l: t.kpi_trade, v: D.kH1b ? fmt(D.kH1b.value, 0) : '—', s: D.kH1b ? D.kH1b.period + ' · JOD m · DoS' : '' },
    { l: t.kpi_debt, v: D.kDebt ? fmt(D.kDebt.value, 1) + '%' : '—', s: D.kDebt ? D.kDebt.period + ' · excl SSIF' : '' },
    { l: t.kpi_unemp, v: D.kUn ? fmt(D.kUn.value, 1) + '%' : '—', s: D.kUn ? D.kUn.period + ' · IMF' : '' }
  ]

  return (
    <div dir={isAr ? 'rtl' : 'ltr'} style={{ minHeight: '100vh', background: 'var(--cf-bg)', fontFamily: isAr ? 'var(--cf-font-ar)' : 'var(--cf-font-sans)' }}>
      <style>{ZAD_MD_CSS}</style>
      <div style={{ borderBottom: '1px solid var(--cf-line)', background: 'var(--cf-surface)' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', padding: '18px 20px 16px' }}>
          <div style={{ fontSize: 10, letterSpacing: '0.14em', color: 'var(--cf-ink3)', fontWeight: 700 }}>CONVO.FINANCE / {t.crumb}</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <h1 style={{ margin: '4px 0 2px', fontSize: 24, color: 'var(--cf-ink)' }}>{t.title}</h1>
              <div style={{ fontSize: 12.5, color: 'var(--cf-ink2)' }}>{t.sub}</div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 10.5, color: 'var(--cf-ink3)', fontWeight: 700, letterSpacing: '0.06em' }}>{t.ratings}:</span>
              {ratings.map(function (r: any, i: number) { return (
                <span key={i} style={{ fontSize: 11, fontWeight: 700, color: 'var(--cf-primary-strong)', background: 'var(--cf-primary-soft)', border: '1px solid var(--cf-line)', borderRadius: 999, padding: '3px 10px' }}>{(isAr && r.agency_ar ? r.agency_ar : r.agency) + ' ' + r.rating}</span>) })}
              {D.vint ? <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--cf-ink2)', background: 'var(--cf-surface2)', border: '1px solid var(--cf-line)', borderRadius: 999, padding: '3px 10px' }} dir='ltr'>{'IMF WEO ' + D.vint}</span> : null}
            </div>
          </div>
        </div>
      </div>
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '16px 20px 80px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
          {kpis.map(function (k: any, i: number) { return (
            <div key={i} style={card}>
              <div style={h2}>{k.l}</div>
              <div style={big} dir='ltr'>{k.v}</div>
              <div style={{ fontSize: 10.5, color: 'var(--cf-ink3)', marginTop: 2 }} dir='ltr'>{k.s}</div>
            </div>) })}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(330px, 1fr))', gap: 12, marginTop: 14 }}>
          <div style={card}><div style={h2}>{t.global} — {t.g_growth}</div><LineChart labels={D.gg.labels} series={D.gg.series} endLabels />{legend(D.gg.series)}</div>
          <div style={card}><div style={h2}>{t.global} — {t.g_infl}</div><LineChart labels={D.gi.labels} series={D.gi.series} endLabels />{legend(D.gi.series)}</div>
          <div style={card}><div style={h2}>{t.jordan} — {t.j_growth}</div><LineChart labels={D.jg.labels} series={D.jg.series} endLabels zero />{legend(D.jg.series)}</div>
          <div style={card}><div style={h2}>{t.jordan} — {t.monthly_cpi}</div><LineChart labels={D.cpiLabels} series={[{ name: 'YoY', color: 'var(--cf-primary-strong)', w: 2.4, pts: D.cpiPts }]} endLabels zero /></div>
          <div style={card}><div style={h2}>{t.trade}</div><LineChart labels={D.mLabels} series={[{ name: t.exports, color: 'var(--cf-positive)', w: 2.2, pts: D.exPts }, { name: t.imports, color: 'var(--cf-negative)', w: 2.2, pts: D.imPts }]} endLabels />{legend([{ name: t.exports, color: 'var(--cf-positive)' }, { name: t.imports, color: 'var(--cf-negative)' }])}<div style={{ marginTop: 7, fontSize: 10.5, color: 'var(--cf-ink2)', fontWeight: 600 }} dir='ltr'>DoS H1-2025 (JOD m): X {fmt(D.h1.x, 0)} · M {fmt(D.h1.m, 0)} · Bal {fmt(D.h1.b, 0)}</div><div style={{ fontSize: 9.5, color: 'var(--cf-ink3)', marginTop: 3 }}>{t.dotNote}</div></div>
          <div style={card}><div style={h2}>{t.balance}</div><BarChart labels={D.tbLabels} pts={D.tbPts} /><div style={{ fontSize: 9.5, color: 'var(--cf-ink3)', marginTop: 3 }}>{t.dotNote}</div></div>
          <div style={card}><div style={h2}>{t.debt}</div><LineChart labels={D.debt.labels} series={D.debt.series} endLabels />{legend(D.debt.series)}</div>
          <div style={card}><div style={h2}>{t.sector} — {t.s_bs}</div><LineChart labels={D.bs.labels} series={D.bs.series} endLabels />{legend(D.bs.series)}</div>
          <div style={card}><div style={h2}>{t.sector} — {t.s_prof}</div><LineChart labels={D.prof.labels} series={D.prof.series} endLabels zero />{legend(D.prof.series)}</div>
          <div style={card}><div style={h2}>{t.sector} — {t.s_rates}</div><LineChart labels={D.rates.labels} series={D.rates.series} endLabels />{legend(D.rates.series)}</div>
          <div style={card}>
            <div style={h2}>{t.epay}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 6 }}>
              {[{ l: isAr ? 'حصة القنوات الإلكترونية' : 'Electronic share', d: D.eShare, f: 0, suf: '%' }, { l: isAr ? 'مستخدمو الرقمي' : 'Digital users', d: D.eUsers, f: 2, suf: 'm' }, { l: isAr ? 'قيمة المدفوعات' : 'Payments value', d: D.eVal, f: 1, suf: ' JOD bn' }, { l: isAr ? 'أجهزة الصراف' : 'ATMs', d: D.eAtm, f: 0, suf: '' }].map(function (x: any, i: number) { return (
                <div key={i} style={{ background: 'var(--cf-surface2)', border: '1px solid var(--cf-line)', borderRadius: 10, padding: '10px 12px' }}>
                  <div style={{ fontSize: 10, color: 'var(--cf-ink3)', fontWeight: 700 }}>{x.l}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--cf-ink)' }} dir='ltr'>{x.d ? fmt(x.d.v, x.f) + x.suf : '—'}</div>
                </div>) })}
            </div>
          </div>
          <div style={card}><div style={h2}>{t.m_assets}</div><LineChart labels={D.mAssets.labels} series={[{ name: t.assets, color: 'var(--cf-primary-strong)', w: 2.4, pts: D.mAssets.pts }]} endLabels />{D.mAssets.labels.length ? <div style={{ fontSize: 9.5, color: 'var(--cf-ink3)', marginTop: 3 }}>{t.cbjLive}</div> : null}</div>
          <div style={card}><div style={h2}>{t.m_credit}</div><LineChart labels={D.mCredit.labels} series={[{ name: t.credit, color: 'var(--cf-teal)', w: 2.4, pts: D.mCredit.pts }]} endLabels />{D.mCredit.labels.length ? <div style={{ fontSize: 9.5, color: 'var(--cf-ink3)', marginTop: 3 }}>{t.cbjLive}</div> : null}</div>
          <div style={card}><div style={h2}>{t.m_rates}</div><LineChart labels={D.mLend.labels} series={[{ name: t.lend, color: 'var(--cf-primary-strong)', w: 2.4, pts: D.mLend.pts }, { name: t.dep, color: 'var(--cf-teal)', w: 2, pts: D.mDep.pts }]} endLabels />{legend([{ name: t.lend, color: 'var(--cf-primary-strong)' }, { name: t.dep, color: 'var(--cf-teal)' }])}</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 14, marginTop: 14 }}>
          <div style={card} data-cf='depmix'>
            <div style={h2}>{lang === 'ar' ? 'ودائع العملاء — التوزيع حسب المودع' : 'CUSTOMER DEPOSITS — MIX BY DEPOSITOR'}</div>
            <PieChart data={D.depMix} center={(D.depTotVal / 1000).toFixed(1) + 'B'} centerSub={'JOD · ' + (D.depPer || '')} />
            <div style={{ fontSize: 10.5, color: 'var(--cf-ink3)', marginTop: 6 }}>{'CBJ statistical DB · ' + (D.depPer || '')}</div>
          </div>
          <div style={card} data-cf='deptrend'>
            <div style={h2}>{(lang === 'ar' ? 'إجمالي ودائع العملاء، شهري (مليار دينار)' : 'TOTAL CUSTOMER DEPOSITS, MONTHLY (JOD BN)') + (D.depYoY === null || D.depYoY === undefined ? '' : ' · ' + (D.depYoY >= 0 ? '+' : '') + D.depYoY.toFixed(1) + '% YoY')}</div>
            <LineChart labels={D.mDepTot.labels} series={[{ name: 'Deposits', color: 'var(--cf-primary-strong)', w: 2.4, pts: D.mDepTot.pts }]} endLabels />
            <div style={{ fontSize: 10.5, color: 'var(--cf-ink3)', marginTop: 6 }}>{'CBJ statistical DB'}</div>
          </div>
        </div>
        <div style={{ marginTop: 14, fontSize: 11, color: 'var(--cf-ink3)', lineHeight: 1.6 }}>
          <div>{t.forecast} · {t.y2564}</div>
          <div>{t.src}{syncs.length ? ' · ' + t.lastSync + ': ' + String(syncs[0].at).slice(0, 16).replace('T', ' ') + ' UTC' : ''}</div>
        </div>
      </div>
      <button onClick={function () { setAskOpen(!askOpen) }} style={{ position: 'fixed', insetInlineEnd: 22, bottom: 22, zIndex: 50, background: 'var(--cf-grad)', color: '#fff', border: 'none', borderRadius: 999, padding: '12px 20px', fontSize: 13.5, fontWeight: 800, cursor: 'pointer', boxShadow: '0 8px 24px rgba(11,31,59,0.35)' }}>{t.ask}</button>
      {askOpen ? (
        <div style={{ position: 'fixed', insetInlineEnd: 22, bottom: 74, zIndex: 50, width: 'min(400px, calc(100vw - 44px))', maxHeight: '64vh', display: 'flex', flexDirection: 'column', background: 'var(--cf-surface)', border: '1px solid var(--cf-line)', borderRadius: 14, boxShadow: '0 18px 48px rgba(11,31,59,0.25)', overflow: 'hidden' }} dir={isAr ? 'rtl' : 'ltr'}>
          <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--cf-line)', fontWeight: 800, fontSize: 13, color: 'var(--cf-ink)', background: 'var(--cf-surface2)' }}>{t.ask}</div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {msgs.map(function (m: any, i: number) { return m.role === 'user' ? (
              <div key={i} style={{ alignSelf: isAr ? 'flex-start' : 'flex-end', background: 'var(--cf-primary-soft)', border: '1px solid var(--cf-line)', color: 'var(--cf-ink)', borderRadius: 12, padding: '8px 12px', fontSize: 12.5, maxWidth: '88%' }}>{m.content}</div>) : (
              <div key={i} className='cf-md' style={{ alignSelf: isAr ? 'flex-end' : 'flex-start', background: 'var(--cf-surface2)', border: '1px solid var(--cf-line)', borderRadius: 12, padding: '8px 12px', fontSize: 12.5, maxWidth: '95%' }} dangerouslySetInnerHTML={{ __html: zadMdToHtml(m.content) }} />) })}
            {busy ? <div style={{ fontSize: 11.5, color: 'var(--cf-ink3)' }}>{t.thinking}</div> : null}
          </div>
          <div style={{ display: 'flex', gap: 8, padding: 10, borderTop: '1px solid var(--cf-line)' }}>
            <input value={q} onChange={function (e: any) { setQ(e.target.value) }} onKeyDown={function (e: any) { if (e.key === 'Enter') ask() }} placeholder={t.askPh} style={{ flex: 1, border: '1px solid var(--cf-line)', borderRadius: 10, padding: '9px 12px', fontSize: 12.5, background: 'var(--cf-bg)', color: 'var(--cf-ink)', outline: 'none' }} />
            <button onClick={ask} disabled={busy} style={{ background: 'var(--cf-primary-strong)', color: '#fff', border: 'none', borderRadius: 10, padding: '9px 16px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', opacity: busy ? 0.6 : 1 }}>{t.send}</button>
          </div>
        </div>) : null}
    </div>
  )
}
