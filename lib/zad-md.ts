// Canonical ZAD markdown renderer - the single source of truth for EVERY ZAD answer surface.
// Any surface that shows ZAD output must render through zadMdToHtml and include ZAD_MD_CSS once.
export function zadMdToHtml(md: any): string {
  var t = String(md == null ? '' : md)
  t = t.replace(/```chart[\s\S]*?```/g, '')
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
