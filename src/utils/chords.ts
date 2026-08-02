import { CHROMATIC_NOTES, type NoteName, noteIndex } from './notes'
import { SCALES, type ScaleDef } from './scales'

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

/**
 * True if the scale contains a minor third — its tonality is minor.
 *
 * Tests for the interval, not for a fixed array position. Position 2 is only
 * the third in a seven-note scale; in Pentatonic Minor [0,3,5,7,10] and Blues
 * [0,3,5,6,7,10] the entry at index 2 is a 5, so an index test calls both of
 * them major. Checking for the interval itself is correct for all of SCALES.
 */
export function isMinorTonality(scale: ScaleDef): boolean {
  return scale.intervals.includes(3)
}

/**
 * A short diatonic loop to practise over. One bar per chord unless `bars`
 * says otherwise, repeated forever by useBackingTrack.
 *
 * Deliberately short and predictable: the point is a harmony you stop
 * listening to after one pass, so attention is free for finding notes.
 * Real songs live on the Songs page.
 */
export interface Vamp {
  label: string
  tonality: 'major' | 'minor'
  chords: readonly ChordSpec[]
}

export const VAMPS: readonly Vamp[] = [
  {
    label: 'I–IV–V–IV',
    tonality: 'major',
    chords: [{ degree: 0 }, { degree: 3 }, { degree: 4 }, { degree: 3 }],
  },
  {
    label: 'I–V–vi–IV',
    tonality: 'major',
    chords: [{ degree: 0 }, { degree: 4 }, { degree: 5 }, { degree: 3 }],
  },
  {
    label: 'ii–V–I',
    tonality: 'major',
    chords: [{ degree: 1 }, { degree: 4 }, { degree: 0, bars: 2 }],
  },
  {
    label: 'i–VII–VI',
    tonality: 'minor',
    chords: [{ degree: 0 }, { degree: 6 }, { degree: 5, bars: 2 }],
  },
  {
    label: 'i–iv–v',
    tonality: 'minor',
    chords: [{ degree: 0, bars: 2 }, { degree: 3 }, { degree: 4 }],
  },
  {
    label: 'i–VI–III–VII',
    tonality: 'minor',
    chords: [{ degree: 0 }, { degree: 5 }, { degree: 2 }, { degree: 6 }],
  },
]

/**
 * VAMPS' labels are static Roman-numeral strings — they describe the chords
 * that come out of Ionian and Aeolian only. Every other seven-note mode
 * harmonises differently, so the same label would lie. Two examples:
 * Lydian's IV is a diminished chord (raised 4th), not the major IV the label
 * i–IV–V–IV implies; Locrian's i is itself diminished, so there is no stable
 * tonic to vamp on at all. Only these five scales are safe to offer a vamp
 * for; everyone else gets the drone.
 *
 * Keyed on scale.name like VAMP_PARENT_SCALE below — see the safety net on
 * vampsFor for what happens if one of these names drifts out of sync.
 */
const VAMPS_SUPPORTED_SCALES: ReadonlySet<string> = new Set([
  'Major (Ionian)',
  'Pentatonic Major',
  'Natural Minor (Aeolian)',
  'Pentatonic Minor',
  'Blues',
])

// VAMPS_SUPPORTED_SCALES was chosen to only contain names that filter to
// exactly 3 vamps per tonality. That's a property of these two module
// constants, not of any argument, so it's checked once here at import time
// rather than on every vampsFor call. A future typo or rename of a scale/vamp
// name that breaks this throws loudly during development rather than
// silently returning a wrong or empty list in production.
for (const tonality of ['major', 'minor'] as const) {
  const count = VAMPS.filter(v => v.tonality === tonality).length
  if (count !== 3) {
    throw new Error(
      `VAMPS invariant violated: expected 3 vamps of tonality "${tonality}", got ${count} — VAMPS_SUPPORTED_SCALES or VAMPS has drifted`,
    )
  }
}

/**
 * The vamps that honestly describe `scale`'s harmony, filtered to its
 * tonality. Returns `[]` for any scale outside VAMPS_SUPPORTED_SCALES — an
 * empty result means "drone only", and callers must not fall back to an
 * unfiltered vamp list.
 */
export function vampsFor(scale: ScaleDef): readonly Vamp[] {
  if (!VAMPS_SUPPORTED_SCALES.has(scale.name)) return []
  const tonality = isMinorTonality(scale) ? 'minor' : 'major'
  return VAMPS.filter(v => v.tonality === tonality)
}

/**
 * Scales with fewer than seven notes have no diatonic triads, so
 * getDiatonicChords returns null and no vamp can be built from them. They
 * borrow the harmony of their parent scale instead.
 *
 * Only the backing track consults this. The neck still draws the scale you
 * picked — five notes for a pentatonic. A minor pentatonic over Am–G–F is
 * musically what is wanted, not a bodge.
 */
const VAMP_PARENT_SCALE: Readonly<Record<string, string>> = {
  'Pentatonic Minor': 'Natural Minor (Aeolian)',
  'Blues': 'Natural Minor (Aeolian)',
  'Pentatonic Major': 'Major (Ionian)',
}

/**
 * The scale a vamp's chords should be built from. Returns the scale itself
 * for everything with seven notes.
 *
 * Side effect: this result also feeds useBackingTrack's default-BPM lookup,
 * so substituting the parent scale quietly substitutes its tempo too (e.g.
 * Blues 108→100 BPM, Pentatonic Major 78→85 BPM, since the parent scales
 * carry different `genres`). Unintended but harmless — tempo stays
 * user-adjustable.
 */
export function vampScale(scale: ScaleDef): ScaleDef {
  const parentName = VAMP_PARENT_SCALE[scale.name]
  if (!parentName) return scale
  return SCALES.find(s => s.name === parentName) ?? scale
}

