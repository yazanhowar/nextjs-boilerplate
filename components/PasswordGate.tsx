'use client'
import { useState, useEffect } from 'react'

export default function PasswordGate({ children }: { children: React.ReactNode }) {
  const [unlocked, setUnlocked] = useState(false)
  const [ready, setReady] = useState(false)
  const [pw, setPw] = useState('')
  const [error, setError] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('cf-unlocked') === 'yes') {
      setUnlocked(true)
    }
    setReady(true)
  }, [])

  function submit() {
    const expected = process.env.NEXT_PUBLIC_GATE_PASSWORD || ''
    if (pw && pw === expected) {
      sessionStorage.setItem('cf-unlocked', 'yes')
      setUnlocked(true)
      setError(false)
    } else {
      setError(true)
    }
  }

  if (!ready) return null
  if (unlocked) return <>{children}</>

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: '#0f1115', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif', zIndex: 9999, padding: 20, boxSizing: 'border-box' }}>
      <div style={{ width: 'min(440px, 100%)', backgroundColor: '#16191f', border: '1px solid #262b34', borderRadius: 18, padding: 36, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{ width: 42, height: 42, borderRadius: 11, background: '#0A4A8F', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 16, letterSpacing: '-0.02em' }}>cf</div>
          <div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 19, letterSpacing: '-0.01em' }}>convo.finance</div>
            <div style={{ color: '#7d8694', fontSize: 12.5 }}>Jordanian Banking Intelligence</div>
          </div>
        </div>

        <div style={{ height: 1, backgroundColor: '#262b34', margin: '20px 0' }} />

        <h1 style={{ color: '#fff', fontSize: 16, fontWeight: 600, margin: '0 0 8px' }}>Sign in to your workspace</h1>
        <p style={{ color: '#9aa3b0', fontSize: 13.5, lineHeight: 1.55, margin: '0 0 22px' }}>
          convo.finance is a private competitive-intelligence dashboard for banking professionals. Access is limited to authorized team members. This tool does not collect personal information.
        </p>

        <label htmlFor="cf-access" style={{ display: 'block', color: '#9aa3b0', fontSize: 12.5, fontWeight: 500, marginBottom: 7 }}>Team access password</label>
        <input
          id="cf-access"
          type="password"
          value={pw}
          onChange={e => { setPw(e.target.value); setError(false) }}
          onKeyDown={e => { if (e.key === 'Enter') submit() }}
          placeholder="Enter your team password"
          autoFocus
          style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px', borderRadius: 10, border: '1px solid ' + (error ? '#EF4444' : '#2f3540'), backgroundColor: '#0f1115', color: '#fff', fontSize: 15, outline: 'none', marginBottom: error ? 8 : 18 }}
        />
        {error && <div style={{ color: '#EF4444', fontSize: 13, marginBottom: 18 }}>That password was not recognized. Please try again.</div>}

        <button
          onClick={submit}
          style={{ width: '100%', padding: '13px 0', borderRadius: 10, border: 'none', backgroundColor: '#0A4A8F', color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}
        >
          Sign in
        </button>

        <p style={{ color: '#5b636f', fontSize: 11.5, lineHeight: 1.5, margin: '20px 0 0', textAlign: 'center' }}>
          Internal analytics platform displaying publicly available banking data. For authorized use only.
        </p>
      </div>
    </div>
  )
}
