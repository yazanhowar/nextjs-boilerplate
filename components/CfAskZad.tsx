'use client'
// convo.finance - global Ask-ZAD floating chat, mounted app-wide via layout.
// Uses the canonical zad-md renderer so answers match every other surface.
import { useState, useRef, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useLang } from '@/lib/LangContext'
import { zadMdToHtml, ZAD_MD_CSS } from '@/lib/zad-md'

export default function CfAskZad() {
  const pathname = usePathname() || '/'
  const { lang } = useLang()
  const ar = lang === 'ar'
  const [open, setOpen] = useState(false)
  const [msgs, setMsgs] = useState<any[]>([])
  const [inp, setInp] = useState('')
  const [busy, setBusy] = useState(false)
  const boxRef = useRef<any>(null)
  useEffect(function () { if (boxRef.current) boxRef.current.scrollTop = boxRef.current.scrollHeight }, [msgs, busy])
  if (pathname === '/economy') return null
  const send = async function (text: string) {
    const qq = String(text || '').trim()
    if (!qq || busy) return
    const next = msgs.concat([{ role: 'user', content: qq }])
    setMsgs(next); setInp(''); setBusy(true)
    try {
      const r = await fetch('/api/zad', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: next.map(function (m: any) { return { role: m.role, content: m.content } }), lang: lang }) })
      const j = await r.json()
      const a = (j && (j.text || j.content)) ? (j.text || j.content) : (ar ? 'تعذر الحصول على إجابة.' : 'Could not get an answer.')
      setMsgs(next.concat([{ role: 'assistant', content: a }]))
    } catch (e) {
      setMsgs(next.concat([{ role: 'assistant', content: ar ? 'خطأ في الاتصال.' : 'Connection error.' }]))
    }
    setBusy(false)
  }
  const chips = ar ? ['كيف أداء القطاع المصرفي؟', 'قارن هوامش الفائدة'] : ['How is the banking sector performing?', 'Compare interest margins']
  return (
    <div dir={ar ? 'rtl' : 'ltr'}>
      <style dangerouslySetInnerHTML={{ __html: ZAD_MD_CSS }} />
      {open ? (
        <div style={{ position: 'fixed', insetInlineEnd: 22, bottom: 78, zIndex: 95, width: 'min(400px, calc(100vw - 44px))', height: 'min(520px, 70vh)', background: 'var(--cf-surface, #ffffff)', border: '1px solid var(--cf-line, #e5eaf2)', borderRadius: 16, boxShadow: '0 24px 64px rgba(11,31,59,0.28)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--cf-line, #e5eaf2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--cf-surface2, #f7f9fc)' }}>
            <div style={{ fontSize: 12, fontWeight: 900, color: 'var(--cf-ink, #14243a)' }}>{ar ? 'اسأل زاد' : 'ASK ZAD'} <span style={{ fontWeight: 600, color: 'var(--cf-ink3, #7d8ea3)' }}>· {ar ? 'محلل مصرفي' : 'banking analyst'}</span></div>
            <button onClick={function () { setOpen(false) }} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 15, color: 'var(--cf-ink3, #7d8ea3)' }}>✕</button>
          </div>
          <div ref={boxRef} style={{ flex: 1, overflow: 'auto', padding: 12 }}>
            {msgs.length === 0 ? <div>
              <div style={{ fontSize: 11.5, color: 'var(--cf-ink3, #7d8ea3)', marginBottom: 8 }}>{ar ? 'إجابات مبنية على قاعدة المعرفة الحية.' : 'Answers grounded in the live knowledge base.'}</div>
              {chips.map(function (c: string, i: number) { return <button key={i} onClick={function () { send(c) }} style={{ display: 'block', width: '100%', textAlign: 'start', margin: '6px 0', padding: '8px 10px', border: '1px solid var(--cf-line, #e5eaf2)', borderRadius: 10, background: 'var(--cf-surface2, #f7f9fc)', cursor: 'pointer', fontSize: 12, color: 'var(--cf-ink2, #3d4f66)' }}>{c}</button> })}
            </div> : null}
            {msgs.map(function (m: any, i: number) {
              return m.role === 'user' ? (
                <div key={i} style={{ margin: '8px 0', display: 'flex', justifyContent: 'flex-end' }}><div style={{ maxWidth: '85%', background: 'var(--cf-primary, #1f4e8c)', color: '#fff', borderRadius: 12, padding: '8px 11px', fontSize: 12.5, lineHeight: 1.55 }}>{m.content}</div></div>
              ) : (
                <div key={i} className='zad-md' style={{ margin: '8px 0', fontSize: 12.5, lineHeight: 1.6, color: 'var(--cf-ink, #14243a)' }} dangerouslySetInnerHTML={{ __html: zadMdToHtml(String(m.content || '')) }} />
              )
            })}
            {busy ? <div style={{ fontSize: 11.5, color: 'var(--cf-ink3, #7d8ea3)', padding: '6px 2px' }}>{ar ? 'زاد يحلل…' : 'ZAD is analyzing…'}</div> : null}
          </div>
          <div style={{ padding: 10, borderTop: '1px solid var(--cf-line, #e5eaf2)', display: 'flex', gap: 8 }}>
            <input value={inp} onChange={function (e: any) { setInp(e.target.value) }} onKeyDown={function (e: any) { if (e.key === 'Enter') send(inp) }} placeholder={ar ? 'اسأل عن القطاع المصرفي…' : 'Ask about Jordanian banking…'} style={{ flex: 1, border: '1px solid var(--cf-line, #e5eaf2)', borderRadius: 10, padding: '9px 11px', fontSize: 12.5, outline: 'none', background: 'var(--cf-surface2, #f7f9fc)', color: 'var(--cf-ink, #14243a)' }} />
            <button onClick={function () { send(inp) }} disabled={busy} style={{ border: 'none', background: 'linear-gradient(105deg, #7a5aa4, #695ca1, #3e639b, #106b94)', color: '#ffffff', borderRadius: 10, padding: '0 14px', fontWeight: 900, fontSize: 12, cursor: 'pointer' }}>{ar ? 'إرسال' : 'Send'}</button>
          </div>
        </div>
      ) : null}
      <button onClick={function () { setOpen(!open) }} style={{ position: 'fixed', insetInlineEnd: 22, bottom: 22, zIndex: 96, border: 'none', borderRadius: 999, padding: '11px 18px', background: 'linear-gradient(105deg, #7a5aa4, #695ca1, #3e639b, #106b94)', color: '#ffffff', fontWeight: 900, fontSize: 12.5, letterSpacing: 0.4, cursor: 'pointer', boxShadow: '0 10px 28px rgba(11,31,59,0.30)' }}>{open ? '✕ ' + (ar ? 'إغلاق' : 'CLOSE') : (ar ? 'اسأل زاد' : 'ASK ZAD')}</button>
    </div>
  )
}