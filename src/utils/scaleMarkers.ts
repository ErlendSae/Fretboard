import {
  CHROMATIC_NOTES,
  NUM_STRINGS,
  NUM_FRETS,
  fretToNote,
  noteIndex,
  type NoteName,
} from './notes'
import { getScaleNotes, type ScaleDef } from './scales'
import type { FretMarker } from '../components/Fretboard'

/** Semitone offset from the root → scale-degree label. */
const DEGREE_LABELS: Record<number, string> = {
  0: '1', 1: 'b2', 2: '2', 3: 'b3', 4: '3', 5: '4',
  6: 'b5', 7: '5', 8: 'b6', 9: '6', 10: 'b7', 11: '7',
}

/** The 1–3–5 triad of the scale, as note names. */
function chordToneNotes(root: NoteName, scale: ScaleDef): Set<NoteName> {
  const rootIdx = noteIndex(root)
  const out = new Set<NoteName>()
  for (const degIdx of [0, 2, 4]) {
    const semitone = scale.intervals[degIdx]
    if (semitone !== undefined) out.add(CHROMATIC_NOTES[(rootIdx + semitone) % 12]!)
  }
  return out
}

export interface ScaleMarkerOptions {
  root: NoteName
  scale: ScaleDef
  /** Inclusive [low, high] fret window. Omit for the whole neck. */
  fretRange?: [number, number]
  /** Label markers with scale degrees ("b3") instead of note names. */
  showDegrees?: boolean
  /**
   * Notes to show even though they sit outside the scale — the borrowed chord
   * tones. The scale itself is untouched: nothing is muted and no marker moves,
   * so passing the current bar's colour note adds one dot rather than
   * repainting the shape.
   */
  outsideNotes?: ReadonlySet<NoteName>
}

/**
 * Every scale tone in the window, tagged root / chord tone / scale tone.
 * Pure — no React, no module state.
 */
export function buildScaleMarkers({
  root, scale, fretRange, showDegrees, outsideNotes,
}: ScaleMarkerOptions): FretMarker[] {
  const scaleNotes = getScaleNotes(root, scale)
  const chordTones = chordToneNotes(root, scale)
  const rootIdx = noteIndex(root)
  const [lo, hi] = fretRange ?? [0, NUM_FRETS]

  const markers: FretMarker[] = []
  for (let s = 0; s < NUM_STRINGS; s++) {
    for (let f = lo; f <= hi; f++) {
      const note = fretToNote(s, f)
      const inScale = scaleNotes.has(note)
      const isOutside = !inScale && (outsideNotes?.has(note) ?? false)
      if (!inScale && !isOutside) continue

      const interval = ((noteIndex(note) - rootIdx) + 12) % 12
      const variant: FretMarker['variant'] =
        isOutside ? 'outside'                   // borrowed chord tone — the colour note
        : note === root ? 'root'
        : chordTones.has(note) ? 'chord'
        : 'scale'

      markers.push({
        stringIndex: s,
        fret: f,
        variant,
        label: showDegrees ? DEGREE_LABELS[interval]! : undefined,
      })
    }
  }
  return markers
}
