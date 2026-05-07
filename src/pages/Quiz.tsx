import { useState, useEffect, useRef, useCallback } from 'react'
import Fretboard, { type FretMarker } from '../components/Fretboard'
import {
  GhostButton,
  PageWrapper,
  PhaseCard,
  PrimaryButton,
  SecondaryButton,
  SectionHeader,
  StatBadge,
} from '../components/ui'
import { getStats, recordSession } from '../lib/store'
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
  if (dist === null) return "Mic didn't catch it"
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
  const [stats, setStats] = useState(() => {
    const stored = getStats().noteTrainer
    return { total: 0, correct: 0, streak: 0, bestStreak: stored.bestStreak }
  })
  const [showSummary, setShowSummary] = useState(false)
  const [listenProgress, setListenProgress] = useState(0)
  const [micError, setMicError] = useState<'denied' | null>(null)

  const keepGoingRef = useRef<HTMLButtonElement>(null)
  const sessionStartedAtRef = useRef<string>(new Date().toISOString())
  const sessionRoundsRef = useRef<{ total: number; correct: number; bestStreak: number }>({ total: 0, correct: 0, bestStreak: 0 })
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
      setStats((s) => {
        const newTotal = s.total + 1
        sessionRoundsRef.current = { total: newTotal, correct: s.correct, bestStreak: s.bestStreak }
        if (newTotal % 10 === 0) setShowSummary(true)
        return { ...s, total: newTotal, streak: 0, bestStreak: s.bestStreak }
      })
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
      setStats((s) => {
        const isCorrect = dist === 0
        const newStreak = isCorrect ? s.streak + 1 : 0
        const newBest = Math.max(s.bestStreak, newStreak)
        const newTotal = s.total + 1
        const newCorrect = s.correct + (isCorrect ? 1 : 0)
        sessionRoundsRef.current = { total: newTotal, correct: newCorrect, bestStreak: newBest }
        if (newTotal % 10 === 0) setShowSummary(true)
        return { total: newTotal, correct: newCorrect, streak: newStreak, bestStreak: newBest }
      })
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
      setMicError('denied')
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

  const startRound = useCallback(() => {
    const t = randomTarget()
    setTarget(t)
    setResult(null)
    setMicError(null)
    setPhase('target')
  }, [])

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

  const hearNote = useCallback(() => playNote(target.midi), [target])

  useEffect(() => {
    return () => {
      stopMic()
      audioCtxRef.current?.close()
    }
  }, [stopMic])

  useEffect(() => { if (showSummary) keepGoingRef.current?.focus() }, [showSummary])

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
    resultDist === null ? 'border-stone-200/10 bg-stone-800/60 text-stone-300'
    : resultDist === 0  ? 'border-sage-700/60 bg-sage-900/30 text-sage-300'
    : resultDist <= 2   ? 'border-sun-700/60 bg-sun-900/30 text-sun-300'
    : 'border-brick-800/60 bg-brick-900/30 text-brick-300'

  return (
    <PageWrapper>
      {/* Header */}
      <SectionHeader
        title="Note Quiz"
        subtitle="Find the note on your guitar and play it — the mic will check your answer."
      />

      {/* Main phase card */}
      <PhaseCard>

        {/* IDLE */}
        {phase === 'idle' && (
          <div className="flex flex-col items-center gap-6 animate-fade-up">
            <p className="text-stone-400 text-center leading-relaxed">
              Press <strong className="text-stone-200">Start</strong> to get a note.
              <br />
              Find it on your guitar, then hit <strong className="text-stone-200">Check</strong>.
            </p>
            <PrimaryButton
              size="hero"
              onClick={startRound}
              className="text-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-stone-800"
            >
              Start
            </PrimaryButton>
            <p className="text-xs text-stone-500">Space · Enter — start</p>
          </div>
        )}

        {/* TARGET */}
        {phase === 'target' && (
          <div className="flex flex-col items-center gap-5 animate-fade-up">
            <p className="text-xs text-stone-400 font-medium">Find this note</p>
            <div className="text-8xl font-black text-stone-200 leading-none tracking-tight font-display">
              {target.note}
            </div>
            <div className="flex items-center gap-3 mt-1">
              <SecondaryButton
                ghost
                onClick={hearNote}
                aria-label={`Hear note ${target.note}`}
                className="flex items-center gap-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-800"
              >
                <svg aria-hidden="true" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Hear it
              </SecondaryButton>
              <PrimaryButton
                onClick={() => startListening(target)}
                className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-stone-800"
              >
                Check →
              </PrimaryButton>
            </div>
            <p className="text-xs text-stone-500">Space · Enter — check</p>
          </div>
        )}

        {/* LISTENING */}
        {phase === 'listening' && (
          <div className="flex flex-col items-center gap-5 animate-fade-up">
            <p className="text-xs text-stone-400 font-medium">Listening for</p>
            <div className="text-8xl font-black text-stone-600 leading-none tracking-tight font-display">
              {target.note}
            </div>
            <div aria-hidden="true" className="flex items-center gap-2 text-stone-500 text-sm -mt-1">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-terra-500 animate-mic-pulse" />
              Mic active…
            </div>
            <div
              role="progressbar"
              aria-label="Listening progress"
              aria-valuenow={Math.round(listenProgress * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
              className="w-64 h-2 bg-stone-700 rounded-full overflow-hidden"
            >
              <div
                className="h-full bg-terra-400 rounded-full"
                style={{ width: `${listenProgress * 100}%`, transition: 'none' }}
              />
            </div>
            <p className="text-xs text-stone-600">
              {Math.ceil(LISTEN_SECS - listenProgress * LISTEN_SECS)}s remaining
            </p>
          </div>
        )}

        {/* RESULT */}
        {phase === 'result' && (
          <div className="flex flex-col items-center gap-5 w-full animate-fade-up">
            {micError === 'denied' ? (
              <div className="w-full rounded-xl border border-stone-200/10 bg-stone-800/60 px-5 py-4 space-y-3 text-center">
                <p className="text-stone-200 font-semibold">Mic access was blocked</p>
                <p className="text-stone-400 text-sm">Check that your browser has microphone permission for this site, then try again.</p>
                <PrimaryButton
                  size="compact"
                  onClick={() => { setMicError(null); startListening(target) }}
                >
                  Try again
                </PrimaryButton>
              </div>
            ) : result && (
              <>
                <div className={`w-full rounded-xl border px-5 py-4 space-y-2 ${resultColor}`}>
                  <p className="text-lg font-bold">{distLabel(resultDist)}</p>
                  <div className="text-sm space-y-1">
                    <p>
                      Target:{' '}
                      <strong className="text-stone-200 text-base font-mono">{target.note}</strong>
                    </p>
                    {result.detectedNote && (
                      <p>
                        You played:{' '}
                        <strong className="text-stone-200 text-base font-mono">{result.detectedNote}</strong>
                      </p>
                    )}
                    {result.detectedNote === null && (
                      <div className="bg-stone-700/50 border border-stone-200/10 rounded-lg px-3 py-2">
                        <p className="text-stone-300 text-sm">Nothing detected — try playing louder, or check mic permissions.</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3">
                  <SecondaryButton
                    onClick={hearNote}
                    aria-label={`Hear note ${target.note}`}
                    className="flex items-center gap-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-800"
                  >
                    <svg aria-hidden="true" className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    Hear {target.note}
                  </SecondaryButton>
                  <PrimaryButton
                    size="compact"
                    onClick={startRound}
                    className="text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-stone-800"
                  >
                    Next note
                  </PrimaryButton>
                </div>
                <p className="text-xs text-stone-500">Space · Enter — next note</p>
              </>
            )}
          </div>
        )}
      </PhaseCard>

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
                    <div className="w-4 h-4 rounded-full bg-ember-400 ring-1 ring-ember-300/40" />
                    <span>Target ({target.note})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded-full bg-brick-400 ring-1 ring-brick-200/40" />
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

      {/* Stats — shown only once there's data */}
      {stats.total > 0 && (
        <div className="flex items-center gap-3 text-sm flex-wrap animate-fade-up">
          <StatBadge>
            <span className="text-stone-400">
              Attempts: <span className="text-stone-100 font-semibold">{stats.total}</span>
            </span>
            <span className="text-stone-400">
              Correct:{' '}
              <span className="text-sage-400 font-semibold">{stats.correct}</span>
            </span>
            {accuracy !== null && (
              <span className="text-stone-400">
                Accuracy:{' '}
                <span
                  className={`font-semibold ${
                    accuracy >= 80 ? 'text-sage-400'
                    : accuracy >= 50 ? 'text-sun-400'
                    : 'text-brick-400'
                  }`}
                >
                  {accuracy}%
                </span>
              </span>
            )}
            {stats.streak > 1 && (
              <span className="text-stone-400">
                Streak: <span className="text-terra-300 font-semibold">{stats.streak}</span>
              </span>
            )}
            {stats.bestStreak > 2 && (
              <span className="text-stone-400">
                Best: <span className="text-stone-100 font-semibold">{stats.bestStreak}</span>
              </span>
            )}
          </StatBadge>
          <GhostButton onClick={() => setStats({ total: 0, correct: 0, streak: 0, bestStreak: 0 })}>
            Reset
          </GhostButton>
        </div>
      )}

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
              <span className="text-stone-400">Correct: <span className="text-sage-400 font-semibold">{stats.correct}</span></span>
              <span className="text-stone-400">Total: <span className="text-stone-100 font-semibold">{stats.total}</span></span>
              {stats.bestStreak > 1 && (
                <span className="text-stone-400">Best: <span className="text-terra-300 font-semibold">{stats.bestStreak}</span></span>
              )}
            </div>
            <PrimaryButton
              ref={keepGoingRef}
              onClick={() => {
                const endedAt = new Date().toISOString()
                const sr = sessionRoundsRef.current
                recordSession({
                  page: 'noteTrainer',
                  startedAt: sessionStartedAtRef.current,
                  endedAt,
                  rounds: sr.total,
                  correct: sr.correct,
                  bestStreakInSession: sr.bestStreak,
                  config: {},
                })
                sessionStartedAtRef.current = new Date().toISOString()
                sessionRoundsRef.current = { total: 0, correct: 0, bestStreak: 0 }
                setShowSummary(false)
              }}
            >
              Keep going
            </PrimaryButton>
          </div>
        </div>
      )}
    </PageWrapper>
  )
}
