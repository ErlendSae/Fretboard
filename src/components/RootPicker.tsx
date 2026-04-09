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
  return (
    <div className={layout === 'grid' ? 'grid grid-cols-4 gap-1.5' : 'flex flex-wrap gap-2'}>
      {CHROMATIC_NOTES.map((note) => (
        <button
          key={note}
          onClick={() => onChange(note)}
          className={`
            flex items-center justify-center rounded-lg text-sm font-semibold font-mono
            transition-all duration-150 border
            ${layout === 'grid' ? 'w-full aspect-square' : 'w-10 h-10'}
            ${value === note
              ? 'bg-rose-500 text-white border-rose-400 shadow-md shadow-rose-500/20'
              : 'bg-stone-800 text-stone-400 border-stone-700 hover:border-stone-500 hover:text-stone-200'
            }
          `}
        >
          {note}
        </button>
      ))}
    </div>
  )
}
