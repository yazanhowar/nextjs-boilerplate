'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { BANKS } from '@/lib/banks-config'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}

const ARAB_BANK_ID = 1
const USD_TO_JOD = 0.71

function toJOD(n: number | null | undefined, bankId: number): number | null {
  if (n == null) return null
  return bankId === ARAB_BANK_ID ? n * USD_TO_JOD : n
}

function fmtK(n: number | null | undefined, bankId?: number): string {
  if (n == null) return '—'
  const v = bankId != null ? toJOD(n, bankId) : n
  if (v == null) return '—'
  const abs = Math.abs(v)
  if (abs >= 1_000_000) return `JOD ${(v/1_000_000).toFixed(2)}B`
  if (abs >= 1_000) return `JOD ${(v/1_000).toFixed(1)}M`
  return `JOD ${v.toFixed(0)}K`
}

function pctDelta(curr: number, prev: number): number | null {
  if (!prev) return null
  return ((curr - prev) / Math.abs(prev)) * 100
}

// BankLogo: shows favicon if available, otherwise a clean colored-initials branded box
function BankLogo({ bank, dark }: { bank: any; dark: boolean }) {
  const [failed, setFailed] = useState(false)
  const MONO: Record<number, string> = { 1:'AB', 2:'HBTF', 3:'JKB', 4:'CB', 5:'BAE', 6:'CAB', 7:'AHLI', 8:'AJIB', 9:'JIB', 10:'SIB', 11:'IIAB', 12:'BOJ', 13:'IB', 14:'ABC', 15:'JCB' }
  const abbr = MONO[bank.id] || (bank.shortName || bank.name || '?').replace(/[^A-Za-z]/g, '').slice(0, 4).toUpperCase()
  const fontSize = abbr.length >= 4 ? 12 : abbr.length === 3 ? 14 : abbr.length === 2 ? 17 : 20
  const base = bank.primaryColor || (dark ? '#3B82F6' : '#004D8F')
  // Subtle two-stop vertical gradient derived from the brand color for a crisp, intentional tile
  const grad = `linear-gradient(150deg, ${base} 0%, ${base}E6 55%, ${base}C8 100%)`
  if (!bank.logoUrl || failed) {
    return (
      <div style={{ width: '100%', height: '100%', borderRadius: 11, background: grad, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18)' }}>
        <span style={{ color: '#fff', fontSize, fontWeight: 800, letterSpacing: '0.02em', textAlign: 'center', lineHeight: 1, fontFamily: 'system-ui, -apple-system, sans-serif' }}>{abbr}</span>
      </div>
    )
  }
  return (
    <div style={{ width: '100%', height: '100%', borderRadius: 11, background: dark ? '#FFFFFF' : '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: 6 }}>
      <img src={bank.logoUrl} alt={bank.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} onError={() => setFailed(true)} />
    </div>
  )
}

export default function Dashboard() {
  const router = useRouter()
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
        curr.data.forEach((r: any) => { m[r.bank_id] = r })
        setFinancials(m); setDataYear(selectedYear)
      }
      if (prev.data) {
        const m: Record<number,any> = {}
        prev.data.forEach((r: any) => { m[r.bank_id] = r })
        setPrevFinancials(m)
      }
      setLoading(false)
    }
    load()
  }, [selectedYear])

  const t = {
    bg: dark ? '#0A1628' : '#F2F4F7', surface: dark ? '#0F1E35' : '#FFFFFF',
    surfaceHover: dark ? '#132240' : '#F0F4FA', border: dark ? '#1E3450' : '#DDE2EA',
    text: dark ? '#FFFFFF' : '#0F172A', textSub: dark ? '#8B9AB0' : '#4A5568',
    textMuted: dark ? '#4A5568' : '#94A3B8', accent: dark ? '#3B82F6' : '#004D8F',
    green: dark ? '#2ECC71' : '#16A34A', red: dark ? '#E05252' : '#DC2626',
    inputBg: dark ? '#0F1E35' : '#FFFFFF', pillBg: dark ? '#132240' : '#EEF2F7',
    shadow: dark ? 'none' : '0 1px 4px rgba(0,0,0,0.07)',
  }

  const jodBanks = BANKS.filter(b => b.id !== ARAB_BANK_ID)
  const grandAssets = jodBanks.reduce((s,b) => s+(financials[b.id]?.total_assets??0),0) + (toJOD(financials[ARAB_BANK_ID]?.total_assets,ARAB_BANK_ID)??0)
  const grandProfit = jodBanks.reduce((s,b) => s+(financials[b.id]?.net_profit??0),0) + (toJOD(financials[ARAB_BANK_ID]?.net_profit,ARAB_BANK_ID)??0)
  const roeVals = BANKS.map(b => financials[b.id]?.roe).filter(Boolean) as number[]
  const avgROE = roeVals.length ? roeVals.reduce((a,b)=>a+b,0)/roeVals.length : null
  const carVals = BANKS.map(b => financials[b.id]?.car).filter(Boolean) as number[]
  const avgCAR = carVals.length ? carVals.reduce((a,b)=>a+b,0)/carVals.length : null

  const filtered = BANKS.filter(b => {
    if (filter==='conventional' && b.sector!=='conventional') return false
    if (filter==='islamic' && b.sector!=='islamic') return false
    if (search) { const q=search.toLowerCase(); if (!b.name.toLowerCase().includes(q)&&!b.shortName.toLowerCase().includes(q)&&!b.ticker.toLowerCase().includes(q)) return false }
    return true
  })

  return (
    <div style={{ minHeight:'100vh', backgroundColor:t.bg, fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif', color:t.text }}>
      <header style={{ backgroundColor:dark?'rgba(10,22,40,0.9)':'rgba(242,244,247,0.9)', backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)', borderBottom:`1px solid ${t.border}`, position:'sticky', top:0, zIndex:100 }}>
        <div style={{ maxWidth:1200, margin:'0 auto', height:52, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 24px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:28, height:28, borderRadius:8, backgroundColor:t.accent, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <span style={{ color:'#fff', fontSize:11, fontWeight:700 }}>HB</span>
            </div>
            <span style={{ fontWeight:600, fontSize:15, color:t.text }}>HBTF Intelligence</span>
            <span style={{ fontSize:12, color:t.textMuted, marginLeft:4 }}>Jordan Banking Sector</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <button onClick={toggleTheme} style={{ width:36, height:36, borderRadius:8, border:`1px solid ${t.border}`, background:t.surface, cursor:'pointer', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center' }}>
              {dark ? '☀️' : '🌙'}
            </button>
            <button onClick={() => router.push('/chat')} style={{ backgroundColor:t.accent, color:'#fff', border:'none', borderRadius:8, padding:'7px 16px', fontSize:13, fontWeight:500, cursor:'pointer' }}>
              Open AI Analyst
            </button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth:1200, margin:'0 auto', padding:'32px 24px' }}>
        <div style={{ marginBottom:28 }}>
          <h1 style={{ fontSize:28, fontWeight:700, margin:'0 0 8px', color:t.text }}>Jordanian Banks</h1>
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
            { label:'Sector Total Assets', value:fmtK(grandAssets), sub:'All 15 banks combined' },
            { label:'Sector Net Profit', value:fmtK(grandProfit), sub:`FY${dataYear}` },
            { label:'Avg ROE', value:avgROE!=null?`${avgROE.toFixed(1)}%`:'—', sub:'Return on equity' },
            { label:'Avg CAR', value:avgCAR!=null?`${avgCAR.toFixed(1)}%`:'—', sub:'Capital adequacy' },
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
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search banks..." style={{ width:'100%', backgroundColor:t.inputBg, border:`1px solid ${t.border}`, borderRadius:10, padding:'9px 12px 9px 34px', fontSize:14, color:t.text, outline:'none', boxSizing:'border-box' }} />
          </div>
          <div style={{ display:'flex', gap:6 }}>
            {(['all','conventional','islamic'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{ padding:'8px 16px', borderRadius:20, fontSize:13, fontWeight:500, cursor:'pointer', backgroundColor:filter===f?t.accent:t.surface, color:filter===f?'#fff':t.textSub, border:`1px solid ${filter===f?t.accent:t.border}`, transition:'all 0.15s' }}>
                {f==='all'?'All banks':f==='conventional'?'Commercial':'Islamic'}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))', gap:16 }}>
          {filtered.map(bank => {
            const fin = financials[bank.id]
            const prev = prevFinancials[bank.id]
            const delta = fin?.net_profit&&prev?.net_profit ? pctDelta(fin.net_profit,prev.net_profit) : null
            return <BankCard key={bank.id} bank={bank} fin={fin} delta={delta} loading={loading} dark={dark} t={t} dataYear={dataYear} hovered={hovered===bank.id} onMouseEnter={() => setHovered(bank.id)} onMouseLeave={() => setHovered(null)} onClick={() => router.push(`/chat?bank=${bank.id}`)} />
          })}
        </div>
        {filtered.length===0 && <div style={{ textAlign:'center', padding:'60px 0', color:t.textSub }}>No banks match your search.</div>}
      </main>
    </div>
  )
}

function BankCard({ bank, fin, delta, loading, dark, t, dataYear, hovered, onMouseEnter, onMouseLeave, onClick }: any) {
  return (
    <div onClick={onClick} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} style={{ backgroundColor:hovered?t.surfaceHover:t.surface, border:`1px solid ${hovered?t.accent+'55':t.border}`, borderRadius:14, padding:20, cursor:'pointer', transition:'all 0.15s ease', transform:hovered?'translateY(-2px)':'none', boxShadow:hovered?`0 8px 24px ${dark?'rgba(0,0,0,0.4)':'rgba(0,0,0,0.1)'}`:t.shadow }}>
      {bank.isHBTF && (
        <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:8 }}>
          <span style={{ fontSize:10, fontWeight:700, color:t.accent, backgroundColor:t.accent+'18', padding:'2px 8px', borderRadius:20, letterSpacing:'0.05em' }}>OUR BANK</span>
        </div>
      )}
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
        <div style={{ width:44, height:44, borderRadius:10, backgroundColor:dark?'#1E3450':'#F0F4FA', border:`1px solid ${t.border}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, overflow:'hidden' }}>
          <BankLogo bank={bank} dark={dark} t={t} />
        </div>
        <div>
          <div style={{ fontWeight:600, fontSize:15, color:t.text }}>{bank.name}</div>
          <div style={{ fontSize:12, color:t.textSub, marginTop:2 }}>{bank.sector==='islamic'?'Islamic':'Commercial'} &middot; {bank.ticker}</div>
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
        <div style={{ backgroundColor:dark?'#132240':'#F5F8FD', borderRadius:10, padding:'12px 14px' }}>
          <div style={{ fontSize:11, color:t.textSub, marginBottom:4, textTransform:'uppercase', letterSpacing:'0.04em' }}>Net Profit</div>
          <div style={{ fontSize:16, fontWeight:700, color:t.text }}>{loading?'...':(fin?fmtK(fin.net_profit,bank.id):'—')}</div>
          {delta!=null&&!loading&&<div style={{ fontSize:11, color:delta>=0?t.green:t.red, marginTop:3, fontWeight:500 }}>{delta>=0?'↑':'↓'} {Math.abs(delta).toFixed(1)}% vs {dataYear-1}</div>}
        </div>
        <div style={{ backgroundColor:dark?'#132240':'#F5F8FD', borderRadius:10, padding:'12px 14px' }}>
          <div style={{ fontSize:11, color:t.textSub, marginBottom:4, textTransform:'uppercase', letterSpacing:'0.04em' }}>Total Assets</div>
          <div style={{ fontSize:16, fontWeight:700, color:t.text }}>{loading?'...':(fin?fmtK(fin.total_assets,bank.id):'—')}</div>
          {fin?.roe!=null&&!loading&&<div style={{ fontSize:11, color:t.textSub, marginTop:3 }}>ROE {fin.roe.toFixed(1)}%</div>}
        </div>
      </div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <span style={{ fontSize:12, color:t.textSub }}>{bank.description.slice(0,52)}...</span>
        <span style={{ backgroundColor:hovered?t.accent:(dark?'#132240':'#EEF2F7'), color:hovered?'#fff':t.textSub, borderRadius:8, padding:'5px 12px', fontSize:12, fontWeight:500, transition:'all 0.15s', whiteSpace:'nowrap', marginLeft:8 }}>Ask AI</span>
      </div>
    </div>
  )
}
