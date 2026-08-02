/**
 * The five scale positions — pure math, no React, no side effects.
 *
 * These are the CAGED windows, renumbered I–V by where they sit on the neck
 * rather than by the open-chord shape they come from. The original derivation
 * (in the deleted utils/caged.ts) looked up an anchor string per shape and
 * applied a window offset to the root's fret on that string. That table
 * collapses to a single expression.
 *
 * Let fE be the lowest fret on the low E string that sounds the root:
 *
 *   fE = (noteIndex(root) - 4 + 12) % 12        // open low E is chromatic 4
 *
 * The five windows then start at (fE + offset) % 12 for these offsets, and
 * each spans 5 frets:
 *
 *   offset 0 → E shape    offset 2 → D shape    offset 4 → C shape
 *   offset 7 → A shape    offset 9 → G shape
 *
 * Because {0, 2, 4, 7, 9} are five distinct residues mod 12, the five starts
 * are always five distinct frets in 0–11. The ascending sort is therefore
 * total and the I–V numbering is deterministic in every key — no tie-break
 * rule is needed, and no window is ever clamped (max start 11 + span 4 = 15,
 * which is exactly NUM_FRETS).
 *
 * The windows depend on the root only, never the scale. This is correct for
 * minor and pentatonic as well as major: for root A they come out
 * [0-4] [2-6] [5-9] [7-11] [9-13], which are the five classic A-minor-
 * pentatonic boxes.
 *
 * Verified output for all twelve roots:
 *
 *   C   I [0-4] C    II [3-7] A    III [5-9] G    IV [8-12] E    V [10-14] D
 *   C#  I [1-5] C    II [4-8] A    III [6-10] G   IV [9-13] E    V [11-15] D
 *   D   I [0-4] D    II [2-6] C    III [5-9] A    IV [7-11] G    V [10-14] E
 *   D#  I [1-5] D    II [3-7] C    III [6-10] A   IV [8-12] G    V [11-15] E
 *   E   I [0-4] E    II [2-6] D    III [4-8] C    IV [7-11] A    V [9-13] G
 *   F   I [1-5] E    II [3-7] D    III [5-9] C    IV [8-12] A    V [10-14] G
 *   F#  I [2-6] E    II [4-8] D    III [6-10] C   IV [9-13] A    V [11-15] G
 *   G   I [0-4] G    II [3-7] E    III [5-9] D    IV [7-11] C    V [10-14] A
 *   G#  I [1-5] G    II [4-8] E    III [6-10] D   IV [8-12] C    V [11-15] A
 *   A   I [0-4] A    II [2-6] G    III [5-9] E    IV [7-11] D    V [9-13] C
 *   A#  I [1-5] A    II [3-7] G    III [6-10] E   IV [8-12] D    V [10-14] C
 *   B   I [2-6] A    II [4-8] G    III [7-11] E   IV [9-13] D    V [11-15] C
 */

import { noteIndex, type NoteName } from './notes'

export type CagedShape = 'C' | 'A' | 'G' | 'E' | 'D'

/** Offset from the root's lowest fret on the low E string → the shape whose window starts there. */
const SHAPE_OFFSETS: readonly (readonly [number, CagedShape])[] = [
  [0, 'E'],
  [2, 'D'],
  [4, 'C'],
  [7, 'A'],
  [9, 'G'],
]

/** Frets from the low end of a window to its high end, inclusive — so 5 frets wide. */
const WINDOW_SPAN = 4

const NUMERALS = ['I', 'II', 'III', 'IV', 'V'] as const

/** Chromatic index of the open low E string. */
const LOW_E_CHROMATIC = 4

export interface Position {
  /** 1-5, ordered up the neck. */
  number: number
  /** Roman numeral for display. */
  numeral: string
  /** Inclusive [low, high] fret window. Always WINDOW_SPAN + 1 frets wide. */
  fretRange: [number, number]
  /** The CAGED shape this window comes from, shown as a caption. */
  shape: CagedShape
}

/**
 * The five scale positions for a key, ordered up the neck.
 * Always returns exactly five entries.
 */
export function getPositions(root: NoteName): Position[] {
  const lowEFret = ((noteIndex(root) - LOW_E_CHROMATIC) + 12) % 12

  return SHAPE_OFFSETS
    .map(([offset, shape]) => ({ shape, low: (lowEFret + offset) % 12 }))
    .sort((a, b) => a.low - b.low)
    .map(({ shape, low }, i) => ({
      number: i + 1,
      numeral: NUMERALS[i]!,
      fretRange: [low, low + WINDOW_SPAN] as [number, number],
      shape,
    }))
}
