import { useState } from 'react'
import { SlidersHorizontal } from 'lucide-react'
import Fretboard from '../components/Fretboard'
import BackingTrackPanel from '../components/BackingTrackPanel'
import FretboardLegend from '../components/FretboardLegend'
import { ControlLabel, SelectInput } from '../components/ui'
import { CHROMATIC_NOTES, type NoteName } from '../utils/notes'
import { SCALES } from '../utils/scales'
import { getCagedFretRange, CAGED_SHAPES, SHAPE_INFO, type CagedShape } from '../utils/caged'
import { buildScaleMarkers } from '../utils/scaleMarkers'
import { useBackingTrack } from '../hooks/useBackingTrack'
import { useSpacebarToggle } from '../hooks/useSpacebarToggle'

const MAJOR_IDX = SCALES.findIndex(s => s.name === 'Major (Ionian)')
const MINOR_IDX = SCALES.findIndex(s => s.name === 'Natural Minor (Aeolian)')

export default function CAGEDPage() {
  const [root, setRoot] = useState<NoteName>('C')
  const [isMajor, setIsMajor] = useState(true)
  const [shape, setShape] = useState<CagedShape>('C')
  const [sheetOpen, setSheetOpen] = useState(false)

  const scale = SCALES[isMajor ? MAJOR_IDX : MINOR_IDX]!
  const { isPlaying, isLoading, toggle, bpm, setBpm } = useBackingTrack(root, scale)
  useSpacebarToggle(toggle)

  const [fretMin, fretMax] = getCagedFretRange(root, shape)
  const markers = buildScaleMarkers({ root, scale, fretRange: [fretMin, fretMax] })

  const shapeIdx = CAGED_SHAPES.indexOf(shape)
  const prevShape = CAGED_SHAPES[(shapeIdx + CAGED_SHAPES.length - 1) % CAGED_SHAPES.length]!
  const nextShape = CAGED_SHAPES[(shapeIdx + 1) % CAGED_SHAPES.length]!
  const info = SHAPE_INFO[shape]

  const controlsContent = (
    <>
      <div className="space-y-2">
        <ControlLabel htmlFor="caged-key">Key</ControlLabel>
        <SelectInput
          id="caged-key"
          fullWidth
          value={root}
          onChange={e => setRoot(e.target.value as NoteName)}
        >
          {CHROMATIC_NOTES.map(n => <option key={n} value={n}>{n}</option>)}
        </SelectInput>
      </div>

      <div className="space-y-2">
        <ControlLabel>Scale</ControlLabel>
        <div className="flex rounded-lg overflow-hidden border border-stone-200/10 text-sm font-medium">
          {(['Major', 'Minor'] as const).map((opt) => {
            const isActive = isMajor === (opt === 'Major')
            return (
              <button
                key={opt}
                onClick={() => setIsMajor(opt === 'Major')}
                className={`flex-1 px-3 py-2 transition-colors duration-150
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-terra-500
                  ${isActive ? 'bg-terra-500 text-stone-200' : 'bg-stone-800 text-stone-400 hover:text-stone-200'}`}
              >
                {opt}
              </button>
            )
          })}
        </div>
      </div>

      <div className="space-y-2">
        <ControlLabel>Shape</ControlLabel>
        <div className="space-y-1">
          {CAGED_SHAPES.map(s => {
            const [lo, hi] = getCagedFretRange(root, s)
            const isActive = shape === s
            return (
              <button
                key={s}
                onClick={() => { setShape(s); setSheetOpen(false) }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-left
                  transition-all duration-150 active:scale-95
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terra-500
                  focus-visible:ring-offset-1 focus-visible:ring-offset-stone-950
                  ${isActive
                    ? 'bg-terra-500 border-terra-400 text-stone-200'
                    : 'border-transparent hover:border-stone-200/10 hover:bg-stone-800/60 text-stone-400'
                  }`}
              >
                <span className="font-mono font-bold text-sm">{s}</span>
                <span className={`font-mono text-xs ${isActive ? 'text-terra-100' : 'text-stone-600'}`}>
                  frets {lo}–{hi}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </>
  )

  const backingTrackContent = (
    <BackingTrackPanel
      label={`${root} ${isMajor ? 'major' : 'minor'}`}
      isPlaying={isPlaying}
      isLoading={isLoading}
      toggle={toggle}
      bpm={bpm}
      setBpm={setBpm}
    />
  )

  return (
    <div className="flex h-full">

      {/* ── Sidebar — desktop ────────────────────────────────────────────────── */}
      <aside className="hidden md:flex w-52 shrink-0 border-r border-stone-200/10 bg-stone-900/60 flex-col px-4 py-6">
        <div className="flex-1 overflow-y-auto space-y-6 pr-1">
          {controlsContent}
        </div>
        {backingTrackContent}
      </aside>

      {/* ── Main ─────────────────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 overflow-auto px-4 sm:px-6 py-4 sm:py-6 space-y-5">

        <div className="animate-fade-up" style={{ animationDelay: '0ms' }}>
          <p className="text-[11px] font-semibold text-stone-500 tracking-[0.12em] uppercase mb-1.5">CAGED</p>
          <h1 className="font-display font-semibold text-stone-200 text-[2.375rem] leading-[1.05] tracking-[-0.02em]">
            <span className="text-terra-400">{shape}</span>{' '}
            <span className="font-normal text-stone-400">— {root} {isMajor ? 'major' : 'minor'}</span>
          </h1>
          <p className="text-stone-400 text-sm mt-2">
            Five shapes named after open chords tile the entire neck. Navigate them to cover every position.
          </p>
        </div>

        {/* Shape selector row — letter + fret range, plus "All shapes" toggle */}
        <div className="flex gap-2 items-start animate-fade-up" style={{ animationDelay: '60ms' }}>
          {CAGED_SHAPES.map(s => {
            const [lo, hi] = getCagedFretRange(root, s)
            const isActive = shape === s
            return (
              <button
                key={s}
                onClick={() => setShape(s)}
                className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-xl border
                  transition-all duration-150 active:scale-95
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terra-500
                  focus-visible:ring-offset-1 focus-visible:ring-offset-stone-950
                  ${isActive
                    ? 'bg-terra-500 border-terra-400 text-stone-200'
                    : 'bg-stone-800 border-stone-200/10 text-stone-400 hover:border-stone-200/20 hover:text-stone-200'
                  }`}
              >
                <span className="font-mono font-bold text-lg leading-none">{s}</span>
                <span className={`font-mono text-[10px] leading-none ${isActive ? 'text-terra-100' : 'text-stone-600'}`}>
                  {lo}–{hi}
                </span>
              </button>
            )
          })}
        </div>

        <div className="animate-fade-up" style={{ animationDelay: '120ms' }}>
          <Fretboard markers={markers} />
        </div>

        <FretboardLegend rootNote={root} />

        {/* Info card */}
        <div className="bg-stone-800/60 border border-stone-200/10 rounded-xl p-5 space-y-3 animate-fade-up" style={{ animationDelay: '180ms' }}>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-[11px] font-medium text-stone-500 tracking-wide uppercase mb-1">
                {info.openChord}
              </p>
              <p className="text-stone-100 font-semibold">
                {shape} shape · frets {fretMin}–{fretMax}
              </p>
              <p className="text-stone-500 text-xs mt-0.5">Root on the {info.anchorStringName}</p>
            </div>
            <div className="flex gap-1.5 shrink-0">
              <button
                onClick={() => setShape(prevShape)}
                aria-label={`Previous shape: ${prevShape}`}
                className="px-2.5 py-1.5 rounded-lg border border-stone-200/10 text-stone-400 text-xs font-mono
                  hover:border-stone-200/20 hover:text-stone-200 transition-all duration-150 active:scale-95"
              >
                ← {prevShape}
              </button>
              <button
                onClick={() => setShape(nextShape)}
                aria-label={`Next shape: ${nextShape}`}
                className="px-2.5 py-1.5 rounded-lg border border-stone-200/10 text-stone-400 text-xs font-mono
                  hover:border-stone-200/20 hover:text-stone-200 transition-all duration-150 active:scale-95"
              >
                {nextShape} →
              </button>
            </div>
          </div>
          <p className="text-stone-400 text-sm leading-relaxed">{info.tip}</p>
        </div>

      </div>

      {/* ── Mobile: floating Controls button ─────────────────────────────────── */}
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

      {/* ── Mobile: backdrop ─────────────────────────────────────────────────── */}
      {sheetOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          aria-hidden="true"
          onClick={() => setSheetOpen(false)}
        />
      )}

      {/* ── Mobile: bottom sheet ─────────────────────────────────────────────── */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="CAGED controls"
        className={`fixed inset-x-0 bottom-0 z-40 md:hidden bg-stone-950 border-t border-stone-200/10
          rounded-t-2xl px-4 pt-4 pb-8 overflow-y-auto max-h-[70vh]
          transition-transform duration-300 ease-out
          ${sheetOpen ? 'translate-y-0' : 'translate-y-full'}`}
      >
        <div className="w-10 h-1 bg-stone-700 rounded-full mx-auto mb-4" aria-hidden="true" />
        <button
          onClick={() => setSheetOpen(false)}
          aria-label="Close controls"
          className="absolute top-3 right-4 text-stone-500 hover:text-stone-300
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
