import { useState } from 'react'
import Fretboard from '../components/Fretboard'
import BackingTrackPanel from '../components/BackingTrackPanel'
import FretboardLegend from '../components/FretboardLegend'
import NeckPageLayout from '../components/NeckPageLayout'
import {
  ControlLabel,
  LabeledField,
  SegmentedControl,
  SelectInput,
} from '../components/ui'
import { CHROMATIC_NOTES, type NoteName } from '../utils/notes'
import { SCALES } from '../utils/scales'
import { PROGRESSION_PRESETS, isMinorTonality } from '../utils/chords'
import { buildScaleMarkers } from '../utils/scaleMarkers'
import { useBackingTrack } from '../hooks/useBackingTrack'
import { useSpacebarToggle } from '../hooks/useSpacebarToggle'

export default function Explorer() {
  const [root, setRoot] = useState<NoteName>('A')
  const [scaleIdx, setScaleIdx] = useState(0)
  const [showDegrees, setShowDegrees] = useState(false)
  const [progressionIdx, setProgressionIdx] = useState(-1) // -1 = none

  const scale = SCALES[scaleIdx]!

  // Progressions are built from diatonic triads, which need a 7-note scale —
  // pentatonics and the blues scale have none.
  const hasDiatonicChords = scale.intervals.length === 7
  const presets = hasDiatonicChords
    ? PROGRESSION_PRESETS.filter(p => p.tonality === (isMinorTonality(scale) ? 'minor' : 'major'))
    : []
  const preset = presets[progressionIdx] ?? null

  const { isPlaying, isLoading, toggle, bpm, baseBpm, setBpm, currentChord } =
    useBackingTrack(root, scale, preset)
  useSpacebarToggle(toggle)

  const markers = buildScaleMarkers({
    root,
    scale,
    showDegrees,
    emphasize: currentChord ? new Set(currentChord.notes) : undefined,
  })

  const controls = (
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
          onChange={(e) => {
            setScaleIdx(Number(e.target.value))
            // The preset list is filtered by tonality and availability, so the
            // index would now point somewhere else.
            setProgressionIdx(-1)
          }}
        >
          {SCALES.map((s, i) => <option key={i} value={i}>{s.name}</option>)}
        </SelectInput>
      </LabeledField>

      <LabeledField label="Progression">
        <SelectInput
          fullWidth
          disabled={!hasDiatonicChords}
          value={progressionIdx}
          onChange={(e) => {
            const next = Number(e.target.value)
            setProgressionIdx(next)
            // Explorer picks a scale by index, so a preset can set the root but
            // not the tonality — leave the scale selection alone.
            const picked = presets[next]
            if (picked?.canonicalRoot) setRoot(picked.canonicalRoot)
          }}
        >
          <option value={-1}>None — vamp on the tonic</option>
          {presets.map((p, i) => (
            <option key={p.label} value={i}>
              {p.attribution ? `${p.attribution} (${p.label})` : p.label}
            </option>
          ))}
        </SelectInput>
        {!hasDiatonicChords && (
          <span className="block text-[11px] text-stone-500 normal-case font-normal tracking-normal">
            {scale.name} has {scale.intervals.length} notes — progressions need a
            seven-note scale to build chords from.
          </span>
        )}
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

  return (
    <NeckPageLayout
      title={<>
        <span className="text-terra-400">{root}</span>{' '}
        <span className="font-normal text-stone-400">{scale.name}</span>
      </>}
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
      sheetLabel="Scale controls"
    >
      <Fretboard markers={markers} />
      <FretboardLegend />
    </NeckPageLayout>
  )
}
