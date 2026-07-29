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
  {
    title: 'Cliffs of Dover', artist: 'Eric Johnson',
    root: 'G', scaleName: 'Major (Ionian)', genre: 'Instrumental rock', bpm: 156,
    chords: [{ degree: 0 }, { degree: 3 }, { degree: 4 }, { degree: 5 }],
    note: 'Approximated, not transcribed — the real thing opens with an unaccompanied cadenza and moves faster than one chord per bar. This is a G major I–IV–V–vi loop at tempo to practise the vocabulary over. Johnson lives in G major pentatonic with plenty of open-string ringing.',
  },
  {
    title: 'Sweet Child O’ Mine', artist: 'Guns N’ Roses',
    root: 'D', scaleName: 'Mixolydian', genre: 'Rock', bpm: 128,
    chords: [{ degree: 0 }, { degree: 6 }, { degree: 3 }, { degree: 0 }],
    note: 'D–C–G–D. The C is a flat seventh, which is what makes this Mixolydian rather than plain D major — that one note is why the riff sounds like it does.',
  },
  {
    title: 'Autumn Leaves', artist: 'Jazz standard',
    root: 'G', scaleName: 'Natural Minor (Aeolian)', genre: 'Jazz', bpm: 120,
    chords: [
      { degree: 3, quality: 'minor7' },     // Cm7    iv7
      { degree: 6, quality: 'dominant7' },  // F7     VII7
      { degree: 2, quality: 'major7' },     // Bbmaj7 IIImaj7
      { degree: 5, quality: 'major7' },     // Ebmaj7 VImaj7
      { degree: 1, quality: 'minor7b5' },   // Am7b5  ii ø7
      { degree: 4, quality: 'dominant7' },  // D7     V7 — borrowed major
      { degree: 0, quality: 'minor7', bars: 2 }, // Gm7  i7
    ],
    note: 'The first eight bars. Two ii–V–I cadences back to back, one landing in the relative major and one in the minor home key. The D7 is borrowed — its third is outside the key and is the note that pulls you home.',
  },
  {
    title: 'Little Wing', artist: 'Jimi Hendrix',
    root: 'E', scaleName: 'Natural Minor (Aeolian)', genre: 'Blues rock', bpm: 68,
    chords: [{ degree: 0 }, { degree: 2 }, { degree: 3 }, { degree: 0 }],
    note: 'Simplified to the main vamp; the real intro wanders further. Slow enough that you can hear every note, which makes it a good one for phrasing rather than speed.',
  },
  {
    title: 'Comfortably Numb', artist: 'Pink Floyd',
    root: 'B', scaleName: 'Natural Minor (Aeolian)', genre: 'Prog rock', bpm: 63,
    chords: [{ degree: 0 }, { degree: 6 }, { degree: 5 }, { degree: 6 }],
    note: 'The outro solo loop. Same three chords as Watchtower but half the tempo — all the room in the world to bend and hold notes rather than fill every bar.',
  },
  {
    title: 'Paranoid', artist: 'Black Sabbath',
    root: 'E', scaleName: 'Natural Minor (Aeolian)', genre: 'Metal', bpm: 164,
    chords: [{ degree: 0, bars: 2 }, { degree: 6 }, { degree: 0 }],
    note: 'Riff-driven, so the harmony barely moves — i and VII. Fast, and the minor pentatonic covers all of it, which is the point: speed with a small vocabulary.',
  },
  {
    title: 'Smells Like Teen Spirit', artist: 'Nirvana',
    root: 'F', scaleName: 'Natural Minor (Aeolian)', genre: 'Grunge', bpm: 117,
    chords: [{ degree: 0 }, { degree: 3 }, { degree: 2 }, { degree: 5 }],
    note: 'Four power chords, i–iv–III–VI, round and round. The solo is close to the vocal melody rather than a scale run — worth trying that approach here.',
  },
  {
    title: 'Redemption Song', artist: 'Bob Marley',
    root: 'G', scaleName: 'Major (Ionian)', genre: 'Reggae', bpm: 76,
    chords: [{ degree: 0 }, { degree: 5 }, { degree: 3 }, { degree: 0 }],
    note: 'I–vi–IV–I, gentle and open. Major pentatonic, and leave space — the gaps are as much of the feel as the notes.',
  },
  {
    title: 'Ring of Fire', artist: 'Johnny Cash',
    root: 'G', scaleName: 'Major (Ionian)', genre: 'Country', bpm: 108,
    chords: [{ degree: 0, bars: 2 }, { degree: 3 }, { degree: 0 }, { degree: 4 }, { degree: 3 }, { degree: 0, bars: 2 }],
    note: 'I–IV–I–V–IV–I. Country phrasing leans on the major third and the sixth rather than the blues notes — try major pentatonic before you reach for minor.',
  },
  {
    title: 'By the Way', artist: 'Red Hot Chili Peppers',
    root: 'A', scaleName: 'Natural Minor (Aeolian)', genre: 'Funk rock', bpm: 122,
    chords: [{ degree: 0 }, { degree: 5 }, { degree: 2 }, { degree: 6 }],
    note: 'The chorus loop: i–VI–III–VII descending. Frusciante tends to stay melodic and rhythmic rather than fast here — the whole band is already busy, so single notes with space cut through better than runs.',
  },
  {
    title: 'Stairway to Heaven', artist: 'Led Zeppelin',
    root: 'A', scaleName: 'Natural Minor (Aeolian)', genre: 'Classic rock', bpm: 84,
    chords: [{ degree: 0 }, { degree: 6 }, { degree: 5 }],
    note: 'The solo section only — a descending i–VII–VI, three bars, so the loop is an odd length. Page builds the whole solo from A minor pentatonic; the interest is in phrasing and repetition, not new notes.',
  },
  {
    title: 'Do It Again', artist: 'Steely Dan',
    root: 'B', scaleName: 'Natural Minor (Aeolian)', genre: 'Jazz rock', bpm: 100,
    chords: [{ degree: 0, quality: 'minor7' }, { degree: 3, quality: 'minor7' }],
    note: 'Reduced to the two-chord modal vamp the tune sits on. Most Steely Dan needs altered dominants and mid-song key changes that this backing engine cannot express — this one works because it barely moves. Dorian colour over the vamp rather than straight minor pentatonic gets you closer to the record.',
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
