import { useState, useCallback, useEffect, useRef } from 'react'
import Fretboard, { type FretMarker } from '../components/Fretboard'
import { CHROMATIC_NOTES, type NoteName, NUM_STRINGS, NUM_FRETS, fretToNote, noteIndex } from '../utils/notes'
import { SCALES } from '../utils/scales'
import { getDiatonicChords, isMinorTonality, PROGRESSION_PRESETS, type DiatonicChord, type ChordQuality } from '../utils/chords'
import { playNote } from '../utils/audio'
import { genreColorClass } from '../utils/genreColors'

// ─── Chord playback ───────────────────────────────────────────────────────────

function strumChord(notes: readonly NoteName[]): void {
  const midiNotes: number[] = [noteIndex(notes[0]!) + 36]
  let cursor = noteIndex(notes[0]!) + 48
  for (const note of notes) {
    let midi = noteIndex(note) + 48
    while (midi < cursor) midi += 12
    midiNotes.push(midi)
    cursor = midi
  }
  midiNotes.forEach((midi, i) => {
    setTimeout(() => playNote(midi, 2.0), i * 35)
  })
}

// ─── Quality styling ──────────────────────────────────────────────────────────

const QUALITY_ACTIVE: Record<ChordQuality, string> = {
  major:      'bg-stone-100/10 border-stone-300/40 text-stone-100',
  minor:      'bg-violet-500/15 border-violet-400/40 text-violet-200',
  diminished: 'bg-rose-500/15 border-rose-400/40 text-rose-200',
  augmented:  'bg-amber-500/15 border-amber-400/40 text-amber-200',
}

const QUALITY_ROMAN: Record<ChordQuality, string> = {
  major:      'text-stone-500',
  minor:      'text-violet-400',
  diminished: 'text-rose-400',
  augmented:  'text-amber-400',
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function Progressions() {
  const [root, setRoot] = useState<NoteName>('C')
  const [scaleIdx, setScaleIdx] = useState(
    SCALES.findIndex(s => s.intervals.length === 7)
  )
  const [selectedDegree, setSelectedDegree] = useState<number | null>(0)
  const [activePreset, setActivePreset] = useState<number | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  const playTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const scale = SCALES[scaleIdx]!
  const chords = getDiatonicChords(root, scale)
  const tonality = chords ? (isMinorTonality(scale) ? 'minor' : 'major') : null
  const presets = PROGRESSION_PRESETS.filter(p => p.tonality === tonality)

  const activeChordDegrees: Set<number> = activePreset !== null && presets[activePreset]
    ? new Set(presets[activePreset]!.degrees)
    : new Set()

  // ── Playback ──────────────────────────────────────────────────────────────

  const stopPlayback = useCallback(() => {
    if (playTimerRef.current) clearInterval(playTimerRef.current)
    playTimerRef.current = null
    setIsPlaying(false)
  }, [])

  const startPlayback = useCallback(() => {
    if (!chords || activePreset === null || !presets[activePreset]) return
    stopPlayback()

    const degrees = [...presets[activePreset]!.degrees]
    const chordsSnap = [...chords]
    let step = 0

    const playStep = (s: number) => {
      const degree = degrees[s]!
      setSelectedDegree(degree)
      const chord = chordsSnap[degree]
      if (chord) strumChord(chord.notes)
    }

    playStep(0)
    setIsPlaying(true)

    playTimerRef.current = setInterval(() => {
      step = (step + 1) % degrees.length
      playStep(step)
    }, 2000)
  }, [chords, activePreset, presets, stopPlayback])

  useEffect(() => { stopPlayback() }, [root, scaleIdx, stopPlayback])
  useEffect(() => () => stopPlayback(), [stopPlayback])

  // ── Interactions ──────────────────────────────────────────────────────────

  function selectChord(chord: DiatonicChord) {
    if (isPlaying) stopPlayback()
    setSelectedDegree(prev => prev === chord.degree ? null : chord.degree)
    strumChord(chord.notes)
  }

  function activatePreset(idx: number) {
    stopPlayback()
    const next = activePreset === idx ? null : idx
    setActivePreset(next)
    if (next !== null && chords && presets[next]) {
      const firstDegree = presets[next]!.degrees[0]!
      setSelectedDegree(firstDegree)
      const firstChord = chords[firstDegree]
      if (firstChord) strumChord(firstChord.notes)
    }
  }

  // ── Fretboard markers ─────────────────────────────────────────────────────

  const markers: FretMarker[] = (() => {
    if (!chords || selectedDegree === null) return []
    const chord = chords[selectedDegree]
    if (!chord) return []
    const [chordRoot, third, fifth] = chord.notes
    const list: FretMarker[] = []
    for (let s = 0; s < NUM_STRINGS; s++) {
      for (let f = 0; f <= NUM_FRETS; f++) {
        const note = fretToNote(s, f)
        if (note === chordRoot) list.push({ stringIndex: s, fret: f, variant: 'root' })
        else if (note === third) list.push({ stringIndex: s, fret: f, variant: 'chord' })
        else if (note === fifth) list.push({ stringIndex: s, fret: f, variant: 'scale' })
      }
    }
    return list
  })()

  const selectedChord = chords && selectedDegree !== null ? chords[selectedDegree] : null
  const currentPreset = activePreset !== null ? presets[activePreset] : null

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">

      {/* Header — tight to controls, they're closely related */}
      <div className="animate-fade-up mb-5">
        <h1 className="text-2xl font-bold text-stone-100">
          Chord Progressions{' '}
          <span className="font-normal text-stone-400">{root} {scale.name}</span>
        </h1>
        <p className="text-stone-500 text-sm mt-1">
          Every scale produces 7 chords — one built on each note. These always fit together.
        </p>
      </div>

      {/* Controls — generous gap before the hero fretboard area */}
      <div className="flex flex-wrap gap-6 items-end animate-fade-up mb-10">
        <div className="space-y-2">
          <label className="text-[11px] font-medium text-stone-400">Root</label>
          <div className="flex flex-wrap gap-2">
            {CHROMATIC_NOTES.map((note) => (
              <button
                key={note}
                onClick={() => { setRoot(note); setSelectedDegree(0) }}
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
          <label className="text-[11px] font-medium text-stone-400">Scale</label>
          <select
            value={scaleIdx}
            onChange={(e) => {
              setScaleIdx(Number(e.target.value))
              setSelectedDegree(0)
              setActivePreset(null)
            }}
            className="bg-stone-800 border border-stone-700 text-stone-200 rounded-lg px-3 py-2
              text-sm focus:outline-none focus:border-stone-500 focus:ring-1 focus:ring-stone-500/40
              cursor-pointer min-w-52 transition-colors duration-150"
          >
            {SCALES.map((s, i) => s.intervals.length === 7 && (
              <option key={i} value={i}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Two-column main area ───────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row gap-8 items-start animate-fade-up">

        {/* Left: Fretboard + educational content */}
        <div className="flex-1 min-w-0 space-y-4">

          {/* Fretboard legend */}
          <div className="flex items-center gap-5 text-xs text-stone-400 flex-wrap">
            {selectedChord ? (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-stone-100 ring-1 ring-stone-400/40 shrink-0" />
                  <span>Root ({selectedChord.notes[0]})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-violet-300 ring-1 ring-violet-200/40 shrink-0" />
                  <span>Third ({selectedChord.notes[1]})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-rose-300 ring-1 ring-rose-200/40 shrink-0" />
                  <span>Fifth ({selectedChord.notes[2]})</span>
                </div>
                <span className="text-stone-700">·</span>
                <span className="font-mono font-semibold text-stone-300">{selectedChord.name}</span>
                <span className="text-stone-600 capitalize">{selectedChord.quality}</span>
              </>
            ) : (
              <span className="text-stone-700">Click a chord to see its notes on the neck</span>
            )}
          </div>

          <Fretboard markers={markers} />

          {/* Educational content — lives below the fretboard, fills the left column */}
          <div className="mt-6 space-y-3 border-t border-stone-800 pt-6">
            <p className="text-[11px] font-medium text-stone-500">How diatonic chords work</p>
            <div className="space-y-2 text-stone-500 text-sm leading-relaxed">
              <p>
                Stack the 1st, 3rd, and 5th scale notes above any root — that's a triad.
                Do it on all 7 notes and you get the <span className="text-stone-400">diatonic chord family</span>.
                Every chord is built from the same pool of notes, so they always fit.
              </p>
              <p>
                <span className="font-mono text-stone-400">I – IV – V</span> in C is{' '}
                <span className="font-mono text-stone-400">C – F – G</span>.
                In G it's <span className="font-mono text-stone-400">G – C – D</span>.
                Different key, same function — same feel.
              </p>
              <p>
                Uppercase = major · lowercase = minor · <span className="font-mono">°</span> = diminished.
                The Roman numeral tells you the chord's <em>role</em>, not its letter name.
              </p>
            </div>
          </div>
        </div>

        {/* Right: Compact control panel */}
        {chords && (
          <div className="w-full lg:w-52 shrink-0 space-y-5">

            {/* Chord family */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-stone-400">Chords in key</label>
              <div className="space-y-1">
                {chords.map((chord) => {
                  const isActive = selectedDegree === chord.degree
                  const isInPreset = activeChordDegrees.has(chord.degree)
                  const isDimmed = activePreset !== null && !isInPreset && !isActive
                  return (
                    <button
                      key={chord.degree}
                      onClick={() => selectChord(chord)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border text-left transition-all duration-150
                        ${isActive
                          ? QUALITY_ACTIVE[chord.quality]
                          : isDimmed
                            ? 'border-transparent opacity-30'
                            : isInPreset
                              ? 'bg-stone-800 border-stone-600'
                              : 'border-transparent hover:border-stone-700 hover:bg-stone-800/60'
                        }`}
                    >
                      <span className={`font-mono text-[11px] w-7 shrink-0 ${isActive ? 'opacity-60' : QUALITY_ROMAN[chord.quality]}`}>
                        {chord.roman}
                      </span>
                      <span className={`font-mono font-bold text-sm flex-1 ${isActive ? '' : 'text-stone-300'}`}>
                        {chord.name}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-stone-800" />

            {/* Progressions */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-medium text-stone-400">Progressions</label>
                {activePreset !== null && (
                  <button
                    onClick={isPlaying ? stopPlayback : startPlayback}
                    className={`text-xs font-medium px-2 py-1 rounded-md border transition-all duration-150
                      ${isPlaying
                        ? 'bg-rose-500 text-white border-rose-400'
                        : 'bg-stone-800 text-stone-400 border-stone-700 hover:border-stone-500 hover:text-stone-200'
                      }`}
                  >
                    {isPlaying ? '◼ Stop' : '▶ Play'}
                  </button>
                )}
              </div>

              <div className="space-y-1">
                {presets.map((preset, i) => {
                  const presetChords = preset.degrees.map(d => chords[d]).filter(Boolean) as DiatonicChord[]
                  const isActive = activePreset === i
                  return (
                    <button
                      key={preset.label}
                      onClick={() => activatePreset(i)}
                      className={`w-full text-left px-3 py-2 rounded-lg border transition-all duration-150
                        ${isActive
                          ? 'bg-rose-500/10 border-rose-500/40'
                          : 'border-transparent hover:border-stone-700 hover:bg-stone-800/60'
                        }`}
                    >
                      <div className="flex items-baseline gap-2">
                        <span className="font-mono text-xs font-semibold text-stone-300 shrink-0">
                          {preset.label}
                        </span>
                        <span className="font-mono text-[10px] text-stone-600 truncate">
                          {presetChords.map(c => c.name).join('–')}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Active preset detail — left-border accent, no nested card */}
              {currentPreset && (
                <div className="mt-3 pl-3 border-l-2 border-stone-700 space-y-2">
                  {isPlaying && (
                    <div className="flex gap-2">
                      {currentPreset.degrees.map((d, si) => (
                        <span
                          key={si}
                          className={`font-mono text-xs font-bold transition-colors duration-150 ${
                            d === selectedDegree ? 'text-rose-300' : 'text-stone-700'
                          }`}
                        >
                          {chords[d]?.name}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="text-[11px] text-stone-500 leading-relaxed">
                    {currentPreset.description}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {currentPreset.genres.map(g => (
                      <span key={g} className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${genreColorClass(g)}`}>
                        {g}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>
        )}
      </div>

    </div>
  )
}
