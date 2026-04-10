import { useState, useCallback, useEffect, useRef } from 'react'
import Fretboard, { type FretMarker } from '../components/Fretboard'
import RootPicker from '../components/RootPicker'
import {
  type NoteName,
  NUM_STRINGS, NUM_FRETS,
  fretToNote,
} from '../utils/notes'
import { SCALES, getScaleNotes } from '../utils/scales'
import { genreColorClass } from '../utils/genreColors'

type Phase = 'question' | 'revealed'

interface QuizTarget {
  stringIndex: number
  fret: number
  note: NoteName
}

function randomTarget(): QuizTarget {
  const s = Math.floor(Math.random() * NUM_STRINGS)
  const f = Math.floor(Math.random() * (NUM_FRETS + 1))
  return { stringIndex: s, fret: f, note: fretToNote(s, f) }
}

export default function ScaleQuiz() {
  const [root, setRoot] = useState<NoteName>('G')
  const [scaleIdx, setScaleIdx] = useState(0)
  const [target, setTarget] = useState<QuizTarget>(randomTarget)
  const [phase, setPhase] = useState<Phase>('question')
  const [wasCorrect, setWasCorrect] = useState(false)
  const [stats, setStats] = useState({ total: 0, correct: 0 })
  const [canUndo, setCanUndo] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  const undoStatsRef = useRef<{ total: number; correct: number } | null>(null)
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const keepGoingRef = useRef<HTMLButtonElement>(null)

  const scale = SCALES[scaleIdx]!
  const scaleNotes = getScaleNotes(root, scale)

  // Reset to a fresh question when root/scale changes mid-round
  useEffect(() => {
    setTarget(randomTarget())
    setPhase('question')
    setCanUndo(false)
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current)
  }, [root, scaleIdx])

  useEffect(() => {
    return () => { if (undoTimerRef.current) clearTimeout(undoTimerRef.current) }
  }, [])

  const handleAnswer = useCallback((answer: boolean) => {
    const isInScale = scaleNotes.has(target.note)
    const correct = answer === isInScale
    setWasCorrect(correct)
    setStats(s => {
      undoStatsRef.current = s
      const newTotal = s.total + 1
      if (newTotal % 10 === 0) setShowSummary(true)
      return { total: newTotal, correct: s.correct + (correct ? 1 : 0) }
    })
    setPhase('revealed')
    setCanUndo(true)
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current)
    undoTimerRef.current = setTimeout(() => setCanUndo(false), 8000)
  }, [target, scaleNotes])

  const handleUndo = useCallback(() => {
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current)
    setCanUndo(false)
    if (undoStatsRef.current) setStats(undoStatsRef.current)
    setPhase('question')
  }, [])

  const nextQuestion = useCallback(() => {
    setTarget(randomTarget())
    setPhase('question')
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLButtonElement || e.target instanceof HTMLSelectElement) return
      if (phase === 'question') {
        if (e.code === 'KeyY') handleAnswer(true)
        if (e.code === 'KeyN') handleAnswer(false)
      } else if (phase === 'revealed') {
        if (e.code === 'Space' || e.code === 'Enter') {
          e.preventDefault()
          nextQuestion()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, handleAnswer, nextQuestion])

  // Build fretboard markers
  const markers: FretMarker[] = (() => {
    const targetKey = `${target.stringIndex}-${target.fret}`
    const isInScale = scaleNotes.has(target.note)

    if (phase === 'question') {
      return [{ stringIndex: target.stringIndex, fret: target.fret, variant: 'target' }]
    }

    // Revealed: full scale overlay + result for the target position
    const list: FretMarker[] = []
    for (let s = 0; s < NUM_STRINGS; s++) {
      for (let f = 0; f <= NUM_FRETS; f++) {
        const note = fretToNote(s, f)
        if (!scaleNotes.has(note)) continue
        if (`${s}-${f}` === targetKey) continue
        list.push({ stringIndex: s, fret: f, variant: note === root ? 'root' : 'scale' })
      }
    }
    list.push({
      stringIndex: target.stringIndex,
      fret: target.fret,
      variant: isInScale ? 'correct' : 'far',
    })
    return list
  })()

  useEffect(() => { if (showSummary) keepGoingRef.current?.focus() }, [showSummary])

  const accuracy = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : null
  const isInScale = scaleNotes.has(target.note)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">

      {/* Header */}
      <div className="animate-fade-up">
        <h1 className="text-2xl font-bold text-stone-100 mb-1">Scale Quiz</h1>
        <p className="text-stone-500 text-sm">
          A note lights up on the neck — decide if it belongs in your chosen key.
        </p>
      </div>

      {/* Key + Scale controls */}
      <div className="flex flex-wrap gap-6 items-start sm:items-end animate-fade-up">
        <div className="space-y-2">
          <label className="text-[11px] font-medium text-stone-400 tracking-wide">Key</label>
          <RootPicker value={root} onChange={setRoot} />
        </div>
        <div className="space-y-2">
          <label className="text-[11px] font-medium text-stone-400 tracking-wide">Scale</label>
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

      {/* Fretboard + legend — the hero, now above the question card */}
      <div className="space-y-3 animate-fade-up">
        {phase === 'question' && (
          <div className="flex items-center gap-3 text-xs text-stone-500">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-full bg-sky-400" />
              <span>Question note</span>
            </div>
            <span className="text-stone-700">·</span>
            <span>In {root} {scale.name}?</span>
          </div>
        )}
        {phase === 'revealed' && (
          <div className="flex items-center gap-3 text-xs text-stone-500 flex-wrap">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-full bg-stone-100" />
              <span>Root</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-full bg-rose-300" />
              <span>In scale</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded-full ${isInScale ? 'bg-emerald-400' : 'bg-red-400'}`} />
              <span>Tested note ({target.note})</span>
            </div>
          </div>
        )}
        <Fretboard markers={markers} />
      </div>

      {/* Question / Result card — now below the fretboard */}
      <div className="bg-stone-800 border border-stone-700 rounded-2xl p-8 flex flex-col items-center gap-5 min-h-48 animate-fade-up">
        {phase === 'question' && (
          <div className="flex flex-col items-center gap-5 animate-fade-up">
            <p className="text-xs text-stone-400 font-medium">Is this note in the scale?</p>
            <div className="text-center">
              <span className="text-4xl font-black text-stone-100 font-mono tracking-tight">{target.note}</span>
              <span className="text-stone-500 text-lg ml-3">in <span className="text-rose-400">{root}</span> {scale.name}?</span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => handleAnswer(true)}
                className="bg-rose-500 hover:bg-rose-400 active:scale-95 text-white
                  font-bold px-8 py-2.5 rounded-xl transition-all duration-150 shadow-lg shadow-rose-500/20"
              >
                Yes
              </button>
              <button
                onClick={() => handleAnswer(false)}
                className="bg-stone-700 hover:bg-stone-600 active:scale-95 text-stone-200
                  font-bold px-8 py-2.5 rounded-xl transition-all duration-150 border border-stone-600"
              >
                No
              </button>
            </div>
            <p className="text-xs text-stone-500">Y — yes · N — no</p>
          </div>
        )}

        {phase === 'revealed' && (
          <div className="flex flex-col items-center gap-5 w-full animate-fade-up">
            <div className={`w-full rounded-xl border px-5 py-4 space-y-2 ${
              wasCorrect
                ? 'border-emerald-700/60 bg-emerald-900/30 text-emerald-300'
                : 'border-red-800/60 bg-red-900/30 text-red-300'
            }`}>
              <p className="text-lg font-bold">{wasCorrect ? 'Correct!' : 'Not this time!'}</p>
              <p className="text-sm">
                <span className="font-mono font-bold text-stone-100">{target.note}</span>
                {' '}{isInScale ? 'is' : 'is not'} in <span className="text-rose-400">{root}</span> {scale.name}.
                {isInScale && target.note === root && ' (It\'s the root!)'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {canUndo && (
                <div className="flex flex-col items-center gap-1">
                  <button
                    onClick={handleUndo}
                    className="animate-fade-up text-sm text-stone-500 hover:text-stone-300 transition-colors duration-150 px-3 py-2 rounded-lg border border-stone-700 hover:border-stone-500"
                  >
                    Undo
                  </button>
                  <div className="w-20 h-0.5 bg-stone-700 rounded-full overflow-hidden">
                    <div className="h-full bg-stone-500 rounded-full" style={{ animation: 'undoShrink 8s linear forwards' }} />
                  </div>
                  <style>{`@keyframes undoShrink { from { width: 100% } to { width: 0% } }`}</style>
                </div>
              )}
              <button
                onClick={nextQuestion}
                className="bg-rose-500 hover:bg-rose-400 active:scale-95 text-white
                  font-bold px-6 py-2 rounded-xl transition-all duration-150 shadow-lg shadow-rose-500/20"
              >
                Next note
              </button>
            </div>
            <p className="text-xs text-stone-500">Space · Enter — next note</p>
          </div>
        )}
      </div>

      {/* Stats — shown only once there's data */}
      {stats.total > 0 && (
        <div className="flex items-center gap-3 text-sm flex-wrap animate-fade-up">
          <div className="bg-stone-800 border border-stone-700 rounded-lg px-4 py-2 flex flex-wrap gap-x-4 gap-y-1 tabular-nums">
            <span className="text-stone-400">
              Attempts: <span className="text-stone-100 font-semibold">{stats.total}</span>
            </span>
            <span className="text-stone-400">
              Correct: <span className="text-emerald-400 font-semibold">{stats.correct}</span>
            </span>
            {accuracy !== null && (
              <span className="text-stone-400">
                Accuracy:{' '}
                <span className={`font-semibold ${
                  accuracy >= 80 ? 'text-emerald-400' : accuracy >= 50 ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {accuracy}%
                </span>
              </span>
            )}
          </div>
          <button
            onClick={() => setStats({ total: 0, correct: 0 })}
            className="text-xs text-stone-600 hover:text-stone-400 transition-colors duration-150 px-2 py-1"
          >
            Reset
          </button>
        </div>
      )}

      {/* Scale info — supplementary context at the bottom */}
      <div className="bg-stone-800/60 border border-stone-700/60 rounded-xl px-5 py-4 space-y-2">
        <p className="text-stone-300 text-[0.9375rem] leading-relaxed">{scale.description}</p>
        <div className="flex flex-wrap gap-1.5">
          {scale.genres.map(g => (
            <span key={g} className={`px-2 py-0.5 rounded text-xs font-medium ${genreColorClass(g)}`}>{g}</span>
          ))}
        </div>
      </div>

      {/* Session summary modal */}
      {showSummary && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/80 backdrop-blur-sm"
          onClick={() => setShowSummary(false)}
          onKeyDown={(e) => { if (e.key === 'Escape') setShowSummary(false) }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="summary-title"
            className="bg-stone-800 border border-stone-700 rounded-2xl p-8 flex flex-col items-center gap-5 w-80 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p id="summary-title" className="text-[11px] font-medium text-stone-400 tracking-wide">Session checkpoint</p>
            <p className="text-5xl font-black text-stone-100 tabular-nums">{accuracy}%</p>
            <div className="w-full bg-stone-700 rounded-lg px-4 py-3 flex justify-around tabular-nums text-sm">
              <span className="text-stone-400">Correct: <span className="text-emerald-400 font-semibold">{stats.correct}</span></span>
              <span className="text-stone-400">Total: <span className="text-stone-100 font-semibold">{stats.total}</span></span>
            </div>
            <button
              ref={keepGoingRef}
              onClick={() => setShowSummary(false)}
              className="bg-rose-500 hover:bg-rose-400 active:scale-95 text-white
                font-bold px-6 py-2.5 rounded-xl transition-all duration-150 shadow-lg shadow-rose-500/20"
            >
              Keep going
            </button>
          </div>
        </div>
      )}

    </div>
  )
}
