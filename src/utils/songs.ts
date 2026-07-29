import type { NoteName } from './notes'
import { SCALES, type ScaleDef } from './scales'
import { resolveProgression, type ChordSpec, type DiatonicChord } from './chords'

export interface Song {
  title: string
  artist: string
  /** Key centre. */
  root: NoteName
  /** Must match a `name` in SCALES. Resolved at runtime — see resolveSong. */
  scaleName: string
  chords: readonly ChordSpec[]
  /** Genre lane, for grouping in the list. */
  genre: string
  /** What to listen for, or how to approach soloing over it. */
  note: string
  /**
   * The song's own feel. Not yet wired to playback — tempo still comes from
   * the scale's genres. Kept so the data is right when it is.
   */
  bpm?: number
}

/**
 * Each song is simplified to its main loop, not the full arrangement — enough
 * to solo over, not a transcription. Chords are stored as scale degrees, so a
 * song transposes if you change its root.
 */
export const SONGS: readonly Song[] = [
  {
    title: '12-Bar Blues', artist: 'Traditional',
    root: 'A', scaleName: 'Major (Ionian)', genre: 'Blues', bpm: 84,
    chords: [
      { degree: 0, quality: 'dominant7', bars: 4 },
      { degree: 3, quality: 'dominant7', bars: 2 },
      { degree: 0, quality: 'dominant7', bars: 2 },
      { degree: 4, quality: 'dominant7' },
      { degree: 3, quality: 'dominant7' },
      { degree: 0, quality: 'dominant7', bars: 2 },
    ],
    note: 'Every chord is a dominant 7th — that is what makes it blues rather than a folk song in A. The minor pentatonic works across all twelve bars.',
  },
  {
    title: 'The Thrill Is Gone', artist: 'B.B. King',
    root: 'B', scaleName: 'Natural Minor (Aeolian)', genre: 'Blues', bpm: 72,
    chords: [
      { degree: 0, quality: 'minor7', bars: 4 },
      { degree: 3, quality: 'minor7', bars: 2 },
      { degree: 0, quality: 'minor7', bars: 2 },
      { degree: 4, quality: 'dominant7' },
      { degree: 3, quality: 'minor7' },
      { degree: 0, quality: 'minor7', bars: 2 },
    ],
    note: 'A minor 12-bar. The V is a dominant 7th rather than a minor chord, so for that one bar a note from outside the key becomes available — that is where the tension lives.',
  },
  {
    title: 'Sultans of Swing', artist: 'Dire Straits',
    root: 'D', scaleName: 'Natural Minor (Aeolian)', genre: 'Rock', bpm: 148,
    chords: [{ degree: 0 }, { degree: 6 }, { degree: 5 }, { degree: 4, quality: 'major' }],
    note: 'The last bar is a major V in a minor key. Its third sits outside the scale and appears on the neck only for that bar — that note is the sound of this song.',
  },
  {
    title: 'All Along the Watchtower', artist: 'Jimi Hendrix',
    root: 'A', scaleName: 'Natural Minor (Aeolian)', genre: 'Rock', bpm: 112,
    chords: [{ degree: 0 }, { degree: 6 }, { degree: 5 }, { degree: 6 }],
    note: 'Four bars, all diatonic, no traps. A good first thing to solo over — the natural minor fits everywhere.',
  },
  {
    title: 'Hotel California', artist: 'Eagles',
    root: 'B', scaleName: 'Natural Minor (Aeolian)', genre: 'Rock', bpm: 74,
    chords: [
      { degree: 0 },                        // Bm
      { degree: 4, quality: 'major' },      // F#  — borrowed major V
      { degree: 6 },                        // A
      { degree: 3, quality: 'major' },      // E   — borrowed major IV, the lift
      { degree: 5 },                        // G
      { degree: 2 },                        // D
      { degree: 3 },                        // Em  — the diatonic iv this time
      { degree: 4, quality: 'major' },      // F#
    ],
    note: 'Eight bars that move every bar, and two of them are borrowed from outside the key — a major V and a major IV. Bar 4 is E major but bar 7 is E minor; hearing that difference is most of what makes this progression famous.',
  },
  {
    title: 'Sweet Home Alabama', artist: 'Lynyrd Skynyrd',
    root: 'G', scaleName: 'Major (Ionian)', genre: 'Southern rock', bpm: 98,
    chords: [{ degree: 4 }, { degree: 3 }, { degree: 0 }],
    note: 'Starts on the V and falls to the I, which is why it always feels like it is heading home. Three bars, so the loop is an odd length.',
  },
  {
    title: 'Stand By Me', artist: 'Ben E. King',
    root: 'A', scaleName: 'Major (Ionian)', genre: 'Soul', bpm: 118,
    chords: [{ degree: 0 }, { degree: 5 }, { degree: 3 }, { degree: 4 }],
    note: 'The I–vi–IV–V doo-wop loop. Major pentatonic sits on it comfortably.',
  },
  {
    title: "Ain't No Sunshine", artist: 'Bill Withers',
    root: 'A', scaleName: 'Natural Minor (Aeolian)', genre: 'Soul', bpm: 78,
    chords: [
      { degree: 0, quality: 'minor7' },
      { degree: 4, quality: 'minor7' },
      { degree: 6 },
      { degree: 0, quality: 'minor7' },
    ],
    note: 'Minor 7ths give it the smoky quality. The v stays minor here — no borrowed dominant, so everything you play is in the key.',
  },
  {
    title: 'Black Magic Woman', artist: 'Santana',
    root: 'D', scaleName: 'Natural Minor (Aeolian)', genre: 'Latin rock', bpm: 122,
    chords: [
      { degree: 0 },
      { degree: 4, quality: 'minor7' },
      { degree: 3 },
      { degree: 0 },
    ],
    note: 'Simplified to the main loop. Santana stays in D minor throughout and leans hard on bends into the fifth.',
  },
  {
    title: 'Oye Como Va', artist: 'Santana',
    root: 'A', scaleName: 'Dorian', genre: 'Latin', bpm: 108,
    chords: [{ degree: 0, quality: 'minor7' }, { degree: 3, quality: 'dominant7' }],
    note: 'Two chords forever. The IV is major because this is Dorian rather than natural minor — that raised sixth is the whole flavour, and it is why a song has to carry its own mode.',
  },
  {
    title: 'Chameleon', artist: 'Herbie Hancock',
    root: 'A#', scaleName: 'Dorian', genre: 'Funk', bpm: 96,
    chords: [{ degree: 0, quality: 'minor7' }, { degree: 3, quality: 'dominant7' }],
    note: 'The same two-chord Dorian vamp as Oye Como Va, a tone up and with a funk feel. Spelled A# here because the app writes everything with sharps.',
  },
  {
    title: 'La Bamba', artist: 'Ritchie Valens',
    root: 'C', scaleName: 'Major (Ionian)', genre: "Rock'n'roll", bpm: 150,
    chords: [{ degree: 0 }, { degree: 3 }, { degree: 4 }],
    note: 'I–IV–V, three bars, as simple as it gets. Major pentatonic and you cannot go wrong.',
  },
]

export interface ResolvedSong {
  root: NoteName
  scale: ScaleDef
  /** One entry per bar; multi-bar chords repeated. */
  bars: DiatonicChord[]
}

/**
 * Resolves a song's scale name and chord specs to concrete values.
 * Returns null if `scaleName` matches no scale or any chord fails to resolve,
 * so a mistyped song is dropped from the list rather than rendered broken.
 */
export function resolveSong(song: Song): ResolvedSong | null {
  const scale = SCALES.find(s => s.name === song.scaleName)
  if (!scale) return null
  const bars = resolveProgression(song.root, scale, song.chords)
  if (!bars) return null
  return { root: song.root, scale, bars }
}
