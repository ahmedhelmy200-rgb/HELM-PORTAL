import React, { useState } from 'react'
import { Scale } from 'lucide-react'
import { appParams } from '@/lib/app-params'

const FALLBACK_LOGOS = [
  '/icons/icon-192.png',
  '/icon-192.png',
  '/favicon.png',
  '/favicon.ico',
]

export default function OfficeBrandMark({
  logoUrl = null,
  officeName = null,
  subtitle = 'بوابة المكتب والموكلين',
  compact = false,
  className = '',
  textClassName = '',
  tone = 'light',
}) {
  const sources = [logoUrl, ...FALLBACK_LOGOS].filter(Boolean)
  const [index, setIndex] = useState(0)
  const [failed, setFailed] = useState(false)
  const src = sources[index]
  const isDarkText = tone === 'dark'

  const handleError = () => {
    if (index < sources.length - 1) setIndex(index + 1)
    else setFailed(true)
  }

  return (
    <div className={`flex items-center gap-3 min-w-0 ${className}`}>
      <div className={`${compact ? 'h-10 w-10 rounded-2xl' : 'h-14 w-14 rounded-3xl'} relative shrink-0 border border-blue-300/20 bg-gradient-to-br from-blue-600/85 via-slate-900 to-slate-950 p-1.5 shadow-[0_0_42px_rgba(37,99,235,.22)] overflow-hidden`}>
        <div className="absolute inset-0 bg-white/[.05]" />
        {!failed ? (
          <img src={src} alt="شعار المكتب" className="relative z-10 h-full w-full rounded-2xl object-contain drop-shadow-lg" onError={handleError} />
        ) : (
          <div className="relative z-10 flex h-full w-full items-center justify-center rounded-2xl bg-blue-600/25">
            <Scale className={compact ? 'h-5 w-5 text-white' : 'h-7 w-7 text-white'} />
          </div>
        )}
      </div>
      <div className={`text-right min-w-0 ${textClassName}`}>
        <p className={`${compact ? 'text-sm' : 'text-base'} font-black leading-tight ${isDarkText ? 'text-slate-950' : 'text-white'} truncate`}>{officeName || appParams.appName || 'HELM Portal'}</p>
        <p className={`mt-1 text-[11px] font-bold truncate ${isDarkText ? 'text-slate-600' : 'text-blue-200/65'}`}>{subtitle}</p>
      </div>
    </div>
  )
}
