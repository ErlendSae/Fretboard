import { useState } from 'react'
import Fretboard, { type FretMarker } from '../components/Fretboard'
import { CHROMATIC_NOTES, type NoteName, NUM_STRINGS, NUM_FRETS, fretToNote, noteIndex } from '../utils/notes'
import { SCALES, getScaleNotes } from '../utils/scales'
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
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">

      {/* Header */}
      <div className="animate-fade-up">
        <h1 className="text-2xl font-bold text-stone-100 mb-1">Scale Explorer</h1>
        <p className="text-stone-500 text-sm">
          Select a root note and scale to see all positions on the neck.
        </p>
      </div>

      {/* Controls — all groups consolidated */}
      <div className="space-y-4 animate-fade-up">
        {/* Row 1: Root · Scale · Labels */}
        <div className="flex flex-wrap gap-x-8 gap-y-4 items-end">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-stone-500 font-semibold">Root Note</label>
            <div className="flex flex-wrap gap-2">
              {CHROMATIC_NOTES.map((note) => (
                <button
                  key={note}
                  onClick={() => setRoot(note)}
                  className={`w-10 h-10 rounded-lg text-sm font-semibold font-mono transition-all duration-150 border
                    ${root === note
                      ? 'bg-rose-500 text-white border-rose-400 shadow-rose-500/20 shadow-md'
                      : 'bg-stone-800 text-stone-400 border-stone-700 hover:border-stone-500 hover:text-stone-200'
                    }`}
                >
                  {note}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-stone-500 font-semibold">Scale</label>
            <select
              value={scaleIdx}
              onChange={(e) => setScaleIdx(Number(e.target.value))}
              className="bg-stone-800 border border-stone-700 text-stone-200 rounded-lg px-3 py-2
                text-sm focus:outline-none focus:border-stone-500 focus:ring-1 focus:ring-stone-500/40
                cursor-pointer min-w-52 transition-colors duration-150"
            >
              {SCALES.map((s, i) => (
                <option key={i} value={i}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-stone-500 font-semibold">Labels</label>
            <div className="flex rounded-lg overflow-hidden border border-stone-700 text-sm font-medium">
              {(['Notes', 'Degrees'] as const).map((opt, i) => (
                <button
                  key={opt}
                  onClick={() => setShowDegrees(i === 1)}
                  className={`px-3 py-2 transition-colors duration-150 ${
                    showDegrees === (i === 1)
                      ? 'bg-rose-500 text-white'
                      : 'bg-stone-800 text-stone-400 hover:text-stone-200'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Row 2: Position */}
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-widest text-stone-500 font-semibold">Position</label>
          <div className="flex gap-2 flex-wrap">
            {POSITIONS.map((pos, i) => (
              <button
                key={pos.label}
                onClick={() => setPositionIdx(i)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 border
                  ${positionIdx === i
                    ? 'bg-rose-500 text-white border-rose-400'
                    : 'bg-stone-800 text-stone-400 border-stone-700 hover:border-stone-500 hover:text-stone-200'
                  }`}
              >
                {pos.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Backing track */}
      <div className="animate-fade-up">
        <button
          onClick={toggle}
          className={`flex items-center gap-2.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 border
            ${isPlaying
              ? 'bg-rose-500 text-white border-rose-400 shadow-rose-500/20 shadow-md'
              : 'bg-stone-800 text-stone-400 border-stone-700 hover:border-stone-500 hover:text-stone-200'
            }`}
        >
          <span className="text-base leading-none">{isPlaying ? '■' : '▶'}</span>
          <span>{isPlaying ? 'Stop' : 'Play'} Backing Track</span>
          <span className={`text-xs font-mono ${isPlaying ? 'text-rose-200' : 'text-stone-600'}`}>
            {bpm} BPM
          </span>
        </button>
      </div>

      {/* Fretboard — the hero */}
      <Fretboard markers={markers} />

      {/* Legend + note chips — tight grouping below the neck */}
      <div className="flex flex-wrap gap-x-10 gap-y-4 items-start">
        <div className="flex items-center gap-5 text-sm text-stone-400 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-stone-100 ring-1 ring-stone-400/40 shadow-sm" />
            <span>Root ({root})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-violet-300 ring-1 ring-violet-200/40" />
            <span>Chord tone</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-rose-300 ring-1 ring-rose-200/40" />
            <span>Scale tone</span>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="text-xs text-stone-600 font-medium tracking-wide">{root} {scale.name}</div>
          <div className="flex flex-wrap gap-1.5">
            {[...scaleNotes].map((note) => (
              <span
                key={note}
                className={`px-2 py-0.5 rounded text-xs font-mono font-semibold
                  ${note === root
                    ? 'bg-stone-200/15 text-stone-200 ring-1 ring-stone-400/40'
                    : chordToneNotes.has(note)
                      ? 'bg-violet-300/15 text-violet-300 ring-1 ring-violet-300/30'
                      : 'bg-stone-700 text-stone-400 ring-1 ring-stone-600'
                  }`}
              >
                {note}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Scale info — supplementary context below the fretboard */}
      <div className="bg-stone-800/60 border border-stone-700/60 rounded-xl px-5 py-4 space-y-2">
        <p className="text-stone-300 text-sm leading-relaxed">{scale.description}</p>
        <div className="flex flex-wrap gap-1.5">
          {scale.genres.map(g => (
            <span key={g} className="px-2 py-0.5 rounded text-xs font-medium bg-stone-700 text-stone-400">{g}</span>
          ))}
        </div>
      </div>

    </div>
  )
}
