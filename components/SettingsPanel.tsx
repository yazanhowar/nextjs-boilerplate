'use client'
import { useState, useEffect } from 'react'

// Pricing (JOD per token)
const PRICE_IN = 0.22
const PRICE_OUT = 0.20

export default function SettingsPanel({ dark }: { dark: boolean }) {
  const [open, setOpen] = useState(false)
  const [tokensIn, setTokensIn] = useState(0)
  const [tokensOut, setTokensOut] = useState(0)

  function refresh() {
    setTokensIn(parseInt(localStorage.getItem('hbtf-tokens-in') || '0', 10))
    setTokensOut(parseInt(localStorage.getItem('hbtf-tokens-out') || '0', 10))
  }

  useEffect(() => {
    refresh()
    const handler = () => refresh()
    window.addEventListener('hbtf-usage-updated', handler)
    window.addEventListener('storage', handler)
    return () => {
      window.removeEventListener('hbtf-usage-updated', handler)
      window.removeEventListener('storage', handler)
    }
  }, [])

  useEffect(() => { if (open) refresh() }, [open])

  const spendIn = tokensIn * PRICE_IN
  const spendOut = tokensOut * PRICE_OUT
  const total = spendIn + spendOut

  const role = (typeof window !== 'undefined' && localStorage.getItem('hbtf-role')) || 'Administrator'

  const t = {
    text: dark ? '#FFFFFF' : '#1a1a1a',
    sub: dark ? '#9CA3AF' : '#6B7280',
    border: dark ? '#383838' : '#E5E7EB',
    card: dark ? '#242424' : '#FFFFFF',
    rowBg: dark ? '#2a2a2a' : '#F9FAFB',
    overlay: 'rgba(0,0,0,0.5)',
  }

  function fmtJOD(n: number) {
    return 'JOD ' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }
  function fmtNum(n: number) {
    return n.toLocaleString('en-US')
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Account settings"
        style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid ' + t.border, background: t.card, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, padding: 0 }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={t.sub} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{ position: 'fixed', inset: 0, backgroundColor: t.overlay, zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 80 }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ width: 'min(440px, calc(100vw - 32px))', backgroundColor: t.card, border: '1px solid ' + t.border, borderRadius: 16, padding: 24, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: t.text }}>Account Settings</h2>
              <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: t.sub, lineHeight: 1, padding: 0 }}>&times;</button>
            </div>

            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: t.sub, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>Role-Based Access</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', backgroundColor: t.rowBg, borderRadius: 10 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                <span style={{ fontSize: 14, fontWeight: 600, color: t.text }}>{role}</span>
              </div>
            </div>

            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: t.sub, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>Token Usage (Pay-As-You-Go)</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1, borderRadius: 10, overflow: 'hidden', border: '1px solid ' + t.border }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 14px', backgroundColor: t.rowBg }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: t.text }}>Tokens In</div>
                    <div style={{ fontSize: 11, color: t.sub }}>{fmtNum(tokensIn)} tokens &times; JOD 0.22</div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: t.text, alignSelf: 'center' }}>{fmtJOD(spendIn)}</div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 14px', backgroundColor: t.rowBg }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: t.text }}>Tokens Out</div>
                    <div style={{ fontSize: 11, color: t.sub }}>{fmtNum(tokensOut)} tokens &times; JOD 0.20</div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: t.text, alignSelf: 'center' }}>{fmtJOD(spendOut)}</div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', backgroundColor: '#3B82F6', borderRadius: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>Total Spending</span>
              <span style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>{fmtJOD(total)}</span>
            </div>

            <div style={{ fontSize: 11, color: t.sub, textAlign: 'center', marginTop: 14 }}>
              Cumulative all-time usage &middot; {fmtNum(tokensIn + tokensOut)} total tokens
            </div>
          </div>
        </div>
      )}
    </>
  )
}
