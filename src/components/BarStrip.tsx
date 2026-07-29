import type { DiatonicChord } from '../utils/chords'

interface BarStripProps {
  bars: DiatonicChord[]
  /** Index of the bar sounding now, or null when stopped. */
  currentBar: number | null
}

/**
 * The song's changes, one cell per bar, with the sounding bar lit.
 * This is what makes an auto-advancing progression legible — you can see
 * where in the form you are, not just hear it.
 */
export default function BarStrip({ bars, currentBar }: BarStripProps) {
  return (
    <div className="flex flex-wrap gap-1.5" role="list" aria-label="Chord changes">
      {bars.map((chord, i) => {
        const isNow = currentBar === i
        // A repeated chord reads as one held chord, so only label the first
        // bar of a run — twelve cells of "A7" is noise, not information.
        const isRepeat = i > 0 && bars[i - 1]!.name === chord.name
        return (
          <div
            key={i}
            role="listitem"
            aria-label={`Bar ${i + 1}: ${chord.name}`}
            aria-current={isNow ? 'true' : undefined}
            className={`min-w-[3.25rem] px-2 py-1.5 rounded-lg border text-center transition-all duration-150
              ${isNow
                ? 'bg-sun-400/20 border-sun-400/60'
                : 'bg-stone-800/60 border-stone-200/10'
              }`}
          >
            <span
              aria-hidden="true"
              className={`block font-mono text-[13px] font-bold leading-none
                ${isNow ? 'text-sun-400' : isRepeat ? 'text-stone-600' : 'text-stone-300'}`}
            >
              {isRepeat ? '·' : chord.name}
            </span>
            <span
              aria-hidden="true"
              className={`block font-mono text-[9px] leading-none mt-1
                ${isNow ? 'text-sun-400/70' : 'text-stone-600'}`}
            >
              {isRepeat ? '' : chord.roman}
            </span>
          </div>
        )
      })}
    </div>
  )
}
