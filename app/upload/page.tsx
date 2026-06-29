// @ts-nocheck
"use client";

import { useState, useCallback, useRef } from "react";

// ===== validated CBJ parse + aggregate + chart engine =====
// ----- constants -----
var FORMS = { AST01:"FX Sources of Funds", AST02:"FX Sources \u2014 Ratios", AST03:"Money-Market \u2014 Investment-Grade", AST04:"Money-Market \u2014 Sub-Investment-Grade", AST05:"Capital-Market Investments", AST06:"Derivatives \u2014 Volatility", AST07:"Derivatives \u2014 P&L", AST08:"Direct FX Facilities", AST09:"Aggregate Open FX Position", AST10:"Open Position by Currency", HDP:"Top-20 Depositors", INV0102:"FVTPL \u2014 Bills & Bonds", INV0103:"FVTPL \u2014 Funds", INV01010:"Trading Equities", INV02010:"FVOCI Equities", INV03:"Amortized-Cost Assets", INV04:"Subsidiaries & Associates" };
var CORE_FORMS = ["AST01","AST02","AST03","AST04","AST05","AST09","AST10","INV01010","INV02010","INV03"];
var BANKS = { HBTF:"Housing Bank for Trade & Finance" };
var MONTHS = ["","January","February","March","April","May","June","July","August","September","October","November","December"];
var META = ["\u0646\u0648\u0639 \u0627\u0644\u0628\u064a\u0627\u0646\u0627\u062a","\u0639\u062f\u062f \u0627\u0644\u062e\u0627\u0646\u0627\u062a \u0627\u0644\u0645\u0633\u0645\u0648\u062d \u0628\u0625\u062f\u062e\u0627\u0644\u0647\u0627","\u0623\u0631\u0642\u0627\u0645","\u062a\u0627\u0631\u064a\u062e","\u062d\u0631\u0648\u0641 \u0648\u0623\u0631\u0642\u0627\u0645","\u0627\u0644\u0645\u0628\u0644\u063a","\u0631\u0645\u0632 \u0627\u0644\u0639\u0645\u0644\u0629","\u0627\u0644\u0641\u0631\u0639","\u0627\u0644\u062a\u0627\u0631\u064a\u062e","\u0637\u0648\u064a\u0644","\u0642\u0635\u064a\u0631"];
var BOOK_KW = ["\u0627\u0644\u0642\u064a\u0645\u0629 \u0627\u0644\u0645\u062b\u0628\u062a\u0629","\u0627\u0644\u0642\u064a\u0645\u0629 \u0627\u0644\u0639\u0627\u062f\u0644\u0629","\u0635\u0627\u0641\u064a \u0627\u0644\u0642\u064a\u0645\u0629","\u0627\u0644\u0642\u064a\u0645\u0629 \u0627\u0644\u0645\u0639\u0627\u062f\u0644\u0629","\u0627\u0644\u0645\u064f\u062b\u0628\u062a\u0629"];
var NET_KW = ["\u0635\u0627\u0641\u0649 \u0645\u0635\u0627\u062f\u0631","\u0635\u0627\u0641\u064a \u0645\u0635\u0627\u062f\u0631"];
var TOTKULLI = "\u0627\u0644\u0645\u062c\u0645\u0648\u0639 \u0627\u0644\u0643\u0644\u064a";
var EQUITY_KW = "\u062d\u0642\u0648\u0642 \u0627\u0644\u0645\u0633\u0627\u0647\u0645\u064a\u0646";
var POS_KW = "\u0627\u0644\u0645\u0631\u0643\u0632 \u0627\u0644\u0645\u0641\u062a\u0648\u062d \u0627\u0644\u0627\u062c\u0645\u0627\u0644\u064a";
var PCT_KW = "\u0646\u0633\u0628\u0629";
var ASSET_KW = "\u0627\u0644\u0645\u0648\u062c\u0648\u062f\u0627\u062a";
var LIAB_KW = "\u0627\u0644\u0645\u0637\u0644\u0648\u0628\u0627\u062a";
var CAPMKT_KW = "\u0633\u0648\u0642 \u0631\u0623\u0633 \u0627\u0644\u0645\u0627\u0644";
var PALETTE = ["#0a4a8f","#2f7ed8","#5aa9e6","#86c5ef","#34c759","#ff9500","#5856d6","#af52de","#ff3b30","#64748b"];

// ----- helpers -----
function isArabic(v){ if (typeof v !== "string") return false; for (var i=0;i<v.length;i++){ var c=v.charCodeAt(i); if (c>=0x0600 && c<=0x06ff) return true; } return false; }
function cleanWs(v){ return String(v).replace(/\s+/g," ").trim(); }
function toNum(v){ if (typeof v === "boolean") return null; if (typeof v === "number" && isFinite(v)) return v; return null; }
function goodLabel(v){ if (!isArabic(v)) return false; var s=cleanWs(v); if (s.length<=3) return false; if (META.indexOf(s)>=0) return false; if (/^[\d.,%()\-\/\s]+$/.test(s)) return false; return true; }
function cellAt(aoa,r,c){ var row=aoa[r]; if (!row) return null; return row[c]; }
function rowLabel(aoa,r,c){ var best=null, bc=-1; for (var cc=0;cc<c;cc++){ var v=cellAt(aoa,r,cc); if (goodLabel(v) && cc>bc){ best=cleanWs(v); bc=cc; } } return best; }
function colLabelAbove(aoa,r,c){ var lo=Math.max(0,r-10); for (var rr=r-1;rr>=lo;rr--){ var v=cellAt(aoa,rr,c); if (goodLabel(v)) return cleanWs(v); } return null; }
function meaningfulSheet(name){ if (name === "CRYSTAL_PERSIST") return false; if (/quee?ry from business/i.test(name)) return false; return true; }
function esc(s){ return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }

function extractFigures(sheets){
  var out=[], seen={};
  sheets.forEach(function(s){
    if (!meaningfulSheet(s.name)) return;
    var aoa=s.aoa;
    for (var r=0;r<aoa.length;r++){
      var row=aoa[r]||[];
      for (var c=0;c<row.length;c++){
        var n=toNum(row[c]); if (n===null || n===0) continue;
        var lab=rowLabel(aoa,r,c) || colLabelAbove(aoa,r,c); if (!lab) continue;
        var isRatio = lab.indexOf(PCT_KW)>=0 && Math.abs(n)<2;
        if (!isRatio && Math.abs(n)<1000) continue;
        var key=lab+"|"+Math.round(n*100); if (seen[key]) continue; seen[key]=true;
        out.push({ label:lab, value:n, kind: isRatio?"pct":"num" });
      }
    }
  });
  return out;
}
function detectBookTotal(sheets){
  for (var si=0;si<sheets.length;si++){
    if (!meaningfulSheet(sheets[si].name)) continue;
    var aoa=sheets[si].aoa, hr=-1, hc=-1;
    for (var r=0;r<Math.min(14,aoa.length) && hr<0;r++){ var row=aoa[r]||[]; for (var c=0;c<row.length;c++){ var v=row[c]; if (isArabic(v)){ var s=cleanWs(v); for (var k=0;k<BOOK_KW.length;k++){ if (s.indexOf(BOOK_KW[k])>=0){ hr=r; hc=c; break; } } } if (hr>=0) break; } }
    if (hr<0) continue;
    var items=[], total=0;
    for (var rr=hr+1;rr<aoa.length;rr++){ var nn=toNum(cellAt(aoa,rr,hc)); if (nn===null || Math.abs(nn)<1000) continue; var row2=aoa[rr]||[]; var name=""; for (var cc=0;cc<row2.length;cc++){ if (isArabic(row2[cc]) && cleanWs(row2[cc]).length>3){ name=cleanWs(row2[cc]); break; } } items.push({ name:name, value:nn }); total+=nn; }
    if (items.length===0) continue;
    items.sort(function(a,b){ return Math.abs(b.value)-Math.abs(a.value); });
    return { total:total, count:items.length, items:items };
  }
  return null;
}
function parseIdentity(fileName){
  var base=fileName.replace(/\.[^.]+$/,""), up=base.toUpperCase();
  var m=up.match(/^([A-Z]+[0-9]+)/); var code=m?m[1]:base.split(/[_\s.]/)[0].toUpperCase();
  var bank=null; Object.keys(BANKS).forEach(function(k){ if (up.indexOf(k)>=0) bank=BANKS[k]+" ("+k+")"; });
  var pm=base.match(/(\d{2})-(\d{4})/), period=null; if (pm){ var mo=parseInt(pm[1],10); period=(MONTHS[mo]||pm[1])+" "+pm[2]; }
  var currency=null, cm={ DOLLER:"USD", DOLLAR:"USD", EURO:"EUR", GBP:"GBP", POUND:"GBP", YEN:"JPY", FRNK:"CHF", FRANC:"CHF", ELSE:"Other" }; Object.keys(cm).forEach(function(k){ if (up.indexOf(k)>=0) currency=cm[k]; });
  var consolidated=/_C(\b|_|$)/.test(base);
  return { code:code, bank:bank, period:period, currency:currency, consolidated:consolidated };
}
function analyzeForm(sheets, fileName){
  var id=parseIdentity(fileName);
  var figures=extractFigures(sheets);
  var money=figures.filter(function(f){ return f.kind==="num" && Math.abs(f.value)>=1000; });
  var holdings=detectBookTotal(sheets);
  return { id: fileName+":"+Date.now()+":"+Math.random().toString(36).slice(2,6), fileName:fileName, code:id.code, titleEn: FORMS[id.code]||"CBJ Return", bank:id.bank, period:id.period, currency:id.currency, consolidated:id.consolidated, figures:figures, money:money, holdings:holdings, bookTotal: holdings?holdings.total:null, isNil: money.length===0, sheets:sheets };
}
function byCode(forms, code){ var c=forms.filter(function(f){ return f.code===code && !f.consolidated; }); if (c.length) return c[0]; var c2=forms.filter(function(f){ return f.code===code; }); return c2.length?c2[0]:null; }
function biggestWith(form, kws){ if (!form) return null; var best=null; form.money.forEach(function(f){ for (var i=0;i<kws.length;i++){ if (f.label.indexOf(kws[i])>=0){ if (best===null || Math.abs(f.value)>Math.abs(best)) best=f.value; } } }); return best; }

function buildExecutive(forms){
  var bank=null, period=null;
  forms.forEach(function(f){ if (!bank && f.bank) bank=f.bank; if (!period && f.period) period=f.period; });
  var ast01=byCode(forms,"AST01"), ast02=byCode(forms,"AST02"), ast03=byCode(forms,"AST03"), ast04=byCode(forms,"AST04"), ast09=byCode(forms,"AST09");
  var netSources=biggestWith(ast01,NET_KW) || biggestWith(ast02,NET_KW);
  var equity=biggestWith(ast02,[EQUITY_KW]);
  var openPos=biggestWith(ast09,[POS_KW]);
  var mmIG=biggestWith(ast03,[TOTKULLI]), mmSub=biggestWith(ast04,[TOTKULLI]);
  var ast05=byCode(forms,"AST05");
  var DINARBAL="\u0627\u0644\u0631\u0635\u064a\u062f \u0628\u0627\u0644\u062f\u064a\u0646\u0627\u0631";
  var capMkt=null, capMktN=0;
  if (ast05){ var cmv=0, cmc=0; ast05.money.forEach(function(f){ if (f.label.indexOf(DINARBAL)>=0){ cmv+=f.value; cmc++; } }); if (cmc>0){ capMkt=cmv; capMktN=cmc; } }
  var invSeen={}, invTotal=0, investTypes=[];
  var invLabels={ INV01010:"Trading equities", INV02010:"FVOCI equities", INV03:"Amortized-cost" };
  ["INV01010","INV02010","INV03"].forEach(function(code, idx){ var f=byCode(forms,code); if (f && f.bookTotal && !invSeen[code]){ invSeen[code]=true; invTotal+=f.bookTotal; investTypes.push({ label:invLabels[code], value:f.bookTotal, color:PALETTE[idx] }); } });
  var funding=[], fundingGross=0, fundingDeductions=[], fundingNet=netSources;
  if (ast01){
    var YATRAH="\u064a\u0637\u0631\u062d";
    var srcItems=ast01.money.filter(function(f){ for (var i=0;i<NET_KW.length;i++) if (f.label.indexOf(NET_KW[i])>=0) return false; if (f.label.indexOf(YATRAH)>=0) return false; return true; });
    var dedItems=ast01.money.filter(function(f){ return f.label.indexOf(YATRAH)>=0; });
    srcItems.sort(function(a,b){ return Math.abs(b.value)-Math.abs(a.value); });
    srcItems.forEach(function(f){ fundingGross+=f.value; });
    var topN=srcItems.slice(0,5), restN=srcItems.slice(5);
    topN.forEach(function(f,i){ funding.push({ label:f.label, value:f.value, color:PALETTE[i%PALETTE.length] }); });
    if (restN.length){ var ro=0; restN.forEach(function(f){ ro+=f.value; }); funding.push({ label:"Other sources ("+restN.length+")", value:ro, color:PALETTE[9] }); }
    dedItems.forEach(function(f){ fundingDeductions.push({ label:f.label, value:f.value }); });
    if (fundingNet===null || fundingNet===undefined) fundingNet=fundingGross-dedItems.reduce(function(a,f){ return a+f.value; },0);
  }
  var fxUse=[];
  if (ast02){ var seenPct={}; ast02.figures.filter(function(f){ return f.kind==="pct"; }).forEach(function(f){ var k=String(Math.round(f.value*1000)); if (seenPct[k]) return; seenPct[k]=true; if (fxUse.length<5) fxUse.push({ label:f.label, value:f.value, color:PALETTE[fxUse.length%PALETTE.length] }); }); }
  var currencies=[];
  forms.filter(function(f){ return f.code==="AST10" && !f.consolidated; }).forEach(function(f){ var assets=biggestWith(f,[ASSET_KW])||0; var liab=biggestWith(f,[LIAB_KW])||0; currencies.push({ cur:f.currency||"?", assets:assets, liab:liab, net:assets+liab }); });
  var moneyMarket=[];
  if (mmIG!==null) moneyMarket.push({ label:"Investment-grade", value:mmIG, color:PALETTE[0] });
  if (mmSub!==null) moneyMarket.push({ label:"Sub-investment-grade", value:mmSub, color:PALETTE[5] });
  var present={}, nilm={};
  forms.forEach(function(f){ present[f.code]=true; if (f.isNil){ if (nilm[f.code]===undefined) nilm[f.code]=true; } else nilm[f.code]=false; });
  var coverage=CORE_FORMS.map(function(code){ return { code:code, present: !!present[code], nil: !!nilm[code] }; });
  var stats=[
    { key:"net", label:"Net FX Sources of Funds", value:netSources, sub:"AST01" },
    { key:"eq", label:"Shareholders' Equity", value:equity, sub:"AST02" },
    { key:"pos", label:"Aggregate Open FX Position", value:openPos, sub:"AST09" },
    { key:"inv", label:"Investment Portfolio (book)", value: invTotal||null, sub:"INV01/02/03" },
    { key:"mm", label:"Money-Market Placements", value:(mmIG!==null||mmSub!==null)?((mmIG||0)+(mmSub||0)):null, sub:"AST03 + AST04" },
    { key:"cap", label:"Capital-Market Investments", value:capMkt, sub:"AST05 \u00b7 JOD balances" }
  ];
  return { bank:bank, period:period, formCount:forms.length, stats:stats, funding:funding, fundingGross:fundingGross, fundingDeductions:fundingDeductions, fundingNet:fundingNet, fxUse:fxUse, currencies:currencies, investTypes:investTypes, investTotal:invTotal, moneyMarket:moneyMarket, coverage:coverage };
}

function fmtFull(v){ var neg=v<0; var s=Math.round(Math.abs(v)).toLocaleString("en-US"); return (neg?"-":"")+s; }
function fmtCompact(v){ var a=Math.abs(v); var n=v<0?"-":""; if (a>=1e9) return n+(a/1e9).toFixed(2)+"B"; if (a>=1e6) return n+(a/1e6).toFixed(1)+"M"; if (a>=1e3) return n+(a/1e3).toFixed(0)+"K"; return n+a.toFixed(0); }

// ----- chart renderers -----
function donutSVG(items, size, centerVal, centerLab){
  items=items.filter(function(i){ return Math.abs(i.value)>0; });
  var R=size/2, r=R*0.6, cx=R, cy=R, total=0, acc=0, paths="";
  items.forEach(function(i){ total+=Math.abs(i.value); }); if (total===0) total=1;
  items.forEach(function(it){
    var frac=Math.abs(it.value)/total;
    var a0=acc*2*Math.PI - Math.PI/2; acc+=frac; var a1=acc*2*Math.PI - Math.PI/2; var large=frac>0.5?1:0;
    var x0=cx+R*Math.cos(a0), y0=cy+R*Math.sin(a0), x1=cx+R*Math.cos(a1), y1=cy+R*Math.sin(a1);
    var xi1=cx+r*Math.cos(a1), yi1=cy+r*Math.sin(a1), xi0=cx+r*Math.cos(a0), yi0=cy+r*Math.sin(a0);
    var d="M "+x0+" "+y0+" A "+R+" "+R+" 0 "+large+" 1 "+x1+" "+y1+" L "+xi1+" "+yi1+" A "+r+" "+r+" 0 "+large+" 0 "+xi0+" "+yi0+" Z";
    paths+='<path d="'+d+'" fill="'+it.color+'"></path>';
  });
  var center="";
  if (centerVal!==undefined && centerVal!==null){ center='<text x="'+cx+'" y="'+(cy-1)+'" text-anchor="middle" font-size="'+(size*0.15)+'" font-weight="700" fill="#0f172a">'+esc(centerVal)+'</text>'+(centerLab?'<text x="'+cx+'" y="'+(cy+size*0.13)+'" text-anchor="middle" font-size="'+(size*0.08)+'" fill="#64748b">'+esc(centerLab)+'</text>':''); }
  return '<svg viewBox="0 0 '+size+' '+size+'" width="'+size+'" height="'+size+'" style="flex-shrink:0">'+paths+center+'</svg>';
}
function legendHTML(items, pct){
  return '<div class="legend">'+items.map(function(it){
    var val = pct ? (it.value*100).toFixed(1)+"%" : fmtCompact(it.value);
    return '<div class="leg"><span class="sw" style="background:'+it.color+'"></span><span class="ll" dir="rtl">'+esc(it.label)+'</span><span class="lv">'+val+'</span></div>';
  }).join("")+'</div>';
}
function hbarsHTML(items, pct, signed){
  var max=1; items.forEach(function(i){ if (Math.abs(i.value)>max) max=Math.abs(i.value); });
  return '<div class="bars">'+items.map(function(it){
    var w=(Math.abs(it.value)/max)*100; var neg=it.value<0;
    var val = pct ? (it.value*100).toFixed(1)+"%" : ((signed && it.value>=0)?"+":"")+fmtCompact(it.value);
    return '<div class="barrow"><div class="barhead"><span class="barlabel" dir="rtl">'+esc(it.label)+'</span><span class="barval">'+val+'</span></div><div class="bartrack"><div class="barfill" style="width:'+w+'%;background:'+(neg?"#ff3b30":it.color)+'"></div></div></div>';
  }).join("")+'</div>';
}
function panelHTML(title, inner){ return '<div class="panel"><div class="panel-t">'+esc(title)+'</div>'+inner+'</div>'; }

// ===== xlsx loader =====
var XLSX_SRC = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
function getXLSX(){ return window.XLSX; }
function loadXLSX(){
  return new Promise(function(resolve, reject){
    var have = getXLSX(); if (have) { resolve(have); return; }
    var ex = document.querySelector("script[data-xlsx-engine='1']");
    if (ex){ ex.addEventListener("load", function(){ var x=getXLSX(); x?resolve(x):reject(new Error("\u062a\u0639\u0630\u0651\u0631 \u062a\u0647\u064a\u0626\u0629 \u0645\u062d\u0631\u0651\u0643 \u0627\u0644\u062c\u062f\u0627\u0648\u0644")); }); return; }
    var s = document.createElement("script"); s.src = XLSX_SRC; s.setAttribute("data-xlsx-engine","1");
    s.onload = function(){ var x=getXLSX(); x?resolve(x):reject(new Error("\u062a\u0639\u0630\u0651\u0631 \u062a\u0647\u064a\u0626\u0629 \u0645\u062d\u0631\u0651\u0643 \u0627\u0644\u062c\u062f\u0627\u0648\u0644")); };
    s.onerror = function(){ reject(new Error("\u062a\u0639\u0630\u0651\u0631 \u062a\u062d\u0645\u064a\u0644 \u0645\u062d\u0631\u0651\u0643 \u0627\u0644\u062c\u062f\u0627\u0648\u0644")); };
    document.head.appendChild(s);
  });
}

// ===== arabic snapshot renderer =====
var STAT_AR = {
  net:"\u0635\u0627\u0641\u064a \u0645\u0635\u0627\u062f\u0631 \u0627\u0644\u0623\u0645\u0648\u0627\u0644 \u0628\u0627\u0644\u0639\u0645\u0644\u0627\u062a \u0627\u0644\u0623\u062c\u0646\u0628\u064a\u0629",
  eq:"\u062d\u0642\u0648\u0642 \u0627\u0644\u0645\u0633\u0627\u0647\u0645\u064a\u0646",
  pos:"\u0625\u062c\u0645\u0627\u0644\u064a \u0627\u0644\u0645\u0631\u0643\u0632 \u0627\u0644\u0645\u0641\u062a\u0648\u062d \u0628\u0627\u0644\u0639\u0645\u0644\u0627\u062a \u0627\u0644\u0623\u062c\u0646\u0628\u064a\u0629",
  inv:"\u0627\u0644\u0645\u062d\u0641\u0638\u0629 \u0627\u0644\u0627\u0633\u062a\u062b\u0645\u0627\u0631\u064a\u0629 (\u0627\u0644\u0642\u064a\u0645\u0629 \u0627\u0644\u062f\u0641\u062a\u0631\u064a\u0629)",
  mm:"\u0627\u0644\u062a\u0648\u0638\u064a\u0641\u0627\u062a \u0641\u064a \u0627\u0644\u0633\u0648\u0642 \u0627\u0644\u0646\u0642\u062f\u064a",
  cap:"\u0627\u0633\u062a\u062b\u0645\u0627\u0631\u0627\u062a \u0633\u0648\u0642 \u0631\u0623\u0633 \u0627\u0644\u0645\u0627\u0644"
};
var LBL_AR = {
  "Trading equities":"\u0623\u0633\u0647\u0645 \u0627\u0644\u0645\u062a\u0627\u062c\u0631\u0629",
  "FVOCI equities":"\u0623\u0633\u0647\u0645 \u0628\u0627\u0644\u0642\u064a\u0645\u0629 \u0627\u0644\u0639\u0627\u062f\u0644\u0629 (\u0627\u0644\u062f\u062e\u0644 \u0627\u0644\u0634\u0627\u0645\u0644)",
  "Amortized-cost":"\u0645\u0648\u062c\u0648\u062f\u0627\u062a \u0628\u0627\u0644\u062a\u0643\u0644\u0641\u0629 \u0627\u0644\u0645\u0637\u0641\u0623\u0629",
  "Investment-grade":"\u062f\u0648\u0644 \u0628\u062f\u0631\u062c\u0629 \u0627\u0633\u062a\u062b\u0645\u0627\u0631\u064a\u0629",
  "Sub-investment-grade":"\u062f\u0648\u0644 \u062f\u0648\u0646 \u0627\u0644\u062f\u0631\u062c\u0629 \u0627\u0644\u0627\u0633\u062a\u062b\u0645\u0627\u0631\u064a\u0629"
};
var UNIT = "\u062f.\u0623";
function trAr(l){ if (LBL_AR[l]) return LBL_AR[l]; if (String(l).indexOf("Other sources")===0) return "\u0645\u0635\u0627\u062f\u0631 \u0623\u062e\u0631\u0649"+String(l).slice(13); return l; }
function barsAr(items, pct, signed){
  var max=1; items.forEach(function(i){ if (Math.abs(i.value)>max) max=Math.abs(i.value); });
  return '<div class="ubars">'+items.map(function(it){
    var w=(Math.abs(it.value)/max)*100; var neg=it.value<0;
    var val = pct ? (it.value*100).toFixed(1)+"%" : ((signed && it.value>=0)?"+":"")+fmtCompact(it.value);
    return '<div class="ubar"><div class="ubar-h"><span class="ubar-l" dir="rtl">'+esc(trAr(it.label))+'</span><span class="ubar-v num">'+esc(val)+'</span></div><div class="ubar-t"><div class="ubar-f" style="width:'+w+'%;background:'+(neg?"#d34a4a":(it.color||"#3a6ea5"))+'"></div></div></div>';
  }).join("")+'</div>';
}
function panelAr(title, sub, inner){ return '<div class="panel"><div class="pt">'+esc(title)+'</div>'+(sub?'<div class="psub">'+esc(sub)+'</div>':'')+inner+'</div>'; }
function renderDashboard(ex){
  var cards = ex.stats.map(function(s){
    var has = s.value!==null && s.value!==undefined;
    var v = has ? '<span class="num">'+esc(fmtCompact(s.value))+'</span> <small>'+UNIT+'</small>' : '<span style="color:var(--faint);font-size:18px">\u063a\u064a\u0631 \u0645\u062a\u0648\u0641\u0631</span>';
    return '<div class="kpi"><div class="kl">'+esc(STAT_AR[s.key]||s.label)+'</div><div class="kv">'+v+'</div><div class="ks">\u0645\u0646 \u0627\u0644\u062a\u0642\u0627\u0631\u064a\u0631 \u0627\u0644\u0631\u0642\u0627\u0628\u064a\u0629 \u0627\u0644\u0641\u0639\u0644\u064a\u0629</div></div>';
  }).join("");
  var kpis = '<div class="kpis">'+cards+'</div>';
  var funding="";
  if (ex.funding && ex.funding.length){
    var donut = donutSVG(ex.funding, 150, fmtCompact(ex.fundingGross), "\u0627\u0644\u0625\u062c\u0645\u0627\u0644\u064a");
    var bridge = '<div class="bridge"><div class="br"><span class="lbl">\u0625\u062c\u0645\u0627\u0644\u064a \u0627\u0644\u0645\u0635\u0627\u062f\u0631</span><span class="v num">'+esc(fmtCompact(ex.fundingGross))+'</span></div>';
    (ex.fundingDeductions||[]).forEach(function(d){ bridge += '<div class="br ded"><span class="lbl" dir="rtl">'+esc(d.label)+'</span><span class="v num">'+esc(fmtCompact(d.value))+'</span></div>'; });
    bridge += '<div class="br net"><span class="lbl">\u0635\u0627\u0641\u064a \u0627\u0644\u0645\u0635\u0627\u062f\u0631</span><span class="v num">'+esc(fmtCompact((ex.fundingNet!==null&&ex.fundingNet!==undefined)?ex.fundingNet:ex.fundingGross))+'</span></div></div>';
    funding = panelAr("\u062a\u0631\u0643\u064a\u0628 \u0645\u0635\u0627\u062f\u0631 \u0627\u0644\u0623\u0645\u0648\u0627\u0644", "\u0627\u0644\u0642\u064a\u0645\u0629 \u0628\u0627\u0644\u062f\u064a\u0646\u0627\u0631 \u00b7 "+UNIT, '<div class="donrow"><div class="chartbox" style="width:150px;flex-shrink:0">'+donut+'</div>'+legendHTML(ex.funding,false)+'</div>'+bridge);
  }
  var invest="";
  if (ex.investTypes && ex.investTypes.length){
    var it2 = ex.investTypes.map(function(x){ return { label:trAr(x.label), value:x.value, color:x.color }; });
    invest = panelAr("\u0627\u0644\u0645\u062d\u0641\u0638\u0629 \u0627\u0644\u0627\u0633\u062a\u062b\u0645\u0627\u0631\u064a\u0629", "\u0627\u0644\u0642\u064a\u0645\u0629 \u0627\u0644\u062f\u0641\u062a\u0631\u064a\u0629 \u062d\u0633\u0628 \u0627\u0644\u0641\u0626\u0629 \u00b7 "+UNIT, '<div class="donrow"><div class="chartbox" style="width:150px;flex-shrink:0">'+donutSVG(it2,150,fmtCompact(ex.investTotal),"\u0627\u0644\u0625\u062c\u0645\u0627\u0644\u064a")+'</div>'+legendHTML(it2,false)+'</div>');
  }
  var mm = (ex.moneyMarket && ex.moneyMarket.length) ? panelAr("\u0627\u0644\u062a\u0648\u0638\u064a\u0641\u0627\u062a \u0641\u064a \u0627\u0644\u0633\u0648\u0642 \u0627\u0644\u0646\u0642\u062f\u064a","\u062d\u0633\u0628 \u0627\u0644\u062f\u0631\u062c\u0629 \u0627\u0644\u0627\u0626\u062a\u0645\u0627\u0646\u064a\u0629 \u00b7 "+UNIT, barsAr(ex.moneyMarket,false,false)) : "";
  var fx = (ex.fxUse && ex.fxUse.length) ? panelAr("\u0627\u0633\u062a\u062e\u062f\u0627\u0645 \u0645\u0635\u0627\u062f\u0631 \u0627\u0644\u0639\u0645\u0644\u0627\u062a \u0627\u0644\u0623\u062c\u0646\u0628\u064a\u0629","\u0643\u0646\u0633\u0628\u0629 (%)", barsAr(ex.fxUse,true,false)) : "";
  var cur="";
  if (ex.currencies && ex.currencies.length){
    var ci = ex.currencies.map(function(c){ return { label:c.cur, value:c.net, color:"#3a6ea5" }; });
    cur = panelAr("\u0635\u0627\u0641\u064a \u0627\u0644\u0645\u0631\u0643\u0632 \u062d\u0633\u0628 \u0627\u0644\u0639\u0645\u0644\u0629","\u0645\u0648\u062c\u0628 = \u0645\u0631\u0643\u0632 \u0634\u0631\u0627\u0621 \u00b7 "+UNIT, barsAr(ci,false,true));
  }
  var row1 = (funding||invest) ? '<div class="grid2">'+funding+invest+'</div>' : '';
  var row2 = (mm||fx) ? '<div class="grid2">'+mm+fx+'</div>' : '';
  var row3 = cur ? '<div class="grid1">'+cur+'</div>' : '';
  var meta = '<div class="meta"><span class="bk">'+esc(ex.bank||"\u0627\u0644\u0628\u0646\u0643")+'</span>'+(ex.period?'<span class="pd">'+esc(ex.period)+'</span>':'')+'<span class="rankchip">'+ex.formCount+' \u0646\u0645\u0627\u0630\u062c \u0631\u0642\u0627\u0628\u064a\u0629</span></div>';
  return meta+kpis+row1+row2+row3;
}

// ===== styles =====
const CSS = `  :root{
    --navy:#0c3057;--navy2:#0a2742;--blue:#3a6ea5;--blue2:#6c9bc8;--teal:#3f8f86;
    --gold:#b0883c;--green:#1f9d57;--red:#d34a4a;--amber:#bd7d2a;--violet:#5b6b9e;
    --bg:#f5f7fa;--card:#ffffff;--ink:#0f1f30;--sub:#5a6b7d;--faint:#9aa7b4;--line:#e9edf2;--soft:#f1f4f8;
  }
  *{box-sizing:border-box}
  body{margin:0;background:var(--bg);color:var(--ink);font-family:'Cairo','Segoe UI',Tahoma,sans-serif;direction:rtl;-webkit-font-smoothing:antialiased}
  .wrap{max-width:1180px;margin:0 auto;padding:0 22px 60px}
  .num{font-variant-numeric:tabular-nums;direction:ltr;unicode-bidi:isolate;display:inline-block}
  .ltr{direction:ltr}
  .top{position:sticky;top:0;z-index:20;background:rgba(244,246,249,.86);backdrop-filter:saturate(180%) blur(12px);border-bottom:1px solid var(--line)}
  .top-in{max-width:1180px;margin:0 auto;padding:13px 22px;display:flex;align-items:center;justify-content:space-between;gap:16px}
  .brand{display:flex;align-items:center;gap:11px}
  .logo{width:40px;height:40px;border-radius:11px;background:linear-gradient(135deg,var(--navy),var(--blue));color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:15px}
  .brand b{font-size:16px;font-weight:800;display:block;line-height:1.2}
  .brand span{font-size:12px;color:var(--sub)}
  .tools{display:flex;gap:8px}
  .btn{border:1px solid var(--line);background:var(--card);color:var(--ink);font-family:inherit;font-size:13px;font-weight:600;padding:9px 14px;border-radius:10px;cursor:pointer;display:flex;align-items:center;gap:6px;transition:.15s}
  .btn:hover{border-color:var(--blue);color:var(--blue)}
  .btn.solid{background:var(--navy);color:#fff;border-color:var(--navy)}
  .btn.solid:hover{background:var(--navy2);color:#fff}
  .hero{padding:24px 0 4px}
  .ey{display:inline-flex;align-items:center;gap:7px;background:#eaf2fb;color:var(--navy);font-size:12px;font-weight:700;padding:6px 13px;border-radius:999px}
  .ey::before{content:"";width:7px;height:7px;border-radius:999px;background:var(--blue)}
  h1{font-size:30px;font-weight:800;margin:14px 0 7px;letter-spacing:-.4px}
  .sub{color:var(--sub);font-size:14px;max-width:680px;line-height:1.6}
  .filter{display:flex;flex-wrap:wrap;gap:9px;margin:20px 0 4px;align-items:center}
  .flabel{font-size:13px;font-weight:700;color:var(--sub);margin-left:4px}
  .pill{border:1px solid var(--line);background:var(--card);color:var(--ink);font-family:inherit;font-size:13.5px;font-weight:600;padding:9px 16px;border-radius:999px;cursor:pointer;transition:.15s;white-space:nowrap}
  .pill:hover{border-color:var(--blue)}
  .pill.on{background:var(--navy);color:#fff;border-color:var(--navy);box-shadow:0 3px 10px rgba(11,61,107,.22)}
  .pill.sector{border-style:dashed;border-color:var(--gold);color:var(--amber)}
  .pill.sector.on{background:var(--gold);color:#3a2c06;border-color:var(--gold)}
  .meta{display:flex;align-items:center;gap:10px;margin:18px 0 4px;flex-wrap:wrap}
  .meta .bk{font-size:20px;font-weight:800}
  .meta .pd{font-size:13px;color:var(--sub);background:var(--soft);padding:4px 11px;border-radius:8px}
  .rankchip{font-size:12.5px;font-weight:700;color:var(--navy);background:#eaf2fb;padding:5px 12px;border-radius:999px}
  .kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin:18px 0 4px}
  .kpi{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:18px 20px;box-shadow:0 1px 2px rgba(15,31,48,.04),0 4px 16px rgba(15,31,48,.05)}
  .kpi .kl{font-size:12.5px;color:var(--sub);font-weight:600;line-height:1.4;min-height:34px}
  .kpi .kv{font-size:27px;font-weight:800;margin:8px 0 8px;letter-spacing:-.6px}
  .kpi .kv small{font-size:13px;font-weight:700;color:var(--sub);margin-left:5px}
  .kpi .kr{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px}
  .kpi .kg{display:flex;align-items:center;gap:6px;font-size:11.5px;color:var(--faint);font-weight:600}
  .delta{font-weight:800;font-size:11.5px;white-space:nowrap;padding:3px 9px;border-radius:999px;display:inline-flex;align-items:center;gap:4px;letter-spacing:.1px}
  .kpi .ks{font-size:11px;color:var(--faint);font-weight:600;border-top:1px solid var(--soft);padding-top:7px}
  .grid2{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:16px}
  .grid1{margin-top:16px}
  .panel{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:22px 24px;box-shadow:0 1px 2px rgba(15,31,48,.04),0 4px 16px rgba(15,31,48,.05)}
  .pt{font-size:15px;font-weight:800;margin-bottom:3px;letter-spacing:-.1px}
  .psub{font-size:12px;color:var(--faint);font-weight:600;margin-bottom:14px}
  .chartbox{width:100%;overflow:hidden}
  .chartbox svg{width:100%;height:auto;display:block}
  .clegend{display:flex;flex-wrap:wrap;gap:14px;margin-top:10px;justify-content:center}
  .cli{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--sub);font-weight:600}
  .cli .sw{width:14px;height:3px;border-radius:2px}
  .donrow{display:flex;align-items:center;gap:20px}
  .legend{flex:1;min-width:0;display:flex;flex-direction:column;gap:9px}
  .leg{display:flex;align-items:center;gap:9px;font-size:12.5px}
  .leg .sw{width:11px;height:11px;border-radius:3px;flex-shrink:0}
  .ll{color:var(--sub);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1}
  .lv{font-weight:700;color:var(--ink);flex-shrink:0}
  .bridge{margin-top:14px;border-top:1px solid var(--line);padding-top:10px;font-size:13px}
  .br{display:flex;justify-content:space-between;gap:12px;padding:4px 0}
  .br .v{font-weight:700;white-space:nowrap}
  .br.ded .lbl,.br.ded .v{color:var(--amber)}
  .br.net{border-top:1px dashed var(--line);margin-top:5px;padding-top:8px}
  .br.net .lbl{font-weight:800}.br.net .v{font-weight:800;color:var(--navy)}
  .cmp{display:flex;flex-direction:column;gap:10px}
  .crow{display:grid;grid-template-columns:148px 1fr auto;align-items:center;gap:12px}
  .crow .cn{font-size:13px;font-weight:700;text-align:right;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .crow.me .cn{color:var(--navy)}
  .crow .ct{height:22px;background:var(--soft);border-radius:7px;overflow:hidden;display:flex;flex-direction:row-reverse}
  .crow .cf{height:100%;border-radius:7px}
  .crow .cval{font-size:12.5px;font-weight:800;flex-shrink:0;min-width:62px;text-align:left}
  .rk{display:inline-block;width:20px;height:20px;line-height:20px;text-align:center;border-radius:6px;background:var(--soft);color:var(--sub);font-size:11px;font-weight:800;margin-left:8px}
  .crow.me .rk{background:var(--navy);color:#fff}
  .cov{display:flex;flex-wrap:wrap;gap:8px;margin-top:4px}
  .cv{display:inline-flex;align-items:center;gap:6px;border-radius:8px;padding:5px 11px;font-size:12px;font-weight:700}
  .cv .d{width:7px;height:7px;border-radius:999px}
  .totals{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-top:6px}
  .tot{background:linear-gradient(140deg,var(--navy),#15436f);color:#fff;border-radius:18px;padding:18px 20px;box-shadow:0 4px 16px rgba(12,48,87,.18)}
  .tot .tl{font-size:12.5px;opacity:.85;font-weight:600}
  .tot .tv{font-size:23px;font-weight:800;margin-top:6px}
  .tot .tv small{font-size:12px;opacity:.85;margin-left:5px}
  .tot .tg{font-size:11.5px;font-weight:700;margin-top:5px;opacity:.95}
  table.rank{width:100%;border-collapse:collapse;margin-top:6px;font-size:13px}
  table.rank th,table.rank td{padding:11px 10px;text-align:right;border-bottom:1px solid var(--line)}
  table.rank th{font-size:11.5px;color:var(--sub);font-weight:700;background:var(--soft)}
  table.rank tr.me td{background:#eaf2fb}
  table.rank tr.me td:first-child{font-weight:800;color:var(--navy)}
  .foot{text-align:center;color:var(--faint);font-size:12px;margin-top:30px}
  @media(max-width:860px){.kpis,.totals{grid-template-columns:repeat(2,1fr)}.grid2{grid-template-columns:1fr}.crow{grid-template-columns:110px 1fr auto}}
  @media print{body{background:#fff}.top,.tools,.filter,.btn{display:none!important}.panel,.kpi,.tot{break-inside:avoid;box-shadow:none}.wrap{max-width:100%}}

  html,body{background:var(--bg)}
  a.btn{text-decoration:none}
  .drop{background:var(--card);border:2px dashed #c7d2de;border-radius:20px;padding:54px 30px;text-align:center;cursor:pointer;transition:.18s;margin-top:8px}
  .drop:hover{border-color:var(--blue);background:#fafcff}
  .drop.over{border-color:var(--blue);background:#eef5fc}
  .drop-ic{width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,var(--navy),var(--blue));color:#fff;font-size:24px;display:flex;align-items:center;justify-content:center;margin:0 auto 16px}
  .drop-h{font-size:17px;font-weight:800;color:var(--ink)}
  .drop-s{font-size:13px;color:var(--sub);margin-top:7px}
  .drop-note{font-size:12px;color:var(--faint);margin-top:18px;max-width:560px;margin-left:auto;margin-right:auto;line-height:1.7}
  .err{background:#fdecec;border:1px solid #f5c2c2;color:#b42318;border-radius:12px;padding:13px 16px;font-size:13.5px;font-weight:600;margin-top:16px}
  .ubars{display:flex;flex-direction:column;gap:13px;margin-top:4px}
  .ubar-h{display:flex;justify-content:space-between;gap:10px;margin-bottom:5px}
  .ubar-l{font-size:13px;font-weight:700;color:var(--sub);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .ubar-v{font-size:12.5px;font-weight:800;color:var(--ink);flex-shrink:0}
  .ubar-t{height:9px;background:var(--soft);border-radius:6px;overflow:hidden;display:flex;flex-direction:row-reverse}
  .ubar-f{height:100%;border-radius:6px}
  .br .lbl{color:var(--sub)}
  .spin{display:inline-block;width:16px;height:16px;border:2px solid #c7d2de;border-top-color:var(--blue);border-radius:50%;animation:sp .7s linear infinite;vertical-align:-3px;margin-left:8px}
  @keyframes sp{to{transform:rotate(360deg)}}
`;

// ===== page =====
export default function Page() {
  const [html, setHtml] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [over, setOver] = useState(false);
  const inputRef = useRef(null);

  const handle = useCallback(async function (fileList) {
    if (!fileList || !fileList.length) return;
    setBusy(true); setErr("");
    try {
      const XLSX = await loadXLSX();
      const list = Array.prototype.slice.call(fileList);
      const forms = [];
      for (let i = 0; i < list.length; i++) {
        const f = list[i];
        const buf = await f.arrayBuffer();
        const wb = XLSX.read(buf, { type: "array" });
        const sheets = wb.SheetNames.map(function (nm) {
          return { name: nm, aoa: XLSX.utils.sheet_to_json(wb.Sheets[nm], { header: 1, raw: true, defval: null }) };
        });
        forms.push(analyzeForm(sheets, f.name));
      }
      const ex = buildExecutive(forms);
      setHtml(renderDashboard(ex));
    } catch (e) {
      setErr((e && e.message) ? e.message : String(e));
    }
    setBusy(false);
  }, []);

  function pick() { if (inputRef.current) inputRef.current.click(); }
  function onInput(e) { handle(e.target.files); }
  function onDrop(e) { e.preventDefault(); setOver(false); handle(e.dataTransfer.files); }
  function reset() { setHtml(""); setErr(""); }

  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="top"><div className="top-in">
        <div className="brand">
          <div className="logo">cf</div>
          <div><b>convo.finance</b><span>\u062a\u062d\u0644\u064a\u0644 \u0627\u0644\u062a\u0642\u0627\u0631\u064a\u0631 \u0627\u0644\u0631\u0642\u0627\u0628\u064a\u0629 \u0644\u0644\u0628\u0646\u0643 \u0627\u0644\u0645\u0631\u0643\u0632\u064a</span></div>
        </div>
        <div className="tools">
          <a className="btn" href="/">\u2192 \u0644\u0648\u062d\u0629 \u0627\u0644\u0628\u0646\u0648\u0643</a>
          {html ? <button className="btn solid" onClick={reset}>\u0631\u0641\u0639 \u062a\u0642\u0627\u0631\u064a\u0631 \u0623\u062e\u0631\u0649</button> : null}
        </div>
      </div></div>
      <div className="wrap">
        {!html ? (
          <div>
            <div className="hero">
              <span className="ey">\u0631\u0641\u0639 \u0648\u062a\u062d\u0644\u064a\u0644</span>
              <h1>\u0631\u0641\u0639 \u0627\u0644\u062a\u0642\u0627\u0631\u064a\u0631 \u0627\u0644\u0631\u0642\u0627\u0628\u064a\u0629 \u0644\u0644\u0628\u0646\u0643 \u0627\u0644\u0645\u0631\u0643\u0632\u064a</h1>
              <p className="sub">\u0627\u0633\u062d\u0628 \u0645\u0644\u0641\u0627\u062a \u0627\u0644\u0646\u0645\u0627\u0630\u062c \u0627\u0644\u0631\u0642\u0627\u0628\u064a\u0629 \u0627\u0644\u062e\u0627\u0635\u0629 \u0628\u0627\u0644\u0628\u0646\u0643 \u0644\u0634\u0647\u0631\u064d \u0648\u0627\u062d\u062f\u060c \u0648\u0633\u064a\u0642\u0648\u0645 \u0627\u0644\u0645\u062d\u0631\u0651\u0643 \u0628\u0642\u0631\u0627\u0621\u062a\u0647\u0627 \u0648\u062a\u062c\u0645\u064a\u0639\u0647\u0627 \u062a\u0644\u0642\u0627\u0626\u064a\u0627\u064b \u0648\u062a\u0648\u0644\u064a\u062f \u0644\u0648\u062d\u0629 \u0627\u0644\u0645\u0624\u0634\u0631\u0627\u062a \u0627\u0644\u062a\u0646\u0641\u064a\u0630\u064a\u0629 \u0645\u0646 \u0627\u0644\u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u0641\u0639\u0644\u064a\u0629.</p>
            </div>
            <div className={over ? "drop over" : "drop"} onClick={pick} onDragOver={function (e) { e.preventDefault(); setOver(true); }} onDragLeave={function () { setOver(false); }} onDrop={onDrop}>
              <div className="drop-ic">{"\u2191"}</div>
              <div className="drop-h">{busy ? <span>\u062c\u0627\u0631\u064d \u0627\u0644\u062a\u062d\u0644\u064a\u0644<span className="spin" /></span> : "\u0627\u0633\u062d\u0628 \u0645\u0644\u0641\u0627\u062a \u0627\u0644\u062a\u0642\u0627\u0631\u064a\u0631 \u0647\u0646\u0627 \u0623\u0648 \u0627\u0636\u063a\u0637 \u0644\u0644\u0627\u062e\u062a\u064a\u0627\u0631"}</div>
              <div className="drop-s">\u064a\u064f\u0642\u0628\u0644 \u0631\u0641\u0639 \u0639\u062f\u0629 \u0645\u0644\u0641\u0627\u062a \u0628\u0635\u064a\u063a\u0629 xls. \u0623\u0648 xlsx.</div>
              <input ref={inputRef} type="file" multiple accept=".xls,.xlsx" style={{ display: "none" }} onChange={onInput} />
            </div>
            {err ? <div className="err">\u062a\u0639\u0630\u0651\u0631\u062a \u0627\u0644\u0645\u0639\u0627\u0644\u062c\u0629: {err}</div> : null}
            <div className="drop-note">\u062a\u064f\u0639\u0627\u0644\u064e\u062c \u0627\u0644\u0645\u0644\u0641\u0627\u062a \u0628\u0627\u0644\u0643\u0627\u0645\u0644 \u062f\u0627\u062e\u0644 \u0627\u0644\u0645\u062a\u0635\u0641\u0651\u062d \u0648\u0644\u0627 \u062a\u064f\u0631\u0641\u0639 \u0625\u0644\u0649 \u0623\u064a \u062e\u0627\u062f\u0645. \u0628\u0645\u0627 \u0623\u0646\u0651 \u0627\u0644\u0631\u0641\u0639 \u0644\u0634\u0647\u0631\u064d \u0648\u0627\u062d\u062f\u060c \u062a\u064f\u0639\u0631\u064e\u0636 \u0644\u0642\u0637\u0629 \u0623\u062f\u0627\u0621 (\u062f\u0648\u0646 \u0627\u062a\u062c\u0627\u0647\u0627\u062a \u0623\u0648 \u0646\u0645\u0648 \u0632\u0645\u0646\u064a).</div>
          </div>
        ) : (
          <div>
            <div className="hero" style={{ paddingBottom: 0 }}>
              <span className="ey">\u0644\u0648\u062d\u0629 \u062a\u0646\u0641\u064a\u0630\u064a\u0629 \u00b7 \u0628\u064a\u0627\u0646\u0627\u062a \u0641\u0639\u0644\u064a\u0629</span>
              <h1>\u0627\u0644\u0645\u0624\u0634\u0631\u0627\u062a \u0627\u0644\u0645\u0635\u0631\u0641\u064a\u0629 \u0644\u0644\u0639\u0645\u0644\u0627\u062a \u0627\u0644\u0623\u062c\u0646\u0628\u064a\u0629</h1>
            </div>
            <div dangerouslySetInnerHTML={{ __html: html }} />
            <div className="foot">\u0645\u0648\u0644\u0651\u062f\u0629 \u0645\u0646 \u0627\u0644\u062a\u0642\u0627\u0631\u064a\u0631 \u0627\u0644\u0631\u0642\u0627\u0628\u064a\u0629 \u0627\u0644\u0645\u0631\u0641\u0648\u0639\u0629 \u00b7 convo.finance</div>
          </div>
        )}
      </div>
    </div>
  );
}
