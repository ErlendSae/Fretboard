import { useRef } from 'react'
import { CHROMATIC_NOTES, type NoteName } from '../utils/notes'

interface RootPickerProps {
  value: NoteName
  onChange: (note: NoteName) => void
  /**
   * 'wrap'  — flex-wrap row (full-width areas, e.g. page controls)
   * 'grid'  — 4-column grid that fills a narrow sidebar (≥176px content width)
   */
  layout?: 'wrap' | 'grid'
}

export default function RootPicker({ value, onChange, layout = 'wrap' }: RootPickerProps) {
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([])

  return (
    <div
      role="radiogroup"
      aria-label="Root note"
      className={layout === 'grid' ? 'grid grid-cols-4 gap-1.5' : 'flex flex-wrap gap-2'}
    >
      {CHROMATIC_NOTES.map((note) => {
        const isSelected = value === note
        return (
          <button
            key={note}
            role="radio"
            aria-checked={isSelected}
            ref={(el) => { buttonRefs.current[CHROMATIC_NOTES.indexOf(note)] = el }}
            onClick={() => onChange(note)}
            onKeyDown={(e) => {
              const idx = CHROMATIC_NOTES.indexOf(note)
              if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                e.preventDefault()
                buttonRefs.current[(idx + 1) % CHROMATIC_NOTES.length]?.focus()
              } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                e.preventDefault()
                buttonRefs.current[(idx - 1 + CHROMATIC_NOTES.length) % CHROMATIC_NOTES.length]?.focus()
              }
            }}
            className={`
              flex items-center justify-center rounded-lg text-sm font-semibold font-mono
              transition-all duration-150 border
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500
              focus-visible:ring-offset-2 focus-visible:ring-offset-stone-900
              ${layout === 'grid' ? 'w-full aspect-square' : 'w-11 h-11'}
              ${isSelected
                ? 'bg-rose-500 text-white border-rose-400 shadow-md shadow-rose-500/20'
                : 'bg-stone-800 text-stone-400 border-stone-700 hover:border-stone-500 hover:text-stone-200'
              }
            `}
          >
            {note}
          </button>
        )
      })}
    </div>
  )
}
