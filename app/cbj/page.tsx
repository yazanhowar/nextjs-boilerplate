'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BANKS } from '@/lib/banks-config';

const CSS = ".cbjx-wrap{min-height:100vh;background:#f4f7fa;color:#0c3057;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;padding:28px 32px 64px;box-sizing:border-box;}\nhtml.dark .cbjx-wrap{background:#0a1626;color:#e8eef5;}\n.cbjx-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:34px;}\n.cbjx-brand{display:flex;align-items:center;gap:10px;}\n.cbjx-logo{height:34px;width:auto;display:block;}\n.cbjx-controls{display:flex;align-items:center;gap:8px;}\n.cbjx-btn{border:1px solid #d6deea;background:#fff;color:#0c3057;border-radius:999px;padding:7px 14px;font-size:13px;font-weight:600;cursor:pointer;line-height:1;}\n.cbjx-btn:hover{border-color:#3a6ea5;}\nhtml.dark .cbjx-btn{background:#11233a;color:#e8eef5;border-color:#1f3a5a;}\n.cbjx-hero{margin-bottom:24px;}\n.cbjx-kicker{color:#b0883c;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;margin-bottom:8px;}\n.cbjx-h1{font-size:30px;font-weight:800;margin:0 0 8px;letter-spacing:-.02em;}\n.cbjx-sub{color:#64748b;font-size:15px;margin:0;max-width:660px;line-height:1.5;}\nhtml.dark .cbjx-sub{color:#93a5bd;}\n.cbjx-actions{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:40px;}\n.cbjx-action{background:#fff;border:1px solid #e2e8f0;border-top:3px solid #3a6ea5;border-radius:14px;padding:18px 18px 20px;cursor:pointer;transition:transform .12s ease,box-shadow .12s ease;}\n.cbjx-action:hover{transform:translateY(-2px);box-shadow:0 10px 24px rgba(12,48,87,.10);}\nhtml.dark .cbjx-action{background:#11233a;border-color:#1f3a5a;}\n.cbjx-action-title{font-size:16px;font-weight:700;margin-bottom:5px;}\n.cbjx-action-desc{font-size:13px;color:#64748b;line-height:1.45;}\nhtml.dark .cbjx-action-desc{color:#93a5bd;}\n.cbjx-section-h{font-size:13px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#64748b;margin:0 0 16px;}\nhtml.dark .cbjx-section-h{color:#93a5bd;}\n.cbjx-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(252px,1fr));gap:12px;}\n.cbjx-bank{display:flex;align-items:center;gap:12px;background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:13px 14px;cursor:pointer;transition:transform .12s ease,box-shadow .12s ease,border-color .12s ease;}\n.cbjx-bank:hover{transform:translateY(-2px);box-shadow:0 8px 20px rgba(12,48,87,.10);border-color:#3a6ea5;}\nhtml.dark .cbjx-bank{background:#11233a;border-color:#1f3a5a;}\n.cbjx-bank-logo{width:42px;height:42px;border-radius:9px;display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden;border:1px solid #eef2f7;background:#fff;}\nhtml.dark .cbjx-bank-logo{border-color:#24405f;}\n.cbjx-bank-meta{flex:1;min-width:0;}\n.cbjx-bank-name{font-size:14px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}\n.cbjx-bank-ticker{font-size:12px;color:#64748b;margin-top:2px;}\nhtml.dark .cbjx-bank-ticker{color:#93a5bd;}\n.cbjx-bank-cta{color:#3a6ea5;font-size:20px;font-weight:700;flex-shrink:0;}\n.cbjx-foot{margin-top:40px;font-size:12px;color:#94a3b8;line-height:1.5;}\nhtml.dark .cbjx-foot{color:#6b7f97;}";
const T = {"en":{"kicker":"Central Bank of Jordan","h1":"CBJ Regulatory Returns","sub":"View each bank's regulatory filing dashboard, explore the sector aggregate, or ask ZAD about any submission.","sectorTitle":"Sector Aggregate (ABJ)","sectorDesc":"Association of Banks in Jordan — total assets, deposits and credit facilities across all licensed banks.","askTitle":"Ask ZAD","askDesc":"Put a question to the analyst about CBJ returns, ratios or any bank's filings.","uploadTitle":"Upload a CBJ Return","uploadDesc":"Drop a regulatory return file to auto-detect the form and render its dashboard.","banksHeading":"Banks — regulatory dashboards","conventional":"Conventional","islamic":"Islamic","foot":"Per-bank dashboards render uploaded CBJ regulatory returns. Sector figures are published by the Association of Banks in Jordan."},"ar":{"kicker":"البنك المركزي الأردني","h1":"التقارير الرقابية للبنك المركزي","sub":"اطّلع على لوحة التقارير الرقابية لكل بنك، أو استكشف المؤشرات على مستوى القطاع، أو اسأل زاد عن أي تقرير.","sectorTitle":"إجمالي القطاع (جمعية البنوك)","sectorDesc":"جمعية البنوك في الأردن — إجمالي الموجودات والودائع والتسهيلات الائتمانية لكل البنوك المرخّصة.","askTitle":"اسأل زاد","askDesc":"اطرح سؤالاً على المحلّل حول التقارير الرقابية أو النِسب أو ملفات أي بنك.","uploadTitle":"رفع تقرير رقابي","uploadDesc":"أرفِق ملف التقرير الرقابي ليتم تحديد النموذج تلقائياً وعرض لوحته.","banksHeading":"البنوك — اللوحات الرقابية","conventional":"تقليدي","islamic":"إسلامي","foot":"تعرض لوحات البنوك التقارير الرقابية المرفوعة. وتصدر بيانات القطاع عن جمعية البنوك في الأردن."}};

const h = React.createElement;
export default function CbjPage(){
  const [lang,setLang]=useState('en');
  const [dark,setDark]=useState(false);
  const router=useRouter();
  useEffect(function(){
    try{
      var l=localStorage.getItem('cf_lang'); if(l==='ar'||l==='en'){ setLang(l); }
      var t=localStorage.getItem('theme'); var d=(t==='dark'); setDark(d);
      var de=document.documentElement; if(d){ de.classList.add('dark'); } else { de.classList.remove('dark'); }
    }catch(e){}
  },[]);
  useEffect(function(){
    try{ var de=document.documentElement; de.lang=lang; de.dir=(lang==='ar'?'rtl':'ltr'); }catch(e){}
  },[lang]);
  var tr=T[lang]; var isAr=(lang==='ar');
  function toggleLang(){ var nl=(lang==='ar'?'en':'ar'); setLang(nl); try{ localStorage.setItem('cf_lang',nl); }catch(e){} }
  function toggleTheme(){ var nd=!dark; setDark(nd); try{ localStorage.setItem('theme', nd?'dark':'light'); }catch(e){} var de=document.documentElement; if(nd){ de.classList.add('dark'); } else { de.classList.remove('dark'); } }
  function go(u){ router.push(u); }
  var logoSrc=(isAr?'/convo-zad-ar.svg':'/convo-zad-en.svg');
  var actions=[
    {t:tr.sectorTitle,d:tr.sectorDesc,u:'/sector',c:'#3a6ea5'},
    {t:tr.askTitle,d:tr.askDesc,u:'/chat?focus=cbj',c:'#b0883c'},
    {t:tr.uploadTitle,d:tr.uploadDesc,u:'/upload',c:'#0c3057'}
  ];
  return h('div',{className:'cbjx-wrap',dir:(isAr?'rtl':'ltr')},
    h('style',{dangerouslySetInnerHTML:{__html:CSS}}),
    h('div',{className:'cbjx-top'},
      h('div',{className:'cbjx-brand'}, h('img',{className:'cbjx-logo',src:logoSrc,alt:'ZAD'})),
      h('div',{className:'cbjx-controls'},
        h('button',{className:'cbjx-btn',onClick:toggleLang}, isAr?'EN':'العربية'),
        h('button',{className:'cbjx-btn',onClick:toggleTheme,'aria-label':'theme'}, dark?'☀':'☾')
      )
    ),
    h('div',{className:'cbjx-hero'},
      h('div',{className:'cbjx-kicker'}, tr.kicker),
      h('h1',{className:'cbjx-h1'}, tr.h1),
      h('p',{className:'cbjx-sub'}, tr.sub)
    ),
    h('div',{className:'cbjx-actions'},
      actions.map(function(a,i){ return h('div',{key:i,className:'cbjx-action',onClick:function(){ go(a.u); },style:{borderTopColor:a.c}},
        h('div',{className:'cbjx-action-title'}, a.t),
        h('div',{className:'cbjx-action-desc'}, a.d)
      ); })
    ),
    h('div',{className:'cbjx-section-h'}, tr.banksHeading),
    h('div',{className:'cbjx-grid'},
      BANKS.map(function(b){ return h('div',{key:b.ticker,className:'cbjx-bank',onClick:function(){ go('/upload?bank='+b.ticker); }},
        h('div',{className:'cbjx-bank-logo'}, h('img',{src:b.logoUrl,alt:b.shortName,style:{maxWidth:'100%',maxHeight:'100%',objectFit:'contain'},onError:function(e){ e.target.style.display='none'; }})),
        h('div',{className:'cbjx-bank-meta'},
          h('div',{className:'cbjx-bank-name'}, isAr?(b.nameAr||b.name):b.name),
          h('div',{className:'cbjx-bank-ticker'}, b.ticker+' · '+(b.sector==='islamic'?tr.islamic:tr.conventional))
        ),
        h('div',{className:'cbjx-bank-cta'}, isAr?'‹':'›')
      ); })
    ),
    h('div',{className:'cbjx-foot'}, tr.foot)
  );
}
