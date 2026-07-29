import { SegmentedControl } from './ui'
import { BPM_MIN, BPM_MAX } from '../hooks/useBackingTrack'

/** Tempo presets, as multipliers of the scale's own practice tempo. */
const TEMPO_PRESETS = [
  { value: 'slow',   label: 'Slow',   factor: 0.8  },
  { value: 'normal', label: 'Normal', factor: 1    },
  { value: 'fast',   label: 'Fast',   factor: 1.25 },
] as const

interface BackingTrackPanelProps {
  isPlaying: boolean
  isLoading: boolean
  toggle: () => void
  /** The transport's current tempo. */
  bpm: number
  /** The scale's natural tempo; the three presets are computed from it. */
  baseBpm: number
  setBpm: (next: number) => void
}

/**
 * The backing-track card: play/stop plus a three-way tempo preset.
 * Rendered in the desktop sidebar (208px) and the mobile bottom sheet.
 */
export default function BackingTrackPanel({
  isPlaying, isLoading, toggle, bpm, baseBpm, setBpm,
}: BackingTrackPanelProps) {
  const bpmFor = (factor: number) =>
    Math.min(BPM_MAX, Math.max(BPM_MIN, Math.round(baseBpm * factor)))

  // Derived, never stored. The hook resets bpm when the scale changes, so a
  // stored preset would leave "Fast" lit while the track played at base tempo.
  // null when clamping has collapsed two presets onto the same value.
  const active = TEMPO_PRESETS.find(p => bpmFor(p.factor) === bpm)?.value ?? null

  return (
    <div className="shrink-0 border-t border-stone-200/10 pt-4">
      <div className={`p-3.5 rounded-xl transition-all duration-200 space-y-3
        ${isPlaying
          ? 'bg-sun-500/10 border border-sun-500/30'
          : 'bg-sun-500/5 border border-sun-500/15 hover:border-sun-500/25'
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] font-semibold text-stone-500 tracking-[0.08em] uppercase">
            Backing track
          </p>
          <button
            onClick={toggle}
            disabled={isLoading}
            title="Space"
            aria-label={isLoading ? 'Loading backing track' : isPlaying ? 'Stop backing track' : 'Play backing track'}
            aria-pressed={isPlaying}
            className={`w-10 h-10 rounded-full shrink-0 flex items-center justify-center
              transition-all duration-150 active:scale-95 disabled:opacity-50 disabled:cursor-wait
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terra-500 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-950
              ${isPlaying ? 'bg-terra-600 text-stone-200' : 'bg-terra-500 text-stone-200 hover:bg-terra-400'}`}
          >
            <span aria-hidden="true" className="text-[13px] leading-none">
              {isLoading ? '…' : isPlaying ? '◼' : '▶'}
            </span>
          </button>
        </div>

        <SegmentedControl
          options={TEMPO_PRESETS.map(p => ({ value: p.value, label: p.label }))}
          value={active}
          onChange={(next) => {
            const preset = TEMPO_PRESETS.find(p => p.value === next)!
            setBpm(bpmFor(preset.factor))
          }}
          ariaLabel="Tempo"
          fullWidth
          disabled={isLoading}
        />
      </div>
    </div>
  )
}
