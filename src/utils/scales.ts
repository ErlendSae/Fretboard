import { CHROMATIC_NOTES, type NoteName, noteIndex } from './notes'

export interface ScaleDef {
  name: string
  intervals: readonly number[] // semitone offsets from root
  description: string
  genres: readonly string[]
}

export const SCALES: readonly ScaleDef[] = [
  {
    name: 'Major (Ionian)',
    intervals: [0, 2, 4, 5, 7, 9, 11],
    description: 'The foundational Western scale. Bright, resolved, and unambiguously happy — every other scale is defined by how it deviates from this one.',
    genres: ['Pop', 'Country', 'Folk', 'Rock'],
  },
  {
    name: 'Natural Minor (Aeolian)',
    intervals: [0, 2, 3, 5, 7, 8, 10],
    description: 'The relative minor of major — same notes, darker centre of gravity. Melancholic but not unsettling. The default choice when a song feels sad or serious.',
    genres: ['Rock', 'Metal', 'Pop', 'Classical'],
  },
  {
    name: 'Pentatonic Major',
    intervals: [0, 2, 4, 7, 9],
    description: 'Major scale minus the two most "tension-prone" notes (4th and 7th). Nearly impossible to play a wrong note — open, bright, and instantly musical.',
    genres: ['Country', 'Blues', 'Rock', 'Folk'],
  },
  {
    name: 'Pentatonic Minor',
    intervals: [0, 3, 5, 7, 10],
    description: 'The go-to soloing scale for rock and blues. Five notes, huge neck coverage, very forgiving. If you only learn one scale, make it this one.',
    genres: ['Rock', 'Blues', 'Metal', 'R&B'],
  },
  {
    name: 'Blues',
    intervals: [0, 3, 5, 6, 7, 10],
    description: 'Pentatonic Minor with one extra note: the b5 "blue note". That tritone creates the characteristic tension and grit that defines blues expression.',
    genres: ['Blues', 'Rock', 'Jazz', 'Soul'],
  },
  {
    name: 'Dorian',
    intervals: [0, 2, 3, 5, 7, 9, 10],
    description: 'Minor scale with a raised 6th — minor feel but with a warmer, jazzier brightness. "Oye Como Va" and "So What" live here. Popular in funk and Latin fusion.',
    genres: ['Jazz', 'Funk', 'Latin', 'Rock'],
  },
  {
    name: 'Phrygian',
    intervals: [0, 1, 3, 5, 7, 8, 10],
    description: 'Minor scale with a b2 — that half-step above the root gives it a distinctly Spanish or Middle-Eastern flavour. Very dark, very dramatic.',
    genres: ['Metal', 'Flamenco', 'Classical', 'Film scores'],
  },
  {
    name: 'Lydian',
    intervals: [0, 2, 4, 6, 7, 9, 11],
    description: 'Major scale with a raised 4th — that #4 makes it sound dreamy, floating, and slightly otherworldly. John Williams and Joe Satriani\'s favourite.',
    genres: ['Film scores', 'Fusion', 'Prog', 'Classical'],
  },
  {
    name: 'Mixolydian',
    intervals: [0, 2, 4, 5, 7, 9, 10],
    description: 'Major scale with a b7 — dominant and bluesy. Sounds like a major chord that refuses to fully resolve. "Sweet Home Alabama", "Norwegian Wood", virtually all rock.',
    genres: ['Rock', 'Blues', 'Country', 'Folk'],
  },
  {
    name: 'Locrian',
    intervals: [0, 1, 3, 5, 6, 8, 10],
    description: 'The unstable one — built on the 7th degree of major with a b2 and b5. Rarely used melodically, but the half-diminished sound appears in jazz harmony and metal.',
    genres: ['Metal', 'Jazz', 'Avant-garde'],
  },
  {
    name: 'Harmonic Minor',
    intervals: [0, 2, 3, 5, 7, 8, 11],
    description: 'Natural Minor with a raised 7th. That leading tone creates strong resolution back to the root — giving it a classical or neo-classical tension. Yngwie\'s weapon of choice.',
    genres: ['Classical', 'Metal', 'Flamenco', 'Middle-Eastern'],
  },
  {
    name: 'Melodic Minor',
    intervals: [0, 2, 3, 5, 7, 9, 11],
    description: 'Natural Minor with raised 6th and 7th — smoother ascending motion than Harmonic Minor. A jazz staple for its altered dominant and lydian dominant modes.',
    genres: ['Jazz', 'Classical', 'Fusion'],
  },
]

/** Returns the set of note names in a scale given a root and scale definition */
export function getScaleNotes(root: NoteName, scale: ScaleDef): Set<NoteName> {
  const rootIdx = noteIndex(root)
  const notes = new Set<NoteName>()
  for (const interval of scale.intervals) {
    notes.add(CHROMATIC_NOTES[(rootIdx + interval) % 12]!)
  }
  return notes
}
