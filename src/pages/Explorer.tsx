import { useState } from 'react'
import { SlidersHorizontal } from 'lucide-react'
import Fretboard from '../components/Fretboard'
import BackingTrackPanel from '../components/BackingTrackPanel'
import FretboardLegend from '../components/FretboardLegend'
import {
  ControlLabel,
  LabeledField,
  SegmentedControl,
  SelectInput,
} from '../components/ui'
import { CHROMATIC_NOTES, type NoteName } from '../utils/notes'
import { SCALES } from '../utils/scales'
import { buildScaleMarkers } from '../utils/scaleMarkers'
import { useBackingTrack } from '../hooks/useBackingTrack'
import { useSpacebarToggle } from '../hooks/useSpacebarToggle'

export default function Explorer() {
  const [root, setRoot] = useState<NoteName>('A')
  const [scaleIdx, setScaleIdx] = useState(0)
  const [showDegrees, setShowDegrees] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)

  const scale = SCALES[scaleIdx]!
  const { isPlaying, isLoading, toggle, bpm, baseBpm, setBpm } = useBackingTrack(root, scale)
  useSpacebarToggle(toggle)

  const markers = buildScaleMarkers({ root, scale, showDegrees })

  // Shared controls JSX — used in both the desktop sidebar and the mobile bottom sheet
  const controlsContent = (
    <>
      <LabeledField label="Key">
        <SelectInput
          fullWidth
          value={root}
          onChange={(e) => setRoot(e.target.value as NoteName)}
        >
          {CHROMATIC_NOTES.map(n => <option key={n} value={n}>{n}</option>)}
        </SelectInput>
      </LabeledField>

      <LabeledField label="Scale">
        <SelectInput
          fullWidth
          value={scaleIdx}
          onChange={(e) => setScaleIdx(Number(e.target.value))}
        >
          {SCALES.map((s, i) => <option key={i} value={i}>{s.name}</option>)}
        </SelectInput>
      </LabeledField>

      <div className="space-y-2">
        <ControlLabel>Labels</ControlLabel>
        <SegmentedControl
          options={[
            { value: 'notes', label: 'Notes' },
            { value: 'degrees', label: 'Degrees' },
          ]}
          value={showDegrees ? 'degrees' : 'notes'}
          onChange={(v) => setShowDegrees(v === 'degrees')}
          ariaLabel="Marker labels"
          fullWidth
        />
      </div>
    </>
  )

  // Backing track JSX — used in both sidebar and bottom sheet
  const backingTrackContent = (
    <BackingTrackPanel
      isPlaying={isPlaying}
      isLoading={isLoading}
      toggle={toggle}
      bpm={bpm}
      baseBpm={baseBpm}
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

        <h1 className="animate-fade-up font-display font-semibold text-stone-200 text-[2.375rem] leading-[1.05] tracking-[-0.02em]">
          <span className="text-terra-400">{root}</span>{' '}
          <span className="font-normal text-stone-400">{scale.name}</span>
        </h1>

        <Fretboard markers={markers} />

        <FretboardLegend />

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
