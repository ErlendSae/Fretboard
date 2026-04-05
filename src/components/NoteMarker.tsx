import type { NoteName } from '../utils/notes'

export type MarkerVariant =
  | 'root'      // root note — cream/ivory
  | 'scale'     // other scale note — teal
  | 'chord'     // chord tone (1st/3rd/5th degree) — amber
  | 'correct'   // quiz: correct answer — green
  | 'close1'    // 1 semitone off — yellow-green
  | 'close2'    // 2 semitones off — yellow
  | 'far'       // 3+ semitones off — red
  | 'target'    // quiz: revealed correct position — indigo

interface NoteMarkerProps {
  note: NoteName
  variant: MarkerVariant
  label?: string
  onClick?: () => void
  size?: number
}

const VARIANT_CLASSES: Record<MarkerVariant, string> = {
  root:    'bg-stone-100 text-stone-900 ring-2 ring-stone-300/60 font-bold shadow-stone-200/40 shadow-lg',
  scale:   'bg-teal-400 text-stone-900 ring-1 ring-teal-200/60',
  chord:   'bg-amber-300 text-stone-900 ring-1 ring-amber-100/60',
  correct: 'bg-emerald-400 text-stone-900 ring-2 ring-emerald-200/60 font-bold shadow-emerald-400/40 shadow-lg',
  close1:  'bg-yellow-300 text-stone-900 ring-1 ring-yellow-100/60',
  close2:  'bg-yellow-400 text-stone-900 ring-1 ring-yellow-200/60',
  far:     'bg-red-400 text-white ring-1 ring-red-200/60',
  target:  'bg-indigo-400 text-white ring-2 ring-indigo-200/60 font-bold shadow-indigo-400/40 shadow-lg',
}

export default function NoteMarker({ note, label, variant, onClick, size = 28 }: NoteMarkerProps) {
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      className={`rounded-full flex items-center justify-center transition-transform duration-100 font-mono
        ${VARIANT_CLASSES[variant]}
        ${onClick ? 'cursor-pointer hover:scale-110 active:scale-95' : 'cursor-default pointer-events-none'}
      `}
    >
      {label ?? note}
    </button>
  )
}
