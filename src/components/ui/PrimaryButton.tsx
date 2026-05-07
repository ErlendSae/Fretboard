import React from 'react'

interface PrimaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: 'hero' | 'standard' | 'compact'
  ref?: React.Ref<HTMLButtonElement>
}

export function PrimaryButton({ size = 'standard', className, ref, ...props }: PrimaryButtonProps) {
  const padding = size === 'hero' ? 'px-8 py-3' : size === 'compact' ? 'px-5 py-2' : 'px-6 py-2.5'
  return (
    <button
      ref={ref}
      className={`bg-terra-500 hover:bg-terra-400 active:bg-terra-600 active:scale-95 text-stone-200 font-bold ${padding} rounded-[14px] transition-all duration-150 ${className ?? ''}`}
      {...props}
    />
  )
}
