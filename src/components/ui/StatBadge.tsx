import React from 'react'

interface StatBadgeProps { children: React.ReactNode }

export function StatBadge({ children }: StatBadgeProps) {
  return (
    <div className="bg-stone-800 border border-stone-700 rounded-lg px-4 py-2 flex flex-wrap gap-4 tabular-nums">
      {children}
    </div>
  )
}
