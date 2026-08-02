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
import { buildScaleMarkers } from '../utils/scaleMarkers'
import { useBackingTrack } from '../hooks/useBackingTrack'
import { useSpacebarToggle } from '../hooks/useSpacebarToggle'

export default function Explorer() {
  const [root, setRoot] = useState<NoteName>('A')
  const [scaleIdx, setScaleIdx] = useState(0)
  const [showDegrees, setShowDegrees] = useState(false)

  const scale = SCALES[scaleIdx]!

  // Explorer is for exploring scales — chord changes live on the Songs page.
  const { isPlaying, isLoading, toggle, bpm, baseBpm, setBpm } = useBackingTrack(root, scale)
  useSpacebarToggle(toggle)

  const markers = buildScaleMarkers({ root, scale, showDegrees })

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
        />
      }
      sheetLabel="Scale controls"
    >
      <Fretboard markers={markers} />
      <FretboardLegend />
    </NeckPageLayout>
  )
}
