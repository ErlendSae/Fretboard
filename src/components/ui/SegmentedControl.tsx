interface SegmentedOption<T extends string> { value: T; label: string }

interface SegmentedControlProps<T extends string> {
  options: SegmentedOption<T>[]
  value: T
  onChange: (value: T) => void
  ariaLabel: string
}

export function SegmentedControl<T extends string>({ options, value, onChange, ariaLabel }: SegmentedControlProps<T>) {
  return (
    <div className="flex rounded-lg overflow-hidden border border-stone-700 text-sm font-medium" role="group" aria-label={ariaLabel}>
      {options.map(opt => (
        <button
          key={opt.value}
          role="radio"
          aria-checked={opt.value === value}
          onClick={() => onChange(opt.value)}
          className={`px-4 py-2 transition-colors duration-150 ${opt.value === value ? 'bg-terra-500 text-white' : 'bg-stone-800 text-stone-400 hover:text-stone-200'}`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
