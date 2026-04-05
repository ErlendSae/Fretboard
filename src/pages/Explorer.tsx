import { useState } from 'react'
import Fretboard, { type FretMarker } from '../components/Fretboard'
import { CHROMATIC_NOTES, type NoteName, NUM_STRINGS, NUM_FRETS, fretToNote, noteIndex } from '../utils/notes'
import { SCALES, getScaleNotes } from '../utils/scales'

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
  const scaleNotes = getScaleNotes(root, scale)
  const rootIdx = noteIndex(root)

  // Chord tones = 1st, 3rd, 5th scale degrees — always highlighted
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
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      <div className="animate-fade-up">
        <h1 className="text-2xl font-bold text-stone-100 mb-1">Scale Explorer</h1>
        <p className="text-stone-500 text-sm">
          Select a root note and scale to see all positions on the neck.
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-6 items-end animate-fade-up">
        {/* Root note */}
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-widest text-stone-500 font-semibold">Root Note</label>
          <div className="flex flex-wrap gap-2">
            {CHROMATIC_NOTES.map((note) => (
              <button
                key={note}
                onClick={() => setRoot(note)}
                className={`w-10 h-10 rounded-lg text-sm font-semibold font-mono transition-all duration-150 border
                  ${root === note
                    ? 'bg-stone-200 text-stone-900 border-stone-200 shadow-md'
                    : 'bg-stone-800 text-stone-400 border-stone-700 hover:border-stone-500 hover:text-stone-200'
                  }`}
              >
                {note}
              </button>
            ))}
          </div>
        </div>

        {/* Scale */}
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

      </div>

      {/* Scale info */}
      <div className="bg-stone-800/60 border border-stone-700/60 rounded-xl px-5 py-4 animate-fade-up space-y-2">
        <p className="text-stone-300 text-sm leading-relaxed">{scale.description}</p>
        <div className="flex flex-wrap gap-1.5">
          {scale.genres.map(g => (
            <span key={g} className="px-2 py-0.5 rounded text-xs font-medium bg-stone-700 text-stone-400">{g}</span>
          ))}
        </div>
      </div>

      {/* Display options */}
      <div className="flex flex-wrap gap-6 items-end animate-fade-up">
        {/* Labels */}
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-widest text-stone-500 font-semibold">Labels</label>
          <div className="flex rounded-lg overflow-hidden border border-stone-700 text-sm font-medium">
            {(['Notes', 'Degrees'] as const).map((opt, i) => (
              <button
                key={opt}
                onClick={() => setShowDegrees(i === 1)}
                className={`px-3 py-2 transition-colors duration-150 ${
                  showDegrees === (i === 1)
                    ? 'bg-stone-200 text-stone-900'
                    : 'bg-stone-800 text-stone-400 hover:text-stone-200'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Position filter */}
      <div className="space-y-2 animate-fade-up">
        <label className="text-xs uppercase tracking-widest text-stone-500 font-semibold">Position</label>
        <div className="flex gap-2 flex-wrap">
          {POSITIONS.map((pos, i) => (
            <button
              key={pos.label}
              onClick={() => setPositionIdx(i)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 border
                ${positionIdx === i
                  ? 'bg-stone-200 text-stone-900 border-stone-200'
                  : 'bg-stone-800 text-stone-400 border-stone-700 hover:border-stone-500 hover:text-stone-200'
                }`}
            >
              {pos.label}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-5 text-sm text-stone-400 flex-wrap animate-fade-up">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-stone-100 ring-1 ring-stone-400/40 shadow-sm" />
          <span>Root ({root})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-amber-300 ring-1 ring-amber-100/40" />
          <span>Chord tone</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-teal-400 ring-1 ring-teal-200/40" />
          <span>Scale tone</span>
        </div>
      </div>

      {/* Scale name + note chips */}
      <div className="space-y-2">
        <div className="text-lg font-semibold text-stone-200">{root} {scale.name}</div>
        <div className="flex flex-wrap gap-1.5">
          {[...scaleNotes].map((note) => (
            <span
              key={note}
              className={`px-2 py-0.5 rounded text-xs font-mono font-semibold
                ${note === root
                  ? 'bg-stone-200/15 text-stone-200 ring-1 ring-stone-400/40'
                  : chordToneNotes.has(note)
                    ? 'bg-amber-300/15 text-amber-300 ring-1 ring-amber-300/30'
                    : 'bg-stone-800 text-stone-400 ring-1 ring-stone-700'
                }`}
            >
              {note}
            </span>
          ))}
        </div>
      </div>

      <Fretboard markers={markers} />
    </div>
  )
}
