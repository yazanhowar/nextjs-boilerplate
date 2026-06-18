'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const PRICE_IN = 0.22
const PRICE_OUT = 0.20

// Dummy spend trend data per period (JOD)
const TREND: Record<string, { label: string; spend: number; tokens: number }[]> = {
  week: [
    { label: 'Mon', spend: 42.5, tokens: 198 },
    { label: 'Tue', spend: 88.2, tokens: 410 },
    { label: 'Wed', spend: 61.0, tokens: 284 },
    { label: 'Thu', spend: 120.4, tokens: 560 },
    { label: 'Fri', spend: 95.7, tokens: 445 },
    { label: 'Sat', spend: 33.1, tokens: 154 },
    { label: 'Sun', spend: 18.9, tokens: 88 },
  ],
  month: [
    { label: 'Wk 1', spend: 312.5, tokens: 1450 },
    { label: 'Wk 2', spend: 488.0, tokens: 2270 },
    { label: 'Wk 3', spend: 401.2, tokens: 1866 },
    { label: 'Wk 4', spend: 559.8, tokens: 2604 },
  ],
  year: [
    { label: 'Jan', spend: 1240 }, { label: 'Feb', spend: 1580 },
    { label: 'Mar', spend: 1320 }, { label: 'Apr', spend: 1760 },
    { label: 'May', spend: 2100 }, { label: 'Jun', spend: 1890 },
    { label: 'Jul', spend: 2240 }, { label: 'Aug', spend: 1980 },
    { label: 'Sep', spend: 2410 }, { label: 'Oct', spend: 2680 },
    { label: 'Nov', spend: 2320 }, { label: 'Dec', spend: 2750 },
  ].map(d => ({ ...d, tokens: Math.round(d.spend * 4.6) })),
}

export default function SettingsPage() {
  const router = useRouter()
  const [dark, setDark] = useState(false)
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month')
  const [tokensIn, setTokensIn] = useState(0)
  const [tokensOut, setTokensOut] = useState(0)
  const [balance, setBalance] = useState(0)
  const [buyAmount, setBuyAmount] = useState('')
  const [toast, setToast] = useState('')

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark')
    setDark(isDark)
    setTokensIn(parseInt(localStorage.getItem('hbtf-tokens-in') || '0', 10))
    setTokensOut(parseInt(localStorage.getItem('hbtf-tokens-out') || '0', 10))
    setBalance(parseFloat(localStorage.getItem('hbtf-credit-balance') || '5000'))
  }, [])

  const spendIn = tokensIn * PRICE_IN
  const spendOut = tokensOut * PRICE_OUT
  const lifetime = spendIn + spendOut

  function buyCredits() {
    const amt = parseFloat(buyAmount)
    if (!amt || amt <= 0) { setToast('Enter a valid amount'); setTimeout(() => setToast(''), 2500); return }
    const next = balance + amt
    setBalance(next)
    localStorage.setItem('hbtf-credit-balance', String(next))
    setToast('Success! JOD ' + amt.toLocaleString('en-US', { minimumFractionDigits: 2 }) + ' added to your balance')
    setBuyAmount('')
    setTimeout(() => setToast(''), 3500)
  }

  const t = {
    bg: dark ? '#1a1a1a' : '#F3F4F6',
    card: dark ? '#242424' : '#FFFFFF',
    cardAlt: dark ? '#2a2a2a' : '#F9FAFB',
    text: dark ? '#FFFFFF' : '#1a1a1a',
    sub: dark ? '#9CA3AF' : '#6B7280',
    border: dark ? '#383838' : '#E5E7EB',
    accent: '#3B82F6',
  }

  function fmtJOD(n: number) { return 'JOD ' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }
  function fmtNum(n: number) { return n.toLocaleString('en-US') }

  const data = TREND[period]
  const periodSpend = data.reduce((s, d) => s + d.spend, 0)

  const cardStyle = { backgroundColor: t.card, border: '1px solid ' + t.border, borderRadius: 14, padding: 20 }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: t.bg, fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif', color: t.text }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid ' + t.border, backgroundColor: t.card }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: t.sub, padding: 0 }}>&larr; Dashboard</button>
          <div style={{ width: 1, height: 20, backgroundColor: t.border }} />
          <h1 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: t.text }}>Account &amp; Billing</h1>
        </div>
      </div>

      <div style={{ maxWidth: 920, margin: '0 auto', padding: '28px 24px 60px' }}>
        {/* Top stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
          <div style={cardStyle}>
            <div style={{ fontSize: 12, fontWeight: 600, color: t.sub, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>Credit Balance</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: t.accent }}>{fmtJOD(balance)}</div>
            <div style={{ fontSize: 12, color: t.sub, marginTop: 4 }}>Available to spend</div>
          </div>
          <div style={cardStyle}>
            <div style={{ fontSize: 12, fontWeight: 600, color: t.sub, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>Lifetime Spending</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: t.text }}>{fmtJOD(lifetime)}</div>
            <div style={{ fontSize: 12, color: t.sub, marginTop: 4 }}>All-time usage</div>
          </div>
          <div style={cardStyle}>
            <div style={{ fontSize: 12, fontWeight: 600, color: t.sub, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>Total Tokens</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: t.text }}>{fmtNum(tokensIn + tokensOut)}</div>
            <div style={{ fontSize: 12, color: t.sub, marginTop: 4 }}>{fmtNum(tokensIn)} in &middot; {fmtNum(tokensOut)} out</div>
          </div>
        </div>

        {/* Spend trend chart */}
        <div style={{ ...cardStyle, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: t.text }}>Spending Trend</div>
              <div style={{ fontSize: 13, color: t.sub, marginTop: 2 }}>{fmtJOD(periodSpend)} this {period}</div>
            </div>
            <div style={{ display: 'flex', gap: 4, backgroundColor: t.cardAlt, borderRadius: 9, padding: 3 }}>
              {(['week', 'month', 'year'] as const).map(p => (
                <button key={p} onClick={() => setPeriod(p)} style={{ border: 'none', cursor: 'pointer', borderRadius: 7, padding: '6px 14px', fontSize: 13, fontWeight: 600, textTransform: 'capitalize', backgroundColor: period === p ? t.accent : 'transparent', color: period === p ? '#fff' : t.sub }}>{p}</button>
              ))}
            </div>
          </div>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={t.border} vertical={false} />
                <XAxis dataKey="label" stroke={t.sub} fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke={t.sub} fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: t.card, border: '1px solid ' + t.border, borderRadius: 10, color: t.text, fontSize: 13 }}
                  formatter={(v: number) => [fmtJOD(v), 'Spend']}
                />
                <Area type="monotone" dataKey="spend" stroke="#3B82F6" strokeWidth={2.5} fill="url(#spendGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {/* Token breakdown */}
          <div style={cardStyle}>
            <div style={{ fontSize: 15, fontWeight: 700, color: t.text, marginBottom: 14 }}>Token Breakdown</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid ' + t.border }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: t.text }}>Tokens In</div>
                <div style={{ fontSize: 12, color: t.sub }}>{fmtNum(tokensIn)} &times; JOD 0.22</div>
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, alignSelf: 'center', color: t.text }}>{fmtJOD(spendIn)}</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: t.text }}>Tokens Out</div>
                <div style={{ fontSize: 12, color: t.sub }}>{fmtNum(tokensOut)} &times; JOD 0.20</div>
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, alignSelf: 'center', color: t.text }}>{fmtJOD(spendOut)}</div>
            </div>
          </div>

          {/* Buy credits */}
          <div style={{ ...cardStyle, display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: t.text, marginBottom: 6 }}>Buy Credits</div>
            <div style={{ fontSize: 13, color: t.sub, marginBottom: 14 }}>Pay-as-you-go. Add credits to your balance.</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              {[100, 500, 1000].map(amt => (
                <button key={amt} onClick={() => setBuyAmount(String(amt))} style={{ flex: 1, border: '1px solid ' + t.border, backgroundColor: buyAmount === String(amt) ? t.accent : t.cardAlt, color: buyAmount === String(amt) ? '#fff' : t.text, borderRadius: 9, padding: '8px 0', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{amt}</button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 'auto' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: t.sub, fontWeight: 600 }}>JOD</span>
                <input
                  type="number"
                  value={buyAmount}
                  onChange={e => setBuyAmount(e.target.value)}
                  placeholder="Amount"
                  style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px 10px 44px', borderRadius: 9, border: '1px solid ' + t.border, backgroundColor: t.cardAlt, color: t.text, fontSize: 14, outline: 'none' }}
                />
              </div>
              <button onClick={buyCredits} style={{ backgroundColor: t.accent, color: '#fff', border: 'none', borderRadius: 9, padding: '10px 18px', fontSize: 14, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>Buy</button>
            </div>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)', backgroundColor: toast.startsWith('Success') ? '#22C55E' : '#EF4444', color: '#fff', padding: '12px 22px', borderRadius: 12, fontSize: 14, fontWeight: 600, boxShadow: '0 8px 30px rgba(0,0,0,0.25)', zIndex: 1000 }}>
          {toast}
        </div>
      )}
    </div>
  )
}
