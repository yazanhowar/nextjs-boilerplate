// Canonical ZAD markdown renderer - the single source of truth for EVERY ZAD answer surface.
// Any surface that shows ZAD output must render through zadMdToHtml and include ZAD_MD_CSS once.
function cfEsc(x: any) { return String(x == null ? '' : x).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;') }
function cfChartSvg(body: string): string {
  try {
    var spec = JSON.parse(String(body).trim())
    var type = String(spec.type || 'bar')
    var labels: any[] = Array.isArray(spec.labels) ? spec.labels.slice(0, 10) : []
    var series: any[] = Array.isArray(spec.series) ? spec.series.slice(0, 4) : []
    var title = cfEsc(spec.title || '')
    var unit = cfEsc(spec.unit || '')
    var CLR = ['#0f4c81', '#c9a227', '#2a9d8f', '#7ea8c9', '#8b9bb0', '#b3382c']
    var W = 460, H = 210, padT = title ? 26 : 10, padB = 24, padL = 6, padR = 6
    var body2 = ''
    var head = title ? '<text x="6" y="15" font-size="11.5" font-weight="800" fill="#3d4f66">' + title + '</text>' : ''
    if (type === 'donut') {
      var vals: any[] = (series.length && Array.isArray(series[0].values)) ? series[0].values : []
      var tot = 0; vals.forEach(function (v: any) { tot += Math.max(0, Number(v) || 0) })
      if (!tot) throw new Error('empty')
      var cx = 105, cy = padT + 82, R = 66, r0 = 40, a = -Math.PI / 2
      for (var i = 0; i < vals.length && i < 8; i++) {
        var frac = Math.max(0, Number(vals[i]) || 0) / tot
        var a2 = a + frac * Math.PI * 2
        var large = (a2 - a) > Math.PI ? 1 : 0
        var x1 = cx + R * Math.cos(a), y1 = cy + R * Math.sin(a), x2 = cx + R * Math.cos(a2), y2 = cy + R * Math.sin(a2)
        var x3 = cx + r0 * Math.cos(a2), y3 = cy + r0 * Math.sin(a2), x4 = cx + r0 * Math.cos(a), y4 = cy + r0 * Math.sin(a)
        body2 += '<path d="M ' + x1.toFixed(1) + ' ' + y1.toFixed(1) + ' A ' + R + ' ' + R + ' 0 ' + large + ' 1 ' + x2.toFixed(1) + ' ' + y2.toFixed(1) + ' L ' + x3.toFixed(1) + ' ' + y3.toFixed(1) + ' A ' + r0 + ' ' + r0 + ' 0 ' + large + ' 0 ' + x4.toFixed(1) + ' ' + y4.toFixed(1) + ' Z" fill="' + CLR[i % CLR.length] + '"/>'
        var ly = padT + 14 + i * 20
        body2 += '<rect x="210" y="' + (ly - 9) + '" width="10" height="10" rx="2" fill="' + CLR[i % CLR.length] + '"/>'
        body2 += '<text x="226" y="' + ly + '" font-size="10.5" fill="#3d4f66">' + cfEsc(labels[i] != null ? labels[i] : 'Item ' + (i + 1)) + ' \u00b7 ' + (frac * 100).toFixed(1) + '%</text>'
      }
    } else {
      var mx = 0
      series.forEach(function (s: any) { (s.values || []).forEach(function (v: any) { var n = Number(v); if (isFinite(n) && n > mx) mx = n }) })
      if (!mx) throw new Error('empty')
      var plotW = W - padL - padR, plotH = H - padT - padB
      for (var gI = 1; gI <= 3; gI++) {
        var gy = padT + plotH - plotH * gI / 3
        body2 += '<line x1="' + padL + '" y1="' + gy.toFixed(1) + '" x2="' + (W - padR) + '" y2="' + gy.toFixed(1) + '" stroke="#e5eaf2" stroke-width="1"/>'
        body2 += '<text x="' + padL + '" y="' + (gy - 3).toFixed(1) + '" font-size="9" fill="#9fb0c3">' + (mx * gI / 3 >= 100 ? Math.round(mx * gI / 3).toLocaleString() : (mx * gI / 3).toFixed(1)) + '</text>'
      }
      var n = Math.max(labels.length, (series[0] && series[0].values || []).length)
      var step = plotW / Math.max(n, 1)
      if (type === 'line') {
        series.forEach(function (s: any, si: number) {
          var pts = ''
          ;(s.values || []).forEach(function (v: any, vi: number) { var y = padT + plotH - Math.max(0, Number(v) || 0) / mx * plotH; pts += (padL + step * (vi + 0.5)).toFixed(1) + ',' + y.toFixed(1) + ' ' })
          body2 += '<polyline points="' + pts + '" fill="none" stroke="' + CLR[si % CLR.length] + '" stroke-width="2"/>'
        })
      } else {
        var bw = Math.min(26, step / Math.max(series.length, 1) * 0.7)
        for (var li = 0; li < n; li++) {
          series.forEach(function (s: any, si: number) {
            var v = Math.max(0, Number((s.values || [])[li]) || 0)
            var bh = v / mx * plotH
            var bx = padL + step * li + step / 2 - (bw * series.length) / 2 + si * bw
            body2 += '<rect x="' + bx.toFixed(1) + '" y="' + (padT + plotH - bh).toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + bh.toFixed(1) + '" rx="2" fill="' + CLR[si % CLR.length] + '"/>'
          })
        }
      }
      var every = Math.ceil(n / 7)
      for (var xi = 0; xi < n; xi += every) {
        body2 += '<text x="' + (padL + step * (xi + 0.5)).toFixed(1) + '" y="' + (H - 7) + '" font-size="9.5" fill="#7d8ea3" text-anchor="middle">' + cfEsc(labels[xi] != null ? labels[xi] : xi + 1) + '</text>'
      }
      if (series.length > 1) {
        series.forEach(function (s: any, si: number) {
          body2 += '<rect x="' + (padL + si * 110) + '" y="' + (padT - 8) + '" width="9" height="9" rx="2" fill="' + CLR[si % CLR.length] + '"/>'
          body2 += '<text x="' + (padL + 13 + si * 110) + '" y="' + padT + '" font-size="9.5" fill="#3d4f66">' + cfEsc(s.name || 'Series ' + (si + 1)) + '</text>'
        })
      }
    }
    var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;display:block">' + head + body2 + '</svg>'
    return '<div style="margin:10px 0;border:1px solid #e5eaf2;border-radius:10px;padding:10px 8px;background:#fbfcfe">' + svg + (unit ? '<div style="font-size:10px;color:#7d8ea3;margin-top:4px">' + unit + '</div>' : '') + '</div>'
  } catch (e) {
    return '<pre style="font-size:10.5px;overflow:auto">' + cfEsc(body) + '</pre>'
  }
}
export function zadMdToHtml(md: any): string {
  var t = String(md == null ? '' : md)
  t = t.replace(/```chart([\s\S]*?)```/g, function (_m: any, b: string) { return cfChartSvg(b) })
  t = t.replace(/```[\s\S]*?```/g, '')
  function esc(x: string) { return x.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') }
  function inline(x: string) {
    x = esc(x)
    var parts = x.split('**'); var o = ''
    for (var bi = 0; bi < parts.length; bi++) { o += (bi % 2 === 1) ? ('<strong>' + parts[bi] + '</strong>') : parts[bi] }
    x = o
    var bt = String.fromCharCode(96)
    parts = x.split(bt); o = ''
    for (var ci = 0; ci < parts.length; ci++) { o += (ci % 2 === 1) ? ('<code>' + parts[ci] + '</code>') : parts[ci] }
    x = o
    x = x.replace(/\[([^\]]+)\]\((\/[^)\s]+|https?:\/\/[^)\s]+)\)/g, '<a href="$2" class="zmd-a">$1</a>')
    return x
  }
  function isSep(l: string) { l = l || ''; return l.indexOf('|') >= 0 && l.indexOf('-') >= 0 && /^[\s|:\-]+$/.test(l) }
  function cells(l: string) { var p = l.split('|'); if (p.length && !p[0].trim()) p.shift(); if (p.length && !p[p.length - 1].trim()) p.pop(); return p.map(function (x) { return x.trim() }) }
  var lines = t.split('\n'); var html = ''; var i = 0
  while (i < lines.length) {
    var line = lines[i]; var tr = line.trim()
    if (!tr) { i++; continue }
    if (tr === '---' || tr === '***') { html += '<hr class="zmd-hr">'; i++; continue }
    if (tr.indexOf('|') >= 0 && i + 1 < lines.length && isSep(lines[i + 1])) {
      var head = cells(line); var body: string[][] = []; var j = i + 2
      while (j < lines.length && lines[j].indexOf('|') >= 0 && lines[j].trim() !== '') { body.push(cells(lines[j])); j++ }
      html += '<div class="zmd-tw"><table class="zmd-t"><thead><tr>' + head.map(function (h) { return '<th>' + inline(h) + '</th>' }).join('') + '</tr></thead><tbody>' + body.map(function (r) { return '<tr>' + r.map(function (c) { return '<td>' + inline(c) + '</td>' }).join('') + '</tr>' }).join('') + '</tbody></table></div>'
      i = j; continue
    }
    if (tr.charAt(0) === '#') { var h0 = 0; while (h0 < tr.length && tr.charAt(h0) === '#') h0++; html += '<div class="zmd-h zmd-h' + Math.min(h0, 3) + '">' + inline(tr.slice(h0).trim()) + '</div>'; i++; continue }
    if (/^[-*]\s+/.test(tr)) { html += '<div class="zmd-li">\u2022 ' + inline(tr.replace(/^[-*]\s+/, '')) + '</div>'; i++; continue }
    html += '<p class="zmd-p">' + inline(tr) + '</p>'; i++
  }
  return html
}

export const ZAD_MD_CSS = '.zmd-p{margin:0 0 9px;line-height:1.65}.zmd-li{margin:0 0 5px;line-height:1.6}.zmd-hr{border:none;border-top:1px solid var(--cf-line);margin:14px 0}.zmd-h{font-weight:800;color:var(--cf-ink);margin:10px 0 7px}.zmd-h1{font-size:16px}.zmd-h2{font-size:14.5px}.zmd-h3{font-size:13px}.zmd-tw{overflow-x:auto;margin:10px 0}.zmd-t{border-collapse:collapse;width:100%;font-size:12px}.zmd-t th{background:var(--cf-surface2);color:var(--cf-ink2);text-align:start;padding:6px 10px;border:1px solid var(--cf-line);font-weight:600;white-space:nowrap}.zmd-t td{padding:6px 10px;border:1px solid var(--cf-line);color:var(--cf-ink)}.zmd-a{color:var(--cf-primary);font-weight:600;text-decoration:none;border-bottom:1px solid var(--cf-line)}.zmd-a:hover{border-bottom-color:var(--cf-primary)}'
