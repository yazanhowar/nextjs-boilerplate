'use client'

import { useLang } from '../lib/LangContext'

export default function LangToggle() {
  const { lang, setLang } = useLang()

  return (
    <button
      onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-[#1f2937] bg-white dark:bg-[#111827] text-xs font-semibold text-gray-600 dark:text-gray-300 hover:border-blue-400 dark:hover:border-[#4a9eff] hover:text-blue-600 dark:hover:text-[#4a9eff] transition-colors"
      title={lang === 'en' ? 'Switch to Arabic' : 'التبديل إلى الإنجليزية'}
    >
      {lang === 'en' ? (
        <><span>ع</span><span className="text-gray-300 dark:text-[#374151]">|</span><span className="opacity-40">EN</span></>
      ) : (
        <><span className="opacity-40">ع</span><span className="text-gray-300 dark:text-[#374151]">|</span><span>EN</span></>
      )}
    </button>
  )
}
