'use client';
import React, { useState, useEffect, useRef } from 'react';
import { BANKS } from '@/lib/banks-config';

const CSS = ".zc-wrap{min-height:100vh;background:var(--cf-bg);display:flex;flex-direction:column}*{box-sizing:border-box}.zc-header{position:sticky;top:0;z-index:20;display:flex;align-items:center;justify-content:space-between;padding:14px 22px;background:color-mix(in srgb, var(--cf-surface) 92%, transparent);backdrop-filter:blur(10px);border-bottom:1px solid var(--cf-line)}.zc-brand{display:flex;align-items:center;gap:11px;text-decoration:none;cursor:pointer}.zc-logo{width:42px;height:42px;border-radius:11px;background:transparent;overflow:hidden;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:14px;letter-spacing:0.5px;box-shadow:0 4px 12px rgba(12,48,87,0.25)}.zc-bt{font-weight:800;color:var(--cf-ink);font-size:16px;line-height:1.1}.zc-bs{font-size:12px;color:var(--cf-ink2)}.zc-lang{border:1px solid var(--cf-line);background:var(--cf-surface);color:var(--cf-ink);border-radius:9px;padding:7px 13px;font-size:13px;font-weight:600;cursor:pointer}.zc-lang:hover{background:var(--cf-bg)}.zc-main{flex:1;width:100%;max-width:840px;margin:0 auto;padding:24px 18px 150px;display:flex;flex-direction:column}.zc-messages{display:flex;flex-direction:column;gap:18px}.zc-msg{max-width:86%;padding:14px 17px;border-radius:16px;font-size:15px;line-height:1.62;word-wrap:break-word}.zc-user{align-self:flex-end;background:linear-gradient(135deg,var(--cf-primary-strong),var(--cf-primary));color:#fff;border-bottom-right-radius:5px;white-space:pre-wrap}.zc-zad{align-self:flex-start;background:var(--cf-surface);color:var(--cf-ink);border:1px solid var(--cf-line);border-bottom-left-radius:5px;box-shadow:0 2px 10px rgba(20,40,70,0.05)}.zc-zad strong{color:var(--cf-ink);font-weight:700}.zc-zad p{margin:0 0 9px}.zc-zad p:last-child{margin-bottom:0}.zc-zad ul{margin:6px 0;padding-inline-start:20px}.zc-zad li{margin:3px 0}.zc-role{font-size:11px;font-weight:700;letter-spacing:0.6px;text-transform:uppercase;color:var(--cf-ink3);margin-bottom:6px}.zc-empty{margin:auto;text-align:center;max-width:640px;padding:30px 10px}.zc-eyebrow{display:inline-block;font-size:12px;font-weight:700;color:var(--cf-gold);letter-spacing:1px;text-transform:uppercase;margin-bottom:14px}.zc-etitle{font-size:26px;font-weight:800;color:var(--cf-ink);margin:0 0 10px;line-height:1.25}.zc-esub{font-size:15px;color:var(--cf-ink2);line-height:1.6;margin:0 0 26px}.zc-chips{display:flex;flex-wrap:wrap;gap:10px;justify-content:center}.zc-chip{border:1px solid var(--cf-line);background:var(--cf-surface);color:var(--cf-ink);border-radius:11px;padding:11px 15px;font-size:14px;cursor:pointer;transition:all .15s;font-weight:500}.zc-chip:hover{border-color:var(--cf-primary);background:var(--cf-primary-soft);color:var(--cf-ink)}.zc-inputbar{position:fixed;bottom:0;left:0;right:0;background:linear-gradient(to top,var(--cf-surface) 72%,rgba(244,247,250,0));padding:16px 18px 22px}.zc-inputinner{max-width:840px;margin:0 auto;display:flex;gap:10px;align-items:flex-end}.zc-input{flex:1;border:1px solid var(--cf-line);background:var(--cf-surface);border-radius:14px;padding:14px 16px;font-size:15px;resize:none;outline:none;font-family:inherit;line-height:1.5;box-shadow:0 2px 12px rgba(20,40,70,0.06);max-height:140px}.zc-input:focus{border-color:var(--cf-primary);box-shadow:0 0 0 3px rgba(58,110,165,0.13)}.zc-send{border:none;background:linear-gradient(135deg,var(--cf-primary-strong),var(--cf-primary));color:#fff;border-radius:13px;width:50px;height:50px;font-size:20px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 4px 12px rgba(12,48,87,0.25)}.zc-send:disabled{opacity:0.45;cursor:default}.zc-chart{margin-top:13px;padding:14px 15px;background:var(--cf-bg);border:1px solid var(--cf-line);border-radius:12px}.zc-charttitle{font-size:13px;font-weight:700;color:var(--cf-ink);margin-bottom:4px}.zc-chartunit{font-size:11px;color:var(--cf-ink3);margin-bottom:11px}.zc-bar-row{display:flex;align-items:center;gap:10px;margin:7px 0}.cf-md-table{width:100%;border-collapse:separate;border-spacing:0;margin:12px 0;font-size:13px;background:var(--cf-surface);border:1px solid var(--cf-line);border-radius:10px;overflow:hidden}.cf-md-table th{text-align:start;padding:9px 12px;font-weight:700;font-size:12px;color:var(--cf-ink2);background:var(--cf-surface2);border-bottom:1px solid var(--cf-line);white-space:nowrap}.cf-md-table td{padding:9px 12px;border-bottom:1px solid var(--cf-line);color:var(--cf-ink);font-variant-numeric:tabular-nums}.cf-md-table tr:last-child td{border-bottom:none}.cf-md-table tr:hover td{background:color-mix(in srgb, var(--cf-primary) 4%, transparent)}.zc-bar-label{flex:0 0 34%;font-size:12.5px;color:var(--cf-ink);text-align:start;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.zc-bar-track{flex:1;background:var(--cf-surface2);border-radius:6px;height:22px;position:relative;overflow:hidden}.zc-bar-fill{height:100%;background:linear-gradient(90deg,var(--cf-primary),var(--cf-primary-strong));border-radius:6px;min-width:2px}.zc-bar-val{font-size:12px;font-weight:700;color:var(--cf-ink);flex:0 0 auto;min-width:52px;text-align:end}.zc-loading{display:flex;gap:5px;padding:4px 2px;align-self:flex-start}.zc-dot{width:8px;height:8px;border-radius:50%;background:var(--cf-ink3);animation:zcb 1.2s infinite}.zc-dot:nth-child(2){animation-delay:.2s}.zc-dot:nth-child(3){animation-delay:.4s}@keyframes zcb{0%,60%,100%{opacity:.3;transform:translateY(0)}30%{opacity:1;transform:translateY(-4px)}}.zc-err{align-self:flex-start;background:color-mix(in srgb, var(--cf-negative) 10%, var(--cf-surface));border:1px solid color-mix(in srgb, var(--cf-negative) 35%, var(--cf-surface));color:var(--cf-negative);padding:11px 15px;border-radius:13px;font-size:14px}[dir=rtl] .zc-bar-fill{background:linear-gradient(270deg,var(--cf-primary),var(--cf-primary-strong))}[dir=rtl] .zc-user{border-bottom-right-radius:16px;border-bottom-left-radius:5px}[dir=rtl] .zc-zad{border-bottom-left-radius:16px;border-bottom-right-radius:5px}.cf-md a,.zc-link{color:var(--cf-primary);font-weight:600;text-decoration:none;border-bottom:1px solid color-mix(in srgb, var(--cf-primary) 45%, transparent)}.cf-md a:hover,.zc-link:hover{border-bottom-color:var(--cf-primary)}";
const T = {"en":{"brandSub":"Banking Intelligence","langLabel":"العربية","eyebrow":"ZAD Analyst","etitle":"Ask ZAD about Jordan's banks","esub":"Grounded in verified financials for all 15 licensed banks. Ask about performance, rankings, comparisons, or the sector.","role":"ZAD","placeholder":"Ask about a bank, a ranking, or the sector...","send":"↑","errMsg":"Connection issue. Please try again.","chipsByFocus":{"cbj":[{"label":"CBJ regulatory framework","prompt":"Explain the Central Bank of Jordan's supervisory role and the regulatory data tracked across the 15 licensed commercial banks."},{"label":"Capital adequacy by bank","prompt":"Compare the capital adequacy ratios (CAR) of the major Jordanian banks and flag any that look weak relative to peers."},{"label":"Asset quality and NPLs","prompt":"Which Jordanian banks carry the highest non-performing loan ratios, and what does that signal about asset quality?"},{"label":"Digital payments (JoMoPay)","prompt":"Give me an overview of digital payments and JoMoPay adoption across Jordan's banking sector."}]},"chips":[{"label":"Sector overview","prompt":"Give me a concise overview of the Jordanian banking sector for the latest fiscal year."},{"label":"Rank banks by assets","prompt":"Rank the top Jordanian banks by total assets in the latest fiscal year."},{"label":"Arab Bank vs Housing Bank","prompt":"Compare Arab Bank and Housing Bank by total assets, net profit, and ROE."},{"label":"Most profitable banks","prompt":"Which Jordanian banks have the highest net profit and ROE in the latest year?"}]},"ar":{"brandSub":"ذكاء مصرفي","langLabel":"EN","eyebrow":"محلل زاد","etitle":"اسأل زاد عن البنوك الأردنية","esub":"قائم على بيانات مالية مدققة لكل البنوك الـ 15 المرخصة. اسأل عن الأداء أو الترتيب أو المقارنات أو القطاع.","role":"زاد","placeholder":"اسأل عن بنك أو ترتيب أو القطاع...","send":"↑","errMsg":"تعذّر الاتصال. حاول مرة أخرى.","chips":[{"label":"نظرة على القطاع","prompt":"أعطني نظرة موجزة عن القطاع المصرفي الأردني لآخر سنة مالية."},{"label":"ترتيب البنوك حسب الأصول","prompt":"رتّب أكبر البنوك الأردنية حسب إجمالي الأصول في آخر سنة مالية."},{"label":"العربي مقابل الإسكان","prompt":"قارن بين البنك العربي وبنك الإسكان من حيث إجمالي الأصول وصافي الربح والعائد على حقوق الملكية."},{"label":"الأعلى ربحية","prompt":"ما البنوك الأردنية الأعلى في صافي الربح والعائد على حقوق الملكية في آخر سنة؟"}]}};

var NL = String.fromCharCode(10);
var BT = String.fromCharCode(96) + String.fromCharCode(96) + String.fromCharCode(96);
var BULLET = String.fromCharCode(8226);

function fmtInline(s) {
  var parts = s.split('**');
  return parts.map(function (p, i) { return i % 2 === 1 ? React.createElement('strong', { key: i }, p) : p; });
}

function stripMarker(t) {
  if (t.indexOf('- ') === 0) return t.slice(2);
  if (t.indexOf('* ') === 0) return t.slice(2);
  if (t.charAt(0) === BULLET) return t.slice(1).trim();
  return t;
}

function cfEsc(s) {
  return String(s).split('&').join('&amp;').split('<').join('&lt;').split('>').join('&gt;')
}
function cfInline(s) {
  s = cfEsc(s)
  var p = s.split('**'); var o = ''; for (var i = 0; i < p.length; i++) { o += (i % 2 === 1) ? ('<strong>' + p[i] + '</strong>') : p[i] } s = o
  var bt = String.fromCharCode(96)
  p = s.split(bt); o = ''; for (var k = 0; k < p.length; k++) { o += (k % 2 === 1) ? ('<code>' + p[k] + '</code>') : p[k] } s = o
  s = s.replace(/\[([^\]]+)\]\((\/[^)\s]+|https?:\/\/[^)\s]+)\)/g, '<a href="$2" class="zc-link">$1</a>')
  return s
}
function cfIsSep(line) {
  var t = line.split('|').join('').split('-').join('').split(':').join('').split(' ').join('')
  return t === '' && line.indexOf('-') >= 0
}
function cfCells(line) {
  var p = line.split('|')
  if (p.length && p[0].trim() === '') p = p.slice(1)
  if (p.length && p[p.length - 1].trim() === '') p = p.slice(0, p.length - 1)
  var o = []; for (var i = 0; i < p.length; i++) { o.push(p[i].trim()) } return o
}
function cfIsOL(t) {
  var k = 0; while (k < t.length && t.charCodeAt(k) >= 48 && t.charCodeAt(k) <= 57) k++
  return k > 0 && t.charAt(k) === '.' && t.charAt(k + 1) === ' '
}
function cfOLText(t) {
  var k = 0; while (k < t.length && t.charCodeAt(k) >= 48 && t.charCodeAt(k) <= 57) k++
  return t.slice(k + 2)
}
function mdToHtml(md) {
  if (md == null) return ''
  var lines = String(md).split(String.fromCharCode(10))
  var html = ''; var i = 0
  while (i < lines.length) {
    var line = lines[i]; var t = line.trim()
    if (t.indexOf('|') >= 0 && i + 1 < lines.length && cfIsSep(lines[i + 1])) {
      var head = cfCells(line); var body = []; var j = i + 2
      while (j < lines.length && lines[j].indexOf('|') >= 0 && lines[j].trim() !== '') { body.push(cfCells(lines[j])); j++ }
      var tb = '<table class="cf-md-table"><thead><tr>'
      for (var h = 0; h < head.length; h++) { tb += '<th>' + cfInline(head[h]) + '</th>' }
      tb += '</tr></thead><tbody>'
      for (var b = 0; b < body.length; b++) { tb += '<tr>'; for (var c = 0; c < body[b].length; c++) { tb += '<td>' + cfInline(body[b][c]) + '</td>' } tb += '</tr>' }
      tb += '</tbody></table>'; html += tb; i = j; continue
    }
    if (t.indexOf('### ') === 0) { html += '<div class="cf-md-h">' + cfInline(t.slice(4)) + '</div>'; i++; continue }
    if (t.indexOf('## ') === 0) { html += '<div class="cf-md-h">' + cfInline(t.slice(3)) + '</div>'; i++; continue }
    if (t.indexOf('# ') === 0) { html += '<div class="cf-md-h">' + cfInline(t.slice(2)) + '</div>'; i++; continue }
    if (t.indexOf('- ') === 0 || t.indexOf('* ') === 0) {
      var items = []; while (i < lines.length) { var lt = lines[i].trim(); if (lt.indexOf('- ') === 0 || lt.indexOf('* ') === 0) { items.push(lt.slice(2)); i++ } else break }
      html += '<ul class="cf-md-ul">'; for (var u = 0; u < items.length; u++) { html += '<li>' + cfInline(items[u]) + '</li>' } html += '</ul>'; continue
    }
    if (cfIsOL(t)) {
      var oi = []; while (i < lines.length) { var l2 = lines[i].trim(); if (cfIsOL(l2)) { oi.push(cfOLText(l2)); i++ } else break }
      html += '<ol class="cf-md-ol">'; for (var z = 0; z < oi.length; z++) { html += '<li>' + cfInline(oi[z]) + '</li>' } html += '</ol>'; continue
    }
    if (t === '') { i++; continue }
    var para = []
    while (i < lines.length) { var pl = lines[i].trim(); if (pl === '' || pl.indexOf('|') >= 0 || pl.indexOf('# ') === 0 || pl.indexOf('## ') === 0 || pl.indexOf('### ') === 0 || pl.indexOf('- ') === 0 || pl.indexOf('* ') === 0 || cfIsOL(pl)) break; para.push(pl); i++ }
    if (para.length) { html += '<p class="cf-md-p">' + cfInline(para.join(' ')) + '</p>' }
  }
  return html
}
function stripChartBlock(text) {
  var ci = text.indexOf(BT + 'chart'); if (ci < 0) return text;
  var ns = text.indexOf(NL, ci); if (ns < 0) return text;
  var je = text.indexOf(BT, ns); if (je < 0) return text;
  var st = ci; while (st > 0 && text.charAt(st - 1) === BT) { st--; }
  var en = je; while (en < text.length && text.charAt(en) === BT) { en++; }
  var o = (text.slice(0, st) + text.slice(en));
  while (o.indexOf(NL + NL + NL) >= 0) { o = o.split(NL + NL + NL).join(NL + NL); }
  return o.trim();
}
function renderRich(text) {
  return <div className="cf-md" dangerouslySetInnerHTML={{ __html: mdToHtml(stripChartBlock(text)).split('<code></code>').join('') }} />
}

function parseChart(text) {
  var ci = text.indexOf(BT + 'chart');
  if (ci < 0) return null;
  var jstart = text.indexOf(NL, ci);
  if (jstart < 0) return null;
  var jend = text.indexOf(BT, jstart);
  if (jend < 0) return null;
  try { var obj = JSON.parse(text.slice(jstart, jend).trim()); if (obj && obj.series && obj.series.length) return obj; } catch (e) {}
  return null;
}

function ZLineChart(c) {
  var series = c.series.slice(0, 12);
  var nums = series.map(function (s) { return Number(s.value) || 0; });
  var maxV = Math.max.apply(null, nums);
  var minV = Math.min.apply(null, nums);
  var rng = (maxV - minV) || Math.abs(maxV) || 1;
  var lo = minV - rng * 0.18, hi = maxV + rng * 0.18, span = (hi - lo) || 1;
  var W = 520, H = 158, padL = 10, padR = 16, padT = 16, padB = 28;
  var n = series.length, plotW = W - padL - padR, plotH = H - padT - padB;
  function xAt(i) { return padL + (n <= 1 ? plotW / 2 : (plotW * i) / (n - 1)); }
  function yAt(v) { return padT + plotH - ((v - lo) / span) * plotH; }
  var ptsArr = series.map(function (s, i) { return xAt(i) + ',' + yAt(Number(s.value) || 0); });
  var area = 'M ' + padL + ',' + (padT + plotH) + ' L ' + ptsArr.join(' L ') + ' L ' + (padL + plotW) + ',' + (padT + plotH) + ' Z';
  var nodes = series.map(function (s, i) {
    var vx = xAt(i), vy = yAt(Number(s.value) || 0); var anc = (i === 0) ? 'start' : (i === n - 1) ? 'end' : 'middle';
    return React.createElement('g', { key: i },
      React.createElement('circle', { cx: vx, cy: vy, r: 3.6, fill: 'var(--cf-primary)', stroke: '#ffffff', strokeWidth: 1.5 }),
      React.createElement('text', { x: vx, y: vy - 9, textAnchor: anc, fontSize: 11, fontWeight: 700, fill: 'var(--cf-ink)' }, (Math.round((Number(s.value) || 0) * 100) / 100).toLocaleString()),
      React.createElement('text', { x: vx, y: H - 9, textAnchor: anc, fontSize: 10, fill: 'var(--cf-ink3)' }, String(s.label)));
  });
  var fillEl = React.createElement('path', { d: area, fill: 'rgba(31,111,235,0.10)', stroke: 'none' });
  var lineEl = React.createElement('polyline', { points: ptsArr.join(' '), fill: 'none', stroke: 'var(--cf-primary)', strokeWidth: 2.5, strokeLinejoin: 'round', strokeLinecap: 'round' });
  var svg = React.createElement('svg', { viewBox: '0 0 ' + W + ' ' + H, preserveAspectRatio: 'xMidYMid meet', style: { display: 'block', width: '100%', height: 'auto' } }, fillEl, lineEl, nodes);
  return React.createElement('div', { className: 'zc-chart' },
    c.title ? React.createElement('div', { className: 'zc-charttitle' }, c.title) : null,
    c.unit ? React.createElement('div', { style: { fontSize: '11px', color: 'var(--cf-ink3)', marginTop: '-2px', marginBottom: '6px' } }, c.unit) : null,
    svg);
}
function ZChart(props) {
  var c = props.data;
  var vals = c.series.map(function (s) { return Math.abs(Number(s.value) || 0); });
  var max = Math.max.apply(null, vals) || 1;
  function zcIsYr(L) { L = String(L); for (var qi = 0; qi + 4 <= L.length; qi++) { var ok = true; for (var qk = 0; qk < 4; qk++) { var cc = L.charCodeAt(qi + qk); if (cc < 48 || cc > 57) { ok = false; break; } } if (ok) { var yn = Number(L.substr(qi, 4)); if (yn >= 1990 && yn <= 2099) return true; } } return false; }
  var zcLine = (c.type === 'line') || (c.series.length >= 2 && c.series.every(function (s) { return zcIsYr(s.label); }));
  if (!c.series || c.series.length < 2) return null;
  if (zcLine) return ZLineChart(c);
  var rows = c.series.slice(0, 8).map(function (s, i) {
    var v = Number(s.value) || 0;
    var pct = Math.max(2, (Math.abs(v) / max) * 100);
    return React.createElement('div', { className: 'zc-bar-row', key: i },
      React.createElement('div', { className: 'zc-bar-label', title: String(s.label) }, String(s.label)),
      React.createElement('div', { className: 'zc-bar-track' }, React.createElement('div', { className: 'zc-bar-fill', style: { width: pct + '%' } })),
      React.createElement('div', { className: 'zc-bar-val' }, (Math.round(v * 100) / 100).toLocaleString()));
  });
  return React.createElement('div', { className: 'zc-chart' },
    c.title ? React.createElement('div', { className: 'zc-charttitle' }, c.title) : null,
    c.unit ? React.createElement('div', { className: 'zc-chartunit' }, c.unit) : null,
    rows);
}

export default function ZadChat() {
  var fz = useState(''); var focusVal = fz[0]; var setFocusVal = fz[1];
  useEffect(function () { try { if (typeof window !== 'undefined' && window.location && window.location.search) { var ff = new URLSearchParams(window.location.search).get('focus'); if (ff) { setFocusVal(ff); } } } catch (e) {} }, []);
  var a = useState('en'); var lang = a[0]; var setLang = a[1];
  var b = useState([]); var msgs = b[0]; var setMsgs = b[1];
  var c = useState(''); var input = c[0]; var setInput = c[1];
  var d = useState(false); var busy = d[0]; var setBusy = d[1];
  var e = useState(false); var errd = e[0]; var setErr = e[1];
  var endRef = useRef(null);

  useEffect(function () { try { var l = localStorage.getItem('lang'); if (l === 'ar' || l === 'en') setLang(l); } catch (x) {} }, []);
  React.useEffect(function () { function syncLang() { try { var l2 = localStorage.getItem('lang'); if (l2 === 'ar' || l2 === 'en') setLang(l2); } catch (x) {} } window.addEventListener('cf-lang', syncLang); return function () { window.removeEventListener('cf-lang', syncLang); }; }, []);
  useEffect(function () { if (window.__cfAuto) return; window.__cfAuto = true; try { var bid = new URLSearchParams(location.search).get('bank'); var arNow = false; try { arNow = localStorage.getItem('lang') === 'ar'; } catch (x) {} var q; if (bid) { var bk = BANKS.find(function (b) { return String(b.id) === String(bid); }); var nm = bk ? (arNow && bk.nameAr ? bk.nameAr : bk.name) : ('the bank with id=' + bid); q = arNow ? ('\u0623\u0646\u0634\u0626 \u0644\u0648\u062d\u0629 \u0645\u0639\u0644\u0648\u0645\u0627\u062a \u0644\u0640 ' + nm) : ('Create a dashboard for ' + nm); } else { q = arNow ? '\u0623\u0646\u0634\u0626 \u0644\u0648\u062d\u0629 \u0645\u0639\u0644\u0648\u0645\u0627\u062a \u0645\u0627\u0644\u064a\u0629 \u0644\u062c\u0645\u064a\u0639 \u0627\u0644\u0628\u0646\u0648\u0643 \u0645\u0639 \u0645\u0642\u0627\u0631\u0646\u0629 \u0627\u0644\u0646\u0645\u0648 \u0644\u062b\u0644\u0627\u062b \u0633\u0646\u0648\u0627\u062a' : 'Create a financial dashboard for all banks: FY2025 key metrics per bank and growth comparison across the last 3 years'; } setTimeout(function () { ask(q); }, 80); } catch (e) {} }, []);
  useEffect(function () { try { document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'; document.documentElement.lang = lang; } catch (x) {} }, [lang]);
  useEffect(function () { try { if (endRef.current) endRef.current.scrollIntoView({ behavior: 'smooth' }); } catch (x) {} }, [msgs, busy]);

  var t = T[lang];

  function toggleLang() { var n = lang === 'en' ? 'ar' : 'en'; setLang(n); try { localStorage.setItem('lang', n); } catch (x) {} }

  function ask(q) {
    var text = (q != null ? q : input).trim();
    if (!text || busy) return;
    setErr(false);
    var next = msgs.concat([{ role: 'user', content: text }]);
    setMsgs(next); setInput(''); setBusy(true);
    var payload = JSON.stringify({ messages: next.map(function (m) { return { role: m.role, content: m.content }; }), lang: lang });
    fetch('/api/zad', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload })
      .then(function (r) { return r.json(); })
      .then(function (data) { if (data && data.text) { setMsgs(next.concat([{ role: 'assistant', content: data.text }])); } else { setErr(true); } setBusy(false); })
      .catch(function () { setErr(true); setBusy(false); });
  }

  function onKey(ev) { if (ev.key === 'Enter' && !ev.shiftKey) { ev.preventDefault(); ask(); } }

  var headerEl = React.createElement('div', { className: 'zc-header' },
    React.createElement('a', { className: 'zc-brand', href: '/' },
      React.createElement('div', { className: 'zc-logo' }, React.createElement('img',{src:'/convo-zad-en.svg',alt:'ZAD',style:{width:'100%',height:'100%',display:'block'}})),
      React.createElement('div', null,
        React.createElement('div', { className: 'zc-bt' }, 'convo.finance'),
        React.createElement('div', { className: 'zc-bs' }, t.brandSub))),
    React.createElement('button', { className: 'zc-lang', onClick: toggleLang }, t.langLabel));

  var content;
  if (!msgs.length && !busy) {
    content = React.createElement('div', { className: 'zc-empty' },
      React.createElement('div', { className: 'zc-eyebrow' }, t.eyebrow),
      React.createElement('div', { className: 'zc-etitle' }, t.etitle),
      React.createElement('div', { className: 'zc-esub' }, t.esub),
      React.createElement('div', { className: 'zc-chips' }, ((focusVal && t.chipsByFocus && t.chipsByFocus[focusVal]) ? t.chipsByFocus[focusVal] : t.chips).map(function (ch, i) {
        return React.createElement('button', { className: 'zc-chip', key: i, onClick: function () { ask(ch.prompt); } }, ch.label);
      })));
  } else {
    var bubbles = msgs.map(function (m, i) {
      if (m.role === 'user') return React.createElement('div', { className: 'zc-msg zc-user', key: i }, m.content);
      var chart = parseChart(m.content);
      return React.createElement('div', { className: 'zc-msg zc-zad', key: i },
        React.createElement('div', { className: 'zc-role' }, t.role),
        React.createElement('div', null, renderRich(m.content)),
        chart ? React.createElement(ZChart, { data: chart }) : null);
    });
    if (busy) bubbles.push(React.createElement('div', { className: 'zc-loading', key: 'load' },
      React.createElement('div', { className: 'zc-dot' }), React.createElement('div', { className: 'zc-dot' }), React.createElement('div', { className: 'zc-dot' })));
    if (errd) bubbles.push(React.createElement('div', { className: 'zc-err', key: 'err' }, t.errMsg));
    content = React.createElement('div', { className: 'zc-messages' }, bubbles, React.createElement('div', { key: 'end', ref: endRef }));
  }

  var inputBar = React.createElement('div', { className: 'zc-inputbar' },
    React.createElement('div', { className: 'zc-inputinner' },
      React.createElement('textarea', { className: 'zc-input', rows: 1, value: input, placeholder: t.placeholder, onChange: function (ev) { setInput(ev.target.value); }, onKeyDown: onKey }),
      React.createElement('button', { className: 'zc-send', onClick: function () { ask(); }, disabled: busy || !input.trim() }, t.send)));

  return React.createElement('div', { className: 'zc-wrap' },
    React.createElement('style', { dangerouslySetInnerHTML: { __html: CSS } }),

    React.createElement('div', { className: 'zc-main' }, content),
    inputBar);
}

