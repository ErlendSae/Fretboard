import type { NoteName } from '../utils/notes'

export type MarkerVariant =
  | 'root'      // root note — cream/ivory
  | 'scale'     // other scale note — stone
  | 'chord'     // chord tone (1st/3rd/5th degree) — terra-300
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
  root:    'bg-stone-200 text-stone-900 ring-2 ring-stone-300/60 font-bold',
  scale:   'bg-terra-300 text-stone-900 ring-1 ring-terra-200/60',
  chord:   'bg-sun-400 text-stone-900 ring-1 ring-sun-200/60',
  correct: 'bg-sage-400 text-stone-900 ring-2 ring-sage-200/60 font-bold',
  close1:  'bg-sun-400 text-stone-900 ring-1 ring-sun-200/60',
  close2:  'bg-terra-200 text-stone-900 ring-1 ring-terra-200/60',
  far:     'bg-brick-400 text-stone-900 ring-1 ring-brick-200/60',
  target:  'bg-ember-400 text-stone-900 ring-2 ring-ember-300/60 font-bold',
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
