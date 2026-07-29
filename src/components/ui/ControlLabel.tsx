import React from 'react'

interface ControlLabelProps { children: React.ReactNode; htmlFor?: string }

const CLASS = 'text-[11px] font-semibold text-stone-500 tracking-[0.08em] uppercase'

export function ControlLabel({ children, htmlFor }: ControlLabelProps) {
  // Without a target, a <label> points at nothing — emit a span instead so it
  // can title a radiogroup that carries its own aria-label.
  if (!htmlFor) return <span className={CLASS}>{children}</span>
  return <label htmlFor={htmlFor} className={CLASS}>{children}</label>
}
