import { useCallback, useEffect, useRef, useState } from 'react'
import * as Tone from 'tone'
import { CHROMATIC_NOTES, noteIndex } from '../utils/notes'
import type { NoteName } from '../utils/notes'
import type { ScaleDef } from '../utils/scales'

/** Build a Tone.js note string from root + semitone offset + octave. */
function noteAt(root: NoteName, semitones: number, octave: number): string {
  const total = noteIndex(root) + semitones
  return `${CHROMATIC_NOTES[total % 12]}${octave + Math.floor(total / 12)}`
}

/** Pick a practice BPM based on the scale's genres. */
function bpmForScale(scale: ScaleDef): number {
  if (scale.genres.some(g => g === 'Metal'))  return 100
  if (scale.genres.some(g => g === 'Jazz'))   return 108
  if (scale.genres.some(g => g === 'Blues'))  return 78
  return 85
}

export const BPM_MIN = 40
export const BPM_MAX = 200

// ── Sampled instruments (loaded once, reused forever) ────────────────────────
//
// The drum kit and piano are real recordings, so they're expensive to fetch
// and decode. We create each Sampler exactly once at module scope and never
// dispose it — starting/stopping the track only tears down the per-start
// effect chain and sequences, never the underlying samplers.

const PIANO_NOTES = [
  'A1', 'C2', 'D#2', 'F#2', 'A2', 'C3', 'D#3', 'F#3',
  'A3', 'C4', 'D#4', 'F#4', 'A4', 'C5', 'D#5', 'F#5', 'A5',
] as const

// Salamander file names swap "#" for "s" (e.g. "D#4" → "Ds4.mp3").
const PIANO_URLS: Record<string, string> = Object.fromEntries(
  PIANO_NOTES.map(note => [note, `${note.replace('#', 's')}.mp3`]),
)

interface Instruments {
  kick: Tone.Sampler
  snare: Tone.Sampler
  hihat: Tone.Sampler
  tom: Tone.Sampler
  piano: Tone.Sampler
}

let instruments: Instruments | null = null
let instrumentsLoading: Promise<Instruments> | null = null

function createInstruments(): Instruments {
  return {
    kick:  new Tone.Sampler({ urls: { C1: 'kick.mp3' },  baseUrl: '/samples/drums/' }),
    snare: new Tone.Sampler({ urls: { C1: 'snare.mp3' }, baseUrl: '/samples/drums/' }),
    hihat: new Tone.Sampler({ urls: { C1: 'hihat.mp3' }, baseUrl: '/samples/drums/' }),
    tom:   new Tone.Sampler({ urls: { C1: 'tom1.mp3' },  baseUrl: '/samples/drums/' }),
    piano: new Tone.Sampler({ urls: PIANO_URLS, baseUrl: '/samples/piano/', release: 1 }),
  }
}

/** Lazily create + load the sample instruments exactly once, however many times this is called. */
function getInstruments(): Promise<Instruments> {
  if (instruments) return Promise.resolve(instruments)
  if (!instrumentsLoading) {
    const created = createInstruments()
    instrumentsLoading = Tone.loaded().then(() => {
      instruments = created
      return created
    }).catch((err) => {
      // Clear the cached rejection so the next call retries from scratch.
      instrumentsLoading = null
      throw err
    })
  }
  return instrumentsLoading
}

interface TrackHandle {
  dispose: () => void
}

function startTrack(root: NoteName, scale: ScaleDef, kit: Instruments, bpm: number): TrackHandle {
  const transport = Tone.getTransport()
  transport.stop()
  transport.cancel(0)
  transport.position = 0
  transport.bpm.value = bpm

  // ── Master bus ───────────────────────────────────────────────────────────────
  const masterComp = new Tone.Compressor({
    threshold: -18, ratio: 4, attack: 0.003, release: 0.15,
  }).toDestination()

  // ── Drums (real kit, routed straight to the bus) ─────────────────────────────
  kit.kick.connect(masterComp)
  kit.kick.volume.value = 0
  kit.snare.connect(masterComp)
  kit.snare.volume.value = -2
  kit.hihat.connect(masterComp)
  kit.hihat.volume.value = -16
  kit.tom.connect(masterComp)
  kit.tom.volume.value = -8

  // ── Bass (sawtooth → drive → lowpass → master) ───────────────────────────────
  // Distortion trimmed back a touch so it sits under the real drums/piano.
  const bassLpf = new Tone.Filter({ frequency: 800, type: 'lowpass', rolloff: -24 }).connect(masterComp)
  const bassDrive = new Tone.Distortion(0.08).connect(bassLpf)
  const bass = new Tone.Synth({
    oscillator: { type: 'sawtooth' },
    envelope: { attack: 0.01, decay: 0.2, sustain: 0.5, release: 0.4 },
  }).connect(bassDrive)
  bass.volume.value = -4

  // ── Piano (sampled grand → light room verb → master) ─────────────────────────
  const pianoVerb = new Tone.Freeverb({ roomSize: 0.7, dampening: 3000, wet: 0.2 }).connect(masterComp)
  kit.piano.connect(pianoVerb)
  kit.piano.volume.value = -3

  // ── Scale-derived notes ──────────────────────────────────────────────────────
  const fifth   = scale.intervals[4] ?? 7
  const third   = scale.intervals[2] ?? 4
  const seventh = scale.intervals[6] ?? 10

  // 2-bar walking bass (quarter notes × 8)
  const bassLine: string[] = [
    noteAt(root, 0,       2),
    noteAt(root, fifth,   2),
    noteAt(root, 0,       2),
    noteAt(root, third,   2),
    noteAt(root, 0,       2),
    noteAt(root, fifth,   2),
    noteAt(root, seventh, 2),
    noteAt(root, fifth,   2),
  ]

  // Piano voicing: add 7th on scales that have one (gives jazz/full-band color).
  // Voiced around octave 3–4, where the sampled grand is strongest.
  const chord: string[] = [
    noteAt(root, 0,       3),
    noteAt(root, third,   3),
    noteAt(root, fifth,   3),
    ...(scale.intervals.length >= 7 ? [noteAt(root, seventh, 4)] : []),
  ]

  // ── Sequences ───────────────────────────────────────────────────────────────
  type S = string | null

  const triggerSnare = (time: number) => {
    const vel = 0.7 + Math.random() * 0.3
    kit.snare.triggerAttack('C1', time, vel)
  }

  // Kick: beats 1 and 3
  const kickSeq = new Tone.Sequence<S>(
    (time) => kit.kick.triggerAttack('C1', time),
    ['x', null, null, null, null, null, null, null, 'x', null, null, null, null, null, null, null],
    '16n',
  )

  // Snare: beats 2 and 4, with velocity humanization
  const snareSeq = new Tone.Sequence<S>(
    (time) => triggerSnare(time),
    [null, null, null, null, 'x', null, null, null, null, null, null, null, 'x', null, null, null],
    '16n',
  )

  // Hi-hat: every 8th note, with velocity humanization
  const hihatSeq = new Tone.Sequence<S>(
    (time) => kit.hihat.triggerAttack('C1', time, 0.25 + Math.random() * 0.35),
    ['x', null, 'x', null, 'x', null, 'x', null, 'x', null, 'x', null, 'x', null, 'x', null],
    '16n',
  )

  // Tom: a small two-note pickup fill on the last beat of the 2-bar loop
  const tomFill: S[] = new Array(32).fill(null)
  tomFill[28] = 'x'
  tomFill[30] = 'x'
  const tomSeq = new Tone.Sequence<S>(
    (time) => kit.tom.triggerAttack('C1', time, 0.3 + Math.random() * 0.15),
    tomFill,
    '16n',
  )

  // Bass: 2-bar walking line
  const bassSeq = new Tone.Sequence<string>(
    (time, note) => bass.triggerAttackRelease(note, '8n', time),
    bassLine,
    '4n',
  )

  // Piano: relaxed comping — chord held on beat 1, a shorter stab on the "and" of beat 2
  type PianoHit = 'chord' | 'stab' | null
  const pianoSeq = new Tone.Sequence<PianoHit>(
    (time, hit) => {
      if (hit === 'chord') {
        kit.piano.triggerAttackRelease(chord, '2n', time, 0.78 + Math.random() * 0.12)
      } else if (hit === 'stab') {
        kit.piano.triggerAttackRelease(chord, '8n', time, 0.55 + Math.random() * 0.15)
      }
    },
    ['chord', null, null, null, null, null, 'stab', null, null, null, null, null, null, null, null, null],
    '16n',
  )

  kickSeq.start(0)
  snareSeq.start(0)
  hihatSeq.start(0)
  tomSeq.start(0)
  bassSeq.start(0)
  pianoSeq.start(0)

  transport.start()

  return {
    dispose() {
      transport.stop()
      transport.cancel(0)
      kickSeq.dispose()
      snareSeq.dispose()
      hihatSeq.dispose()
      tomSeq.dispose()
      bassSeq.dispose()
      pianoSeq.dispose()

      // Detach the persistent samplers from this start's chain and cut any
      // ringing notes — but never dispose the samplers themselves.
      kit.kick.disconnect()
      kit.snare.disconnect()
      kit.hihat.disconnect()
      kit.tom.disconnect()
      kit.piano.disconnect()
      kit.kick.releaseAll()
      kit.snare.releaseAll()
      kit.hihat.releaseAll()
      kit.tom.releaseAll()
      kit.piano.releaseAll()

      bass.dispose()
      bassDrive.dispose()
      bassLpf.dispose()
      pianoVerb.dispose()
      masterComp.dispose()
    },
  }
}

export function useBackingTrack(root: NoteName, scale: ScaleDef) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [bpm, setBpmState] = useState(() => bpmForScale(scale))
  const trackRef = useRef<TrackHandle | null>(null)

  // Scale change resets tempo to the new genre default. Done as a render-time
  // adjustment (not an effect) so the restart effect below already sees the
  // fresh value when it fires.
  const [prevScale, setPrevScale] = useState(scale)
  if (scale !== prevScale) {
    setPrevScale(scale)
    setBpmState(bpmForScale(scale))
  }

  const setBpm = useCallback((next: number) => {
    const clamped = Math.min(BPM_MAX, Math.max(BPM_MIN, next))
    setBpmState(clamped)
    // Ramp instead of jump so a live tempo change sounds like the band
    // speeding up. Harmless when stopped — startTrack overwrites it.
    Tone.getTransport().bpm.rampTo(clamped, 0.2)
  }, [])

  const stop = useCallback(() => {
    trackRef.current?.dispose()
    trackRef.current = null
    setIsPlaying(false)
  }, [])

  const toggle = useCallback(async () => {
    if (isPlaying) { stop(); return }
    if (isLoading) return
    await Tone.start()
    setIsLoading(true)
    try {
      const kit = await getInstruments()
      trackRef.current?.dispose()
      trackRef.current = startTrack(root, scale, kit, bpm)
      setIsPlaying(true)
    } finally {
      setIsLoading(false)
    }
  }, [isPlaying, isLoading, root, scale, bpm, stop])

  // Restart seamlessly when root/scale changes while playing.
  // Safe to read `instruments` directly here — isPlaying can only be true
  // once toggle() has already awaited getInstruments(). `bpm` is read from
  // the closure, not the deps: a bpm change alone must NOT restart the
  // track (setBpm ramps the live transport instead), and on scale change
  // the render-time reset above guarantees this closure sees the new
  // genre default.
  useEffect(() => {
    if (!isPlaying || !instruments) return
    trackRef.current?.dispose()
    trackRef.current = startTrack(root, scale, instruments, bpm)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [root, scale])

  // Cleanup on unmount
  useEffect(() => () => { trackRef.current?.dispose() }, [])

  return { isPlaying, isLoading, toggle, bpm, setBpm, baseBpm: bpmForScale(scale) }
}
