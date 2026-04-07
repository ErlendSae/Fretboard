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

interface TrackHandle {
  dispose: () => void
}

function startTrack(root: NoteName, scale: ScaleDef): TrackHandle {
  const transport = Tone.getTransport()
  transport.stop()
  transport.cancel(0)
  transport.position = 0
  transport.bpm.value = bpmForScale(scale)

  // ── Master bus ───────────────────────────────────────────────────────────────
  const masterComp = new Tone.Compressor({
    threshold: -18, ratio: 4, attack: 0.003, release: 0.15,
  }).toDestination()

  // ── Kick ─────────────────────────────────────────────────────────────────────
  // Subtle distortion adds a punchy click transient
  const kickDist = new Tone.Distortion(0.08).connect(masterComp)
  const kick = new Tone.MembraneSynth({
    pitchDecay: 0.07,
    octaves: 6,
    envelope: { attack: 0.001, decay: 0.45, sustain: 0, release: 0.1 },
  }).connect(kickDist)
  kick.volume.value = 4

  // ── Snare (layered: body + high-passed crack) ────────────────────────────────
  const snareBody = new Tone.NoiseSynth({
    noise: { type: 'white' },
    envelope: { attack: 0.001, decay: 0.12, sustain: 0, release: 0.03 },
  }).connect(masterComp)
  snareBody.volume.value = -7

  const snareHpf = new Tone.Filter({ frequency: 2500, type: 'highpass' }).connect(masterComp)
  const snareCrack = new Tone.NoiseSynth({
    noise: { type: 'white' },
    envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.01 },
  }).connect(snareHpf)
  snareCrack.volume.value = -11

  // ── Hi-hat (MetalSynth for authentic metallic tone) ──────────────────────────
  const hihat = new Tone.MetalSynth({
    envelope: { attack: 0.001, decay: 0.08, release: 0.01 },
    harmonicity: 5.1,
    modulationIndex: 32,
    resonance: 4000,
    octaves: 1.5,
  }).connect(masterComp)
  hihat.frequency.value = 400
  hihat.volume.value = -20

  // ── Bass (sawtooth → drive → lowpass → master) ───────────────────────────────
  const bassLpf = new Tone.Filter({ frequency: 800, type: 'lowpass', rolloff: -24 }).connect(masterComp)
  const bassDrive = new Tone.Distortion(0.12).connect(bassLpf)
  const bass = new Tone.Synth({
    oscillator: { type: 'sawtooth' },
    envelope: { attack: 0.01, decay: 0.2, sustain: 0.5, release: 0.4 },
  }).connect(bassDrive)
  bass.volume.value = -3

  // ── Pad (triangle PolySynth → chorus → Freeverb → master) ───────────────────
  const padVerb = new Tone.Freeverb({ roomSize: 0.75, dampening: 2500, wet: 0.35 }).connect(masterComp)
  const padChorus = new Tone.Chorus({ frequency: 3, delayTime: 2.5, depth: 0.5, wet: 0.4 }).connect(padVerb)
  padChorus.start()
  const pad = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.5, decay: 0.5, sustain: 0.8, release: 3 },
  }).connect(padChorus)
  pad.volume.value = -14

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

  // Pad voicing: add 7th on scales that have one (gives jazz/full-band color)
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
    snareBody.triggerAttackRelease('8n',  time, vel)
    snareCrack.triggerAttackRelease('16n', time, vel * 0.65)
  }

  // Kick: beats 1 and 3
  const kickSeq = new Tone.Sequence<S>(
    (time) => kick.triggerAttackRelease('C1', '8n', time),
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
    (time) => hihat.triggerAttackRelease('16n', time, 0.25 + Math.random() * 0.35),
    ['x', null, 'x', null, 'x', null, 'x', null, 'x', null, 'x', null, 'x', null, 'x', null],
    '16n',
  )

  // Bass: 2-bar walking line
  const bassSeq = new Tone.Sequence<string>(
    (time, note) => bass.triggerAttackRelease(note, '8n', time),
    bassLine,
    '4n',
  )

  // Pad: whole-note chord, once per bar
  const padSeq = new Tone.Sequence<S>(
    (time) => pad.triggerAttackRelease(chord, '1m', time),
    ['x'],
    '1m',
  )

  kickSeq.start(0)
  snareSeq.start(0)
  hihatSeq.start(0)
  bassSeq.start(0)
  padSeq.start(0)

  transport.start()

  return {
    dispose() {
      transport.stop()
      transport.cancel(0)
      kickSeq.dispose()
      snareSeq.dispose()
      hihatSeq.dispose()
      bassSeq.dispose()
      padSeq.dispose()
      kick.dispose()
      kickDist.dispose()
      snareBody.dispose()
      snareCrack.dispose()
      snareHpf.dispose()
      hihat.dispose()
      bass.dispose()
      bassDrive.dispose()
      bassLpf.dispose()
      pad.dispose()
      padChorus.dispose()
      padVerb.dispose()
      masterComp.dispose()
    },
  }
}

export function useBackingTrack(root: NoteName, scale: ScaleDef) {
  const [isPlaying, setIsPlaying] = useState(false)
  const trackRef = useRef<TrackHandle | null>(null)

  const stop = useCallback(() => {
    trackRef.current?.dispose()
    trackRef.current = null
    setIsPlaying(false)
  }, [])

  const toggle = useCallback(async () => {
    if (isPlaying) { stop(); return }
    await Tone.start()
    trackRef.current?.dispose()
    trackRef.current = startTrack(root, scale)
    setIsPlaying(true)
  }, [isPlaying, root, scale, stop])

  // Restart seamlessly when root/scale changes while playing
  useEffect(() => {
    if (!isPlaying) return
    trackRef.current?.dispose()
    trackRef.current = startTrack(root, scale)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [root, scale])

  // Cleanup on unmount
  useEffect(() => () => { trackRef.current?.dispose() }, [])

  return { isPlaying, toggle, bpm: bpmForScale(scale) }
}
