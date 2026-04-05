export const CHROMATIC_NOTES = [
  'C', 'C#', 'D', 'D#', 'E', 'F',
  'F#', 'G', 'G#', 'A', 'A#', 'B',
] as const

export type NoteName = (typeof CHROMATIC_NOTES)[number]

/**
 * Standard tuning open-string MIDI note numbers (string index 0 = low E).
 * E2=40, A2=45, D3=50, G3=55, B3=59, E4=64
 */
export const OPEN_STRING_MIDI: readonly number[] = [40, 45, 50, 55, 59, 64]

/** String labels, index 0 = low E (thickest, top of neck render) */
export const STRING_NAMES = ['E', 'A', 'D', 'G', 'B', 'e'] as const

export const NUM_STRINGS = 6
export const NUM_FRETS = 12 // frets 0–12 displayed

/** Standard fret position markers */
export const FRET_MARKERS = [3, 5, 7, 9, 12] as const

/** Return note name for a given MIDI pitch */
export function midiToNote(midi: number): NoteName {
  return CHROMATIC_NOTES[((midi % 12) + 12) % 12]!
}

/** Return MIDI note number for string s (0-based) at fret f (0-based) */
export function fretToMidi(stringIndex: number, fret: number): number {
  return OPEN_STRING_MIDI[stringIndex]! + fret
}

/** Return note name for string/fret */
export function fretToNote(stringIndex: number, fret: number): NoteName {
  return midiToNote(fretToMidi(stringIndex, fret))
}

/** Return chromatic index 0-11 for a note name */
export function noteIndex(note: NoteName): number {
  return CHROMATIC_NOTES.indexOf(note)
}

/** Semitone distance between two notes (min of clockwise / counter-clockwise) */
export function semitoneDist(a: NoteName, b: NoteName): number {
  const diff = Math.abs(noteIndex(a) - noteIndex(b))
  return Math.min(diff, 12 - diff)
}
