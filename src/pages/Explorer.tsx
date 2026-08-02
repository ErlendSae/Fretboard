import { useState } from 'react'
import Fretboard from '../components/Fretboard'
import BackingTrackPanel from '../components/BackingTrackPanel'
import FretboardLegend from '../components/FretboardLegend'
import NeckPageLayout from '../components/NeckPageLayout'
import PositionRow from '../components/PositionRow'
import {
  ControlLabel,
  LabeledField,
  SegmentedControl,
  SelectInput,
} from '../components/ui'
import { CHROMATIC_NOTES, type NoteName } from '../utils/notes'
import { SCALES, type ScaleDef } from '../utils/scales'
import { VAMPS, isMinorTonality, vampScale } from '../utils/chords'
import { buildScaleMarkers } from '../utils/scaleMarkers'
import { getPositions } from '../utils/positions'
import { useBackingTrack } from '../hooks/useBackingTrack'
import { useSpacebarToggle } from '../hooks/useSpacebarToggle'

/** Sentinel for "no progression — tonic only", the hook's no-chords path. */
const DRONE = -1

function vampsFor(scale: ScaleDef) {
  const tonality = isMinorTonality(scale) ? 'minor' : 'major'
  return VAMPS.filter(v => v.tonality === tonality)
}

export default function Explorer() {
  const [root, setRoot] = useState<NoteName>('A')
  const [scaleIdx, setScaleIdx] = useState(0)
  const [showDegrees, setShowDegrees] = useState(false)
  // null = the whole neck, which is how the page opens.
  const [positionIdx, setPositionIdx] = useState<number | null>(null)
  const [vampIdx, setVampIdx] = useState(0)

  const scale = SCALES[scaleIdx]!

  const positions = getPositions(root)
  const focusRange = positionIdx !== null ? positions[positionIdx]!.fretRange : undefined

  const vamps = vampsFor(scale)
  const vamp = vampIdx === DRONE ? null : vamps[vampIdx] ?? null

  // Pentatonic and blues have no diatonic triads, so the vamp is built from
  // the parent scale. The neck below still draws `scale` — only the harmony
  // looks elsewhere.
  const { isPlaying, isLoading, toggle, bpm, baseBpm, setBpm, currentChord } =
    useBackingTrack(root, vampScale(scale), vamp?.chords)
  useSpacebarToggle(toggle)

  const markers = buildScaleMarkers({ root, scale, showDegrees, focusRange })

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
            const next = Number(e.target.value)
            const nextScale = SCALES[next]!
            // The vamp list is filtered by tonality, so across a tonality
            // boundary the old index would silently mean a different
            // progression. An explicit Drone choice survives; anything else
            // falls back to the first vamp of the new tonality.
            if (isMinorTonality(nextScale) !== isMinorTonality(scale) && vampIdx !== DRONE) {
              setVampIdx(0)
            }
            setScaleIdx(next)
          }}
        >
          {SCALES.map((s, i) => <option key={i} value={i}>{s.name}</option>)}
        </SelectInput>
      </LabeledField>

      <LabeledField label="Vamp">
        <SelectInput
          fullWidth
          value={vampIdx}
          onChange={(e) => setVampIdx(Number(e.target.value))}
        >
          <option value={DRONE}>Drone — tonic only</option>
          {vamps.map((v, i) => <option key={v.label} value={i}>{v.label}</option>)}
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
      <PositionRow
        positions={positions}
        selected={positionIdx}
        onSelect={setPositionIdx}
      />

      <Fretboard markers={markers} />

      <FretboardLegend />
    </NeckPageLayout>
  )
}
