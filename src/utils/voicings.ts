/**
 * Chord voicings — pure data module.
 *
 * Strategy: template shapes defined relative to an anchor string's root fret,
 * then transposed to the actual root via chromatic offset.
 *
 * Offset formula:
 *   rootChromatic = noteIndex(root)               // 0–11
 *   openChromatic = OPEN_STRING_MIDI[anchor] % 12 // 0–11
 *   offset = (rootChromatic - openChromatic + 12) % 12
 *   actualFret[i] = templateFret[i] === null ? null : templateFret[i] + offset
 *
 * A voicing is discarded when any non-null fret exceeds NUM_FRETS (12).
 *
 * ── Hand verification ──────────────────────────────────────────────────────
 *
 * G major:
 *   "E barre" anchor string 0 (E, open=4): offset=(7-4+12)%12=3
 *     frets: [3,5,5,4,3,3] → G–B–G–D–G–B  ✓  (classic open-G-shape barre at 3)
 *   "A barre" anchor string 1 (A, open=9): offset=(7-9+12)%12=10
 *     frets: [null,10,12,12,12,10] → –G–D–G–B–G  ✓  (G root on A string fret 10)
 *   "D shape" anchor string 2 (D, open=2): offset=(7-2+12)%12=5
 *     frets: [null,null,5,7,8,7] → –D–G–B–D  ✓
 *   "Top triad" anchor string 5 (e, open=4): offset=(7-4+12)%12=3
 *     frets: [null,null,null,4,3,3] → B–D–G  (first inversion G major)  ✓
 *
 * C major:
 *   "E barre" anchor string 0: offset=(0-4+12)%12=8
 *     frets: [8,10,10,9,8,8] → C–E–C–G–C–E  ✓
 *   "A barre" anchor string 1: offset=(0-9+12)%12=3
 *     frets: [null,3,5,5,5,3] → –C–G–C–E–C  ✓  (standard C barre at 3)
 *   "Top triad" anchor string 5: offset=(0-4+12)%12=8
 *     frets: [null,null,null,9,8,8] → E–G–C  (first inversion C major)  ✓
 *
 * A diminished:
 *   "Dim7 grip" anchor string 1 (A, open=9): offset=(9-9+12)%12=0
 *     frets: [null,0,1,2,1,null] → A–Eb–Ab/G#–C#–  (dim7 shell on A root)  ✓
 *
 * G minor:
 *   "E barre" anchor string 0: offset=3
 *     frets: [3,5,5,3,3,3] → G–B♭–G–D–G–G  ✓
 *   "Top triad" anchor string 5: offset=3
 *     frets: [null,null,null,3,3,3] → B♭–D–G  (first inversion G minor)  ✓
 */

import type { NoteName } from './notes'
import type { ChordQuality } from './chords'
import { noteIndex, OPEN_STRING_MIDI, NUM_FRETS } from './notes'

// ─── Public types ─────────────────────────────────────────────────────────────

export interface Voicing {
  name: string
  /** Per-string fret number (index 0 = low E string). null = muted / don't play. */
  frets: readonly (number | null)[]
}

// ─── Internal template type ───────────────────────────────────────────────────

interface VoicingTemplate {
  name: string
  /** String index (0=low E, 1=A, 2=D, 3=G, 4=B, 5=e) where the root lands. */
  anchorString: number
  /** Relative frets: index 0=low E. Values are offsets from the transposed root fret. */
  relativeFrets: readonly (number | null)[]
}

// ─── Template definitions ─────────────────────────────────────────────────────
//
// relativeFrets[i] is the fret relative to the anchor string's transposed root fret.
// Strings not involved in the voicing use null.
//
// The template fret on the anchor string encodes the root's position within the shape;
// it is 0 when the root is played open-style at the anchor fret, and a positive offset
// when the root is at a higher fret than the shape's lowest note.

const MAJOR_TEMPLATES: readonly VoicingTemplate[] = [
  {
    // Open E major shape: E-B-E-G#-B-E (open), barre version: root on low E string
    // Relative to low E open: [0,2,2,1,0,0]
    name: 'E barre',
    anchorString: 0,
    relativeFrets: [0, 2, 2, 1, 0, 0],
  },
  {
    // Open A major shape: x-A-E-A-C#-E (open), barre version: root on A string
    // Relative: [null,0,2,2,2,0]
    name: 'A barre',
    anchorString: 1,
    relativeFrets: [null, 0, 2, 2, 2, 0],
  },
  {
    // Open D major shape: x-x-D-A-D-F# (open), barre version: root on D string
    // Relative: [null,null,0,2,3,2]
    name: 'D shape',
    anchorString: 2,
    relativeFrets: [null, null, 0, 2, 3, 2],
  },
  {
    // First-inversion triad on top 3 strings (G,B,e): minor-3rd–5th–root
    // Anchor on high e string (index 5). Relative: [null,null,null,1,0,0]
    // Produces: G string = root+1 fret offset = major 3rd (first inversion),
    //           B string = root fret, e string = root fret.
    // Verified: G major → G str fret 4=B, B str fret 3=D, e str fret 3=G (B-D-G) ✓
    name: 'Top triad',
    anchorString: 5,
    relativeFrets: [null, null, null, 1, 0, 0],
  },
]

const MINOR_TEMPLATES: readonly VoicingTemplate[] = [
  {
    // Open Em shape barre: root on low E string
    name: 'E barre',
    anchorString: 0,
    relativeFrets: [0, 2, 2, 0, 0, 0],
  },
  {
    // Open Am shape barre: root on A string
    // Relative: [null,0,2,2,1,0]
    name: 'A barre',
    anchorString: 1,
    relativeFrets: [null, 0, 2, 2, 1, 0],
  },
  {
    // Dm shape barre: root on D string
    // Relative: [null,null,0,2,3,1]
    name: 'D shape',
    anchorString: 2,
    relativeFrets: [null, null, 0, 2, 3, 1],
  },
  {
    // First-inversion minor triad on top 3 strings (G,B,e): minor-3rd–5th–root
    // Anchor on high e string (index 5). Relative: [null,null,null,0,0,0]
    // G, B, e all at same fret (partial barre).
    // Verified: G minor → all fret 3: G str=B♭, B str=D, e str=G (B♭-D-G) ✓
    name: 'Top triad',
    anchorString: 5,
    relativeFrets: [null, null, null, 0, 0, 0],
  },
]

const DIMINISHED_TEMPLATES: readonly VoicingTemplate[] = [
  {
    // Diminished 7th shell grip anchored on A string.
    // Relative from A: [null,0,1,2,1,null]
    // Verified A dim: [null,0,1,2,1,null] → A-Eb-Ab-C# shell  ✓
    name: 'Dim7 grip',
    anchorString: 1,
    relativeFrets: [null, 0, 1, 2, 1, null],
  },
  {
    // Half-dim (m7b5) shell anchored on D string.
    // Relative: [null,null,0,1,1,1]
    name: 'Half-dim',
    anchorString: 2,
    relativeFrets: [null, null, 0, 1, 1, 1],
  },
  {
    // Diminished 7th fully voiced, anchored on low E.
    // Diminished 7 shape: root on low E, stacked minor thirds.
    // Relative: [0,1,2,0,2,0] — approximation; dim7 is symmetric every 3 frets.
    name: 'Dim7 full',
    anchorString: 0,
    relativeFrets: [0, 1, 2, 0, 2, 0],
  },
]

const AUGMENTED_TEMPLATES: readonly VoicingTemplate[] = [
  {
    // Augmented triad anchored on low E string.
    // Aug chord is symmetric every 4 frets (stacked major thirds).
    // E-aug open-ish: [0,3,2,1,1,0] relative
    name: 'Aug',
    anchorString: 0,
    relativeFrets: [0, 3, 2, 1, 1, 0],
  },
  {
    // Augmented triad anchored on A string, compact shape.
    // Relative: [null,0,3,2,2,1]
    name: 'Aug compact',
    anchorString: 1,
    relativeFrets: [null, 0, 3, 2, 2, 1],
  },
]

const TEMPLATES: Record<ChordQuality, readonly VoicingTemplate[]> = {
  major:      MAJOR_TEMPLATES,
  minor:      MINOR_TEMPLATES,
  diminished: DIMINISHED_TEMPLATES,
  augmented:  AUGMENTED_TEMPLATES,
}

// ─── Transpose helper ─────────────────────────────────────────────────────────

function transposeTemplate(
  template: VoicingTemplate,
  rootChromatic: number,
): Voicing | null {
  const openChromatic = OPEN_STRING_MIDI[template.anchorString]! % 12
  const offset = (rootChromatic - openChromatic + 12) % 12

  // If the offset pushes frets above NUM_FRETS, try dropping an octave (offset - 12).
  // This handles cases where the lowest-fret voicing in range is the octave-down version.
  const candidateOffsets = [offset, offset - 12]

  for (const candidateOffset of candidateOffsets) {
    if (candidateOffset < 0) continue

    const frets: (number | null)[] = template.relativeFrets.map(f => {
      if (f === null) return null
      return f + candidateOffset
    })

    // Discard if any non-null fret is outside [0, NUM_FRETS]
    const allInRange = frets.every(f => f === null || (f >= 0 && f <= NUM_FRETS))
    if (!allInRange) continue

    return {
      name: template.name,
      frets,
    }
  }

  return null
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns up to 4 playable voicings for a chord of the given root and quality.
 * Voicings are ordered: open/low position first, compact/high position last.
 * Any template that transposes outside frets 0–12 is omitted.
 */
export function getVoicings(root: NoteName, quality: ChordQuality): Voicing[] {
  const rootChromatic = noteIndex(root)
  const templates = TEMPLATES[quality]
  const results: Voicing[] = []

  for (const template of templates) {
    const voicing = transposeTemplate(template, rootChromatic)
    if (voicing !== null) {
      results.push(voicing)
    }
  }

  return results
}
