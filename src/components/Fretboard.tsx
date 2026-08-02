import { useEffect, useRef, useState } from 'react'
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
  /** Dim this marker — in the key but not in the chord sounding now. */
  muted?: boolean
}

interface FretboardProps {
  markers?: FretMarker[]
  onFretClick?: (stringIndex: number, fret: number) => void
  /** If true, clicking anywhere on a fret column triggers onFretClick (for quiz mode) */
  clickableStrings?: boolean
  /**
   * Frets to bring into view (inclusive), e.g. a practise position's
   * `[low, high]` window. Purely a scroll hint — does not affect which
   * markers are drawn or dimmed. `undefined` (the "All" case) never scrolls.
   */
  focusRange?: [number, number]
}

const FRET_WIDTH = 68   // px per fret column
const STRING_GAP = 36   // px between strings
const NECK_PADDING_V = 24 // top/bottom padding inside neck
const MARKER_SIZE = 26
const STRING_LABEL_WIDTH = 24 // px reserved left of nut for string name labels
// Slack, in px, tolerated before we consider the scroller "not fully scrolled" —
// avoids the fade flickering on sub-pixel scroll positions.
const SCROLL_EPSILON = 2

export default function Fretboard({ markers = [], onFretClick, clickableStrings, focusRange }: FretboardProps) {
  const neckHeight = (NUM_STRINGS - 1) * STRING_GAP + NECK_PADDING_V * 2
  const neckWidth = (NUM_FRETS + 1) * FRET_WIDTH

  // Build lookup: "stringIndex-fret" -> FretMarker
  const markerMap = new Map<string, FretMarker>()
  for (const m of markers) {
    markerMap.set(`${m.stringIndex}-${m.fret}`, m)
  }

  const scrollerRef = useRef<HTMLDivElement>(null)
  const [canScrollRight, setCanScrollRight] = useState(false)

  // Callers (e.g. Explorer) recompute `focusRange` as a fresh array/object
  // on every render, so its identity is not a reliable dep — depend on the
  // two primitives it actually carries instead.
  const focusLow = focusRange?.[0]
  const focusHigh = focusRange?.[1]

  // Scroll the selected position's window into view. Runs only when the
  // window's fret bounds actually change — not on every render — so it
  // never fights the user's own manual scrolling. Selecting "All"
  // (focusRange undefined) is a no-op by design.
  useEffect(() => {
    const el = scrollerRef.current
    if (!el || focusLow === undefined || focusHigh === undefined) return

    const low = focusLow
    const high = focusHigh
    // Each fret's clickable cell spans from the previous fret line to its
    // own, so the window runs from the start of `low`'s cell to the end of
    // `high`'s — matching what the dimmed/lit markers actually occupy.
    const windowLeft = STRING_LABEL_WIDTH + (low - 1) * FRET_WIDTH
    const windowRight = STRING_LABEL_WIDTH + high * FRET_WIDTH
    const windowWidth = windowRight - windowLeft

    const containerWidth = el.clientWidth
    const maxScrollLeft = Math.max(0, el.scrollWidth - containerWidth)

    // Centre the window when it fits; when it's wider than the visible
    // container (common on phones, where a 5-fret span can exceed the
    // screen), align its low fret near the left edge instead so the part of
    // the position closest to the nut — where most fingerings start — is
    // the first thing in view.
    const target = windowWidth <= containerWidth
      ? windowLeft - (containerWidth - windowWidth) / 2
      : windowLeft - 12

    const scrollLeft = Math.min(maxScrollLeft, Math.max(0, target))

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollTo({ left: scrollLeft, behavior: prefersReducedMotion ? 'auto' : 'smooth' })
  }, [focusLow, focusHigh])

  // Track whether there's more neck to the right than is currently visible,
  // so the fade only ever shows when it's telling the truth.
  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return

    const update = () => {
      setCanScrollRight(el.scrollWidth - el.clientWidth - el.scrollLeft > SCROLL_EPSILON)
    }
    // Deferred one frame so we always read post-layout metrics — a resize
    // (e.g. a breakpoint crossing that changes the sidebar's width) can
    // dispatch before the reflow it causes has fully settled, which would
    // otherwise leave the fade stuck showing a size that no longer exists.
    const scheduleUpdate = () => requestAnimationFrame(update)

    update()
    scheduleUpdate()

    el.addEventListener('scroll', scheduleUpdate, { passive: true })
    window.addEventListener('resize', scheduleUpdate)
    return () => {
      el.removeEventListener('scroll', scheduleUpdate)
      window.removeEventListener('resize', scheduleUpdate)
    }
  }, [])

  return (
    <div
      ref={scrollerRef}
      className="relative overflow-x-auto pb-2 rounded-xl
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terra-500
        focus-visible:ring-offset-2 focus-visible:ring-offset-stone-900"
      style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}
      tabIndex={0}
      role="region"
      aria-label="Fretboard, scrollable — use arrow keys to see more frets"
    >
      {/* Right-edge fade — shown only while there's unseen neck to the right,
          at any breakpoint (the neck overflows even on desktop at 15 frets). */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-stone-900 to-transparent z-10
          transition-opacity duration-150 ${canScrollRight ? 'opacity-100' : 'opacity-0'}`}
      />
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
        className="relative rounded-xl border border-[#784018]/50 shadow-2xl shadow-black/60 select-none"
        style={{ width: neckWidth, height: neckHeight, background: 'linear-gradient(to bottom, var(--wood-deep), var(--wood-mid), var(--wood-deep))' }}
      >
        {/* Fret lines */}
        {Array.from({ length: NUM_FRETS + 1 }, (_, f) => (
          <div
            key={f}
            className={`absolute top-0 bottom-0 ${f === 0 ? 'w-[5px] bg-[#ead7b8]/90' : 'w-px bg-[#c89d5a]/85'}`}
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
              className="absolute left-0 right-0 bg-[#ead7b8]/85"
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
                className="absolute w-2.5 h-2.5 rounded-full bg-[#d4b88a]/45"
                style={{ left: x - 5, top: midY - STRING_GAP - 5 }}
              />
              <div
                className="absolute w-2.5 h-2.5 rounded-full bg-[#d4b88a]/45"
                style={{ left: x - 5, top: midY + STRING_GAP - 5 }}
              />
            </div>
          ) : (
            <div
              key={fret}
              className="absolute w-2.5 h-2.5 rounded-full bg-[#d4b88a]/45"
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
                    muted={marker.muted}
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
