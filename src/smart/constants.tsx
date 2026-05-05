

import React from 'react';
import { CaseStatus } from './types';

export const COLORS = {
  primary: '#007bff', // Updated to a vibrant blue
  secondary: '#d4af37', // Gold accent
  accent: '#f8fafc', // Very light for backgrounds
  background: '#f1f5f9', // Main light background
  white: '#ffffff',
  success: '#22c55e', // Green for success
  error: '#ef4444', // Red for errors
  info: '#3b82f6', // Blue for info
  warning: '#f59e0b', // Amber for warnings
  goldGradient: 'linear-gradient(135deg, #007bff 0%, #0056b3 50%, #004085 100%)', // Updated gradient for blue
};

export const STATUS_COLORS: Record<CaseStatus, string> = {
  [CaseStatus.WON]: 'bg-green-100 text-green-700 border-green-200',
  [CaseStatus.PREP]: 'bg-blue-100 text-blue-700 border-blue-200',
  [CaseStatus.ACTIVE]: 'bg-amber-100 text-amber-700 border-amber-200',
  [CaseStatus.LOST]: 'bg-red-100 text-red-700 border-red-200',
  [CaseStatus.ARCHIVED]: 'bg-slate-100 text-slate-700 border-slate-200',
  [CaseStatus.JUDGMENT]: 'bg-purple-100 text-purple-700 border-purple-200',
  [CaseStatus.APPEAL]: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  [CaseStatus.CLOSED]: 'bg-slate-200 text-slate-800 border-slate-300',
  [CaseStatus.LITIGATION]: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  [CaseStatus.PENDING]: 'bg-orange-100 text-orange-700 border-orange-200',
};

export const ICONS = {
  Logo: ({ className = "w-full h-full" }: { className?: string }) => (
    <div className={`${className} flex items-center justify-center`}>
      <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-[0_0_10px_rgba(0,123,255,0.2)]">
        <defs>
          {/* Updated gradient ID and colors to blue */}
          <linearGradient id="blueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#007bff" />
            <stop offset="50%" stopColor="#0056b3" />
            <stop offset="100%" stopColor="#004085" />
          </linearGradient>
        </defs>
        
        {/* Shield Background */}
        <path d="M100 190C100 190 170 160 170 80V30L100 10L30 30V80C30 160 100 190 100 190Z" 
              fill="#ffffff" stroke="url(#blueGrad)" strokeWidth="4"/>
        
        {/* Pillar of Justice */}
        <rect x="92" y="45" width="16" height="90" rx="2" fill="url(#blueGrad)" />
        <rect x="70" y="135" width="60" height="10" rx="2" fill="url(#blueGrad)" />
        <path d="M70 45H130L120 55H80L70 45Z" fill="url(#blueGrad)" />

        {/* Scales */}
        <path d="M100 65L60 80" stroke="url(#blueGrad)" strokeWidth="3" strokeLinecap="round"/>
        <path d="M100 65L140 80" stroke="url(#blueGrad)" strokeWidth="3" strokeLinecap="round"/>
        
        {/* Left Pan */}
        <path d="M60 80V100" stroke="url(#blueGrad)" strokeWidth="2"/>
        <path d="M60 100C60 110 45 110 45 100" stroke="url(#blueGrad)" strokeWidth="2" fill="none"/>
        <path d="M60 100C60 110 75 110 75 100" stroke="url(#blueGrad)" strokeWidth="2" fill="none"/>
        <line x1="45" y1="100" x2="75" y2="100" stroke="url(#blueGrad)" strokeWidth="2"/>

        {/* Right Pan */}
        <path d="M140 80V100" stroke="url(#blueGrad)" strokeWidth="2"/>
        <path d="M140 100C140 110 125 110 125 100" stroke="url(#blueGrad)" strokeWidth="2" fill="none"/>
        <path d="M140 100C140 110 155 110 155 100" stroke="url(#blueGrad)" strokeWidth="2" fill="none"/>
        <line x1="125" y1="100" x2="155" y2="100" stroke="url(#blueGrad)" strokeWidth="2"/>
      </svg>
    </div>
  ),
  Dashboard: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" /></svg>,
  Cases: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>,
  Clients: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
  AI: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
  Law: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>,
  Document: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
  Upload: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
};
