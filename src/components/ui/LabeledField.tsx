import React from 'react'

interface LabeledFieldProps {
  label: string
  children: React.ReactNode
}

/**
 * A label wrapped around its own control. Implicit association means no
 * `id`/`htmlFor` pair, which is what lets the same controls render twice
 * (desktop sidebar + mobile sheet) without duplicating DOM ids.
 *
 * Only for single form controls. A radiogroup must not be wrapped in a label —
 * use ControlLabel plus SegmentedControl's `ariaLabel` for those.
 */
export function LabeledField({ label, children }: LabeledFieldProps) {
  return (
    <label className="block space-y-2">
      <span className="block text-[11px] font-semibold text-stone-500 tracking-[0.08em] uppercase">
        {label}
      </span>
      {children}
    </label>
  )
}
