import React from 'react'

interface SelectInputProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  fullWidth?: boolean
}

export function SelectInput({ fullWidth, className, ...props }: SelectInputProps) {
  return (
    <select
      className={`bg-stone-700 border border-stone-200/20 text-stone-200 rounded-[10px] px-3 py-2 text-sm focus:outline-none focus:border-terra-500/60 focus:ring-1 focus:ring-terra-500/25 cursor-pointer transition-colors duration-150 ${fullWidth ? 'w-full' : 'min-w-52'} ${className ?? ''}`}
      {...props}
    />
  )
}
