import React from 'react'

interface SectionHeaderProps {
  title: React.ReactNode
  subtitle?: string
}

export function SectionHeader({ title, subtitle }: SectionHeaderProps) {
  return (
    <div className="animate-fade-up">
      <h1 className="font-display font-semibold text-stone-200 text-[2.375rem] leading-[1.05] tracking-[-0.02em]">{title}</h1>
      {subtitle && <p className="text-stone-400 text-sm mt-2">{subtitle}</p>}
    </div>
  )
}
