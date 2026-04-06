import { useState, useEffect, useCallback } from 'react'
import Fretboard, { type FretMarker } from '../components/Fretboard'
import {
  CHROMATIC_NOTES, type NoteName,
  NUM_STRINGS, NUM_FRETS,
  fretToNote, noteIndex,
} from '../utils/notes'

interface IntervalDef {
  label: string
  name: string
  semitones: number
  description: string
  usedIn: readonly string[]
}

const INTERVALS: readonly IntervalDef[] = [
  {
    label: 'b2',
    name: 'Minor 2nd',
    semitones: 1,
    description: 'One half-step — maximum tension. Creates strong dissonance and pull back to the root. The interval that makes horror music sound unsettling.',
    usedIn: ['Chromatic runs', 'Tension lines', 'Phrygian melody', 'Horror/dramatic themes'],
  },
  {
    label: '2nd',
    name: 'Major 2nd',
    semitones: 2,
    description: 'Two half-steps. A gentle, unresolved tension. Forms the basis of sus2 chords and the smooth stepwise motion in most melodies.',
    usedIn: ['Sus2 chords', 'Melody steps', 'Add9 chords', 'Country & folk licks'],
  },
  {
    label: 'b3',
    name: 'Minor 3rd',
    semitones: 3,
    description: 'Three half-steps. Defines minor quality — the darkening of a major chord. Essential in blues where it clashes expressively against major chord tones.',
    usedIn: ['Minor chords', 'Blues bends', 'Pentatonic minor', 'Power chord riffs'],
  },
  {
    label: '3rd',
    name: 'Major 3rd',
    semitones: 4,
    description: 'Four half-steps. Defines major quality — the interval that makes a chord sound bright and resolved. One of the most important intervals to know on the neck.',
    usedIn: ['Major chords', 'Double-stops', 'Country chicken-pickin\'', 'Chord inversions'],
  },
  {
    label: '4th',
    name: 'Perfect 4th',
    semitones: 5,
    description: 'Five half-steps. Open and stable — how standard guitar strings are tuned to each other (except B-G). The foundation of quartal harmony and sus4 chords.',
    usedIn: ['Sus4 chords', 'Power chord shapes', 'Quartal voicings', 'Bass lines'],
  },
  {
    label: '5th',
    name: 'Perfect 5th',
    semitones: 7,
    description: 'Seven half-steps. The strongest, most stable consonance after the octave. Present in every major and minor chord. Power chords are just root + 5th.',
    usedIn: ['Power chords', 'Every major/minor chord', 'Bass movement', 'Pedal point riffs'],
  },
  {
    label: '6th',
    name: 'Major 6th',
    semitones: 9,
    description: 'Nine half-steps. Warm and sweet — the characteristic sound of major 6th chords. Common in double-stop country and R&B leads, and in the melody of "My Way".',
    usedIn: ['Major 6th chords', 'Country double-stops', 'R&B melody', 'Add6 voicings'],
  },
  {
    label: 'b7',
    name: 'Minor 7th',
    semitones: 10,
    description: 'Ten half-steps. Dominant and bluesy — the note that makes a dominant 7th chord want to resolve. Defines Mixolydian and the sound of classic rock.',
    usedIn: ['Dominant 7th chords', 'Mixolydian riffs', 'Blues turnarounds', 'Funk grooves'],
  },
  {
    label: 'Oct',
    name: 'Octave',
    semitones: 12,
    description: 'Twelve half-steps. The same pitch class, one register higher. Pure consonance. Playing octaves gives you presence without harmonic commitment.',
    usedIn: ['Octave chords (Wes Montgomery)', 'Funk guitar', 'Melodic doubling', 'Soloing texture'],
  },
]

interface RootPos {
  stringIndex: number
  fret: number
}

type GuessResult = 'correct' | 'wrong'

function allPositionsOf(note: NoteName): Array<{ stringIndex: number; fret: number }> {
  const positions = []
  for (let s = 0; s < NUM_STRINGS; s++) {
    for (let f = 0; f <= NUM_FRETS; f++) {
      if (fretToNote(s, f) === note) positions.push({ stringIndex: s, fret: f })
    }
  }
  return positions
}

export default function Intervals() {
  const [intervalIdx, setIntervalIdx] = useState(4) // default: Perfect 5th
  const [quizMode, setQuizMode] = useState(false)
  const [rootPos, setRootPos] = useState<RootPos | null>(null)
  const [guessResults, setGuessResults] = useState<Map<string, GuessResult>>(new Map())
  const [revealed, setRevealed] = useState(false)

  const interval = INTERVALS[intervalIdx]!

  useEffect(() => {
    setRootPos(null)
    setGuessResults(new Map())
    setRevealed(false)
  }, [intervalIdx, quizMode])

  const rootNote = rootPos ? fretToNote(rootPos.stringIndex, rootPos.fret) : null
  const targetNote = rootNote
    ? CHROMATIC_NOTES[(noteIndex(rootNote) + interval.semitones) % 12]!
    : null

  const handleFretClick = useCallback((s: number, f: number) => {
    if (!rootPos) {
      setRootPos({ stringIndex: s, fret: f })
      return
    }

    if (!quizMode) {
      setRootPos({ stringIndex: s, fret: f })
      setGuessResults(new Map())
      setRevealed(false)
      return
    }

    if (s === rootPos.stringIndex && f === rootPos.fret) return

    const key = `${s}-${f}`
    if (guessResults.has(key)) return

    const isCorrect = targetNote !== null && fretToNote(s, f) === targetNote
    setGuessResults(prev => new Map(prev).set(key, isCorrect ? 'correct' : 'wrong'))
  }, [rootPos, quizMode, targetNote, guessResults])

  const markers: FretMarker[] = (() => {
    if (!rootPos) return []

    const rootKey = `${rootPos.stringIndex}-${rootPos.fret}`

    if (!quizMode) {
      const list: FretMarker[] = []
      if (targetNote) {
        for (const pos of allPositionsOf(targetNote)) {
          if (`${pos.stringIndex}-${pos.fret}` === rootKey) continue
          list.push({ stringIndex: pos.stringIndex, fret: pos.fret, variant: 'chord' })
        }
      }
      list.push({ stringIndex: rootPos.stringIndex, fret: rootPos.fret, variant: 'root' })
      return list
    }

    const list: FretMarker[] = []
    list.push({ stringIndex: rootPos.stringIndex, fret: rootPos.fret, variant: 'root' })

    for (const [key, result] of guessResults) {
      const [sStr, fStr] = key.split('-')
      list.push({
        stringIndex: Number(sStr),
        fret: Number(fStr),
        variant: result === 'correct' ? 'correct' : 'far',
      })
    }

    if (revealed && targetNote) {
      for (const pos of allPositionsOf(targetNote)) {
        const key = `${pos.stringIndex}-${pos.fret}`
        if (key === rootKey) continue
        if (guessResults.has(key)) continue
        list.push({ stringIndex: pos.stringIndex, fret: pos.fret, variant: 'target' })
      }
    }

    return list
  })()

  const targetPositions = targetNote
    ? allPositionsOf(targetNote).filter(p => `${p.stringIndex}-${p.fret}` !== (rootPos ? `${rootPos.stringIndex}-${rootPos.fret}` : ''))
    : []
  const correctGuesses = [...guessResults.values()].filter(r => r === 'correct').length
  const wrongGuesses = [...guessResults.values()].filter(r => r === 'wrong').length
  const totalTargets = targetPositions.length

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">

      {/* Header */}
      <div className="animate-fade-up">
        <h1 className="text-2xl font-bold text-stone-100 mb-1">Interval Trainer</h1>
        <p className="text-stone-500 text-sm">
          Click any fret to set the root, then see or find every occurrence of that interval on the neck.
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-6 items-end animate-fade-up">
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-widest text-stone-500 font-semibold">Interval</label>
          <div className="flex flex-wrap gap-2">
            {INTERVALS.map((iv, i) => (
              <button
                key={iv.label}
                onClick={() => setIntervalIdx(i)}
                title={iv.name}
                className={`px-3 py-2 rounded-lg text-sm font-semibold font-mono transition-all duration-150 border
                  ${intervalIdx === i
                    ? 'bg-rose-500 text-white border-rose-400 shadow-rose-500/20 shadow-md'
                    : 'bg-stone-800 text-stone-400 border-stone-700 hover:border-stone-500 hover:text-stone-200'
                  }`}
              >
                {iv.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs uppercase tracking-widest text-stone-500 font-semibold">Mode</label>
          <div className="flex rounded-lg overflow-hidden border border-stone-700 text-sm font-medium">
            {(['Study', 'Quiz'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setQuizMode(mode === 'Quiz')}
                className={`px-4 py-2 transition-colors duration-150 ${
                  quizMode === (mode === 'Quiz')
                    ? 'bg-rose-500 text-white'
                    : 'bg-stone-800 text-stone-400 hover:text-stone-200'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Status card — instruction or root/target display */}
      <div className="bg-stone-800 border border-stone-700 rounded-xl px-5 py-4 animate-fade-up">
        {!rootPos ? (
          <p className="text-stone-400 text-sm">
            Click any fret on the neck to set your root note.
          </p>
        ) : (
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            <span className="text-stone-400">
              Root: <span className="text-stone-100 font-semibold font-mono">{rootNote}</span>
            </span>
            <span className="text-stone-400">
              {interval.name}:{' '}
              <span className="text-rose-300 font-semibold font-mono">{targetNote}</span>
            </span>
            {quizMode && rootPos && (
              <span className="text-stone-400">
                Found: <span className="text-stone-100 font-semibold">{correctGuesses}/{totalTargets}</span>
                {wrongGuesses > 0 && (
                  <span className="text-red-400 ml-2">· {wrongGuesses} wrong</span>
                )}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Fretboard — the hero */}
      <Fretboard
        markers={markers}
        onFretClick={handleFretClick}
        clickableStrings
      />

      {/* Legend */}
      <div className="flex items-center gap-5 text-sm text-stone-400 flex-wrap animate-fade-up">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-stone-100 ring-1 ring-stone-400/40" />
          <span>Root</span>
        </div>
        {!quizMode && (
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-violet-300 ring-1 ring-violet-200/40" />
            <span>{interval.name} positions</span>
          </div>
        )}
        {quizMode && (
          <>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-emerald-400 ring-1 ring-emerald-200/40" />
              <span>Correct guess</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-red-400 ring-1 ring-red-200/40" />
              <span>Wrong guess</span>
            </div>
            {revealed && (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-sky-400 ring-1 ring-sky-200/40" />
                <span>Revealed</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Quiz controls */}
      {quizMode && rootPos && (
        <div className="flex items-center gap-3 animate-fade-up">
          {!revealed ? (
            <button
              onClick={() => setRevealed(true)}
              className="bg-stone-700 hover:bg-stone-600 text-stone-300 text-sm font-medium
                px-4 py-2 rounded-lg border border-stone-600 transition-all duration-150"
            >
              Reveal all
            </button>
          ) : (
            <span className="text-xs text-stone-500">All positions revealed</span>
          )}
          <button
            onClick={() => { setRootPos(null); setGuessResults(new Map()); setRevealed(false) }}
            className="text-xs text-stone-600 hover:text-stone-400 transition-colors duration-150 px-2 py-1"
          >
            Reset
          </button>
        </div>
      )}

      {/* Interval info — supplementary context below the fretboard */}
      <div className="bg-stone-800/60 border border-stone-700/60 rounded-xl px-5 py-4 space-y-2">
        <div className="flex items-baseline gap-3">
          <span className="text-stone-100 font-semibold">{interval.name}</span>
          <span className="text-stone-500 text-xs">{interval.semitones} semitone{interval.semitones !== 1 ? 's' : ''}</span>
        </div>
        <p className="text-stone-300 text-sm leading-relaxed">{interval.description}</p>
        <div className="flex flex-wrap gap-1.5">
          {interval.usedIn.map(u => (
            <span key={u} className="px-2 py-0.5 rounded text-xs font-medium bg-stone-700 text-stone-400">{u}</span>
          ))}
        </div>
      </div>

    </div>
  )
}
