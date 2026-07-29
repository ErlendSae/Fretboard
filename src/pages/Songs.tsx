import { useState } from 'react'
import Fretboard from '../components/Fretboard'
import BackingTrackPanel from '../components/BackingTrackPanel'
import BarStrip from '../components/BarStrip'
import FretboardLegend from '../components/FretboardLegend'
import NeckPageLayout from '../components/NeckPageLayout'
import SongPicker from '../components/SongPicker'
import { ControlLabel } from '../components/ui'
import { buildScaleMarkers } from '../utils/scaleMarkers'
import { SONGS_BY_STYLE, resolveSong, shortKeyLabel } from '../utils/songs'
import { useBackingTrack } from '../hooks/useBackingTrack'
import { useSpacebarToggle } from '../hooks/useSpacebarToggle'

// A song with a mistyped scale name can't resolve, so drop it from the list
// rather than render it broken.
const PLAYABLE = SONGS_BY_STYLE.filter(s => resolveSong(s) !== null)

export default function Songs() {
  const [songIdx, setSongIdx] = useState(0)

  const song = PLAYABLE[songIdx]!
  const resolved = resolveSong(song)!

  const { isPlaying, isLoading, toggle, bpm, baseBpm, setBpm, currentChord, currentBar } =
    useBackingTrack(resolved.root, resolved.scale, song.chords)
  useSpacebarToggle(toggle)

  const markers = buildScaleMarkers({
    root: resolved.root,
    scale: resolved.scale,
    emphasize: currentChord ? new Set(currentChord.notes) : undefined,
  })

  // Sidebar is read-only: the song sets its own key, and choosing a song
  // happens in the picker below the neck.
  const controls = (
    <div className="space-y-1">
      <ControlLabel>Key</ControlLabel>
      <p className="font-mono text-sm text-stone-300">{shortKeyLabel(song)}</p>
      <p className="text-[11px] text-stone-500">{song.genre}</p>
    </div>
  )

  return (
    <NeckPageLayout
      title={<span className="text-terra-400">{song.title}</span>}
      subtitle={song.artist}
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
      sheetLabel="Song controls"
    >
      <BarStrip bars={resolved.bars} currentBar={currentBar} />

      <Fretboard markers={markers} />

      <FretboardLegend rootNote={resolved.root} />

      <SongPicker songs={PLAYABLE} selectedIndex={songIdx} onSelect={setSongIdx} />
    </NeckPageLayout>
  )
}
