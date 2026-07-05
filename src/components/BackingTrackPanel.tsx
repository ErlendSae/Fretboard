import { useCallback, useEffect, useRef } from 'react'
import { Minus, Plus } from 'lucide-react'
import { BPM_MIN, BPM_MAX } from '../hooks/useBackingTrack'

const BPM_STEP = 5
const HOLD_DELAY_MS = 400
const HOLD_INTERVAL_MS = 120

interface BackingTrackPanelProps {
  /** Display line, e.g. "A Minor Pentatonic" or "C major". */
  label: string
  isPlaying: boolean
  isLoading: boolean
  toggle: () => void
  bpm: number
  setBpm: (next: number) => void
}

/**
 * The backing-track card: title, play/stop, tempo stepper, beat dots.
 * Rendered in the desktop sidebar (208px) and the mobile bottom sheet.
 */
export default function BackingTrackPanel({
  label, isPlaying, isLoading, toggle, bpm, setBpm,
}: BackingTrackPanelProps) {
  // Hold-to-repeat reads the latest bpm through a ref so the interval
  // closure never goes stale.
  const bpmRef = useRef(bpm)
  useEffect(() => { bpmRef.current = bpm }, [bpm])

  const holdTimer = useRef<number | null>(null)
  const holdInterval = useRef<number | null>(null)

  // Using a mutable ref to avoid listener cleanup issues
  const stopHoldRef = useRef<(() => void) | null>(null)

  const stopHold = useCallback(() => {
    if (holdTimer.current !== null) { window.clearTimeout(holdTimer.current); holdTimer.current = null }
    if (holdInterval.current !== null) { window.clearInterval(holdInterval.current); holdInterval.current = null }
    if (stopHoldRef.current) {
      window.removeEventListener('pointerup', stopHoldRef.current)
      window.removeEventListener('pointercancel', stopHoldRef.current)
    }
  }, [])

  useEffect(() => {
    stopHoldRef.current = stopHold
    return stopHold
  }, [stopHold])

  const startHold = (delta: number) => {
    stopHold()
    setBpm(bpmRef.current + delta)
    // A button that hits its clamp becomes disabled and stops firing pointer
    // events, so the release is caught at the window level instead.
    if (stopHoldRef.current) {
      window.addEventListener('pointerup', stopHoldRef.current)
      window.addEventListener('pointercancel', stopHoldRef.current)
    }
    holdTimer.current = window.setTimeout(() => {
      holdInterval.current = window.setInterval(
        () => setBpm(bpmRef.current + delta),
        HOLD_INTERVAL_MS,
      )
    }, HOLD_DELAY_MS)
  }

  const stepButtonClass = `w-8 h-8 rounded-full shrink-0 flex items-center justify-center
    bg-stone-800 border border-stone-700 text-stone-300
    transition-all duration-150 active:scale-95
    hover:border-stone-600 hover:text-stone-200
    disabled:opacity-40 disabled:pointer-events-none
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terra-500 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-950`

  return (
    <div className="shrink-0 border-t border-stone-200/10 pt-4 space-y-2">
      <div className={`p-3.5 rounded-xl transition-all duration-200 space-y-3
        ${isPlaying
          ? 'bg-sun-500/10 border border-sun-500/30'
          : 'bg-sun-500/5 border border-sun-500/15 hover:border-sun-500/25'
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-stone-500 tracking-[0.08em] uppercase">Backing track</p>
            <p className="font-mono text-[13px] text-stone-300 mt-0.5 truncate">{label}</p>
          </div>
          <button
            onClick={toggle}
            disabled={isLoading}
            aria-label={isLoading ? 'Loading backing track' : isPlaying ? 'Stop backing track' : 'Play backing track'}
            aria-pressed={isPlaying}
            className={`w-10 h-10 rounded-full shrink-0 flex items-center justify-center
              transition-all duration-150 active:scale-95 disabled:opacity-50 disabled:cursor-wait
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terra-500 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-950
              ${isPlaying ? 'bg-terra-600 text-stone-200' : 'bg-terra-500 text-stone-200 hover:bg-terra-400'}`}
          >
            <span aria-hidden="true" className="text-[13px] leading-none">{isLoading ? '…' : isPlaying ? '◼' : '▶'}</span>
          </button>
        </div>

        <div className="flex items-center justify-center gap-2">
          <button
            disabled={bpm <= BPM_MIN}
            aria-label="Slower"
            onPointerDown={() => startHold(-BPM_STEP)}
            onClick={(e) => { if (e.detail === 0) setBpm(bpm - BPM_STEP) }}
            className={stepButtonClass}
          >
            <Minus size={14} strokeWidth={1.5} aria-hidden="true" />
          </button>
          <span aria-live="polite" className="font-mono text-[13px] text-stone-300 tabular-nums w-16 text-center">
            {bpm} BPM
          </span>
          <button
            disabled={bpm >= BPM_MAX}
            aria-label="Faster"
            onPointerDown={() => startHold(BPM_STEP)}
            onClick={(e) => { if (e.detail === 0) setBpm(bpm + BPM_STEP) }}
            className={stepButtonClass}
          >
            <Plus size={14} strokeWidth={1.5} aria-hidden="true" />
          </button>
        </div>
      </div>

      {!isPlaying && (
        <p className="text-center text-xs text-stone-500">{isLoading ? 'Loading instruments…' : 'Space to play'}</p>
      )}

      <div
        aria-hidden="true"
        className={`flex justify-center items-center gap-2.5 h-3 transition-opacity duration-300 ${isPlaying ? 'opacity-100' : 'opacity-0'}`}
      >
        {[0, 1, 2, 3].map((i) => {
          const beatMs = Math.round(60000 / bpm)
          return (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-sun-400/70"
              style={{ animation: isPlaying ? `beatDot ${beatMs * 4}ms linear ${i * beatMs}ms infinite` : 'none' }}
            />
          )
        })}
      </div>
    </div>
  )
}
