import React from 'react'

type GhostButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>

export function GhostButton({ className, ...props }: GhostButtonProps) {
  return (
    <button
      className={`text-xs text-stone-500 hover:text-stone-300 transition-colors duration-150 px-2 py-1 ${className ?? ''}`}
      {...props}
    />
  )
}
