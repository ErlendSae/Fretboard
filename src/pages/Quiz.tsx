import { useState, useEffect, useRef, useCallback } from 'react'
import Fretboard, { type FretMarker } from '../components/Fretboard'
import {
  NUM_STRINGS, NUM_FRETS,
  fretToMidi, fretToNote, midiToNote,
  type NoteName,
} from '../utils/notes'
import { playNote } from '../utils/audio'
import {
  detectPitch, freqToMidi, midiSemitoneDist,
} from '../utils/pitchDetection'

// ─── Types ────────────────────────────────────────────────────────────────────

type Phase = 'idle' | 'target' | 'listening' | 'result'

interface Target {
  stringIndex: number
  fret: number
  midi: number
  note: NoteName
}

interface Result {
  detectedNote: NoteName | null
  detectedMidi: number | null
  semitoneDistance: number | null
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function randomTarget(): Target {
  const s = Math.floor(Math.random() * NUM_STRINGS)
  const f = Math.floor(Math.random() * (NUM_FRETS + 1))
  const midi = fretToMidi(s, f)
  return { stringIndex: s, fret: f, midi, note: fretToNote(s, f) }
}

function notePositions(note: NoteName, variant: FretMarker['variant']): FretMarker[] {
  const markers: FretMarker[] = []
  for (let s = 0; s < NUM_STRINGS; s++) {
    for (let f = 0; f <= NUM_FRETS; f++) {
      if (fretToNote(s, f) === note) {
        markers.push({ stringIndex: s, fret: f, variant })
      }
    }
  }
  return markers
}

function distLabel(dist: number | null): string {
  if (dist === null) return 'No pitch detected'
  if (dist === 0) return 'Correct!'
  if (dist === 1) return '1 semitone off'
  return `${dist} semitones off`
}

// ─── Component ───────────────────────────────────────────────────────────────

const LISTEN_SECS = 5

export default function Quiz() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [target, setTarget] = useState<Target>(() => randomTarget())
  const [result, setResult] = useState<Result | null>(null)
  const [stats, setStats] = useState({ total: 0, correct: 0 })
  const [listenProgress, setListenProgress] = useState(0)

  const streamRef = useRef<MediaStream | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const pitchPollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const collectedMidis = useRef<number[]>([])
  const listenStartRef = useRef<number>(0)
  const progressRafRef = useRef<number | null>(null)

  const stopMic = useCallback(() => {
    if (pitchPollRef.current) clearInterval(pitchPollRef.current)
    if (progressRafRef.current) cancelAnimationFrame(progressRafRef.current)
    sourceRef.current?.disconnect()
    sourceRef.current = null
    analyserRef.current?.disconnect()
    analyserRef.current = null
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }, [])

  const finishListening = useCallback((target: Target) => {
    stopMic()

    const midis = collectedMidis.current
    if (midis.length === 0) {
      setResult({ detectedNote: null, detectedMidi: null, semitoneDistance: null })
      setStats((s) => ({ total: s.total + 1, correct: s.correct }))
    } else {
      const buckets = new Map<number, number>()
      for (const m of midis) {
        const pc = ((m % 12) + 12) % 12
        buckets.set(pc, (buckets.get(pc) ?? 0) + 1)
      }
      const bestPc = [...buckets.entries()].sort((a, b) => b[1] - a[1])[0]![0]
      const bucket = midis.filter((m) => ((m % 12) + 12) % 12 === bestPc).sort((a, b) => a - b)
      const medianMidi = bucket[Math.floor(bucket.length / 2)]!
      const detectedNote = midiToNote(medianMidi)
      const dist = midiSemitoneDist(medianMidi, target.midi)

      setResult({ detectedNote, detectedMidi: medianMidi, semitoneDistance: dist })
      setStats((s) => ({
        total: s.total + 1,
        correct: s.correct + (dist === 0 ? 1 : 0),
      }))
    }
    setPhase('result')
  }, [stopMic])

  const startListening = useCallback(async (target: Target) => {
    collectedMidis.current = []
    listenStartRef.current = performance.now()
    setListenProgress(0)
    setPhase('listening')

    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
    } catch {
      setResult({ detectedNote: null, detectedMidi: null, semitoneDistance: null })
      setStats((s) => ({ total: s.total + 1, correct: s.correct }))
      setPhase('result')
      return
    }
    streamRef.current = stream

    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      audioCtxRef.current = new AudioContext()
    } else if (audioCtxRef.current.state === 'suspended') {
      await audioCtxRef.current.resume()
    }
    const ctx = audioCtxRef.current

    const source = ctx.createMediaStreamSource(stream)
    sourceRef.current = source
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 4096
    analyser.smoothingTimeConstant = 0
    source.connect(analyser)
    analyserRef.current = analyser

    const buffer = new Float32Array(analyser.fftSize)

    const tickProgress = () => {
      const elapsed = (performance.now() - listenStartRef.current) / 1000
      setListenProgress(Math.min(elapsed / LISTEN_SECS, 1))
      if (elapsed < LISTEN_SECS) {
        progressRafRef.current = requestAnimationFrame(tickProgress)
      }
    }
    progressRafRef.current = requestAnimationFrame(tickProgress)

    pitchPollRef.current = setInterval(() => {
      analyser.getFloatTimeDomainData(buffer)
      const freq = detectPitch(buffer, ctx.sampleRate)
      if (freq !== null) {
        collectedMidis.current.push(freqToMidi(freq))
      }

      const elapsed = (performance.now() - listenStartRef.current) / 1000
      if (elapsed >= LISTEN_SECS) {
        clearInterval(pitchPollRef.current!)
        finishListening(target)
      }
    }, 80)
  }, [finishListening])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'Space' && e.code !== 'Enter') return
      if (e.target instanceof HTMLButtonElement || e.target instanceof HTMLSelectElement) return
      e.preventDefault()
      if (phase === 'idle') startRound()
      else if (phase === 'target') startListening(target)
      else if (phase === 'result') startRound()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, target])

  const startRound = useCallback(() => {
    const t = randomTarget()
    setTarget(t)
    setResult(null)
    setPhase('target')
  }, [])

  const hearNote = useCallback(() => playNote(target.midi), [target])

  useEffect(() => {
    return () => {
      stopMic()
      audioCtxRef.current?.close()
    }
  }, [stopMic])

  const accuracy = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : null

  const resultMarkers: FretMarker[] = (() => {
    if (phase !== 'result') return []
    const dist = result?.semitoneDistance ?? null
    if (dist === null || result?.detectedNote === null) {
      return notePositions(target.note, 'target')
    }
    if (dist === 0) {
      return notePositions(target.note, 'correct')
    }
    const targetMarkers = notePositions(target.note, 'target')
    const detectedMarkers = notePositions(result!.detectedNote!, 'far')
    const targetKeys = new Set(targetMarkers.map((m) => `${m.stringIndex}-${m.fret}`))
    return [
      ...targetMarkers,
      ...detectedMarkers.filter((m) => !targetKeys.has(`${m.stringIndex}-${m.fret}`)),
    ]
  })()

  const resultDist = result?.semitoneDistance ?? null
  const resultColor =
    resultDist === null ? 'border-stone-600 bg-stone-800/60 text-stone-300'
    : resultDist === 0  ? 'border-emerald-700/60 bg-emerald-900/30 text-emerald-300'
    : resultDist <= 2   ? 'border-yellow-700/60 bg-yellow-900/30 text-yellow-300'
    : 'border-red-800/60 bg-red-900/30 text-red-300'

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div className="animate-fade-up">
        <h1 className="text-2xl font-bold text-stone-100 mb-1">Note Quiz</h1>
        <p className="text-stone-500 text-sm">
          Find the note on your guitar and play it — the mic will check your answer.
        </p>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-3 text-sm flex-wrap animate-fade-up">
        <div className="bg-stone-800 border border-stone-700 rounded-lg px-4 py-2 flex gap-4">
          <span className="text-stone-400">
            Attempts: <span className="text-stone-100 font-semibold">{stats.total}</span>
          </span>
          <span className="text-stone-400">
            Correct:{' '}
            <span className="text-emerald-400 font-semibold">{stats.correct}</span>
          </span>
          {accuracy !== null && (
            <span className="text-stone-400">
              Accuracy:{' '}
              <span
                className={`font-semibold ${
                  accuracy >= 80 ? 'text-emerald-400'
                  : accuracy >= 50 ? 'text-yellow-400'
                  : 'text-red-400'
                }`}
              >
                {accuracy}%
              </span>
            </span>
          )}
        </div>
        {stats.total > 0 && (
          <button
            onClick={() => setStats({ total: 0, correct: 0 })}
            className="text-xs text-stone-600 hover:text-stone-400 transition-colors duration-150 px-2 py-1"
          >
            Reset stats
          </button>
        )}
      </div>

      {/* Main phase card */}
      <div className="bg-stone-800 border border-stone-700 rounded-2xl p-8 flex flex-col items-center gap-6 min-h-56">

        {/* IDLE */}
        {phase === 'idle' && (
          <div className="flex flex-col items-center gap-6 animate-fade-up">
            <p className="text-stone-400 text-center leading-relaxed">
              Press <strong className="text-stone-200">Start</strong> to get a note.
              <br />
              Find it on your guitar, then hit <strong className="text-stone-200">Check</strong>.
            </p>
            <button
              onClick={startRound}
              className="bg-stone-200 hover:bg-stone-100 active:scale-95 text-stone-900
                font-bold px-8 py-3 rounded-xl text-lg transition-all duration-150 shadow-lg"
            >
              Start
            </button>
            <p className="text-xs text-stone-600">Space / Enter to start</p>
          </div>
        )}

        {/* TARGET */}
        {phase === 'target' && (
          <div className="flex flex-col items-center gap-5 animate-fade-up">
            <p className="text-stone-500 text-xs uppercase tracking-widest">Find this note</p>
            <div className="text-8xl font-black text-stone-100 leading-none tracking-tight font-mono">
              {target.note}
            </div>
            <div className="flex items-center gap-3 mt-1">
              <button
                onClick={hearNote}
                className="flex items-center gap-1.5 text-stone-500 hover:text-stone-300
                  text-sm transition-colors duration-150 px-3 py-1.5 rounded-lg border border-stone-600
                  hover:border-stone-500"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Hear it
              </button>
              <button
                onClick={() => startListening(target)}
                className="bg-stone-200 hover:bg-stone-100 active:scale-95 text-stone-900
                  font-bold px-6 py-2 rounded-xl transition-all duration-150 shadow-lg"
              >
                Check →
              </button>
            </div>
            <p className="text-xs text-stone-600">Space / Enter to check</p>
          </div>
        )}

        {/* LISTENING */}
        {phase === 'listening' && (
          <div className="flex flex-col items-center gap-5 animate-fade-up">
            <p className="text-stone-500 text-xs uppercase tracking-widest">Listening for</p>
            <div className="text-8xl font-black text-stone-600 leading-none tracking-tight font-mono">
              {target.note}
            </div>
            <div className="flex items-center gap-2 text-stone-500 text-sm -mt-1">
              <span className="inline-block w-2 h-2 rounded-full bg-teal-400 animate-mic-pulse" />
              Mic active…
            </div>
            <div className="w-64 h-2 bg-stone-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-stone-300 rounded-full"
                style={{ width: `${listenProgress * 100}%`, transition: 'none' }}
              />
            </div>
            <p className="text-xs text-stone-600">
              {Math.ceil(LISTEN_SECS - listenProgress * LISTEN_SECS)}s remaining
            </p>
          </div>
        )}

        {/* RESULT */}
        {phase === 'result' && result && (
          <div className="flex flex-col items-center gap-5 w-full animate-fade-up">
            <div className={`w-full rounded-xl border px-5 py-4 space-y-2 ${resultColor}`}>
              <p className="text-lg font-bold">{distLabel(resultDist)}</p>
              <div className="text-sm space-y-1">
                <p>
                  Target:{' '}
                  <strong className="text-stone-100 text-base font-mono">{target.note}</strong>
                </p>
                {result.detectedNote && (
                  <p>
                    You played:{' '}
                    <strong className="text-stone-200 text-base font-mono">{result.detectedNote}</strong>
                  </p>
                )}
                {result.detectedNote === null && (
                  <p className="text-stone-500 text-xs">
                    No pitch detected — check mic permissions or play louder.
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={hearNote}
                className="flex items-center gap-2 bg-stone-700 hover:bg-stone-600
                  active:scale-95 text-stone-200 font-medium px-4 py-2 rounded-lg transition-all duration-150 text-sm border border-stone-600"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Hear {target.note}
              </button>
              <button
                onClick={startRound}
                className="bg-stone-200 hover:bg-stone-100 active:scale-95 text-stone-900
                  font-bold px-5 py-2 rounded-lg transition-all duration-150 text-sm shadow-lg"
              >
                Next note
              </button>
            </div>
            <p className="text-xs text-stone-600">Space / Enter for next note</p>
          </div>
        )}
      </div>

      {/* Fretboard */}
      {(phase === 'listening' || phase === 'result') && (
        <div className="space-y-3 animate-fade-up">
          {phase === 'result' && (
            <div className="flex items-center gap-4 text-xs text-stone-500">
              <p>
                All positions of{' '}
                <span className="text-stone-200 font-semibold font-mono">{target.note}</span>:
              </p>
              {result?.detectedNote && result.detectedNote !== target.note && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-indigo-400" />
                    <span>Target ({target.note})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <span>Detected ({result.detectedNote})</span>
                  </div>
                </div>
              )}
            </div>
          )}
          {phase === 'listening' && (
            <p className="text-xs text-stone-600">Reference fretboard — find the note and play it</p>
          )}
          <Fretboard markers={resultMarkers} />
        </div>
      )}
    </div>
  )
}
