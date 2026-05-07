import React from 'react'

interface ControlPanelProps { children: React.ReactNode }

export function ControlPanel({ children }: ControlPanelProps) {
  return <div className="flex flex-wrap gap-6 items-start sm:items-end animate-fade-up">{children}</div>
}
