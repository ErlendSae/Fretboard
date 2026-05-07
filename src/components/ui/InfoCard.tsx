import React from 'react'

interface InfoCardProps { children: React.ReactNode; className?: string }

export function InfoCard({ children, className }: InfoCardProps) {
  return (
    <div className={`bg-stone-800/60 border border-stone-200/10 rounded-xl px-5 py-4 space-y-2 ${className ?? ''}`}>
      {children}
    </div>
  )
}
