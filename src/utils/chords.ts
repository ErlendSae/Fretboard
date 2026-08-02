import { CHROMATIC_NOTES, type NoteName, noteIndex } from './notes'
import type { ScaleDef } from './scales'

export type ChordQuality =
  | 'major' | 'minor' | 'diminished' | 'augmented'
  | 'dominant7' | 'minor7' | 'major7' | 'minor7b5'

export interface ChordSpec {
  /** 0-indexed scale degree. */
  degree: number
  /** Overrides the diatonic quality — for borrowed chords like the major V in a minor key. */
  quality?: ChordQuality
  /** How many bars this chord lasts. Defaults to 1. */
  bars?: number
}

/**
 * Semitones above the chord root. Two entries for triads, three for sevenths.
 * The single source of chord spelling — the audio layer imports this too.
 */
export const QUALITY_INTERVALS: Record<ChordQuality, readonly number[]> = {
  major:      [4, 7],
  minor:      [3, 7],
  diminished: [3, 6],
  augmented:  [4, 8],
  dominant7:  [4, 7, 10],
  minor7:     [3, 7, 10],
  major7:     [4, 7, 11],
  minor7b5:   [3, 6, 10],
}

/** Appended to the chord root to name it, e.g. "A" + "m7" = "Am7". */
const QUALITY_SUFFIX: Record<ChordQuality, string> = {
  major: '', minor: 'm', diminished: 'dim', augmented: 'aug',
  dominant7: '7', minor7: 'm7', major7: 'maj7', minor7b5: 'm7b5',
}

/** Major-family qualities take an uppercase Roman numeral. */
const IS_MAJOR_FAMILY: Record<ChordQuality, boolean> = {
  major: true, augmented: true, dominant7: true, major7: true,
  minor: false, diminished: false, minor7: false, minor7b5: false,
}

/** Appended to the Roman numeral, e.g. "V" + "7" = "V7". */
const ROMAN_SUFFIX: Record<ChordQuality, string> = {
  major: '', minor: '', diminished: '°', augmented: '+',
  dominant7: '7', minor7: '7', major7: 'maj7', minor7b5: 'ø7',
}

export interface DiatonicChord {
  degree: number
  roman: string
  root: NoteName
  quality: ChordQuality
  notes: readonly NoteName[]
  name: string
}

function chordQuality(thirdSemitones: number, fifthSemitones: number): ChordQuality {
  if (thirdSemitones === 4 && fifthSemitones === 7) return 'major'
  if (thirdSemitones === 3 && fifthSemitones === 7) return 'minor'
  if (thirdSemitones === 3 && fifthSemitones === 6) return 'diminished'
  if (thirdSemitones === 4 && fifthSemitones === 8) return 'augmented'
  return 'major'
}

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII']

/**
 * Returns the 7 diatonic triads for a given root + scale.
 * Returns null if the scale doesn't have exactly 7 notes.
 */
export function getDiatonicChords(root: NoteName, scale: ScaleDef): DiatonicChord[] | null {
  if (scale.intervals.length !== 7) return null

  const intervals = scale.intervals as readonly number[]
  const rootIdx = noteIndex(root)

  return intervals.map((semitones, degree) => {
    const chordRootIdx = (rootIdx + semitones) % 12
    const chordRoot = CHROMATIC_NOTES[chordRootIdx]!

    // Third = 2 scale steps up, Fifth = 4 scale steps up (octave-wrapped)
    const thirdSemitones = ((intervals[(degree + 2) % 7]! - semitones) + 12) % 12
    const fifthSemitones = ((intervals[(degree + 4) % 7]! - semitones) + 12) % 12

    const quality = chordQuality(thirdSemitones, fifthSemitones)

    const third = CHROMATIC_NOTES[(chordRootIdx + thirdSemitones) % 12]!
    const fifth = CHROMATIC_NOTES[(chordRootIdx + fifthSemitones) % 12]!

    const romanBase = IS_MAJOR_FAMILY[quality] ? ROMAN[degree]! : ROMAN[degree]!.toLowerCase()

    return {
      degree,
      roman: romanBase + ROMAN_SUFFIX[quality],
      root: chordRoot,
      quality,
      notes: [chordRoot, third, fifth] as const,
      name: chordRoot + QUALITY_SUFFIX[quality],
    }
  })
}

/**
 * The chord at `spec.degree`, respelled if `spec.quality` overrides the
 * diatonic quality. Returns null when the scale has no diatonic triads.
 */
export function resolveChord(
  root: NoteName, scale: ScaleDef, spec: ChordSpec,
): DiatonicChord | null {
  const diatonic = getDiatonicChords(root, scale)
  if (!diatonic) return null

  const base = diatonic[spec.degree]
  if (!base) return null
  if (!spec.quality || spec.quality === base.quality) return base

  // Overridden quality: keep the degree's root, respell everything above it.
  const chordRootIdx = noteIndex(base.root)
  const notes: NoteName[] = [
    base.root,
    ...QUALITY_INTERVALS[spec.quality].map(
      semis => CHROMATIC_NOTES[(chordRootIdx + semis) % 12]!,
    ),
  ]

  const romanBase = IS_MAJOR_FAMILY[spec.quality]
    ? ROMAN[spec.degree]!
    : ROMAN[spec.degree]!.toLowerCase()

  return {
    degree: spec.degree,
    roman: romanBase + ROMAN_SUFFIX[spec.quality],
    root: base.root,
    quality: spec.quality,
    notes,
    name: base.root + QUALITY_SUFFIX[spec.quality],
  }
}

/**
 * One resolved chord per bar — a spec with `bars: 4` yields four identical
 * entries, so callers can index straight by bar number.
 * Returns null if any chord fails to resolve.
 */
export function resolveProgression(
  root: NoteName, scale: ScaleDef, chords: readonly ChordSpec[],
): DiatonicChord[] | null {
  const out: DiatonicChord[] = []
  for (const spec of chords) {
    const chord = resolveChord(root, scale, spec)
    if (!chord) return null
    for (let i = 0; i < (spec.bars ?? 1); i++) out.push(chord)
  }
  return out.length > 0 ? out : null
}

/** True if the scale has a minor third on degree 2 (minor tonality). */
export function isMinorTonality(scale: ScaleDef): boolean {
  return scale.intervals[2] === 3
}

