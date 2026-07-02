'use client'
import { useEffect, useState } from 'react'

export default function VersionGuard() {
  const [stale, setStale] = useState(false)
  useEffect(() => {
    const mine = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || ''
    if (!mine) return
    let stop = false
    async function check() {
      try {
        const r = await fetch('/api/version', { cache: 'no-store' })
        const j = await r.json()
        if (!stop && j && j.v && j.v !== mine) setStale(true)
      } catch (e) {}
    }
    check()
    const id = setInterval(check, 60000)
    return () => { stop = true; clearInterval(id) }
  }, [])
  if (!stale) return null
  return (
    <div style={{ position: 'fixed', bottom: 18, insetInlineEnd: 18, zIndex: 9999, background: '#0f172a', color: '#fff', padding: '10px 14px', borderRadius: 12, fontSize: 13, boxShadow: '0 6px 24px rgba(0,0,0,0.28)', display: 'flex', gap: 10, alignItems: 'center' }}>
      <span>A newer version of convo.finance is live.</span>
      <button onClick={() => location.reload()} style={{ background: 'var(--cf-primary, #1d4ed8)', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 12px', fontWeight: 700, cursor: 'pointer' }}>Refresh</button>
    </div>
  )
}
