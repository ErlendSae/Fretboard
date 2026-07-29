import { useState } from 'react'
import Fretboard from '../components/Fretboard'
import BackingTrackPanel from '../components/BackingTrackPanel'
import BarStrip from '../components/BarStrip'
import FretboardLegend from '../components/FretboardLegend'
import NeckPageLayout from '../components/NeckPageLayout'
import { ControlLabel, LabeledField, SelectInput } from '../components/ui'
import { buildScaleMarkers } from '../utils/scaleMarkers'
import { SONGS, resolveSong, type Song } from '../utils/songs'
import { getCagedFretRange, CAGED_SHAPES, type CagedShape } from '../utils/caged'
import { useBackingTrack } from '../hooks/useBackingTrack'
import { useSpacebarToggle } from '../hooks/useSpacebarToggle'

// A song with a mistyped scale name can't resolve, so drop it from the list
// rather than render it broken.
const PLAYABLE = SONGS.filter(s => resolveSong(s) !== null)

// Grouped for the <select>, keeping each song's index into PLAYABLE as its
// value. Genres appear in the order they first show up in SONGS.
const BY_GENRE: Array<{ genre: string; entries: Array<{ song: Song; index: number }> }> = []
PLAYABLE.forEach((song, index) => {
  const lane = BY_GENRE.find(g => g.genre === song.genre)
  if (lane) lane.entries.push({ song, index })
  else BY_GENRE.push({ genre: song.genre, entries: [{ song, index }] })
})

export default function Songs() {
  const [songIdx, setSongIdx] = useState(0)
  const [shape, setShape] = useState<CagedShape | null>(null)

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

  const outlineRange = shape ? getCagedFretRange(resolved.root, shape) : null

  const controls = (
    <>
      <LabeledField label="Song">
        <SelectInput
          fullWidth
          value={songIdx}
          onChange={(e) => { setSongIdx(Number(e.target.value)); setShape(null) }}
        >
          {BY_GENRE.map(({ genre, entries }) => (
            <optgroup key={genre} label={genre}>
              {entries.map(({ song: s, index }) => (
                <option key={s.title} value={index}>{s.title} — {s.artist}</option>
              ))}
            </optgroup>
          ))}
        </SelectInput>
      </LabeledField>

      {/* Read-only: the song sets its own key and mode. */}
      <div className="space-y-1">
        <ControlLabel>Key</ControlLabel>
        <p className="font-mono text-sm text-stone-300">
          {resolved.root} {resolved.scale.name}
        </p>
        <p className="text-[11px] text-stone-500">{song.genre}</p>
      </div>
    </>
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

      <Fretboard
        markers={markers}
        outline={outlineRange && shape ? { fretRange: outlineRange, label: shape } : undefined}
      />

      <FretboardLegend rootNote={resolved.root} />

      {/* CAGED shapes as an orientation aid — tapping the active one clears it. */}
      <div className="flex gap-2 items-start" role="group" aria-label="Highlight a CAGED shape">
        {CAGED_SHAPES.map(s => {
          const [lo, hi] = getCagedFretRange(resolved.root, s)
          const isActive = shape === s
          return (
            <button
              key={s}
              onClick={() => setShape(isActive ? null : s)}
              aria-pressed={isActive}
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl border
                transition-all duration-150 active:scale-95
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terra-500
                focus-visible:ring-offset-1 focus-visible:ring-offset-stone-950
                ${isActive
                  ? 'bg-terra-500 border-terra-400 text-stone-200'
                  : 'bg-stone-800 border-stone-200/10 text-stone-400 hover:border-stone-200/20 hover:text-stone-200'
                }`}
            >
              <span className="font-mono font-bold text-base leading-none">{s}</span>
              <span className={`font-mono text-[10px] leading-none ${isActive ? 'text-terra-100' : 'text-stone-600'}`}>
                {lo}–{hi}
              </span>
            </button>
          )
        })}
      </div>

      <div className="bg-stone-800/60 border border-stone-200/10 rounded-xl p-5">
        <p className="text-stone-400 text-sm leading-relaxed">{song.note}</p>
      </div>
    </NeckPageLayout>
  )
}
