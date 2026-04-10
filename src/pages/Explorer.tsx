import { useState, useEffect, useRef } from 'react'
import Fretboard, { type FretMarker } from '../components/Fretboard'
import RootPicker from '../components/RootPicker'
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

  const scale = SCALES[scaleIdx]!
  const { isPlaying, toggle, bpm } = useBackingTrack(root, scale)

  // Spacebar → play/pause. Use a ref so the listener never goes stale.
  const toggleRef = useRef(toggle)
  useEffect(() => { toggleRef.current = toggle }, [toggle])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (e.code === 'Space' && tag !== 'SELECT' && tag !== 'INPUT' && tag !== 'TEXTAREA') {
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

  return (
    <div className="flex h-full">

      {/* ── Sidebar — desktop only ──────────────────────────────────────────── */}
      <aside className="hidden md:flex w-52 shrink-0 border-r border-stone-800 bg-stone-950/40 flex-col px-4 py-6">

        <div className="flex-1 overflow-y-auto space-y-6 pr-1">

        {/* Root */}
        <div className="space-y-2">
          <span className="text-[11px] font-medium text-stone-400 tracking-wide">Root</span>
          <RootPicker value={root} onChange={setRoot} layout="grid" />
        </div>

        {/* Scale */}
        <div className="space-y-2">
          <label
            htmlFor="explorer-scale"
            className="text-[11px] font-medium text-stone-400 tracking-wide"
          >
            Scale
          </label>
          <select
            id="explorer-scale"
            value={scaleIdx}
            onChange={(e) => setScaleIdx(Number(e.target.value))}
            className="w-full bg-stone-800 border border-stone-700 text-stone-200 rounded-lg px-3 py-2
              text-sm focus-visible:outline-none focus-visible:border-stone-500 focus-visible:ring-1
              focus-visible:ring-stone-500/40 cursor-pointer transition-colors duration-150"
          >
            {SCALES.map((s, i) => (
              <option key={i} value={i}>{s.name}</option>
            ))}
          </select>
        </div>

        {/* Labels */}
        <div className="space-y-2">
          <span
            id="labels-group"
            className="text-[11px] font-medium text-stone-400 tracking-wide"
          >
            Labels
          </span>
          <div
            role="radiogroup"
            aria-labelledby="labels-group"
            className="flex rounded-lg overflow-hidden border border-stone-700 text-sm font-medium"
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
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-rose-500
                    ${isActive
                      ? 'bg-rose-500 text-white'
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
            className="text-[11px] font-medium text-stone-400 tracking-wide"
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
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500
                    focus-visible:ring-offset-1 focus-visible:ring-offset-stone-950
                    ${isActive
                      ? 'bg-rose-500 text-white'
                      : 'bg-stone-800 text-stone-400 hover:bg-stone-700 hover:text-stone-200'
                    }`}
                >
                  {pos.label}
                </button>
              )
            })}
          </div>
        </div>

        </div>

        {/* Backing track — separated from settings controls with a border */}
        <div className="shrink-0 border-t border-stone-800 pt-4 space-y-3">
          <button
            onClick={toggle}
            aria-label={isPlaying ? 'Stop backing track' : 'Play backing track'}
            aria-pressed={isPlaying}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 border
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500
              focus-visible:ring-offset-2 focus-visible:ring-offset-stone-950
              ${isPlaying
                ? 'bg-rose-500 text-white border-rose-400 shadow-md shadow-rose-500/20'
                : 'bg-stone-800 text-stone-400 border-stone-700 hover:border-stone-500 hover:text-stone-200'
              }`}
          >
            {/* Icon — equalizer bars when playing, play arrow when stopped */}
            {isPlaying ? (
              <span
                aria-hidden="true"
                className="flex items-end gap-[2px] h-3.5 shrink-0"
                style={{ '--beat-dur': `${Math.round(60000 / bpm)}ms` } as React.CSSProperties}
              >
                <span className="block w-[3px] h-3.5 bg-current rounded-[1px] animate-bar-bounce origin-bottom" style={{ animationDelay: '0ms' }} />
                <span className="block w-[3px] h-3.5 bg-current rounded-[1px] animate-bar-bounce origin-bottom" style={{ animationDelay: `${Math.round(60000 / bpm / 4)}ms` }} />
                <span className="block w-[3px] h-3.5 bg-current rounded-[1px] animate-bar-bounce origin-bottom" style={{ animationDelay: `${Math.round(60000 / bpm / 8)}ms` }} />
              </span>
            ) : (
              <span aria-hidden="true" className="text-[11px] leading-none shrink-0">▶</span>
            )}

            <span className="flex-1 text-left">{isPlaying ? 'Stop' : 'Backing Track'}</span>

            <span aria-hidden="true" className={`text-[11px] font-mono shrink-0 ${isPlaying ? 'text-rose-200/80' : 'text-stone-600'}`}>
              {bpm}<span className="opacity-60 text-[9px] ml-px">bpm</span>
            </span>
          </button>

          {/* Spacebar hint — shown only when not playing so it doesn't compete with the beat dots */}
          {!isPlaying && (
            <p className="text-center text-xs text-stone-500">Space to play</p>
          )}

          {/* Beat counter — 4 dots, each fires on its beat (1-2-3-4) */}
          <div
            aria-hidden="true"
            className={`flex justify-center items-center gap-2.5 h-3 transition-opacity duration-300 ${isPlaying ? 'opacity-100' : 'opacity-0'}`}
          >
            {[0, 1, 2, 3].map((i) => {
              const beatMs = Math.round(60000 / bpm)
              return (
                <span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-rose-300/70"
                  style={{
                    animation: isPlaying
                      ? `beatDot ${beatMs * 4}ms linear ${i * beatMs}ms infinite`
                      : 'none',
                  }}
                />
              )
            })}
          </div>
        </div>

      </aside>

      {/* ── Main content ─────────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 overflow-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">

        <div className="animate-fade-up">
          <h1 className="text-2xl font-bold text-stone-100">
            <span className="text-rose-400">{root}</span>{' '}
            <span className="font-normal text-stone-400">{scale.name}</span>
          </h1>
          <p className="text-stone-500 text-sm mt-1">
            Explore any scale on the neck — pick a root and scale, then try a position.
          </p>
        </div>

        {/* ── Mobile controls — hidden on md+ where sidebar is visible ─────── */}
        <div className="md:hidden space-y-3 animate-fade-up">
          {/* Row 1: Root + Scale */}
          <div className="flex gap-2 items-end">
            <div className="space-y-1">
              <span className="text-[11px] font-medium text-stone-400 tracking-wide">Root</span>
              <select
                value={root}
                onChange={(e) => setRoot(e.target.value as NoteName)}
                className="bg-stone-800 border border-stone-700 text-stone-200 rounded-lg px-2 py-2
                  text-sm focus-visible:outline-none cursor-pointer w-16 transition-colors duration-150"
              >
                {CHROMATIC_NOTES.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <label htmlFor="explorer-scale-mobile" className="text-[11px] font-medium text-stone-400 tracking-wide">Scale</label>
              <select
                id="explorer-scale-mobile"
                value={scaleIdx}
                onChange={(e) => setScaleIdx(Number(e.target.value))}
                className="w-full bg-stone-800 border border-stone-700 text-stone-200 rounded-lg px-2 py-2
                  text-sm focus-visible:outline-none cursor-pointer transition-colors duration-150"
              >
                {SCALES.map((s, i) => <option key={i} value={i}>{s.name}</option>)}
              </select>
            </div>
          </div>
          {/* Row 2: Position + Backing Track */}
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {POSITIONS.map((pos, i) => {
                const isActive = positionIdx === i
                return (
                  <button
                    key={pos.label}
                    onClick={() => setPositionIdx(i)}
                    role="radio"
                    aria-checked={isActive}
                    className={`px-2.5 py-1.5 rounded text-xs font-medium transition-all duration-150
                      ${isActive ? 'bg-rose-500 text-white' : 'bg-stone-800 text-stone-400 hover:bg-stone-700 hover:text-stone-200'}`}
                  >
                    {pos.label}
                  </button>
                )
              })}
            </div>
            <button
              onClick={toggle}
              aria-label={isPlaying ? 'Stop backing track' : 'Play backing track'}
              aria-pressed={isPlaying}
              className={`ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 border
                ${isPlaying
                  ? 'bg-rose-500 text-white border-rose-400 shadow-sm shadow-rose-500/20'
                  : 'bg-stone-800 text-stone-400 border-stone-700'}`}
            >
              {isPlaying ? (
                <span aria-hidden="true" className="flex items-end gap-[2px] h-3 shrink-0">
                  <span className="block w-[2px] h-3 bg-current rounded-[1px] animate-bar-bounce origin-bottom" style={{ animationDelay: '0ms' }} />
                  <span className="block w-[2px] h-3 bg-current rounded-[1px] animate-bar-bounce origin-bottom" style={{ animationDelay: `${Math.round(60000 / bpm / 4)}ms` }} />
                  <span className="block w-[2px] h-3 bg-current rounded-[1px] animate-bar-bounce origin-bottom" style={{ animationDelay: `${Math.round(60000 / bpm / 8)}ms` }} />
                </span>
              ) : (
                <span aria-hidden="true" className="text-[10px] leading-none">▶</span>
              )}
              {isPlaying ? 'Stop' : 'Backing Track'}
            </button>
          </div>
        </div>

        <Fretboard markers={markers} />

        {/* Legend + note chips */}
        <div className="flex flex-wrap gap-x-10 gap-y-4 items-start">
          <div className="flex items-center gap-5 text-sm text-stone-400 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-stone-100 ring-1 ring-stone-400/40 shadow-sm" />
              <span>Root</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-violet-300 ring-1 ring-violet-200/40" />
              <span>Chord tone</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-rose-300 ring-1 ring-rose-200/40" />
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
                        ? 'bg-violet-300/15 text-violet-300 ring-1 ring-violet-300/30'
                        : 'bg-rose-300/15 text-rose-300 ring-1 ring-rose-300/30'
                    }`}
                >
                  {note}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Scale info */}
        <div className="bg-stone-800/60 border border-stone-700/60 rounded-xl px-5 py-4 space-y-2">
          <p className="text-stone-300 text-[0.9375rem] leading-relaxed">{scale.description}</p>
          <div className="flex flex-wrap gap-1.5">
            {scale.genres.map(g => (
              <span key={g} className={`px-2 py-0.5 rounded text-xs font-medium ${genreColorClass(g)}`}>{g}</span>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
