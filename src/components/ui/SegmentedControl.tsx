interface SegmentedOption<T extends string> { value: T; label: string }

interface SegmentedControlProps<T extends string> {
  options: SegmentedOption<T>[]
  /** `null` marks no cell active — used when the current value matches no option. */
  value: T | null
  onChange: (value: T) => void
  ariaLabel: string
  fullWidth?: boolean
  disabled?: boolean
}

export function SegmentedControl<T extends string>({
  options, value, onChange, ariaLabel, fullWidth, disabled,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={`flex rounded-lg overflow-hidden border border-stone-200/10 text-sm font-medium
        ${fullWidth ? 'w-full' : ''} ${disabled ? 'opacity-50' : ''}`}
    >
      {options.map(opt => {
        const isActive = opt.value === value
        return (
          <button
            key={opt.value}
            role="radio"
            aria-checked={isActive}
            disabled={disabled}
            onClick={() => onChange(opt.value)}
            className={`flex-1 px-4 py-2 transition-colors duration-150 active:scale-95
              disabled:pointer-events-none
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-terra-500
              ${isActive
                ? 'bg-terra-500 text-stone-200'
                : 'bg-stone-800 text-stone-400 hover:text-stone-200'
              }`}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
