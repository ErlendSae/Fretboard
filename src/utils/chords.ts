import { CHROMATIC_NOTES, type NoteName, noteIndex } from './notes'
import type { ScaleDef } from './scales'

export type ChordQuality = 'major' | 'minor' | 'diminished' | 'augmented'

export interface DiatonicChord {
  degree: number
  roman: string
  root: NoteName
  quality: ChordQuality
  notes: readonly NoteName[]
  name: string
}

export interface ProgressionPreset {
  label: string
  degrees: readonly number[]
  description: string
  genres: readonly string[]
  tonality: 'major' | 'minor'
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
    const isMajorRoman = quality === 'major' || quality === 'augmented'

    const third = CHROMATIC_NOTES[(chordRootIdx + thirdSemitones) % 12]!
    const fifth = CHROMATIC_NOTES[(chordRootIdx + fifthSemitones) % 12]!

    const romanBase = isMajorRoman ? ROMAN[degree]! : ROMAN[degree]!.toLowerCase()
    const roman =
      quality === 'diminished' ? romanBase + '°'
      : quality === 'augmented' ? romanBase + '+'
      : romanBase

    const nameSuffix =
      quality === 'minor' ? 'm'
      : quality === 'diminished' ? 'dim'
      : quality === 'augmented' ? 'aug'
      : ''

    return {
      degree,
      roman,
      root: chordRoot,
      quality,
      notes: [chordRoot, third, fifth] as const,
      name: chordRoot + nameSuffix,
    }
  })
}

/** True if the scale has a minor third on degree 2 (minor tonality). */
export function isMinorTonality(scale: ScaleDef): boolean {
  return scale.intervals[2] === 3
}

export const PROGRESSION_PRESETS: readonly ProgressionPreset[] = [
  // ── Major ──────────────────────────────────────────────────────────────────
  {
    label: 'I – IV – V',
    degrees: [0, 3, 4],
    description: 'The foundation of rock, blues, and country. Three chords, infinite songs.',
    genres: ['Rock', 'Blues', 'Country', 'Folk'],
    tonality: 'major',
  },
  {
    label: 'I – V – vi – IV',
    degrees: [0, 4, 5, 3],
    description: '"Four chords" — powers thousands of pop songs. "Let It Be", "No Woman No Cry", "Africa".',
    genres: ['Pop', 'Rock'],
    tonality: 'major',
  },
  {
    label: 'I – vi – IV – V',
    degrees: [0, 5, 3, 4],
    description: 'The 50s/doo-wop loop. Warm, nostalgic, and endlessly singable.',
    genres: ['Pop', 'R&B'],
    tonality: 'major',
  },
  {
    label: 'ii – V – I',
    degrees: [1, 4, 0],
    description: 'The jazz cadence. The ii sets up tension, V creates pull, I resolves. Learn this and you speak jazz.',
    genres: ['Jazz', 'Fusion', 'Bossa nova'],
    tonality: 'major',
  },
  {
    label: 'I – IV – vi – V',
    degrees: [0, 3, 5, 4],
    description: 'Bright start, emotional dip on the vi, resolved by V. Common in singer-songwriter and indie.',
    genres: ['Indie', 'Folk', 'Singer-songwriter'],
    tonality: 'major',
  },
  // ── Minor ──────────────────────────────────────────────────────────────────
  {
    label: 'i – VII – VI – VII',
    degrees: [0, 6, 5, 6],
    description: 'Drives hard rock riffs — powerful, brooding, and relentless.',
    genres: ['Rock', 'Metal'],
    tonality: 'minor',
  },
  {
    label: 'i – VI – III – VII',
    degrees: [0, 5, 2, 6],
    description: 'The Andalusian cadence. Flamenco, Spanish guitar, dramatic film scores.',
    genres: ['Flamenco', 'Classical', 'Film scores'],
    tonality: 'minor',
  },
  {
    label: 'i – iv – VII – III',
    degrees: [0, 3, 6, 2],
    description: 'Minor loop with upward momentum. Common in neo-soul and R&B.',
    genres: ['R&B', 'Soul', 'Neo-soul'],
    tonality: 'minor',
  },
  {
    label: 'i – VI – VII – i',
    degrees: [0, 5, 6, 0],
    description: 'Short, punchy minor loop. Lots of tension before returning home.',
    genres: ['Rock', 'Metal', 'Pop'],
    tonality: 'minor',
  },
]
