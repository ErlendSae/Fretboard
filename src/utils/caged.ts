/**
 * CAGED system — pure math, no React, no side effects.
 *
 * The CAGED system names five major-scale positions after the open chord
 * shapes whose fingering patterns they resemble. Each shape has one
 * "anchor string" — the string where the root note sits inside that shape —
 * and a characteristic window width of 4 frets (5 inclusive positions, 0–4).
 *
 * Anchor strings and window offsets (derived from open-chord fingerings):
 *
 *  Shape | Anchor string | Open-chord root fret | Window offset
 *  ------|---------------|----------------------|-------------------
 *  C     | B  (index 4)  | fret 1 (open C)      | [rootFret-1, rootFret+3]
 *  A     | A  (index 1)  | fret 0 (open A)      | [rootFret,   rootFret+4]
 *  G     | low E (idx 0) | fret 3 (open G)      | [rootFret-3, rootFret+1]
 *  E     | low E (idx 0) | fret 0 (open E)      | [rootFret,   rootFret+4]
 *  D     | D  (index 2)  | fret 0 (open D)      | [rootFret,   rootFret+4]
 *
 * Algorithm for getCagedFretRange(root, shape):
 *   1. Look up the anchor string's open MIDI pitch.
 *   2. Find the lowest fret ≥ 0 on that string that produces the root note
 *      (i.e., (openMidi + fret) % 12 === rootMidi % 12).
 *   3. Apply the window offset to get [fretMin, fretMax].
 *   4. Clamp both ends to [0, 12] (NUM_FRETS).
 *
 * Spot checks (verified by hand):
 *
 *   C major (root chromatic index 0):
 *     C shape → anchor B str (MIDI 59, idx 12%=11). Need 0. (11+f)%12=0 → f=1.
 *              window [1-1, 1+3] = [0, 4]
 *     A shape → anchor A str (MIDI 45, idx 12%=9).  Need 0. (9+f)%12=0  → f=3.
 *              window [3, 7]
 *     G shape → anchor E str (MIDI 40, idx 12%=4).  Need 0. (4+f)%12=0  → f=8.
 *              window [8-3, 8+1] = [5, 9]
 *     E shape → anchor E str (MIDI 40, same).       f=8.
 *              window [8, 12]
 *     D shape → anchor D str (MIDI 50, idx 12%=2).  Need 0. (2+f)%12=0  → f=10.
 *              window [10, 14] → clamped [10, 12]
 *
 *   G major (root chromatic index 7):
 *     C shape → B str (idx 11). (11+f)%12=7 → f=8. window [7, 11]
 *     A shape → A str (idx  9). (9+f)%12=7  → f=10. window [10, 14] → [10, 12]
 *     G shape → E str (idx  4). (4+f)%12=7  → f=3.  window [0, 4]
 *     E shape → E str (idx  4). f=3.                window [3, 7]
 *     D shape → D str (idx  2). (2+f)%12=7  → f=5.  window [5, 9]
 *
 *   D major (root chromatic index 2):
 *     C shape → B str (idx 11). (11+f)%12=2 → f=3.  window [2, 6]
 *     A shape → A str (idx  9). (9+f)%12=2  → f=5.  window [5, 9]
 *     G shape → E str (idx  4). (4+f)%12=2  → f=10. window [7, 11]
 *     E shape → E str (idx  4). f=10.               window [10, 14] → [10, 12]
 *     D shape → D str (idx  2). (2+f)%12=2  → f=0.  window [0, 4]
 *
 * Coverage check — C major windows union:
 *   [0,4] ∪ [3,7] ∪ [5,9] ∪ [8,12] ∪ [10,12] = [0,12] ✓
 *   (Every fret 0–12 is covered; shapes overlap to allow position shifts.)
 */

import { OPEN_STRING_MIDI, type NoteName, noteIndex } from './notes'

export type CagedShape = 'C' | 'A' | 'G' | 'E' | 'D'

export const CAGED_SHAPES: readonly CagedShape[] = ['C', 'A', 'G', 'E', 'D']

export interface ShapeInfo {
  openChord: string
  anchorStringName: string
  tip: string
}

export const SHAPE_INFO: Record<CagedShape, ShapeInfo> = {
  C: {
    openChord: 'Open C major shape',
    anchorStringName: 'B string (5th string)',
    tip: 'The root sits on the B string. This is the shape you play when you barre behind an open C chord — slide it up the neck and the fingering stays the same.',
  },
  A: {
    openChord: 'Open A major shape',
    anchorStringName: 'A string (5th string)',
    tip: 'Root on the A string. This is the standard barre chord most guitarists learn first. Anywhere on the neck, it works exactly the same.',
  },
  G: {
    openChord: 'Open G major shape',
    anchorStringName: 'Low E string (6th string)',
    tip: 'Root on the low E. The G shape spans a wide stretch and is tricky to fret cleanly — guitarists often play only part of it. Notice how it overlaps with both the A shape below and the E shape above.',
  },
  E: {
    openChord: 'Open E major shape',
    anchorStringName: 'Low E string (6th string)',
    tip: 'Root on the low E. You already know this one — it is the E-form barre chord. Move it anywhere on the neck and the shape never changes. The most common shape to start with.',
  },
  D: {
    openChord: 'Open D major shape',
    anchorStringName: 'D string (4th string)',
    tip: 'Root on the D string. Often the hardest shape to see at first. It fills the gap between the E and C shapes on the upper frets.',
  },
}

/**
 * Internal descriptor for each CAGED shape.
 * anchorString: the string index (0 = low E) where the root sits.
 * windowLow / windowHigh: offsets from rootFret to produce the fret window.
 */
interface ShapeDescriptor {
  anchorString: number
  windowLow: number   // added to rootFret for the lower bound
  windowHigh: number  // added to rootFret for the upper bound
}

const SHAPE_DESCRIPTORS: Readonly<Record<CagedShape, ShapeDescriptor>> = {
  // Open C major: root C on B string (index 4) at fret 1
  C: { anchorString: 4, windowLow: -1, windowHigh: 3 },
  // Open A major: root A on A string (index 1) at fret 0
  A: { anchorString: 1, windowLow:  0, windowHigh: 4 },
  // Open G major: root G on low E string (index 0) at fret 3
  G: { anchorString: 0, windowLow: -3, windowHigh: 1 },
  // Open E major: root E on low E string (index 0) at fret 0
  E: { anchorString: 0, windowLow:  0, windowHigh: 4 },
  // Open D major: root D on D string (index 2) at fret 0
  D: { anchorString: 2, windowLow:  0, windowHigh: 4 },
}

/**
 * Returns the fret window [fretMin, fretMax] for a CAGED shape in a given key.
 * Works for any root note. The window is always 4 frets wide (inclusive),
 * clamped to [0, 12].
 *
 * @param root  - The root note of the key (e.g. 'C', 'G', 'F#')
 * @param shape - One of the five CAGED shapes
 * @returns     - A tuple [fretMin, fretMax] both in [0, 12]
 */
export function getCagedFretRange(root: NoteName, shape: CagedShape): [number, number] {
  const { anchorString, windowLow, windowHigh } = SHAPE_DESCRIPTORS[shape]

  const openMidi = OPEN_STRING_MIDI[anchorString]!
  const openChromatic = ((openMidi % 12) + 12) % 12
  const rootChromatic = noteIndex(root)

  // Find the lowest fret ≥ 0 on the anchor string that produces the root note.
  // (openChromatic + fret) % 12 === rootChromatic
  // fret = (rootChromatic - openChromatic + 12) % 12
  const rootFret = ((rootChromatic - openChromatic) + 12) % 12

  const fretMin = Math.max(0,  rootFret + windowLow)
  const fretMax = Math.min(12, rootFret + windowHigh)

  return [fretMin, fretMax]
}
