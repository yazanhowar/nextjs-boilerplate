'use client'
// convo.finance - global direction sync. Sets <html dir/lang> from the active
// language so every route renders correct RTL/LTR without per-page dir props.
import { useEffect } from 'react'
import { useLang } from '@/lib/LangContext'
export default function CfDir() {
  const { lang } = useLang()
  useEffect(function () {
    try {
      var d = lang === 'ar' ? 'rtl' : 'ltr'
      document.documentElement.setAttribute('dir', d)
      document.documentElement.setAttribute('lang', lang === 'ar' ? 'ar' : 'en')
    } catch (e) { }
  }, [lang])
  return null
}