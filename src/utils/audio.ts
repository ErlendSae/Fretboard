/**
 * Synthesizes a plucked guitar string sound using the Web Audio API.
 * Uses a Karplus–Strong-inspired approach: filtered noise burst → bandpass →
 * gain envelope with sharp attack and exponential decay.
 */

let audioCtx: AudioContext | null = null

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext()
  }
  if (audioCtx.state === 'suspended') {
    void audioCtx.resume()
  }
  return audioCtx
}

/**
 * Play a plucked note at the given MIDI pitch.
 * @param midi MIDI note number (e.g. 40 = E2)
 * @param duration decay duration in seconds (default 2.5)
 */
export function playNote(midi: number, duration = 2.5): void {
  const ctx = getCtx()
  const freq = 440 * Math.pow(2, (midi - 69) / 12)
  const now = ctx.currentTime

  // --- Oscillator blend (fundamental + slight overtone) ---
  const osc1 = ctx.createOscillator()
  osc1.type = 'sawtooth'
  osc1.frequency.value = freq

  const osc2 = ctx.createOscillator()
  osc2.type = 'square'
  osc2.frequency.value = freq * 2

  // Noise burst for the attack transient
  const bufferSize = Math.floor(ctx.sampleRate * 0.05)
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const data = noiseBuffer.getChannelData(0)
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.6
  }
  const noise = ctx.createBufferSource()
  noise.buffer = noiseBuffer

  // Low-pass filter to shape the noise into a body thump
  const noiseFilter = ctx.createBiquadFilter()
  noiseFilter.type = 'lowpass'
  noiseFilter.frequency.value = freq * 3
  noiseFilter.Q.value = 1

  // Main bandpass filter to reinforce the pitch
  const bandpass = ctx.createBiquadFilter()
  bandpass.type = 'bandpass'
  bandpass.frequency.value = freq
  bandpass.Q.value = 8

  // Master gain envelope
  const masterGain = ctx.createGain()
  masterGain.gain.setValueAtTime(0.001, now)
  masterGain.gain.exponentialRampToValueAtTime(0.7, now + 0.005) // sharp attack
  masterGain.gain.exponentialRampToValueAtTime(0.001, now + duration)

  // Noise gain (short transient only)
  const noiseGain = ctx.createGain()
  noiseGain.gain.setValueAtTime(1, now)
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08)

  // Osc2 (overtone) is quieter
  const osc2Gain = ctx.createGain()
  osc2Gain.gain.value = 0.15

  // Routing
  noise.connect(noiseFilter)
  noiseFilter.connect(noiseGain)
  noiseGain.connect(masterGain)

  osc1.connect(bandpass)
  osc2.connect(osc2Gain)
  osc2Gain.connect(bandpass)
  bandpass.connect(masterGain)

  masterGain.connect(ctx.destination)

  // Start / stop
  osc1.start(now)
  osc2.start(now)
  noise.start(now)

  osc1.stop(now + duration + 0.1)
  osc2.stop(now + duration + 0.1)
  // noise buffer source stops automatically after buffer ends
}
