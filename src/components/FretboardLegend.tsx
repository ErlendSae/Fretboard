import { LegendDot } from './ui'

interface FretboardLegendProps {
  /** When given, the root swatch reads "Root (C)" instead of just "Root". */
  rootNote?: string
  /**
   * Adds the ember swatch. Only worth showing on songs that borrow a chord from
   * outside the key — otherwise the neck never renders one.
   */
  showOutside?: boolean
}

/** Explains the marker colours below the neck. */
export default function FretboardLegend({ rootNote, showOutside }: FretboardLegendProps) {
  return (
    <div className="flex items-center gap-5 flex-wrap">
      <LegendDot
        color="bg-stone-100 ring-1 ring-stone-400/40"
        label={rootNote ? `Root (${rootNote})` : 'Root'}
      />
      <LegendDot color="bg-sun-400 ring-1 ring-sun-200/40" label="Chord tone" />
      <LegendDot color="bg-terra-300 ring-1 ring-terra-200/40" label="Scale tone" />
      {showOutside && (
        <LegendDot
          color="bg-ember-400 ring-1 ring-ember-300/60"
          label="Outside the key — this bar only"
        />
      )}
    </div>
  )
}
