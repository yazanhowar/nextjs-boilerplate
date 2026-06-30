'use client'

import { useState, useEffect, useRef } from 'react'

function hasArabic(s){
  if(typeof s !== 'string') return false
  for(var i=0;i<s.length;i++){ var c=s.charCodeAt(i); if(c>=1536 && c<=1791) return true }
  return false
}

function cleanNum(s){
  var out=''
  for(var i=0;i<s.length;i++){ var ch=s.charAt(i); var c=s.charCodeAt(i); if((c>=48 && c<=57) || ch==='.' || ch==='-') out+=ch }
  return out
}

function toNum(v){
  if(v===null || v===undefined) return null
  if(typeof v==='number'){ return isFinite(v) ? v : null }
  if(typeof v==='string'){ var c=cleanNum(v); if(c==='' || c==='-' || c==='.') return null; var n=parseFloat(c); return isFinite(n) ? n : null }
  return null
}

function isDigitSpec(v){ return v===17.3 || v===10 || v===500 }

var K_ARQAM = String.fromCharCode(1571,1585,1602,1575,1605)
var K_NOQ = String.fromCharCode(1606,1608,1593,32,1575,1604,1576,1610,1575,1606,1575,1578)
var K_ADAD = String.fromCharCode(1593,1583,1583,32,1575,1604,1582,1575,1606,1575,1578)
var T1 = String.fromCharCode(1605,1580,1605,1608,1593)
var T2 = String.fromCharCode(1589,1575,1601,1609)
var T3 = String.fromCharCode(1589,1575,1601,1610)
var T4 = String.fromCharCode(1573,1580,1605,1575,1604,1610)
var T5 = String.fromCharCode(1575,1580,1605,1575,1604,1610)

function isKeyword(s){
  if(s===K_ARQAM) return true
  if(s===K_NOQ) return true
  if(s.indexOf(K_ADAD)===0) return true
  return false
}

function isTotalLabel(s){
  if(s.indexOf(T1)>=0) return true
  if(s.indexOf(T2)>=0) return true
  if(s.indexOf(T3)>=0) return true
  if(s.indexOf(T4)>=0) return true
  if(s.indexOf(T5)>=0) return true
  return false
}

function longestArabicLabel(row){
  var best=''
  for(var i=0;i<row.length;i++){
    var cell=row[i]
    if(typeof cell==='string' && hasArabic(cell)){
      var t=cell.trim()
      if(isKeyword(t)) continue
      if(t.length>best.length) best=t
    }
  }
  return best
}

function lastNumeric(row){
  var val=null
  for(var i=0;i<row.length;i++){
    var n=toNum(row[i])
    if(n!==null && !isDigitSpec(n)) val=n
  }
  return val
}

function firstTitle(rows){
  var lim=Math.min(6, rows.length)
  for(var r=0;r<lim;r++){
    var row=rows[r]
    if(!row) continue
    for(var i=0;i<row.length;i++){
      var cell=row[i]
      if(typeof cell==='string' && hasArabic(cell)){
        var t=cell.trim()
        if(isKeyword(t)) continue
        if(t.length>=8) return t
      }
    }
  }
  return ''
}

function scoreSheet(rows){
  var sc=0
  for(var r=0;r<rows.length;r++){
    var row=rows[r]; if(!row) continue
    var hasN=false, hasA=false
    for(var i=0;i<row.length;i++){
      var n=toNum(row[i]); if(n!==null && n>0 && !isDigitSpec(n)) hasN=true
      if(typeof row[i]==='string' && hasArabic(row[i])) hasA=true
    }
    if(hasN && hasA) sc++
  }
  return sc
}

function parseCBJ(wb){
  var X = window.XLSX
  var names = wb.SheetNames || []
  var chosen = null
  for(var i=0;i<names.length;i++){ if(names[i].toLowerCase().indexOf('snapshoot')>=0){ chosen=names[i]; break } }
  if(!chosen){
    var best=-1
    for(var j=0;j<names.length;j++){
      var rws = X.utils.sheet_to_json(wb.Sheets[names[j]], { header:1, raw:true, defval:null })
      var s = scoreSheet(rws)
      if(s>best){ best=s; chosen=names[j] }
    }
  }
  if(!chosen) return null
  var rows = X.utils.sheet_to_json(wb.Sheets[chosen], { header:1, raw:true, defval:null })
  var title = firstTitle(rows)
  var entries = []
  for(var k=0;k<rows.length;k++){
    if(k===0) continue
    var row = rows[k]; if(!row) continue
    var label = longestArabicLabel(row)
    var value = lastNumeric(row)
    if(label==='' && value===null) continue
    if(value===null){
      if(label!=='') entries.push({ kind:'section', label:label, value:null, total:false })
    } else {
      var tot = label!=='' ? isTotalLabel(label) : false
      entries.push({ kind:'item', label:label, value:value, total:tot })
    }
  }
  var items = entries.filter(function(e){ return e.kind==='item' })
  var totals = items.filter(function(e){ return e.total })
  var barSrc = items.filter(function(e){ return !e.total })
  barSrc.sort(function(a,b){ return Math.abs(b.value)-Math.abs(a.value) })
  var bars = barSrc.slice(0,10)
  var maxBar = 0
  for(var b=0;b<bars.length;b++){ if(Math.abs(bars[b].value)>maxBar) maxBar=Math.abs(bars[b].value) }
  var kpis = totals.slice(0,4)
  if(kpis.length===0) kpis = items.slice(0,4)
  return { sheetName:chosen, title:title, entries:entries, items:items, totals:totals, bars:bars, maxBar:maxBar, kpis:kpis, count:items.length }
}

function fmt(n){
  if(n===null || n===undefined || !isFinite(n)) return '-'
  var a=Math.abs(n)
  if(a>=1e9) return (n/1e9).toFixed(2)+'B'
  if(a>=1e6) return (n/1e6).toFixed(2)+'M'
  if(a>=1e3) return (n/1e3).toFixed(1)+'K'
  return n.toLocaleString()
}

export default function ReportStudio(){
  const [xlsxReady, setXlsxReady] = useState(false)
  const [loadErr, setLoadErr] = useState(false)
  const [result, setResult] = useState(null)
  const [err, setErr] = useState('')
  const [fileName, setFileName] = useState('')
  const inp = useRef(null)

  useEffect(function(){
    if(window.XLSX){ setXlsxReady(true); return }
    var ex = document.getElementById('cf-xlsx-cdn')
    if(ex){ ex.addEventListener('load', function(){ setXlsxReady(true) }); return }
    var sc = document.createElement('script')
    sc.id = 'cf-xlsx-cdn'
    sc.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'
    sc.onload = function(){ setXlsxReady(true) }
    sc.onerror = function(){ setLoadErr(true) }
    document.body.appendChild(sc)
  }, [])

  function onFile(e){
    var f = e.target.files && e.target.files[0]
    if(!f) return
    setFileName(f.name); setErr(''); setResult(null)
    var reader = new FileReader()
    reader.onload = function(ev){
      try{
        var data = new Uint8Array(ev.target.result)
        var wb = window.XLSX.read(data, { type:'array' })
        var parsed = parseCBJ(wb)
        if(!parsed || parsed.count===0){ setErr('No tabular data found in this file.'); return }
        setResult(parsed)
      }catch(ex){ setErr('Could not parse this file. ' + String(ex && ex.message ? ex.message : ex)) }
    }
    reader.onerror = function(){ setErr('Could not read the file.') }
    reader.readAsArrayBuffer(f)
  }

  function pickFile(){ if(inp.current) inp.current.click() }

  var mid = String.fromCharCode(183)

  return (
    <div className='cf-page' style={{ minHeight:'100vh' }}>
      <div style={{ maxWidth:'1100px', margin:'0 auto', padding:'28px 24px 80px' }}>

        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'24px' }}>
          <div>
            <div className='cf-grad-text' style={{ fontSize:'20px', fontWeight:'700', letterSpacing:'-0.01em' }}>convo.finance</div>
            <div className='cf-muted' style={{ fontSize:'12px', marginTop:'2px' }}>Report Studio</div>
          </div>
          <a className='cf-link' href='/banks' style={{ fontSize:'13px' }}>Back to app</a>
        </div>

        <div className='cf-eyebrow' style={{ marginBottom:'6px' }}>UPLOAD</div>
        <h1 className='cf-h1' style={{ marginBottom:'8px' }}>Regulatory report to dashboard</h1>
        <p className='cf-muted' style={{ fontSize:'14px', maxWidth:'640px', marginBottom:'22px' }}>Drop a CBJ Excel return and convo.finance turns it into a structured dashboard with totals, rankings and the full breakdown.</p>

        <div className='cf-card' onClick={pickFile} style={{ border:'1.5px dashed var(--cf-line)', cursor:'pointer', textAlign:'center', padding:'34px 20px', marginBottom:'26px' }}>
          <div style={{ fontSize:'15px', fontWeight:'600', color:'var(--cf-ink)' }}>{ fileName==='' ? 'Choose a CBJ Excel file' : fileName }</div>
          <div className='cf-muted' style={{ fontSize:'12.5px', marginTop:'6px' }}>{ xlsxReady ? ('Click to browse  ' + mid + '  .xls and .xlsx supported') : (loadErr ? 'Engine failed to load - refresh the page' : 'Loading engine...') }</div>
          <input ref={inp} type='file' accept='.xls,.xlsx' onChange={onFile} style={{ display:'none' }} />
        </div>

        { err!=='' ? (
          <div className='cf-card' style={{ borderColor:'var(--cf-negative)', color:'var(--cf-negative)', fontSize:'13.5px', marginBottom:'26px' }}>{ err }</div>
        ) : null }

        { result ? (
          <div dir='rtl' style={{ fontFamily:'var(--cf-font-ar)' }}>

            <div className='cf-eyebrow' style={{ marginBottom:'6px', direction:'ltr', textAlign:'right' }}>{ result.sheetName + '  ' + mid + '  ' + result.count + ' lines' }</div>
            <h2 className='cf-h2' style={{ marginBottom:'18px' }}>{ result.title==='' ? 'Parsed report' : result.title }</h2>

            { result.kpis.length>0 ? (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:'12px', marginBottom:'26px' }}>
                { result.kpis.map(function(k, idx){
                  return (
                    <div key={idx} className='cf-card cf-stat' style={{ padding:'16px' }}>
                      <div className='cf-stat-label'>{ k.label }</div>
                      <div className='cf-stat-value' style={{ direction:'ltr', textAlign:'right' }}>{ fmt(k.value) }</div>
                      <div className='cf-muted' style={{ fontSize:'11px', direction:'ltr', textAlign:'right' }}>JOD</div>
                    </div>
                  )
                }) }
              </div>
            ) : null }

            { result.bars.length>0 ? (
              <div className='cf-card' style={{ marginBottom:'26px', padding:'18px' }}>
                <div className='cf-eyebrow' style={{ marginBottom:'14px' }}>TOP LINES</div>
                { result.bars.map(function(bar, idx){
                  var pct = result.maxBar>0 ? Math.round(Math.abs(bar.value)/result.maxBar*100) : 0
                  return (
                    <div key={idx} style={{ marginBottom:'12px' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:'4px', gap:'12px' }}>
                        <span style={{ fontSize:'13px', color:'var(--cf-ink)' }}>{ bar.label }</span>
                        <span style={{ fontSize:'12.5px', fontWeight:'600', color:'var(--cf-ink2)', direction:'ltr' }}>{ fmt(bar.value) }</span>
                      </div>
                      <div style={{ height:'8px', background:'var(--cf-surface2)', borderRadius:'5px', overflow:'hidden' }}>
                        <div style={{ height:'100%', width:(pct+'%'), background:'var(--cf-primary)', borderRadius:'5px' }}></div>
                      </div>
                    </div>
                  )
                }) }
              </div>
            ) : null }

            <div className='cf-card' style={{ padding:'0', overflow:'hidden' }}>
              <div className='cf-eyebrow' style={{ padding:'16px 18px 0' }}>FULL BREAKDOWN</div>
              <table style={{ width:'100%', borderCollapse:'collapse', marginTop:'10px' }}>
                <tbody>
                  { result.entries.map(function(e, idx){
                    if(e.kind==='section'){
                      return (
                        <tr key={idx} style={{ background:'var(--cf-surface2)' }}>
                          <td colSpan={2} style={{ padding:'9px 18px', fontSize:'12px', fontWeight:'700', color:'var(--cf-ink2)', letterSpacing:'0.02em' }}>{ e.label }</td>
                        </tr>
                      )
                    }
                    return (
                      <tr key={idx} style={{ borderTop:'1px solid var(--cf-line)' }}>
                        <td style={{ padding:'9px 18px', fontSize:'13px', fontWeight:(e.total ? '700' : '400'), color:'var(--cf-ink)' }}>{ e.label }</td>
                        <td style={{ padding:'9px 18px', fontSize:'13px', fontWeight:(e.total ? '700' : '500'), color:'var(--cf-ink)', textAlign:'left', direction:'ltr', whiteSpace:'nowrap' }}>{ fmt(e.value) }</td>
                      </tr>
                    )
                  }) }
                </tbody>
              </table>
            </div>

          </div>
        ) : null }

      </div>
    </div>
  )
}
