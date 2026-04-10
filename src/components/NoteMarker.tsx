import type { NoteName } from '../utils/notes'

export type MarkerVariant =
  | 'root'      // root note — cream/ivory
  | 'scale'     // other scale note — stone
  | 'chord'     // chord tone (1st/3rd/5th degree) — rose-300
  | 'correct'   // quiz: correct answer — green
  | 'close1'    // 1 semitone off — yellow-green
  | 'close2'    // 2 semitones off — yellow
  | 'far'       // 3+ semitones off — red
  | 'target'    // quiz: revealed correct position — rose

interface NoteMarkerProps {
  note: NoteName
  variant: MarkerVariant
  label?: string
  onClick?: () => void
  size?: number
}

const VARIANT_CLASSES: Record<MarkerVariant, string> = {
  root:    'bg-white text-stone-900 ring-2 ring-stone-300/60 font-bold shadow-stone-200/40 shadow-lg',
  scale:   'bg-rose-300 text-stone-900 ring-1 ring-rose-200/60',
  chord:   'bg-violet-300 text-stone-900 ring-1 ring-violet-200/60',
  correct: 'bg-emerald-400 text-stone-900 ring-2 ring-emerald-200/60 font-bold shadow-emerald-400/40 shadow-lg',
  close1:  'bg-lime-300 text-stone-900 ring-1 ring-lime-200/60',
  close2:  'bg-yellow-300 text-stone-900 ring-1 ring-yellow-200/60',
  far:     'bg-red-400 text-white ring-1 ring-red-200/60',
  target:  'bg-sky-400 text-stone-900 ring-2 ring-sky-200/60 font-bold shadow-sky-400/40 shadow-lg',
}

export default function NoteMarker({ note, label, variant, onClick, size = 28 }: NoteMarkerProps) {
  const display = label ?? note
  // Accessible label: include both degree label and note name if showing degrees
  const accessibleLabel = label ? `${label} (${note})` : note
  const baseClasses = `rounded-full flex items-center justify-center transition-transform duration-100 font-mono ${VARIANT_CLASSES[variant]}`

  if (onClick) {
    return (
      <button
        onClick={onClick}
        aria-label={accessibleLabel}
        style={{ width: size, height: size, fontSize: size * 0.38 }}
        className={`${baseClasses} cursor-pointer hover:scale-110 active:scale-95
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white
          focus-visible:ring-offset-2 focus-visible:ring-offset-amber-900`}
      >
        {display}
      </button>
    )
  }

  return (
    <span
      aria-label={accessibleLabel}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      className={`${baseClasses} cursor-default select-none`}
    >
      {display}
    </span>
  )
}
