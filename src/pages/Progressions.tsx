import { useState, useCallback, useEffect, useRef } from 'react'
import Fretboard, { type FretMarker } from '../components/Fretboard'
import {
  ControlLabel,
  ControlPanel,
  PageWrapper,
  SectionHeader,
  SelectInput,
} from '../components/ui'
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

// This page only ever renders diatonic triads, so the seventh-chord entries
// reuse their parent triad's styling. Superseded by the Songs page.
const QUALITY_ACTIVE: Record<ChordQuality, string> = {
  major:      'bg-stone-200/10 border-stone-200/30 text-stone-200',
  minor:      'bg-plum-500/15 border-plum-400/40 text-plum-200',
  diminished: 'bg-terra-500/15 border-terra-400/40 text-terra-200',
  augmented:  'bg-sun-500/15 border-sun-400/40 text-sun-200',
  dominant7:  'bg-stone-200/10 border-stone-200/30 text-stone-200',
  major7:     'bg-stone-200/10 border-stone-200/30 text-stone-200',
  minor7:     'bg-plum-500/15 border-plum-400/40 text-plum-200',
  minor7b5:   'bg-terra-500/15 border-terra-400/40 text-terra-200',
}

const QUALITY_ROMAN: Record<ChordQuality, string> = {
  major:      'text-stone-500',
  minor:      'text-plum-400',
  diminished: 'text-terra-400',
  augmented:  'text-sun-400',
  dominant7:  'text-stone-500',
  major7:     'text-stone-500',
  minor7:     'text-plum-400',
  minor7b5:   'text-terra-400',
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
    ? new Set(presets[activePreset]!.chords.map(c => c.degree))
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

    // One step per chord, not per bar — this page teaches chord order, not song form.
    const degrees = presets[activePreset]!.chords.map(c => c.degree)
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
      const firstDegree = presets[next]!.chords[0]!.degree
      setSelectedDegree(firstDegree)
      const firstChord = chords[firstDegree]
      if (firstChord) strumChord(firstChord.notes)
    }
  }

  // ── Fretboard markers ─────────────────────────────────────────────────────

  const selectedChord = chords && selectedDegree !== null ? chords[selectedDegree] : null

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

  const currentPreset = activePreset !== null ? presets[activePreset] : null

  return (
    <PageWrapper>

      {/* Header */}
      <SectionHeader
        title={<>Progressions{' '}<span className="font-normal text-terra-400">{root}</span><span className="font-normal text-stone-400"> {scale.name}</span></>}
        subtitle="Every scale has 7 chords — one built on each note. They all share the same notes, so they always sound right together."
      />

      {/* Controls */}
      <ControlPanel>
        <div className="space-y-2">
          <ControlLabel htmlFor="progressions-key">Key</ControlLabel>
          <SelectInput
            id="progressions-key"
            value={root}
            onChange={(e) => { setRoot(e.target.value as NoteName); setSelectedDegree(0) }}
          >
            {CHROMATIC_NOTES.map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </SelectInput>
        </div>

        <div className="space-y-2">
          <ControlLabel htmlFor="progressions-scale">Scale</ControlLabel>
          <SelectInput
            id="progressions-scale"
            value={scaleIdx}
            onChange={(e) => {
              setScaleIdx(Number(e.target.value))
              setSelectedDegree(0)
              setActivePreset(null)
            }}
          >
            {SCALES.map((s, i) => s.intervals.length === 7 && (
              <option key={i} value={i}>{s.name}</option>
            ))}
          </SelectInput>
        </div>
      </ControlPanel>

      {/* ── Two-column main area ───────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row gap-8 items-start animate-fade-up">

        {/* Left: Fretboard */}
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
                  <div className="w-4 h-4 rounded-full bg-sun-400 ring-1 ring-sun-200/40 shrink-0" />
                  <span>Third ({selectedChord.notes[1]})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-terra-300 ring-1 ring-terra-200/40 shrink-0" />
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
        </div>

        {/* Right: Chord list + progressions */}
        {chords && (
          <div className="w-full md:w-52 shrink-0 max-w-xs mx-auto md:mx-0 space-y-5">

            {/* Chord family */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-stone-500 tracking-[0.08em] uppercase">Chords in key</label>
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

            <div className="border-t border-stone-800" />

            {/* Progressions */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-stone-500 tracking-[0.08em] uppercase">Progressions</label>
                {activePreset !== null && (
                  <button
                    onClick={isPlaying ? stopPlayback : startPlayback}
                    aria-label={isPlaying ? 'Stop progression playback' : 'Play progression'}
                    aria-pressed={isPlaying}
                    className={`text-xs font-medium px-3 py-1.5 rounded-md border transition-all duration-150
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terra-500
                      focus-visible:ring-offset-2 focus-visible:ring-offset-stone-950
                      ${isPlaying
                        ? 'bg-terra-500 text-stone-200 border-terra-400'
                        : 'bg-stone-800 text-stone-400 border-stone-200/10 hover:border-stone-200/20 hover:text-stone-200'
                      }`}
                  >
                    <span aria-hidden="true">{isPlaying ? '◼ Stop' : '▶ Play'}</span>
                  </button>
                )}
              </div>

              <div className="space-y-1">
                {presets.map((preset, i) => {
                  const presetChords = preset.chords.map(c => chords[c.degree]).filter(Boolean) as DiatonicChord[]
                  const isActive = activePreset === i
                  return (
                    <button
                      key={preset.label}
                      onClick={() => activatePreset(i)}
                      className={`w-full text-left px-3 py-2 rounded-lg border transition-all duration-150
                        ${isActive
                          ? 'bg-terra-500/10 border-terra-500/40'
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

              {/* Active preset detail */}
              {currentPreset && (
                <div className="mt-3 pl-3 border-l-2 border-stone-700 space-y-2">
                  {isPlaying && (
                    <div className="flex gap-2">
                      {currentPreset.chords.map(({ degree: d }, si) => (
                        <span
                          key={si}
                          className={`font-mono text-xs font-bold transition-colors duration-150 ${
                            d === selectedDegree ? 'text-terra-300' : 'text-stone-700'
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

    </PageWrapper>
  )
}
