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

  // ── Instruments ─────────────────────────────────────────────────────────────

  const kick = new Tone.MembraneSynth({
    pitchDecay: 0.05,
    octaves: 5,
    envelope: { attack: 0.001, decay: 0.3, sustain: 0, release: 0.1 },
  }).toDestination()
  kick.volume.value = 2

  const snare = new Tone.NoiseSynth({
    noise: { type: 'white' },
    envelope: { attack: 0.001, decay: 0.13, sustain: 0, release: 0.02 },
  }).toDestination()
  snare.volume.value = -8

  const hihat = new Tone.NoiseSynth({
    noise: { type: 'white' },
    envelope: { attack: 0.001, decay: 0.04, sustain: 0, release: 0.01 },
  }).toDestination()
  hihat.volume.value = -22

  const bass = new Tone.Synth({
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.02, decay: 0.3, sustain: 0.4, release: 0.5 },
  }).toDestination()
  bass.volume.value = -4

  const pad = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'sine' },
    envelope: { attack: 0.5, decay: 0.5, sustain: 0.8, release: 3 },
  }).toDestination()
  pad.volume.value = -18

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

  // Root-position triad (1, 3, 5)
  const chord: string[] = [
    noteAt(root, 0,     3),
    noteAt(root, third, 3),
    noteAt(root, fifth, 3),
  ]

  // ── Sequences ───────────────────────────────────────────────────────────────

  type S = string | null

  // Kick: beats 1 and 3
  const kickSeq = new Tone.Sequence<S>(
    (time) => kick.triggerAttackRelease('C1', '8n', time),
    ['x', null, null, null, null, null, null, null, 'x', null, null, null, null, null, null, null],
    '16n',
  )

  // Snare: beats 2 and 4
  const snareSeq = new Tone.Sequence<S>(
    (time) => snare.triggerAttackRelease('8n', time),
    [null, null, null, null, 'x', null, null, null, null, null, null, null, 'x', null, null, null],
    '16n',
  )

  // Hi-hat: every 8th note
  const hihatSeq = new Tone.Sequence<S>(
    (time) => hihat.triggerAttackRelease('16n', time),
    ['x', null, 'x', null, 'x', null, 'x', null, 'x', null, 'x', null, 'x', null, 'x', null],
    '16n',
  )

  // Bass: 2-bar walking line
  const bassSeq = new Tone.Sequence<string>(
    (time, note) => bass.triggerAttackRelease(note, '4n', time),
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
      snare.dispose()
      hihat.dispose()
      bass.dispose()
      pad.dispose()
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
