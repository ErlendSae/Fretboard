import type { Position } from '../utils/positions'

interface PositionRowProps {
  positions: Position[]
  /** Index into `positions`, or null for the whole neck. */
  selected: number | null
  onSelect: (index: number | null) => void
}

const BUTTON_BASE =
  'flex-1 flex flex-col items-center gap-1 py-3 rounded-xl border ' +
  'transition-all duration-150 active:scale-95 ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terra-500 ' +
  'focus-visible:ring-offset-1 focus-visible:ring-offset-stone-950'

const BUTTON_ACTIVE = 'bg-terra-500 border-terra-400 text-stone-200'

const BUTTON_IDLE =
  'bg-stone-800 border-stone-200/10 text-stone-400 ' +
  'hover:border-stone-200/20 hover:text-stone-200'

/**
 * Pick one of the five scale positions, or All for the whole neck.
 *
 * Lives above the neck rather than in the sidebar: it is the control touched
 * most often during practice, and below `md` the sidebar is a bottom sheet
 * that would have to be opened for every change.
 *
 * Uses `radiogroup` semantics (exactly one of six is always checked) rather than
 * `SegmentedControl`, which takes single-line labels. Here we need two lines
 * (Roman numeral over fret range) in gapped `rounded-xl` cards, not joined segments.
 */
export default function PositionRow({ positions, selected, onSelect }: PositionRowProps) {
  const active = selected !== null ? positions[selected] : undefined

  return (
    <div className="space-y-2">
      <div className="flex gap-2" role="radiogroup" aria-label="Practice position">
        <button
          role="radio"
          onClick={() => onSelect(null)}
          aria-checked={selected === null}
          className={`${BUTTON_BASE} ${selected === null ? BUTTON_ACTIVE : BUTTON_IDLE}`}
        >
          <span className="font-mono font-bold text-lg leading-none">All</span>
          <span
            className={`font-mono text-[10px] leading-none ${
              selected === null ? 'text-stone-900' : 'text-stone-400'
            }`}
          >
            neck
          </span>
        </button>

        {positions.map((p, i) => {
          const isActive = selected === i
          return (
            <button
              key={p.numeral}
              role="radio"
              // Tapping the active position clears it back to All.
              // Radio semantics still describe the resulting state correctly
              // (exactly one checked at all times); this toggle is an alternate path to All.
              onClick={() => onSelect(isActive ? null : i)}
              aria-checked={isActive}
              className={`${BUTTON_BASE} ${isActive ? BUTTON_ACTIVE : BUTTON_IDLE}`}
            >
              <span className="font-mono font-bold text-lg leading-none">{p.numeral}</span>
              <span
                className={`font-mono text-[10px] leading-none ${
                  isActive ? 'text-stone-900' : 'text-stone-400'
                }`}
              >
                {p.fretRange[0]}–{p.fretRange[1]}
              </span>
            </button>
          )
        })}
      </div>

      {/* One line, only while a position is active. Replaces the old CAGED
          info card — four paragraphs of prose read once and then ignored. */}
      {active && (
        <p className="text-xs text-stone-500">
          Position <span className="font-mono text-stone-400">{active.numeral}</span>
          {' · frets '}
          <span className="font-mono text-stone-400">
            {active.fretRange[0]}–{active.fretRange[1]}
          </span>
          {' · '}
          <span className="font-mono text-stone-400">{active.shape}</span> shape
        </p>
      )}
    </div>
  )
}
