import React from 'react'

interface ControlLabelProps { children: React.ReactNode; htmlFor?: string }

export function ControlLabel({ children, htmlFor }: ControlLabelProps) {
  return (
    <label htmlFor={htmlFor} className="text-[11px] font-semibold text-stone-500 tracking-[0.08em] uppercase">
      {children}
    </label>
  )
}
