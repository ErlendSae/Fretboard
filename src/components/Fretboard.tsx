import NoteMarker, { type MarkerVariant } from './NoteMarker'
import {
  NUM_STRINGS,
  NUM_FRETS,
  FRET_MARKERS,
  STRING_NAMES,
  fretToNote,
} from '../utils/notes'

export interface FretMarker {
  stringIndex: number
  fret: number
  variant: MarkerVariant
  /** Custom text to display instead of the note name (e.g. "1", "b3", "5") */
  label?: string
}

interface FretboardProps {
  markers?: FretMarker[]
  onFretClick?: (stringIndex: number, fret: number) => void
  /** If true, clicking anywhere on a fret column triggers onFretClick (for quiz mode) */
  clickableStrings?: boolean
}

const FRET_WIDTH = 68   // px per fret column
const STRING_GAP = 36   // px between strings
const NECK_PADDING_V = 24 // top/bottom padding inside neck
const MARKER_SIZE = 26

export default function Fretboard({ markers = [], onFretClick, clickableStrings }: FretboardProps) {
  const neckHeight = (NUM_STRINGS - 1) * STRING_GAP + NECK_PADDING_V * 2
  const neckWidth = (NUM_FRETS + 1) * FRET_WIDTH

  // Build lookup: "stringIndex-fret" -> FretMarker
  const markerMap = new Map<string, FretMarker>()
  for (const m of markers) {
    markerMap.set(`${m.stringIndex}-${m.fret}`, m)
  }

  const STRING_LABEL_WIDTH = 24 // px reserved left of nut for string name labels

  return (
    <div className="overflow-x-auto pb-2">
      {/* Outer wrapper adds left room for string name labels */}
      <div className="relative inline-block" style={{ paddingLeft: STRING_LABEL_WIDTH }}>

      {/* String name labels — positioned in the reserved gutter */}
      {Array.from({ length: NUM_STRINGS }, (_, s) => (
        <div
          key={s}
          className="absolute text-xs text-stone-400/50 font-mono font-medium flex items-center justify-end"
          style={{
            left: 0,
            width: STRING_LABEL_WIDTH - 4,
            top: NECK_PADDING_V + (NUM_STRINGS - 1 - s) * STRING_GAP - 7,
          }}
        >
          {STRING_NAMES[s]}
        </div>
      ))}

      <div
        className="relative bg-gradient-to-b from-amber-950 via-amber-900 to-amber-950 rounded-xl border border-amber-800/50 shadow-2xl shadow-black/60 select-none"
        style={{ width: neckWidth, height: neckHeight }}
      >
        {/* Fret lines */}
        {Array.from({ length: NUM_FRETS + 1 }, (_, f) => (
          <div
            key={f}
            className={`absolute top-0 bottom-0 ${f === 0 ? 'w-[5px] bg-stone-300/90' : 'w-px bg-amber-600/50'}`}
            style={{ left: f * FRET_WIDTH }}
          />
        ))}

        {/* String lines */}
        {Array.from({ length: NUM_STRINGS }, (_, s) => {
          const y = NECK_PADDING_V + (NUM_STRINGS - 1 - s) * STRING_GAP
          // Strings get thicker as index increases toward low E; string 0 = low E is thickest
          const thickness = 2.5 - s * 0.3
          return (
            <div
              key={s}
              className="absolute left-0 right-0 bg-stone-300/75"
              style={{ top: y, height: Math.max(0.8, thickness) }}
            />
          )
        })}

        {/* Fret position markers (inlay dots) */}
        {FRET_MARKERS.map((fret) => {
          const x = (fret - 0.5) * FRET_WIDTH
          const midY = neckHeight / 2
          return fret === 12 ? (
            // Double dot at 12th fret
            <div key={fret}>
              <div
                className="absolute w-2.5 h-2.5 rounded-full bg-stone-400/30"
                style={{ left: x - 5, top: midY - STRING_GAP - 5 }}
              />
              <div
                className="absolute w-2.5 h-2.5 rounded-full bg-stone-400/30"
                style={{ left: x - 5, top: midY + STRING_GAP - 5 }}
              />
            </div>
          ) : (
            <div
              key={fret}
              className="absolute w-2.5 h-2.5 rounded-full bg-stone-400/30"
              style={{ left: x - 5, top: midY - 5 }}
            />
          )
        })}

        {/* Fret number labels */}
        {Array.from({ length: NUM_FRETS }, (_, i) => {
          const fret = i + 1
          return (
            <div
              key={fret}
              className="absolute text-xs text-stone-500/50 font-mono"
              style={{
                left: (fret - 0.5) * FRET_WIDTH,
                bottom: 2,
                transform: 'translateX(-50%)',
              }}
            >
              {fret}
            </div>
          )
        })}

        {/* Clickable fret/string cells + note markers */}
        {Array.from({ length: NUM_STRINGS }, (_, s) =>
          Array.from({ length: NUM_FRETS + 1 }, (_, f) => {
            const key = `${s}-${f}`
            const marker = markerMap.get(key)
            const note = fretToNote(s, f)
            const cellX = f === 0 ? 0 : (f - 0.5) * FRET_WIDTH
            const cellY = NECK_PADDING_V + (NUM_STRINGS - 1 - s) * STRING_GAP

            return (
              <div
                key={key}
                className={`absolute flex items-center justify-center
                  ${clickableStrings && onFretClick ? 'cursor-pointer' : ''}
                `}
                style={{
                  left: cellX - FRET_WIDTH / 2,
                  top: cellY - MARKER_SIZE / 2 - 2,
                  width: FRET_WIDTH,
                  height: MARKER_SIZE + 4,
                }}
                onClick={() => onFretClick?.(s, f)}
              >
                {marker && (
                  <NoteMarker
                    note={note}
                    label={marker.label}
                    variant={marker.variant}
                    size={MARKER_SIZE}
                    onClick={onFretClick && !clickableStrings ? () => onFretClick(s, f) : undefined}
                  />
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Open string label aligned with fret 0 column */}
      <div className="flex mt-1">
        <div
          className="text-xs text-stone-600/70 font-mono text-center"
          style={{ width: FRET_WIDTH }}
        >
          open
        </div>
      </div>

      </div>{/* end string-label gutter wrapper */}
    </div>
  )
}
