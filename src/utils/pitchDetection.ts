import { midiToNote, type NoteName } from './notes'

/**
 * Normalized Square Difference Function (NSDF) pitch detection — McLeod Pitch Method.
 * Normalizing by the local signal energy makes the peak threshold amplitude-independent,
 * which is critical for quiet guitar signals where raw autocorrelation thresholds fail.
 *
 * Returns the fundamental frequency in Hz, or null if no clear pitch is found.
 */
export function detectPitch(buffer: Float32Array, sampleRate: number): number | null {
  const SIZE = buffer.length
  const half = Math.floor(SIZE / 2)

  // RMS check — ignore silence / very quiet signals
  let rms = 0
  for (let i = 0; i < SIZE; i++) rms += buffer[i] * buffer[i]
  rms = Math.sqrt(rms / SIZE)
  if (rms < 0.015) return null

  // Build prefix sums of squared samples for O(1) range queries.
  // prefixSq[i] = sum of buffer[j]^2 for j in [0, i)
  const prefixSq = new Float64Array(SIZE + 1)
  for (let i = 0; i < SIZE; i++) {
    prefixSq[i + 1] = prefixSq[i] + buffer[i] * buffer[i]
  }

  // Compute NSDF at each lag:
  //   corr[lag]  = Σ_{i=0}^{half-1} x[i] * x[i+lag]
  //   denom[lag] = Σ_{i=0}^{half-1} x[i]^2  +  Σ_{i=lag}^{lag+half-1} x[i]^2
  //   nsdf[lag]  = 2 * corr[lag] / denom[lag]   (∈ [-1, 1])
  const nsdf = new Float32Array(half)
  for (let lag = 0; lag < half; lag++) {
    let corr = 0
    for (let i = 0; i < half; i++) {
      corr += buffer[i] * buffer[i + lag]
    }
    const denom =
      (prefixSq[half] - prefixSq[0]) +
      (prefixSq[lag + half] - prefixSq[lag])
    nsdf[lag] = denom < 1e-10 ? 0 : (2 * corr) / denom
  }

  // Skip the zero-lag peak — slide past the first downslope
  let d = 0
  while (d < half - 1 && nsdf[d] >= nsdf[d + 1]) d++

  // Find the highest subsequent positive peak
  let bestLag = d
  for (let i = d; i < half; i++) {
    if (nsdf[i] > nsdf[bestLag]) bestLag = i
  }

  // Reject weak / ambiguous peaks (NSDF is normalized so threshold is fixed)
  if (nsdf[bestLag] < 0.82) return null

  // Parabolic interpolation for sub-sample accuracy
  let T0 = bestLag
  if (bestLag > 0 && bestLag < half - 1) {
    const prev = nsdf[bestLag - 1]
    const curr = nsdf[bestLag]
    const next = nsdf[bestLag + 1]
    const denom = 2 * (2 * curr - prev - next)
    if (denom !== 0) T0 = bestLag + (next - prev) / denom
  }

  if (T0 < 1) return null

  const freq = sampleRate / T0

  // Guitar range sanity check: roughly E1 (41 Hz) – C7 (2093 Hz)
  if (freq < 40 || freq > 2100) return null

  return freq
}

/** Convert Hz to the nearest MIDI note number */
export function freqToMidi(freq: number): number {
  return Math.round(69 + 12 * Math.log2(freq / 440))
}

/** Convert Hz to note name (pitch class, octave-agnostic) */
export function freqToNoteName(freq: number): NoteName {
  return midiToNote(freqToMidi(freq))
}

/** Semitone distance between two MIDI values (absolute, pitch-class-aware) */
export function midiSemitoneDist(a: number, b: number): number {
  const diff = Math.abs(a - b)
  const pitchClassDiff = Math.abs((a % 12) - (b % 12))
  return Math.min(diff, pitchClassDiff, 12 - pitchClassDiff)
}
