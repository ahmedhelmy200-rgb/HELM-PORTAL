import React, { useState } from 'react'
import { Scale } from 'lucide-react'
import PublicEntry from './PublicEntry'
import { appParams } from '@/lib/app-params'

const LOGO_SOURCES = [
  '/icons/icon-192.png',
  '/icon-192.png',
  '/favicon.png',
  '/favicon.ico',
]

function ProgramLogoMark() {
  const [index, setIndex] = useState(0)
  const [failed, setFailed] = useState(false)
  const src = LOGO_SOURCES[index]

  const handleError = () => {
    if (index < LOGO_SOURCES.length - 1) setIndex(index + 1)
    else setFailed(true)
  }

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[60] md:right-8 md:top-6">
      <div className="flex items-center gap-3 rounded-3xl border border-white/10 bg-slate-950/55 px-3 py-2 shadow-2xl shadow-blue-900/25 backdrop-blur-2xl">
        <div className="relative h-12 w-12 shrink-0 rounded-2xl border border-blue-300/20 bg-gradient-to-br from-blue-600/80 to-slate-950 p-1.5 shadow-[0_0_35px_rgba(59,130,246,.22)]">
          {!failed ? (
            <img
              src={src}
              alt="شعار حلم بروتال"
              className="h-full w-full rounded-xl object-contain drop-shadow-lg"
              onError={handleError}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center rounded-xl bg-blue-600/30">
              <Scale className="h-6 w-6 text-white" />
            </div>
          )}
        </div>
        <div className="hidden sm:block text-right">
          <p className="text-sm font-black leading-none text-white">{appParams.appName || 'HELM Portal'}</p>
          <p className="mt-1 text-[10px] font-bold text-blue-200/55">شعار البرنامج الرسمي</p>
        </div>
      </div>
    </div>
  )
}

export default function PublicEntryWithLogo() {
  return (
    <>
      <ProgramLogoMark />
      <PublicEntry />
    </>
  )
}
