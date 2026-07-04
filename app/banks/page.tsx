'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { BANKS } from '@/lib/banks-config'
import SettingsPanel from '@/components/SettingsPanel'
import { createClient } from '@supabase/supabase-js'
import { useLang } from '@/lib/LangContext'
import { t as i18nDict } from '@/lib/i18n'

function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}

const ARAB_BANK_ID = 1
const USD_TO_JOD = 0.71

function toJOD(n: number | null | undefined, bankId: number): number | null {
  // Rows are pre-normalized to JOD at load (cfNorm, 0.709) — identity here to avoid double conversion
  if (n == null) return null
  return n
}

function fmtK(n: number | null | undefined, bankId?: number): string {
  if (n == null) return '-'
  const v = bankId != null ? toJOD(n, bankId) : n
  if (v == null) return '-'
  const abs = Math.abs(v)
  if (abs >= 1_000_000) return `JOD ${(v/1_000_000).toFixed(2)}B`
  if (abs >= 1_000) return `JOD ${(v/1_000).toFixed(1)}M`
  return `JOD ${v.toFixed(0)}K`
}

function pctDelta(curr: number, prev: number): number | null {
  if (!prev) return null
  return ((curr - prev) / Math.abs(prev)) * 100
}

// BankLogo: uses official logo from bank website, falls back to initials if image fails
function BankLogo({ bank }: { bank: any }) {
  const [imgFailed, setImgFailed] = useState(false)
  const MONO: Record<number, string> = { 1:'AB', 2:'HBTF', 3:'JKB', 4:'CB', 5:'BAE', 6:'CAB', 7:'AHLI', 8:'AJIB', 9:'JIB', 10:'SIB', 11:'IIAB', 12:'BOJ', 13:'IB', 14:'ABC', 15:'JCB' }
  const abbr = MONO[bank.id] || bank.ticker || '?'
  if (bank.logoUrl && !imgFailed) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={bank.logoUrl} alt={bank.name} onError={() => setImgFailed(true)} style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 8, background: '#fff', padding: 4 }} />
  }
  const fontSize = abbr.length >= 4 ? 12 : abbr.length === 3 ? 14 : 17
  const base = bank.primaryColor || '#004D8F'
  return (
    <div style={{ width: '100%', height: '100%', borderRadius: 11, background: 'linear-gradient(145deg, ' + base + ' 0%, ' + base + 'C2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ color: '#fff', fontSize, fontWeight: 800, letterSpacing: '0.01em', textAlign: 'center', lineHeight: 1, fontFamily: 'system-ui, -apple-system, sans-serif' }}>{abbr}</span>
    </div>
  )
}
export default function Dashboard() {
  const router = useRouter()
  const { lang } = useLang()
  const L = i18nDict[lang]
  const isAr = lang === 'ar'
  const [dark, setDark] = useState(false)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'conventional' | 'islamic'>('all')
  const [financials, setFinancials] = useState<Record<number, any>>({})
  const [prevFinancials, setPrevFinancials] = useState<Record<number, any>>({})
  const [loading, setLoading] = useState(true)
  const [dataYear, setDataYear] = useState(2025)
  const [selectedYear, setSelectedYear] = useState(2025)
  const [hovered, setHovered] = useState<number | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem('hbtf-theme')
    const sysDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const isDark = stored === 'dark' || (!stored && sysDark)
    setDark(isDark)
    document.documentElement.classList.toggle('dark', isDark)
  }, [])

  const toggleTheme = () => {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('hbtf-theme', next ? 'dark' : 'light')
  }

  const cfNorm = (r: any) => { if (r && r.currency === 'USD' && !r.__cfJod) { const F = ['total_assets','net_profit','customer_deposits','net_loans','total_equity','operating_income','net_interest_income','gross_loans','total_liabilities']; F.forEach((k) => { if (typeof r[k] === 'number') r[k] = r[k] * 0.709 }); r.__cfJod = true } return r }

  useEffect(() => {
    setLoading(true)
    async function load() {
      const sb = getSupabase()
      const [curr, prev] = await Promise.all([
        sb.from('bank_financials').select('*').eq('fiscal_year', selectedYear),
        sb.from('bank_financials').select('*').eq('fiscal_year', selectedYear - 1),
      ])
      if (curr.data && curr.data.length > 0) {
        const m: Record<number,any> = {}
        curr.data.forEach((r: any) => { m[r.bank_id] = cfNorm(r) })
        setFinancials(m); setDataYear(selectedYear)
      }
      if (prev.data) {
        const m: Record<number,any> = {}
        prev.data.forEach((r: any) => { m[r.bank_id] = cfNorm(r) })
        setPrevFinancials(m)
      }
      setLoading(false)
    }
    load()
  }, [selectedYear])

  const t = {
    bg: 'var(--cf-bg)', surface: 'var(--cf-surface)',
    surfaceHover: 'var(--cf-surface2)', border: 'var(--cf-line)',
    text: 'var(--cf-ink)', textSub: 'var(--cf-ink2)',
    textMuted: 'var(--cf-ink3)', accent: 'var(--cf-primary)',
    green: 'var(--cf-positive)', red: 'var(--cf-negative)',
    inputBg: 'var(--cf-surface)', pillBg: 'var(--cf-primary-soft)',
    shadow: 'none',
  }

  const jodBanks = BANKS.filter(b => b.id !== ARAB_BANK_ID)
  const grandAssets = jodBanks.reduce((s,b) => s+(financials[b.id]?.total_assets??0),0) + (toJOD(financials[ARAB_BANK_ID]?.total_assets,ARAB_BANK_ID)??0)
  const grandProfit = jodBanks.reduce((s,b) => s+(financials[b.id]?.net_profit??0),0) + (toJOD(financials[ARAB_BANK_ID]?.net_profit,ARAB_BANK_ID)??0)
  const roeVals = BANKS.map(b => financials[b.id]?.roe).filter(Boolean) as number[]
  const avgROE = roeVals.length ? roeVals.reduce((a,b)=>a+b,0)/roeVals.length : null
  const carVals = BANKS.map(b => financials[b.id]?.car).filter(Boolean) as number[]
  const avgCAR = carVals.length ? carVals.reduce((a,b)=>a+b,0)/carVals.length : null

  const AR_TAGS: Record<number,string> = {"1":"أكبر بنك أردني بشبكة عالمية في أكثر من 25 دولة.","2":"ثاني أكبر بنوك المملكة وأوسع شبكة فروع محلية.","3":"تابع لمجموعة KIPCO، الأسرع نمواً في الأرباح.","4":"مجموعة مصرفية إقليمية سريعة النمو (الأردن والعراق والسعودية).","5":"بنك متوسط الحجم رائد في الخدمات الرقمية وتمويل المنشآت الصغيرة.","6":"يدير 103 فروع في الأردن و22 في فلسطين.","7":"من أعرق البنوك الأردنية، تأسس عام 1955.","8":"متخصص في الخدمات المصرفية للشركات والاستثمار.","9":"أكبر بنك إسلامي في الأردن.","10":"مصرفية متوافقة مع الشريعة، المساهم الرئيسي الاتحاد للاستثمارات الإسلامية.","11":"ذراع الصيرفة الإسلامية المملوك بالكامل للبنك العربي، 47 فرعاً.","12":"بنك تجاري عريق تأسس عام 1960 بحضور قوي في فلسطين.","13":"بنك متخصص أصغر حجماً بملكية عائلية فلسطينية وخليجية.","14":"مملوك بنسبة 87% لمؤسسة المصرفية العربية البحرين.","15":"أصغر بنك أردني مدرج."};
const filtered = BANKS.filter(b => {
    if (filter==='conventional' && b.sector!=='conventional') return false
    if (filter==='islamic' && b.sector!=='islamic') return false
    if (search) { const q=search.toLowerCase(); if (!b.name.toLowerCase().includes(q)&&!b.shortName.toLowerCase().includes(q)&&!b.ticker.toLowerCase().includes(q)) return false }
    return true
  })

  return (
    <div dir={isAr ? 'rtl' : 'ltr'} style={{ minHeight:'100vh', backgroundColor:t.bg, fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif', color:t.text }}>
      <main style={{ maxWidth:1200, margin:'0 auto', padding:'32px 24px' }}>
        <div style={{ marginBottom:28 }}>
          <h1 style={{ fontSize:28, fontWeight:700, margin:'0 0 8px', color:t.text }}>{L.bk_title}</h1>
          <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
            <span style={{ fontSize:14, color:t.textSub }}>FY{dataYear} data &middot; All figures in JOD unless noted</span>
            <div style={{ display:'flex', gap:4 }}>
              {[2025,2024,2023].map(yr => (
                <button key={yr} onClick={() => setSelectedYear(yr)} style={{ padding:'3px 10px', borderRadius:20, fontSize:12, fontWeight:500, cursor:'pointer', backgroundColor:selectedYear===yr?t.accent:'transparent', color:selectedYear===yr?'#fff':t.textSub, border:`1px solid ${selectedYear===yr?t.accent:t.border}`, transition:'all 0.15s' }}>{yr}</button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:32 }}>
          {[
            { label:L.bk_combinedAssets, value:fmtK(grandAssets), sub:'All 15 banks, group basis' },
            { label:L.bk_combinedProfit, value:fmtK(grandProfit), sub:`FY${dataYear}` },
            { label:L.bk_avgROE, value:avgROE!=null?`${avgROE.toFixed(1)}%`:'-', sub:L.bk_roeSub },
            { label:L.bk_avgCAR, value:avgCAR!=null?`${avgCAR.toFixed(1)}%`:'-', sub:L.bk_carSub },
          ].map((kpi,i) => (
            <div key={i} style={{ backgroundColor:t.surface, borderRadius:12, padding:'16px 18px', border:`1px solid ${t.border}`, boxShadow:t.shadow }}>
              <div style={{ fontSize:11, color:t.textSub, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:6 }}>{kpi.label}</div>
              <div style={{ fontSize:22, fontWeight:700, color:t.text }}>{loading?'...':kpi.value}</div>
              <div style={{ fontSize:11, color:t.textMuted, marginTop:4 }}>{kpi.sub}</div>
            </div>
          ))}
        </div>

        <div style={{ display:'flex', gap:12, marginBottom:24, alignItems:'center', flexWrap:'wrap' }}>
          <div style={{ position:'relative', flex:1, minWidth:200 }}>
            <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:t.textMuted, fontSize:14 }}>&#128269;</span>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={L.bk_search} style={{ width:'100%', backgroundColor:t.inputBg, border:`1px solid ${t.border}`, borderRadius:10, padding:'9px 12px 9px 34px', fontSize:14, color:t.text, outline:'none', boxSizing:'border-box' }} />
          </div>
          <div style={{ display:'flex', gap:6 }}>
            {(['all','conventional','islamic'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{ padding:'8px 16px', borderRadius:20, fontSize:13, fontWeight:500, cursor:'pointer', backgroundColor:filter===f?t.accent:t.surface, color:filter===f?'#fff':t.textSub, border:`1px solid ${filter===f?t.accent:t.border}`, transition:'all 0.15s' }}>
                {f==='all'?L.bk_allBanks:f==='conventional'?L.bk_commercial:L.bk_islamic}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))', gap:16 }}>
          {filtered.map(bank => {
            const fin = financials[bank.id]
            const prev = prevFinancials[bank.id]
            const delta = fin?.net_profit&&prev?.net_profit ? pctDelta(fin.net_profit,prev.net_profit) : null
            return <BankCard key={bank.id} bank={bank} fin={fin} delta={delta} loading={loading} dark={dark} t={t} dataYear={dataYear} hovered={hovered===bank.id} onMouseEnter={() => setHovered(bank.id)} onMouseLeave={() => setHovered(null)} onClick={() => router.push(`/bank/${bank.id}`)} onAsk={() => router.push(`/chat?bank=${bank.id}`)} />
          })}
        </div>
        {filtered.length===0 && <div style={{ textAlign:'center', padding:'60px 0', color:t.textSub }}>{L.bk_noMatch}</div>}
      </main>
    </div>
  )
}

function BankCard({ bank, fin, delta, loading, dark, t, dataYear, hovered, onMouseEnter, onMouseLeave, onClick, onAsk }: any) {
  const { lang } = useLang()
  const L = i18nDict[lang]
  const isAr = lang === 'ar'
  return (
    <div onClick={onClick} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} style={{ backgroundColor:hovered?t.surfaceHover:t.surface, border:`1px solid ${hovered?t.accent+'55':t.border}`, borderRadius:14, padding:20, cursor:'pointer', transition:'all 0.15s ease', transform:hovered?'translateY(-2px)':'none', boxShadow:hovered?`0 8px 24px ${dark?'rgba(0,0,0,0.5)':'rgba(0,0,0,0.1)'}`:t.shadow }}>
 <div style={{ minHeight:22, display:'flex', justifyContent:'flex-end', marginBottom:4 }}>
      {bank.isHBTF && <span style={{ fontSize:10, fontWeight:700, color:t.accent, backgroundColor:'color-mix(in srgb, '+t.accent+' 10%, transparent)', padding:'2px 8px', borderRadius:20, letterSpacing:'0.05em' }}>{L.bk_ourBank}</span>}
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
        <div style={{ width:44, height:44, borderRadius:10, backgroundColor:'var(--cf-line)', border:`1px solid ${t.border}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, overflow:'hidden' }}>
          <BankLogo bank={bank} />
        </div>
        <div>
          <div style={{ fontWeight:600, fontSize:15, color:t.text }}>{isAr ? bank.nameAr : bank.name}</div>
          <div style={{ fontSize:12, color:t.textSub, marginTop:2 }}>{bank.sector==='islamic'?(isAr?'إسلامي':'Islamic'):(isAr?'تجاري':'Commercial')} &middot; {bank.ticker}</div>
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
        <div style={{ backgroundColor:'var(--cf-surface2)', borderRadius:10, padding:'12px 14px' }}>
          <div style={{ fontSize:11, color:t.textSub, marginBottom:4, textTransform:'uppercase', letterSpacing:'0.04em' }}>{L.bk_netProfit}</div>
          <div style={{ fontSize:16, fontWeight:700, color:t.text }}>{loading?'...':(fin?fmtK(fin.net_profit,bank.id):'-')}</div>
          {delta!=null&&!loading&&<div style={{ fontSize:11, color:delta>=0?t.green:t.red, marginTop:3, fontWeight:500 }}>{delta>=0?String.fromCharCode(8593):String.fromCharCode(8595)} {Math.abs(delta).toFixed(1)}% vs {dataYear-1}</div>}
        </div>
        <div style={{ backgroundColor:'var(--cf-surface2)', borderRadius:10, padding:'12px 14px' }}>
          <div style={{ fontSize:11, color:t.textSub, marginBottom:4, textTransform:'uppercase', letterSpacing:'0.04em' }}>{L.bk_totalAssets}</div>
          <div style={{ fontSize:16, fontWeight:700, color:t.text }}>{loading?'...':(fin?fmtK(fin.total_assets,bank.id):'-')}</div>
          {fin?.roe!=null&&!loading&&<div style={{ fontSize:11, color:t.textSub, marginTop:3 }}>ROE {fin.roe.toFixed(1)}%</div>}
        </div>
      </div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <span style={{ fontSize:12, color:t.textSub }}>{String((isAr ? (AR_TAGS[bank.id] || bank.description) : bank.description) || '').slice(0,52)}...</span>
        <span onClick={(e: any) => { e.stopPropagation(); if (onAsk) onAsk() }} style={{ backgroundColor:hovered?t.accent:('var(--cf-surface2)'), color:hovered?'#fff':t.textSub, borderRadius:8, padding:'5px 12px', fontSize:12, fontWeight:500, transition:'all 0.15s', whiteSpace:'nowrap', marginLeft:8 }}>{L.bk_askAI}</span>
      </div>
    </div>
  )
}
