import { useState, useEffect, useRef } from 'react'
import { SlidersHorizontal } from 'lucide-react'
import Fretboard, { type FretMarker } from '../components/Fretboard'
import BackingTrackPanel from '../components/BackingTrackPanel'
import {
  ControlLabel,
  InfoCard,
  SelectInput,
} from '../components/ui'
import { CHROMATIC_NOTES, type NoteName, NUM_STRINGS, NUM_FRETS, fretToNote, noteIndex } from '../utils/notes'
import { SCALES, getScaleNotes } from '../utils/scales'
import { genreColorClass } from '../utils/genreColors'
import { useBackingTrack } from '../hooks/useBackingTrack'

const DEGREE_LABELS: Record<number, string> = {
  0: '1', 1: 'b2', 2: '2', 3: 'b3', 4: '3', 5: '4',
  6: 'b5', 7: '5', 8: 'b6', 9: '6', 10: 'b7', 11: '7',
}

const POSITIONS = [
  { label: 'All', range: null },
  { label: 'I',   range: [0, 4]  as [number, number] },
  { label: 'II',  range: [3, 7]  as [number, number] },
  { label: 'III', range: [5, 9]  as [number, number] },
  { label: 'IV',  range: [7, 11] as [number, number] },
  { label: 'V',   range: [9, 12] as [number, number] },
]

export default function Explorer() {
  const [root, setRoot] = useState<NoteName>('A')
  const [scaleIdx, setScaleIdx] = useState(0)
  const [showDegrees, setShowDegrees] = useState(false)
  const [positionIdx, setPositionIdx] = useState(0)
  const [sheetOpen, setSheetOpen] = useState(false)

  const scale = SCALES[scaleIdx]!
  const { isPlaying, isLoading, toggle, bpm, setBpm } = useBackingTrack(root, scale)

  // Spacebar → play/pause. Use a ref so the listener never goes stale.
  const toggleRef = useRef(toggle)
  useEffect(() => { toggleRef.current = toggle }, [toggle])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (e.code === 'Space' && tag !== 'SELECT' && tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'BUTTON') {
        e.preventDefault()
        toggleRef.current()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const scaleNotes = getScaleNotes(root, scale)
  const rootIdx = noteIndex(root)

  const chordToneNotes = new Set<NoteName>()
  for (const degIdx of [0, 2, 4]) {
    const semitone = scale.intervals[degIdx]
    if (semitone !== undefined) {
      chordToneNotes.add(CHROMATIC_NOTES[(rootIdx + semitone) % 12]!)
    }
  }

  const posRange = POSITIONS[positionIdx]!.range

  const markers: FretMarker[] = []
  for (let s = 0; s < NUM_STRINGS; s++) {
    for (let f = 0; f <= NUM_FRETS; f++) {
      if (posRange && (f < posRange[0] || f > posRange[1])) continue
      const note = fretToNote(s, f)
      if (!scaleNotes.has(note)) continue
      const interval = ((noteIndex(note) - rootIdx) + 12) % 12
      const label = showDegrees ? DEGREE_LABELS[interval]! : undefined
      const variant =
        note === root ? 'root'
        : chordToneNotes.has(note) ? 'chord'
        : 'scale'
      markers.push({ stringIndex: s, fret: f, variant, label })
    }
  }

  // Shared controls JSX — used in both the desktop sidebar and the mobile bottom sheet
  const controlsContent = (
    <>
      {/* Key */}
      <div className="space-y-2">
        <ControlLabel htmlFor="explorer-key">Key</ControlLabel>
        <SelectInput
          id="explorer-key"
          fullWidth
          value={root}
          onChange={(e) => setRoot(e.target.value as NoteName)}
        >
          {CHROMATIC_NOTES.map(n => (
            <option key={n} value={n}>{n}</option>
          ))}
        </SelectInput>
      </div>

      {/* Scale */}
      <div className="space-y-2">
        <ControlLabel htmlFor="explorer-scale">Scale</ControlLabel>
        <SelectInput
          id="explorer-scale"
          fullWidth
          value={scaleIdx}
          onChange={(e) => {
            setScaleIdx(Number(e.target.value))
            setPositionIdx(0)
          }}
          className="focus-visible:outline-none focus-visible:border-stone-500 focus-visible:ring-1 focus-visible:ring-stone-500/40"
        >
          {SCALES.map((s, i) => (
            <option key={i} value={i}>{s.name}</option>
          ))}
        </SelectInput>
      </div>

      {/* Labels */}
      <div className="space-y-2">
        <span
          id="labels-group"
          className="text-[11px] font-semibold text-stone-500 tracking-[0.08em] uppercase"
        >
          Labels
        </span>
        <div
          role="radiogroup"
          aria-labelledby="labels-group"
          className="flex rounded-lg overflow-hidden border border-stone-200/10 text-sm font-medium"
        >
          {(['Notes', 'Degrees'] as const).map((opt, i) => {
            const isActive = showDegrees === (i === 1)
            return (
              <button
                key={opt}
                onClick={() => setShowDegrees(i === 1)}
                role="radio"
                aria-checked={isActive}
                className={`flex-1 px-4 py-2 transition-colors duration-150
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-terra-500
                  ${isActive
                    ? 'bg-terra-500 text-stone-200'
                    : 'bg-stone-800 text-stone-400 hover:text-stone-200'
                  }`}
              >
                {opt}
              </button>
            )
          })}
        </div>
      </div>

      {/* Position */}
      <div className="space-y-2">
        <span
          id="position-group"
          className="text-[11px] font-semibold text-stone-500 tracking-[0.08em] uppercase"
        >
          Position
        </span>
        <div
          role="radiogroup"
          aria-labelledby="position-group"
          className="grid grid-cols-3 gap-1"
        >
          {POSITIONS.map((pos, i) => {
            const isActive = positionIdx === i
            return (
              <button
                key={pos.label}
                role="radio"
                aria-checked={isActive}
                onClick={() => setPositionIdx(i)}
                className={`py-2 rounded text-xs font-medium transition-all duration-150
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terra-500
                  focus-visible:ring-offset-1 focus-visible:ring-offset-stone-950
                  ${isActive
                    ? 'bg-terra-500 text-stone-200'
                    : 'bg-stone-800 text-stone-400 hover:bg-stone-700 hover:text-stone-200'
                  }`}
              >
                {pos.label}
              </button>
            )
          })}
        </div>
      </div>
    </>
  )

  // Backing track JSX — used in both sidebar and bottom sheet
  const backingTrackContent = (
    <BackingTrackPanel
      label={`${root} ${scale.name}`}
      isPlaying={isPlaying}
      isLoading={isLoading}
      toggle={toggle}
      bpm={bpm}
      setBpm={setBpm}
    />
  )

  return (
    <div className="flex h-full">

      {/* ── Sidebar — desktop only ──────────────────────────────────────────── */}
      <aside className="hidden md:flex w-52 shrink-0 border-r border-stone-200/10 bg-stone-900/60 flex-col px-4 py-6">

        <div className="flex-1 overflow-y-auto space-y-6 pr-1">
          {controlsContent}
        </div>

        {backingTrackContent}

      </aside>

      {/* ── Main content ─────────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 overflow-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">

        <div className="animate-fade-up">
          <p className="text-[11px] font-semibold text-stone-500 tracking-[0.12em] uppercase mb-1.5">Explorer</p>
          <h1 className="font-display font-semibold text-stone-200 text-[2.375rem] leading-[1.05] tracking-[-0.02em]">
            <span className="text-terra-400">{root}</span>{' '}
            <span className="font-normal text-stone-400">{scale.name}</span>
          </h1>
          <p className="text-stone-400 text-sm mt-2">
            Explore any scale on the neck — pick a root and scale, then try a position.
          </p>
        </div>

        <Fretboard markers={markers} />

        {/* Legend + note chips */}
        <div className="flex flex-wrap gap-x-10 gap-y-4 items-start">
          <div className="flex items-center gap-5 text-sm text-stone-400 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-stone-100 ring-1 ring-stone-400/40" />
              <span>Root</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-sun-400 ring-1 ring-sun-200/40" />
              <span>Chord tone</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-terra-300 ring-1 ring-terra-200/40" />
              <span>Scale tone</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex flex-wrap gap-1.5">
              {[...scaleNotes].map((note) => (
                <span
                  key={note}
                  className={`px-2 py-0.5 rounded text-xs font-mono font-semibold
                    ${note === root
                      ? 'bg-stone-200/15 text-stone-200 ring-1 ring-stone-400/40'
                      : chordToneNotes.has(note)
                        ? 'bg-sun-400/15 text-sun-400 ring-1 ring-sun-400/30'
                        : 'bg-terra-300/15 text-terra-300 ring-1 ring-terra-300/30'
                    }`}
                >
                  {note}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Scale info */}
        <InfoCard>
          <p className="text-stone-300 text-[0.9375rem] leading-relaxed">{scale.description}</p>
          <div className="flex flex-wrap gap-1.5">
            {scale.genres.map(g => (
              <span key={g} className={`px-2 py-0.5 rounded text-xs font-medium ${genreColorClass(g)}`}>{g}</span>
            ))}
          </div>
        </InfoCard>

      </div>

      {/* ── Mobile: floating Controls button (above bottom tab bar) ─────────── */}
      <button
        onClick={() => setSheetOpen(true)}
        aria-label="Open controls"
        className="fixed bottom-[4.5rem] left-4 z-40 md:hidden flex items-center gap-1.5
          bg-stone-800 border border-stone-200/10 text-stone-300 text-sm px-3 py-1.5 rounded-full
          active:scale-95 transition-transform duration-100"
      >
        <SlidersHorizontal size={14} aria-hidden="true" />
        Controls
      </button>

      {/* ── Mobile: bottom sheet backdrop ───────────────────────────────────── */}
      {sheetOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          aria-hidden="true"
          onClick={() => setSheetOpen(false)}
        />
      )}

      {/* ── Mobile: bottom sheet panel ──────────────────────────────────────── */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Scale controls"
        className={`fixed inset-x-0 bottom-0 z-40 md:hidden bg-stone-950 border-t border-stone-200/10
          rounded-t-2xl px-4 pt-4 pb-8 overflow-y-auto max-h-[70vh]
          transition-transform duration-300 ease-out
          ${sheetOpen ? 'translate-y-0' : 'translate-y-full'}`}
      >
        {/* Drag handle */}
        <div className="w-10 h-1 bg-stone-700 rounded-full mx-auto mb-4" aria-hidden="true" />

        {/* Close button — accessible fallback */}
        <button
          onClick={() => setSheetOpen(false)}
          aria-label="Close controls"
          className="absolute top-3 right-4 text-stone-500 hover:text-stone-300 active:text-stone-200
            p-1 transition-colors duration-150 min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          <span aria-hidden="true" className="text-lg leading-none">×</span>
        </button>

        <div className="space-y-6">
          {controlsContent}
          {backingTrackContent}
        </div>
      </div>

    </div>
  )
}
