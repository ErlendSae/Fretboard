import React from 'react'

interface SecondaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  ghost?: boolean
}

export function SecondaryButton({ ghost, className, ...props }: SecondaryButtonProps) {
  const base = ghost
    ? 'border border-stone-200/20 text-stone-400 hover:text-stone-200 bg-transparent'
    : 'bg-stone-700 hover:bg-stone-700/70 border border-stone-200/20 text-stone-200'
  return (
    <button
      className={`active:scale-95 font-medium px-4 py-2 rounded-lg transition-all duration-150 ${base} ${className ?? ''}`}
      {...props}
    />
  )
}
