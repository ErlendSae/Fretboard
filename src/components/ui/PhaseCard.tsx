import React from 'react'

interface PhaseCardProps { children: React.ReactNode; className?: string }

export function PhaseCard({ children, className }: PhaseCardProps) {
  return (
    <div className={`bg-stone-800 border border-stone-200/10 rounded-[20px] p-8 flex flex-col items-center gap-6 min-h-56 ${className ?? ''}`}>
      {children}
    </div>
  )
}
