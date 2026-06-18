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
    <div style={{ position: 'fixed', inset: 0, backgroundColor: '#0f0f0f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif', zIndex: 9999 }}>
      <div style={{ width: 'min(380px, calc(100vw - 40px))', backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 16, padding: 32, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: '#0A4A8F', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 14 }}>cf</div>
          <div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>convo.finance</div>
            <div style={{ color: '#888', fontSize: 12 }}>Jordanian Banking Intelligence</div>
          </div>
        </div>
        <div style={{ color: '#bbb', fontSize: 13, marginBottom: 16, lineHeight: 1.5 }}>This is a private platform. Enter the access password to continue.</div>
        <input
          type="password"
          value={pw}
          onChange={e => { setPw(e.target.value); setError(false) }}
          onKeyDown={e => { if (e.key === 'Enter') submit() }}
          placeholder="Access password"
          autoFocus
          style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px', borderRadius: 10, border: '1px solid ' + (error ? '#EF4444' : '#333'), backgroundColor: '#0f0f0f', color: '#fff', fontSize: 15, outline: 'none', marginBottom: error ? 8 : 16 }}
        />
        {error && <div style={{ color: '#EF4444', fontSize: 13, marginBottom: 16 }}>Incorrect password. Please try again.</div>}
        <button
          onClick={submit}
          style={{ width: '100%', padding: '12px 0', borderRadius: 10, border: 'none', backgroundColor: '#0A4A8F', color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}
        >
          Enter
        </button>
      </div>
    </div>
  )
}
