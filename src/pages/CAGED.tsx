import { useState } from 'react'
import Fretboard from '../components/Fretboard'
import BackingTrackPanel from '../components/BackingTrackPanel'
import FretboardLegend from '../components/FretboardLegend'
import NeckPageLayout from '../components/NeckPageLayout'
import { ControlLabel, LabeledField, SegmentedControl, SelectInput } from '../components/ui'
import { CHROMATIC_NOTES, type NoteName } from '../utils/notes'
import { SCALES } from '../utils/scales'
import { getCagedFretRange, CAGED_SHAPES, SHAPE_INFO, type CagedShape } from '../utils/caged'
import { PROGRESSION_PRESETS } from '../utils/chords'
import { buildScaleMarkers } from '../utils/scaleMarkers'
import { useBackingTrack } from '../hooks/useBackingTrack'
import { useSpacebarToggle } from '../hooks/useSpacebarToggle'

const MAJOR_IDX = SCALES.findIndex(s => s.name === 'Major (Ionian)')
const MINOR_IDX = SCALES.findIndex(s => s.name === 'Natural Minor (Aeolian)')

export default function CAGEDPage() {
  const [root, setRoot] = useState<NoteName>('C')
  const [isMajor, setIsMajor] = useState(true)
  // null = no shape outlined. The five windows union to the whole neck
  // (see utils/caged.ts), so the full neck IS "all shapes" — a shape is an
  // orientation aid you switch on, never a filter you must operate.
  const [shape, setShape] = useState<CagedShape | null>(null)
  const [progressionIdx, setProgressionIdx] = useState(-1) // -1 = none

  const scale = SCALES[isMajor ? MAJOR_IDX : MINOR_IDX]!

  const presets = PROGRESSION_PRESETS.filter(p => p.tonality === (isMajor ? 'major' : 'minor'))
  const preset = presets[progressionIdx] ?? null

  const { isPlaying, isLoading, toggle, bpm, baseBpm, setBpm, currentChord } =
    useBackingTrack(root, scale, preset)
  useSpacebarToggle(toggle)

  const markers = buildScaleMarkers({
    root,
    scale,
    emphasize: currentChord ? new Set(currentChord.notes) : undefined,
  })
  const outlineRange = shape ? getCagedFretRange(root, shape) : null
  const info = shape ? SHAPE_INFO[shape] : null

  const controls = (
    <>
      <LabeledField label="Key">
        <SelectInput
          fullWidth
          value={root}
          onChange={e => setRoot(e.target.value as NoteName)}
        >
          {CHROMATIC_NOTES.map(n => <option key={n} value={n}>{n}</option>)}
        </SelectInput>
      </LabeledField>

      <div className="space-y-2">
        <ControlLabel>Scale</ControlLabel>
        <SegmentedControl
          options={[
            { value: 'major', label: 'Major' },
            { value: 'minor', label: 'Minor' },
          ]}
          value={isMajor ? 'major' : 'minor'}
          onChange={(v) => {
            setIsMajor(v === 'major')
            // The preset list is filtered by tonality, so the index would now
            // point at a different progression.
            setProgressionIdx(-1)
          }}
          ariaLabel="Major or minor"
          fullWidth
        />
      </div>

      <LabeledField label="Progression">
        <SelectInput
          fullWidth
          value={progressionIdx}
          onChange={(e) => {
            const next = Number(e.target.value)
            setProgressionIdx(next)
            // Song presets carry their canonical key — jump there so one pick
            // is enough to be playing the actual song.
            const picked = presets[next]
            if (picked?.canonicalRoot) {
              setRoot(picked.canonicalRoot)
              setIsMajor(picked.tonality === 'major')
            }
          }}
        >
          <option value={-1}>None — vamp on the tonic</option>
          {presets.map((p, i) => (
            <option key={p.label} value={i}>
              {p.attribution ? `${p.attribution} (${p.label})` : p.label}
            </option>
          ))}
        </SelectInput>
      </LabeledField>
    </>
  )

  return (
    <NeckPageLayout
      title={<>
        <span className="text-terra-400">{root}</span>{' '}
        <span className="font-normal text-stone-400">{isMajor ? 'major' : 'minor'}</span>
      </>}
      subtitle="The whole neck, in one key. Tap a shape to see where that box sits."
      controls={controls}
      footer={
        <BackingTrackPanel
          isPlaying={isPlaying}
          isLoading={isLoading}
          toggle={toggle}
          bpm={bpm}
          baseBpm={baseBpm}
          setBpm={setBpm}
          currentChordName={currentChord?.name ?? null}
        />
      }
      sheetLabel="CAGED controls"
    >
      {/* Shape row — a toggle, not a filter. Tapping the active shape clears it. */}
      <div className="flex gap-2 items-start" role="group" aria-label="Highlight a CAGED shape">
        {CAGED_SHAPES.map(s => {
          const [lo, hi] = getCagedFretRange(root, s)
          const isActive = shape === s
          return (
            <button
              key={s}
              onClick={() => setShape(isActive ? null : s)}
              aria-pressed={isActive}
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

      <Fretboard
        markers={markers}
        outline={outlineRange && shape ? { fretRange: outlineRange, label: shape } : undefined}
      />

      <FretboardLegend rootNote={root} />

      {/* Info card — only while a shape is highlighted */}
      {info && shape && outlineRange && (
        <div className="bg-stone-800/60 border border-stone-200/10 rounded-xl p-5 space-y-3">
          <div>
            <p className="text-[11px] font-medium text-stone-500 tracking-wide uppercase mb-1">
              {info.openChord}
            </p>
            <p className="text-stone-100 font-semibold">
              {shape} shape · frets {outlineRange[0]}–{outlineRange[1]}
            </p>
            <p className="text-stone-500 text-xs mt-0.5">Root on the {info.anchorStringName}</p>
          </div>
          <p className="text-stone-400 text-sm leading-relaxed">{info.tip}</p>
          {!isMajor && (
            <p className="text-stone-500 text-xs leading-relaxed">
              The five shapes are named after the open <em>major</em> chord forms — that is where
              the fingering comes from. In a minor key the box marks the same stretch of neck, but
              the notes inside it are {root} minor.
            </p>
          )}
        </div>
      )}
    </NeckPageLayout>
  )
}
